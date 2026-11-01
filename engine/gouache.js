// Gouache Travel Poster engine — data-driven. Reads window.SPEC (see WRITING.md), exposes
// window.explainer(ctx, W, H, t), window.scoreSound(k), window.DURATION, window.VALIDATE().
// Built on painter.js (reference gouache brush: PAL, field, gpCache, makePainter) + H (harness.js) + SOUND (sound.js).
(function () {
const SPEC = window.SPEC;
const W = 720, HH = 1280, SB = 940;
const { navy, teal, orange, mustard, cream, rose } = PAL;
const tint = (c, k) => H.mix(c, PAL.cream, k);
const SKIES = {
  teal: { sky: tint(teal, 0.5), band: tint(teal, 0.68), ridge: tint(teal, 0.38), ground: H.mix(teal, navy, 0.25) },
  mustard: { sky: tint(mustard, 0.5), band: tint(mustard, 0.72), ridge: tint(teal, 0.45), ground: H.mix(teal, mustard, 0.35) },
  rose: { sky: tint(rose, 0.4), band: tint(rose, 0.62), ridge: tint(teal, 0.5), ground: tint(teal, 0.2) },
  night: { sky: H.mix(navy, teal, 0.35), band: H.mix(navy, teal, 0.55), ridge: H.mix(navy, teal, 0.25), ground: H.mix(navy, teal, 0.15), stars: true },
  dusk: { sky: tint(rose, 0.25), band: tint(mustard, 0.6), ridge: H.mix(navy, teal, 0.45), ground: H.mix(navy, teal, 0.3) },
};
const SKY_ORDER = ['teal', 'mustard', 'rose', 'night', 'dusk'];
const SCENE_SKY = { meet: 'teal', contrast: 'mustard', vessels: 'rose', meter: 'night', field: 'dusk', choose: 'mustard', rise: 'mustard', symbol: 'teal', breath: 'dusk', path: 'mustard', moon: 'night' };
const ICONS = ['heart', 'eye', 'moon', 'sun', 'lotus', 'spiral', 'tree', 'hand', 'wave', 'star', 'infinity', 'drop', 'flame', 'mountain'];

// ---------------- timeline ----------------
const BEATS = []; const LINES = [];
{
  let tt = 1.6, prevSky = null;
  (SPEC.beats || []).forEach((b, bi) => {
    let sky = b.sky || SCENE_SKY[b.scene] || 'teal';
    if (!b.sky && sky === prevSky) sky = SKY_ORDER[(SKY_ORDER.indexOf(sky) + 1) % SKY_ORDER.length];
    prevSky = sky;
    const beat = { ...b, i: bi, sky, coat: null, t0: 0, lines: [] };
    if (bi > 0) { beat.coat = [tt, tt + 0.45]; tt += 0.72; beat.t0 = tt - 0.27; } else beat.t0 = 0;
    (b.lines || []).forEach((s, li) => {
      const n = s.trim().split(/\s+/).length, last = li === b.lines.length - 1;
      const d = 0.3 * n + 0.45 + (last ? 0.25 : 0);
      const L = { a: tt, b: tt + d, s: s.trim(), beat: bi, li };
      beat.lines.push(L); LINES.push(L); tt += d;
    });
    BEATS.push(beat);
  });
  window.DURATION = tt + 1.5;
}
const DURATION = window.DURATION;

// ---------------- text measuring (shared by draw + validation) ----------------
const MC = H.layer(4, 4).getContext('2d');
const measure = (s, size, w = 700) => { MC.font = `${w} ${size}px "Karantina"`; MC.direction = 'rtl'; return MC.measureText(s).width; };
function layoutLine(s) {
  let size = 118, lines = [s];
  if (measure(s, size) > 620) {
    size = 100;
    if (measure(s, size) > 620) {
      const ws = s.split(' '); let best = 1, bd = 1e9;
      for (let i = 1; i < ws.length; i++) { const d = Math.abs(measure(ws.slice(0, i).join(' '), 96) - measure(ws.slice(i).join(' '), 96)); if (d < bd) { bd = d; best = i; } }
      lines = ws.length > 1 ? [ws.slice(0, best).join(' '), ws.slice(best).join(' ')] : [s];
      size = Math.min(104, Math.floor(104 * 620 / Math.max(...lines.map((l) => measure(l, 104)))));
    }
  }
  return { size, lines };
}
window.VALIDATE = function () {
  const err = [];
  if (!SPEC.title) err.push('missing title');
  if (!Array.isArray(SPEC.beats) || !SPEC.beats.length) err.push('no beats');
  (SPEC.beats || []).forEach((b, i) => {
    if (!SCENE_SKY[b.scene]) err.push(`beat ${i}: unknown scene "${b.scene}"`);
    if (!b.lines || !b.lines.length) err.push(`beat ${i}: no lines`);
    if (b.lines && b.lines.length > 5) err.push(`beat ${i}: more than 5 lines`);
    if (b.scene === 'symbol' && !ICONS.includes(b.icon)) err.push(`beat ${i}: unknown icon "${b.icon}"`);
    (b.lines || []).forEach((s, j) => { const L = layoutLine(s.trim()); if (L.size < 64) err.push(`beat ${i} line ${j}: too long ("${s}")`); });
    (b.labels || []).concat(b.label ? [b.label] : [], b.signs || []).forEach((s) => { if (measure(s, 56) > 240) err.push(`beat ${i}: label too long ("${s}")`); });
  });
  if (SPEC.title && measure(SPEC.title, 70) > 600) err.push('title too long');
  if (DURATION < 12) err.push(`too short (${DURATION.toFixed(1)}s)`);
  if (DURATION > 50) err.push(`too long (${DURATION.toFixed(1)}s)`);
  return err;
};

// ---------------- drawing ----------------
function explainer(ctx, W_, H_, t) {
  const Cx = gpCache(W, HH), { grain } = Cx;
  const buf = new Uint8ClampedArray(W * HH * 4);
  for (let i = 0; i < buf.length; i += 4) { buf[i] = cream[0]; buf[i + 1] = cream[1]; buf[i + 2] = cream[2]; buf[i + 3] = 255; }
  const paint = makePainter(buf, W, HH, Cx, 2.5, 0.8);
  const G = (a, b) => H.ease.inOut(H.clamp((t - a) / (b - a)));
  const T = mkTools(paint, G, t);
  let bi = 0; for (let i = 0; i < BEATS.length; i++) if (t >= BEATS[i].t0) bi = i;
  const beat = BEATS[bi], t0 = beat.t0, sky = SKIES[beat.sky];
  // background snapshot per poster
  const bgP = [G(t0, t0 + 0.45), G(t0 + 0.1, t0 + 0.5), G(t0 + 0.15, t0 + 0.55), G(t0 + 0.2, t0 + 0.6), bi === 0 ? G(0.2, 0.7) : 1];
  const bgKey = 'bg' + bi, bgDone = bgP.every((v) => v >= 1);
  if (bgDone && Cx.BG[bgKey]) buf.set(Cx.BG[bgKey]);
  else {
    paint(sky.sky, [0, 0, W, SB], (c) => c.fillRect(0, 0, W, SB - 4), { edge: 4, p: bgP[0] });
    paint(sky.band, [0, 300, W, 800], (c) => c.fillRect(0, 330, W, 470), { edge: 4, rag: 1, p: bgP[1] });
    if (sky.stars) paint(cream, [0, 0, W, 700], (c) => { const r = H.rng(44 + bi); for (let i = 0; i < 46; i++) { c.beginPath(); c.arc(r.range(40, 680), r.range(40, 620), r.range(1.5, 4), 0, 7); c.fill(); } }, { edge: 0.6, rag: 0.3, p: bgP[2] });
    else paint(sky.ridge, [0, 560, W, 800], (c) => T.ridge(c, 650 + (bi % 3) * 20, 28, 0.4 + bi * 1.3, 800), { edge: 3, rag: 1, dir: 'd', p: bgP[2] });
    paint(sky.ground, [0, 720, W, SB], (c) => T.ground(c, 790, bi), { edge: 3, p: bgP[3] });
    paint(navy, [0, SB, W, HH], (c) => c.fillRect(0, SB + 12, W, HH - SB - 12), { p: bgP[4], key: bgP[4] >= 1 ? 'band' : null });
    if (bgDone) Cx.BG[bgKey] = buf.slice();
  }
  // the poster's own scene
  const S = { t, t0, beat, sky, n: beat.lines.length, A: (i) => beat.lines[Math.min(i, beat.lines.length - 1)].a, B: (i) => beat.lines[Math.min(i, beat.lines.length - 1)].b, END: beat.lines[beat.lines.length - 1].b, key: (k) => 'b' + bi + k };
  SCENES[beat.scene].draw(paint, G, T, S);
  // scene change: a fresh coat of cream swept across the board
  for (const b of BEATS) if (b.coat && t > b.coat[0] && t < b.coat[1] + 0.01) paint(cream, [0, 0, W, SB], (c) => c.fillRect(0, 0, W, SB - 6), { edge: 6, rag: 1.4, p: G(b.coat[0], b.coat[1]) });
  // lettering band
  let cj = LINES.findIndex((c) => t >= c.a && t < c.b); if (cj < 0 && t >= LINES[LINES.length - 1].b) cj = LINES.length - 1;
  if (cj >= 0) {
    const L = LINES[cj], { size, lines } = layoutLine(L.s), p = G(L.a, L.a + 0.45);
    paint(cream, [30, SB + 12, W - 30, HH - 26], (c) => { if (lines.length === 1) T.he(c, lines[0], W - 52, 1152, size); else { T.he(c, lines[0], W - 52, 1086, size); T.he(c, lines[1], W - 52, 1196, size); } }, { edge: 1.2, rag: 0.6, p, key: p >= 1 ? 'ln' + cj + '_' + size : null, rtl: true });
    if (cj === LINES.length - 1) { const uw = Math.min(620, Math.max(...lines.map((l) => measure(l, size)))); paint(orange, [30, 1160, W - 30, 1240], (c) => c.fillRect(W - 52 - uw, lines.length === 1 ? 1172 : 1214, uw, 7), { p: G(L.a + 0.5, L.a + 0.8), rtl: true }); }
  }
  // hook -> header tab
  {
    const title = SPEC.title, TS = Math.min(160, Math.floor(160 * 600 / measure(title, 160))), k = G(1.0, 1.6), tw = measure(title, TS);
    const sc = 1 - (1 - Math.min(46, TS) / TS) * k, x = H.lerp(360 + tw / 2, 680, k), y = H.lerp(560, 70, k);
    const tabW = Math.min(420, measure(title, 46) + 50);
    if (k > 0.3) paint(navy, [W - 40 - tabW, 20, 710, 110], (c) => c.fillRect(W - 22 - tabW, 22, tabW, 66), { p: G(1.3, 1.6), key: 'tab', rtl: true });
    paint(k > 0.6 ? cream : navy, [0, 0, W, 700], (c) => { c.translate(x, y); c.scale(sc, sc); T.he(c, title, 0, 0, TS, 'right', 700, 2); }, { edge: 1.2, rag: 0.6, p: G(0.2, 0.75), key: k >= 1 ? 'title' : null, rtl: true });
  }
  paint(cream, [0, 0, W, HH], (c) => { c.beginPath(); c.rect(0, 0, W, HH); c.moveTo(20, 20); c.lineTo(20, HH - 20); c.lineTo(W - 20, HH - 20); c.lineTo(W - 20, 20); c.closePath(); c.fill('evenodd'); c.fillRect(20, SB - 2, W - 40, 9); }, { edge: 2, rag: 0.9, key: 'border' });
  for (let i = 0, q = 0; i < W * HH; i++, q += 4) { const g = grain[i]; buf[q] += g; buf[q + 1] += g; buf[q + 2] += g * 0.92; }
  ctx.putImageData(new ImageData(buf, W, HH), 0, 0);
}

function mkTools(paint, G, t) {
  const T = {};
  T.poly = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
  T.he = (c, s, x, y, size, align = 'right', w = 700, sp = 1) => { c.font = `${w} ${size}px "Karantina"`; c.direction = 'rtl'; c.textAlign = align; c.textBaseline = 'alphabetic'; if (c.letterSpacing !== undefined) c.letterSpacing = sp + 'px'; c.fillText(s, x, y); };
  T.num = (c, s, x, y, size, align = 'center') => { c.font = `400 ${size}px "Bebas Neue"`; c.direction = 'ltr'; c.textAlign = align; c.textBaseline = 'alphabetic'; if (c.letterSpacing !== undefined) c.letterSpacing = '3px'; c.fillText(s, x, y); };
  T.fig = (c, x, y, s) => { c.beginPath(); c.arc(x, y - 44 * s, 7 * s, 0, 7); c.fill(); T.poly(c, [[x - 9 * s, y - 34 * s], [x + 9 * s, y - 34 * s], [x + 13 * s, y - 4 * s], [x - 13 * s, y - 4 * s]]); c.fillRect(x - 7 * s, y - 6 * s, 5 * s, 8 * s); c.fillRect(x + 2 * s, y - 6 * s, 5 * s, 8 * s); };
  T.seated = (c, x, y, s) => { c.beginPath(); c.arc(x, y - 52 * s, 8 * s, 0, 7); c.fill(); T.poly(c, [[x - 10 * s, y - 42 * s], [x + 10 * s, y - 42 * s], [x + 14 * s, y - 14 * s], [x - 14 * s, y - 14 * s]]); c.beginPath(); c.ellipse(x, y - 8 * s, 30 * s, 9 * s, 0, 0, 7); c.fill(); };
  T.burst = (c, cx, cy, r1, r2, n, k, sx = 1, sy = 1) => { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, r = (i % 2 ? r1 : r2) * (0.6 + 0.4 * k); c.lineTo(cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r * sy); } c.closePath(); c.fill(); };
  T.ribbon = (c, x0, x1, yc, amp, len, ph, th) => { c.beginPath(); for (let x = x0; x <= x1; x += 6) c.lineTo(x, yc + amp * Math.sin(x / len * 6.283 + ph) - th / 2); for (let x = x1; x >= x0; x -= 6) c.lineTo(x, yc + amp * Math.sin(x / len * 6.283 + ph) + th / 2); c.closePath(); c.fill(); };
  T.heart = (c, x, y, s) => { c.beginPath(); c.moveTo(x, y + 14 * s); c.bezierCurveTo(x - 34 * s, y - 8 * s, x - 22 * s, y - 40 * s, x, y - 22 * s); c.bezierCurveTo(x + 22 * s, y - 40 * s, x + 34 * s, y - 8 * s, x, y + 14 * s); c.fill(); };
  T.arrowV = (c, x, y0, y1, th) => { const d = Math.sign(y1 - y0), hd = th * 1.4; c.fillRect(x - th / 2, Math.min(y0, y1 - d * hd), th, Math.abs(y1 - d * hd - y0)); T.poly(c, [[x - th * 1.2, y1 - d * hd], [x + th * 1.2, y1 - d * hd], [x, y1]]); };
  T.arrowH = (c, x0, x1, y, th) => { const d = Math.sign(x1 - x0), hd = th * 1.4; c.fillRect(Math.min(x0, x1 - d * hd), y - th / 2, Math.abs(x1 - d * hd - x0), th); T.poly(c, [[x1 - d * hd, y - th * 1.2], [x1 - d * hd, y + th * 1.2], [x1, y]]); };
  T.cloud = (c, x, y, s) => { [[0, 0, 60], [-60, 18, 44], [62, 16, 46], [-25, -30, 42], [30, -26, 40]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); }); c.fillRect(x - 100 * s, y + 10 * s, 200 * s, 52 * s); };
  T.ridge = (c, y, amp, ph, bot) => { c.beginPath(); c.moveTo(0, bot); for (let x = 0; x <= W; x += 30) c.lineTo(x, y + Math.sin(x * 0.008 + ph) * amp + Math.sin(x * 0.021 + ph * 2) * amp * 0.35); c.lineTo(W, bot); c.closePath(); c.fill(); };
  T.ground = (c, y, v) => { c.beginPath(); c.moveTo(0, y - 20 + (v % 2) * 30); c.bezierCurveTo(200, y - 50 + (v % 3) * 15, 500, y + 10, 720, y - 25 + (v % 2) * 20); c.lineTo(720, SB); c.lineTo(0, SB); c.closePath(); c.fill(); };
  T.tag = (bg, fg, x1, y, text, p1, p2, key) => { const w = Math.min(320, measure(text, 56) + 40); paint(bg, [x1 - w - 10, y - 12, x1 + 10, y + 84], (c) => c.fillRect(x1 - w, y, w, 72), { p: p1, key: key && p1 >= 1 ? key + 'b' : null }); paint(fg, [x1 - w - 10, y - 12, x1 + 10, y + 84], (c) => T.he(c, text, x1 - 20, y + 57, 56), { edge: 0.8, rag: 0.3, p: p2, key: key && p2 >= 1 ? key + 't' : null, rtl: true }); };
  T.icon = (name, cx, cy, s, p, pulse = 1) => drawIcon(paint, T, name, cx, cy, s * pulse, p, t);
  return T;
}

