#!/usr/bin/env python3
"""Validate a spec without Gemini: fake a voiceover from syllable counts, resolve all anchors,
report beat lengths and render one preview frame per beat into a contact sheet.

    python3 riso/check.py riso/specs/X.json            -> riso/out/<id>/check_sheet.png
Exit code != 0 means the spec must be fixed before pushing.
"""
import json, pathlib, re, subprocess, sys, wave
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build  # noqa: E402


def fake_vo(script, path):
    sr = 24000; parts = []
    rng = np.random.default_rng(1)
    for ph in build.phrases_of(build.split_words(script)):
        words = build.split_words(script)
        for i in ph:
            for _ in range(int(build.syllables(words[i]))):
                n = int(0.19 * sr); t = np.arange(n) / sr
                parts.append(0.3 * np.sin(2 * np.pi * 140 * t) * np.sin(np.pi * t / t[-1]) + 0.02 * rng.standard_normal(n))
            parts.append(np.zeros(int(0.06 * sr)))
        parts.append(np.zeros(int(0.32 * sr)))
    x = np.concatenate(parts)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype(np.int16).tobytes())


def main():
    sp = pathlib.Path(sys.argv[1]); spec = json.loads(sp.read_text())
    errs = []
    for k in ('id', 'caption', 'script', 'beats'):
        if k not in spec:
            errs.append(f'missing "{k}"')
    p1 = re.sub(r'[^,.?!]', '', spec.get('script', '')); p2 = re.sub(r'[^,.?!]', '', spec.get('tts') or spec.get('script', ''))
    if p1 != p2:
        errs.append(f'punctuation of tts ({p2}) differs from script ({p1})')
    for b in spec.get('beats', []):
        if b.get('type') not in ('figure', 'meter', 'head', 'hero', 'word', 'cards', 'wave', 'breath', 'versus', 'chart'):
            errs.append(f'unknown beat type {b.get("type")}')
    n = len(build.split_words(spec.get('script', '')))
    if not 60 <= n <= 160:
        errs.append(f'script has {n} words (want ~75-140)')
    if errs:
        print('ERRORS:\n - ' + '\n - '.join(errs)); sys.exit(1)
    out = HERE / 'out' / spec['id']; out.mkdir(parents=True, exist_ok=True)
    fake = out / 'fake_vo.wav'; fake_vo(spec.get('script'), fake)
    r = subprocess.run([sys.executable, str(HERE / 'build.py'), str(sp), '--vo', str(fake), '--out', str(out), '--preview', '0.1'], capture_output=True, text=True)
    print(r.stdout[-800:], r.stderr[-1500:])
    if r.returncode:
        sys.exit(1)
    data = json.loads((out / 'data.json').read_text())
    times = [round(b['t0'] + (b['t1'] - b['t0']) * 0.7, 2) for b in data['beats']]
    long_ = [(b['type'], round(b['t1'] - b['t0'], 2)) for b in data['beats'] if b['t1'] - b['t0'] > 2.85]
    r = subprocess.run(['node', str(HERE / 'render.js'), str(out / 'data.json'), str(out / 'check'), '--frames', ','.join(map(str, times))], capture_output=True, text=True)
    if r.returncode or 'PAGE ERROR' in r.stderr:
        print(r.stderr[-1500:]); sys.exit(1)
    files = [out / 'check' / f'f_{t:.2f}.png' for t in times]
    cols = min(8, len(files)); rows = (len(files) + cols - 1) // cols
    inputs = sum([['-i', str(f)] for f in files], [])
    pad = cols * rows - len(files)
    fl = ''.join(f'[{i}]scale=270:480[s{i}];' for i in range(len(files)))
    fl += ''.join(f'color=c=black:s=270x480[e{j}];' for j in range(pad))
    fl += ''.join(f'[s{i}]' for i in range(len(files))) + ''.join(f'[e{j}]' for j in range(pad)) + f'xstack=inputs={cols*rows}:layout=' + '|'.join(f'{(i % cols) * 270}_{(i // cols) * 480}' for i in range(cols * rows))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', fl, '-frames:v', '1', str(out / 'check_sheet.png')], check=True)
    print(f'OK: ~{data["duration"]:.0f}s (estimated), {len(data["beats"])} beats, sheet: {out / "check_sheet.png"}')
    if long_:
        print('note: auto-split long beats ->', long_)


if __name__ == '__main__':
    main()
