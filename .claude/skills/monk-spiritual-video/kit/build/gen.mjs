// monk-spiritual-video KIT: the cyber-explainer engine with THE MONK as presenter, for spiritual topics (breath, energy, chakras, meditation), 2026-11-18. Ships a 4-scene demo. Replace the scenes block (add('s01'…) … add('s16'…)) with the new film's scenes.
// v2 "paper" language (2026-11-17) — Rivka v2 textured + reference-reel look.
// Generates compositions/*.html + index.html + STORYBOARD.md from code.
// Source of truth for the film. Run: node build/gen.mjs   (old dark version: build/gen-v1-dark.mjs)
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- Rivka v2 (textured) ---------- */
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'build/rivka-lib-v2.js'), 'utf8') + '\n;globalThis.__L={SH_L,SH_R,C1,C2,phone,mug,laptop,HK};', ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'build/monk-lib.js'), 'utf8'), ctx);   // the monk reuses Rivka's drawing kit (hands, textures, head rig)
/* the presenter: every RIVKA call in the engine now draws THE MONK (same signature, same head rig classes) */
const RIVKA = ctx.window.MONK, MONKFULL = ctx.window.MONKFULL, MP = ctx.window.MPOSE, FPOSE = ctx.window.FPOSE;
const { SH_L, SH_R, C1, C2, phone, mug } = ctx.__L;

/* ---------- palette: colour = meaning ---------- */
const W = 400, H = 711;
const PAPER = '#efece6', INK = '#161412', CARD = '#fbfaf7', LINE = '#d9d3c8', MUTE = '#8a8378', DARK = '#1b1917';
const RED = '#e5302a', GREEN = '#16a35f', GOLD = '#e8a317', CY = '#22b8cc';   // red = fake/danger · green = real/safe · gold = money · cyan = glitch only
const SANS = "'Instrument Sans'", SERIF = "'Instrument Serif'", MONO = "'JetBrains Mono'";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- type ---------- */
const E = (t, c = RED) => ({ t, c });            // italic-serif key word
const HEAD = (lines, { x = 28, y = 86, s = 29, c = INK } = {}) => lines.map((ln, i) =>
  `<text x="${x}" y="${(y + i * s * 1.13).toFixed(1)}" font-family="${SANS}" font-weight="600" font-size="${s}" fill="${c}" letter-spacing="-0.6">${(Array.isArray(ln) ? ln : [ln]).map(g => typeof g === 'string' ? esc(g) : `<tspan font-family="${SERIF}" font-style="italic" font-weight="400" font-size="${(s * 1.14).toFixed(1)}" fill="${g.c}" letter-spacing="-0.2">${esc(g.t)}</tspan>`).join('')}</text>`).join('');
