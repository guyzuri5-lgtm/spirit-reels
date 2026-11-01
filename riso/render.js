// Render riso/engine.html frame by frame.
//   node riso/render.js data.json out.mp4 [--workers 4]      -> silent H.264 video
//   node riso/render.js data.json outdir --frames 1.2,5,9.7  -> PNG previews
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [dataPath, out] = args;
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const FPS = 30, N = Math.round(data.duration * FPS);

async function page(browser) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
  await p.addInitScript({ content: 'window.DATA=' + JSON.stringify(data) });
  await p.goto('file://' + path.resolve(__dirname, 'engine.html'));
  await p.evaluate(() => window.ready);
  return p;
}
async function segment(browser, f0, f1, file) {
  const p = await page(browser);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    await p.evaluate(t => window.render(t), f / FPS);
    const buf = await p.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await p.close();
}
(async () => {
  const browser = await chromium.launch();
  const frames = opt('--frames');
  if (frames) {
    fs.mkdirSync(out, { recursive: true });
    const p = await page(browser);
    for (const t of frames.split(',').map(Number)) {
      await p.evaluate(t => window.render(t), t);
      await p.screenshot({ path: path.join(out, `f_${t.toFixed(2)}.png`), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    }
    await browser.close(); console.log('previews in', out); return;
  }
  const workers = Math.max(1, Math.min(+opt('--workers', 4), os.cpus().length));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'riso-'));
  const parts = [];
  for (let i = 0; i < workers; i++) parts.push([Math.floor(N * i / workers), Math.floor(N * (i + 1) / workers), path.join(tmp, `p${i}.mp4`)]);
  await Promise.all(parts.map(([a, b, f]) => segment(browser, a, b, f)));
  await browser.close();
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(p => `file '${p[2]}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', out]);
  console.log('rendered', N, 'frames ->', out);
})();