// big flat poster symbols, painted colour by colour
function drawIcon(paint, T, name, cx, cy, s, p, t) {
  const bb = [cx - 230 * s, cy - 230 * s, cx + 230 * s, cy + 230 * s];
  const P = (k) => H.clamp((p - k * 0.18) / 0.5);
  const o = (col, fn, k, extra = {}) => paint(col, bb, fn, { edge: 1.4, rag: 0.5, p: P(k), ...extra });
  switch (name) {
    case 'heart': o(orange, (c) => T.heart(c, cx, cy + 60 * s, 6 * s), 0); o(tint(orange, 0.45), (c) => { c.beginPath(); c.ellipse(cx - 70 * s, cy - 40 * s, 30 * s, 18 * s, -0.6, 0, 7); c.fill(); }, 1); break;
    case 'eye': o(cream, (c) => { c.beginPath(); c.moveTo(cx - 200 * s, cy); c.quadraticCurveTo(cx, cy - 170 * s, cx + 200 * s, cy); c.quadraticCurveTo(cx, cy + 170 * s, cx - 200 * s, cy); c.fill(); }, 0); o(teal, (c) => { c.beginPath(); c.arc(cx, cy, 72 * s, 0, 7); c.fill(); }, 1); o(navy, (c) => { c.beginPath(); c.arc(cx, cy, 34 * s, 0, 7); c.fill(); }, 2); o(cream, (c) => { c.beginPath(); c.arc(cx + 20 * s, cy - 20 * s, 12 * s, 0, 7); c.fill(); }, 3); break;
    case 'moon': o(cream, (c) => { c.beginPath(); c.arc(cx, cy, 170 * s, 0, 7); c.arc(cx + 80 * s, cy - 40 * s, 150 * s, 0, 7, true); c.fill('evenodd'); }, 0); break;
    case 'sun': o(mustard, (c) => { for (let i = 0; i < 12; i++) { c.save(); c.translate(cx, cy); c.rotate(i * Math.PI / 6 + t * 0.15); c.fillRect(-12 * s, -220 * s, 24 * s, 60 * s); c.restore(); } }, 0); o(orange, (c) => { c.beginPath(); c.arc(cx, cy, 130 * s, 0, 7); c.fill(); }, 1); break;
    case 'lotus': o(rose, (c) => { for (const a of [-1.0, -0.5, 0, 0.5, 1.0]) { c.save(); c.translate(cx, cy + 80 * s); c.rotate(a); c.beginPath(); c.ellipse(0, -110 * s, 48 * s, 110 * s, 0, 0, 7); c.fill(); c.restore(); } }, 0); o(tint(rose, 0.4), (c) => { c.beginPath(); c.ellipse(cx, cy - 30 * s, 40 * s, 100 * s, 0, 0, 7); c.fill(); }, 1); o(teal, (c) => { c.beginPath(); c.ellipse(cx, cy + 110 * s, 200 * s, 30 * s, 0, 0, 7); c.fill(); }, 2); break;
    case 'spiral': o(mustard, (c) => { c.lineWidth = 26 * s; c.lineCap = 'round'; c.strokeStyle = '#fff'; c.beginPath(); for (let a = 0; a < 6 * Math.PI; a += 0.08) { const r = 8 * s + a * 11 * s; c.lineTo(cx + Math.cos(a + t * 0.6) * r, cy + Math.sin(a + t * 0.6) * r); } c.stroke(); }, 0); break;
    case 'tree': o(H.mix(orange, navy, 0.55), (c) => { c.fillRect(cx - 22 * s, cy - 20 * s, 44 * s, 220 * s); for (const k of [-1, 1]) { c.save(); c.translate(cx, cy + 190 * s); c.rotate(k * 0.9); c.fillRect(-8 * s, 0, 16 * s, 90 * s); c.restore(); } }, 0); o(teal, (c) => { [[0, -110, 130], [-100, -40, 90], [100, -40, 90], [-50, -190, 80], [60, -180, 85]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(cx + dx * s, cy + dy * s, r * s, 0, 7); c.fill(); }); }, 1); o(tint(teal, 0.35), (c) => { [[-40, -150, 40], [70, -90, 34], [-110, -60, 28]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(cx + dx * s, cy + dy * s, r * s, 0, 7); c.fill(); }); }, 2); break;
    case 'hand': o(tint(orange, 0.35), (c) => { c.beginPath(); c.roundRect(cx - 90 * s, cy - 30 * s, 180 * s, 210 * s, 60 * s); c.fill(); [[-70, -150, 150], [-24, -190, 190], [22, -185, 185], [68, -150, 150]].forEach(([dx, top, h]) => { c.beginPath(); c.roundRect(cx + dx * s - 20 * s, cy + (dx < 0 ? -h : -h) * s + 20 * s, 40 * s, h * s, 20 * s); c.fill(); }); c.save(); c.translate(cx - 90 * s, cy + 40 * s); c.rotate(-0.8); c.beginPath(); c.roundRect(-20 * s, -110 * s, 40 * s, 120 * s, 20 * s); c.fill(); c.restore(); }, 0); o(orange, (c) => { c.beginPath(); c.arc(cx, cy + 70 * s, 34 * s, 0, 7); c.fill(); }, 1); break;
    case 'wave': for (let i = 0; i < 3; i++) o([teal, tint(teal, 0.4), navy][i], (c) => T.ribbon(c, cx - 220 * s, cx + 220 * s, cy - 80 * s + i * 80 * s, 36 * s, 160 * s, t * 2 + i, 34 * s), i); break;
    case 'star': o(mustard, (c) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 80 * s : 200 * s; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); c.fill(); }, 0); break;
    case 'infinity': o(rose, (c) => { c.lineWidth = 34 * s; c.strokeStyle = '#fff'; c.lineCap = 'round'; c.beginPath(); for (let a = 0; a <= 6.3; a += 0.05) { const d = 1 + Math.sin(a) ** 2; c.lineTo(cx + 190 * s * Math.cos(a) / d, cy + 190 * s * Math.sin(a) * Math.cos(a) / d); } c.stroke(); }, 0); break;
    case 'drop': o(teal, (c) => { c.beginPath(); c.moveTo(cx, cy - 210 * s); c.bezierCurveTo(cx + 40 * s, cy - 120 * s, cx + 150 * s, cy, cx + 150 * s, cy + 70 * s); c.arc(cx, cy + 70 * s, 150 * s, 0, Math.PI); c.bezierCurveTo(cx - 150 * s, cy, cx - 40 * s, cy - 120 * s, cx, cy - 210 * s); c.fill(); }, 0); o(tint(teal, 0.5), (c) => { c.beginPath(); c.ellipse(cx - 60 * s, cy + 40 * s, 22 * s, 50 * s, 0.3, 0, 7); c.fill(); }, 1); break;
    case 'flame': o(orange, (c) => { const f = Math.sin(t * 8) * 10 * s; c.beginPath(); c.moveTo(cx + f, cy - 220 * s); c.bezierCurveTo(cx + 160 * s, cy - 40 * s, cx + 150 * s, cy + 170 * s, cx, cy + 180 * s); c.bezierCurveTo(cx - 150 * s, cy + 170 * s, cx - 160 * s, cy - 40 * s, cx + f, cy - 220 * s); c.fill(); }, 0); o(mustard, (c) => { const f = Math.sin(t * 9 + 1) * 8 * s; c.beginPath(); c.moveTo(cx + f, cy - 80 * s); c.bezierCurveTo(cx + 80 * s, cy + 30 * s, cx + 70 * s, cy + 160 * s, cx, cy + 165 * s); c.bezierCurveTo(cx - 70 * s, cy + 160 * s, cx - 80 * s, cy + 30 * s, cx + f, cy - 80 * s); c.fill(); }, 1); break;
    case 'mountain': o(teal, (c) => T.poly(c, [[cx - 230 * s, cy + 160 * s], [cx - 20 * s, cy - 190 * s], [cx + 230 * s, cy + 160 * s]]), 0); o(H.mix(teal, navy, 0.4), (c) => T.poly(c, [[cx - 20 * s, cy - 190 * s], [cx + 230 * s, cy + 160 * s], [cx + 40 * s, cy + 160 * s]]), 1); o(cream, (c) => T.poly(c, [[cx - 20 * s, cy - 190 * s], [cx + 50 * s, cy - 75 * s], [cx + 10 * s, cy - 95 * s], [cx - 20 * s, cy - 60 * s], [cx - 50 * s, cy - 100 * s], [cx - 80 * s, cy - 90 * s]]), 2); break;
  }
}