const T = (x, y, s, txt, { c = INK, w = 600, a = 'middle', f = SANS, ls = -0.3, it = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${f}" font-weight="${w}" font-size="${s}" fill="${c}" text-anchor="${a}" letter-spacing="${ls}"${it ? ' font-style="italic"' : ''}>${esc(txt)}</text>`;
const MT = (x, y, s, txt, c = MUTE, a = 'start', w = 500) => T(x, y, s, txt, { c, a, f: MONO, w, ls: 0.2 }).replace('<text ', '<text data-layout-ignore="true" ');
const HDR = (left, rl = '', rv = '') => `${MT(28, 40, 8.6, left)}${rl ? `<text x="372" y="40" font-family="${MONO}" font-size="8.6" text-anchor="end" fill="${MUTE}" letter-spacing=".6">${esc(rl)} <tspan fill="${RED}" font-weight="700">${esc(rv)}</tspan></text>` : ''}`;

/* ---------- world: textured paper ---------- */
function defs(id) {
  return `<defs>
  <pattern id="${id}-grid" width="4" height="4" patternUnits="userSpaceOnUse"><rect x="1.5" y="1.5" width=".9" height=".9" fill="#000" opacity=".1"/></pattern>
  <filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .08  0 0 0 0 .06  0 0 0 .26 -.05"/></filter>
  <radialGradient id="${id}-vig" cx=".5" cy=".42" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5a4a38" stop-opacity=".16"/></radialGradient>
  <filter id="${id}-sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="3.2" flood-color="#2a2016" flood-opacity=".2"/></filter>
  <filter id="${id}-grunge" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -7 0 0 0 4.4" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
  <pattern id="${id}-ht" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.45" fill="${INK}"/></pattern>
  <pattern id="${id}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="2.2" height="6" fill="#fff" opacity=".22"/></pattern>
  ${MOTIF_DEFS(id)}
  </defs>`;
}

/* ---------- v3 tile language (2026-11-17): shapes from Guy's cement-tile refs, colours ignored ----------
   Each motif is drawn at unit radius 10 and inherits fill from its parent <g>.
   Two tones per shape = a full-tone half + a 50% half (the "split petal" of the refs).          */
const vesica = (L, w) => `M0 0 C${w} ${-L * .3} ${w} ${-L * .7} 0 ${-L} C${-w} ${-L * .7} ${-w} ${-L * .3} 0 0Z`;
const vesicaHalf = (L, w) => `M0 0 C${w} ${-L * .3} ${w} ${-L * .7} 0 ${-L}Z`;
const rot = (n, fn, off = 0) => Array.from({ length: n }, (_, i) => `<g transform="rotate(${(off + i * 360 / n).toFixed(2)})">${fn(i)}</g>`).join('');
const MOTIFS = {
  // ref 3: four split lens petals at a tile corner
  petal4: () => rot(4, () => `<path d="${vesica(10, 3.3)}" fill-opacity=".45"/><path d="${vesicaHalf(10, 3.3)}"/>`, 45),
  // ref 3: concave 4-point star left between four rounded tiles, faceted
  astroid: () => { const k = 1.5; return `<path d="M0 -10 Q${k} ${-k} 10 0 Q${k} ${k} 0 10 Q${-k} ${k} -10 0 Q${-k} ${-k} 0 -10Z" fill-opacity=".45"/><path d="M0 0 L0 -10 Q${k} ${-k} 10 0Z M0 0 L0 10 Q${-k} ${k} -10 0Z"/>`; },
  // ref 4: 8-kite star rosette with small diamonds between the points
  star8: () => rot(8, () => `<path d="M0 0 L2.5 -5.4 L0 -10 L-2.5 -5.4Z" fill-opacity=".45"/><path d="M0 0 L2.5 -5.4 L0 -10Z"/><path d="M0 -6.6 l1.1 1.5 l-1.1 1.5 l-1.1 -1.5Z" transform="rotate(22.5)"/>`),
  // ref 2: sunburst daisy — spoke ring + rounded petal ring + seed
  daisy: () => `${rot(16, () => `<path d="M0 -2.6 L.55 -5.4 L-.55 -5.4Z"/>`)}${rot(16, () => `<ellipse cx="0" cy="-7.9" rx="1.15" ry="2.1"/>`, 11.25)}<circle r="1.5"/>`,
};
const MOTIF_DEFS = id => Object.entries(MOTIFS).map(([k, f]) => `<g id="${id}-m-${k}">${f()}</g>`).join('');
const motif = (id, kind, x, y, r, { c = INK, op = 1, rt = 0 } = {}) =>
  `<use href="#${id}-m-${kind}" fill="${c}" opacity="${op}" transform="translate(${x} ${y}) rotate(${rt}) scale(${(r / 10).toFixed(3)})"/>`;

/* big hero rosette (ref 2), drawn at full detail — replaces the halftone burst */
function rosette(x, y, R, { c = INK, op = 1, n = 16, accent = RED, rt = 0 } = {}) {
  // ref 2: ring of fat rounded petals (split two-tone) around a ring of thin dark spokes
  const r1 = R * .5, r2 = R * .56, ry = (R - r2) / 2, cyp = r2 + ry, rx = Math.min(ry * .78, Math.PI * cyp / n * .82);
  const spokes = rot(n * 3, i => `<path d="M0 ${(-R * .2).toFixed(1)} L${(R * .026).toFixed(2)} ${(-r1).toFixed(1)} L${(-R * .026).toFixed(2)} ${(-r1).toFixed(1)}Z" fill-opacity="${i % 3 ? .5 : 1}"/>`);
  const petals = rot(n, () => `<ellipse cx="0" cy="${(-cyp).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill-opacity=".42"/><path d="M0 ${(-r2).toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 0 ${(-R).toFixed(1)}Z"/>`, 180 / n);
  return `<g transform="translate(${x} ${y}) rotate(${rt})" fill="${c}" opacity="${op}"><circle r="${(R * .52).toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(R * .012).toFixed(2)}"/>${spokes}${petals}<circle r="${(R * .16).toFixed(1)}" fill="${PAPER}"/><circle r="${(R * .16).toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(R * .02).toFixed(1)}"/><circle r="${(R * .06).toFixed(1)}" fill="${accent}"/></g>`;
}

/* "tile-tone" field: same fall-off as htField, but each dot is a tile motif */
function tileField(id, kind, cx, cy, R, col = INK, op = 1, step = 18, max = 8, ry = 1, spin = 0) {
  let d = ''; let row = 0;
  for (let y = cy - R * ry; y <= cy + R * ry; y += step, row++) for (let x = cx - R; x <= cx + R; x += step) {
    const xx = x + (row % 2 ? step / 2 : 0), dd = Math.hypot(xx - cx, (y - cy) / ry); if (dd >= R) continue;
    const r = max * Math.pow(1 - dd / R, .7); if (r < 1.2) continue;
    d += motif(id, kind, +xx.toFixed(1), +y.toFixed(1), r, { c: col, rt: spin ? (row * 15) % 90 : 0 });
  }
  return `<g opacity="${op}">${d}</g>`;
}

/* the floor: a faint cement-tile grid (rounded tiles, ref 3) — petal4 and astroid alternate at the joints */
function floor(id, S = 100, ox = 0, oy = 30) {
  let g = '', m = '';
  for (let x = ox; x <= W; x += S) g += `M${x} 0 V${H}`;
  for (let y = oy - S; y <= H; y += S) g += `M0 ${y} H${W}`;
  let i = 0;
  for (let y = oy - S; y <= H + S; y += S, i++) for (let x = ox, j = 0; x <= W + S; x += S, j++)
    m += motif(id, (i + j) % 2 ? 'astroid' : 'petal4', x, y, (i + j) % 2 ? S * .17 : S * .15, { c: '#8a7f70' });
  return `<g data-layout-ignore="true"><path d="${g}" stroke="#c9c0b1" stroke-width=".9" opacity=".85"/><g opacity=".3">${m}</g></g>`;
}
const paper = id => `${defs(id)}<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" fill="url(#${id}-grid)"/>${floor(id)}<rect width="${W}" height="${H}" fill="url(#${id}-vig)"/>`;

/* halftone field: dot size falls off from the centre (deterministic) */
function htField(cx, cy, R, col = INK, op = 1, step = 9, max = 4.2, ry = 1) {
  let d = ''; let row = 0;
  for (let y = cy - R * ry; y <= cy + R * ry; y += step, row++) for (let x = cx - R; x <= cx + R; x += step) {
    const xx = x + (row % 2 ? step / 2 : 0), dd = Math.hypot(xx - cx, (y - cy) / ry); if (dd >= R) continue;
    const r = max * Math.pow(1 - dd / R, .7); if (r < .5) continue; d += `<circle cx="${xx.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"/>`;
  }
  return `<g fill="${col}" opacity="${op}">${d}</g>`;
}

/* ---------- props kit ---------- */
const card = (id, x, y, w, h, inner = '', { r = 0, fill = CARD, label = '', lc = MUTE, dark = 0, rx = 10 } = {}) =>
  `<g transform="translate(${x} ${y}) rotate(${r})"><g filter="url(#${id}-sh)"><rect width="${w}" height="${h}" rx="${rx}" fill="${dark ? DARK : fill}" stroke="${dark ? '#000' : LINE}" stroke-width="1"/></g>
  ${label ? MT(12, 17, 7.4, '// ' + label, dark ? '#8d867b' : lc) : ''}${inner}</g>`;
const tape = (x, y, rot = -8, w = 56) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-w / 2} -9 l3 3 l-3 3 l3 3 l-3 3 l3 3 l-3 3 H${w / 2} l-3 -3 l3 -3 l-3 -3 l3 -3 l-3 -3 l3 -3Z" fill="#e9dfc4" opacity=".82"/><path d="M${-w / 2 + 4} -4 H${w / 2 - 4}" stroke="#fff" stroke-width="1.4" opacity=".5"/></g>`;
const stamp = (id, x, y, txt, { c = RED, rot = -10, s = 15, sub = '' } = {}) => {
  const w = txt.length * s * .66 + 26, h = s * 1.75 + (sub ? 9 : 0);
  return `<g data-layout-allow-overlap="true" transform="translate(${x} ${y}) rotate(${rot})" filter="url(#${id}-grunge)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4" fill="${c}" fill-opacity=".07" stroke="${c}" stroke-width="2.6"/><rect x="${-w / 2 + 4}" y="${-h / 2 + 4}" width="${w - 8}" height="${h - 8}" rx="2" fill="none" stroke="${c}" stroke-width="1"/>
  ${T(0, (sub ? -1 : s * .36), s, txt, { c, w: 700, ls: 1.2 })}${sub ? MT(0, h / 2 - 7, 6.5, sub, c, 'middle', 700) : ''}</g>`;
};
const chip = (x, y, txt, { c = INK, bg = CARD, s = 8, a = 'start' } = {}) => {
  const w = txt.length * s * .62 + 16, x0 = a === 'middle' ? x - w / 2 : x;
  return `<g><rect x="${x0}" y="${y - s - 3}" width="${w}" height="${s + 9}" rx="${(s + 9) / 2}" fill="${bg}" stroke="${c === INK ? LINE : c}" stroke-width="1"/>${MT(x0 + w / 2, y + 1, s, txt, c, 'middle', 700)}</g>`;
};
const check = (x, y, r = 8, c = GREEN) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${c}"/><path d="M${-r * .45} 0 l${r * .3} ${r * .32} l${r * .55} ${-r * .6}" stroke="#fff" stroke-width="${r * .28}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const cross = (x, y, r = 8, c = RED) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${c}"/><path d="M${-r * .38} ${-r * .38} l${r * .76} ${r * .76} M${r * .38} ${-r * .38} l${-r * .76} ${r * .76}" stroke="#fff" stroke-width="${r * .26}" stroke-linecap="round"/></g>`;
const tile = (x, y, s, txt, { rot = 0, dots = -1, n = 5 } = {}) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-40" y="-42" width="80" height="84" rx="18" fill="#000" opacity=".18" transform="translate(3 5)"/><rect x="-40" y="-42" width="80" height="84" rx="18" fill="${DARK}"/><rect x="-40" y="-42" width="80" height="84" rx="18" fill="none" stroke="#3a3632" stroke-width="1.4"/>
  ${[[-31, -33, 135], [31, -33, -135], [31, 33, -45], [-31, 33, 45]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})" fill="${RED}"><path d="${vesica(13, 3.6)}" fill-opacity=".5"/><path d="${vesicaHalf(13, 3.6)}"/></g>`).join('')}
  ${T(0, 18, 54, txt, { c: '#fff', w: 700, ls: -2 })}${dots >= 0 ? Array.from({ length: n }, (_, i) => `<circle cx="${(i - (n - 1) / 2) * 9}" cy="31" r="3" fill="${i === dots ? RED : 'none'}" stroke="${i === dots ? RED : '#8d867b'}" stroke-width="1.2"/>`).join('') : ''}</g>`;
const pop = (x, y, r = 26, c = INK) => [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4 + .2; return `<line x1="${(x + Math.cos(a) * r).toFixed(1)}" y1="${(y + Math.sin(a) * r).toFixed(1)}" x2="${(x + Math.cos(a) * (r + 8)).toFixed(1)}" y2="${(y + Math.sin(a) * (r + 8)).toFixed(1)}" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`; }).join('');

/* the AI assistant (generic, no real logo) — ink-outlined sticker look */
function bot(x, y, s, o = {}) {
  const mode = o.mode || 'neutral';
  const eye = mode === 'bad' ? RED : mode === 'good' ? GREEN : '#5ee0ee';
  const face = (fill, ink, ol) => `
    <line x1="0" y1="-40" x2="0" y2="-56" stroke="${fill || INK}" stroke-width="3.4"/>
    <path d="M0 -71 L3.6 -61 L13 -58 L3.6 -55 L0 -45 L-3.6 -55 L-13 -58 L-3.6 -61Z" fill="${fill || (mode === 'bad' ? RED : GOLD)}" ${ol ? `stroke="${INK}" stroke-width="2" stroke-linejoin="round"` : ''}/>
    <rect x="-58" y="-13" width="12" height="28" rx="6" fill="${fill || '#d9d3c8'}" ${ol ? `stroke="${INK}" stroke-width="2.4"` : ''}/><rect x="46" y="-13" width="12" height="28" rx="6" fill="${fill || '#d9d3c8'}" ${ol ? `stroke="${INK}" stroke-width="2.4"` : ''}/>
    <rect x="-46" y="-40" width="92" height="80" rx="24" fill="${fill || CARD}" ${ol ? `stroke="${INK}" stroke-width="3"` : ''}/>
    ${ol ? `<path d="M-38 -26 C-34 -34 -24 -36 -14 -36" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M40 10 C40 24 34 32 22 34" stroke="#d9d3c8" stroke-width="5" fill="none" stroke-linecap="round"/>` : ''}
    <rect x="-35" y="-29" width="70" height="54" rx="15" fill="${ink || DARK}"/>
    ${ol ? `<rect x="-35" y="-29" width="70" height="54" rx="15" fill="url(#__ID__-ht)" opacity=".18"/>` : ''}
    <ellipse cx="-13" cy="-4" rx="6.5" ry="${o.squint ? 2.4 : 8.5}" fill="${fill || eye}"/><ellipse cx="13" cy="-4" rx="6.5" ry="${o.squint ? 2.4 : 8.5}" fill="${fill || eye}"/>
    ${ol && !o.squint ? `<circle cx="-15" cy="-8" r="2" fill="#fff"/><circle cx="11" cy="-8" r="2" fill="#fff"/>` : ''}
    <path d="M-10 13 Q0 ${mode === 'bad' ? 9 : 19} 10 13" stroke="${fill || eye}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  let g = '';
  if (mode === 'bad') g += `<g opacity=".75" transform="translate(-6 1)">${face(RED, RED)}</g><g opacity=".75" transform="translate(6 -1)">${face(CY, CY)}</g>`;
  g += face(0, 0, 1);
  if (o.hood) g += `<path d="M-62 42 C-68 -12 -50 -66 0 -70 C50 -66 68 -12 62 42 L46 42 C50 0 38 -48 0 -50 C-38 -48 -50 0 -46 42Z" fill="${DARK}" stroke="${INK}" stroke-width="2.4"/><path d="M-54 30 C-58 -10 -44 -54 0 -60" stroke="#4a4540" stroke-width="2" fill="none"/>`;
  if (mode === 'bad') { let m = ''; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) m += `<path d="M${-30 + i * 14} ${-26 + j * 13} l14 0 l-7 11Z"/>`; g += `<g fill="none" stroke="${GREEN}" stroke-width=".9" opacity=".7">${m}</g><rect x="-54" y="-8" width="108" height="5" fill="${CY}" opacity=".55"/><rect x="-48" y="6" width="80" height="3" fill="${RED}" opacity=".6"/>`; }
  if (o.badge) g += `<g transform="translate(34 34) rotate(-8)"><rect x="-36" y="-15" width="72" height="36" rx="6" fill="${CARD}" stroke="${INK}" stroke-width="2"/><rect x="-36" y="-15" width="72" height="11" rx="5" fill="${GREEN}"/>${T(0, 3.5, 7, 'SECURITY', { c: INK, w: 700, ls: .8 })}${T(0, 14, 6.6, 'TESTER ✓', { c: GREEN, w: 700, ls: .6 })}</g>`;
  return `<g ${o.id ? `id="${o.id}"` : ''} transform="translate(${x} ${y}) scale(${s})">${g}</g>`;
}
/* small company target */
const bldg = (x, y, s, st = 'idle') => {
  const hit = st === 'hit';
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-13" y="-30" width="26" height="30" rx="2" fill="${hit ? RED : CARD}" stroke="${INK}" stroke-width="1.8"/><rect x="-16" y="-33" width="32" height="5" rx="1.5" fill="${INK}"/>
  ${[0, 1, 2].map(r => [0, 1].map(k => `<rect x="${-8.5 + k * 10}" y="${-24 + r * 8}" width="7" height="4.6" rx="1" fill="${hit ? '#7a1410' : INK}" opacity="${hit ? 1 : .85}"/>`).join('')).join('')}
  ${hit ? `<g transform="translate(11 -33)"><circle r="8.5" fill="${INK}"/><path d="M-3 -1 v-3 a3 3 0 0 1 6 0" stroke="#fff" stroke-width="1.7" fill="none" transform="rotate(28)"/><rect x="-4" y="-1" width="8" height="6" rx="1" fill="#fff"/></g>` : ''}
  ${st === 'aim' ? `<g stroke="${RED}" stroke-width="1.5" fill="none"><circle cx="0" cy="-15" r="12"/><path d="M0 -31 v6 M0 -5 v6 M-16 -15 h6 M10 -15 h6"/></g>` : ''}</g>`;
};
const hood = (x, y, s, eyes = RED) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-42 62 C-42 20 -24 6 0 6 C24 6 42 20 42 62Z" fill="${DARK}" stroke="${INK}" stroke-width="2"/><path d="M-31 20 C-35 -31 -16 -47 0 -47 C16 -47 35 -31 31 20 C20 31 -20 31 -31 20Z" fill="#2c2926" stroke="${INK}" stroke-width="2"/><path d="M-24 4 C-26 -26 -12 -38 0 -40" stroke="#4a4540" stroke-width="2" fill="none"/><ellipse cx="0" cy="-6" rx="17" ry="21" fill="#0b0a09"/><circle cx="-6" cy="-6" r="2.6" fill="${eyes}"/><circle cx="6" cy="-6" r="2.6" fill="${eyes}"/></g>`;
const person = (x, y, s, o = {}) => {
  const sk = o.sk || '#dba67c', sks = o.sks || '#c58f67', hr = o.hr || '#3a2a20', sh = o.sh || '#2f3d55';
  return `<g transform="translate(${x} ${y}) scale(${s})" stroke-linejoin="round"><path d="M-46 70 C-44 42 -24 32 0 32 C24 32 44 42 46 70Z" fill="${sh}" stroke="${INK}" stroke-width="2"/>${o.tie ? `<path d="M0 34 L-6 44 L0 66 L6 44Z" fill="${o.tie}"/>` : ''}
  <rect x="-8" y="18" width="16" height="18" fill="${sks}"/><ellipse cx="0" cy="-2" rx="27" ry="31" fill="${sk}" stroke="${INK}" stroke-width="2"/>
  ${o.female ? `<path d="M-30 6 C-34 -34 -14 -44 0 -44 C16 -44 34 -34 30 6 L26 30 C24 0 22 -14 16 -20 L-16 -20 C-22 -14 -24 0 -26 30Z" fill="${hr}" stroke="${INK}" stroke-width="2"/>` : `<path d="M-26 -8 C-28 -36 -12 -44 2 -44 C18 -44 30 -34 26 -8 C22 -20 14 -26 0 -26 C-12 -26 -22 -20 -26 -8Z" fill="${hr}" stroke="${INK}" stroke-width="2"/>`}
  <ellipse cx="-10" cy="0" rx="5" ry="3.2" fill="#fff"/><ellipse cx="10" cy="0" rx="5" ry="3.2" fill="#fff"/><circle cx="-10" cy="-.6" r="2.3" fill="#24170f"/><circle cx="10" cy="-.6" r="2.3" fill="#24170f"/>
  <path d="M-16 -1 Q-10 -6 -4 -1 M4 -1 Q10 -6 16 -1" stroke="#24170f" stroke-width="1.8" fill="none"/>${o.gl ? `<g fill="none" stroke="${INK}" stroke-width="1.8"><circle cx="-10" cy="0" r="8"/><circle cx="10" cy="0" r="8"/></g>` : ''}
  <path d="M0 4 C5 4 6 10 4 12 C2 14 -2 14 -4 12 C-6 10 -5 4 0 4Z" fill="${sks}"/><path d="M-8 19 Q0 ${o.frown ? 15 : 23} 8 19" stroke="#8a3a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="-15" cy="10" rx="5" ry="3" fill="#e07d6c" opacity=".35"/><ellipse cx="15" cy="10" rx="5" ry="3" fill="#e07d6c" opacity=".35"/></g>`;
};
const bubble = (id, x, y, w, h, txt, { bg = CARD, c = INK, tail = 'bl', s = 15, serif = 0 } = {}) => `<g transform="translate(${x} ${y})" filter="url(#${id}-sh)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}" stroke="${bg === CARD ? INK : bg}" stroke-width="1.6"/>
  <path d="${tail === 'bl' ? `M${-w / 2 + 22} ${h / 2 - 1.5} l-10 15 l22 -13.5` : `M${w / 2 - 22} ${h / 2 - 1.5} l10 15 l-22 -13.5`}" fill="${bg}" stroke="${bg === CARD ? INK : bg}" stroke-width="1.6" stroke-linejoin="round"/><rect x="${tail === 'bl' ? -w / 2 + 12 : w / 2 - 36}" y="${h / 2 - 4}" width="24" height="4" fill="${bg}"/>${serif ? T(0, s * .34, s * 1.15, txt, { c, w: 400, f: SERIF, it: 1, ls: 0 }) : T(0, s * .36, s, txt, { c, w: 600 })}</g>`;

/* Rivka: bottom of frame, cropped like the reference presenter */
const rivka = (pose, x = 112, w = 300, glow) => RIVKA({ ...POSE[pose], glowc: glow === undefined ? (['thumb', 'laugh', 'mug'].includes(pose) ? GREEN : ['shock', 'worry'].includes(pose) ? RED : GOLD) : glow }, x, H - w * 1.1 + 6, w);
/* monk poses (monk-lib.js MPOSE) + aliases so Rivka-era scene code keeps working: crossed = palms together, skeptic; mug = beads */
const POSE = { ...MP,
  crossed: { ...MP.calm, eyes: undefined, exp: 'smirk', brows: 'skeptic', look: [2, 0] },
  mug: { ...MP.beads, eyes: undefined, exp: 'open', brows: 'up' },
};
const TILT = { shock: -3, crossed: 4, mug: -2, point: -4.5, phone: 3, worry: 5, thumb: -4, laugh: 3.5, explain: -2.5, calm: 2.5, beads: -2, laptop: 0 };
const grid30 = (st, x0 = 52, y0 = 210, dx = 49, dy = 40) => Array.from({ length: 30 }, (_, i) => bldg(x0 + (i % 6) * dx, y0 + Math.floor(i / 6) * dy, .82, typeof st === 'function' ? st(i) : st)).join('');


/* =====================================================================
   MOTION ENGINE (v3, 2026-11-17) — reference-reel motion language.
   See ANIMATION-PLAN.md. Captions = narration word by word, Rivka fixed,
   halftone wipes between acts, pop / drop / fly / slam entrances.
   ===================================================================== */
const RX = 112, RW = 300, RY = H - RW * 1.1 + 6;           // Rivka is fixed for the whole film
const J = o => JSON.stringify(o);
const TO = '"50% 50%"';
/* v5 MORPHS: outgoing main object → ink blob → next scene's main object. rect = [x,y,w,h,rx,ry] */
const MORPHS = {
  s03: { from: [168, 150, 196, 236, 10, 10], to: [26, 148, 348, 262, 10, 10], next: 's04', tgt: 'dos', fill: ['#fbfaf7', '#1b1917'] },
  s06: { from: [34, 222, 332, 160, 10, 10], to: [146, 211.3, 108, 113.4, 24, 24], next: 's07', tgt: 't2', fill: ['#fbfaf7', '#161412'] },
  s08: { from: [96, 158, 208, 208, 104, 104], to: [26, 150, 160, 130, 10, 10], next: 's09', tgt: 'c1', fill: ['#efece6', '#fbfaf7'] },
  s09: { from: [26, 150, 348, 250, 10, 10], to: [26, 286, 348, 106, 10, 10], next: 's10', tgt: 'bar' },
  s10: { from: [26, 286, 348, 106, 10, 10], to: [26, 150, 348, 150, 10, 10], next: 's11', tgt: 'tl' },
  s11: { from: [76, 325, 148, 50, 25, 25], to: [200, 206, 170, 156, 10, 10], next: 's12', tgt: 'login' },
  s13: { from: [60, 172, 280, 190, 10, 10], to: [155, 227, 90, 90, 22, 22], next: 's14', tgt: 'bot' },
  s14: { from: [60, 154, 280, 236, 140, 118], to: [136, 347, 128, 9, 4.5, 4.5], next: 's15', tgt: 'scale', fill: ['#fbfaf7', '#efece6'] },
};
for (const k in MORPHS) delete MORPHS[k];   // morph table is per film: add {sNN:{from,to,next,tgt,fill}} entries for this film
const MORPH_IN = Object.fromEntries(Object.entries(MORPHS).map(([k, v]) => [v.next, v]));
function Scene(id, dur, o = {}) {
  const s = { id, dur, A: [], htIn: !!o.htIn, htOut: !!o.htOut, push: !!o.push && !MORPHS[id], moOut: MORPHS[id], moIn: MORPH_IN[id], shots: [], cuts: [], words: [], keys: [], fx: '' };
  s.q = n => `#${id}-${n}`;
  s.W = (n, svg, extra = '') => `<g id="${id}-${n}"${extra}><g id="${id}-${n}-d"><g id="${id}-${n}-w">${svg}</g></g></g>`;
  s.a = c => s.A.push(c);
  return s;
}
const r3 = v => +(+v).toFixed(3);
/* entrances (fromTo, immediateRender → hidden until they start) */
const KINDS = {
  pop: [{ opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .213, ease: 'back.out(2.2)' }],
  pophard: [{ opacity: 0, scale: .2 }, { opacity: 1, scale: 1, duration: .18, ease: 'back.out(3)' }],
  drop: [{ opacity: 0, y: -80, rotation: -7 }, { opacity: 1, y: 0, rotation: 0, duration: .246, ease: 'back.out(1.5)' }],
  up: [{ opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: .213, ease: 'power3.out' }],
  left: [{ opacity: 0, x: -170 }, { opacity: 1, x: 0, duration: .197, ease: 'power3.out' }],
  right: [{ opacity: 0, x: 170 }, { opacity: 1, x: 0, duration: .197, ease: 'power3.out' }],
  fade: [{ opacity: 0 }, { opacity: 1, duration: .18, ease: 'none' }],
  slam: [{ opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: .107, ease: 'power4.in' }],
  big: [{ opacity: 0, scale: 1.9, rotation: -14 }, { opacity: 1, scale: 1, rotation: 0, duration: .369, ease: 'back.out(1.6)' }],
  morph: [{ opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .18, ease: 'back.out(2)' }],
  grow: [{ opacity: 0, scaleX: 0, transformOrigin: '0% 50%' }, { opacity: 1, scaleX: 1, duration: .246, ease: 'power2.out', transformOrigin: '0% 50%' }],
};
function IN(s, n, t, kind = 'pop', ov = {}) {
  const [f, to] = KINDS[kind];
  const TOR = f.transformOrigin || '50% 50%';
  const sel = n.startsWith('#') || n.includes(',') ? n : s.q(n);
  s.a(`tl.fromTo(${J(sel)},${J({ transformOrigin: TOR, ...f, ...(ov.from || {}) })},${J({ transformOrigin: TOR, ...to, ...(ov.to || {}) })},${r3(t)});`);
}
const STAG = (s, names, t, step, kind, ov) => names.forEach((n, i) => IN(s, n, t + i * step, kind, ov));
function TOO(s, n, t, props) { const sel = n.startsWith('#') ? n : s.q(n); s.a(`tl.to(${J(sel)},${J({ transformOrigin: '50% 50%', ...props })},${r3(t)});`); }
function MOVE(s, n, t, from, to) { const sel = n.startsWith('#') ? n : s.q(n); s.a(`tl.fromTo(${J(sel)},${J({ transformOrigin: '50% 50%', ...from })},${J({ transformOrigin: '50% 50%', immediateRender: false, ...to })},${r3(t)});`); }
function OUT(s, n, t, d = .12) { TOO(s, n, t, { opacity: 0, scale: .85, duration: d, ease: 'power2.in' }); }
function SET(s, n, t, props) { const sel = n.startsWith('#') ? n : s.q(n); s.a(`tl.set(${J(sel)},${J(props)},${r3(t)});`); }
function SHAKE(s, n, t, a = 3) { const sel = s.q(n); [a, -a, a * .6, -a * .4, 0].forEach((x, i) => s.a(`tl.set(${J(sel)},{x:${x}},${r3(t + i * .035)});`)); }
function JITTER(s, n, t0, t1, a = 2.4) { const sel = s.q(n); let k = 0; for (let t = t0; t < t1; t += .45, k++) { const x = [a, -a, a * .5][k % 3]; s.a(`tl.set(${J(sel)},{x:${x}},${r3(t)});tl.set(${J(sel)},{x:0},${r3(t + .07)});`); } }
function DRAW(s, n, t, d = .4, ease = 'power2.inOut') { const sel = s.q(n); s.a(`tl.fromTo(${J(sel)},{attr:{"stroke-dashoffset":1}},{attr:{"stroke-dashoffset":0},duration:${d},ease:"${ease}"},${r3(t)});`); }
function COUNT(s, n, t, from, to, d = .8) { const sel = s.q(n); s.a(`tl.fromTo(${J(sel)},{textContent:${from}},{textContent:${to},snap:{textContent:1},duration:${d},ease:"power2.out"},${r3(t)});`); }
function PULSE(s, n, t, k = 1.08) { MOVE(s, n, t, { scale: 1 }, { scale: k, duration: .12, ease: 'power2.out', yoyo: true, repeat: 1 }); }
/* ---------- MICRO layer (v4) ---------- */
const hsh = str => { let h = 7; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 9973; return h / 9973; };
/* DRIFT: endless float on the inner wrapper of every main prop */
function DRIFT(s, names, t0 = 0) {
  names.forEach(n => { const h = hsh(s.id + n), per = 1.5 + h * .8, rot = (h > .5 ? 1 : -1) * (1.8 + h * 1.2), reps = Math.max(1, Math.ceil((s.dur * 1.3 - t0) / per));
    s.a(`tl.fromTo("${s.q(n)}-d",{rotation:0,y:0,scale:1,transformOrigin:"50% 50%"},{rotation:${rot.toFixed(2)},y:${(-3 - h * 3).toFixed(1)},scale:1.035,transformOrigin:"50% 50%",duration:${per.toFixed(2)},ease:"sine.inOut",yoyo:true,repeat:${reps},immediateRender:false},${r3(t0)});`); });
}
/* WIGGLE (v6): AE-style wiggle(freq, amp) — smooth deterministic random rotation + position on the -w wrapper */
function WIGGLE(s, sel, { f = 5, a = 2.2, p = 1.8, t0 = 0 } = {}) {
  const st = 1 / f, n = Math.ceil((s.dur * 1.3 - t0) / st) + 1, v = k => { const h1 = hsh(sel + 'r' + k), h2 = hsh(sel + 'x' + k), h3 = hsh(sel + 'y' + k); return { rotation: r3((h1 * 2 - 1) * a), x: r3((h2 * 2 - 1) * p), y: r3((h3 * 2 - 1) * p) }; };
  for (let k = 0; k < n; k++) s.a(`tl.fromTo("${sel}",${J({ ...v(k), transformOrigin: '50% 50%' })},${J({ ...v(k + 1), transformOrigin: '50% 50%', duration: r3(st), ease: 'sine.inOut', immediateRender: k === 0 })},${r3(t0 + k * st)});`);
}
const WIGGLY = ['stamp', 'st0', 'st1', 'st2', 't1', 't2', 'b1', 'vs', 'qq', 'chip', 'bub', 'b0', 'slot', 'tool0', 'tool1', 'tool2', 'pub', 'news', 'big', 'arrow', 'key', 'cur', 'btn', 'tl', 'login', 'cal', 'rep', 'tape', 'dos', 'map', 'bot', 'hoodg', 'shield', 'a0', 'a1', 'a2', 'disc', 'num', 'pct', 'bar', 'c1', 'c2', 'c3', 'k1', 'k2', 'k3', 'good', 'bad', 'p0', 'p1', 'scale', 'atk', 'sc', 'moon', 'tk0', 'tk1', 'tk2', 'tk3', 'tk4', 'tk5', 'h0', 'h1', 'h2', 'botg', 'botb', 'hb', 'minibot', 'burst'];
/* BUMP: parent card reacts when a child lands */
function BUMP(s, n, t, k = 1.035) { s.a(`tl.fromTo("${s.q(n)}",{scale:1,transformOrigin:"50% 50%"},{scale:${k},transformOrigin:"50% 50%",duration:.07,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`); }
/* RING: hand-drawn red ellipse that hops from target to target  hops=[[t,x,y,rx,ry,hold]] */
function RINGS(s, hops, c = RED) {
  hops.forEach(([t, x, y, rx, ry, hold = .45], i) => { const n = `${s.id}-rg${i}`, rot = (i % 2 ? 7 : -9);
    s.fx += `<g id="${n}" opacity="0"><ellipse id="${n}e" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width="2" pathLength="1" stroke-dasharray="1.08" stroke-dashoffset="1.08" transform="rotate(${rot} ${x} ${y})"/><ellipse cx="${x}" cy="${y}" rx="${rx + 3}" ry="${ry + 2}" fill="none" stroke="${c}" stroke-width="1" opacity=".35" transform="rotate(${rot + 4} ${x} ${y})"/></g>`;
    s.a(`tl.set("#${n}",{opacity:1},${r3(t)});tl.fromTo("#${n}e",{attr:{"stroke-dashoffset":1.08}},{attr:{"stroke-dashoffset":0},duration:.2,ease:"power2.out"},${r3(t)});tl.to("#${n}",{opacity:0,scale:1.08,transformOrigin:"50% 50%",duration:.12},${r3(t + .2 + hold)});`); });
}
/* SPARK: tiny accents that pop and vanish  kind: burst | bang | q | plus | check | dots */
function SPARK(s, t, x, y, kind = 'burst', c = RED) {
  const n = `${s.id}-sk${s.fx.length % 100000}`; let g = '';
  if (kind === 'burst') g = [0, 1, 2, 3, 4].map(i => { const a = -Math.PI * (.15 + i * .175); return `<line x1="${(x + Math.cos(a) * 9).toFixed(1)}" y1="${(y + Math.sin(a) * 9).toFixed(1)}" x2="${(x + Math.cos(a) * 17).toFixed(1)}" y2="${(y + Math.sin(a) * 17).toFixed(1)}" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`; }).join('');
  if (kind === 'bang') g = `<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="${INK}" stroke-width="1.4"/>${T(x, y + 4.5, 13, '!', { c: '#fff', w: 700 })}`;
  if (kind === 'q') g = `<rect x="${x - 9}" y="${y - 10}" width="18" height="20" rx="6" fill="${CARD}" stroke="${INK}" stroke-width="1.4"/>${T(x, y + 5, 13, '?', { c, w: 700 })}`;
  if (kind === 'plus') g = `<path d="M${x - 6} ${y} h12 M${x} ${y - 6} v12" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (kind === 'check') g = check(x, y, 7, c);
  if (kind === 'dots') g = [0, 1, 2].map(i => `<circle cx="${x + i * 7}" cy="${y - i * 3}" r="${2.2 - i * .4}" fill="${c}"/>`).join('');
  s.fx += `<g id="${n}" opacity="0">${g}</g>`;
  s.a(`tl.fromTo("#${n}",{opacity:0,scale:.3,transformOrigin:"50% 50%"},{opacity:1,scale:1,transformOrigin:"50% 50%",duration:.14,ease:"back.out(3)"},${r3(t)});tl.to("#${n}",{opacity:0,y:-6,duration:.16},${r3(t + .45)});`);
}
/* TICK: a counter that keeps running for the whole scene */
function TICK(s, n, t0, t1, from, to) { s.a(`tl.fromTo("${s.q(n)}",{textContent:${from}},{textContent:${to},snap:{textContent:1},duration:${r3(t1 - t0)},ease:"none"},${r3(t0)});`); }
/* small fx */
const speed = (n, x, y, dir = 1, c = INK) => `<g id="${n}" opacity="0">${[-8, 0, 8].map((dy, i) => `<line x1="${x}" y1="${y + dy}" x2="${x + dir * (26 - i * 5)}" y2="${y + dy}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`).join('')}</g>`;
function SPEED(s, n, t) { s.a(`tl.fromTo(${J(s.q(n))},{opacity:1,x:0},{opacity:0,x:${-14},duration:.28,ease:"power1.out"},${r3(t)});`); }
const dust = (n, x, y, w) => `<g id="${n}" opacity="0" fill="#bdb6aa">${[-1, 1].map(k => `<ellipse cx="${x + k * w / 2}" cy="${y}" rx="9" ry="5"/><ellipse cx="${x + k * (w / 2 + 9)}" cy="${y - 3}" rx="6" ry="4"/>`).join('')}</g>`;
function DUST(s, n, t) { s.a(`tl.fromTo(${J(s.q(n))},{opacity:.9,scale:.4,transformOrigin:"50% 100%"},{opacity:0,scale:1.5,duration:.4,ease:"power2.out"},${r3(t)});`); }
const ring = (n, cx, cy, r, c = RED, w = 1.8) => `<circle id="${n}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 ${cx} ${cy})"/>`;
const BADGE = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(-8)"><rect x="-36" y="-15" width="72" height="36" rx="6" fill="${CARD}" stroke="${INK}" stroke-width="2"/><rect x="-36" y="-15" width="72" height="11" rx="5" fill="${GREEN}"/>${T(0, 3.5, 7, 'SECURITY', { c: INK, w: 700, ls: .8 })}${T(0, 14, 6.6, 'TESTER ✓', { c: GREEN, w: 700, ls: .6 })}</g>`;

/* ---------- SPIRIT KIT (monk-spiritual-video, 2026-11-18): breath, energy, chakras, meditation ----------
   Same paper/ink look as every other prop: CARD fill, ink outline, one soft shadow, mono labels. */
const PEACH = '#f4c4b4', SKY = '#2c8fd6', INDIGO = '#4b48b8', VIOLET = '#8e4fc4', ORANGE = '#f07c1e';
const CHAKRAS = [['ROOT', RED, 4], ['SACRAL', ORANGE, 6], ['SOLAR PLEXUS', '#e8b417', 10], ['HEART', GREEN, 12], ['THROAT', SKY, 16], ['THIRD EYE', INDIGO, 2], ['CROWN', VIOLET, 20]];
/* chakra wheel i = 0 root … 6 crown */
const chakraIcon = (x, y, r, i) => { const [, c, n] = CHAKRAS[i];
  return `<g transform="translate(${x} ${y})">${rot(n, () => `<path d="${vesica(r * 1.06, r * (n > 12 ? .2 : n === 2 ? .55 : .32))}" fill="${c}" stroke="${INK}" stroke-width="1.3"/>`)}<circle r="${r * .64}" fill="${CARD}" stroke="${INK}" stroke-width="2"/><circle r="${r * .38}" fill="${c}"/><circle r="${r * .13}" cx="${-r * .12}" cy="${-r * .12}" fill="#fff" opacity=".6"/></g>`; };
/* lungs (breath) */
const lungs = (x, y, k = 1) => { const lobe = `M-9 -38 C-32 -46 -58 -10 -56 30 C-54 54 -30 60 -12 50 C-6 28 -4 0 -9 -38Z`;
  return `<g transform="translate(${x} ${y}) scale(${k})"><path d="${lobe}" fill="${PEACH}" stroke="${INK}" stroke-width="2.4"/><path d="${lobe}" transform="scale(-1 1)" fill="${PEACH}" stroke="${INK}" stroke-width="2.4"/>
  <path d="M0 -72 V-30 M0 -30 C-6 -22 -14 -18 -22 -6 M0 -30 C6 -22 14 -18 22 -6 M-22 -6 l-12 14 M-22 -6 l2 18 M22 -6 l12 14 M22 -6 l-2 18" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="-36" cy="-6" rx="8" ry="14" fill="#fff" opacity=".45"/><ellipse cx="30" cy="-6" rx="7" ry="13" fill="#fff" opacity=".3"/></g>`; };
/* breath orb: soft gold core in a dashed ring (scale it to breathe) */
const breathOrb = (x, y, r) => `${htField(x, y, r * 1.45, GOLD, .55, 8, 3.6)}<circle cx="${x}" cy="${y}" r="${r}" fill="${CARD}" stroke="${INK}" stroke-width="2.4"/><circle cx="${x}" cy="${y}" r="${r * .78}" fill="${GOLD}" opacity=".9"/><circle cx="${x}" cy="${y}" r="${r * 1.16}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="3 6"/><ellipse cx="${x - r * .3}" cy="${y - r * .34}" rx="${r * .22}" ry="${r * .12}" fill="#fff" opacity=".5" transform="rotate(-30 ${x - r * .3} ${y - r * .34})"/>`;
/* lotus flower */
const lotus = (x, y, k = 1, c = PEACH) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="10" rx="70" ry="12" fill="${GREEN}" stroke="${INK}" stroke-width="2"/>
  ${[-64, -32, 32, 64].map(a => `<path d="${vesica(64, 22)}" transform="rotate(${a})" fill="${c}" stroke="${INK}" stroke-width="2"/>`).join('')}
  ${[-18, 18].map(a => `<path d="${vesica(70, 24)}" transform="rotate(${a})" fill="${CARD}" stroke="${INK}" stroke-width="2"/>`).join('')}<path d="${vesica(78, 24)}" fill="${CARD}" stroke="${INK}" stroke-width="2"/>
  <path d="M0 -6 V-60" stroke="${c}" stroke-width="2" opacity=".8"/><circle cx="0" cy="-4" r="9" fill="${GOLD}" stroke="${INK}" stroke-width="1.6"/></g>`;
/* singing bowl on a cushion */
const bowl = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-66" y="44" width="132" height="22" rx="11" fill="${RED}" stroke="${INK}" stroke-width="2"/>
  <path d="M-60 0 C-60 40 -30 54 0 54 C30 54 60 40 60 0Z" fill="${GOLD}" stroke="${INK}" stroke-width="2.4"/><ellipse cx="0" cy="0" rx="60" ry="12" fill="#c98a12" stroke="${INK}" stroke-width="2.4"/><ellipse cx="0" cy="2" rx="48" ry="7" fill="#8f5f0c"/>
  <path d="M-44 14 C-40 32 -26 42 -10 46" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/><rect x="40" y="-46" width="10" height="70" rx="5" fill="#8a5a34" stroke="${INK}" stroke-width="2" transform="rotate(32 45 -10)"/></g>`;
const waves = (id, x, y, n = 3, c = GOLD) => Array.from({ length: n }, (_, i) => `<path id="${id}${i}" d="M${x - 30 - i * 18} ${y - i * 4} Q${x} ${y - 30 - i * 16} ${x + 30 + i * 18} ${y - i * 4}" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`).join('');
/* candle */
const candle = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-16" y="-10" width="32" height="70" rx="5" fill="${CARD}" stroke="${INK}" stroke-width="2.2"/><path d="M-16 -4 C-10 6 -6 -2 0 8 C6 18 10 0 16 2 V-10 H-16Z" fill="#fff" stroke="${INK}" stroke-width="1.4"/><path d="M0 -10 V-18" stroke="${INK}" stroke-width="2"/>
  <path d="${vesica(34, 11)}" transform="translate(0 -16)" fill="${GOLD}" stroke="${INK}" stroke-width="1.6"/><path d="${vesica(18, 5)}" transform="translate(0 -17)" fill="${ORANGE}"/></g>`;
/* energy rays around a point */
const rays = (x, y, r0, r1, n = 12, c = GOLD, w = 3) => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n; return `<line x1="${(x + Math.cos(a) * r0).toFixed(1)}" y1="${(y + Math.sin(a) * r0).toFixed(1)}" x2="${(x + Math.cos(a) * r1).toFixed(1)}" y2="${(y + Math.sin(a) * r1).toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; }).join('');
/* a head in profile — busy (red scribble) or calm (green wave) mind inside */
const headProfile = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-42 58 C-50 22 -54 -22 -32 -46 C-10 -68 32 -66 50 -40 C60 -24 58 -8 64 4 L54 10 C55 20 52 30 44 32 C42 44 32 50 18 48 L16 64Z" fill="${CARD}" stroke="${INK}" stroke-width="2.4"/></g>`;
const busyMind = (x, y) => `<path d="M${x - 30} ${y} l8 -16 l6 22 l8 -26 l6 30 l8 -24 l6 18 l8 -12" stroke="${RED}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x - 22}" cy="${y - 26}" r="4" fill="${RED}"/><circle cx="${x + 26}" cy="${y + 20}" r="3" fill="${RED}"/>`;
const calmMind = (x, y) => `<path d="M${x - 32} ${y} q8 -10 16 0 t16 0 t16 0 t16 0" stroke="${GREEN}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
/* breathing: scale an element in (inhale) / out (exhale) */
function BREATHE(s, n, t, d, from, to) { MOVE(s, n, t, { scale: from }, { scale: to, duration: d, ease: 'sine.inOut' }); }
/* a little seated monk as a prop (full body, no glow) */
const miniMonk = (x, y, w, pose = 'meditate') => MONKFULL({ ...FPOSE[pose], glowc: null, shadowOp: .5 }, x, y, w);
WIGGLY.push('head', 'lungs', 'orb', 'lotus', 'bowl', 'candle', 'ck0', 'ck1', 'ck2', 'ck3', 'ck4', 'ck5', 'ck6', 'root', 'crown', 'n4', 'n7', 'n8', 'mm');

/* ---------- captions: narration word by word (*red* _green_ key words) ---------- */
const CAP_S = 27, CAP_W = 344, CAP_Y = 124, STAGE_Y = 30, CLIP_Y = 138;   // v6: captions lower, stage moved down, stage clipped under captions
function captions(s, phrases, t0 = .12, t1) {
  t1 = t1 ?? s.dur - .2;
  const toks = phrases.map(p => { const out = []; let style = 0; p.split(' ').forEach(w => { let st = style; if (w.startsWith('*')) { st = 1; w = w.slice(1); } else if (w.startsWith('_')) { st = 2; w = w.slice(1); }
    let endStyle = st; if (w.endsWith('*') || /\*[.,?!]?$/.test(w)) { w = w.replace(/\*([.,?!]?)$/, '$1'); endStyle = 0; } else if (/_[.,?!]?$/.test(w)) { w = w.replace(/_([.,?!]?)$/, '$1'); endStyle = 0; } else endStyle = st;
    out.push({ w, st }); style = endStyle; }); return out; });
  const chars = toks.flat().reduce((a, k) => a + k.w.length + 1, 0);
  const gap = .16, span = t1 - t0 - gap * (phrases.length - 1), per = span / chars;
  const WT = s.wt && s.wt.length === toks.flat().length ? s.wt : null; if (s.wt && !WT) console.warn(`captions ${s.id}: ${toks.flat().length} tokens vs ${s.wt.length} spoken words — proportional timing`);
  let t = t0, svg = '', wi = 0, prevSt = 0;
  toks.forEach((ws, pi) => {
    const lines = [[]]; let lw = 0;
    ws.forEach(k => { const cw = k.st ? CAP_S * .5 : CAP_S * .5; const w = (k.w.length + 1) * cw; if (lw + w > CAP_W && lines.at(-1).length) { lines.push([]); lw = 0; } lines.at(-1).push(k); lw += w; });
    const pstart = t;
    let g = '';
    lines.forEach((ln, li) => {
      g += `<text x="28" y="${(CAP_Y + li * CAP_S * 1.13).toFixed(1)}" font-family="${SANS}" font-weight="600" font-size="${CAP_S}" fill="${INK}" letter-spacing="-0.6">`;
      ln.forEach(k => {
        const wid = `${s.id}-w${wi++}`, dur = (k.w.length + 1) * per;
        g += k.st ? `<tspan id="${wid}" fill-opacity="0" font-family="${SERIF}" font-style="italic" font-weight="400" font-size="${(CAP_S * 1.14).toFixed(1)}" fill="${k.st === 2 ? GREEN : RED}" letter-spacing="-0.2">${esc(k.w)} </tspan>` : `<tspan id="${wid}" fill-opacity="0">${esc(k.w)} </tspan>`;
        if (WT) t = WT[wi - 1][0];
        s.a(`tl.fromTo("#${wid}",{attr:{"fill-opacity":0}},{attr:{"fill-opacity":1},duration:.1,ease:"none"},${r3(t)});`);
        s.words.push(WT ? [t, WT[wi - 1][1]] : [t, t + dur * .92]); if (k.st && !(prevSt)) s.keys.push(t); prevSt = k.st;
        t += dur;
      });
      g += '</text>';
    });
    svg += `<g id="${s.id}-cp${pi}">${g}</g>`;
    if (pi < toks.length - 1) s.a(`tl.set("#${s.id}-cp${pi}",{opacity:0},${r3(WT ? WT[wi][0] - .02 : t + gap)});`);
    t += gap;
  });
  return svg;
}

/* ---------- Rivka: fixed, talking, blinking, gesture changes every ~0.6s, sway, nods ---------- */
const CLOSED = p => { const e = POSE[p].mouth || POSE[p].exp; return e === 'o' ? 'shush' : e === 'laugh' ? 'open' : 'smirk'; };
function poseSeq(s, rv) {
  /* rv = [[t, pose | [pool]], ...] → change pose on a word start every >= .55s, cycling the pool */
  const out = []; const starts = s.words.map(w => w[0]);
  rv.forEach(([t0, pool], si) => { pool = Array.isArray(pool) ? pool : [pool]; const t1 = rv[si + 1] ? rv[si + 1][0] : s.dur;
    out.push([t0, pool[0]]); let last = t0, k = 0;
    if (pool.length > 1) starts.forEach(ts => { if (ts > last + .55 && ts < t1 - .3) { k = (k + 1) % pool.length; out.push([ts, pool[k]]); last = ts; } }); });
  return out;
}
function rivkaBlock(s, rv, glow) {
  const seq = poseSeq(s, rv);
  const poses = [...new Set(seq.map(x => x[1]))];
  let svg = '';
  poses.forEach(p => {
    const base = POSE[p];
    const V = { o: base, c: { ...base, mouth: CLOSED(p) }, b: { ...base, eyes: undefined, exp: 'laugh', mouth: CLOSED(p) }, w: { ...base, eyes: 'wink', mouth: CLOSED(p) } };
    ['c', 'o', 'b', 'w'].forEach(v => { svg += `<g id="${s.id}-rv-${p}-${v}" opacity="0">${RIVKA({ ...V[v], glowc: null }, RX, RY, RW)}</g>`; });
  });
  const p0 = Array.isArray(rv[0][1]) ? rv[0][1][0] : rv[0][1];
  const gc = glow || (['thumb', 'laugh', 'mug'].includes(p0) ? GREEN : ['shock', 'worry'].includes(p0) ? RED : GOLD);
  const k = RW / 400, hx = RX + 200 * k, hy = RY + 205 * k;
  const glowSvg = `<g id="${s.id}-rglow">${htField(RX + 212 * k, RY + 236 * k, 178 * k, gc, .42, 5.6, 2.4)}</g>`;
  const state = t => {
    let p = seq[0][1]; for (const [ts, pp] of seq) if (t >= ts) p = pp;
    const talking = s.words.find(([a, b]) => t >= a && t < b);
    let v = 'c'; if (talking && ((t - talking[0]) % .17) < .1) v = 'o';
    const bt = (t - .7) % 1.9, bi = Math.floor((t - .7) / 1.9); if (t > .7 && bt >= 0 && bt < .1) v = bi % 3 === 1 ? 'w' : 'b';
    if (bi % 3 === 1 && bt >= 0 && bt < .22 && t > .7) v = 'w';
    return `${p}-${v}`;
  };
  let prev = null;
  poses.forEach(p => ['c', 'o', 'b', 'w'].forEach(v => s.a(`tl.set("#${s.id}-rv-${p}-${v}",{opacity:0},0);`)));
  for (let f = 0; f <= Math.round(s.dur * 30); f++) {
    const t = f / 30, st = state(t);
    if (st !== prev) { if (prev) s.a(`tl.set("#${s.id}-rv-${prev}",{opacity:0},${r3(t)});`); s.a(`tl.set("#${s.id}-rv-${st}",{opacity:1},${r3(t)});`); prev = st; }
  }
  /* gesture pop on every pose change */
  seq.slice(1).forEach(([t], i) => s.a(`tl.fromTo("#${s.id}-rvpop",{y:10,scale:.965,transformOrigin:"50% 100%"},{y:0,scale:1,transformOrigin:"50% 100%",duration:.2,ease:"back.out(2.6)",immediateRender:false},${r3(t)});`));
  /* nod + pop lines around the head on every key word */
  let fx = '';
  s.keys.forEach((t, i) => {
    s.a(`tl.fromTo("#${s.id}-rvnod",{rotation:0,svgOrigin:"${hx} ${RY + 440 * k}"},{rotation:${i % 2 ? 2.6 : -2.6},svgOrigin:"${hx} ${RY + 440 * k}",duration:.1,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`);
    const n = `${s.id}-hfx${i}`, side = i % 2 ? 1 : -1;
    fx += `<g id="${n}" opacity="0">${[0, 1, 2].map(j => { const a = -Math.PI / 2 + side * (.55 + j * .32); return `<line x1="${(hx + Math.cos(a) * 92).toFixed(1)}" y1="${(hy + Math.sin(a) * 96).toFixed(1)}" x2="${(hx + Math.cos(a) * 108).toFixed(1)}" y2="${(hy + Math.sin(a) * 112).toFixed(1)}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`; }).join('')}</g>`;
    s.a(`tl.fromTo("#${n}",{opacity:0,scale:.6,transformOrigin:"50% 50%"},{opacity:1,scale:1,transformOrigin:"50% 50%",duration:.1},${r3(t)});tl.to("#${n}",{opacity:0,duration:.12},${r3(t + .32)});`);
    s.a(`tl.fromTo("#${s.id}-campunch",{scale:1,svgOrigin:"200 300"},{scale:1.03,svgOrigin:"200 300",duration:.08,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`);
  });
  /* sway (rotation around the feet) + breath bob */
  const n = Math.max(1, Math.ceil(s.dur / 1.1));
  s.a(`tl.fromTo("#${s.id}-rvsway",{rotation:-2.2,svgOrigin:"${hx} ${H + 40}"},{rotation:2.2,svgOrigin:"${hx} ${H + 40}",duration:1.1,ease:"sine.inOut",yoyo:true,repeat:${n}},0);`);
  s.a(`tl.fromTo("#${s.id}-rvbob",{y:0},{y:-4,duration:.55,ease:"sine.inOut",yoyo:true,repeat:${n * 2}},0);`);
  /* v5 head rig: tilt per pose, nod on key words, wobble out of phase with the sway */
  const HS = `#${s.id}-rvpop`, tilt = (p, i) => (TILT[p] ?? 0) + (i % 2 ? 1.2 : -1.2);
  let pa = tilt(seq[0][1], 0);
  s.a(`tl.set("${HS} .rhd",{attr:{transform:"rotate(${pa} 200 322)"}},0);`);
  seq.slice(1).forEach(([t, p], i) => { const na = +tilt(p, i + 1).toFixed(2);
    s.a(`tl.fromTo("${HS} .rhd",{attr:{transform:"rotate(${pa} 200 322)"}},{attr:{transform:"rotate(${na} 200 322)"},duration:.26,ease:"back.out(1.8)",immediateRender:false},${r3(t)});`); pa = na; });
  s.keys.forEach((t, i) => s.a(`tl.fromTo("${HS} .rhn",{attr:{transform:"translate(0 0) rotate(0 200 322)"}},{attr:{transform:"translate(0 4) rotate(${i % 2 ? -3 : 3} 200 322)"},duration:.1,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`));
  s.a(`tl.fromTo("${HS} .rhw",{attr:{transform:"rotate(-1.3 200 322)"}},{attr:{transform:"rotate(1.3 200 322)"},duration:.75,ease:"sine.inOut",yoyo:true,repeat:${Math.ceil(s.dur / .75)}},0);`);
  s.a(`tl.fromTo("#${s.id}-rglow",{scale:1,transformOrigin:"50% 50%"},{scale:1.06,transformOrigin:"50% 50%",duration:.9,ease:"sine.inOut",yoyo:true,repeat:${Math.ceil(s.dur / .9)}},0);`);
  return `${glowSvg}<g id="${s.id}-rvsway"><g id="${s.id}-rvbob"><g id="${s.id}-rvnod"><g id="${s.id}-rvpop"><g id="${s.id}-rvwig">${svg}</g></g></g></g></g>${fx}`;
}

/* ---------- halftone wipe overlay (between acts) ---------- */
function htWipe(s) {
  const id = s.id;
  let svg = `<defs><pattern id="${id}-hw" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle id="${id}-hwc" cx="6.5" cy="6.5" r="0" fill="${INK}"/></pattern></defs>
  <rect width="${W}" height="${H}" fill="url(#${id}-hw)" pointer-events="none"/><rect id="${id}-hws" width="${W}" height="${H}" fill="${INK}" opacity="0"/>`;
  if (s.htIn) { s.a(`tl.fromTo("#${id}-hws",{opacity:1},{opacity:0,duration:.06,ease:"none"},0);`); s.a(`tl.fromTo("#${id}-hwc",{attr:{r:8.6}},{attr:{r:0},duration:.45,ease:"power2.out"},.02);`); }
  if (s.htOut) { s.a(`tl.fromTo("#${id}-hwc",{attr:{r:0}},{attr:{r:9.6},duration:.36,ease:"power2.in",immediateRender:false},${r3(s.dur - .42)});`); s.a(`tl.fromTo("#${id}-hws",{opacity:0},{opacity:1,duration:.06,ease:"none",immediateRender:false},${r3(s.dur - .07)});`); }
  return svg;
}
/* push-out: every prop group shrinks away in the last 0.16s */
function pushOut(s, names) { if (!s.push) return; names.forEach((n, i) => OUT(s, n, s.dur - .2 + i * .012, .15)); }

/* ---------- v6 SHOTS: no composition may hold longer than 1.5s ----------
   CAMTO reframes the whole stage (zoom/pan onto a detail); SHOT marks a content swap. */
function CAMTO(s, t, cx, cy, k, d = .22) {
  const x = r3(200 - k * cx), y = r3(290 - k * cy), [, pk, px, py] = s.shots.length ? s.shots.at(-1) : [0, 1, 0, 0];
  const M = (k, x, y) => `matrix(${k} 0 0 ${k} ${x} ${y})`;
  s.shots.push([t + d, k, x, y]); s.cuts.push(t);
  s.a(d ? `tl.fromTo("#${s.id}-shot",{attr:{transform:"${M(pk, px, py)}"}},{attr:{transform:"${M(k, x, y)}"},duration:${d},ease:"power3.inOut",immediateRender:false},${r3(t)});` : `tl.set("#${s.id}-shot",{attr:{transform:"${M(k, x, y)}"}},${r3(t)});`);
}
const CAMOUT = (s, t, d = .2) => CAMTO(s, t, 200, 290, 1, d);
const SHOT = (s, t) => s.cuts.push(t);
const shotAt = (s, t) => { let v = [0, 1, 0, 0]; for (const sh of s.shots) if (sh[0] <= t + 1e-6) v = sh; return v; };
/* photo print: duotone ink/paper photo in a white border with tape. Missing file → labelled placeholder slot */
const PHOTO_DESC = { towers: 'glass office towers', den: 'dark room full of screens', servers: 'server room', city_night: 'city at night', expert_m: 'security expert (portrait)', expert_f: 'security expert (portrait)', news: 'news headlines', report: 'real Anthropic report (screenshot)' };
function photo(id, name, x, y, w, h, { rot = 0, tape: tp = 1, b = 7 } = {}) {
  const f = `assets/photos/${name}.jpg`, has = fs.existsSync(path.join(ROOT, f)), pid = `${id}-ph${name}`;
  const iw = w - b * 2, ih = h - b * 2;
  const inner = has
    ? `<defs><filter id="${pid}f" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues=".086 .3 .94"/><feFuncG type="table" tableValues=".078 .28 .925"/><feFuncB type="table" tableValues=".07 .26 .9"/></feComponentTransfer></filter><clipPath id="${pid}c"><rect x="${b}" y="${b}" width="${iw}" height="${ih}"/></clipPath></defs><image href="${f}" x="${b}" y="${b}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${pid}c)" filter="url(#${pid}f)"/>`
    : `<rect x="${b}" y="${b}" width="${iw}" height="${ih}" fill="#cfc8bb"/><g opacity=".55">${htField(w / 2, h / 2, Math.max(iw, ih) * .55, '#8a8378', 1, 8, 2.6, ih / iw)}</g><rect x="${w / 2 - 70}" y="${h / 2 - 17}" width="140" height="34" rx="4" fill="${CARD}" stroke="${INK}" stroke-width="1"/>${MT(w / 2, h / 2 - 3, 8, 'PHOTO', RED, 'middle', 700)}${MT(w / 2, h / 2 + 10, 7, PHOTO_DESC[name] || name, INK, 'middle', 500)}`;
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><g filter="url(#${id}-sh)"><rect width="${w}" height="${h}" rx="3" fill="${CARD}" stroke="${LINE}" stroke-width="1"/></g>${inner}</g>${tp ? tape(x + w / 2, y + 2, rot - 4) : ''}`;
}
/* ---------- v5 morph: blob lives outside the camera so the push-in never jumps ---------- */
const RA = r => ({ x: r3(r[0]), y: r3(r[1]), width: r3(r[2]), height: r3(r[3]), rx: r3(r[4]), ry: r3(r[5]) });
function morphs(s) {
  if (!s.moOut && !s.moIn) return '';
  const id = `${s.id}-blob`;
  if (s.moIn) {
    s.a(`tl.set("#${id}",{attr:${J(RA(s.moIn.to))},opacity:1,fill:"${(s.moIn.fill || [CARD, CARD])[1]}"},0);tl.to("#${id}",{opacity:0,duration:.12,ease:"power1.in"},.03);`);
  }
  if (s.moOut) {
    const t0 = s.dur - .34, c = 1 + .08 * (t0 / s.dur), f = s.moOut.from, [, k, sx, sy] = shotAt(s, t0);
    const fs = [k * (200 + (f[0] - 200) * c) + sx, k * (290 + (f[1] - 290) * c) + sy, f[2] * c * k, f[3] * c * k, f[4] * c * k, f[5] * c * k];
    const cx = f[0] + f[2] / 2, cy = f[1] + f[3] / 2;   // svgOrigin is in cam-local space
    s.a(`tl.to("#${s.id}-mo",{opacity:0,scale:.6,svgOrigin:"${r3(cx)} ${r3(cy)}",duration:.2,ease:"power2.in"},${r3(t0)});`);
    s.a(`tl.fromTo("#${id}",{opacity:0},{opacity:1,duration:.08,ease:"none",immediateRender:false},${r3(t0)});`);
    const fl = s.moOut.fill || [CARD, CARD];
    s.a(`tl.fromTo("#${id}",{attr:${J(RA(fs))},fill:"${fl[0]}"},{attr:${J(RA(s.moOut.to))},fill:"${fl[1]}",duration:.3,ease:"back.inOut(1.3)",immediateRender:false},${r3(t0)});`);
  }
  const r0 = RA(s.moIn ? s.moIn.to : s.moOut.from);
  return `<rect id="${id}" x="${r0.x}" y="${r0.y}" width="${r0.width}" height="${r0.height}" rx="${r0.rx}" ry="${r0.ry}" fill="${CARD}" stroke="${INK}" stroke-width="2" opacity="0" data-layout-allow-overlap="true"/>`;
}
/* ---------- assemble ---------- */
function build(s, { hdr, cap, rv, glow, props, drift = [] }) {
  const capSvg = captions(s, cap);
  const propSvg = props(s);
  DRIFT(s, drift);
  const rvSvg = rivkaBlock(s, rv, glow);
  const present = [...new Set([...drift, ...WIGGLY])].filter(n => propSvg.includes(`id="${s.id}-${n}-w"`));
  present.forEach((n, i) => WIGGLE(s, `#${s.id}-${n}-w`, { f: 4 + (i % 3), a: /^(stamp|st\d|pub|vs|t1|t2|qq|slot|tool\d|chip|k\d)$/.test(n) ? 3.2 : 1.8, p: 1.6 }));
  WIGGLE(s, `#${s.id}-rvwig`, { f: 3.5, a: .9, p: 1.4 });
  s.a(`tl.fromTo("#${s.id}-cam",{scale:1,svgOrigin:"200 290"},{scale:1.08,svgOrigin:"200 290",duration:${r3(s.dur * (s.f || 1))},ease:"none"},0);`);
  const blob = morphs(s);
  const cuts = [0, ...s.cuts, s.dur].sort((a, b) => a - b), gap = Math.max(...cuts.slice(1).map((v, i) => v - cuts[i]));
  if (gap > 1.55) console.warn(`HOLD ${s.id}: ${gap.toFixed(2)}s without a shot change`);
  s.maxHold = gap;
  return `${paper(s.id)}${s.W('hdr', hdr)}<defs><clipPath id="${s.id}-stc"><rect x="-200" y="${CLIP_Y}" width="800" height="900"/></clipPath></defs><g transform="translate(0 ${STAGE_Y})" clip-path="url(#${s.id}-stc)"><g id="${s.id}-campunch"><g id="${s.id}-shot" transform="matrix(1 0 0 1 0 0)"><g id="${s.id}-cam"><g id="${s.id}-mo">${propSvg}${s.fx}</g></g></g></g>${blob}</g>${rvSvg}${s.W('cap', capSvg)}${htWipe(s)}`;
}
/* stamp punch: camera kick on a slam */
const HDRI = (s, left, label, id, val) => `${MT(28, 40, 8.6, left)}<text x="372" y="40" font-family="${MONO}" font-size="8.6" text-anchor="end" fill="${MUTE}" letter-spacing=".6">${esc(label)} <tspan id="${s.id}-${id}" fill="${RED}" font-weight="700">${esc(val)}</tspan></text>`;
function BUMPD(s, n, t, k = 1.08) { s.a(`tl.fromTo("${s.q(n)}-d",{scale:1,transformOrigin:"50% 50%"},{scale:${k},transformOrigin:"50% 50%",duration:.07,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`); }
const PUNCH = (s, t, k = 1.04) => s.a(`tl.fromTo("#${s.id}-campunch",{scale:1,svgOrigin:"200 300"},{scale:${k},svgOrigin:"200 300",duration:.06,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`);

/* ---------- narration (v7): take 2, sped up x1.12 → scenes and caption words follow the real speech ---------- */
const VO_SPEED = 1.12, VO_FILE = 'assets/vo/narration.mp3';
const VO_TR = fs.existsSync(path.join(ROOT, 'assets/vo/take.transcript.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/vo/take.transcript.json'), 'utf8')).map(w => ({ w: w.text, a: w.start / VO_SPEED, b: w.end / VO_SPEED })) : null;
const norm = w => w.toLowerCase().replace(/[^a-z0-9']/g, '');
/* ---------- scenes ---------- */
const S = [];
const add = (id, dur, vo, scene, motion, opts, def) => S.push({ id, dur, vo, scene, motion, opts, def });
/* DEMO scenes (spiritual) — a 12s worked example of the kit. Replace them with the new film's scenes. */
const TILE_C = [200, 268, 1.35, -4], CORNER = [52, 512, .5, 6];
const tileFly = (s, n, t) => MOVE(s, n, t, {}, { x: CORNER[0] - TILE_C[0], y: CORNER[1] - TILE_C[1], scale: CORNER[2] / TILE_C[2], rotation: CORNER[3] - TILE_C[3], duration: .3, ease: 'power3.inOut' });

add('s01', 2.6, 'Your breath is the remote control for your mind.', 'Breath controls the mind',
  'SHOT A (0–1.3): a head card drops in, a red scribble buzzing inside (busy mind). SHOT B (1.3–2.6): the camera slides to the lungs; the scribble turns into a calm green wave.',
  {}, s => build(s, {
    hdr: HDR('// 01 · breath', 'BREATHS', '0'), cap: ['Your *breath* is the', 'remote control for your _mind._'], rv: [[0, ['explain', 'point']], [1.4, ['calm', 'beads']]],
    drift: ['head', 'lungs'],
    props: s => {
      IN(s, 'head', .08, 'drop'); IN(s, 'busy', .22, 'fade'); JITTER(s, 'busy', .3, 1.4, 2.4); CAMTO(s, .55, 130, 250, 1.4);
      SPARK(s, .7, 196, 196, 'bang'); RINGS(s, [[.45, 130, 252, 64, 66, .5], [1.75, 280, 262, 70, 70, .45]]);
      IN(s, 'lungs', 1.1, 'pop'); CAMTO(s, 1.3, 260, 262, 1.3); OUT(s, 'busy', 1.5); IN(s, 'calm', 1.56, 'fade'); BUMPD(s, 'head', 1.56);
      SPARK(s, 1.7, 196, 214, 'plus', GREEN); SPARK(s, 2.0, 346, 214, 'dots', GREEN); CAMOUT(s, 2.1);
      return `${s.W('head', headProfile(130, 252, 1.15))}${s.W('busy', busyMind(126, 236))}${s.W('calm', calmMind(126, 236))}${s.W('lungs', lungs(282, 262, 1.05))}`;
    }
  }));

add('s02', 3.6, 'Breathe in for four, hold for seven, and out for eight.', 'The 4-7-8 breath',
  'SHOT A (0–1.2): the gold breath orb swells on the inhale, tile “4” pops. SHOT B (1.2–2.4): hold — the orb stays full and pulses, tile “7”. SHOT C (2.4–3.6): exhale, the orb shrinks, tile “8”; camera pulls back.',
  { push: 1 }, s => build(s, {
    hdr: HDR('// 02 · 4-7-8', 'COUNT', '4'), cap: ['Breathe *in* for four,', 'hold for *seven,*', 'and _out_ for eight.'], rv: [[0, ['calm']], [1.2, ['point', 'calm']], [2.4, ['beads', 'laugh']]],
    drift: ['orb'],
    props: s => {
      IN(s, 'orb', .05, 'pop'); BREATHE(s, 'orb-d', .15, 1.05, .72, 1.12); IN(s, 'n4', .25, 'slam'); CAMTO(s, .3, 200, 262, 1.25);
      [1.4, 1.75, 2.1].forEach(t => PULSE(s, 'orb', t, 1.04)); IN(s, 'n7', 1.25, 'slam'); BUMPD(s, 'orb', 1.25); CAMTO(s, 1.2, 200, 330, 1.35);
      BREATHE(s, 'orb-d', 2.4, 1.0, 1.12, .78); IN(s, 'n8', 2.45, 'slam'); BUMPD(s, 'orb', 2.45); CAMTO(s, 2.4, 290, 320, 1.3); CAMOUT(s, 3.1);
      TICK(s, 'cnt', .1, s.dur, 1, 19); RINGS(s, [[.5, 96, 372, 26, 26, .35], [1.5, 200, 372, 26, 26, .35], [2.7, 304, 372, 26, 26, .35]], GOLD);
      SPARK(s, .9, 300, 196, 'plus', GOLD); SPARK(s, 2.0, 96, 210, 'dots', GOLD); SPARK(s, 3.0, 312, 220, 'check', GREEN);
      return `${s.W('orb', breathOrb(200, 262, 68) + `<text id="${s.id}-cnt" x="200" y="271" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="22" fill="${INK}">1</text>`)}
        ${s.W('n4', tile(96, 372, .42, '4', { rot: -6 }))}${s.W('n7', tile(200, 372, .42, '7', { rot: 4 }))}${s.W('n8', tile(304, 372, .42, '8', { rot: -3 }))}`;
    }
  }));

add('s03', 3.4, 'In yogic tradition, energy flows through seven chakras.', 'Seven chakras',
  'SHOT A (0–1.2): a small seated monk pops in; a spine line draws up his centre. SHOT B (1.2–2.3): close on the lower wheels — root, sacral, solar plexus pop with their names. SHOT C (2.3–3.4): tilt up to heart, throat, third eye, crown.',
  { htIn: 1 }, s => build(s, {
    hdr: HDR('// 03 · chakras', 'WHEELS', '7'), cap: ['In yogic tradition,', '*energy* flows through', 'seven _chakras._'], rv: [[0, ['explain', 'calm']], [2.2, ['point', 'beads']]],
    drift: ['mm'],
    props: s => {
      const ys = [334, 313, 291, 269, 247, 216, 168];   // on his body: seat, belly, solar, chest, neck, brow, crown
      IN(s, 'mm', .05, 'up'); DRAW(s, 'spine', .3, 1.0);
      CAMTO(s, 1.15, 200, 296, 1.3); [0, 1, 2].forEach(i => { IN(s, 'ck' + i, 1.2 + i * .28, 'pop'); IN(s, 'cl' + i, 1.26 + i * .28, 'right'); });
      CAMTO(s, 2.25, 200, 286, 1.05); [3, 4, 5, 6].forEach(i => { IN(s, 'ck' + i, 2.3 + (i - 3) * .22, 'pop'); IN(s, 'cl' + i, 2.36 + (i - 3) * .22, 'right'); });
      CAMOUT(s, 3.05); SPARK(s, 3.1, 236, 176, 'plus', VIOLET);
      return `${s.W('mm', miniMonk(116, 140, 168))}<path id="${s.id}-spine" d="M200 340 V160" stroke="${GOLD}" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
        ${ys.map((y, i) => s.W('ck' + i, chakraIcon(200, y, 11, i)) + s.W('cl' + i, chip(230, y + 3, CHAKRAS[i][0], { c: CHAKRAS[i][1], s: 7 }))).join('')}`;
    }
  }));

add('s04', 2.6, 'From the root, all the way to the crown.', 'Root to crown',
  'SHOT A (0–1.25): the red root wheel lands big and spins. SHOT B (1.25–2.6): it is swapped for a lotus opening with gold rays and the violet crown wheel above it; the bowl rings.',
  {}, s => build(s, {
    hdr: HDR('// 04 · root → crown', 'LEVEL', '7'), cap: ['From the *root,*', 'all the way to the _crown._'], rv: [[0, ['point', 'explain']], [1.3, ['laugh', 'thumb']]],
    drift: ['root', 'lotus', 'crown', 'bowl'],
    props: s => {
      IN(s, 'root', .05, 'big'); MOVE(s, 'root-d', .1, { rotation: 0 }, { rotation: 90, duration: 1.1, ease: 'power1.inOut' }); CAMTO(s, .4, 200, 262, 1.25);
      SHOT(s, 1.25); OUT(s, 'root', 1.2); IN(s, 'rays', 1.3, 'fade'); IN(s, 'lotus', 1.3, 'up'); IN(s, 'crown', 1.5, 'drop'); IN(s, 'bowl', 1.6, 'right');
      [0, 1, 2].forEach(i => DRAW(s, 'wv' + i, 1.75 + i * .12, .35)); CAMTO(s, 1.9, 200, 236, 1.2); CAMOUT(s, 2.35);
      SPARK(s, 1.6, 120, 190, 'plus', GOLD); SPARK(s, 1.9, 286, 186, 'dots', VIOLET);
      return `${s.W('root', chakraIcon(200, 262, 46, 0))}${s.W('rays', rays(200, 232, 70, 96, 16, GOLD, 3))}${s.W('lotus', lotus(200, 300, 1))}${s.W('crown', chakraIcon(200, 196, 22, 6))}
        ${s.W('bowl', bowl(324, 300, .45))}${waves(`${s.id}-wv`, 324, 280)}`;
    }
  }));

/* ---------- write files ---------- */
const FONTS = `@font-face{font-family:'Instrument Sans';src:url('assets/fonts/InstrumentSans.woff2') format('woff2');font-weight:400 700;font-display:block}
@font-face{font-family:'Instrument Serif';src:url('assets/fonts/InstrumentSerif-Italic.woff2') format('woff2');font-style:italic;font-weight:400;font-display:block}
@font-face{font-family:'JetBrains Mono';src:url('assets/fonts/JetBrainsMono.woff2') format('woff2');font-weight:400 800;font-display:block}`;
let t = 0; const hosts = [], sb = [];
if (VO_TR) {
  let k = 0; const st = S.map(sc => { const first = norm(sc.vo.split(' ')[0]); while (k < VO_TR.length && norm(VO_TR[k].w) !== first) k++; if (k >= VO_TR.length) throw new Error('vo align failed at ' + sc.id); return k++; });
  S.forEach((sc, i) => { const i0 = st[i], i1 = i + 1 < S.length ? st[i + 1] : VO_TR.length;
    const t0 = i ? VO_TR[i0].a - .1 : 0, t1 = i + 1 < S.length ? VO_TR[i1].a - .1 : VO_TR.at(-1).b + .7;
    sc.newDur = +(t1 - t0).toFixed(3); sc.f = sc.newDur / sc.dur;
    sc.wt = VO_TR.slice(i0, i1).map(w => [(w.a - t0) / sc.f, (w.b - t0) / sc.f]); });
}
for (const sc of S) {
  const s = Scene(sc.id, sc.dur, sc.opts); s.f = sc.f || 1; s.wt = sc.wt;
  const svg = sc.def(s).split('__ID__').join(sc.id);
  fs.writeFileSync(path.join(ROOT, `compositions/${sc.id}.html`), `<template>
  <style>#root{position:absolute;inset:0;overflow:hidden;background:${PAPER}}#root svg.art{position:absolute;inset:0;width:100%;height:100%}</style>
  <div id="root" data-composition-id="${sc.id}" data-width="1080" data-height="1920">
    <svg class="art" id="${sc.id}-art" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" data-layout-allow-overlap="true">${svg}</svg>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    ${s.A.map(c => s.f === 1 ? c : c.replace(/,(-?\d*\.?\d+)\);/g, (m, v) => `,${r3(+v * s.f)});`)).join('\n    ')}
    window.__timelines["${sc.id}"] = tl;
  </script>
</template>
`);
  hosts.push(`      <div id="${sc.id}" data-composition-id="${sc.id}" data-composition-src="compositions/${sc.id}.html" data-start="${t.toFixed(3)}" data-duration="${sc.newDur || sc.dur}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>`);
  sb.push({ id: sc.id, start: t, dur: sc.newDur || sc.dur, f: r3(s.f), vo: sc.vo, scene: sc.scene, motion: sc.motion, words: s.words.length, cuts: [...new Set([0, ...s.cuts.map(r3)])].sort((a, b) => a - b), maxHold: r3(s.maxHold * s.f) });
  if (s.maxHold * s.f > 1.6) console.warn(`HOLD ${sc.id}: ${(s.maxHold * s.f).toFixed(2)}s after fitting to the voice`);
  t += sc.newDur || sc.dur;
}
const total = +t.toFixed(2);
fs.writeFileSync(path.join(ROOT, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>${FONTS}
*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1920px;overflow:hidden;background:${PAPER}}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1080" data-height="1920">
${hosts.join('\n')}
      ${VO_TR ? `<audio id="vo" src="${VO_FILE}" data-start="0" data-duration="${total}" data-track-index="3" data-volume="1"></audio>` : ''}
      <div id="grain" class="clip" data-start="0" data-duration="${total}" data-track-index="2" style="position:absolute;inset:0;pointer-events:none;background:url(assets/grain.png);background-size:300px 300px;opacity:.55;mix-blend-mode:multiply;z-index:50"></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
fs.writeFileSync(path.join(ROOT, 'STORYBOARD.md'), `---
format: 1080x1920
duration: ${total}s
look: v2 paper + v3 motion (ANIMATION-PLAN.md) — captions word by word, Rivka fixed and talking, halftone wipes between acts
message: "AI-run hacking is already here: an AI did 80-90% of a real espionage campaign by itself."
---
` + sb.map((f, i) => `
## Frame ${i + 1}: ${f.scene} (${f.start.toFixed(1)}-${(f.start + f.dur).toFixed(1)}s)
- status: animated (silent)
- src: compositions/${f.id}.html
- voiceover: "${f.vo}"
- motion: ${f.motion}
`).join(''));
fs.writeFileSync(path.join(ROOT, 'build/frames.json'), JSON.stringify(sb, null, 1));
console.log('scenes', S.length, 'total', total + 's');
