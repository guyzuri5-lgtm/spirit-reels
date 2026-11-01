# Hebrew voice samples with Gemini TTS (free tier). Needs GEMINI_API_KEY. Writes out_gm/<name>.wav
import base64, json, os, pathlib, time, urllib.request, urllib.error, wave
KEY = os.environ["GEMINI_API_KEY"]
MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"]
TEXT = "יש צליל אחד שאתה יכול לעשות עכשיו, עם פה סגור, והוא מעלה פי חמש עשרה חומר שהגוף שלך צריך."
STYLES = {
  "warm":  "Read this Hebrew text aloud in natural native Israeli Hebrew. Warm, calm and intimate, like a storyteller on a spiritual podcast, natural pace with small pauses:",
  "story": "Read this Hebrew text aloud in natural native Israeli Hebrew, like a captivating documentary narrator revealing a surprising secret, curious and engaging:",
  "friend":"Read this Hebrew text aloud in natural native Israeli Hebrew, casual and friendly, like telling a friend something cool you just learned:",
}
cfg = pathlib.Path(__file__).with_name("gemini_runs.json")
if cfg.exists():
    c = json.loads(cfg.read_text()); STYLES.update(c["styles"]); RUNS = [tuple(r) for r in c["runs"]]
else:
    RUNS = [("charon","Charon","warm"),("charon","Charon","story"),("orus","Orus","friend"),("sulafat","Sulafat","warm"),("achernar","Achernar","story")]
out = pathlib.Path("out_gm"); out.mkdir(exist_ok=True)
def call(model, voice, prompt):
    body = {"contents":[{"parts":[{"text": prompt + "\n\n" + TEXT}]}],
            "generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":voice}}}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(), headers={"Content-Type":"application/json","x-goog-api-key":KEY})
    with urllib.request.urlopen(req, timeout=120) as r: return json.load(r)
model = None
for name, voice, style in RUNS:
    for m in ([model] if model else MODELS):
        for attempt in range(3):
            try:
                res = call(m, voice, STYLES[style]); model = m; break
            except urllib.error.HTTPError as e:
                msg = e.read().decode(errors="replace")[:300]; print("HTTP", e.code, m, msg, flush=True)
                if e.code == 429: time.sleep(40); continue
                res = None; break
        else: res = None
        if res: break
    if not res: continue
    try:
        pcm = base64.b64decode(res["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
    except (KeyError, IndexError):
        print("no audio", name, style, json.dumps(res.get("candidates", res))[:300], flush=True)
        try: pcm = base64.b64decode(call(model, voice, STYLES[style])["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
        except Exception as e: print("retry failed", name, style, flush=True); time.sleep(22); continue
    with wave.open(str(out / f"{name}_{style}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
    print("ok", model, name, style, f"{len(pcm)/48000:.1f}s", flush=True)
    time.sleep(22)
