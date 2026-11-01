#!/usr/bin/env python3
"""Build a riso video from a spec: voiceover -> word timing -> beats -> frames -> sound -> mp4 (-> queue).

    python3 riso/build.py riso/specs/<id>.json [--vo existing.wav] [--out dir] [--enqueue] [--preview 1.2,5.0]

Spec format: see riso/README.md.
"""
import argparse, json, math, os, pathlib, re, subprocess, sys, wave
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SR = 48000
LEAD, TAIL = 0.3, 0.7
PUNCT = ',.?!:;—'
MAX_BEAT = 2.8


# ---------------------------------------------------------------- text helpers
def clean(w):
    return re.sub(r'[,.?!:;"״׳—\-()]', '', w)


def syllables(w):
    c = clean(w)
    if not c:
        return 0.5
    if re.fullmatch(r'[\d.,%]+', c):
        return 2 * len(re.sub(r'\D', '', c)) + 1
    return max(1, round(len(c) / 2 + 0.01))


def split_words(script):
    return [w for w in script.split() if clean(w)]


def phrases_of(words):
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        if w[-1] in PUNCT:
            out.append(cur); cur = []
    if cur:
        out.append(cur)
    return out


def chunks_of(words):
    """caption chunks: 2-4 words, never across punctuation"""
    res = []
    for ph in phrases_of(words):
        n = len(ph)
        k = max(1, math.ceil(n / 4))
        size = math.ceil(n / k)
        for j in range(0, n, size):
            res.append(ph[j:j + size])
    # merge single-word chunks into the previous one when it stays <= 4 words
    merged = []
    for c in res:
        if len(c) == 1 and merged and len(merged[-1]) < 4 and words[merged[-1][-1]][-1] not in '.?!':
            merged[-1] = merged[-1] + c
        else:
            merged.append(c)
    return merged


# ---------------------------------------------------------------- audio analysis
def load_wav(path):
    with wave.open(str(path)) as w:
        sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    if ch > 1:
        x = x.reshape(-1, ch).mean(1)
    return x, sr


def analyse(path):
    x, sr = load_wav(path)
    hop = 0.01; h = int(sr * hop); n = len(x) // h
    db = 20 * np.log10(np.sqrt(np.mean(x[:n * h].reshape(n, h) ** 2, axis=1)) + 1e-12)
    voiced = db > db.max() - 38
    idx = np.where(voiced)[0]
    a, b = max(0, idx[0] - 2), min(n, idx[-1] + 3)
    x = x[int(a * hop * sr): int(b * hop * sr)]
    v = voiced[a:b]
    runs, start, sil = [], None, 0
    gap = int(0.15 / hop)
    for i in range(len(v)):
        if v[i]:
            if start is None:
                start = i
            sil = 0
        elif start is not None:
            sil += 1
            if sil == gap:
                runs.append([start * hop, (i - gap + 1) * hop]); start = None
    if start is not None:
        runs.append([start * hop, len(v) * hop])
    onsets, sil = [], 0
    for k in range(len(v)):
        if v[k]:
            if sil >= 6:
                onsets.append(k * hop)
            sil = 0
        else:
            sil += 1
    t_src = np.arange(len(x)) / sr
    y = np.interp(np.arange(int(len(x) / sr * SR)) / SR, t_src, x)
    return y, len(x) / sr, runs, onsets


