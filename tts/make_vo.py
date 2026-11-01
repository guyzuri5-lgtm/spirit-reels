# Free Hebrew voiceover with edge-tts. Writes out/<voice>/<id>.mp3 and <id>.json (word timings, seconds).
import asyncio, json, pathlib, sys
import edge_tts
VOICES = sys.argv[1:] or ["he-IL-AvriNeural", "he-IL-HilaNeural"]
segs = json.loads(pathlib.Path(__file__).with_name("segments.json").read_text())
async def one(voice, s):
    out = pathlib.Path("out") / voice; out.mkdir(parents=True, exist_ok=True)
    c = edge_tts.Communicate(s["text"], voice, boundary="WordBoundary")
    words, audio = [], bytearray()
    async for ch in c.stream():
        if ch["type"] == "audio": audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append({"w": ch["text"], "t": ch["offset"] / 1e7, "d": ch["duration"] / 1e7})
    (out / f"{s['id']}.mp3").write_bytes(audio)
    (out / f"{s['id']}.json").write_text(json.dumps(words, ensure_ascii=False, indent=1))
    print(voice, s["id"], len(words), "words")
async def main():
    for v in VOICES:
        for s in segs: await one(v, s)
asyncio.run(main())
