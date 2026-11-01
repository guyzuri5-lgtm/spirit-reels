"""One Gemini TTS request for a whole video script -> 24kHz mono WAV.

    python3 riso/tts.py "text to read" out.wav
Exit code 3 = quota exhausted (HTTP 429) -> try again later.
"""
import base64, json, os, pathlib, sys, time, urllib.error, urllib.request, wave

CFG = json.loads((pathlib.Path(__file__).parent / "voice.json").read_text())


def call(text):
    body = {"contents": [{"parts": [{"text": CFG["style"] + "\n\n" + text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": CFG["voice"]}}}}}
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{CFG['model']}:generateContent",
        data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)


def main():
    text, out = sys.argv[1], pathlib.Path(sys.argv[2])
    quota = 0
    for attempt in range(4):
        try:
            r = call(text)
            pcm = base64.b64decode(r["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            if len(pcm) < 24000 * 2 * 3:
                raise KeyError("audio too short")
            out.parent.mkdir(parents=True, exist_ok=True)
            with wave.open(str(out), "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
            print(f"tts ok: {len(pcm) / 48000:.1f}s", flush=True)
            return
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:300]
            print("HTTP", e.code, msg, flush=True)
            if e.code == 429:
                quota += 1
                if quota >= 2:
                    sys.exit(3)
            time.sleep(40)
        except (KeyError, IndexError) as e:
            print("no audio, retrying:", e, flush=True); time.sleep(10)
    sys.exit(2)


if __name__ == "__main__":
    main()
