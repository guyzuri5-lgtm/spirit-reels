// Measures every caption line in the real font (Rubik 700 / 900 for marked words) → build/capw.json
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lines = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/caplines.json'), 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${[700, 900].map(w => `@font-face{font-family:'Rubik';src:url('../assets/fonts/rubik-hebrew-${w}-normal.woff2') format('woff2');font-weight:${w};unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}@font-face{font-family:'Rubik';src:url('../assets/fonts/rubik-latin-${w}-normal.woff2') format('woff2');font-weight:${w};unicode-range:U+0000-00FF,U+2000-206F}`).join('')}</style></head><body>
<svg width="800" height="${lines.length * 40 + 40}">${lines.map((l, i) => `<text id="t${i}" x="760" y="${30 + i * 40}" direction="rtl" text-anchor="start" font-family="Rubik" font-weight="700" font-size="27">${l.split(' ').map(w => w.startsWith('*') ? `<tspan font-weight="900">${esc(w.slice(1))} </tspan>` : `<tspan>${esc(w)} </tspan>`).join('')}</text>`).join('')}</svg>
<pre id="out">pending</pre><script>document.fonts.ready.then(()=>{const L=${JSON.stringify(lines)};const o={};L.forEach((l,i)=>{const t=document.getElementById('t'+i);const n=t.getNumberOfChars();let w=t.getComputedTextLength();/* drop the trailing space */ if(n){const e=t.getExtentOfChar(n-1);w-=e.width;} o[l]=Math.round(w*10)/10;});document.getElementById('out').textContent=JSON.stringify(o);});</script></body></html>`;
fs.mkdirSync(path.join(ROOT, 'boards'), { recursive: true }); const f = path.join(ROOT, 'boards/measure-caps.html'); fs.writeFileSync(f, html);
const out = execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=8000', '--dump-dom', 'file://' + f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = out.match(/<pre id="out">([^<]*)<\/pre>/); if (!m || m[1] === 'pending') throw new Error('measure failed');
fs.writeFileSync(path.join(ROOT, 'build/capw.json'), m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
console.log('measured', lines.length, 'lines');
