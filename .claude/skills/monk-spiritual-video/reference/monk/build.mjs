// node build.mjs -> monk-sheet.html + poses/<pose>.html (static SVG). Then screenshot with headless Chrome.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const D = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.resolve(D, '../../kit/build');   // ink-lib.js (shared drawing parts) + monk-lib.js
const ctx = { window: {}, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(LIB, 'ink-lib.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(LIB, 'monk-lib.js'), 'utf8'), ctx);
const { MONK, MPOSE, MONKFULL, FPOSE } = ctx.window;

const GLOW = { calm: '#e8a317', beads: '#e8a317', explain: '#e5302a', point: '#e5302a', laugh: '#16a35f', thumb: '#16a35f', shock: '#e5302a', worry: '#e5302a' };
const paper = (w, h, id) => `<svg class="paper" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs>
 <pattern id="${id}g" width="4" height="4" patternUnits="userSpaceOnUse"><rect x="1.5" y="1.5" width="1" height="1" fill="#000" opacity=".09"/></pattern>
 <filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .08  0 0 0 0 .06  0 0 0 .22 -.04"/></filter></defs>
 <rect width="${w}" height="${h}" fill="#efece6"/><rect width="${w}" height="${h}" fill="url(#${id}g)"/><rect width="${w}" height="${h}" filter="url(#${id}n)"/></svg>`;
const ch = (svg, vb) => `<svg class="ch" viewBox="${vb}" preserveAspectRatio="xMidYMax meet">${svg}</svg>`;
const CSS = `:root{--paper:#efece6;--ink:#161412;--red:#e5302a}*{box-sizing:border-box;margin:0}
body{background:#d9d5cc;font-family:'Instrument Sans',sans-serif;color:var(--ink);padding:40px;width:1920px}
h1{font-size:54px;font-weight:600;letter-spacing:-1px;margin-bottom:6px}h1 em{font-family:'Instrument Serif';color:var(--red);font-weight:400}
.sub{font-family:'JetBrains Mono';font-size:17px;color:#6b655d;margin-bottom:28px}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:20px}
.card{position:relative;background:var(--paper);border-radius:18px;overflow:hidden;aspect-ratio:400/440;box-shadow:0 2px 0 #c9c3b8}
.card svg.paper,.card svg.ch{position:absolute;inset:0;width:100%;height:100%}
.lab{position:absolute;left:18px;top:14px;font-family:'JetBrains Mono';font-size:15px;color:#7a7368;z-index:2}.lab b{color:var(--red)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:0 0 22px}.big{aspect-ratio:auto;height:720px}`;
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@500;600;700&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@500;700&display=block" rel="stylesheet">`;

let grid = '', k = 0;
for (const [name, o] of Object.entries(MPOSE)) grid += `<div class="card">${paper(400, 440, 'p' + k)}<span class="lab">// ${String(++k).padStart(2, '0')} · ${name}</span>${ch(MONK({ ...o, glowc: GLOW[name] }, 0, 0, 400), '-20 -10 440 460')}</div>`;
const hero = `${paper(1000, 720, 'ph')}<span class="lab">// hero · calm</span>${ch(MONK({ ...MPOSE.calm, glowc: GLOW.calm }, 0, 0, 400), '-10 10 420 430')}`;
const duo = `${paper(1000, 720, 'pd')}<span class="lab">// seated · meditate</span><svg class="ch" viewBox="-80 70 560 660" preserveAspectRatio="xMidYMid meet">${MONKFULL({ ...FPOSE.meditate, glowc: '#e8a317' }, -60, 0, 520)}</svg>`;
fs.writeFileSync(path.join(D, 'monk-sheet.html'), `<!doctype html><html><head><meta charset="utf-8"><title>The monk</title>${FONTS}<style>${CSS}</style></head><body>
<h1>The monk, <em>approved design.</em></h1>
<div class="sub">// v2 · face after the laughing Budai ref · chubby · bald · saffron robe over the left shoulder, right shoulder bare · paper/ink textures: ink outline · halftone shadow · halftone glow · grain</div>
<div class="row"><div class="card big">${hero}</div><div class="card big">${duo}</div></div>
<div class="grid">${grid}</div></body></html>`);

fs.mkdirSync(path.join(D, 'poses'), { recursive: true });
for (const [name, o] of Object.entries(MPOSE)) fs.writeFileSync(path.join(D, 'poses', name + '.html'), `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}body{width:1080px;height:1188px;overflow:hidden}.paper,.ch{position:absolute;inset:0;width:100%;height:100%}</style></head><body>${paper(400, 440, 'p')}${ch(MONK({ ...o, glowc: GLOW[name] }, 0, 0, 400), '-20 -10 440 460')}</body></html>`);
console.log('ok', Object.keys(MPOSE).join(' '));
