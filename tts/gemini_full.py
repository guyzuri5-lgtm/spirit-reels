# Full voiceover with Gemini TTS for every segment in segments.json. Writes out_full/<id>.wav (24kHz mono).
import base64, json, os, pathlib, time, urllib.request, urllib.error, wave
KEY = os.environ["GEMINI_API_KEY"]
CFG = json.loads(pathlib.Path(__file__).with_name("gemini_full.json").read_text())
segs = json.loads(pathlib.Path(__file__).with_name("segments.json").read_text())
out = pathlib.Path("out_full"); out.mkdir(exist_ok=True)
def call(text):
    body = {"contents":[{"parts":[{"text": CFG["style"] + "\n\n" + text}]}],
            "generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":CFG["voice"]}}}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{CFG['model']}:generateContent",
        data=json.dumps(body).encode(), headers={"Content-Type":"application/json","x-goog-api-key":KEY})
    with urllib.request.urlopen(req, timeout=120) as r: return json.load(r)
for s in segs:
    pcm = None
    for attempt in range(5):
        try:
            r = call(s.get("tts", s["text"]))
            pcm = base64.b64decode(r["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]); break
        except urllib.error.HTTPError as e:
            print("HTTP", e.code, e.read().decode(errors="replace")[:200], flush=True); time.sleep(45)
        except (KeyError, IndexError):
            print("no audio, retrying", s["id"], flush=True); time.sleep(10)
    if pcm is None: print("FAILED", s["id"], flush=True); continue
    with wave.open(str(out / f"{s['id']}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
    print("ok", s["id"], f"{len(pcm)/48000:.1f}s", flush=True); time.sleep(22)
