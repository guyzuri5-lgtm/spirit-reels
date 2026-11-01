  const PAL = {
    navy: [30, 52, 66], teal: [47, 127, 131], orange: [224, 97, 43],
    mustard: [242, 180, 64], cream: [243, 231, 204], rose: [234, 165, 138],
  };
  const tint = (c, k) => H.mix(c, PAL.cream, k);

  // anisotropic value noise field (0..1): long cells along the brush direction, short across it
  function field(W, H_, cx, cy, seed) {
    const r = H.rng(seed);
    const gw = Math.ceil(W / cx) + 2, gh = Math.ceil(H_ / cy) + 2, g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = r();
    const out = new Float32Array(W * H_);
    for (let y = 0; y < H_; y++) {
      const fy = y / cy, iy = fy | 0, ty = fy - iy, sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < W; x++) {
        const fx = x / cx, ix = fx | 0, tx = fx - ix, sx = tx * tx * (3 - 2 * tx);
        const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
        out[y * W + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
      }
    }
    return out;
  }


  // =================================================================
  // EXPLAINER — "How does AI learn?" as a run of hand-painted posters. Scene changes are a fresh coat of
  // cream gouache swept across the board, then the next poster is painted over it, flat colour by flat colour.
  // =================================================================
  let GXC = null;
  function gpCache(W, H_) {
    if (GXC && GXC.W === W && GXC.H === H_) return GXC;
    GXC = { W, H: H_, hS: field(W, H_, 46, 2.2, 11), hS2: field(W, H_, 120, 6, 12), vS: field(W, H_, 2.4, 40, 13), grain: null, SP: {}, BG: {} };
    // static matte board grain (added to every frame)
    const g = new Float32Array(W * H_), pr = H.rng(4), nz = H.makeNoise(5);
    for (let i = 0; i < W * H_; i++) { const x = i % W, y = (i / W) | 0; g[i] = (pr() - 0.5) * 9 + (GXC.hS2[i] - 0.5) * 4 + nz.n2(x * 0.5, y * 0.5) * 3; }
    GXC.grain = g;
    // texture is split from edges: a mostly isotropic field raggeds the edges, broad brush bands (not 2px streaks)
    // carry the body tone, and a slow lumpy field gives the chalky bloom of dried matte gouache
    GXC.eF = field(W, H_, 7, 5, 14);
    GXC.bH = field(W, H_, 90, 9, 15); GXC.bV = field(W, H_, 9, 90, 16);
    const ch = field(W, H_, 26, 22, 17), cm = new Float32Array(W * H_);
    for (let i = 0; i < cm.length; i++) { const u = H.clamp((ch[i] - 0.6) / 0.25); cm[i] = 1 + 0.03 * u * u * (3 - 2 * u); }
    GXC.chalk = cm;
    GXC.S = H.layer(W, H_); GXC.B = H.layer(W, H_);
    GXC.S.getContext('2d', { willReadFrequently: true }); GXC.B.getContext('2d', { willReadFrequently: true }); // CPU-backed: cheap readback
    return GXC;
  }

  // paint(): one opaque colour, one pass of the brush. Mask -> blurred mask -> ragged coverage, then a matte body
  // with broad stroke bands, a slightly darker dried ridge just inside the edge and chalky bloom.
  // dir: 'h' / 'v' brushing, 'd' diagonal (sheared) brushing for slopes. key: cache a finished (p = 1) static pass.
  function makePainter(buf, W, H_, Cx, defEdge, defRag) {
    const { hS, hS2, vS, eF, bH, bV, chalk, SP } = Cx, sx = Cx.S.getContext('2d'), bx = Cx.B.getContext('2d');
    return function paint(col, bb, drawFn, { edge = defEdge, rag = defRag, dir = 'h', tex = 0.07, p = 1, key = null, rtl = false } = {}) {
      if (p <= 0) return;
      if (key && p >= 1 && SP[key]) {
        const { idx, cv, cov } = SP[key];
        for (let j = 0, n = idx.length; j < n; j++) { const o = idx[j] * 4, c = cov[j], q = j * 3; buf[o] += (cv[q] - buf[o]) * c; buf[o + 1] += (cv[q + 1] - buf[o + 1]) * c; buf[o + 2] += (cv[q + 2] - buf[o + 2]) * c; }
        return;
      }
      const rec = key && p >= 1 ? { idx: [], cv: [], cov: [] } : null;
      let [x0, y0, x1, y1] = bb;
      x0 = Math.max(0, Math.floor(x0 - edge * 2)); y0 = Math.max(0, Math.floor(y0 - edge * 2));
      x1 = Math.min(W, Math.ceil(x1 + edge * 2)); y1 = Math.min(H_, Math.ceil(y1 + edge * 2));
      const w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return;
      sx.clearRect(x0, y0, w, h); sx.save(); sx.fillStyle = '#fff'; sx.strokeStyle = '#fff'; drawFn(sx); sx.restore();
      bx.clearRect(x0, y0, w, h); bx.filter = `blur(${edge}px)`; bx.drawImage(Cx.S, x0, y0, w, h, x0, y0, w, h); bx.filter = 'none';
      const A = bx.getImageData(x0, y0, w, h).data, F = dir === 'v' ? vS : hS, BD = dir === 'v' ? bV : bH, diag = dir === 'd';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4, b = A[k + 3] / 255;
        if (b < 0.02) continue;
        const gi = (y + y0) * W + (x + x0);
        const si = diag ? ((y + y0 + (((x + x0) * 0.42) | 0)) % H_) * W + (x + x0) : gi; // sheared lookup = diagonal strokes
        const n = F[si];
        const thr = Math.min(0.88, 0.5 + ((eF[gi] - 0.5) * 0.65 + (n - 0.5) * 0.35) * rag * 0.7);
        let cov = (b - thr) / 0.08 + 0.5; cov = cov < 0 ? 0 : cov > 1 ? 1 : cov;
        if (cov <= 0) continue;
        if (p < 1) {
          // the brush is mid-sweep: left->right for horizontal brushing, bottom->top for vertical; ragged dry front
          const sw = dir === 'v' ? 1 - y / h : (rtl ? 1 - x / w : x / w), front = p * 1.15 - sw + (n - 0.5) * 0.1;
          if (front <= 0) continue;
          cov *= Math.min(1, front / 0.035);
        }
        let v = 1 + (hS2[gi] - 0.5) * tex * 0.65 + (BD[si] - 0.5) * tex * 0.5 + (n - 0.5) * tex * 0.25;
        const rim = b - thr; if (rim < 0.3) v *= 1 - 0.06 * (1 - rim / 0.3); // paint piles up a touch at the edge
        v *= chalk[gi];
        const o = gi * 4, r0 = col[0] * v, g0 = col[1] * v, b0 = col[2] * v;
        buf[o] += (r0 - buf[o]) * cov; buf[o + 1] += (g0 - buf[o + 1]) * cov; buf[o + 2] += (b0 - buf[o + 2]) * cov;
        if (rec) { rec.idx.push(gi); rec.cv.push(r0, g0, b0); rec.cov.push(cov); }
      }
      if (rec) SP[key] = { idx: Int32Array.from(rec.idx), cv: Float32Array.from(rec.cv), cov: Float32Array.from(rec.cov) };
    };
  }
