// Storyboard sheet: one still per shot (no shot holds > 1.5s).
// 1) node build/gen.mjs   2) npx --yes hyperframes@0.9.59 snapshot --at <one time per shot> --out boards/stills-vN
// 3) node build/board.mjs boards/shots-vN.json boards/stills-vN "<film title>"   → boards/storyboard-vN.html (export to jpg with headless Chrome)
// shots-vN.json = [[sceneId, shotIndex, startSec, endSec], ...] in the same order as the stills.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const F = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/frames.json'), 'utf8'));
const [shotsFile, stillsDir, title = 'Storyboard'] = process.argv.slice(2);
const L = JSON.parse(fs.readFileSync(path.resolve(shotsFile), 'utf8'));
const SD = path.resolve(stillsDir), ver = path.basename(SD).replace(/^stills-?/, '') || 'v1';
const stills = fs.readdirSync(SD).filter(f => /^frame-\d+/.test(f)).sort();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const shotText = (sc, i) => { const parts = sc.motion.split(/SHOT [A-E] \([^)]*\):\s*/).filter(Boolean); return parts.length > 1 ? (parts[i] || parts.at(-1)) : (i ? 'Camera reframes on the main object.' : sc.motion); };
const rel = path.relative(path.join(ROOT, 'boards'), SD);
let cards = '';
L.forEach(([id, i, a, b], k) => { const sc = F.find(x => x.id === id);
  cards += `<div class="frame${i === 0 ? ' first' : ''}"><img src="${rel}/${stills[k]}"><div class="time">${id} · shot ${'ABCDE'[i]} · ${a.toFixed(1)}–${b.toFixed(1)}s · ${(b - a).toFixed(1)}s</div>${i === 0 ? `<div class="vo">${esc(sc.vo)}</div>` : ''}<div class="words">${esc(shotText(sc, i).trim())}</div></div>`; });
const total = F.reduce((t, f) => t + f.dur, 0).toFixed(1);
const html = `<!doctype html><html lang="he"><head><meta charset="utf-8"><title>${esc(title)} · storyboard ${ver}</title>
<style>@font-face{font-family:'Instrument Sans';src:url('../assets/fonts/InstrumentSans.woff2')}@font-face{font-family:'Instrument Serif';font-style:italic;src:url('../assets/fonts/InstrumentSerif-Italic.woff2')}@font-face{font-family:'JetBrains Mono';src:url('../assets/fonts/JetBrainsMono.woff2')}@font-face{font-family:'Rubik';font-weight:700;src:url('../assets/fonts/rubik-hebrew-700-normal.woff2')}
body{font-family:'Instrument Sans','Rubik',sans-serif;background:#e4e0d8;color:#161412;margin:0;padding:36px;width:2128px}h1{font-size:44px;font-weight:600;margin:0 0 4px;letter-spacing:-1px}h1 em{font-family:'Instrument Serif';color:#e5302a;font-weight:400}
.sub{font-family:'JetBrains Mono';color:#7a7368;font-size:14px;margin-bottom:22px;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:14px}
.frame{background:#f6f4ef;border-radius:14px;padding:8px;box-shadow:0 2px 8px rgba(40,30,20,.08)}.frame.first{outline:3px solid #161412}.frame img{width:100%;border-radius:8px;display:block}
.time{font-size:11px;color:#e5302a;font-family:'JetBrains Mono';margin-top:7px;font-weight:700}.vo{direction:rtl;font-family:'Rubik';font-weight:700;font-size:15px;margin:5px 0 2px;line-height:1.25}.words{font-size:12px;color:#3d3a35;margin:4px 0 0;line-height:1.35}</style></head>
<body><h1>${esc(title)} · <em>storyboard ${ver}</em></h1>
<div class="sub">${L.length} shots · ${total}s · no shot holds longer than 1.5s · black outline = first shot of a scene (narration line under it)</div>
<div class="grid">${cards}</div></body></html>`;
fs.mkdirSync(path.join(ROOT, 'boards'), { recursive: true });
fs.writeFileSync(path.join(ROOT, `boards/storyboard-${ver}.html`), html);
console.log('shots', L.length, 'stills', stills.length);
