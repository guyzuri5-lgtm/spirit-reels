#!/usr/bin/env node
// Render a spec (JSON) to a vertical 1080x1920 MP4 with sound, or check/preview it.
//   node engine/render.js <spec.json> <out.mp4>            full render
//   node engine/render.js <spec.json> --check              validate only (prints errors, exit 1 on error)
//   node engine/render.js <spec.json> --preview <out.png>  validate + contact sheet of key frames
// Needs: playwright (chromium) and ffmpeg on PATH.
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'))); }

const [specPath, a2, a3] = process.argv.slice(2);
if (!specPath) { console.error('usage: render.js spec.json out.mp4 | --check | --preview out.png'); process.exit(2); }
const ENGINE = __dirname;
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

function pageHtml() {
  const font = (fam, w, file, range) => `@font-face{font-family:${fam};font-weight:${w};src:url(fonts/${file}) format('woff2');${range ? 'unicode-range:' + range + ';' : ''}}`;
  const HEB = 'U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F', LAT = 'U+0000-00FF,U+2013-2014';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${font('Karantina', 400, 'karantina-hebrew-400-normal.woff2', HEB)}${font('Karantina', 700, 'karantina-hebrew-700-normal.woff2', HEB)}
${font('Karantina', 400, 'karantina-latin-400-normal.woff2', LAT)}${font('Karantina', 700, 'karantina-latin-700-normal.woff2', LAT)}
${font("'Bebas Neue'", 400, 'bebas-neue-latin-400-normal.woff2')}
html,body{margin:0;background:#000}canvas{display:block}</style></head><body>
<canvas id="cv" width="720" height="1280"></canvas>
<script>window.SPEC=${JSON.stringify(spec)};</script>
<script src="harness.js"></script><script src="sound.js"></script><script src="painter.js"></script><script src="gouache.js"></script>
<script>(async()=>{const specs=['700 100px "Karantina"','400 60px "Karantina"','400 100px "Bebas Neue"'];
try{await Promise.all(specs.map(f=>document.fonts.load(f,'אבגד AaZz09%')));await document.fonts.ready}catch(e){}
const cv=document.getElementById('cv'),ctx=cv.getContext('2d',{willReadFrequently:true});
window.seek=(t)=>{explainer(ctx,720,1280,t)};window.READY=true;})();</script></body></html>`;
}

async function openPage(browser, file) {
  const p = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + file, { timeout: 0 });
  await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  if (errs.length) throw new Error('page error: ' + errs.join('; '));
  return p;
}

(async () => {
  const file = path.join(ENGINE, `_page_${process.pid}.html`);
  fs.writeFileSync(file, pageHtml());
  const browser = await chromium.launch();
  try {
    const p0 = await openPage(browser, file);
    const info = await p0.evaluate(() => ({ errors: VALIDATE(), D: DURATION, beats: BEATS.map((b) => ({ scene: b.scene, t0: b.t0, lines: b.lines.map((l) => [l.a, l.b]) })) }));
    if (info.errors.length) { console.error('SPEC ERRORS:\n - ' + info.errors.join('\n - ')); process.exitCode = 1; return; }
    console.log(`ok: ${info.beats.length} beats, ${info.D.toFixed(1)}s`);
    if (a2 === '--check') return;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));
    if (a2 === '--preview') {
      const times = [0.9]; info.beats.forEach((b) => { const L = b.lines; times.push((L[0][0] + L[0][1]) / 2 + 0.3, L[L.length - 1][1] - 0.15); });
      const el = await p0.$('#cv'), shots = [];
      for (const [i, t] of times.entries()) { await p0.evaluate((t) => seek(t), t); const f = path.join(tmp, `p${String(i).padStart(2, '0')}.png`); await el.screenshot({ path: f }); shots.push(f); }
      const cols = Math.min(6, shots.length), rows = Math.ceil(shots.length / cols);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, 'p%02d.png'), '-vf', `scale=240:-1,tile=${cols}x${rows}`, '-frames:v', '1', a3]);
      console.log('preview:', a3); return;
    }
    // ---- full render ----
    const out = a2, fps = 30, N = Math.ceil(info.D * fps), P = Math.max(1, Math.min(4, os.cpus().length));
    const audio = await p0.evaluate(async () => { const r = await SOUND.renderOffline(window.scoreSound, DURATION, 48000, { voiceover: false });
      const a = new Int16Array(r.inter.length), g = r.peak > 0.98 ? 0.98 / r.peak : 1; for (let i = 0; i < a.length; i++) a[i] = Math.max(-1, Math.min(1, r.inter[i] * g)) * 32767;
      let s = ''; const u = new Uint8Array(a.buffer); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); });
    fs.writeFileSync(path.join(tmp, 'sound.raw'), Buffer.from(audio, 'base64'));
    const pages = [p0]; for (let i = 1; i < P; i++) pages.push(await openPage(browser, file));
    let done = 0; const t0 = Date.now();
    await Promise.all(pages.map(async (p, w) => { const el = await p.$('#cv');
      for (let i = w; i < N; i += P) { await p.evaluate((t) => seek(t), i / fps); await el.screenshot({ path: path.join(tmp, `f${String(i).padStart(5, '0')}.png`) }); if (++done % 150 === 0) console.log(`${done}/${N} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`); } }));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(tmp, 'f%05d.png'), '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', path.join(tmp, 'sound.raw'),
      '-vf', 'scale=1080:1920:flags=lanczos', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
    // quality check: no black frames
    const bd = require('child_process').spawnSync('ffmpeg', ['-v', 'info', '-i', out, '-vf', 'blackdetect=d=0.3:pix_th=0.05', '-an', '-f', 'null', '-'], { encoding: 'utf8' });
    if (/black_start/.test(bd.stderr || '')) { console.error('QUALITY: black frames detected'); process.exitCode = 1; }
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log('rendered:', out, `${N} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  } finally { await browser.close(); try { fs.unlinkSync(file); } catch (e) {} }
})().catch((e) => { console.error(e); process.exit(1); });
