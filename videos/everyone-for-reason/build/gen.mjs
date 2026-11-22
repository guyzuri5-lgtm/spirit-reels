// monk-spiritual-video KIT: the paper/ink explainer engine with THE MONK as presenter, for spiritual topics (breath, energy, chakras, meditation). Ships with no scenes: write the film's scenes in the SCENES block (style reference: videos/body-receiver/build/gen.mjs).
// Look: paper, ink outlines, halftone, cement-tile motifs; motion rules in reference/animation-plan.md.
// Generates compositions/*.html + index.html + STORYBOARD.md from code.
// Source of truth for the film. Run: node build/gen.mjs
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- the monk (ink-lib.js = shared hands, face, textures, head rig; monk-lib.js = the monk himself) ---------- */
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'build/ink-lib.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'build/monk-lib.js'), 'utf8'), ctx);
const PRESENTER = ctx.window.MONK, MONKFULL = ctx.window.MONKFULL, MP = ctx.window.MPOSE, FPOSE = ctx.window.FPOSE;

/* ---------- palette: colour = meaning ---------- */
const W = 400, H = 711;
const PAPER = '#efece6', INK = '#161412', CARD = '#fbfaf7', LINE = '#d9d3c8', MUTE = '#8a8378', DARK = '#1b1917';
const RED = '#e5302a', GREEN = '#16a35f', GOLD = '#e8a317';   // red = stress / the problem · green = calm / the answer · gold = energy, light, breath
const HEB = "'Rubik'";   // Hebrew films (Guy, 2026-11-18): captions and Hebrew labels in Rubik, RTL
const SANS = "'Instrument Sans','Rubik'", SERIF = "'Instrument Serif'", MONO = "'JetBrains Mono'";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- type ---------- */
const E = (t, c = RED) => ({ t, c });            // italic-serif key word
const HEAD = (lines, { x = 28, y = 86, s = 29, c = INK } = {}) => lines.map((ln, i) =>
  `<text x="${x}" y="${(y + i * s * 1.13).toFixed(1)}" font-family="${SANS}" font-weight="600" font-size="${s}" fill="${c}" letter-spacing="-0.6">${(Array.isArray(ln) ? ln : [ln]).map(g => typeof g === 'string' ? esc(g) : `<tspan font-family="${SERIF}" font-style="italic" font-weight="400" font-size="${(s * 1.14).toFixed(1)}" fill="${g.c}" letter-spacing="-0.2">${esc(g.t)}</tspan>`).join('')}</text>`).join('');
