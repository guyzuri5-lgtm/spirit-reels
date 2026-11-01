# Free open-source Hebrew TTS test (Chatterbox Multilingual, MIT). Writes out_cb/<variant>_<seg>.wav
import json, pathlib, sys, time, torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
segs = {s["id"]: s["text"] for s in json.loads(pathlib.Path(__file__).with_name("segments.json").read_text())}
model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
out = pathlib.Path("out_cb"); out.mkdir(exist_ok=True)
ref = "tts/out/he-IL-AvriNeural/s2.mp3"
variants = [
  ("default_calm",   dict(exaggeration=0.5, cfg_weight=0.0)),
  ("default_lively", dict(exaggeration=0.75, cfg_weight=0.3)),
  ("ref_avri",       dict(exaggeration=0.6, cfg_weight=0.0, audio_prompt_path=ref)),
]
for name, kw in variants:
    for sid in ["s1"]:
        t = time.time()
        wav = model.generate(segs[sid], language_id="he", **kw)
        ta.save(str(out / f"{name}_{sid}.wav"), wav, model.sr)
        print(name, sid, f"{time.time()-t:.0f}s", flush=True)