// ---------------- scenes ----------------
const SCENES = {};
SCENES.meet = { draw(paint, G, T, S) {
  const { t, A, B, n, beat } = S, lb = beat.labels || ['אתם', 'מישהו'];
  const sunY = 560 - 40 * H.ease.inOut(H.clamp((t - S.t0) / 3.4));
  paint(mustard, [380, sunY - 120, 640, sunY + 120], (c) => { c.beginPath(); c.arc(520, sunY, 95, 0, 7); c.fill(); }, { edge: 2.5, p: G(S.t0 + 0.4, S.t0 + 0.7) });
  paint(S.sky.ground, [0, 720, W, SB], (c) => T.ground(c, 790, beat.i), { edge: 3, key: S.key('gr') });
  const walk = H.ease.inOut(H.clamp((t - A(0)) / 1.6)), bob = (ph) => Math.abs(Math.sin(t * 7 + ph)) * 5 * (walk > 0 && walk < 1 ? 1 : 0);
  const yx = 170 + 90 * walk, ox = 550 - 90 * walk;
  paint(orange, [yx - 70, 600, yx + 70, 860], (c) => T.fig(c, yx, 840 - bob(0), 4.2), { edge: 1, rag: 0.4, dir: 'v', p: G(A(0) - 0.4, A(0) - 0.1) });
  paint(cream, [ox - 70, 600, ox + 70, 860], (c) => T.fig(c, ox, 842 - bob(1.5), 4.0), { edge: 1, rag: 0.4, dir: 'v', p: G(A(0) - 0.3, A(0)) });
  paint(navy, [0, 560, W, 640], (c) => { T.he(c, lb[0], yx + 34, 600, 48); T.he(c, lb[1], ox + 50, 600, 48); }, { edge: 0.8, rag: 0.3, p: G(A(0) + 0.1, A(0) + 0.4) });
  const ml = n - 1, m = G(A(ml) + 0.2, A(ml) + 1.1);
  const w1 = { amp: H.lerp(30, 34, m), len: H.lerp(42, 90, m), y: H.lerp(330, 420, m) }, w2 = { amp: H.lerp(48, 34, m), len: H.lerp(170, 90, m), y: H.lerp(470, 420, m) };
  paint(mustard, [0, 260, W, 540], (c) => T.ribbon(c, 30, 690, w1.y, w1.amp, w1.len, t * 5, 14), { edge: 1.2, rag: 0.5, p: G(A(0) + 0.2, A(0) + 0.7) });
  paint(rose, [0, 260, W, 560], (c) => T.ribbon(c, 30, 690, w2.y, w2.amp, w2.len, t * 5 + (1 - m) * 1.3, 14), { edge: 1.2, rag: 0.5, p: G(A(0) + 0.4, A(0) + 0.9) });
  if (t > A(ml) + 1.1) paint(navy, [200, 160, 520, 260], (c) => { c.fillRect(300, 190, 120, 16); c.fillRect(300, 222, 120, 16); }, { edge: 1, rag: 0.4, p: G(A(ml) + 1.1, A(ml) + 1.3), key: S.key('eq') });
}, sound(k, S, F) { const { A, n } = S; F.flat(A(0) - 0.4, A(0) - 0.1, 0.8, -0.4, -0.2); F.flat(A(0) + 0.2, A(0) + 0.9, 0.7, -0.7, 0.7); k.play('ding', A(n - 1) + 1.1, { f: 'G5', gain: 0.35 }); } };