const T = (x, y, s, txt, { c = INK, w = 600, a = 'middle', f = SANS, ls = -0.3, it = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${f}" font-weight="${w}" font-size="${s}" fill="${c}" text-anchor="${a}" letter-spacing="${ls}"${it ? ' font-style="italic"' : ''}>${esc(txt)}</text>`;
const MT = (x, y, s, txt, c = MUTE, a = 'start', w = 500) => T(x, y, s, txt, { c, a, f: MONO, w, ls: 0.2 }).replace('<text ', '<text data-layout-ignore="true" ');
const HDR = (left, rl = '', rval = '') => `${MT(28, 40, 8.6, left)}${rl ? `<text x="372" y="40" font-family="${MONO}" font-size="8.6" text-anchor="end" fill="${MUTE}" letter-spacing=".6">${esc(rl)} <tspan fill="${RED}" font-weight="700">${esc(rval)}</tspan></text>` : ''}`;
/* Hebrew label pill (Rubik). Use for any Hebrew on-stage label. */
const hchip = (x, y, txt, { c = INK, bg = CARD, s = 9, a = 'middle' } = {}) => {
  const w = txt.length * s * .62 + 20, x0 = a === 'middle' ? x - w / 2 : x;
  return `<g><rect x="${x0}" y="${y - s - 4}" width="${w}" height="${s + 11}" rx="${(s + 11) / 2}" fill="${bg}" stroke="${c === INK ? LINE : c}" stroke-width="1.3"/>${T(x0 + w / 2, y + 1.5, s, txt, { c, w: 700, f: HEB, ls: 0 })}</g>`;
};

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
const paper = id => `${defs(id)}<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" fill="url(#${id}-grid)"/><rect width="${W}" height="${H}" fill="url(#${id}-vig)"/>`;

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

const bubble = (id, x, y, w, h, txt, { bg = CARD, c = INK, tail = 'bl', s = 15, serif = 0 } = {}) => `<g transform="translate(${x} ${y})" filter="url(#${id}-sh)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}" stroke="${bg === CARD ? INK : bg}" stroke-width="1.6"/>
  <path d="${tail === 'bl' ? `M${-w / 2 + 22} ${h / 2 - 1.5} l-10 15 l22 -13.5` : `M${w / 2 - 22} ${h / 2 - 1.5} l10 15 l-22 -13.5`}" fill="${bg}" stroke="${bg === CARD ? INK : bg}" stroke-width="1.6" stroke-linejoin="round"/><rect x="${tail === 'bl' ? -w / 2 + 12 : w / 2 - 36}" y="${h / 2 - 4}" width="24" height="4" fill="${bg}"/>${serif ? T(0, s * .34, s * 1.15, txt, { c, w: 400, f: SERIF, it: 1, ls: 0 }) : T(0, s * .36, s, txt, { c, w: 600 })}</g>`;

/* the monk as a one-off bust prop (the fixed presenter at the bottom is drawn by presenterBlock) */
const monkBust = (pose, x = 112, w = 300, glow) => PRESENTER({ ...POSE[pose], glowc: glow === undefined ? (['thumb', 'laugh'].includes(pose) ? GREEN : ['shock', 'worry'].includes(pose) ? RED : GOLD) : glow }, x, H - w * 1.1 + 6, w);
/* monk poses (monk-lib.js MPOSE) + crossed = palms together with a skeptic look */
const POSE = { ...MP,
  crossed: { ...MP.calm, eyes: undefined, exp: 'smirk', brows: 'skeptic', look: [2, 0] },
};
const TILT = { shock: -3, crossed: 4, point: -4.5, worry: 5, thumb: -4, laugh: 3.5, explain: -2.5, calm: 2.5, beads: -2, celebrate: -3, excited: 3, cover: 4, peek: -5, chin: 6, relax: -4 };
const MONKREACH = ctx.window.MONKREACH;


/* =====================================================================
   MOTION ENGINE — reference-reel motion language.
   See reference/animation-plan.md. Captions = narration word by word, the monk fixed,
   halftone wipes between acts, pop / drop / fly / slam entrances.
   ===================================================================== */
const RX = 112, RW = 300, RY = H - RW * 1.1 + 6;           // the monk is fixed for the whole film
const J = o => JSON.stringify(o);
const TO = '"50% 50%"';
/* v5 MORPHS: outgoing main object → ink blob → next scene's main object. rect = [x,y,w,h,rx,ry] */
const MORPHS = {};   // per film: {sNN: {from, to, next, tgt, fill}} — rect = [x, y, w, h, rx, ry]
const MORPH_IN = Object.fromEntries(Object.entries(MORPHS).map(([k, v]) => [v.next, v]));
function Scene(id, dur, o = {}) {
  const s = { id, dur, A: [], htIn: !!o.htIn, htOut: !!o.htOut, push: !!o.push && !MORPHS[id], moOut: MORPHS[id], moIn: MORPH_IN[id], shots: [], cuts: [], words: [], keys: [], fx: '', wtok: [], capfx: '', top: '' };
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
const WIGGLY = ['stamp', 'st0', 'st1', 'st2', 't1', 't2', 'b0', 'b1', 'chip', 'bub', 'big', 'arrow', 'key', 'tape', 'num', 'pct', 'bar', 'c1', 'c2', 'c3', 'k1', 'k2', 'k3', 'good', 'bad', 'p0', 'p1', 'scale', 'moon', 'h0', 'h1', 'h2', 'burst'];
/* BUMP: parent card reacts when a child lands */
function BUMP(s, n, t, k = 1.035) { s.a(`tl.fromTo("${s.q(n)}",{scale:1,transformOrigin:"50% 50%"},{scale:${k},transformOrigin:"50% 50%",duration:.07,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`); }
/* RING: hand-drawn red ellipse that hops from target to target  hops=[[t,x,y,rx,ry,hold]] */
function RINGS(s, hops, c = RED) {
  hops.forEach(([t, x, y, rx, ry, hold = .45], i) => { const n = `${s.id}-rg${s.rgN = (s.rgN || 0) + 1}`, rot = (i % 2 ? 7 : -9);
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
WIGGLY.push('head', 'lungs', 'orb', 'lotus', 'bowl', 'candle', 'ck0', 'ck1', 'ck2', 'ck3', 'ck4', 'ck5', 'ck6', 'root', 'crown', 'n4', 'n7', 'n8', 'mm', 'gong', 'note', 'jar');

/* =====================================================================
   v7 MOTION KIT (2026-11-18): from the frame analysis of Guy's "5 steps" reference reel.
   ROLL (odometer counter) · BURST / RISE / FALL / ABSORB (particles) · LAND (drop + squash) ·
   PRESS (button squash + ripple) · TYPE (typing with a caret) · FROMWORD (an object born from a caption word) ·
   reach() (the monk's arm reaching into the stage). All seek-safe: fromTo / set only, values from hsh().
   ===================================================================== */
let PK = 0;   // particle id counter (unique per run)
/* NOTE: HyperFrames seeks with callbacks suppressed, so nothing here may use onUpdate / onComplete:
   every effect is baked into tl.set / fromTo at build time. */
const EASE = { none: x => x, 'power1.out': x => 1 - (1 - x) ** 2, 'power2.out': x => 1 - (1 - x) ** 3, 'power3.out': x => 1 - (1 - x) ** 4, 'power2.in': x => x ** 3, 'power2.inOut': x => x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2 };

/* ROLL: odometer-style number. rollNum() draws it (right edge at x), ROLL() spins it from → to (digits roll up
   with carries, leading zeros hide). Integers only; dec puts in a decimal point (183 + dec:1 → 18.3), suffix adds 'K' / '%'. */
function rollNum(s, n, x, y, v0, { size = 20, cols = 0, c = INK, f = SANS, w = 700, sep = ',', dec = 0, suffix = '', min = 1 } = {}) {
  const id = `${s.id}-${n}`, L = size * 1.08, cw = size * .62, sw = size * .3;
  cols = Math.max(cols, String(Math.floor(v0)).length, dec + 1); min = Math.max(min, dec + 1);
  (s.rolls = s.rolls || {})[n] = { cols, L, min, v: v0 };
  let svg = '', cx = x;
  if (suffix) { svg += T(cx, y, size, suffix, { c, w, f, a: 'end', ls: 0 }); cx -= suffix.length * size * .64 + 1; }
  for (let k = 0; k < cols; k++) {
    const hide = k >= min && v0 < 10 ** k ? ' opacity="0"' : '';
    if (dec && k === dec) { svg += T(cx - sw * .5, y, size, '.', { c, w, f, ls: 0 }); cx -= sw; }
    const gi = k - dec; if (sep && gi > 0 && gi % 3 === 0) { s.rolls[n].seps = [...(s.rolls[n].seps || []), k]; svg +=`<g id="${id}-s${k}"${hide}>${T(cx - sw * .5, y, size, sep, { c, w, f, ls: 0 })}</g>`; cx -= sw; }
    const digits = Array.from({ length: 11 }, (_, j) => T(0, j * L, size, String(j % 10), { c, w, f, ls: 0 })).join('');
    svg += `<g id="${id}-o${k}" transform="translate(${(cx - cw / 2).toFixed(1)} ${y})" clip-path="url(#${id}-rc)"${hide}><g id="${id}-c${k}" transform="translate(0 ${(-(Math.floor(v0 / 10 ** k) % 10) * L).toFixed(2)})">${digits}</g></g>`;
    cx -= cw;
  }
  return `<defs><clipPath id="${id}-rc"><rect x="${-cw}" y="${-size * .86}" width="${cw * 2}" height="${size * 1.08}"/></clipPath></defs><g id="${id}">${svg}</g>`;
}
function ROLL(s, n, t, from, to, d = .8, ease = 'power2.out') {
  if (!s.rolls?.[n]) return (s.later = s.later || []).push(() => ROLL(s, n, t, from, to, d, ease));   // drawn later in props: run after build() has the markup
  const R = s.rolls[n], id = `${s.id}-${n}`, E = EASE[ease] || EASE['power2.out'], last = {};
  const pos = (v, k) => { const p = 10 ** k, fl = Math.floor(v / p); return k ? (fl % 10) + Math.max(0, (v - fl * p) - (p - 1)) : v % 10; };
  for (let f = 0, N = Math.max(2, Math.round(d * 30)); f <= N; f++) {
    const v = from + (to - from) * E(f / N), tt = t + f * d / N;
    for (let k = 0; k < R.cols; k++) {
      const y = r3(-pos(f === N ? to : v, k) * R.L), op = k >= R.min && v < 10 ** k ? 0 : 1;
      if (last['y' + k] !== y) { s.a(`tl.set("#${id}-c${k}",{attr:{transform:"translate(0 ${y})"}},${r3(tt)});`); last['y' + k] = y; }
      if (last['o' + k] !== op) { s.a(`tl.set("#${id}-o${k}${(R.seps || []).includes(k) ? `,#${id}-s${k}` : ''}",{opacity:${op}},${r3(tt)});`); last['o' + k] = op; }
    }
  }
}

/* particles. kinds: confetti | heart | dot | light | leaf | petal | coin | star | spark */
const PCOL = { confetti: [RED, INK, GOLD], heart: [RED], dot: [INK, RED], light: [GOLD], leaf: [GREEN], petal: [PEACH, '#f7d6cc'], coin: [GOLD], star: [GOLD, RED], spark: [GOLD] };
function particle(kind, c, r) {
  if (kind === 'confetti') return `<rect x="${-r}" y="${-r * .45}" width="${r * 2}" height="${r * .9}" fill="${c}"/>`;
  if (kind === 'heart') return `<path d="M0 ${r * .9} C${-r * 1.6} ${-r * .1} ${-r * .9} ${-r * 1.3} 0 ${-r * .45} C${r * .9} ${-r * 1.3} ${r * 1.6} ${-r * .1} 0 ${r * .9}Z" fill="${c}" stroke="${INK}" stroke-width="1"/>`;
  if (kind === 'light') return `<circle r="${r * 1.9}" fill="${c}" opacity=".25"/><circle r="${r * .8}" fill="${c}"/>`;
  if (kind === 'leaf' || kind === 'petal') return `<path d="${vesica(r * 2.4, r * .8)}" transform="translate(0 ${r * 1.2})" fill="${c}" stroke="${INK}" stroke-width=".9"/>`;
  if (kind === 'coin') return `<circle r="${r}" fill="${c}" stroke="${INK}" stroke-width="1.3"/><circle r="${r * .6}" fill="none" stroke="#a8700c" stroke-width="1"/>`;
  if (kind === 'star' || kind === 'spark') return `<path d="M0 ${-r * 1.4} L${r * .35} ${-r * .35} L${r * 1.4} 0 L${r * .35} ${r * .35} L0 ${r * 1.4} L${-r * .35} ${r * .35} L${-r * 1.4} 0 L${-r * .35} ${-r * .35}Z" fill="${c}"/>`;
  return `<circle r="${r}" fill="${c}"/>`;
}
const pAdd = (s, x, y, svg) => { const n = `${s.id}-pk${PK++}`; s.fx += `<g transform="translate(${r3(x)} ${r3(y)})"><g id="${n}" opacity="0">${svg}</g></g>`; return `#${n}`; };
/* BURST: n particles explode out of (x,y), arc up and fall (confetti, hearts, sparks) */
function BURST(s, t, x, y, { n = 14, kind = 'confetti', cols, r = 4, spread = 70, up = 46, fall = 60, d = .75 } = {}) {
  cols = cols || PCOL[kind];
  for (let i = 0; i < n; i++) {
    const h = hsh(`${s.id}b${t}${i}`), h2 = hsh(`${s.id}c${t}${i}`), a = -Math.PI / 2 + (i / (n - 1 || 1) - .5) * 2.6 + (h - .5) * .5;
    const dx = Math.cos(a) * spread * (.5 + h2 * .7), peak = -up * (.5 + h * .8) + Math.sin(a) * 10, rot = (h2 - .5) * 540;
    const sel = pAdd(s, x, y, particle(kind, cols[i % cols.length], r * (.7 + h * .6)));
    s.a(`tl.fromTo("${sel}",{opacity:1,x:0,y:0,rotation:0,scale:.4,transformOrigin:"50% 50%"},{x:${r3(dx)},rotation:${r3(rot)},scale:1,duration:${r3(d)},ease:"power2.out",immediateRender:false},${r3(t)});`);
    s.a(`tl.fromTo("${sel}",{y:0},{y:${r3(peak)},duration:${r3(d * .38)},ease:"power2.out",immediateRender:false},${r3(t)});`);
    s.a(`tl.to("${sel}",{y:${r3(peak + fall * (.6 + h2 * .6))},opacity:0,duration:${r3(d * .62)},ease:"power2.in"},${r3(t + d * .38)});`);
  }
}
/* RISE: a stream of particles floating up and swaying from (x,y) between t0 and t1 (hearts, light motes, bubbles) */
function RISE(s, t0, t1, x, y, { every = .16, kind = 'heart', cols, r = 5, w = 40, h = 110, d = 1.1 } = {}) {
  cols = cols || PCOL[kind];
  for (let t = t0, i = 0; t < t1; t += every, i++) {
    const a = hsh(`${s.id}r${x}${i}`), b = hsh(`${s.id}q${y}${i}`), sel = pAdd(s, x + (a - .5) * w, y, particle(kind, cols[i % cols.length], r * (.7 + b * .6)));
    s.a(`tl.fromTo("${sel}",{opacity:0,y:0,x:0,scale:.3,transformOrigin:"50% 50%"},{opacity:1,y:${r3(-h * .25)},x:${r3((b - .5) * 14)},scale:1,duration:${r3(d * .25)},ease:"back.out(2)",immediateRender:false},${r3(t)});`);
    s.a(`tl.to("${sel}",{y:${r3(-h * (.8 + a * .4))},x:${r3((a - .5) * 30)},opacity:0,duration:${r3(d * .75)},ease:"sine.inOut"},${r3(t + d * .25)});`);
  }
}
/* FALL: n particles drop from above onto a line at y and bounce (coins, petals, leaves) */
function FALL(s, t, x, y, { n = 6, kind = 'coin', cols, r = 6, w = 70, step = .07, h = 130, d = .45 } = {}) {
  cols = cols || PCOL[kind];
  for (let i = 0; i < n; i++) {
    const a = hsh(`${s.id}f${t}${i}`), sel = pAdd(s, x + (a - .5) * w, y - r, particle(kind, cols[i % cols.length], r));
    s.a(`tl.fromTo("${sel}",{opacity:1,y:${-h},rotation:${r3((a - .5) * 90)},transformOrigin:"50% 50%"},{y:0,rotation:0,duration:${d},ease:"bounce.out",immediateRender:false},${r3(t + i * step)});`);
  }
}
/* ABSORB: particles fly in from a ring of radius R and vanish into (x,y) — e.g. light gathering into a chakra.
   Pass target: 'name' to PULSE that prop when they arrive. */
function ABSORB(s, t, x, y, { n = 12, kind = 'light', cols, r = 4, R = 150, d = .5, step = .025, target } = {}) {
  cols = cols || PCOL[kind];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + hsh(`${s.id}a${t}${i}`) * .6, rr = R * (.8 + hsh(`${s.id}z${i}`) * .4), sel = pAdd(s, x, y, particle(kind, cols[i % cols.length], r));
    s.a(`tl.fromTo("${sel}",{opacity:0,x:${r3(Math.cos(a) * rr)},y:${r3(Math.sin(a) * rr)},scale:1.2,transformOrigin:"50% 50%"},{opacity:1,duration:.06,immediateRender:false},${r3(t + i * step)});`);
    s.a(`tl.to("${sel}",{x:0,y:0,scale:.2,duration:${d},ease:"power2.in"},${r3(t + i * step)});`);
    s.a(`tl.set("${sel}",{opacity:0},${r3(t + i * step + d)});`);
  }
  if (target) { const ta = t + (n - 1) * step + d; PULSE(s, target, ta, 1.12); SPARK(s, ta, x, y - 26, 'burst', GOLD); }
}

/* LAND: falls from above with a tilt, squashes flat on impact, springs back (+ dust and a ground shadow).
   dust: a dust() prop name · shadow: a landShadow() prop name that grows under it while it falls. */
const landShadow = (n, x, y, w) => `<ellipse id="${n}" cx="${x}" cy="${y}" rx="${w / 2}" ry="${w / 9}" fill="#2a2016" opacity="0"/>`;
function LAND(s, n, t, { h = 110, rot = -9, d = .28, dust: du, shadow } = {}) {
  const sel = J(s.q(n));
  s.a(`tl.fromTo(${sel},{opacity:0,y:${-h},rotation:${rot},scaleX:.9,scaleY:1.12,transformOrigin:"50% 100%"},{opacity:1,y:0,rotation:0,duration:${d},ease:"power2.in",immediateRender:true},${r3(t)});`);
  s.a(`tl.to(${sel},{scaleX:1.2,scaleY:.8,duration:.06,ease:"power2.out"},${r3(t + d)});`);
  s.a(`tl.to(${sel},{scaleX:1,scaleY:1,duration:.34,ease:"elastic.out(1.1, 0.45)"},${r3(t + d + .06)});`);
  if (shadow) s.a(`tl.fromTo(${J(s.q(shadow))},{opacity:0,scale:.3,transformOrigin:"50% 50%"},{opacity:.22,scale:1,duration:${d},ease:"power2.in",immediateRender:false},${r3(t)});`);
  if (du) DUST(s, du, t + d);
  PUNCH(s, t + d, 1.02);
}
/* PRESS: a button / key is pushed — squash down, optional pressed look (swap: a prop shown from now on), red ripple at (x,y) */
function PRESS(s, n, t, { x, y, R = 30, swap, c = RED } = {}) {
  const sel = J(s.q(n));
  s.a(`tl.to(${sel},{scaleY:.84,scaleX:1.05,y:3,transformOrigin:"50% 100%",duration:.06,ease:"power2.in"},${r3(t)});`);
  s.a(`tl.to(${sel},{scaleY:1,scaleX:1,y:0,duration:.3,ease:"elastic.out(1, 0.4)"},${r3(t + .06)});`);
  if (swap) SET(s, swap, t + .05, { opacity: 1 });
  if (x !== undefined) { const rp = pAdd(s, x, y, `<circle r="${R}" fill="none" stroke="${c}" stroke-width="2.2"/>`);
    s.a(`tl.fromTo("${rp}",{opacity:1,scale:.2,transformOrigin:"50% 50%"},{opacity:0,scale:1.3,duration:.4,ease:"power2.out",immediateRender:false},${r3(t + .04)});`);
    SPARK(s, t + .05, x + R * .6, y - R * .6, 'burst', c); }
  PUNCH(s, t + .05, 1.025);
}
/* keycap prop (a big pressable key / button). Use with PRESS; draw a second one with pressed:1 as the swap. */
const keycap = (x, y, txt, { c = RED, w = 92, h = 50, pressed = 0, heb = 1 } = {}) => `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="${-h / 2 + 6}" width="${w}" height="${h}" rx="12" fill="${pressed ? INK : '#9c1c17'}"/><rect x="${-w / 2}" y="${-h / 2 + (pressed ? 4 : 0)}" width="${w}" height="${h}" rx="12" fill="${pressed ? DARK : c}" stroke="${INK}" stroke-width="2"/><rect x="${-w / 2 + 6}" y="${-h / 2 + 5 + (pressed ? 4 : 0)}" width="${w - 12}" height="${h * .34}" rx="8" fill="#fff" opacity=".18"/>${T(0, 7 + (pressed ? 4 : 0), 17, txt, { c: '#fff', w: 800, f: heb ? HEB : SANS, ls: 0 })}</g>`;

/* TYPE: text typed letter by letter with a blinking caret. typeLine() lays the text out hidden, one tspan per letter
   (Hebrew: dir -1, x = right edge). TYPE(s, n, t, {cps, from, to, blink}) reveals letters from..to at cps letters/s
   (call it again to continue typing later); the caret follows and then blinks for `blink` s. */
function typeLine(s, n, x, y, text, { size = 15, c = INK, f = HEB, w = 700, dir = -1, caret = RED } = {}) {
  const id = `${s.id}-${n}`, adv = ch => size * (ch === ' ' ? .27 : /[.,:;!'"]/.test(ch) ? .26 : /[0-9]/.test(ch) ? .6 : .57);
  const xs = [0]; [...text].forEach(ch => xs.push(xs.at(-1) + adv(ch)));
  (s.types = s.types || {})[n] = { len: [...text].length, cx: xs.map(v => r3(dir < 0 ? x - v - 3 : x + v + 1)) };
  const sp = [...text].map((ch, i) => `<tspan id="${id}-k${i}" fill-opacity="0">${esc(ch)}</tspan>`).join('');
  return `<g id="${id}"><text x="${x}" y="${y}" font-family="${f}" font-weight="${w}" font-size="${size}" fill="${c}"${dir < 0 ? ' direction="rtl" text-anchor="start"' : ''} xml:space="preserve">${sp}</text><rect id="${id}-cr" x="${s.types[n].cx[0]}" y="${r3(y - size * .82)}" width="2.2" height="${r3(size * 1.02)}" fill="${caret}" opacity="0"/></g>`;
}
function TYPE(s, n, t, o = {}) {
  if (!s.types?.[n]) return (s.later = s.later || []).push(() => TYPE(s, n, t, o));
  const { cps = 16, from = 0, blink = .8 } = o; let { to } = o;
  const id = `${s.id}-${n}`, Y = s.types[n]; to = to ?? Y.len; const step = 1 / cps;
  s.a(`tl.set("#${id}-cr",{opacity:1},${r3(Math.max(0, t - .2))});`);
  for (let i = from; i < to; i++) { const ti = t + (i - from) * step;
    s.a(`tl.set("#${id}-k${i}",{attr:{"fill-opacity":1}},${r3(ti)});tl.set("#${id}-cr",{attr:{x:${Y.cx[i + 1]}}},${r3(ti)});`); }
  const te = t + (to - from) * step;
  for (let b = te + .27, i = 0; b < te + blink; b += .27, i++) s.a(`tl.set("#${id}-cr",{opacity:${i % 2 ? 1 : 0}},${r3(b)});`);
}

/* FROMWORD: an object is born out of a caption word and flies down to its place on the stage.
   word = the caption word (as written, without * _) or its index; svg = the object's markup drawn around (tx,ty)
   in stage coordinates; it flies in a top layer (so the caption clip can't hide it), then hands over to the
   stage prop `n` (drawn hidden, at the same spot) which pops in on landing. */
function FROMWORD(s, n, t, word, svg, tx, ty, { d = .42 } = {}) {
  const tok = typeof word === 'number' ? s.wtok[word] : s.wtok.find(k => k.w.replace(/[.,?!:;]/g, '') === word.replace(/[.,?!:;]/g, ''));
  if (!tok) { console.warn(`FROMWORD ${s.id}: no caption word "${word}"`); return; }
  const wt = s.words[s.wtok.indexOf(tok)][0];   // when the word appears
  if (t === null || t === undefined) t = wt + .12; else if (t < wt + .05) console.warn(`FROMWORD ${s.id}: t=${t} is before the word "${tok.w}" appears (${wt.toFixed(2)}s) — pass null to follow the word`);
  const ta = t + d, [, k, shx, shy] = shotAt(s, ta), c = 1 + .08 * ta / s.dur;
  const X = r3(k * (200 + (tx - 200) * c) + shx), Y = r3(k * (290 + (ty - 290) * c) + shy + STAGE_Y), K = r3(k * c);
  const f = `__fw${PK++}`;
  s.top += `<g id="${f}" opacity="0" data-layout-allow-overlap="true"><g id="${f}s"><g transform="translate(${-tx} ${-ty})">${svg}</g></g></g>`;
  /* start on the word (measured in the page at run time, so it matches the real font) */
  const bx = `function(){var b=document.getElementById("${tok.id}").getBBox();return "translate("+(b.x+b.width/2).toFixed(1)+" "+(b.y+b.height/2).toFixed(1)+")"}`;
  s.a(`tl.fromTo("#${f}",{opacity:0,attr:{transform:${bx}}},{opacity:1,duration:.05,immediateRender:false},${r3(t)});`);
  s.a(`tl.fromTo("#${f}s",{attr:{transform:"scale(0.15) rotate(-20)"}},{attr:{transform:"scale(${K}) rotate(0)"},duration:${d},ease:"back.out(1.3)",immediateRender:false},${r3(t)});`);
  s.a(`tl.to("#${f}",{attr:{transform:"translate(${X} ${Y})"},duration:${d},ease:"power3.inOut"},${r3(t)});`);
  s.a(`tl.set("#${f}",{opacity:0},${r3(ta)});`);
  IN(s, n, ta - .02, 'morph'); BUMPD(s, n, ta);
  /* the word flashes: a red underline draws under it and fades */
  const ul = `${f}u`;
  s.capfx += `<line id="${ul}" x1="0" y1="0" x2="1" y2="0" stroke="${RED}" stroke-width="2.6" stroke-linecap="round" opacity="0"/>`;
  s.a(`tl.fromTo("#${ul}",{opacity:1,attr:{x1:function(){var b=document.getElementById("${tok.id}").getBBox();return b.x+b.width},x2:function(){var b=document.getElementById("${tok.id}").getBBox();return b.x+b.width},y1:function(){var b=document.getElementById("${tok.id}").getBBox();return b.y+b.height+2},y2:function(){var b=document.getElementById("${tok.id}").getBBox();return b.y+b.height+2}}},{attr:{x2:function(){return document.getElementById("${tok.id}").getBBox().x}},duration:.16,ease:"power2.out",immediateRender:false},${r3(t - .14)});`);
  s.a(`tl.to("#${ul}",{opacity:0,duration:.2},${r3(t + .3)});`);
}
/* the monk's arm reaching into the stage from the bottom edge (fingertip at x,y). Animate with IN … 'up' and MOVE. */
const reach = (x, y, w = 330, ang = -28, hand = 'point') => MONKREACH(x, y, w, ang, hand);

/* =====================================================================
   v7b (2026-11-18): the rest of the reference reel's moves.
   HOP (a figure jumping along a path with a dotted trail and flips) · mountain / ghost / COLLAPSE ·
   stepper / STEP · checklist / CHECK · barGraph / GROW / SCAN / FIXBARS · calendar / TEAR · scales / TIP ·
   MONKPOP / MONKZOOM (the presenter grows for a beat). Same seek rule: everything baked into set / fromTo.
   ===================================================================== */
/* HOP: prop n jumps from where it is drawn through pts = [[dx,dy], …] (offsets from its drawn spot, not deltas).
   at = [x,y] its base point on the stage, needed for the dotted trail. flip = hop indexes that do a somersault. */
const later = (s, f) => (s.later = s.later || []).push(f);   // verbs called before their prop is drawn run after props()
function HOP(s, n, t, pts, { d = .3, h = 46, gap = .06, at, trail = 1, flip = [], squash = 1 } = {}) {
  const sel = J(s.q(n)); let px = 0, py = 0, tt = t;
  pts.forEach(([x, y], i) => {
    const top = Math.min(py, y) - h;
    s.a(`tl.to(${sel},{x:${x},duration:${d},ease:"power1.inOut"},${r3(tt)});`);
    s.a(`tl.to(${sel},{y:${r3(top)},duration:${r3(d / 2)},ease:"power2.out"},${r3(tt)});`);
    s.a(`tl.to(${sel},{y:${y},duration:${r3(d / 2)},ease:"power2.in"},${r3(tt + d / 2)});`);
    if (flip.includes(i)) s.a(`tl.fromTo(${sel},{rotation:0},{rotation:-360,transformOrigin:"50% 50%",duration:${d},ease:"power1.inOut",immediateRender:false},${r3(tt)});`);
    if (squash) { s.a(`tl.to(${sel},{scaleY:.84,scaleX:1.1,transformOrigin:"50% 100%",duration:.05},${r3(tt + d)});`); s.a(`tl.to(${sel},{scaleY:1,scaleX:1,duration:.14,ease:"back.out(3)"},${r3(tt + d + .05)});`); }
    if (trail && at) for (let k = 1; k <= 5; k++) { const u = k / 6, tx = at[0] + px + (x - px) * u, ty = at[1] + py + (y - py) * u - h * 4 * u * (1 - u);
      const dot = pAdd(s, tx, ty, `<circle r="1.8" fill="${MUTE}"/>`); s.a(`tl.set("${dot}",{opacity:.8},${r3(tt + d * u)});tl.to("${dot}",{opacity:0,duration:.3},${r3(tt + d * u + .7)});`); }
    px = x; py = y; tt += d + gap;
  });
}

/* a jagged black mountain with a snow cap and an optional flag on the peak; mountainPath() gives its outline for ghost() */
const mountainPath = (x, y, w, h) => { const L = x - w / 2; return `M${L} ${y} L${L + w * .16} ${y - h * .34} L${L + w * .26} ${y - h * .28} L${L + w * .42} ${y - h * .66} L${L + w * .52} ${y - h * .56} L${L + w * .68} ${y - h} L${L + w * .8} ${y - h * .52} L${L + w * .9} ${y - h * .36} L${L + w} ${y}Z`; };
const mountain = (x, y, w, h, { flag = '', fc = CARD, tc = INK } = {}) => { const L = x - w / 2, px = L + w * .68, py = y - h;
  return `<path d="${mountainPath(x, y, w, h)}" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M${px} ${py} L${px - w * .07} ${py + h * .2} L${px - w * .03} ${py + h * .16} L${px} ${py + h * .24} L${px + w * .035} ${py + h * .15} L${px + w * .055} ${py + h * .21}Z" fill="#fff"/>
  ${flag ? `<path d="M${px} ${py} V${py - 46}" stroke="${INK}" stroke-width="2.4"/><path d="M${px} ${py - 46} h${flag.length * 9 + 14} l-5 9 l5 9 H${px}Z" fill="${fc}" stroke="${INK}" stroke-width="1.8"/>${T(px + (flag.length * 9 + 10) / 2, py - 32, 11, flag, { c: tc, w: 800, f: HEB, ls: 0 })}` : ''}`; };
/* ghost: the dashed grey outline that stays behind after a shape is gone. GHOST fades it in. */
const ghost = (s, n, d) => `<path id="${s.id}-${n}" d="${d}" fill="none" stroke="${MUTE}" stroke-width="1.6" stroke-dasharray="4 5" stroke-linejoin="round" opacity="0"/>`;
const GHOST = (s, n, t) => s.a(`tl.fromTo("${s.q(n)}",{opacity:0},{opacity:.85,duration:.25,immediateRender:false},${r3(t)});`);
/* COLLAPSE: the prop is crushed flat into the ground, with a red shock line under it (at = [x,y,w] of its base) */
function COLLAPSE(s, n, t, { at, dust: du, d = .22 } = {}) {
  const sel = J(s.q(n));
  s.a(`tl.to(${sel},{rotation:-4,transformOrigin:"50% 100%",duration:.08,ease:"power2.out"},${r3(t)});`);
  s.a(`tl.to(${sel},{scaleY:.05,scaleX:1.06,rotation:0,transformOrigin:"50% 100%",duration:${d},ease:"power3.in"},${r3(t + .08)});`);
  if (at) { const f = pAdd(s, at[0], at[1], `<ellipse rx="${at[2] * .45}" ry="7" fill="${RED}" opacity=".55"/><ellipse rx="${at[2] * .25}" ry="3" fill="${RED}"/>`);
    s.a(`tl.fromTo("${f}",{opacity:1,scaleX:.3,transformOrigin:"50% 50%"},{opacity:0,scaleX:1.4,duration:.45,ease:"power2.out",immediateRender:false},${r3(t + .08 + d)});`); }
  if (du) DUST(s, du, t + .08 + d);
  PUNCH(s, t + .08 + d, 1.035);
}

/* stepper: N dots joined by a dashed line, labels under them (Hebrew: runs right → left). STEP(s,n,t,i) makes dot i the
   active one: the line to it draws in red, it fills and pulses, the one before turns into a green check. */
function stepper(s, n, x, y, labels, { gap = 92, r = 10, dir = -1, size = 11 } = {}) {
  const id = `${s.id}-${n}`, X = i => x + dir * i * gap;
  let g = '';
  labels.forEach((_, i) => { if (i) g += `<line x1="${X(i - 1)}" y1="${y}" x2="${X(i)}" y2="${y}" stroke="${LINE}" stroke-width="2.4" stroke-dasharray="3 5"/><line id="${id}-l${i}" x1="${X(i - 1) + dir * r}" y1="${y}" x2="${X(i) - dir * r}" y2="${y}" stroke="${RED}" stroke-width="2.6" stroke-dasharray="4 4" pathLength="1" opacity="0"/>`; });
  labels.forEach((lb, i) => { g += `<circle cx="${X(i)}" cy="${y}" r="${r}" fill="${CARD}" stroke="${MUTE}" stroke-width="1.8"/><circle id="${id}-f${i}" cx="${X(i)}" cy="${y}" r="${r}" fill="${RED}" stroke="${INK}" stroke-width="1.6" opacity="0"/>
    <g id="${id}-c${i}" opacity="0">${check(X(i), y, r + 1)}</g><circle id="${id}-p${i}" cx="${X(i)}" cy="${y}" r="${r + 6}" fill="none" stroke="${RED}" stroke-width="1.6" opacity="0"/>
    ${T(X(i), y + r + 16, size, lb, { c: MUTE, w: 700, f: HEB, ls: 0 })}<g id="${id}-t${i}" opacity="0">${T(X(i), y + r + 16, size, lb, { c: INK, w: 800, f: HEB, ls: 0 })}</g>`; });
  (s.steps = s.steps || {})[n] = 1;
  return `<g>${g}</g>`;   // wrap with s.W(n, …) to IN / wiggle it
}
function STEP(s, n, t, i) {
  if (!s.steps?.[n]) return later(s, () => STEP(s, n, t, i));
  const id = `${s.id}-${n}`;
  if (i) { s.a(`tl.fromTo("#${id}-l${i}",{opacity:1,attr:{"stroke-dashoffset":1}},{attr:{"stroke-dashoffset":0},duration:.22,ease:"power2.out",immediateRender:false},${r3(t)});`);
    s.a(`tl.set("#${id}-f${i - 1},#${id}-t${i - 1}",{opacity:0},${r3(t + .18)});`); IN(s, `#${id}-c${i - 1}`, t + .18, 'pophard'); }
  IN(s, `#${id}-f${i}`, t + .2, 'pophard'); s.a(`tl.set("#${id}-t${i}",{opacity:1},${r3(t + .2)});`);
  s.a(`tl.fromTo("#${id}-p${i}",{opacity:.9,scale:.6,transformOrigin:"50% 50%"},{opacity:0,scale:1.6,duration:.5,ease:"power2.out",immediateRender:false},${r3(t + .24)});`);
}

/* checklist: rows with a spinning loader each (spins the whole scene until CHECK). CHECK(s,n,t,i,{ok}) swaps row i's
   spinner for a green check (or red cross with ok:false) and moves the grey highlight bar to the next row. */
function checklist(s, n, x, y, items, { w = 250, row = 30, size = 13 } = {}) {
  const id = `${s.id}-${n}`; let g = `<rect id="${id}-hl" x="${x + 4}" y="${y + 3}" width="${w - 8}" height="${row - 6}" rx="7" fill="#e9e4da"/>`;
  items.forEach((lb, i) => { const ry = y + i * row + row / 2, sx = x + w - 20;
    g += `<g id="${id}-s${i}"><circle cx="${sx}" cy="${ry}" r="7" fill="none" stroke="${LINE}" stroke-width="2.2"/><path d="M${sx} ${ry - 7} A7 7 0 0 1 ${sx + 7} ${ry}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/></g>
      <g id="${id}-k${i}" opacity="0">${check(sx, ry, 8)}</g><g id="${id}-x${i}" opacity="0">${cross(sx, ry, 8)}</g>
      ${T(sx - 18, ry + size * .36, size, lb, { c: INK, w: 700, f: HEB, a: 'end', ls: 0 })}`;
    s.a(`tl.fromTo("#${id}-s${i}",{rotation:0,svgOrigin:"${sx} ${ry}"},{rotation:${Math.ceil(s.dur / .7) * 360},svgOrigin:"${sx} ${ry}",duration:${r3(Math.ceil(s.dur / .7) * .7)},ease:"none"},0);`); });
  (s.lists = s.lists || {})[n] = { y, row };
  return `<g>${card(s.id, x, y - 6, w, items.length * row + 12, '')}${g}</g>`;
}
function CHECK(s, n, t, i, o = {}) {
  if (!s.lists?.[n]) return later(s, () => CHECK(s, n, t, i, o)); const { ok = true } = o;
  const id = `${s.id}-${n}`, L = s.lists[n];
  s.a(`tl.set("#${id}-s${i}",{opacity:0},${r3(t)});`); IN(s, `#${id}-${ok ? 'k' : 'x'}${i}`, t, 'pophard');
  s.a(`tl.to("#${id}-hl",{y:${(i + 1) * L.row},duration:.18,ease:"power2.inOut"},${r3(t + .05)});`);
}

/* barGraph: a card with bars growing from the floor. weak = indexes of the low bars (the "weak moment").
   GROW(s,n,t) bars rise left → right · SCAN(s,n,t,{from,to,d}) a magnifier slides along (bars magnified inside the lens,
   lens tints red where it stops) · FIXBARS(s,n,t,h) the weak bars grow to height h with red dots on top. */
function barGraph(s, n, x, y, w, h, vals, { weak = [], c = INK, label = '' } = {}) {
  const id = `${s.id}-${n}`, N = vals.length, bw = (w - 24) / N, base = y + h - 14, bh = v => v * (h - 34);
  const bars = (pre) => vals.map((v, i) => `<rect ${pre ? `id="${id}-b${i}"` : ''} x="${r3(x + 12 + i * bw + bw * .18)}" y="${r3(base - bh(v))}" width="${r3(bw * .64)}" height="${r3(bh(v))}" rx="1.5" fill="${c}"/>`).join('');
  const dots = weak.map(i => `<g id="${id}-d${i}" opacity="0">${[0, 1, 2].map(k => `<circle cx="${r3(x + 12 + i * bw + bw / 2)}" cy="${r3(base - bh(.8) - 6 - k * 6)}" r="${2.2 - k * .4}" fill="${RED}"/>`).join('')}</g>`).join('');
  const cy = base - (h - 34) * .45, R = 26;
  (s.graphs = s.graphs || {})[n] = { x, w, N, bw, base, bh, weak, cy };
  return `<g>${card(s.id, x, y, w, h, '', { label })}<line x1="${x + 10}" y1="${base}" x2="${x + w - 10}" y2="${base}" stroke="${LINE}" stroke-width="1.4"/>${bars(1)}${dots}
  <defs><clipPath id="${id}-lc"><circle id="${id}-lcc" cx="${x}" cy="${r3(cy)}" r="${R}"/></clipPath></defs>
  <g id="${id}-lens" opacity="0"><g clip-path="url(#${id}-lc)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${CARD}"/><g id="${id}-mag" transform="translate(${x} ${r3(cy)}) scale(1.7) translate(${-x} ${r3(-cy)})">${bars(0)}</g><circle id="${id}-tint" cx="${x}" cy="${r3(cy)}" r="${R}" fill="${RED}" opacity="0"/></g>
  <g id="${id}-ring" transform="translate(${x} ${r3(cy)})"><circle r="${R}" fill="none" stroke="${INK}" stroke-width="3.4"/><path d="M${R * .72} ${R * .72} l16 16" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></g></g></g>`;
}
function GROW(s, n, t, o = {}) {
  if (!s.graphs?.[n]) return later(s, () => GROW(s, n, t, o)); const { step = .035 } = o;
  const G = s.graphs[n]; for (let i = 0; i < G.N; i++) s.a(`tl.fromTo("#${s.id}-${n}-b${i}",{scaleY:0,transformOrigin:"50% 100%"},{scaleY:1,transformOrigin:"50% 100%",duration:.22,ease:"back.out(1.6)",immediateRender:true},${r3(t + i * step)});`);
}
function SCAN(s, n, t, o = {}) {
  if (!s.graphs?.[n]) return later(s, () => SCAN(s, n, t, o)); let { from = 0, to, d = .7, tint = 1 } = o;
  const G = s.graphs[n], id = `${s.id}-${n}`, X = i => r3(G.x + 12 + i * G.bw + G.bw / 2); to = to ?? G.N - 1;
  const a = X(from), b = X(to), cy = r3(G.cy), tr = v => `translate(${v} ${cy}) scale(1.7) translate(${-v} ${-cy})`;
  s.a(`tl.set("#${id}-lens",{opacity:1},${r3(t)});`);
  s.a(`tl.fromTo("#${id}-ring",{attr:{transform:"translate(${a} ${cy})"}},{attr:{transform:"translate(${b} ${cy})"},duration:${d},ease:"power2.inOut",immediateRender:false},${r3(t)});`);
  s.a(`tl.fromTo("#${id}-lcc,#${id}-tint",{attr:{cx:${a}}},{attr:{cx:${b}},duration:${d},ease:"power2.inOut",immediateRender:false},${r3(t)});`);
  s.a(`tl.fromTo("#${id}-mag",{attr:{transform:"${tr(a)}"}},{attr:{transform:"${tr(b)}"},duration:${d},ease:"power2.inOut",immediateRender:false},${r3(t)});`);
  if (tint) s.a(`tl.to("#${id}-tint",{opacity:.22,duration:.12},${r3(t + d)});`);
}
function FIXBARS(s, n, t, h = .8, o = {}) {
  if (!s.graphs?.[n]) return later(s, () => FIXBARS(s, n, t, h, o)); const { hideLens = 1 } = o;
  const G = s.graphs[n], id = `${s.id}-${n}`;
  if (hideLens) s.a(`tl.to("#${id}-lens",{opacity:0,duration:.12},${r3(t)});`);
  G.weak.forEach((i, k) => { const el = `#${id}-b${i}`;
    s.a(`tl.to("${el}",{attr:{y:${r3(G.base - G.bh(h))},height:${r3(G.bh(h))}},duration:.26,ease:"back.out(1.8)"},${r3(t + .05 + k * .05)});`);
    IN(s, `#${id}-d${i}`, t + .25 + k * .05, 'pop'); });
}

/* calendar: a pad of pages ([[big, small], …]); the first is on top. TEAR(s,n,t,i) rips page i off. */
function calendar(s, n, x, y, pages, { w = 86, h = 98, head = '' } = {}) {
  const id = `${s.id}-${n}`;
  const page = ([big, small], i) => `<g id="${id}-p${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${CARD}" stroke="${INK}" stroke-width="2"/><path d="M${x} ${y + 7} a7 7 0 0 1 7 -7 h${w - 14} a7 7 0 0 1 7 7 v15 h${-w}Z" fill="${RED}" stroke="${INK}" stroke-width="2"/>${head ? T(x + w / 2, y + 16, 9, head, { c: '#fff', w: 800, f: HEB, ls: 0 }) : ''}
    ${T(x + w / 2, y + h * .7, h * .42, big, { c: INK, w: 800, f: HEB, ls: -1 })}${T(x + w / 2, y + h - 9, 9, small, { c: RED, w: 700, f: HEB, ls: 0 })}</g>`;
  const rings = [.3, .7].map(k => `<rect x="${x + w * k - 3}" y="${y - 6}" width="6" height="13" rx="3" fill="${INK}"/>`).join('');
  (s.cals = s.cals || {})[n] = pages.length;
  return `<g><rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" rx="7" fill="${LINE}"/>${pages.map((p, i) => page(p, i)).reverse().join('')}${rings}</g>`;
}
function TEAR(s, n, t, i) {
  if (!s.cals?.[n]) return later(s, () => TEAR(s, n, t, i));
  s.a(`tl.to("#${s.id}-${n}-p${i}",{rotation:-26,x:-26,y:-30,opacity:0,transformOrigin:"0% 0%",duration:.34,ease:"power2.in"},${r3(t)});`);
  if (i + 1 < (s.cals?.[n] || 0)) BUMP(s, `${n}-p${i + 1}`, t + .2, 1.06);
}

/* scales: a balance with two pans; left / right = markup drawn around (0,0) sitting on each pan. TIP(s,n,t,deg) tilts it
   (positive = the right pan goes down) with a wobble. */
function scales(s, n, x, y, { arm = 104, left = '', right = '' } = {}) {
  const id = `${s.id}-${n}`;
  const pan = (side, inner) => `<g transform="translate(${side === 'l' ? x - arm : x + arm} ${y})"><g id="${id}-p${side}"><path d="M0 0 L-30 46 M0 0 L30 46" stroke="${INK}" stroke-width="1.6"/><path d="M-40 46 Q0 66 40 46Z" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><g transform="translate(0 44)">${inner}</g></g></g>`;   // outer g places the pan, inner g (id) is what TIP moves
  (s.scales = s.scales || {})[n] = { x, y, arm };
  return `<g><path d="M${x} ${y} V${y + 104} M${x - 34} ${y + 108} h68" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><rect x="${x - 28}" y="${y + 104}" width="56" height="10" rx="4" fill="${INK}"/>
  <g id="${id}-beam"><rect x="${x - arm - 4}" y="${y - 4}" width="${arm * 2 + 8}" height="8" rx="4" fill="${INK}"/></g><circle cx="${x}" cy="${y}" r="9" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>${pan('l', left)}${pan('r', right)}</g>`;
}
function TIP(s, n, t, deg, o = {}) {
  if (!s.scales?.[n]) return later(s, () => TIP(s, n, t, deg, o)); const { d = .55 } = o;
  const S = s.scales[n], id = `${s.id}-${n}`, dy = r3(S.arm * Math.sin(deg * Math.PI / 180)), e = '"elastic.out(1, 0.35)"';
  s.a(`tl.to("#${id}-beam",{rotation:${deg},svgOrigin:"${S.x} ${S.y}",duration:${d},ease:${e}},${r3(t)});`);
  s.a(`tl.to("#${id}-pl",{y:${-dy},duration:${d},ease:${e}},${r3(t)});tl.to("#${id}-pr",{y:${dy},duration:${d},ease:${e}},${r3(t)});`);
}

/* MONKPOP: the presenter grows for a beat (key moment) and settles back. MONKZOOM holds him bigger from t0 to t1. */
const MONKPOP = (s, t, k = 1.1) => s.a(`tl.fromTo("#${s.id}-mkzoom",{scale:1,svgOrigin:"${RX + RW / 2} ${H}"},{scale:${k},svgOrigin:"${RX + RW / 2} ${H}",duration:.12,ease:"back.out(2)",yoyo:true,repeat:1,repeatDelay:.25,immediateRender:false},${r3(t)});`);
function MONKZOOM(s, t0, t1, k = 1.12) {
  s.a(`tl.to("#${s.id}-mkzoom",{scale:${k},svgOrigin:"${RX + RW / 2} ${H}",duration:.18,ease:"back.out(1.8)"},${r3(t0)});`);
  s.a(`tl.to("#${s.id}-mkzoom",{scale:1,svgOrigin:"${RX + RW / 2} ${H}",duration:.18,ease:"power2.inOut"},${r3(t1)});`);
}

/* ---------- captions: narration word by word (*red* _green_ key words) ---------- */
const CAP_S = 27, CAP_W = 344, CAP_Y = 124, STAGE_Y = 30, CLIP_Y = -400;   // Guy 2026-11-19: never cut art under the captions
   // v6: captions lower, stage moved down, stage clipped under captions
/* caption boxes (Guy 2026-11-19): a paper-coloured box behind every caption line, sized to the line + margins.
   Widths are measured in the real font by build/measure-caps.mjs into build/capw.json (run gen → measure → gen). */
const CAPW = fs.existsSync(path.join(ROOT, 'build/capw.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'build/capw.json'), 'utf8')) : {};
const CAPLINES = [];
const CAPBOX = { px: 9, py: 6, rx: 7 };
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
    ws.forEach(k => { const cw = CAP_S * .56; const w = (k.w.length + 1) * cw; if (lw + w > CAP_W && lines.at(-1).length) { lines.push([]); lw = 0; } lines.at(-1).push(k); lw += w; });
    const pstart = t;
    let g = '';
    lines.forEach((ln, li) => {
      const key = ln.map(k => (k.st ? '*' : '') + k.w).join(' '); CAPLINES.push(key);
      const lw = CAPW[key] ?? ln.reduce((a, k) => a + (k.w.length + 1) * CAP_S * .56, 0), by = CAP_Y + li * CAP_S * 1.13;
      const bid = `${s.id}-cb${pi}-${li}`;
      g += `<g id="${bid}" opacity="0"><rect x="${r3(372 - lw - CAPBOX.px)}" y="${r3(by - CAP_S * .84 - CAPBOX.py)}" width="${r3(lw + CAPBOX.px * 2)}" height="${r3(CAP_S * 1.06 + CAPBOX.py * 2)}" rx="${CAPBOX.rx}" fill="${PAPER}"/><rect x="${r3(372 - lw - CAPBOX.px)}" y="${r3(by - CAP_S * .84 - CAPBOX.py)}" width="${r3(lw + CAPBOX.px * 2)}" height="${r3(CAP_S * 1.06 + CAPBOX.py * 2)}" rx="${CAPBOX.rx}" fill="url(#${s.id}-grid)"/></g>`;
      s.a(`tl.set("#${bid}",{opacity:1},${r3(WT ? WT[wi][0] : t)});`);
      g += `<text x="372" y="${(CAP_Y + li * CAP_S * 1.13).toFixed(1)}" direction="rtl" text-anchor="start" font-family="${HEB}" font-weight="700" font-size="${CAP_S}" fill="${INK}">`;
      ln.forEach(k => {
        const wid = `${s.id}-w${wi++}`, dur = (k.w.length + 1) * per; s.wtok.push({ w: k.w, id: wid });
        g += k.st ? `<tspan id="${wid}" fill-opacity="0" font-weight="900" fill="${k.st === 2 ? GREEN : RED}">${esc(k.w)} </tspan>` : `<tspan id="${wid}" fill-opacity="0">${esc(k.w)} </tspan>`;
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

/* ---------- the monk (presenter): fixed, talking, blinking, gesture changes every ~0.6s, sway, nods ---------- */
const CLOSED = p => { const e = POSE[p].mouth || POSE[p].exp; return e === 'o' ? 'shush' : (e === 'laugh' || e === 'open') ? 'smile' : e === 'smile' ? 'smile' : 'smirk'; };
const OPENM = p => { const e = POSE[p].mouth || POSE[p].exp; return (e === 'smile' || e === 'smirk') ? 'talk' : e; };   // every pose really opens its mouth when he speaks
function poseSeq(s, plan) {
  /* plan = [[t, pose | [pool]], ...] → change pose on a word start every >= .55s, cycling the pool */
  const out = []; const starts = s.words.map(w => w[0]);
  plan.forEach(([t0, pool], si) => { pool = Array.isArray(pool) ? pool : [pool]; const t1 = plan[si + 1] ? plan[si + 1][0] : s.dur;
    out.push([t0, pool[0]]); let last = t0, k = 0;
    if (pool.length > 1) starts.forEach(ts => { if (ts > last + .55 && ts < t1 - .3) { k = (k + 1) % pool.length; out.push([ts, pool[k]]); last = ts; } }); });
  return out;
}
function presenterBlock(s, poses, glow) {
  const seq = poseSeq(s, poses);
  const used = [...new Set(seq.map(x => x[1]))];
  let svg = '';
  used.forEach(p => {
    const base = POSE[p];
    const V = { o: { ...base, mouth: OPENM(p) }, c: { ...base, mouth: CLOSED(p) }, b: { ...base, eyes: undefined, exp: 'laugh', mouth: CLOSED(p) }, w: { ...base, eyes: 'wink', mouth: CLOSED(p) } };
    ['c', 'o', 'b', 'w'].forEach(v => { svg += `<g id="${s.id}-mk-${p}-${v}" opacity="0">${PRESENTER({ ...V[v], glowc: null }, RX, RY, RW)}</g>`; });
  });
  const p0 = Array.isArray(poses[0][1]) ? poses[0][1][0] : poses[0][1];
  const gc = glow || (['thumb', 'laugh'].includes(p0) ? GREEN : ['shock', 'worry'].includes(p0) ? RED : GOLD);
  const k = RW / 400, hx = RX + 200 * k, hy = RY + 205 * k;
  const glowSvg = `<g id="${s.id}-mkglow">${htField(RX + 212 * k, RY + 236 * k, 178 * k, gc, .42, 5.6, 2.4)}</g>`;
  const state = t => {
    let p = seq[0][1]; for (const [ts, pp] of seq) if (t >= ts) p = pp;
    const open = ENV ? mouthOpen((s.t0 || 0) + t * (s.f || 1)) : (() => { const tk = s.words.find(([a, b]) => t >= a && t < b); return tk && ((t - tk[0]) % .17) < .1; })();
    let v = open ? 'o' : 'c';
    if (open) return `${p}-${v}`;   // never blink the mouth shut while he speaks
    const bt = (t - .7) % 1.9, bi = Math.floor((t - .7) / 1.9); if (t > .7 && bt >= 0 && bt < .1) v = bi % 3 === 1 ? 'w' : 'b';
    if (bi % 3 === 1 && bt >= 0 && bt < .22 && t > .7) v = 'w';
    return `${p}-${v}`;
  };
  let prev = null;
  used.forEach(p => ['c', 'o', 'b', 'w'].forEach(v => s.a(`tl.set("#${s.id}-mk-${p}-${v}",{opacity:0},0);`)));
  const FPS = 30, nf = Math.round(s.dur * (s.f || 1) * FPS);   // sample real frames, then convert back to scene time (times are scaled by s.f on write)
  for (let f = 0; f <= nf; f++) {
    const t = f / FPS / (s.f || 1), st = state(t);
    if (st !== prev) { if (prev) s.a(`tl.set("#${s.id}-mk-${prev}",{opacity:0},${r3(t)});`); s.a(`tl.set("#${s.id}-mk-${st}",{opacity:1},${r3(t)});`); prev = st; }
  }
  /* gesture pop on every pose change */
  seq.slice(1).forEach(([t], i) => s.a(`tl.fromTo("#${s.id}-mkpop",{y:10,scale:.965,transformOrigin:"50% 100%"},{y:0,scale:1,transformOrigin:"50% 100%",duration:.2,ease:"back.out(2.6)",immediateRender:false},${r3(t)});`));
  /* nod + pop lines around the head on every key word */
  let fx = '';
  s.keys.forEach((t, i) => {
    s.a(`tl.fromTo("#${s.id}-mknod",{rotation:0,svgOrigin:"${hx} ${RY + 440 * k}"},{rotation:${i % 2 ? 2.6 : -2.6},svgOrigin:"${hx} ${RY + 440 * k}",duration:.1,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`);
    const n = `${s.id}-hfx${i}`, side = i % 2 ? 1 : -1;
    fx += `<g id="${n}" opacity="0">${[0, 1, 2].map(j => { const a = -Math.PI / 2 + side * (.55 + j * .32); return `<line x1="${(hx + Math.cos(a) * 92).toFixed(1)}" y1="${(hy + Math.sin(a) * 96).toFixed(1)}" x2="${(hx + Math.cos(a) * 108).toFixed(1)}" y2="${(hy + Math.sin(a) * 112).toFixed(1)}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`; }).join('')}</g>`;
    s.a(`tl.fromTo("#${n}",{opacity:0,scale:.6,transformOrigin:"50% 50%"},{opacity:1,scale:1,transformOrigin:"50% 50%",duration:.1},${r3(t)});tl.to("#${n}",{opacity:0,duration:.12},${r3(t + .32)});`);
    s.a(`tl.fromTo("#${s.id}-campunch",{scale:1,svgOrigin:"200 300"},{scale:1.03,svgOrigin:"200 300",duration:.08,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`);
  });
  /* sway (rotation around the feet) + breath bob */
  const n = Math.max(1, Math.ceil(s.dur / 1.1));
  s.a(`tl.fromTo("#${s.id}-mksway",{rotation:-2.2,svgOrigin:"${hx} ${H + 40}"},{rotation:2.2,svgOrigin:"${hx} ${H + 40}",duration:1.1,ease:"sine.inOut",yoyo:true,repeat:${n}},0);`);
  s.a(`tl.fromTo("#${s.id}-mkbob",{y:0},{y:-4,duration:.55,ease:"sine.inOut",yoyo:true,repeat:${n * 2}},0);`);
  /* v5 head rig: tilt per pose, nod on key words, wobble out of phase with the sway */
  const HS = `#${s.id}-mkpop`, tilt = (p, i) => (TILT[p] ?? 0) + (i % 2 ? 1.2 : -1.2);
  let pa = tilt(seq[0][1], 0);
  s.a(`tl.set("${HS} .rhd",{attr:{transform:"rotate(${pa} 200 322)"}},0);`);
  seq.slice(1).forEach(([t, p], i) => { const na = +tilt(p, i + 1).toFixed(2);
    s.a(`tl.fromTo("${HS} .rhd",{attr:{transform:"rotate(${pa} 200 322)"}},{attr:{transform:"rotate(${na} 200 322)"},duration:.26,ease:"back.out(1.8)",immediateRender:false},${r3(t)});`); pa = na; });
  s.keys.forEach((t, i) => s.a(`tl.fromTo("${HS} .rhn",{attr:{transform:"translate(0 0) rotate(0 200 322)"}},{attr:{transform:"translate(0 4) rotate(${i % 2 ? -3 : 3} 200 322)"},duration:.1,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`));
  s.a(`tl.fromTo("${HS} .rhw",{attr:{transform:"rotate(-1.3 200 322)"}},{attr:{transform:"rotate(1.3 200 322)"},duration:.75,ease:"sine.inOut",yoyo:true,repeat:${Math.ceil(s.dur / .75)}},0);`);
  s.a(`tl.fromTo("#${s.id}-mkglow",{scale:1,transformOrigin:"50% 50%"},{scale:1.06,transformOrigin:"50% 50%",duration:.9,ease:"sine.inOut",yoyo:true,repeat:${Math.ceil(s.dur / .9)}},0);`);
  return `<g id="${s.id}-mkzoom">${glowSvg}<g id="${s.id}-mksway"><g id="${s.id}-mkbob"><g id="${s.id}-mknod"><g id="${s.id}-mkpop"><g id="${s.id}-mkwig">${svg}</g></g></g></g></g>${fx}</g>`;   // mkzoom: MONKPOP / MONKZOOM (v7b)
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
const PHOTO_DESC = {};   // per film: photo name → placeholder label
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
const PROP_K = 1.22, PROP_O = 240;   // Guy 2026-11-19: everything bigger — all stage props scaled around (200, PROP_O); per scene: s.propK / s.propO
function build(s, { hdr, cap, poses, glow, props, drift = [] }) {
  const capSvg = captions(s, cap);
  const propSvg = props(s);
  if (!propSvg.includes('assets/vintage/')) console.warn(`NO CUT-OUT ${s.id}: no generated vintage cut-out — fine only for a deliberate drawn-only beat (≈¼ of the film at most, SKILL 3d), otherwise add one`);
  (s.later || []).forEach(f => f());   // v7: ROLL / TYPE called before their rollNum / typeLine was drawn
  DRIFT(s, drift);
  poses = poses.map(([t, p]) => [t === 'end' ? r3((s.words.at(-1)?.[1] ?? s.dur - .6) + .03) : t, p]);   // 'end' = right after the last word (a laugh)
  const mkSvg = presenterBlock(s, poses, glow);
  const present = [...new Set([...drift, ...WIGGLY])].filter(n => propSvg.includes(`id="${s.id}-${n}-w"`));
  present.forEach((n, i) => WIGGLE(s, `#${s.id}-${n}-w`, { f: 4 + (i % 3), a: /^(stamp|st\d|t1|t2|chip|k\d)$/.test(n) ? 3.2 : 1.8, p: 1.6 }));
  WIGGLE(s, `#${s.id}-mkwig`, { f: 3.5, a: .9, p: 1.4 });
  s.a(`tl.fromTo("#${s.id}-cam",{scale:1,svgOrigin:"200 290"},{scale:1.08,svgOrigin:"200 290",duration:${r3(s.dur * (s.f || 1))},ease:"none"},0);`);
  const blob = morphs(s);
  const cuts = [0, ...s.cuts, s.dur].sort((a, b) => a - b), gap = Math.max(...cuts.slice(1).map((v, i) => v - cuts[i]));
  if (gap > 1.55) console.warn(`HOLD ${s.id}: ${gap.toFixed(2)}s without a shot change`);
  s.maxHold = gap;
  return `${paper(s.id)}<g style="display:none">${s.W('hdr', hdr)}</g><defs><clipPath id="${s.id}-stc"><rect x="-200" y="${CLIP_Y}" width="800" height="${s.clipH ?? 900}"/></clipPath></defs><g transform="translate(0 ${STAGE_Y})" clip-path="url(#${s.id}-stc)"><g id="${s.id}-campunch"><g id="${s.id}-shot" transform="matrix(1 0 0 1 0 0)"><g id="${s.id}-cam"><g id="${s.id}-mo"><g transform="translate(200 ${s.propO ?? PROP_O}) scale(${s.propK ?? PROP_K}) translate(-200 ${-(s.propO ?? PROP_O)})">${propSvg}${s.fx}</g></g></g></g></g>${blob}</g>${mkSvg}${s.W('cap', capSvg + s.capfx)}${s.top}${htWipe(s)}`;
}
/* stamp punch: camera kick on a slam */
const HDRI = (s, left, label, id, val) => `${MT(28, 40, 8.6, left)}<text x="372" y="40" font-family="${MONO}" font-size="8.6" text-anchor="end" fill="${MUTE}" letter-spacing=".6">${esc(label)} <tspan id="${s.id}-${id}" fill="${RED}" font-weight="700">${esc(val)}</tspan></text>`;
function BUMPD(s, n, t, k = 1.08) { s.a(`tl.fromTo("${s.q(n)}-d",{scale:1,transformOrigin:"50% 50%"},{scale:${k},transformOrigin:"50% 50%",duration:.07,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`); }
const PUNCH = (s, t, k = 1.04) => s.a(`tl.fromTo("#${s.id}-campunch",{scale:1,svgOrigin:"200 300"},{scale:${k},svgOrigin:"200 300",duration:.06,ease:"power2.out",yoyo:true,repeat:1,immediateRender:false},${r3(t)});`);

/* ---------- narration: one take, optionally sped up → scenes and caption words follow the real speech ---------- */
const VO_SPEED = 1.0, VO_FILE = 'assets/vo/narration.mp3';
const VO_TR = fs.existsSync(path.join(ROOT, 'assets/vo/take.transcript.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/vo/take.transcript.json'), 'utf8')).map(w => ({ w: w.text, a: w.start / VO_SPEED, b: w.end / VO_SPEED })) : null;
/* lip sync (Guy, 2026-11-18: "the mouth is closed while there is text"): the mouth follows the real voice loudness, 60 samples/s.
   Open = within 28 dB of the voice's loud peaks and not in a dip 16 dB under the local max (±0.1s) → flaps on syllables, ~70% open while speaking. */
const ENV = (() => { if (!fs.existsSync(path.join(ROOT, VO_FILE))) return null;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(ROOT, VO_FILE), '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  const x = new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1), Wn = 16000 / 60 | 0, e = [];
  for (let i = 0; i + Wn <= x.length; i += Wn) { let q = 0; for (let j = i; j < i + Wn; j++) q += x[j] * x[j]; e.push(10 * Math.log10(q / Wn / 1073741824 + 1e-12)); }
  const p95 = [...e].sort((a, b) => a - b)[Math.floor(e.length * .95)];
  return e.map((v, i) => { let m = -200; for (let k = Math.max(0, i - 6); k <= Math.min(e.length - 1, i + 6); k++) m = Math.max(m, e[k]); return v > p95 - 28 && v > m - 16; });
})();
const MOUTH_LEAD = .03;   // open a hair before the sound, like a real mouth
const mouthOpen = gt => { if (!ENV) return false; const i = Math.round((gt + MOUTH_LEAD) * 60); return !!ENV[i]; };
/* background music (Guy's pick 2026-11-18: Sitar Radiance, ≈ -22 LUFS under the voice; no carve — it buried the bed) */
const MUSIC_FILE = 'assets/music/sitar-radiance.mp3', MUSIC_VOL = .47;
const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');   // keeps Hebrew letters
/* ---------- scenes ---------- */
const S = [];
const add = (id, dur, vo, scene, motion, opts, def) => S.push({ id, dur, vo, scene, motion, opts, def });
/* =====================================================================
   v8 COLLAGE KIT (Guy, body-receiver 2026-11-19): vintage cut-out photos + constant-motion verbs + crowds.
   ===================================================================== */
const CUTDIR = n => fs.existsSync(path.join(ROOT, `assets/vintage/cut-color/${n}.png`)) ? 'cut-color' : 'cut';
const cut = (s, name, cx, cy, w, { rot = 0 } = {}) => { const f = s.cutf ? '' : (s.cutf = 1, `<defs><filter id="${s.id}-cutf" x="-15%" y="-15%" width="135%" height="135%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="d"/><feFlood flood-color="#fbfaf7"/><feComposite in2="d" operator="in" result="border"/><feGaussianBlur in="d" stdDeviation="1.6" result="b"/><feOffset in="b" dx="1.6" dy="2.6" result="o"/><feFlood flood-color="#2a2016" flood-opacity=".38"/><feComposite in2="o" operator="in" result="sh"/><feMerge><feMergeNode in="sh"/><feMergeNode in="border"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`);
  if (!fs.existsSync(path.join(ROOT, `assets/vintage/${CUTDIR(name)}/${name}.png`))) console.warn(`MISSING CUT-OUT ${name}: run python3 build/vintage.py ${name}`);
  return `${f}<g transform="rotate(${rot} ${cx} ${cy})"><image href="assets/vintage/${CUTDIR(name)}/${name}.png" x="${r3(cx - w / 2)}" y="${r3(cy - w / 2)}" width="${w}" height="${w}" filter="url(#${s.id}-cutf)" data-layout-allow-overlap="true"/></g>`; };
function BUZZ(s, n, bursts) {   // phone vibration: bursts = [[t, count], …] — short shakes with pauses, varied rhythm
  const sel = s.q(n); bursts.forEach(([t, c]) => { for (let i = 0; i < c; i++) { const k = i % 2 ? -1 : 1; s.a(`tl.set(${J(sel)},{x:${2.6 * k},rotation:${2.4 * k},transformOrigin:"50% 50%"},${r3(t + i * .04)});`); } s.a(`tl.set(${J(sel)},{x:0,rotation:0},${r3(t + c * .04)});`); });
}
const WAVE = (s, n, t, cx, cy, d = .8, a = .55, b = 1.7) => s.a(`tl.fromTo("${s.q(n)}",{scale:${a},opacity:1,svgOrigin:"${cx} ${cy}"},{scale:${b},opacity:0,svgOrigin:"${cx} ${cy}",duration:${d},ease:"power1.out",immediateRender:false},${r3(t)});`);
const arcPair = (x, y, r, c = GOLD, w = 4) => { const P = a => [r3(x + Math.cos(a) * r), r3(y + Math.sin(a) * r)], A = Math.PI / 180;
  const [x1, y1] = P(-38 * A), [x2, y2] = P(38 * A), [x3, y3] = P(142 * A), [x4, y4] = P(218 * A);
  return `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} M${x3} ${y3} A${r} ${r} 0 0 1 ${x4} ${y4}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`; };
const ring2 = (x, y, r, c, w = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
function LAUGH(s, n, t0, t1, i = 0) {   // laughing bob: quick squash + tilt, out of phase per person
  const d = .16 + (i % 3) * .03;
  s.a(`tl.fromTo("${s.q(n)}-d",{scaleY:1,rotation:${i % 2 ? -3 : 3},transformOrigin:"50% 100%"},{scaleY:.94,rotation:${i % 2 ? 3 : -3},transformOrigin:"50% 100%",duration:${d},ease:"sine.inOut",yoyo:true,repeat:${Math.ceil((t1 - t0) / d)},immediateRender:false},${r3(t0)});`);
}
function SHIVER(s, n, t0, t1, a = 3, d = .11) {   // vibrating with small rotations (real heart / brain)
  s.a(`tl.fromTo("${s.q(n)}-d",{rotation:${-a},transformOrigin:"50% 50%"},{rotation:${a},transformOrigin:"50% 50%",duration:${d},ease:"sine.inOut",yoyo:true,repeat:${Math.ceil((t1 - t0) / d)},immediateRender:false},${r3(t0)});`);
}
function SCROLL(s, n, t0, t1, dx, d) { s.a(`tl.fromTo("${s.q(n)}",{x:${-dx}},{x:0,duration:${d},ease:"none",repeat:${Math.ceil((t1 - t0) / d)},immediateRender:false},${r3(t0)});`); }
const QC = [RED, GOLD, SKY, GREEN, VIOLET, ORANGE];
/* v8 motion: float (each piece drifts on its own), orbit (small circles), bob, spin-wobble, breathe-scale */
function FLOAT(s, n, t0, t1, i = 0, a = 5) { const dx = (i % 2 ? 1 : -1) * (a * .7 + (i % 3)), dy = (i % 3 - 1 || 1) * a, d = .7 + (i % 4) * .12; s.a(`tl.fromTo("${s.q(n)}-d",{x:0,y:0},{x:${dx},y:${dy},duration:${d},ease:"sine.inOut",yoyo:true,repeat:${Math.ceil((t1 - t0) / d)},immediateRender:false},${r3(t0)});`); }
function ORBIT(s, n, t0, t1, r = 8, d = .5, ph = 0) { const N = Math.ceil((t1 - t0) / d); s.a(`tl.fromTo("${s.q(n)}",{x:${-r}},{x:${r},duration:${d},ease:"sine.inOut",yoyo:true,repeat:${N},immediateRender:false},${r3(t0 + ph)});tl.fromTo("${s.q(n)}",{y:${-r}},{y:${r},duration:${d},ease:"sine.inOut",yoyo:true,repeat:${N},immediateRender:false},${r3(t0 + ph + d / 2)});`); }
function PULSEL(s, n, t0, t1, k = 1.06, d = .2, origin = '50% 50%') { s.a(`tl.fromTo("${s.q(n)}",{scale:1,transformOrigin:"${origin}"},{scale:${k},transformOrigin:"${origin}",duration:${d},ease:"sine.inOut",yoyo:true,repeat:${Math.ceil((t1 - t0) / d)},immediateRender:false},${r3(t0)});`); }
const bigStamp = (x, y, txt, { c = RED, s = 46, rot = -10, id } = {}) => { const w = txt.length * s * .62 + 40, h = s * 1.5; return `<g transform="translate(${x} ${y}) rotate(${rot})"${id ? ` filter="url(#${id}-grunge)"` : ''}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#fff" fill-opacity=".82" stroke="${c}" stroke-width="7"/><rect x="${-w / 2 + 7}" y="${-h / 2 + 7}" width="${w - 14}" height="${h - 14}" rx="4" fill="none" stroke="${c}" stroke-width="2"/>${T(0, s * .36, s, txt, { c, w: 900, f: HEB, ls: 0 })}</g>`; };
/* crowd layouts — Guy: centred, big, sporadic sizes, max two copies of a person, each copy opposite its twin */
const CROWD = [[0, 240, 160, 138, 0], [3, 150, 163, 114, 0], [1, 307, 207, 126, 1], [5, 229, 210, 106, 0], [2, 89, 214, 126, 1], [4, 157, 221, 106, 1], [4, 243, 271, 112, 0], [2, 311, 278, 132, 0], [5, 171, 282, 112, 1], [1, 93, 285, 120, 0], [3, 250, 329, 120, 1], [0, 160, 332, 132, 1]];   // Guy 2026-11-19: tighter, bigger, each copy opposite its twin
const CROWD6 = [[0, 252, 175, 150, 0], [2, 144, 177, 138, 1], [1, 308, 248, 142, 1], [1, 92, 252, 134, 0], [2, 256, 323, 146, 0], [0, 148, 325, 142, 1]];   // 3 people x 2, each copy opposite its twin
const cutF = (s, name, cx, cy, w, flip, rot = 0) => flip ? `<g transform="translate(${2 * cx} 0) scale(-1 1)">${cut(s, name, cx, cy, w, { rot })}</g>` : cut(s, name, cx, cy, w, { rot });
const DIRS = ['left', 'right', 'up', 'drop', 'pophard', 'big'];
function crowd(s, names, t0, step, { laugh = 1, until } = {}) {
  until = until ?? s.dur;
  const L = names.length >= 6 ? CROWD : CROWD6; s.crowdN = L.length;   // never more than two copies of a person
  L.forEach(([k], i) => { IN(s, 'p' + i, t0 + i * step, DIRS[i % 6]); if (laugh) LAUGH(s, 'p' + i, t0 + i * step + .15, until, i); });
  return L.map(([k, x, y, w, f], i) => s.W('p' + i, cutF(s, names[k], x, y, w, f, (i * 7) % 11 - 5))).join('');
}
const SPINR = (s, n, t, from, to, cx, cy, d = .3, ease = 'back.out(1.6)') => s.a(`tl.fromTo("${s.q(n)}",{attr:{transform:"rotate(${from} ${cx} ${cy})"}},{attr:{transform:"rotate(${to} ${cx} ${cy})"},duration:${d},ease:"${ease}",immediateRender:false},${r3(t)});`);
const RIPPLE = (s, n, t, cx, cy, d = .7) => s.a(`tl.fromTo("${s.q(n)}",{scale:.2,opacity:.9,svgOrigin:"${cx} ${cy}"},{scale:1.5,opacity:0,svgOrigin:"${cx} ${cy}",duration:${d},ease:"power1.out",immediateRender:false},${r3(t)});`);

/* ---------- v9 helpers (humming-om, 2026-11-20 — SKILL 3d) ---------- */
/* R2 scatter over a band of the stage: [x, y, rot, colour, size] — floods without diagonals */
const HF = (n, y0 = 150, h = 220) => Array.from({ length: n }, (_, i) => [r3(26 + 348 * ((.5 + i * .7548776) % 1)), r3(y0 + h * ((.5 + i * .5698403) % 1)), (i * 29) % 40 - 20, QC[i % 6], 11 + (i * 7) % 11]);
/* flood timing: slow at first, then a rush */
const gradual = (i, n, t0, span) => r3(t0 + span * Math.pow(i / n, .8));
/* Wipes made of the scene's OWN elements (Guy: never unrelated shapes). items = [[x, y, …], …] in screen coords (400×711);
   draw(item) returns OPAQUE svg. End of scene A: WIPE_IN + s.top += wipeSvg(…); start of scene B: WIPE_OUT with the same items + s.top += wipeSvg(…). */
const wipeSvg = (s, pre, items, draw) => `<g data-layout-allow-overlap="true">${items.map((it, i) => `<g id="${s.id}-${pre}${i}">${draw(it)}</g>`).join('')}</g>`;
const WIPE_IN = (s, pre, items, t0, span, dist) => items.forEach((it, i) => s.a(`tl.fromTo("#${s.id}-${pre}${i}",{scale:0,transformOrigin:"50% 50%"},{scale:1,transformOrigin:"50% 50%",duration:.18,ease:"back.out(2)",immediateRender:true},${r3(t0 + Math.min(1, dist(it)) * span + ((i * 7) % 5) * .012)});`));
const WIPE_OUT = (s, pre, items, t0, span, ox = 200, oy = 356) => items.forEach(([x, y], i) => { const a = Math.atan2(y - oy, x - ox), d = Math.min(1, Math.hypot(x - ox, y - oy) / 420); s.a(`tl.fromTo("#${s.id}-${pre}${i}",{x:0,y:0,scale:1,transformOrigin:"50% 50%"},{x:${r3(Math.cos(a) * 520)},y:${r3(Math.sin(a) * 520)},scale:.4,transformOrigin:"50% 50%",duration:.34,ease:"power2.in",immediateRender:true},${r3(t0 + (1 - d) * span * .5 + ((i * 7) % 5) * .01)});`); });
/* a hex grid that covers the whole frame, for wipe items: [x, y, k] */
const WIPEGRID = (dx = 31, dy = 27) => { const o = []; for (let r = 0; r * dy < 740; r++) for (let c = 0; c * dx < 430; c++) o.push([r3(-12 + c * dx + (r % 2) * dx / 2), r3(-12 + r * dy), (r * 3 + c * 5) % 4]); return o; };
/* s.clipH = 1600 in a scene lets a prop travel through the presenter area (e.g. the monk jumping into the scene) without the stage clip cutting it */

/* ===== SCENES =====
   No demo on purpose (Guy, 2026-11-19): every old drawn-icon example got copied. Write this film's scenes here.
   The reference is the film Guy approved: videos/body-receiver/build/gen.mjs (scenes from `add('s01'` on) —
   big generated vintage cut-outs in every scene, crowds, floods, constant motion, a laughing face after a laugh. */
/* density (SKILL 3d): smaller hero images + floods of small things in every scene */
const IMGK = .57, cutS = (s, n, x, y, w, o) => cut(s, n, x, y, r3(w * IMGK), o);
const FLOOD = (s, pre, pts, t0, span, draw, { t1, shiver = 1, kind = 'pophard' } = {}) => { s.fl = (s.fl || '') + pts.map((p, i) => { const t = gradual(i, pts.length, t0, span); IN(s, pre + i, t, kind); FLOAT(s, pre + i, t + .15, t1 ?? s.dur, i, 4); if (shiver) SHIVER(s, pre + i, t + .15, t1 ?? s.dur, 7, .07 + (i % 3) * .02); return s.W(pre + i, draw(p, i)); }).join(''); };
const ZD = ([x, y, r, c, z]) => zzG(x, y, 14 + z, r * 3, i => 0 || RED);
const ringD = ([x, y, r, c, z]) => `<ellipse cx="${x}" cy="${y}" rx="${z}" ry="${r3(z * .32)}" fill="none" stroke="${INK}" stroke-width="5" transform="rotate(${r} ${x} ${y})"/><ellipse cx="${x}" cy="${y}" rx="${z}" ry="${r3(z * .32)}" fill="none" stroke="${RED}" stroke-width="3" transform="rotate(${r} ${x} ${y})"/>`;
/* small drawn things */
const tearG = (x, y, r = 8, c = SKY) => `<path d="M${x} ${r3(y - r * 1.7)} C${r3(x + r * .9)} ${r3(y - r * .4)} ${r3(x + r)} ${y} ${x} ${r3(y + r)} C${r3(x - r)} ${y} ${r3(x - r * .9)} ${r3(y - r * .4)} ${x} ${r3(y - r * 1.7)} Z" fill="${c}" stroke="${INK}" stroke-width="1.6"/><circle cx="${r3(x - r * .3)}" cy="${r3(y - r * .1)}" r="${r3(r * .25)}" fill="#fff" opacity=".7"/>`;
const scribG = (x, y, r = 12, c = RED) => { let d = `M${x} ${y}`; for (let k = 0; k < 9; k++) { const a = k * 2.3, q = r * (.55 + (k % 3) * .2); d += ` Q${r3(x + Math.cos(a + 1.1) * r * 1.2)} ${r3(y + Math.sin(a + 1.1) * r * 1.2)} ${r3(x + Math.cos(a) * q)} ${r3(y + Math.sin(a) * q)}`; } return `<g><path d="${d}" stroke="${INK}" stroke-width="5.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`; };
const zzG = (x, y, len = 34, rot = 0, c = RED) => `<path d="M${x} ${y} l${len * .2} -7 l${len * .2} 14 l${len * .2} -14 l${len * .2} 14 l${len * .2} -7" transform="rotate(${rot} ${x} ${y})" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const heartG = (x, y, r = 10, c = RED) => `<path d="M${x} ${r3(y + r * .9)} C${r3(x - r * 1.6)} ${r3(y - r * .1)} ${r3(x - r * .9)} ${r3(y - r * 1.25)} ${x} ${r3(y - r * .45)} C${r3(x + r * .9)} ${r3(y - r * 1.25)} ${r3(x + r * 1.6)} ${r3(y - r * .1)} ${x} ${r3(y + r * .9)} Z" fill="${c}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${r3(x - r * .5)}" cy="${r3(y - r * .4)}" r="${r3(r * .2)}" fill="#fff" opacity=".6"/>`;
const plasterG = (x, y, rot = 0, k = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><rect x="-26" y="-9" width="52" height="18" rx="9" fill="#e9b98f" stroke="${INK}" stroke-width="1.8"/><rect x="-9" y="-7" width="18" height="14" rx="2" fill="#f6dcc2" stroke="#c48d62" stroke-width="1"/>${[-18, -13, 13, 18].map(v => `<circle cx="${v}" cy="0" r="1" fill="#c48d62"/>`).join('')}</g>`;
const plateG = (x, y, k = 0) => `<g><rect x="${x - 17}" y="${y - 15}" width="34" height="30" rx="6" fill="${['#9aa3ad', '#b4bcc4', '#8c949e', '#a7afb8'][k]}" stroke="${INK}" stroke-width="2"/><path d="M${x - 12} ${y - 9} h24" stroke="#e8ecef" stroke-width="2.4" opacity=".8" stroke-linecap="round"/><circle cx="${x - 11}" cy="${y + 8}" r="2.2" fill="${INK}"/><circle cx="${x + 11}" cy="${y + 8}" r="2.2" fill="${INK}"/></g>`;
const arrowG = (x, y, rot, c = RED) => `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x - 30} ${y} h44" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M${x - 30} ${y} h44" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M${x + 10} ${y - 10} l14 10 l-14 10 Z" fill="${c}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/></g>`;
const puffG = (x, y, k = 1, c = '#fbfaf7') => `<g transform="translate(${x} ${y}) scale(${k})" fill="${c}" stroke="${MUTE}" stroke-width="1.4"><circle cx="-7" cy="2" r="7"/><circle cx="2" cy="-4" r="9"/><circle cx="10" cy="3" r="6.5"/></g>`;
const biteG = (x, y, r = 12) => `<path d="M${x - r} ${y} A${r} ${r} 0 0 0 ${x + r} ${y}" fill="none" stroke="${RED}" stroke-width="3.4" stroke-dasharray="3 3.4" stroke-linecap="round"/>`;
const bubbleG = (x, y, r, c = GOLD) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".6" stroke="${INK}" stroke-width="1.6"/><circle cx="${r3(x - r * .35)}" cy="${r3(y - r * .35)}" r="${r3(r * .28)}" fill="#fff" opacity=".7"/></g>`;
const QF = HF(26, 140, 230);
/* wipes made of the scene's own things (SKILL 3d) */
const WG = WIPEGRID(31, 27);
const plateDraw = ([x, y, k]) => plateG(x, y, k);
const heartDraw = ([x, y, k]) => heartG(x, y + 3, 17, [RED, '#d0342c', '#f05a4f', '#c2241e'][k]);
const plasterDraw = ([x, y, k]) => plasterG(x, y, [-30, 20, 45, -10][k], 1.25);
const DCEN = ([x, y]) => Math.hypot(x - 200, y - 300) / 470;
/* everyone-for-reason (2026-11-22): "כל אדם מגיע מסיבה" — Guy's script v1 (approved 2026-11-22, incl. the optional practice line), 11 scenes */
const MESSAGE = 'Everyone who enters our life comes for a reason — we influence others too; it cannot be proven, but it helps us learn, grow and feel.';

/* ---------- small drawn things for this film ---------- */
const envG = (x, y, k = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><rect x="-20" y="-13" width="40" height="26" rx="2.5" fill="${CARD}" stroke="${INK}" stroke-width="2"/><path d="M-20 -13 L0 3 L20 -13" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="0" cy="3" r="5.2" fill="${RED}" stroke="${INK}" stroke-width="1.4"/><circle cx="-1.4" cy="1.6" r="1.4" fill="#fff" opacity=".5"/></g>`;
const paperG = (x, y, rot = 0, k = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><rect x="-15" y="-19" width="30" height="38" rx="1.5" fill="${CARD}" stroke="${INK}" stroke-width="1.8"/>${[-11, -5, 1, 7].map(v => `<path d="M-9 ${v} H${v === 7 ? 3 : 9}" stroke="${MUTE}" stroke-width="1.6" stroke-linecap="round"/>`).join('')}<path d="M5 13 l3 3 l6 -7" stroke="${RED}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
const magG = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M20 20 L44 44" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M20 20 L44 44" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/><circle r="27" fill="#dfeef5" fill-opacity=".55" stroke="${INK}" stroke-width="3"/><circle r="22" fill="none" stroke="${GOLD}" stroke-width="3"/><path d="M-12 -10 Q-8 -16 -1 -17" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
const domG = (x, y, h, i) => { const w = r3(h * .46); return `<g transform="translate(${x} ${y})"><rect x="${r3(-w / 2 + 2)}" y="${r3(-h + 3)}" width="${w}" height="${h}" rx="${r3(w * .16)}" fill="#000" opacity=".2"/><rect x="${r3(-w / 2)}" y="${-h}" width="${w}" height="${h}" rx="${r3(w * .16)}" fill="${i === 8 ? RED : DARK}" stroke="${INK}" stroke-width="2"/><path d="M${r3(-w / 2 + 3)} ${r3(-h / 2)} H${r3(w / 2 - 3)}" stroke="#fff" stroke-width="1.4" opacity=".7"/>${[[-.22, -.78], [.22, -.66], [0, -.25], [-.22, -.14]].slice(0, 1 + (i % 4)).map(([a, b]) => `<circle cx="${r3(a * w)}" cy="${r3(b * h)}" r="${r3(w * .09)}" fill="#fff"/>`).join('')}</g>`; };
const sproutPath = 'M200 336 C198 316 204 300 200 282 C196 266 204 252 200 236';
const leafG = (x, y, rot, k = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><path d="M0 0 C10 -14 30 -14 38 0 C30 12 10 12 0 0Z" fill="${GREEN}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M2 0 H32" stroke="#bfe8cf" stroke-width="1.4"/></g>`;
const cloudG = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-92 26 C-122 24 -122 -14 -94 -18 C-100 -52 -56 -66 -36 -44 C-24 -76 26 -76 36 -46 C58 -66 100 -50 92 -18 C124 -12 120 28 90 28 C84 48 52 52 40 38 C20 58 -16 56 -30 40 C-48 54 -84 50 -92 26Z" fill="${CARD}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g><circle cx="${x - 70 * k}" cy="${y + 66 * k}" r="${10 * k}" fill="${CARD}" stroke="${INK}" stroke-width="2.4"/><circle cx="${x - 90 * k}" cy="${y + 88 * k}" r="${6 * k}" fill="${CARD}" stroke="${INK}" stroke-width="2.2"/>`;
const bulbG = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">${rays(0, -6, 34, 52, 12, GOLD, 4)}<path d="M-14 16 C-30 2 -26 -30 0 -32 C26 -30 30 2 14 16 V26 H-14Z" fill="${GOLD}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><rect x="-13" y="26" width="26" height="12" rx="3" fill="#9aa3ad" stroke="${INK}" stroke-width="2"/><path d="M-7 10 L-3 -6 L3 4 L7 -10" stroke="#fff4c8" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="-9" cy="-18" rx="5" ry="8" fill="#fff" opacity=".5" transform="rotate(30 -9 -18)"/></g>`;
const boardG = (x, y, w, h) => `<g><rect x="${x - w / 2 - 7}" y="${y - h / 2 - 7}" width="${w + 14}" height="${h + 14}" rx="5" fill="#8a5a2b" stroke="${INK}" stroke-width="2.4"/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="2" fill="#24473a" stroke="${INK}" stroke-width="1.6"/><path d="M${x - w / 2 + 10} ${y + h / 2 - 12} q20 -6 40 0" stroke="#d8e4dc" stroke-width="1.4" fill="none" opacity=".35"/></g>`;
const chalkHeart = (n, x, y, r) => `<path id="${n}" d="M${x} ${y + r * .9} C${x - r * 1.7} ${y - r * .1} ${x - r * .9} ${y - r * 1.3} ${x} ${y - r * .45} C${x + r * .9} ${y - r * 1.3} ${x + r * 1.7} ${y - r * .1} ${x} ${y + r * .9}Z" fill="none" stroke="#f3efe6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`;
const steamG = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#f4f1ea" stroke="${MUTE}" stroke-width="1.4"><circle cx="-7" cy="2" r="7"/><circle cx="2" cy="-5" r="9"/><circle cx="11" cy="2" r="6.5"/></g>`;
/* wipe items */
const envDraw = ([x, y, k]) => envG(x, y, 1.32, [-14, 9, 22, -5][k]);
const paperDraw = ([x, y, k]) => paperG(x, y, [-18, 12, 30, -6][k], 1.25);

const PPL = [[252, 175, 150], [144, 177, 138], [308, 248, 142], [92, 252, 134], [256, 323, 146], [148, 325, 142]];   // CROWD6 positions
/* v2 (Guy's note 0:00): a drawn door whose leaf really swings open; the people come out through it (images only, no walking) */
const DOOR_X = 200, DOOR_Y = 250;
const doorG = id => { const x0 = 154, x1 = 246, y0 = 172, y1 = 332;
  return `<g><path d="M126 ${y1 + 22} L274 ${y1 + 22} L262 ${y1} L138 ${y1} Z" fill="#cfc4b2" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M${x0 + 2} ${y1} L${x1 - 2} ${y1} L${x1 + 40} ${y1 + 22} L${x0 - 40} ${y1 + 22} Z" fill="${GOLD}" opacity=".38"/>
  <rect x="136" y="156" width="128" height="${y1 - 156}" rx="3" fill="#6f8579" stroke="${INK}" stroke-width="2.6"/>
  <path d="M128 160 L200 126 L272 160 Z" fill="#6f8579" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M150 155 L200 134 L250 155" fill="none" stroke="#a9b9ad" stroke-width="2"/>
  <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#fff1c4" stroke="${INK}" stroke-width="2.2"/>
  <rect x="${x0 + 10}" y="${y0 + 10}" width="${x1 - x0 - 20}" height="${y1 - y0 - 10}" fill="${GOLD}" opacity=".45"/><rect x="${x0 + 26}" y="${y0 + 26}" width="${x1 - x0 - 52}" height="${y1 - y0 - 26}" fill="#fff8e0" opacity=".8"/>
  <g id="${id}-leaf"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#8a4b2b" stroke="${INK}" stroke-width="2.4"/>
   ${[[x0 + 10, y0 + 12, 32, 60], [x0 + 50, y0 + 12, 32, 60], [x0 + 10, y0 + 84, 32, 66], [x0 + 50, y0 + 84, 32, 66]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#9c5a35" stroke="${INK}" stroke-width="1.6"/>`).join('')}
   <circle cx="${x1 - 10}" cy="${y0 + 82}" r="4.2" fill="${GOLD}" stroke="${INK}" stroke-width="1.4"/><path d="M${x0 + 3} ${y0 + 4} V${y1 - 4}" stroke="#b77a50" stroke-width="2" opacity=".7"/></g></g>`; };
/* v2 (Guy's note 0:02): ONE envelope grows huge, its flap opens, and s02 starts from inside it */
const BE = { k: 17, cx: 200, cy: 470 };
const beTri = () => [[-20, -13], [20, -13], [0, 2]].map(([x, y]) => [r3(BE.cx + x * BE.k), r3(BE.cy + y * BE.k)]);
const bigEnv = (id, { hole = false } = {}) => { const [a, b, c] = beTri();
  const back = hole ? `<path d="M-60 -60 H460 V780 H-60 Z M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${c[0]} ${c[1]} Z" fill="${PAPER}" fill-rule="evenodd"/>`
    : `<rect x="-60" y="-60" width="520" height="840" fill="${PAPER}" id="${id}-bg"/>`;
  const inside = hole ? '' : `<g id="${id}-in"><path d="M-20 -13 L20 -13 L0 2 Z" fill="#f2cf73"/><path d="M-12 -13 L12 -13 L0 -4 Z" fill="#fff4cf" opacity=".85"/></g>`;
  return `<g data-layout-allow-overlap="true">${hole ? back : ''}<g id="${id}"><g id="${id}-bgw" opacity="${hole ? 1 : 0}">${hole ? '' : back}</g><g id="${id}-e"><g transform="translate(${BE.cx} ${BE.cy}) scale(${BE.k})">
    ${hole ? '' : `<rect x="-20" y="-13" width="40" height="26" rx=".4" fill="#e3d8c4" stroke="${INK}" stroke-width=".14"/>`}${inside}
    <path d="M-20 -13 L0 2 L20 -13 V13 H-20 Z" fill="${CARD}" stroke="${INK}" stroke-width=".14" stroke-linejoin="round"/><path d="M-20 13 L-3 0 M20 13 L3 0" stroke="${MUTE}" stroke-width=".09" fill="none"/>
    <g id="${id}-flap"><path d="M-20 -13 L0 3 L20 -13 Z" fill="#f6f1e6" stroke="${INK}" stroke-width=".14" stroke-linejoin="round"/><circle cx="0" cy="1" r="2.3" fill="${RED}" stroke="${INK}" stroke-width=".1"/><circle cx="-.6" cy=".4" r=".6" fill="#fff" opacity=".5"/></g>
  </g></g></g></g>`; };
add('s01', 3.4, 'כל אדם שנכנס לחיים שלנו, מגיע מסיבה.', 'An old door swings open, people come out through it one by one, an envelope lands on each; one envelope grows huge and opens',
  'SHOT A (0–0.6): a drawn vintage front door lands in the centre, its leaf swings open and gold light pours out, rays turning. SHOT B (0.6–1.6): people (two of each) come out through the doorway one after another — small in the door, flying to their place (no walking), floating. SHOT C (1.6–2.4): a red-sealed envelope drops onto every person ("a reason"). SHOT D (2.4–3.4): one envelope flies to the centre and grows until it fills the screen; its flap opens and gold light glows inside (s02 starts from inside it).',
  {}, s => build(s, {
    hdr: HDR('// 01 · a reason', 'PEOPLE', 'IN'), cap: ['כל אדם שנכנס', 'לחיים שלנו,', 'מגיע _מסיבה._'], poses: [[0, ['explain', 'point']], [1.0, ['laugh']], [2.1, ['explain']]],
    props: s => {
      LAND(s, 'door', .02, { h: 90, rot: 0 }); PULSEL(s, 'door', .9, 3.4, 1.025, .32); CAMTO(s, .02, 200, 244, 1.3);
      s.a(`tl.fromTo("#${s.id}-leaf",{scaleX:1,skewY:0,transformOrigin:"0% 50%"},{scaleX:.13,skewY:-12,transformOrigin:"0% 50%",duration:.3,ease:"power2.inOut",immediateRender:false},.28);`);
      IN(s, 'ry', .42, 'fade'); MOVE(s, 'ry', .42, { rotation: 0 }, { rotation: 45, svgOrigin: '200 250', duration: 3, ease: 'none' }); RINGS(s, [[.5, 200, 252, 56, 86, .35]], GOLD); SPARK(s, .5, 252, 168, 'plus', GOLD); SPARK(s, .55, 146, 200, 'plus', GOLD);
      CAMTO(s, .6, 200, 250, 1.0);
      CROWD6.forEach(([k, x, y], i) => { const t = .58 + i * .16; MOVE(s, 'p' + i, t, { x: DOOR_X - x, y: DOOR_Y + 30 - y, scale: .1, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: .34, ease: 'back.out(1.4)', immediateRender: true }); FLOAT(s, 'p' + i, t + .35, 3.4, i, 4); SHIVER(s, 'p' + i, t + .35, 3.4, 1.4, .3 + (i % 3) * .05); });
      const ppl = CROWD6.map(([k, x, y, w, f], i) => s.W('p' + i, cutF(s, ['laugh-4', 'prof-2', 'laugh-6'][k], x, y, w, f, (i * 7) % 11 - 5))).join('');
      FLOOD(s, 'ef', HF(16, 130, 250), 1.7, .7, ([x, y, r]) => envG(x, y, .6, r), { t1: 2.5 });
      PPL.forEach(([x, y], i) => { const t = 1.62 + i * .08; IN(s, 'e' + i, t, 'drop'); SHIVER(s, 'e' + i, t + .2, 3.4, 6, .07 + (i % 3) * .02); });
      PUNCH(s, 1.9, 1.04); CAMTO(s, 1.7, 220, 236, 1.12); RINGS(s, [[2.05, 252, 125, 30, 22, .3]], RED);
      /* the one envelope */
      const E = `${s.id}-be`; OUT(s, 'e0', 2.38, .05); CAMTO(s, 2.35, 230, 230, 1.22);
      { const k0 = .075, M0 = `matrix(${k0} 0 0 ${k0} ${r3(262 - k0 * 200)} ${r3(118 - k0 * 470)})`;   // starts as the envelope on the boy (top right), grows to fill the screen
        s.a(`tl.fromTo("#${E}-e",{attr:{transform:"${M0}"}},{attr:{transform:"matrix(1 0 0 1 0 0)"},duration:.48,ease:"power2.in",immediateRender:true},2.4);`); }
      s.a(`tl.set("#${E}-e",{opacity:0},0);tl.set("#${E}-e",{opacity:1},2.4);`);
      s.a(`tl.fromTo("#${E}-bgw",{opacity:0},{opacity:1,duration:.16,ease:"none",immediateRender:false},2.7);`);
      PUNCH(s, 2.88, 1.03); s.a(`tl.fromTo("#${E}-e",{attr:{transform:"matrix(1 0 0 1 0 0)"}},{attr:{transform:"matrix(1.02 0 0 1.02 -4 -9.4)"},duration:.07,yoyo:true,repeat:3,immediateRender:false},2.88);`);
      s.a(`tl.fromTo("#${E}-flap",{scaleY:1,transformOrigin:"50% 0%"},{scaleY:-1,transformOrigin:"50% 0%",duration:.26,ease:"power2.inOut",immediateRender:false},2.9);`);
      s.a(`tl.fromTo("#${E}-in",{opacity:.4},{opacity:1,duration:.2,ease:"none",immediateRender:false},3.02);`);
      s.top += bigEnv(E);
      return `<g id="${s.id}-ry" opacity="0">${rays(200, 250, 90, 230, 22, GOLD, 5)}</g>${s.W('door', doorG(s.id))}${ppl}${s.fl || ''}${PPL.map(([x, y], i) => s.W('e' + i, envG(x, y - 58, 1.1, (i * 13) % 24 - 12))).join('')}`;
    }
  }));

add('s02', 2.6, 'האקסית שלימדה אתכם לאהוב,', 'The ex as a glamorous teacher with a pointer; a chalk heart draws itself on a blackboard',
  'SHOT A (0–1.0): the camera flies into the open envelope from s01 and the scene opens out of it; a glamorous 1950s woman with a teacher\'s pointer lands on the left, winking. SHOT B (1.0–1.8): a blackboard drops on the right and a chalk heart draws itself on it, she taps it. SHOT C (1.8–2.6): the heart on the board beats, hearts float up and scatter all over the screen.',
  {}, s => build(s, {
    hdr: HDR('// 02 · the ex', 'LESSON', '1'), cap: ['האקסית שלימדה', 'אתכם _לאהוב,_'], poses: [[0, ['point']], [1.1, ['laugh', 'calm']]],
    props: s => {
      { const E = `${s.id}-be`; s.top += bigEnv(E, { hole: true });   // v2: the scene starts from inside s01's open envelope
        s.a(`tl.fromTo("#${E}",{scale:1,svgOrigin:"200 360"},{scale:7,svgOrigin:"200 380",duration:.4,ease:"power2.in",immediateRender:true},.02);tl.set("#${E}",{opacity:0},.42);`);
        s.a(`tl.fromTo("#${E}-flap",{scaleY:-1,transformOrigin:"50% 0%"},{scaleY:-1,transformOrigin:"50% 0%",duration:.01,immediateRender:true},0);`); }
      FLOOD(s, 'hf', HF(28, 130, 250), 1.6, .9, ([x, y, r, c]) => heartG(x, y, 6 + (x % 5), [RED, '#f05a4f', PEACH, GOLD][x % 4]));
      LAND(s, 'ex', .02, { h: 100, rot: -5 }); FLOAT(s, 'ex', .4, 2.6, 0, 3); PULSEL(s, 'ex', .5, 2.6, 1.025, .35); CAMTO(s, .2, 140, 250, 1.15);
      IN(s, 'bd', .75, 'drop'); SHIVER(s, 'bd', 1.0, 2.6, 1, .12); DRAW(s, 'ch', 1.0, .45); CAMTO(s, 1.0, 260, 230, 1.25);
      IN(s, 'n', .85, 'slam'); PULSEL(s, 'n', 1.0, 2.6, 1.07, .2);
      [1.55, 1.85, 2.15, 2.45].forEach(t => PULSE(s, 'bd', t, 1.05)); RISE(s, 1.5, 2.6, 260, 200, { kind: 'heart', every: .08, w: 110, h: 110 }); SPARK(s, 1.5, 320, 170, 'plus', GOLD);
      CAMTO(s, 1.8, 210, 246, 1.02);
      return `${s.W('bd', `<g>${boardG(262, 218, 150, 112)}${chalkHeart(`${s.id}-ch`, 262, 222, 30)}</g>`)}${s.W('n', T(318, 206, 70, '1', { c: RED, w: 900, f: HEB }))}${s.W('ex', cutS(s, 'ex-teacher', 128, 262, 270))}${s.fl || ''}`;
    }
  }));

const ME = [[70, 170, -14], [196, 150, 10], [84, 236, 8], [204, 212, -8], [60, 300, 12]];
add('s03', 3.6, 'הבחור המעצבן מהתואר, שרק לראות אותו מביא לכם עצבים,', 'The know-it-all from university raises his hand again and again; a VU meter and a huge % climb into the red; an angry man boils over',
  'SHOT A (0–1.3): a smug student with thick glasses and a pile of books lands, his raised hand bumps up again and again, "אני!" bubbles pop all around him. SHOT B (1.3–2.3): a vintage VU meter slams in on the right and throbs, red rings and bangs around it (v2: the 100% is gone). SHOT C (2.3–3.6): a furious vintage man shouting lands, steam puffs rise from his head, red tension zigzags flood the screen, he trembles harder and harder.',
  {}, s => build(s, {
    hdr: HDR('// 03 · that guy', 'NERVES', '!'), cap: ['הבחור המעצבן מהתואר,', 'שרק לראות אותו', 'מביא לכם *עצבים,*'], poses: [[0, ['crossed']], [1.3, ['worry']], [2.4, ['shock']]],
    props: s => {
      FLOOD(s, 'zf', HF(30, 130, 250), 2.35, 1.0, ([x, y, r]) => zzG(x, y, 22, r * 3));
      LAND(s, 'nerd', .04, { h: 110, rot: -6 }); FLOAT(s, 'nerd', .3, 3.6, 1, 3); CAMTO(s, .2, 140, 250, 1.15);
      [.45, .75, 1.0, 1.2].forEach(t => BUMP(s, 'nerd', t, 1.05));
      ME.forEach(([x, y], i) => { const t = .4 + i * .17; IN(s, 'b' + i, t, 'pophard'); BUZZ(s, 'b' + i, [[t + .2, 4], [t + .6, 3], [t + 1.1, 5]]); });
      IN(s, 'mt', 1.3, 'slam'); PUNCH(s, 1.35, 1.05); SHIVER(s, 'mt', 1.4, 2.3, 2, .06); CAMTO(s, 1.3, 290, 236, 1.2);
      PULSEL(s, 'mt', 1.45, 2.25, 1.06, .12); RINGS(s, [[1.5, 292, 236, 60, 44, .35]], RED); SPARK(s, 1.6, 352, 190, 'bang'); SPARK(s, 1.9, 236, 180, 'bang'); SPARK(s, 2.2, 352, 200, 'bang');   // v2: no 100% (Guy)
      OUT(s, 'mt', 2.25); LAND(s, 'ang', 2.3, { h: 120, rot: 6 }); SHIVER(s, 'ang', 2.5, 3.6, 2.2, .05); MOVE(s, 'ang', 2.9, { scale: 1 }, { scale: 1.08, duration: .7, ease: 'power1.in' }); PUNCH(s, 2.55, 1.06); CAMTO(s, 2.3, 250, 250, 1.05);
      [[262, 150], [300, 138], [236, 136], [320, 160]].forEach(([x, y], i) => { const t = 2.6 + i * .14; IN(s, 'sm' + i, t, 'pop'); MOVE(s, 'sm' + i, t, { y: 0, opacity: 1 }, { y: -50, opacity: 0, duration: .6, ease: 'power1.out', repeat: 1 }); });
      CAMTO(s, 3.0, 262, 236, 1.22);
      return `${s.W('nerd', cutS(s, 'nerd-student', 136, 262, 270))}${ME.map(([x, y, r], i) => s.W('b' + i, `<g transform="rotate(${r} ${x} ${y})">${bubble(s.id, x, y, 58, 28, 'אני!', { s: 14, bg: i % 2 ? CARD : '#fde7c4' })}</g>`)).join('')}
        ${s.W('mt', cutS(s, 'meter', 292, 230, 200, { rot: 4 }))}${s.W('ang', cutS(s, 'man-angry', 282, 266, 270))}${[0, 1, 2, 3].map(i => s.W('sm' + i, steamG([262, 300, 236, 320][i], [150, 138, 136, 160][i], 1.3))).join('')}${s.fl || ''}`;
    }
  }));

add('s04', 2.4, 'ואפילו הבוס שפיטר אתכם.', 'A stern boss points at the exit; a big red stamp slams; papers rain down and cover the screen',
  'SHOT A (0–1.0): a stern bald boss behind a desk lands, pointing at the door, trembling with rage. SHOT B (1.0–1.6): a huge textured red stamp "פוטרתם!" slams across him, camera kick. SHOT C (1.6–2.4): sheets of paper fall from above, tumbling, then multiply until they cover the whole screen (the transition).',
  {}, s => build(s, {
    hdr: HDR('// 04 · the boss', 'JOB', 'FIRED'), cap: ['ואפילו הבוס', 'ש*פיטר* אתכם.'], poses: [[0, ['point']], [1.0, ['shock', 'laugh']]],
    props: s => {
      FLOOD(s, 'xf', HF(16, 130, 250), .25, .7, ([x, y]) => cross(x, y, 7 + (x % 4)));
      LAND(s, 'boss', .04, { h: 110, rot: 0 }); SHIVER(s, 'boss', .3, 2.4, 1.4, .07); PULSEL(s, 'boss', .4, 2.4, 1.025, .3); CAMTO(s, .2, 200, 236, 1.2);
      IN(s, 'stamp', .95, 'slam'); PUNCH(s, 1.05, 1.08); SPARK(s, 1.06, 320, 200, 'bang'); SPARK(s, 1.1, 90, 290, 'burst'); CAMTO(s, 1.0, 200, 250, 1.28);
      FLOOD(s, 'pf', HF(24, 120, 270), 1.15, .7, ([x, y, r]) => paperG(x, y, r * 2, .85), { kind: 'drop' }); CAMTO(s, 1.5, 200, 250, 1.0);
      WIPE_IN(s, 'pw', WG, 1.75, .5, DCEN); s.top += wipeSvg(s, 'pw', WG, paperDraw);
      return `${s.W('boss', cutS(s, 'boss-fire', 200, 258, 260))}${s.fl || ''}${s.W('stamp', bigStamp(200, 250, 'פוטרתם!', { s: 44, rot: -10, id: s.id }))}`;
    }
  }));

const DOM = (() => { const o = []; let x = 66; for (let i = 0; i < 9; i++) { const h = r3(16 * Math.pow(1.3, i)); o.push([r3(x), h]); x += h * .62 + 4; } return o; })();
add('s05', 3.4, 'וגם אנחנו משפיעים על אחרים, בלי להבין עד כמה.', 'Drawn-only: the mini monk flicks a tiny domino; each one knocks over a bigger one; a huge counter rolls 1→9',
  'SHOT A (0–1.1): drawn-only beat — the mini monk stands on the left beside a row of dominoes, from tiny to huge; he flicks the first one. SHOT B (1.1–2.3): the dominoes fall one into the next, each bigger, with dust and sparks; a huge red counter rolls with them; the camera rides along. SHOT C (2.3–3.4): the last giant red domino slams down, the camera kicks, a burst of confetti and ripples.',
  {}, s => build(s, {
    hdr: HDR('// 05 · ripple', 'DOMINO', '9'), cap: ['וגם אנחנו _משפיעים_', 'על אחרים,', 'בלי להבין עד כמה.'], poses: [[0, ['explain']], [1.2, ['excited']], [2.4, ['chin', 'laugh']]],
    props: s => {
      WIPE_OUT(s, 'pw', WG, .02, .5); s.top += wipeSvg(s, 'pw', WG, paperDraw);
      IN(s, 'mm', .1, 'up'); FLOAT(s, 'mm', .3, 3.4, 2, 3); IN(s, 'flr', .05, 'grow');
      DOM.forEach(([x, h], i) => IN(s, 'dm' + i, .12 + i * .05, 'pophard'));
      const T0 = .75; let t = T0;
      DOM.forEach(([x, h], i) => { const w = h * .46; SPINR(s, 'd' + i, t, 0, 74, r3(x + w / 2), 330, .2 + i * .02, 'power2.in'); SPARK(s, t + .18, x + h * .7, 326 - h * .3, 'burst', INK); if (i > 3) PUNCH(s, t + .2, 1.02 + i * .004); t += .14 + i * .03; });
      IN(s, 'cnt', .7, 'slam'); ROLL(s, 'n', T0 + .1, 1, 9, t - T0, 'none'); PULSEL(s, 'cnt', t, 3.4, 1.06, .18);
      CAMTO(s, .2, 100, 300, 1.55); CAMTO(s, 1.1, 150, 280, 1.25); CAMTO(s, 1.7, 230, 260, 1.05); CAMTO(s, 2.3, 280, 250, 1.12);
      BURST(s, t + .2, 330, 250, { n: 18, kind: 'confetti' }); RINGS(s, [[t + .2, 330, 320, 60, 18, .5]], RED); FALL(s, t + .1, 300, 200, { n: 8, kind: 'dot', cols: [RED, GOLD] });
      return `<path id="${s.id}-flr" d="M40 331 H372" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>${s.W('mm', miniMonk(4, 236, 70, 'stand'))}
        ${DOM.map(([x, h], i) => `<g id="${s.id}-dm${i}"><g id="${s.id}-d${i}">${domG(x, 331, h, i)}</g></g>`).join('')}${s.W('cnt', rollNum(s, 'n', 178, 250, 1, { size: 120, cols: 1, c: RED, w: 900 }))}`;
    }
  }));

const Q6 = HF(24, 135, 240);
const HA = HF(22, 140, 230);
add('s06', 3.0, 'איך אני יודע את זה? אני לא יודע!', 'A big crowd of puzzled people who don\'t know (professors, a shrugging housewife, a head-scratching mailman, a wondering woman); question marks flood; "לא יודע!" slams; laughing people and a flood of "חחח" (the monk laughs)',
  'SHOT A (0–1.1): a crowd of twelve puzzled people (six different, two of each) pops in one by one, shrugging, scratching heads, fist on chin; question marks in every colour build up all over the screen. SHOT B (1.1–1.8): a big stamp "לא יודע!" slams in, camera kick. SHOT C (1.8–3.0): the puzzled crowd flies off, a crowd of laughing people (two of each) pops in bobbing, "חחח" floods the screen while the monk laughs.',
  {}, s => build(s, {
    hdr: HDR('// 06 · how?', 'PROOF', '?'), cap: ['איך אני יודע את זה?', '*אני לא יודע!*'], poses: [[0, ['chin']], [1.1, ['crossed']], ['end', ['laugh']]],
    props: s => {
      CROWD.forEach(([k, x, y, w, f], i) => { const t = .03 + gradual(i, CROWD.length, 0, .95); IN(s, 'u' + i, t, DIRS[i % 6]); FLOAT(s, 'u' + i, t + .2, 1.9, i, 4); SHIVER(s, 'u' + i, t + .2, 1.9, 1.6, .28 + (i % 3) * .05); OUT(s, 'u' + i, 1.72 + (i % 4) * .02); });
      CAMTO(s, .02, 200, 250, 1.12);
      Q6.forEach(([x, y, r, c, z], i) => { IN(s, 'q' + i, gradual(i, Q6.length, .35, 1.1), 'pophard'); FLOAT(s, 'q' + i, .6, 3.0, i, 4); });
      CAMTO(s, .8, 160, 246, 1.22);
      IN(s, 'stamp', 1.15, 'slam'); PUNCH(s, 1.25, 1.08); MONKPOP(s, 1.3); CAMTO(s, 1.15, 200, 246, 1.05);
      OUT(s, 'stamp', 1.8);
      const cr = crowd(s, ['laugh-2', 'laugh-3', 'laugh-5'], 1.82, .05);
      HA.forEach(([x, y, r, c, z], i) => { IN(s, 'h' + i, gradual(i, HA.length, 1.95, .9), 'pophard'); SHIVER(s, 'h' + i, 2.1, 3.0, 6, .07); });
      CAMTO(s, 1.85, 200, 250, 1.0); CAMTO(s, 2.4, 200, 240, 1.12);
      return `${CROWD.map(([k, x, y, w, f], i) => s.W('u' + i, cutF(s, ['prof-1', 'shrug-1', 'prof-3', 'shrug-2', 'prof-2', 'shrug-3'][k], x, y, w, f, (i * 7) % 11 - 5))).join('')}
        ${Q6.map(([x, y, r, c, z], i) => s.W('q' + i, `<g transform="rotate(${r} ${x} ${y})">${T(x, y, z + 14, '?', { c, w: 900, f: HEB })}</g>`)).join('')}${s.W('stamp', bigStamp(200, 250, 'לא יודע!', { s: 44, rot: 8, id: s.id }))}
        ${cr}${HA.map(([x, y, r, c, z], i) => s.W('h' + i, `<g transform="rotate(${r} ${x} ${y})">${T(x, y, z + 6, 'חחח', { c, w: 900, f: HEB })}</g>`)).join('')}`;
    }
  }));

const XS7 = [[96, 170], [300, 160], [70, 300], [330, 300], [250, 340], [150, 200]];
add('s07', 2.2, 'אי אפשר באמת להוכיח את זה.', 'A brass microscope and an orbiting magnifier find nothing; red crosses pop up; a huge PROOF % rolls down to 0',
  'SHOT A (0–0.9): an antique microscope lands, a drawn magnifier circles over it searching. SHOT B (0.9–1.5): red crosses pop up all around one after another, a huge red % rolls down from 87 to 0 over the microscope. SHOT C (1.5–2.2): the camera pulls back, the 0% pulses, the crosses tremble.',
  {}, s => build(s, {
    hdr: HDR('// 07 · proof', 'PROOF', '0%'), cap: ['אי אפשר באמת', '*להוכיח* את זה.'], poses: [[0, ['explain']], [1.0, ['crossed']]],
    props: s => {
      FLOOD(s, 'qf', HF(22, 130, 250), .2, 1.2, ([x, y, r, c, z]) => `<g transform="rotate(${r} ${x} ${y})">${T(x, y, z + 8, '?', { c, w: 900, f: HEB })}</g>`, { shiver: 0 });
      FLOOD(s, 'mf', HF(8, 140, 220).map(([x, y]) => [x, y]), .5, .9, ([x, y]) => magG(x, y, .38), { shiver: 0 });
      LAND(s, 'mic', .04, { h: 110, rot: 0 }); PULSEL(s, 'mic', .3, 2.2, 1.03, .3); CAMTO(s, .2, 170, 250, 1.15);
      IN(s, 'mag', .3, 'pop'); ORBIT(s, 'mag', .45, 2.2, 14, .32);
      XS7.forEach(([x, y], i) => { const t = .85 + i * .1; IN(s, 'x' + i, t, 'pophard'); SHIVER(s, 'x' + i, t + .15, 2.2, 8, .06); });
      IN(s, 'pc', .8, 'slam'); ROLL(s, 'n', .85, 87, 0, .6, 'power2.out'); PULSEL(s, 'pc', 1.5, 2.2, 1.08, .16); CAMTO(s, .9, 250, 250, 1.25);
      CAMTO(s, 1.5, 210, 250, 1.0);
      return `${s.fl || ''}${s.W('mic', cutS(s, 'microscope', 160, 262, 240))}${s.W('mag', magG(262, 196, 1.3))}${XS7.map(([x, y], i) => s.W('x' + i, cross(x, y, 14))).join('')}
        ${s.W('pc', rollNum(s, 'n', 352, 300, 87, { size: 92, cols: 2, c: RED, w: 900, suffix: '%' }))}`;
    }
  }));

const LV = [[200, 300, -150, .8], [200, 282, -30, .9], [200, 262, -150, 1.0], [200, 246, -30, 1.1]];
add('s08', 3.8, 'אבל זו דרך הסתכלות שעוזרת לנו ללמוד, לגדול, ולהרגיש.', 'A huge eye looks out (a way of looking); then a scroll (learn), a sprout growing (grow) and a beating heart (feel)',
  'SHOT A (0–1.2): a giant vintage eye lands and looks around, dashed gold sight lines draw out of it. SHOT B (1.2–2.4): the eye floats up small; an old scroll unrolls in on the left (learn), then a drawn sprout grows up in the centre, leaves popping (grow). SHOT C (2.4–3.8): a real heart lands on the right and beats (feel), leaves and hearts float up around the three.',
  {}, s => build(s, {
    hdr: HDR('// 08 · a way of looking', 'LEARN', 'GROW · FEEL'), cap: ['אבל זו _דרך הסתכלות_', 'שעוזרת לנו ללמוד,', '_לגדול,_ ולהרגיש.'], poses: [[0, ['explain']], [1.3, ['point']], [2.4, ['calm', 'beads']]], glow: GREEN,
    props: s => {
      FLOOD(s, 'lf', HF(20, 130, 250), 2.0, 1.6, ([x, y, r]) => leafG(x, y, r * 4, .55), { shiver: 0 });
      LAND(s, 'eye', .04, { h: 100, rot: 0 }); PULSEL(s, 'eye', .3, 1.2, 1.04, .22); CAMTO(s, .2, 200, 236, 1.2);
      [0, 1, 2, 3].forEach(i => DRAW(s, 'sl' + i, .35 + i * .1, .35));
      MOVE(s, 'eye', 1.15, { x: 0, y: 0, scale: 1 }, { x: 0, y: -78, scale: .45, svgOrigin: '200 240', duration: .28, ease: 'power2.inOut' }); TOO(s, 'sls', 1.15, { opacity: 0, duration: .15 }); FLOAT(s, 'eye', 1.5, 3.8, 1, 3);
      IN(s, 'scr', 1.3, 'left'); FLOAT(s, 'scr', 1.5, 3.8, 2, 3); CAMTO(s, 1.2, 130, 270, 1.15);
      DRAW(s, 'stem', 1.95, .45); LV.forEach((l, i) => IN(s, 'lv' + i, 2.05 + i * .1, 'pophard')); MOVE(s, 'spr', 2.5, { scaleY: 1 }, { scaleY: 1.08, svgOrigin: '200 336', duration: .4, ease: 'sine.inOut', yoyo: true, repeat: 3 }); CAMTO(s, 1.9, 200, 280, 1.2);
      LAND(s, 'ht', 2.55, { h: 100, rot: 4 }); [2.9, 3.2, 3.5, 3.75].forEach(t => PULSE(s, 'ht', t, 1.12)); RISE(s, 2.7, 3.8, 300, 230, { kind: 'heart', every: .12, w: 70, h: 100 }); CAMTO(s, 2.5, 230, 260, 1.05);
      CAMTO(s, 3.2, 200, 256, 1.12);
      const SL = [[260, 220, 370, 180], [250, 260, 372, 300], [140, 220, 30, 180], [150, 260, 28, 300]];
      return `<g id="${s.id}-sls">${SL.map(([a, b, c, d], i) => `<path id="${s.id}-sl${i}" d="M${a} ${b} L${c} ${d}" stroke="${GOLD}" stroke-width="3.4" stroke-dasharray="6 6" pathLength="1" stroke-dashoffset="1"/>`).join('')}</g>${s.fl || ''}
        ${s.W('eye', cutS(s, 'eye', 200, 240, 330))}${s.W('scr', cutS(s, 'scroll', 92, 282, 190, { rot: -8 }))}
        <g id="${s.id}-spr"><path id="${s.id}-stem" d="${sproutPath}" stroke="${GREEN}" stroke-width="6" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>${LV.map(([x, y, r, k], i) => s.W('lv' + i, leafG(x, y, r, k))).join('')}</g>
        ${s.W('ht', cutS(s, 'heart', 308, 276, 180))}`;
    }
  }));

const PP9 = HF(22, 125, 270);
add('s09', 2.4, 'וחוץ מזה, לא להכל צריך הוכחות.', 'A filing cabinet stuffed with proofs shakes harder and harder, then bursts — papers fly everywhere',
  'SHOT A (0–1.0): an old metal filing cabinet lands, its drawers rattle, shaking harder and harder (build-up). SHOT B (1.0–1.6): it bursts — sheets of paper shoot out in every direction, camera kick. SHOT C (1.6–2.4): the papers float and tumble all over the screen while the monk laughs it off.',
  {}, s => build(s, {
    hdr: HDR('// 09 · proofs', 'PROOFS', '∞'), cap: ['וחוץ מזה,', 'לא להכל צריך *הוכחות.*'], poses: [[0, ['relax']], [1.0, ['laugh', 'thumb']]],
    props: s => {
      const CF = HF(14, 150, 200).filter(([x]) => x < 130 || x > 270); FLOOD(s, 'cf', CF, .3, .65, ([x, y, r]) => paperG(x, y, r * 2, .55), { t1: 1.05 }); FLOOD(s, 'zf', HF(10, 140, 220), .5, .5, ([x, y, r]) => zzG(x, y, 18, r * 3), { t1: 1.05 });
      CF.forEach((c, i) => OUT(s, 'cf' + i, 1.0)); for (let i = 0; i < 10; i++) OUT(s, 'zf' + i, 1.0);
      LAND(s, 'cab', .04, { h: 100, rot: 0 }); SHIVER(s, 'cab', .35, .7, 1.5, .08); SHIVER(s, 'cab', .7, 1.05, 4, .05); CAMTO(s, .2, 200, 250, 1.2); CAMTO(s, .7, 200, 250, 1.32);
      PP9.forEach(([x, y, r], i) => { const t = 1.02 + (i % 7) * .02; IN(s, 'pp' + i, t, 'pop'); MOVE(s, 'pp' + i, t, { x: 200 - x, y: 250 - y, rotation: 0 }, { x: 0, y: 0, rotation: r * 4, duration: .4, ease: 'power3.out' }); FLOAT(s, 'pp' + i, t + .4, 2.4, i, 5); });
      PUNCH(s, 1.05, 1.08); SPARK(s, 1.06, 300, 170, 'bang'); BURST(s, 1.05, 200, 230, { n: 14, kind: 'dot', cols: [INK, RED] }); CAMTO(s, 1.0, 200, 250, 1.0);
      CAMTO(s, 1.7, 200, 240, 1.1);
      return `${s.fl || ''}${s.W('cab', cutS(s, 'filing-cabinet', 200, 258, 250))}${PP9.map(([x, y, r], i) => s.W('pp' + i, paperG(x, y, 0, .9))).join('')}`;
    }
  }));

add('s10', 2.0, 'לפעמים פשוט יודעים.', 'A serene woman with closed eyes and a hand on her heart; gold light gathers into her; rays turn behind',
  'SHOT A (0–0.9): the papers clear; a serene vintage woman with closed eyes and a knowing smile lands in the centre, gold rays turn slowly behind her. SHOT B (0.9–1.4): gold light flies in from all around and gathers into her heart, a soft pulse. SHOT C (1.4–2.0): light motes float up, calm green.',
  {}, s => build(s, {
    hdr: HDR('// 10 · knowing', 'KNOW', '✓'), cap: ['לפעמים', 'פשוט _יודעים._'], poses: [[0, ['calm']], [1.0, ['beads']]], glow: GREEN,
    props: s => {
      IN(s, 'ry', .05, 'fade'); MOVE(s, 'ry', .05, { rotation: 0 }, { rotation: 30, svgOrigin: '200 250', duration: 2.0, ease: 'none' });
      FLOOD(s, 'gf', HF(22, 130, 250), .15, 1.3, ([x, y, r]) => heartG(x, y, 5 + (x % 4), [GOLD, PEACH, GREEN, '#f05a4f'][Math.round(x) % 4]), { shiver: 0 });
      LAND(s, 'wm', .04, { h: 90, rot: 0 }); FLOAT(s, 'wm', .3, 2.0, 1, 3); PULSEL(s, 'wm', .3, 2.0, 1.02, .5); CAMTO(s, .2, 200, 240, 1.15);
      ABSORB(s, .9, 200, 262, { n: 16, kind: 'light', R: 160, target: 'wm' }); CAMTO(s, .9, 200, 250, 1.3);
      RISE(s, .3, 2.0, 200, 230, { kind: 'light', every: .07, w: 170, h: 150 }); CAMTO(s, 1.4, 200, 246, 1.05);
      return `<g id="${s.id}-ry" opacity="0">${rays(200, 250, 100, 240, 24, GOLD, 4)}</g>${s.fl || ''}${s.W('wm', cutS(s, 'woman-serene', 200, 258, 250))}`;
    }
  }));

const ZT = [[120, 196, -30], [300, 192, 30], [130, 270, -60], [306, 274, 60]];
add('s11', 5.0, 'נסו עכשיו: תחשבו על מישהו אחד שעצבן אתכם. מה הוא בא ללמד אתכם?', 'The monk presses a "עכשיו" key; the annoying student appears in a thought cloud; he turns into a gift box that bursts open with a gold light bulb',
  'SHOT A (0–1.0): the monk\'s arm reaches in and presses a big red key "עכשיו" with a ripple. SHOT B (1.0–2.6): a thought cloud puffs up and the annoying student from earlier appears inside it, red zigzags flash around him. SHOT C (2.6–3.7): he turns into a vintage wrapped gift box that shakes harder and harder. SHOT D (3.7–5.0): the lid pops — a gold light bulb rises out with rays, confetti bursts, the monk celebrates.',
  {}, s => build(s, {
    hdr: HDR('// 11 · try it', 'LESSON', '?'), cap: ['_נסו עכשיו:_', 'תחשבו על מישהו אחד', 'שעצבן אתכם.', 'מה הוא בא _ללמד_ אתכם?'], poses: [[0, ['point']], [1.1, ['chin']], [2.7, ['peek']], [3.7, ['celebrate']]],
    props: s => {
      IN(s, 'key', .05, 'pop'); IN(s, 'arm', .12, 'up'); PRESS(s, 'key', .45, { x: 200, y: 262, swap: 'keyp' }); CAMTO(s, .1, 200, 270, 1.3);
      OUT(s, 'key', .95); OUT(s, 'keyp', .95); OUT(s, 'arm', .95);
      IN(s, 'cl', 1.0, 'big'); PULSEL(s, 'cl', 1.3, 2.6, 1.03, .3); IN(s, 'nerd', 1.3, 'pophard'); FLOAT(s, 'nerd', 1.5, 2.6, 0, 3); CAMTO(s, 1.0, 220, 240, 1.05); CAMTO(s, 1.8, 224, 236, 1.3);
      ZT.forEach(([x, y], i) => { const t = 1.9 + i * .1; IN(s, 'z' + i, t, 'pophard'); JITTER(s, 'z' + i, t + .1, 2.65, 2.6); });
      OUT(s, 'nerd', 2.6); ZT.forEach((z, i) => OUT(s, 'z' + i, 2.6)); LAND(s, 'gift', 2.65, { h: 90, rot: -4 }); SHIVER(s, 'gift', 2.9, 3.3, 2, .08); SHIVER(s, 'gift', 3.3, 3.7, 5, .045); CAMTO(s, 2.6, 220, 250, 1.1); CAMTO(s, 3.2, 222, 250, 1.28);
      IN(s, 'bulb', 3.7, 'pophard'); MOVE(s, 'bulb', 3.7, { y: 60 }, { y: 0, duration: .35, ease: 'back.out(2)' }); PULSEL(s, 'bulb', 4.1, 5.0, 1.06, .2); TOO(s, 'gift', 3.7, { y: 26, duration: .2 });
      BURST(s, 3.75, 222, 200, { n: 22, kind: 'confetti' }); BURST(s, 3.9, 222, 200, { n: 12, kind: 'star' }); PUNCH(s, 3.72, 1.07); MONKPOP(s, 3.8); CAMTO(s, 3.7, 220, 220, 1.05); CAMTO(s, 4.4, 210, 240, 1.15);
      RISE(s, 4.0, 5.0, 222, 200, { kind: 'light', every: .06, w: 150, h: 130 });
      return `${s.W('key', keycap(200, 262, 'עכשיו', { w: 130, h: 58 }))}<g id="${s.id}-keyp" opacity="0">${keycap(200, 262, 'עכשיו', { pressed: 1, w: 130, h: 58 })}</g>${s.W('arm', reach(210, 290, 300, -18))}
        ${s.W('cl', cloudG(224, 232, 1.35))}${s.W('nerd', cutS(s, 'nerd-student', 224, 236, 190))}${ZT.map(([x, y, r], i) => s.W('z' + i, zzG(x, y, 36, r))).join('')}
        ${s.W('gift', cutS(s, 'gift-box', 222, 262, 220))}${s.W('bulb', bulbG(222, 190, 1.35))}`;
    }
  }));

/* ---------- write files ---------- */
const FONTS = `@font-face{font-family:'Instrument Sans';src:url('assets/fonts/InstrumentSans.woff2') format('woff2');font-weight:400 700;font-display:block}
@font-face{font-family:'Instrument Serif';src:url('assets/fonts/InstrumentSerif-Italic.woff2') format('woff2');font-style:italic;font-weight:400;font-display:block}
@font-face{font-family:'JetBrains Mono';src:url('assets/fonts/JetBrainsMono.woff2') format('woff2');font-weight:400 800;font-display:block}
${[700, 800, 900].map(w => `@font-face{font-family:'Rubik';src:url('assets/fonts/rubik-hebrew-${w}-normal.woff2') format('woff2');font-weight:${w};font-display:block;unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}
@font-face{font-family:'Rubik';src:url('assets/fonts/rubik-latin-${w}-normal.woff2') format('woff2');font-weight:${w};font-display:block;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`).join('\n')}`;
let t = 0; const hosts = [], sb = [];
if (!S.length) throw new Error('No scenes yet. Write this film\'s scenes in build/gen.mjs (see videos/body-receiver/build/gen.mjs for the approved style).');
if (VO_TR) {
  let k = 0, nxt = 0; const st = S.map(sc => { const first = norm(sc.vo.split(' ')[0]); k = Math.max(k, nxt); nxt = k + sc.vo.split(' ').length - 1; while (k < VO_TR.length && norm(VO_TR[k].w) !== first) k++; if (k >= VO_TR.length) throw new Error('vo align failed at ' + sc.id); return k++; });
  S.forEach((sc, i) => { const i0 = st[i], i1 = i + 1 < S.length ? st[i + 1] : VO_TR.length;
    const t0 = i ? VO_TR[i0].a - .1 : 0, t1 = i + 1 < S.length ? VO_TR[i1].a - .1 : VO_TR.at(-1).b + .7;
    sc.newDur = +(t1 - t0).toFixed(3); sc.f = sc.newDur / sc.dur;
    sc.wt = VO_TR.slice(i0, i1).map(w => [(w.a - t0) / sc.f, (w.b - t0) / sc.f]); });
}
for (const sc of S) {
  const s = Scene(sc.id, sc.dur, sc.opts); s.f = sc.f || 1; s.wt = sc.wt; s.t0 = t;
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
<html lang="he">
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
      ${fs.existsSync(path.join(ROOT, MUSIC_FILE)) ? `<audio id="music" src="${MUSIC_FILE}" data-start="0" data-duration="${total}" data-track-index="4" data-volume="${MUSIC_VOL}" data-fade-in="0.4" data-fade-out="1.5"></audio>` : ''}
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
look: monk kit — paper/ink, captions word by word, the monk fixed and talking, halftone wipes between acts
message: "${MESSAGE}"
---
` + sb.map((f, i) => `
## Frame ${i + 1}: ${f.scene} (${f.start.toFixed(1)}-${(f.start + f.dur).toFixed(1)}s)
- status: animated (silent)
- src: compositions/${f.id}.html
- voiceover: "${f.vo}"
- motion: ${f.motion}
`).join(''));
fs.writeFileSync(path.join(ROOT, 'build/frames.json'), JSON.stringify(sb, null, 1));
fs.writeFileSync(path.join(ROOT, 'build/caplines.json'), JSON.stringify([...new Set(CAPLINES)], null, 1));
console.log('scenes', S.length, 'total', total + 's');