def align(phrases, runs):
    """Align consecutive phrases <-> consecutive speech runs (boundaries coincide), by dynamic programming.
    Cost: difference between each segment's share of speech time and its share of syllables,
    a small penalty for many-to-one matches and a bonus for using long pauses as boundaries."""
    K, G = len(phrases), len(runs)
    syl = [sum(syllables(w) + 0.3 for _, w in ph) for ph in phrases]; ST = sum(syl)
    sp = [b - a for a, b in runs]; SP = sum(sp)
    gapl = [runs[j][0] - runs[j - 1][1] for j in range(1, G)] or [0.0]; GM = max(gapl) or 1.0
    csyl = [0.0]
    for x in syl: csyl.append(csyl[-1] + x)
    csp = [0.0]
    for x in sp: csp.append(csp[-1] + x)
    ends = [ph[-1][1][-1] for ph in phrases]
    INF = 1e9
    dp = [[INF] * (G + 1) for _ in range(K + 1)]; bk = [[None] * (G + 1) for _ in range(K + 1)]
    dp[0][0] = 0.0
    for p in range(1, K + 1):
        for g in range(1, G + 1):
            for p0 in range(max(0, p - 8), p):
                for g0 in range(max(0, g - 8), g):
                    if dp[p0][g0] >= INF:
                        continue
                    c = 0.5 * abs((csp[g] - csp[g0]) / SP - (csyl[p] - csyl[p0]) / ST)
                    for k in range(p0, p - 1):          # punctuation inside the segment that got no pause
                        c += 0.15 if ends[k] in '.?!' else 0.06
                    c += sum(0.02 + 0.1 * gapl[k - 1] / GM for k in range(g0 + 1, g))  # a pause inside a phrase
                    if dp[p0][g0] + c < dp[p][g]:
                        dp[p][g] = dp[p0][g0] + c; bk[p][g] = (p0, g0)
    segs, p, g = [], K, G
    while p > 0:
        p0, g0 = bk[p][g]; segs.append((p0, p, g0, g)); p, g = p0, g0
    segs.reverse()
    return [sum(phrases[p0:p1], []) for p0, p1, _, _ in segs], [[list(r) for r in runs[g0:g1]] for _, _, g0, g1 in segs]


def word_times(words, runs, onsets):
    """estimate the start time of each word (seconds from the trimmed start)."""
    phrases = [[(i, words[i]) for i in ph] for ph in phrases_of(words)]
    phrases, groups = align(phrases, runs)
    one_to_one = sum(len(g) == 1 for g in groups)
    method = f'dp {len(groups)} segments, {one_to_one} single-run'
    times = {}
    for ph, grp in zip(phrases, groups):
        sp = sum(b - a for a, b in grp)
        L = [syllables(w) + 0.3 for _, w in ph]; tot = sum(L)
        cum = [sum(L[:j]) for j in range(len(ph))] + [tot]
        anchors, before = {0: grp[0][0]}, 0.0
        for gi, (a, b) in enumerate(grp):
            if gi > 0:
                fr = before / sp - 0.07
                cand = [j for j in range(1, len(ph)) if j not in anchors and j > max(anchors)]
                if cand:
                    anchors[min(cand, key=lambda j: abs(cum[j] / tot - fr))] = a
            before += b - a
        keys = sorted(anchors) + [len(ph)]
        tt = [0.0] * len(ph)
        for k0, k1 in zip(keys[:-1], keys[1:]):
            t0 = anchors[k0]; t1 = anchors[k1] if k1 in anchors else grp[-1][1]
            segs = [(max(a, t0), min(b, t1)) for a, b in grp if min(b, t1) > max(a, t0)] or [(t0, t1)]
            spk = sum(b - a for a, b in segs)
            for j in range(k0, k1):
                f = (cum[j] - cum[k0]) / max(1e-9, cum[k1] - cum[k0]); tgt = f * spk; x = segs[-1][1]
                for a, b in segs:
                    if tgt <= b - a + 1e-9:
                        x = a + tgt; break
                    tgt -= b - a
                tt[j] = x
        prev = -1
        for j, (i, w) in enumerate(ph):
            x = tt[j]
            if j not in anchors:
                near = [o for o in onsets if abs(o - x) <= 0.15 and o > prev + 0.12]
                if near:
                    x = min(near, key=lambda o: abs(o - x))
            times[i] = x; prev = x
    return [times[i] for i in range(len(words))], method


# ---------------------------------------------------------------- beats
def find_word(words, wt, key, after=0.0):
    """'word' or 'word#2' (n-th occurrence) or a number (seconds)."""
    if isinstance(key, (int, float)):
        return float(key)
    m = re.match(r'^(.*?)(?:#(\d+))?$', key.strip())
    target, nth = clean(m.group(1)), int(m.group(2) or 1)
    hits = [i for i, w in enumerate(words) if clean(w) == target]
    if not hits:
        hits = [i for i, w in enumerate(words) if target and target in clean(w)]
    if len(hits) < nth:
        raise SystemExit(f'anchor not found in script: {key!r}')
    return wt[hits[nth - 1]] - 0.06