SCENES.contrast = { draw(paint, G, T, S) {
  const { t, A, B, n, beat } = S, sw = beat.switchAt != null ? beat.switchAt : Math.max(1, Math.floor(n / 2)), lb = beat.labels || ['', ''];
  const sunY = 300 - 50 * H.ease.inOut(H.clamp((t - S.t0) / 3));
  paint(orange, [220, sunY - 130, 500, sunY + 130], (c) => { c.beginPath(); c.arc(360, sunY, 110, 0, 7); c.fill(); }, { edge: 2.5, p: G(S.t0 + 0.3, S.t0 + 0.6) });
  paint(S.sky.band, [220, sunY - 20, 500, sunY + 130], (c) => { for (let q = 0; q < 4; q++) c.fillRect(250, sunY + 6 + q * 18, 220, 3 + q * 2.4); }, { edge: 1.2, rag: 0.5, p: G(S.t0 + 0.55, S.t0 + 0.7) });
  paint(H.mix(teal, mustard, 0.35), [0, 400, W, 480], (c) => { c.beginPath(); c.moveTo(0, 452); c.bezierCurveTo(240, 430, 480, 460, 720, 440); c.lineTo(720, 476); c.lineTo(0, 476); c.fill(); }, { edge: 3, key: S.key('hill') });
  paint(cream, [0, 60, W, 170], (c) => T.ribbon(c, 30, 690, 120, 26, 38, t * 9, 12), { edge: 1, rag: 0.5, p: G(A(0), A(0) + 0.4) });
  paint(orange, [120, 250, 260, 470], (c) => T.fig(c, 190, 462 + Math.sin(t * 6) * 2, 4.4), { edge: 1, rag: 0.4, dir: 'v', p: G(A(0) + 0.1, A(0) + 0.4) });
  if (lb[0]) T.tag(navy, cream, 690, 205, lb[0], G(A(0) + 0.3, A(0) + 0.6), G(A(0) + 0.5, A(0) + 0.8), S.key('tH'));
  if (sw > 1 && t > A(1) && t < A(sw) + 0.6) paint(rose, [60, 0, 360, 460], (c) => { for (let i = 0; i < 7; i++) { const ph = ((t - A(1)) * 0.55 + i / 7) % 1, x = 190 + Math.sin(i * 2.3 + ph * 5) * 80 + (i % 2 ? 40 : -40); T.heart(c, x, 380 - ph * 330, 1.0 + (i % 3) * 0.25); } }, { edge: 1, rag: 0.4, p: G(A(1), A(1) + 0.3) });
  const lp = G(A(sw) - 0.1, A(sw) + 0.4);
  paint(H.mix(navy, teal, 0.2), [0, 476, W, SB], (c) => c.fillRect(0, 480, W, SB - 484), { dir: 'v', edge: 3, p: lp, key: lp >= 1 ? S.key('low') : null });
  if (t > A(sw)) {
    const fl = n - 1 > sw ? A(n - 1) : A(sw) + 0.8, flash = [fl + 0.35, fl + 0.95].some((x) => t > x && t < x + 0.14);
    if (flash) paint(tint(mustard, 0.3), [0, 476, W, SB], (c) => c.fillRect(0, 480, W, SB - 484), { edge: 3, rag: 0.4 });
    const cx = 400 + Math.sin(t * 1.2) * 18;
    paint(cream, [0, 520, W, 860], (c) => { c.lineWidth = 5; for (let i = 0; i < 9; i++) { const ph = (t * 1.6 + i * 0.37) % 1, x = cx - 120 + i * 30 - ph * 20, y = 640 + ph * 200; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y + 34); c.stroke(); } }, { edge: 0.8, rag: 0.4, p: G(A(sw) + 0.4, A(sw) + 0.6) });
    paint(H.mix(navy, cream, 0.35), [200, 500, 620, 700], (c) => T.cloud(c, cx, 590, 1.25), { edge: 2, rag: 0.6, p: G(A(sw) + 0.2, A(sw) + 0.5) });
    if (flash) paint(mustard, [300, 620, 520, 860], (c) => T.poly(c, [[cx + 20, 640], [cx - 40, 760], [cx, 760], [cx - 30, 860], [cx + 60, 730], [cx + 16, 730], [cx + 50, 640]]), { edge: 1, rag: 0.3 });
    paint(rose, [0, 820, W, 920], (c) => T.ribbon(c, 30, 690, 880, 18, 260, t * 1.4, 12), { edge: 1, rag: 0.5, p: G(A(sw) + 0.3, A(sw) + 0.7) });
    paint(rose, [100, 640, 260, 940], (c) => T.fig(c, 180, 930, 4.4), { edge: 1, rag: 0.4, dir: 'v', p: G(A(sw) + 0.5, A(sw) + 0.8) });
    if (lb[1]) T.tag(cream, navy, 690, 772, lb[1], G(A(sw) + 0.6, A(sw) + 0.9), G(A(sw) + 0.8, A(sw) + 1.1), S.key('tL'));
  }
}, sound(k, S, F) { const { A, n, beat } = S, sw = beat.switchAt != null ? beat.switchAt : Math.max(1, Math.floor(n / 2)); F.flat(A(0) + 0.3, A(0) + 0.6, 0.8, 0.2, 0.7); if (sw > 1) k.play('sparkle', A(1) + 0.05, { gain: 0.6, pan: -0.4 }); F.flat(A(sw) - 0.1, A(sw) + 0.4, 1.0, 0, 0, false); k.bed('rain', A(sw) + 0.4, S.END, { gain: 0.6 }); const fl = n - 1 > sw ? A(n - 1) : A(sw) + 0.8; [fl + 0.35, fl + 0.95].forEach((x) => { k.play('thud', x, { f: 70, gain: 0.6 }); k.noise(x, { dur: 0.9, color: 'brown', filter: 'lowpass', f: [[0, 900], [0.8, 120]], gain: 0.35, a: 0.01, verb: 0.3 }); }); } };

