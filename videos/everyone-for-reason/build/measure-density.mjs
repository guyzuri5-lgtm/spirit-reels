// node build/measure-density.mjs [projectDir=.] [out.json] — how busy is the film? (SKILL 3d)
// Samples every composition at 4 fps in headless Chrome and reports objects on screen, image sizes, drawn-only frames
// and how often new elements enter. Target (body-receiver): ~7.7 objects, image median ~13%, ~25% drawn-only, a new element every ~0.12s.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { createRequire } from 'node:module';
const npx = path.join(os.homedir(), '.npm/_npx');
const base = fs.readdirSync(npx).map(d => path.join(npx, d, 'node_modules/')).find(d => fs.existsSync(d + 'puppeteer-core') && fs.existsSync(d + 'hyperframes/dist/vendor/npm'));
if (!base) throw new Error('run any `npx --yes hyperframes@0.9.59 …` command once first (it installs puppeteer-core)');
const require = createRequire(base + 'x.js'), puppeteer = require('puppeteer-core');
const gdir = fs.readdirSync(base + 'hyperframes/dist/vendor/npm').find(d => d.startsWith('gsap@'));
const GSAP = fs.readFileSync(`${base}hyperframes/dist/vendor/npm/${gdir}/dist/gsap.min.js`, 'utf8');
const proj = path.resolve(process.argv[2] || '.'), outF = process.argv[3];
const frames = JSON.parse(fs.readFileSync(path.join(proj, 'build/frames.json'), 'utf8'));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const page = await browser.newPage(); await page.setViewport({ width: 400, height: 711 });
const out = [];
for (const sc of frames) {
  const tpl = fs.readFileSync(path.join(proj, 'compositions', sc.id + '.html'), 'utf8').match(/<template>([\s\S]*)<\/template>/)[1];
  const body = tpl.replace(/<script>([\s\S]*?)<\/script>/g, ''), scripts = [...tpl.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0}</style><script>${GSAP}</script></head><body><div style="position:relative;width:400px;height:711px">${body}</div><script>window.__timelines={};(function(){${scripts}})();</script></body></html>`, { waitUntil: 'domcontentloaded' });
  out.push({ id: sc.id, dur: sc.dur, samples: await page.evaluate((id, dur) => {
    const tl = window.__timelines[id], svg = document.getElementById(id + '-art'), prop = document.querySelector(`#${id}-mo > g`), FA = 400 * 711, LEAF = 'path,circle,rect,ellipse,polygon,polyline,line,text,image,use';
    const vis = el => { let o = 1; for (let e = el; e && e !== svg; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); if (o < .05) return 0; } return o; };
    const clip = r => { const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(400, r.right), y1 = Math.min(711, r.bottom); return x1 > x0 && y1 > y0 ? [x0, y0, x1, y1] : null; };
    const S = [];
    for (let t = .05; t < dur; t += .25) {
      tl.seek(t, false); const imgs = [], draws = [];
      for (const ch of prop.children) {
        if (ch.tagName === 'defs') continue;
        const ims = [...ch.querySelectorAll('image')];
        if (ims.length) { for (const im of ims) { if (!vis(im)) continue; const b = clip(im.getBoundingClientRect()); if (b) imgs.push({ id: ch.id, a: (b[2] - b[0]) * (b[3] - b[1]) / FA, cx: (b[0] + b[2]) / 800 }); } continue; }
        if (!vis(ch)) continue; let u = null;
        for (const lf of (ch.matches(LEAF) ? [ch] : ch.querySelectorAll(LEAF))) { if (lf.closest('defs,clipPath,mask,pattern')) continue; const r = lf.getBoundingClientRect(); if (r.width * r.height < 1 || !vis(lf)) continue; const b = clip(r); if (!b) continue; u = u ? [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])] : b; }
        if (u) draws.push({ id: ch.id, a: (u[2] - u[0]) * (u[3] - u[1]) / FA });
      }
      S.push({ imgs, draws });
    }
    return S; }, sc.id, sc.dur) });
}
await browser.close();
if (outF) fs.writeFileSync(outF, JSON.stringify(out));
const S = out.flatMap(sc => sc.samples), TH = .004, dur = out.reduce((a, s) => a + s.dur, 0), mean = a => a.reduce((x, y) => x + y, 0) / a.length, med = a => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1] || 0; };
const ni = S.map(s => s.imgs.length), nd = S.map(s => s.draws.filter(d => d.a >= TH).length);
let ev = 0; for (const sc of out) { let prev = new Set(); for (const s of sc.samples) { const cur = new Set([...s.imgs.map(x => 'i' + x.id + x.cx.toFixed(1)), ...s.draws.filter(d => d.a >= TH).map(d => 'd' + d.id)]); for (const k of cur) if (!prev.has(k)) ev++; prev = cur; } }
console.log(`objects on screen  ${(mean(ni) + mean(nd)).toFixed(1)}   (images ${mean(ni).toFixed(1)}, drawn ${mean(nd).toFixed(1)})   target ~7.7`);
console.log(`image size median  ${(med(S.flatMap(s => s.imgs.map(x => x.a))) * 100).toFixed(0)}% of the frame   target ~13%`);
console.log(`drawn-only frames  ${(100 * ni.filter(x => !x).length / S.length).toFixed(0)}%   target ~25%`);
console.log(`new element every  ${(dur / ev).toFixed(2)}s   target ~0.12s`);