def resolve(obj, words, wt):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if (re.fullmatch(r'at\d*', k) or k.endswith('_at')) and isinstance(v, (str, int, float)) and not isinstance(v, bool):
                out[k] = find_word(words, wt, v)
            else:
                out[k] = resolve(v, words, wt)
        return out
    if isinstance(obj, list):
        return [resolve(v, words, wt) for v in obj]
    return obj


def plan_beats(spec, words, wt, duration):
    beats = []
    for i, b in enumerate(spec['beats']):
        rb = resolve(b, words, wt)
        rb['t0'] = 0.0 if i == 0 else rb.get('at', 0.0)
        beats.append(rb)
    beats.sort(key=lambda b: b['t0'])
    for i, b in enumerate(beats):
        b['t1'] = beats[i + 1]['t0'] if i + 1 < len(beats) else duration
    # enforce the 3-second rule: split long beats into a re-framed variant
    out = []
    for b in beats:
        d = b['t1'] - b['t0']
        n = max(1, math.ceil(d / MAX_BEAT))
        for k in range(n):
            nb = dict(b); nb['t0'] = b['t0'] + d * k / n; nb['t1'] = b['t0'] + d * (k + 1) / n
            if k % 2 == 1:
                nb['variant'] = 1
                if nb.get('type') == 'head':
                    nb['framing'] = {'wide': 'map', 'map': 'close', 'close': 'scan', 'scan': 'map'}.get(nb.get('framing', 'wide'), 'map')
                    nb['head_in'] = nb['t0']
                elif nb.get('type') == 'figure':
                    nb['framing'] = {'wide': 'porthole', 'porthole': 'face', 'face': 'wide', 'flow': 'wide'}.get(nb.get('framing', 'wide'), 'wide')
                else:
                    nb['bg'] = {'paper': 'pink', 'navy': 'paper', 'pink': 'yellow', 'yellow': 'teal', 'teal': 'paper'}.get(nb.get('bg', 'paper'), 'paper')
            out.append(nb)
    return out