SCENES.vessels = { draw(paint, G, T, S) {
  const { t, A, B, n, beat, t0 } = S, q = beat.question !== false && n >= 3, lb = beat.labels || ['אתם', 'הוא'];
  const oi = q ? 1 : 0, open = G(A(oi) + 0.1, A(oi) + 0.5);
  const k = H.ease.inOut(H.clamp((t - A(oi) - 0.5) / (S.END - A(oi) - 0.6)));
  const L = H.lerp(beat.from ? beat.from[0] : 0.84, beat.to ? beat.to[0] : 0.52, k), R = H.lerp(beat.from ? beat.from[1] : 0.18, beat.to ? beat.to[1] : 0.52, k);
  const jar = [[90, 310], [430, 650]], top = 330, bot = 760, jh = bot - top;
  paint(navy, [60, 300, 680, 800], (c) => { jar.forEach(([x0, x1]) => c.fillRect(x0 - 10, top - 10, x1 - x0 + 20, jh + 20)); c.fillRect(300, 700, 140, 52); }, { dir: 'v', p: G(t0 + 0.2, t0 + 0.55), key: S.key('jO') });
  paint(cream, [60, 300, 680, 800], (c) => { jar.forEach(([x0, x1]) => c.fillRect(x0, top, x1 - x0, jh)); c.fillRect(300, 712, 140, 28); }, { dir: 'v', p: G(t0 + 0.35, t0 + 0.7), key: S.key('jI') });
  const surf = (c, x0, x1, lv, ph) => { const y = bot - lv * jh; c.beginPath(); c.moveTo(x0, bot); for (let x = x0; x <= x1; x += 8) c.lineTo(x, y + Math.sin(x * 0.05 + ph) * 5 * (0.3 + open)); c.lineTo(x1, bot); c.closePath(); c.fill(); };
  paint(H.mix(mustard, orange, 0.25 * k), [80, 300, 320, 770], (c) => surf(c, jar[0][0], jar[0][1], L, t * 4), { dir: 'v', edge: 1.5, rag: 0.5, p: G(t0 + 0.6, t0 + 0.95) });
  paint(H.mix(rose, mustard, 0.45 * k), [420, 300, 660, 770], (c) => surf(c, jar[1][0], jar[1][1], R, t * 4 + 2), { dir: 'v', edge: 1.5, rag: 0.5, p: G(t0 + 0.7, t0 + 1.05) });
  if (open > 0) paint(mustard, [300, 712, 440, 742], (c) => { const off = (t * 80) % 40; for (let x = 260 + off; x < 440; x += 40) c.fillRect(Math.max(300, x), 718, Math.min(18, 440 - x), 16); }, { edge: 0.8, rag: 0.3, p: open * (1 - G(S.END, S.END + 0.3)) });
  paint(orange, [300, 600, 440, 720], (c) => { c.save(); c.translate(370, 668); c.rotate(open * Math.PI / 2); c.fillRect(-60, -12, 120, 24); c.restore(); c.fillRect(362, 668, 16, 40); }, { edge: 1, rag: 0.4, p: G(t0 + 0.8, t0 + 1.0) });
  paint(navy, [60, 230, 680, 320], (c) => { T.he(c, lb[0], 200, 296, 64, 'center'); T.he(c, lb[1], 540, 296, 64, 'center'); }, { edge: 0.8, rag: 0.3, p: G(t0 + 0.9, t0 + 1.2), key: S.key('vl') });
  if (q && t >= A(0) && t < A(1)) { const kk = G(A(0), A(0) + 0.15); paint(orange, [180, 40, 540, 260], (c) => T.burst(c, 360, 150, 80, 118, 14, kk), { edge: 1.5, rag: 0.5, p: kk, key: kk >= 1 ? S.key('bq') : null }); paint(navy, [260, 60, 460, 250], (c) => T.he(c, '?', 360, 210, 170, 'center'), { edge: 1, rag: 0.4, p: G(A(0) + 0.05, A(0) + 0.2), key: S.key('q') }); }
  const ad = oi + 1, au = oi + 2;
  if (ad < n && t > A(ad)) paint(orange, [10, 300, 90, 800], (c) => T.arrowV(c, 50, 360, 560 + Math.sin(t * 6) * 6, 26), { dir: 'v', edge: 1, rag: 0.4, p: G(A(ad), A(ad) + 0.3) });
  if (au < n && t > A(au)) paint(teal, [650, 300, 715, 800], (c) => T.arrowV(c, 682, 720, 480 - Math.sin(t * 6) * 6, 22), { dir: 'v', edge: 1, rag: 0.4, p: G(A(au), A(au) + 0.3) });
}, sound(k, S, F) { const { A, n, beat } = S, q = beat.question !== false && n >= 3, oi = q ? 1 : 0; F.flat(S.t0 + 0.2, S.t0 + 0.7, 0.9, -0.5, 0.5); if (q) { k.play('slap', A(0), { gain: 0.6 }); k.play('thud', A(0), { f: 120, gain: 0.45 }); k.tone(A(0) + 0.02, { f: 'E4', type: 'triangle', dur: 0.3, gain: 0.15, a: 0.01, hold: 0.1 }); k.tone(A(0) + 0.18, { f: 'B4', type: 'triangle', dur: 0.4, gain: 0.13, a: 0.01, hold: 0.1 }); } for (let s = 0; s < 3; s++) k.play('tock', A(oi) + 0.1 + s * 0.13, { f: 480 + s * 40, gain: 0.45, minor: true }); k.noise(A(oi) + 0.5, { dur: Math.max(0.5, S.END - A(oi) - 0.5), color: 'pink', filter: 'bandpass', f: 500, q: 1.5, gain: 0.08, a: 0.3, minor: true }); if (oi + 1 < n) k.tone(A(oi + 1) + 0.05, { f: [[0, 600], [0.35, 300]], type: 'triangle', dur: 0.4, gain: 0.12, pan: -0.7 }); if (oi + 2 < n) k.tone(A(oi + 2) + 0.05, { f: [[0, 300], [0.35, 600]], type: 'triangle', dur: 0.4, gain: 0.12, pan: 0.7 }); k.play('ding', S.END - 0.15, { f: 'C6', gain: 0.35 }); } };

SCENES.meter = { draw(paint, G, T, S) {
  const { t, A, B, n, beat, t0 } = S, from = beat.from != null ? beat.from : 100, to = beat.to != null ? beat.to : 18, suf = beat.suffix != null ? beat.suffix : '%';
  const s0 = n > 1 ? A(1) : A(0), dr = H.ease.inOut(H.clamp((t - s0 - 0.2) / (S.END - s0 - 0.5)));
  const v = Math.round(H.lerp(from, to, dr)), lo = Math.min(from, to), hi = Math.max(from, to), frac = hi === lo ? 1 : (v - lo) / (hi - lo), up = to > from;
  paint(cream, [40, 110, 360, 290], (c) => { c.fillRect(50, 130, 270, 140); c.fillRect(320, 172, 24, 56); }, { p: G(t0 + 0.3, t0 + 0.6), key: S.key('bat') });
  paint(navy, [40, 110, 360, 290], (c) => c.fillRect(64, 144, 242, 112), { edge: 1, p: G(t0 + 0.4, t0 + 0.7), key: S.key('batI') });
  const fr = up ? frac : frac, bc = fr > 0.6 ? teal : fr > 0.35 ? mustard : orange;
  if (beat.label) T.tag(navy, cream, 344, 40, beat.label, G(t0 + 0.6, t0 + 0.9), G(t0 + 0.8, t0 + 1.1), S.key('lab'));
  paint(bc, [60, 140, 310, 260], (c) => c.fillRect(74, 154, Math.max(8, 222 * (0.1 + 0.9 * fr)), 92), { edge: 1, rag: 0.4, p: G(t0 + 0.5, t0 + 0.8) });
  const hit = t > S.END - 0.4 && dr >= 0.99;
  if (hit) { const kk = G(S.END - 0.35, S.END - 0.2); paint(orange, [380, 60, 715, 320], (c) => T.burst(c, 560, 190, 100, 140, 14, kk, 1.1, 0.85), { edge: 1.5, rag: 0.5, p: kk, key: kk >= 1 ? S.key('b') : null }); }
  paint(hit ? navy : cream, [380, 100, 715, 300], (c) => T.num(c, v + suf, 560, 250, 150), { edge: 1, rag: 0.4, p: G(t0 + 0.5, t0 + 0.8), key: v === from || v === to ? S.key('n' + v + hit) : null });
  const gl = up ? 0.15 + dr * 0.85 : 1 - dr * 0.85, glow = H.mix(mustard, S.sky.sky, 1 - gl);
  paint(glow, [80, 500, 320, 860], (c) => { c.beginPath(); c.arc(190, 690, 70 + 50 * gl + Math.sin(t * 4) * 4, 0, 7); c.fill(); }, { edge: 2, rag: 0.6, p: G(A(0), A(0) + 0.3) });
  paint(cream, [120, 560, 260, 840], (c) => T.fig(c, 190, 826, 5.2), { edge: 1, rag: 0.4, dir: 'v', p: G(A(0) + 0.1, A(0) + 0.4) });
  paint(rose, [460, 540, 640, 840], (c) => T.fig(c, 550, 826, 5.6), { edge: 1, rag: 0.4, dir: 'v', p: G(A(0) + 0.2, A(0) + 0.5) });
  if (n > 1 && t > A(1)) {
    const [x0, x1] = up ? [480, 260] : [260, 480];
    paint(cream, [240, 420, 500, 520], (c) => T.arrowH(c, x0, x1, 470, 26), { edge: 1, rag: 0.4, p: G(A(1), A(1) + 0.35), key: S.key('arr') });
    paint(mustard, [200, 380, 560, 720], (c) => { for (let i = 0; i < 12; i++) { const ph = (t * 0.7 + i / 12) % 1, u = up ? 1 - ph : ph, x = H.lerp(220, 520, u), y = H.lerp(640, 620, u) - Math.sin(Math.PI * ph) * 110 + Math.sin(i * 3 + t * 5) * 8; c.beginPath(); c.arc(x, y, 9 * Math.sin(Math.PI * ph) + 2, 0, 7); c.fill(); } }, { edge: 0.8, rag: 0.3, p: G(A(1) + 0.2, A(1) + 0.5) });
  }
  if (n > 2 && t > A(n - 1)) { const kk = G(A(n - 1), A(n - 1) + 0.3); paint(cream, [280, 280, 440, 420], (c) => { c.beginPath(); c.arc(360, 350, 62, 0, 7); c.fill(); }, { edge: 1.2, p: kk, key: kk >= 1 ? S.key('clk') : null }); paint(navy, [280, 280, 440, 420], (c) => { const a = (t - A(n - 1)) * 9; c.save(); c.translate(360, 350); c.rotate(a); c.fillRect(-4, -50, 8, 52); c.restore(); c.save(); c.translate(360, 350); c.rotate(a / 12); c.fillRect(-5, -32, 10, 34); c.restore(); }, { edge: 0.8, rag: 0.3, p: G(A(n - 1) + 0.1, A(n - 1) + 0.3) }); }
}, sound(k, S, F, dab) { const { A, n, beat } = S, from = beat.from != null ? beat.from : 100, to = beat.to != null ? beat.to : 18, s0 = n > 1 ? A(1) : A(0); const val = (t) => Math.round(H.lerp(from, to, H.ease.inOut(H.clamp((t - s0 - 0.2) / (S.END - s0 - 0.5))))); let last = from, lt = -1; for (let t = s0 + 0.2; t < S.END - 0.32; t += 1 / 240) { const v = val(t); if (v !== last && t - lt >= 0.1) { dab(t, 1, 0.4); lt = t; } last = v; } if (n > 1) F.flat(A(1), A(1) + 0.35, 1.0, -0.3, 0.3, false); if (n > 2) for (let i = 0; i < Math.floor((S.END - A(n - 1)) / 0.25); i++) k.play('tick', A(n - 1) + 0.1 + i * 0.25, { f: 3600, gain: 0.5 }); k.play('impact', S.END - 0.35, { gain: 0.9, pan: 0.4 }); k.play('slap', S.END - 0.35, { gain: 0.9, pan: 0.4 }); k.tone(S.END - 0.3, { f: to > from ? 'E4' : 'A3', type: 'triangle', dur: 0.9, gain: 0.12, verb: 0.3 }); } };

