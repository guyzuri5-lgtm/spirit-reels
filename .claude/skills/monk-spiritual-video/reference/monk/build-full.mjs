// node build-full.mjs -> monk-full.html (+ full/<pose>.html for single renders)
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const D = path.dirname(fileURLToPath(import.meta.url));
const ctx = { window: {}, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.resolve(D, '../../../videos/claude-ai-attack/build/rivka-lib-v2.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(D, 'monk-lib.js'), 'utf8'), ctx);
const { MONKFULL, FPOSE } = ctx.window;
const GLOW = { stand: '#e8a317', wave: '#16a35f', pray: '#e8a317', belly: '#16a35f', sit: '#16a35f', meditate: '#e8a317' };
const paper = id => `<svg class="paper" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"><defs><pattern id="${id}g" width="4" height="4" patternUnits="userSpaceOnUse"><rect x="1.5" y="1.5" width="1" height="1" fill="#000" opacity=".09"/></pattern><filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .08  0 0 0 0 .06  0 0 0 .22 -.04"/></filter></defs><rect width="400" height="400" fill="#efece6"/><rect width="400" height="400" fill="url(#${id}g)"/><rect width="400" height="400" filter="url(#${id}n)"/></svg>`;
const fig = (name) => { const o = FPOSE[name], sit = o.kind === 'sit'; const vb = sit ? '-80 70 560 660' : '-30 70 460 720';
  return `<svg class="ch" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${MONKFULL({ ...o, glowc: GLOW[name] }, sit ? -60 : 0, 0, sit ? 520 : 400)}</svg>`; };
const CSS = `*{box-sizing:border-box;margin:0}body{background:#d9d5cc;font-family:'Instrument Sans',sans-serif;color:#161412;padding:40px;width:1920px}
h1{font-size:54px;font-weight:600;letter-spacing:-1px;margin-bottom:6px}h1 em{font-family:'Instrument Serif';color:#e5302a;font-weight:400}
.sub{font-family:'JetBrains Mono';font-size:17px;color:#6b655d;margin-bottom:28px}.row{display:grid;gap:20px;margin-bottom:20px}
.card{position:relative;background:#efece6;border-radius:18px;overflow:hidden;box-shadow:0 2px 0 #c9c3b8}.card svg{position:absolute;inset:0;width:100%;height:100%}
.lab{position:absolute;left:18px;top:14px;font-family:'JetBrains Mono';font-size:15px;color:#7a7368;z-index:2}`;
const card = (n, i, h) => `<div class="card" style="height:${h}px">${paper('p' + n)}<span class="lab">// ${String(i).padStart(2, '0')} · ${n}</span>${fig(n)}</div>`;
fs.writeFileSync(path.join(D, 'monk-full.html'), `<!doctype html><html><head><meta charset="utf-8"><title>The monk, full body</title><link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@600&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@500&display=block" rel="stylesheet"><style>${CSS}</style></head><body>
<h1>The monk, <em>full body.</em></h1><div class="sub">// standing + seated like the porcelain ref · big round belly under the robe · sash · sandals · same head and textures</div>
<div class="row" style="grid-template-columns:repeat(4,1fr)">${['stand', 'wave', 'pray', 'belly'].map((n, i) => card(n, i + 1, 820)).join('')}</div>
<div class="row" style="grid-template-columns:1fr 1fr">${['sit', 'meditate'].map((n, i) => card(n, i + 5, 760)).join('')}</div></body></html>`);
fs.mkdirSync(path.join(D, 'full'), { recursive: true });
for (const n of Object.keys(FPOSE)) { const sit = FPOSE[n].kind === 'sit'; const [w, h] = sit ? [1200, 1414] : [1080, 1690];
  fs.writeFileSync(path.join(D, 'full', n + '.html'), `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}body{width:${w}px;height:${h}px;overflow:hidden;position:relative}svg{position:absolute;inset:0;width:100%;height:100%}</style></head><body>${paper('p')}${fig(n)}</body></html>`); }
console.log('ok');