# ---------------------------------------------------------------- soundtrack
def soundtrack(data, vo, path):
    D = data['duration']; N = int(round(SR * D)); t = np.arange(N) / SR
    rng = np.random.default_rng(3); out = np.zeros((N, 2))

    def env(t0, t1, a=0.2, r=0.3):
        e = np.clip((t - t0) / a, 0, 1) * np.clip((t1 - t) / r, 0, 1); return e * e * (3 - 2 * e)

    def add(sig, t0, g=1.0):
        i = int(t0 * SR); n = min(len(sig), N - i)
        if n > 0 and i >= 0:
            out[i:i + n, 0] += sig[:n] * g; out[i:i + n, 1] += sig[:n] * g

    def lowpass(x, fc):
        from scipy.signal import butter, sosfilt
        return sosfilt(butter(2, fc, fs=SR, output='sos'), x)

    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.18 * t)
    key = data.get('key', 65.41)
    drone = (np.sin(2 * np.pi * key * t) + 0.5 * np.sin(2 * np.pi * key * 1.5 * t + 1) + 0.25 * np.sin(2 * np.pi * key * 2.002 * t)) * (0.6 + 0.4 * lfo) * env(0, D, 0.8, 0.8)
    out[:, 0] += 0.10 * drone; out[:, 1] += 0.097 * drone

    def slap(dur=0.14):
        n = int(dur * SR); x = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.025 * SR)); x = lowpass(x, 2500)
        return 0.6 * x + 0.9 * np.sin(2 * np.pi * 75 * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.05 * SR))

    def whoosh():
        n = int(0.22 * SR); x = rng.standard_normal(n); x = lowpass(x, 3000) - lowpass(x, 500); return x * np.sin(np.linspace(0, np.pi, n)) ** 2

    def bell(f, dur=1.2, decay=0.4):
        n = int(dur * SR); tt = np.arange(n) / SR
        return sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2.01, .4), (3.0, .25), (4.2, .12)]) * np.exp(-tt / decay)

    notes = [523.25, 587.33, 659.25, 783.99, 880.0]
    for i, b in enumerate(data['beats']):
        if i > 0:
            add(whoosh(), b['t0'] - 0.12, 0.12); add(slap(), b['t0'], 0.18)
        s = b.get('slam') or {}
        for k in ('at', 'at2'):
            if s.get(k) is not None:
                add(slap(), s[k], 0.32)
        for w in b.get('words', []) or []:
            if w.get('at') is not None:
                add(slap(), w['at'], 0.3)
        if b.get('type') == 'meter':
            pk = b.get('peak_at') or (b['t0'] + (b['t1'] - b['t0']) * 0.6)
            steps = 12
            for j in range(steps):
                tt = b['t0'] + 0.15 + (j / (steps - 1)) ** (1 / 1.4) * (pk - b['t0'] - 0.15)
                n = int(0.03 * SR); add(np.sin(2 * np.pi * (1800 + 60 * j) * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.006 * SR)), tt, 0.1)
            add(bell(784), pk, 0.12); add(slap(), pk, 0.4)
        for j, r in enumerate(b.get('regions', []) or []):
            if r.get('at') is not None and r['at'] >= b['t0']:
                add(bell(notes[j % 5], 1.0, 0.3), r['at'], 0.09)
        for j, it in enumerate(b.get('items', []) or []):
            if it.get('at') is not None:
                add(bell(notes[j % 5], 0.8, 0.25), it['at'], 0.08)
        if b.get('type') == 'hero':
            add(bell(523.25, 1.4, 0.5), b['t0'], 0.08)
        if b.get('type') == 'figure' and b.get('rings'):
            vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t); ph = 2 * np.pi * np.cumsum(130.0 * vib) / SR
            hum = sum(a * np.sin((k + 1) * ph) for k, a in enumerate([1.0, .75, .5, .32, .22, .14, .09]))
            hum = lowpass(hum * (1 + 0.08 * np.sin(2 * np.pi * 21 * t)), 1400) * env(b['t0'], b['t1'], 0.3, 0.3)
            out[:, 0] += 0.12 * hum; out[:, 1] += 0.12 * hum
        if b.get('type') == 'breath':
            air = lowpass(rng.standard_normal(N), 1200) * env(b['t0'], b['t1'], 0.3, 0.3) * (0.5 + 0.5 * np.sin(2 * np.pi * t / (b.get('period') or 2.4)))
            out[:, 0] += 0.05 * air; out[:, 1] += 0.05 * air
        if (b.get('flow') or b.get('framing') == 'flow'):
            air = (lowpass(rng.standard_normal(N), 900)) * env(b['t0'], b['t1'], 0.4, 0.3)
            out[:, 0] += 0.05 * air; out[:, 1] += 0.05 * np.roll(air, 300)
    out *= 0.5 / (np.max(np.abs(out)) + 1e-9)
    # voice + ducking (soundtrack ~55% down while speaking)
    vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
    h = int(0.01 * SR); nb = N // h + 1
    e = np.sqrt(np.convolve(np.pad(vo ** 2, (0, nb * h - N)).reshape(nb, h).mean(1), np.ones(5) / 5, 'same'))
    act = (20 * np.log10(e + 1e-9) > 20 * np.log10(e.max() + 1e-9) - 35).astype(float)
    g = np.zeros(nb); s_ = 0.0
    for i in range(nb):
        k = 1 - np.exp(-1 / 3) if act[i] > s_ else 1 - np.exp(-1 / 30)
        s_ += (act[i] - s_) * k; g[i] = s_
    duck = 1 - 0.55 * np.repeat(g, h)[:N]
    mix = out * duck[:, None] + vo[:, None] * 0.9
    mix *= 0.95 / (np.max(np.abs(mix)) + 1e-9)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())