SCENES.field = { draw(paint, G, T, S) {
  const { t, A, n, beat } = S, ri = n >= 3 ? 1 : 0, ii = Math.min(ri + 1, n - 1), oi = beat.otherAt != null ? beat.otherAt : (n >= 4 ? n - 2 : -1);
  const mv = oi >= 0 ? H.ease.inOut(H.clamp((t - A(oi)) / 0.7)) : 0, yx = H.lerp(360, 250, mv), ox = H.lerp(860, 530, mv), cy = 620;
  const rings = (c, x, cnt, ph, r0) => { for (let i = 0; i < cnt; i++) { const r = r0 + ((i * 60 + ph * 60) % (cnt * 60)); c.beginPath(); c.arc(x, cy, r + 9, 0, 7); c.arc(x, cy, r, 0, 7, true); c.fill(); } };
  if (t > A(ri)) paint(mustard, [0, 260, W, 940], (c) => rings(c, yx, 4, (t * 0.6) % 1, 90), { edge: 1.2, rag: 0.5, p: G(A(ri), A(ri) + 0.5) });
  if (mv > 0) paint(rose, [0, 260, W, 940], (c) => rings(c, ox, 4, (t * 0.6 + 0.5) % 1, 90), { edge: 1.2, rag: 0.5, p: mv });
  paint(S.sky.ground, [0, 720, W, SB], (c) => T.ground(c, 820, beat.i), { edge: 3, key: S.key('gr') });
  paint(cream, [yx - 80, 520, yx + 80, 880], (c) => T.fig(c, yx, 860, 5.4), { edge: 1, rag: 0.4, dir: 'v', p: G(A(0) + 0.1, A(0) + 0.4) });
  if (mv > 0) paint(navy, [ox - 80, 520, ox + 80, 880], (c) => T.fig(c, ox, 860, 5.4), { edge: 1, rag: 0.4, dir: 'v', p: mv });
  if (n > 1 && t > A(ii)) {
    const sh = 1 - 0.25 * mv, P = (i) => { const a = t * 0.7 + i * Math.PI / 2.5; return [yx + Math.cos(a) * 230 * sh, cy + Math.sin(a) * 250 * sh]; }, ap = (i) => G(A(ii) + i * 0.12, A(ii) + i * 0.12 + 0.25);
    paint(cream, [0, 260, W, 940], (c) => { const [x, y] = P(0); T.cloud(c, x, y, 0.42); }, { edge: 1, rag: 0.4, p: ap(0) });
    paint(orange, [0, 260, W, 940], (c) => { const [x, y] = P(1); T.heart(c, x, y, 1.5); }, { edge: 1, rag: 0.4, p: ap(1) });
    paint(navy, [0, 260, W, 940], (c) => { const [x, y] = P(2); T.poly(c, [[x + 6, y - 48], [x - 24, y + 4], [x - 2, y + 4], [x - 16, y + 50], [x + 26, y - 10], [x + 4, y - 10], [x + 20, y - 48]]); }, { edge: 1, rag: 0.4, p: ap(2) });
    paint(teal, [0, 260, W, 940], (c) => { const [x, y] = P(3); c.beginPath(); c.arc(x, y, 30, 0, 7); c.fill(); }, { edge: 1, rag: 0.4, p: ap(3) });
    paint(cream, [0, 260, W, 940], (c) => { const [x, y] = P(3); T.he(c, '?', x, y + 18, 54, 'center'); const [x2, y2] = P(4); c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, r = i % 2 ? 12 : 28; c.lineTo(x2 + Math.cos(a) * r, y2 + Math.sin(a) * r); } c.closePath(); c.fill(); }, { edge: 1, rag: 0.4, p: ap(4) });
  }
  if (mv > 0.3) paint(rose, [0, 520, W, 760], (c) => { for (let i = 0; i < 9; i++) { const ph = (t * 0.6 + i / 9) % 1, x = H.lerp(ox - 90, yx + 30, ph), y = 640 + Math.sin(ph * 9 + i) * 40 - 60 + (i % 3) * 30; c.beginPath(); c.arc(x, y, 8 * Math.sin(Math.PI * ph) + 2, 0, 7); c.fill(); } }, { edge: 0.8, rag: 0.3, p: G(A(oi) + 0.3, A(oi) + 0.6) });
  if (oi >= 0 && oi + 1 < n && t > A(oi + 1) && beat.eye !== false) { const kk = G(A(oi + 1) + 0.1, A(oi + 1) + 0.35);
    paint(cream, [yx - 110, 150, yx + 110, 290], (c) => { c.beginPath(); c.moveTo(yx - 95, 220); c.quadraticCurveTo(yx, 140, yx + 95, 220); c.quadraticCurveTo(yx, 300, yx - 95, 220); c.fill(); }, { edge: 1, rag: 0.4, p: kk });
    paint(navy, [yx - 110, 150, yx + 110, 290], (c) => { c.beginPath(); c.arc(yx, 220, 30, 0, 7); c.fill(); }, { edge: 1, rag: 0.4, p: kk });
    paint(orange, [yx - 120, 140, yx + 120, 300], (c) => { c.save(); c.translate(yx, 220); c.rotate(-0.7); c.fillRect(-120, -11, 240, 22); c.restore(); }, { edge: 1, rag: 0.4, p: G(A(oi + 1) + 0.35, A(oi + 1) + 0.55) }); }
}, sound(k, S, F) { const { A, n, beat } = S, ri = n >= 3 ? 1 : 0, ii = Math.min(ri + 1, n - 1), oi = beat.otherAt != null ? beat.otherAt : (n >= 4 ? n - 2 : -1); F.flat(A(ri), A(ri) + 0.5, 1.0, -0.4, 0.4, false); k.noise(A(ri), { dur: 1.6, color: 'pink', filter: 'bandpass', f: [[0, 300], [1.5, 900]], q: 1, gain: 0.06, a: 0.6, minor: true }); if (n > 1) for (let i = 0; i < 5; i++) k.play('pop', A(ii) + i * 0.12, { f: 560 + i * 60, gain: 0.5, pan: (i - 2) * 0.25 }); if (oi >= 0) { F.flat(A(oi), A(oi) + 0.7, 1.0, 0.8, 0.2, false); k.play('buzz', A(oi) + 0.4, { f: 90, dur: 0.6, gain: 0.35, pan: 0.3 }); if (oi + 1 < n && beat.eye !== false) { k.play('slap', A(oi + 1) + 0.1, { gain: 0.4 }); F.flat(A(oi + 1) + 0.35, A(oi + 1) + 0.55, 1.2, -0.3, 0.2, false); } } } };