# ---------------------------------------------------------------- main
def sh(*cmd):
    print('$', ' '.join(map(str, cmd))[:200], flush=True)
    subprocess.run(list(map(str, cmd)), check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('spec')
    ap.add_argument('--vo', help='use this wav instead of calling TTS')
    ap.add_argument('--out', default=None)
    ap.add_argument('--enqueue', action='store_true')
    ap.add_argument('--preview', default=None, help='comma-separated times: only render these frames as PNG')
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--reuse-frames', action='store_true', help='skip rendering if video_silent.mp4 exists')
    a = ap.parse_args()
    spec = json.loads(pathlib.Path(a.spec).read_text())
    sid = spec['id']
    out = pathlib.Path(a.out or HERE / 'out' / sid); out.mkdir(parents=True, exist_ok=True)
    vo_raw = pathlib.Path(a.vo) if a.vo else out / 'vo_raw.wav'
    if not vo_raw.exists():
        r = subprocess.run([sys.executable, str(HERE / 'tts.py'), spec.get('tts') or spec['script'], str(vo_raw)])
        if r.returncode == 3:
            print('QUOTA: Gemini quota exhausted, will retry later'); sys.exit(3)
        if r.returncode != 0:
            sys.exit('tts failed')
    words = split_words(spec['script'])
    y, dur, runs, onsets = analyse(vo_raw)
    wt_rel, method = word_times(words, runs, onsets)
    wt = [LEAD + x for x in wt_rel]
    duration = round(LEAD + dur + TAIL, 3)
    vo = np.concatenate([np.zeros(int(LEAD * SR)), y, np.zeros(int(TAIL * SR))])[: int(round(duration * SR))]
    vo = vo / (np.abs(vo).max() + 1e-9) * 0.95
    chunks = []
    for c in chunks_of(words):
        chunks.append({'w': [words[i] for i in c], 'ws': [round(wt[i], 3) for i in c], 't0': round(wt[c[0]] - 0.08, 3)})
    for i, c in enumerate(chunks):
        c['t1'] = chunks[i + 1]['t0'] if i + 1 < len(chunks) else duration
    beats = plan_beats(spec, words, wt, duration)
    live = resolve(spec.get('live', {}), words, wt)
    if 'from' in live:
        live.setdefault('start_at', beats[0]['t0']); live.setdefault('end_at', live['start_at'] + 1)
    data = {'id': sid, 'duration': duration, 'beats': beats, 'chunks': chunks, 'keywords': spec.get('keywords', []), 'live': live,
            'words': [{'w': w, 't': round(x, 3)} for w, x in zip(words, wt)], 'timing_method': method}
    (out / 'data.json').write_text(json.dumps(data, ensure_ascii=False, indent=1))
    lens = [round(b['t1'] - b['t0'], 2) for b in beats]
    print(f'{sid}: {duration:.1f}s, {len(beats)} beats (longest {max(lens)}s), {len(runs)} speech runs, timing={method}')
    if duration > 89:
        sys.exit('video longer than 90s - shorten the script')
    if a.preview:
        sh('node', HERE / 'render.js', out / 'data.json', out / 'preview', '--frames', a.preview)
        return
    if not (a.reuse_frames and (out / 'video_silent.mp4').exists()):
        sh('node', HERE / 'render.js', out / 'data.json', out / 'video_silent.mp4', '--workers', a.workers)
    soundtrack(data, vo, out / 'mix.wav')
    sh('ffmpeg', '-v', 'error', '-y', '-i', out / 'mix.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', out / 'mix_norm.wav')
    sh('ffmpeg', '-v', 'error', '-y', '-i', out / 'video_silent.mp4', '-i', out / 'mix_norm.wav', '-map', '0:v', '-map', '1:a',
       '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out / 'video.mp4')
    print('video:', out / 'video.mp4', f"{(out / 'video.mp4').stat().st_size / 1e6:.1f}MB")
    if a.enqueue:
        sh(sys.executable, ROOT / 'scripts' / 'enqueue.py', out / 'video.mp4', '--caption', spec['caption'], '--tags', spec.get('tags', ''), '--id', sid)


if __name__ == '__main__':
    main()