SCENES.choose = { draw(paint, G, T, S) {
  const { t, A, n, beat } = S, mi = n > 1 ? 1 : 0;
  paint(mustard, [200, 470, 520, 790], (c) => { c.beginPath(); c.arc(360, 640, 130, 0, 7); c.fill(); }, { edge: 2.5, p: G(S.t0 + 0.3, S.t0 + 0.6) });
  paint(S.sky.ground, [0, 720, W, SB], (c) => T.ground(c, 820, beat.i + 1), { edge: 3, key: S.key('gr') });
  const xs = [90, 225, 360, 495, 630], good = [1, 0, 1, 0, 1], cols = [orange, H.mix(navy, cream, 0.45), cream, H.mix(navy, cream, 0.45), rose];
  const out = G(A(mi) + 0.8, A(mi) + 1.3);
  xs.forEach((x0, i) => { let x = x0; if (!good[i]) x = x0 + (x0 < 360 ? -1 : 1) * 420 * out; if (x < -60 || x > 780) return;
    paint(cols[i], [x - 60, 600, x + 60, 900], (c) => T.fig(c, x, 880 + Math.sin(t * 5 + i) * 3, i === 2 ? 4.6 : 4.0), { edge: 1, rag: 0.4, dir: 'v', p: G(A(0) + i * 0.08, A(0) + i * 0.08 + 0.3) });
    if (t > A(mi) && t < A(mi) + 1.6) { const kk = G(A(mi) + i * 0.1, A(mi) + i * 0.1 + 0.2);
      if (good[i]) paint(teal, [x - 50, 560, x + 50, 660], (c) => { c.lineWidth = 16; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(x - 30, 612); c.lineTo(x - 8, 636); c.lineTo(x + 32, 584); c.stroke(); }, { edge: 1, rag: 0.4, p: kk });
      else paint(navy, [x - 60, 560, x + 60, 680], (c) => { c.save(); c.translate(x, 620); for (const a of [0.7, -0.7]) { c.save(); c.rotate(a); c.fillRect(-46, -8, 92, 16); c.restore(); } c.restore(); }, { edge: 1, rag: 0.4, p: kk }); } });
}, sound(k, S, F) { const { A, n } = S, mi = n > 1 ? 1 : 0; for (let i = 0; i < 5; i++) k.play('tock', A(0) + i * 0.08 + 0.3, { f: 300 + i * 20, gain: 0.35, pan: (i - 2) * 0.3, minor: true }); [0, 2, 4].forEach((i) => k.play('pop', A(mi) + i * 0.1 + 0.2, { f: 700, gain: 0.5, pan: (i - 2) * 0.3 })); [1, 3].forEach((i) => k.play('slap', A(mi) + i * 0.1 + 0.2, { gain: 0.4, pan: (i - 2) * 0.3 })); k.play('whoosh', A(mi) + 0.8, { dur: 0.5, gain: 0.5 }); } };

SCENES.rise = { draw(paint, G, T, S) {
  const { t, A, n, beat } = S, li = n - 1, rise = H.ease.inOut(H.clamp((t - A(0)) / Math.max(1.5, S.END - A(0) - 0.5))), sunY = 760 - 300 * rise, sunR = 120 + 40 * rise;
  if (t > A(li) + 0.3) { const kk = G(A(li) + 0.3, A(li) + 0.45); paint(orange, [0, 80, W, 860], (c) => T.burst(c, 360, sunY, sunR + 70, sunR + 150, 18, kk), { edge: 1.5, rag: 0.5, p: kk }); }
  paint(mustard, [200, sunY - sunR - 10, 520, sunY + sunR + 10], (c) => { c.beginPath(); c.arc(360, sunY, sunR, 0, 7); c.fill(); }, { edge: 2.5, p: G(S.t0 + 0.3, S.t0 + 0.6) });
  paint(teal, [0, 640, W, SB], (c) => T.ridge(c, 760, 30, 0.3, SB), { edge: 3, rag: 1, dir: 'd', key: S.key('rd') });
  paint(H.mix(navy, teal, 0.4), [0, 800, W, SB], (c) => { c.beginPath(); c.moveTo(0, 850); c.bezierCurveTo(240, 820, 480, 870, 720, 840); c.lineTo(720, SB); c.lineTo(0, SB); c.fill(); }, { edge: 3, key: S.key('g') });
  const gather = H.ease.inOut(H.clamp((t - A(0) - 0.4) / 1.0));
  [[90, orange, 4.0], [630, rose, 4.0], [200, teal, 3.6], [520, H.mix(mustard, orange, 0.4), 3.6], [360, cream, 4.6]].forEach(([x0, col, s], i) => { const x = i === 4 ? 360 : H.lerp(x0, 360 + (x0 < 360 ? -1 : 1) * (i < 2 ? 130 : 230), gather), lift = rise * (i === 4 ? 70 : 40);
    paint(col, [x - 60, 600, x + 60, 900], (c) => T.fig(c, x, 880 - lift + Math.sin(t * 5 + i) * 3, s), { edge: 1, rag: 0.4, dir: 'v', p: G(S.t0 + 0.5 + i * 0.08, S.t0 + 0.8 + i * 0.08) }); });
  if (t > A(li)) paint(cream, [0, 120, W, 900], (c) => { for (let i = 0; i < 6; i++) { const ph = ((t - A(li)) * 0.45 + i / 6) % 1, x = 70 + i * 116; T.arrowV(c, x, 860 - ph * 560, 800 - ph * 560, 12); } }, { dir: 'v', edge: 1, rag: 0.4, p: G(A(li), A(li) + 0.3) });
}, sound(k, S, F) { const { A, n } = S, li = n - 1; F.flat(S.t0 + 0.5, S.t0 + 1.0, 0.8, -0.6, 0.6); k.play('riser', A(0), { dur: Math.max(1.2, A(li) + 0.3 - A(0)), gain: 0.5 }); k.play('impact', A(li) + 0.3, { gain: 0.7 }); k.play('slap', A(li) + 0.3, { gain: 0.8 }); k.play('sparkle', A(li) + 0.35, { n: 8, gain: 0.8 }); } };

SCENES.symbol = { draw(paint, G, T, S) {
  const { t, A, n, beat } = S, li = n - 1, burst = beat.burst !== false;
  if (burst && n > 1 && t > A(li)) { const kk = G(A(li), A(li) + 0.15); paint(orange, [60, 160, 660, 760], (c) => T.burst(c, 360, 460, 210, 280, 16, kk), { edge: 1.5, rag: 0.5, p: kk, key: kk >= 1 ? S.key('bs') : null }); }
  paint(H.mix(S.sky.sky, navy, 0.12), [100, 200, 620, 720], (c) => { c.beginPath(); c.arc(360, 460, 240, 0, 7); c.fill(); }, { edge: 2.5, rag: 0.8, p: G(S.t0 + 0.3, S.t0 + 0.7), key: S.key('disc') });
  const pulse = 1 + 0.03 * Math.sin(t * 2.4);
  T.icon(beat.icon, 360, 460, 0.95, G(A(0) - 0.1, A(0) + 0.9), pulse);
  if (beat.label) T.tag(navy, cream, 360 + Math.min(320, measure(beat.label, 56) + 40) / 2, 760, beat.label, G(A(0) + 0.6, A(0) + 0.9), G(A(0) + 0.8, A(0) + 1.1), S.key('lab'));
}, sound(k, S, F) { const { A, n, beat } = S; F.flat(A(0) - 0.1, A(0) + 0.9, 1.1, -0.4, 0.4, false); if (beat.label) k.play('slap', A(0) + 0.9, { gain: 0.35, minor: true }); if (beat.burst !== false && n > 1) { k.play('slap', A(n - 1), { gain: 0.7 }); k.play('thud', A(n - 1), { f: 140, gain: 0.5 }); k.play('ding', A(n - 1) + 0.05, { f: 'E5', gain: 0.35 }); } } };

SCENES.breath = { draw(paint, G, T, S) {
  const { t, A, beat } = S, lb = beat.labels || ['שאיפה', 'נשיפה'], per = beat.period || 4;
  const ph = ((t - A(0)) / per) % 1, inhale = ph < 0.5, k = inhale ? H.ease.inOut(ph * 2) : 1 - H.ease.inOut((ph - 0.5) * 2), r = 110 + 120 * Math.max(0, k);
  const on = G(A(0) - 0.2, A(0) + 0.4);
  paint(tint(mustard, 0.2), [0, 140, W, 780], (c) => { c.beginPath(); c.arc(360, 460, r + 40, 0, 7); c.arc(360, 460, r + 26, 0, 7, true); c.fill(); }, { edge: 1.2, rag: 0.5, p: on });
  paint(mustard, [0, 140, W, 780], (c) => { c.beginPath(); c.arc(360, 460, r, 0, 7); c.fill(); }, { edge: 2, rag: 0.6, p: on });
  paint(cream, [0, 140, W, 780], (c) => { c.beginPath(); c.arc(360, 460, r * 0.55, 0, 7); c.fill(); }, { edge: 1.5, rag: 0.5, p: on });
  paint(S.sky.ground, [0, 720, W, SB], (c) => T.ground(c, 820, beat.i), { edge: 3, key: S.key('gr') });
  paint(navy, [260, 700, 460, 900], (c) => T.seated(c, 360, 880, 3.2), { edge: 1, rag: 0.4, dir: 'v', p: G(S.t0 + 0.5, S.t0 + 0.8) });
  if (t > A(0) - 0.2) { const txt = inhale ? lb[0] : lb[1]; paint(navy, [200, 400, 520, 520], (c) => T.he(c, txt, 360, 485, 70, 'center'), { edge: 0.8, rag: 0.3, p: on }); paint(inhale ? teal : orange, [600, 300, 710, 640], (c) => T.arrowV(c, 655, inhale ? 600 : 340, inhale ? 340 : 600, 22), { dir: 'v', edge: 1, rag: 0.4, p: on }); }
}, sound(k, S) { const { A, beat } = S, per = beat.period || 4; for (let t = A(0); t < S.END; t += per) { k.noise(t, { dur: per * 0.5, color: 'pink', filter: 'bandpass', f: [[0, 400], [per * 0.5, 1200]], q: 0.8, gain: 0.07, a: per * 0.3 }); k.noise(t + per * 0.5, { dur: per * 0.5, color: 'pink', filter: 'bandpass', f: [[0, 1200], [per * 0.5, 350]], q: 0.8, gain: 0.06, a: 0.2 }); } } };

SCENES.path = { draw(paint, G, T, S) {
  const { t, A, n, beat } = S, signs = beat.signs || [];
  paint(orange, [260, 380, 460, 600], (c) => { c.beginPath(); c.arc(360, 520, 80, 0, 7); c.fill(); }, { edge: 2.5, p: G(S.t0 + 0.3, S.t0 + 0.6) });
  paint(S.sky.ground, [0, 560, W, SB], (c) => { c.beginPath(); c.moveTo(0, 600); c.bezierCurveTo(240, 580, 480, 610, 720, 590); c.lineTo(720, SB); c.lineTo(0, SB); c.fill(); }, { edge: 3, key: S.key('gr') });
  paint(tint(mustard, 0.2), [0, 580, W, SB], (c) => { const L = [], R = []; for (let i = 0; i <= 30; i++) { const u = i / 30, y = H.lerp(SB, 600, u), x = 360 + Math.sin(u * 3) * 60 * u, w = H.lerp(300, 6, Math.pow(u, 0.7)); L.push([x - w, y]); R.push([x + w, y]); } T.poly(c, L.concat(R.reverse())); }, { edge: 1.5, rag: 0.6, dir: 'v', p: G(S.t0 + 0.4, S.t0 + 0.8), key: S.key('road') });
  const prog = H.clamp((t - A(0)) / (S.END - A(0))), u = 0.08 + prog * 0.55, py = H.lerp(SB, 600, u), px = 360 + Math.sin(u * 3) * 60 * u, ps = H.lerp(4.4, 1.2, u);
  paint(navy, [px - 60, py - 260, px + 60, py + 20], (c) => T.fig(c, px, py - 10 + Math.abs(Math.sin(t * 6)) * 3, ps), { edge: 1, rag: 0.4, dir: 'v', p: G(A(0) - 0.2, A(0) + 0.1) });
  signs.slice(0, n).forEach((s, i) => { if (t < A(i)) return; const side = i % 2 ? 1 : -1, y = 860 - i * 90, x = 360 + side * (220 - i * 40);
    paint(navy, [x - 20, y - 160, x + 20, y + 10], (c) => c.fillRect(x - 6, y - 140, 12, 140), { edge: 1, p: G(A(i), A(i) + 0.2) });
    T.tag(i % 2 ? cream : navy, i % 2 ? navy : cream, x + Math.min(320, measure(s, 56) + 40) / 2, y - 220, s, G(A(i) + 0.1, A(i) + 0.35), G(A(i) + 0.3, A(i) + 0.55), S.key('s' + i)); });
}, sound(k, S, F) { const { A, n, beat } = S; F.flat(S.t0 + 0.4, S.t0 + 0.8, 0.8, -0.2, 0.2); for (let t = A(0); t < S.END; t += 0.42) k.play('tock', t, { f: 180, gain: 0.12, minor: true }); (beat.signs || []).slice(0, n).forEach((s, i) => { k.play('slap', A(i) + 0.35, { gain: 0.4, pan: i % 2 ? 0.4 : -0.4 }); }); } };

SCENES.moon = { draw(paint, G, T, S) {
  const { t, A, n, beat } = S, ph = H.clamp((t - A(0)) / (S.END - A(0))), off = H.lerp(-1.15, 1.15, ph);
  paint(cream, [160, 120, 560, 520], (c) => { c.beginPath(); c.arc(360, 320, 170, 0, 7); c.fill(); }, { edge: 2, p: G(S.t0 + 0.3, S.t0 + 0.6), key: S.key('m') });
  paint(S.sky.sky, [100, 100, 620, 540], (c) => { c.beginPath(); c.arc(360, 320, 172, 0, 7); c.clip(); c.beginPath(); c.arc(360 + off * 340, 320, 175, 0, 7); c.fill(); }, { edge: 2.5, rag: 0.4, p: G(S.t0 + 0.6, S.t0 + 0.8) });
  paint(H.mix(navy, teal, 0.3), [0, 620, W, SB], (c) => c.fillRect(0, 640, W, SB - 640), { edge: 3, key: S.key('sea') });
  paint(cream, [100, 640, 620, 900], (c) => { const r = H.rng(5); for (let i = 0; i < 9; i++) { const y = 670 + i * 26, w = (180 - i * 12) * (0.7 + r() * 0.4) * (1 - Math.abs(off) * 0.6), cx = 360 + Math.sin(t * 1.5 + i) * 10; c.fillRect(cx - w / 2, y, w * 0.45, 5); c.fillRect(cx + w * 0.05, y, w * 0.4, 5); } }, { edge: 1, rag: 0.6, p: G(S.t0 + 0.7, S.t0 + 0.9) });
  if (beat.label) T.tag(navy, cream, 360 + Math.min(320, measure(beat.label, 56) + 40) / 2, 540, beat.label, G(A(0) + 0.5, A(0) + 0.8), G(A(0) + 0.7, A(0) + 1.0), S.key('lab'));
}, sound(k, S, F) { F.flat(S.t0 + 0.3, S.t0 + 0.8, 0.8, -0.3, 0.3); k.noise(S.t0 + 0.5, { dur: S.END - S.t0, color: 'pink', filter: 'lowpass', f: 600, gain: 0.05, a: 0.8, minor: true }); } };

// ---------------- sound ----------------
function scoreSound(k) {
  const D = DURATION;
  const flat = (a, b, g = 1, p0 = 0, p1 = p0, minor = true) => {
    const d = Math.max(0.05, b - a), r = H.rng(Math.round(a * 997) + 3);
    k.noise(a, { dur: 0.04, color: 'brown', filter: 'lowpass', f: 450, gain: 0.2 * g, a: 0.004, pan: p0, minor });
    for (let x = 0; x < d; x += 0.035 + r() * 0.02) { const u = x / d, gd = 0.06 + r() * 0.03; k.noise(a + x, { dur: gd, color: 'pink', filter: 'bandpass', f: 650 + r() * 350, q: 0.7, gain: 0.13 * g * (0.65 + r() * 0.5) * (1 - 0.35 * u), a: gd * 0.35, pan: p0 + (p1 - p0) * u, minor }); }
    k.play('stroke', a, { material: 'brush', dur: d, gain: 0.9 * g, pan: (p0 + p1) / 2, minor });
  };
  const dab = (t, g = 1, pan = 0) => { k.withMinor(() => { k.noise(t, { dur: 0.04, color: 'pink', filter: 'bandpass', f: 950, q: 1.0, gain: 0.3 * g, a: 0.004, pan }); k.tone(t, { f: 170, dur: 0.05, gain: 0.08 * g, pan }); }); };
  const F = { flat };
  k.bed('room', 0, D, { gain: 0.45 });
  const prog = (SPEC.music || 0) % 3, CH = [
    [['C3', 'E3', 'G3', 'A3'], ['A2', 'E3', 'G3', 'C4'], ['F2', 'C3', 'E3', 'A3'], ['G2', 'D3', 'E3', 'B3']],
    [['D3', 'F#3', 'A3', 'B3'], ['B2', 'F#3', 'A3', 'D4'], ['G2', 'D3', 'F#3', 'B3'], ['A2', 'E3', 'F#3', 'C#4']],
    [['A2', 'E3', 'G3', 'C4'], ['F2', 'C3', 'E3', 'A3'], ['C3', 'E3', 'G3', 'B3'], ['G2', 'D3', 'G3', 'B3']]][prog];
  k.music('pad', 0, D, { bpm: 64, gain: 0.3, chords: CH });
  flat(0.0, 0.3, 0.7, -0.6, 0.2); flat(0.2, 0.75, 1.2, 0.5, -0.5, false);
  k.noise(1.0, { dur: 0.6, color: 'pink', filter: 'bandpass', f: [[0, 320], [0.6, 650]], q: 0.7, gain: 0.07, a: 0.25, minor: true });
  flat(1.3, 1.6, 0.7, 0.9, 0.3);
  LINES.forEach((c, i) => flat(c.a, c.a + 0.45, i === 0 ? 1.1 : 0.85, 0.6, -0.6, i === 0));
  BEATS.forEach((b) => {
    if (b.coat) { flat(b.coat[0], b.coat[1], 2.0, -0.7, 0.7, false); k.noise(b.coat[0], { dur: b.coat[1] - b.coat[0] + 0.1, color: 'brown', filter: 'lowpass', f: 300, gain: 0.14, a: 0.05, hold: (b.coat[1] - b.coat[0]) * 0.5 }); }
    const S = { t0: b.t0, beat: b, n: b.lines.length, A: (i) => b.lines[Math.min(i, b.lines.length - 1)].a, END: b.lines[b.lines.length - 1].b };
    try { SCENES[b.scene].sound(k, S, F, dab); } catch (e) { console.error('sound', b.scene, e); }
  });
  const last = LINES[LINES.length - 1];
  k.play('ding', last.a + 0.5, { f: 'C5', gain: 0.45 }); ['E5', 'G5', 'C6'].forEach((f, i) => k.tone(last.a + 0.55 + i * 0.05, { f, dur: 1.6, gain: 0.06, verb: 0.3, pan: (i - 1) * 0.3 }));
}

window.explainer = explainer; window.scoreSound = scoreSound; window.BEATS = BEATS; window.LINES = LINES; window.ICONS = ICONS; window.SCENE_TYPES = Object.keys(SCENES);
})();
