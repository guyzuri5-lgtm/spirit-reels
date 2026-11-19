"""Generate vintage cut-out photos with fal.ai: GPT Image 2 (quality low, ~0.6c) text-to-image → birefnet cutout.
Since 2026-11-19 (Guy): images come out hand-tinted in one pass (no separate tint/edit step); nano-banana-2 (8c + 8c tint) retired.
Key: env FAL_KEY or "fal" in ~/.config/talking-head-to-ae/keys.json.
Out (default, colour): assets/vintage/raw-color/*.png + cut-color/*.png.  BW=1: black-and-white into raw/ + cut/.
Existing files are skipped; FORCE=1 regenerates them.
Usage: python3 build/vintage.py [name ...]   (no names = all)"""
import json, os, shutil, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS = os.path.expanduser("~/.config/talking-head-to-ae/keys.json")
KEY = os.environ.get("FAL_KEY") or json.load(open(KEYS)).get("fal")
STYLE = ("Authentic vintage photograph from a 1950s magazine, printed on paper: black-and-white with a slight warm sepia tone, "
         "visible halftone print dots and film grain, soft studio lighting, high detail. The object is shown alone, whole, "
         "centred, filling about 75% of the frame, isolated on a plain flat white background with nothing else, no text, "
         "no people, no hands. Looks like it was cut out of an old print for a paper collage.")
ITEMS = {
    "antenna-roof": "A 1950s rooftop TV antenna: a metal mast with a fishbone yagi of horizontal rods, a little rust.",
    "antenna-tele": "A chrome telescopic radio antenna fully extended, with a small ball tip, on a little swivel base.",
    "tower": "A tall lattice steel radio transmission tower with a red beacon light at the top, seen from below.",
    "radio-tube": "A 1950s wooden tabletop tube radio with a cloth speaker grille, a glowing round tuning dial and two bakelite knobs.",
    "radio-transistor": "A 1960s portable transistor radio in a stitched leather case with a carry strap and a round tuning wheel.",
    "dial": "A close-up of an old radio tuning dial: a glass frequency scale with numbers 88 to 108 and a red needle, with a big ribbed knob.",
    "meter": "An old analog panel meter (VU meter) in a bakelite case with a curved scale and a thin black needle.",
    "barometer-empty": "An antique round brass barometer seen straight on, the dial face marked STORMY, RAIN, CHANGE, FAIR, VERY DRY around the top arc, with NO needles and no hands at all - the dial face is empty in the middle.",
    "dial-empty": "A close-up of an old radio tuning dial seen straight on: a wide glass frequency scale with numbers 88 to 108, with NO needle and no pointer on the scale, and a big ribbed knob below it.",
    "barometer": "An antique round brass barometer with a needle and a dial marked STORMY, RAIN, CHANGE, FAIR, VERY DRY.",
}
PSTYLE = ("Authentic vintage photograph from a 1950s magazine, printed on paper: black-and-white with a slight warm sepia tone, "
          "visible halftone print dots and film grain. One single person only, shown from the waist up, centred, filling most of the frame, "
          "isolated on a plain flat white background with nothing else, no text. Looks like it was cut out of an old print for a paper collage.")
LAUGH = "laughing hysterically with the mouth wide open and pointing a finger straight at the camera, mocking the viewer"
THINK = "with a fist resting on his chin and the eyes rolled up to the sky, deep in thought, puzzled"
PEOPLE = {
    "laugh-1": f"A 1950s businessman in a suit and tie with slicked hair, {LAUGH}.",
    "laugh-2": f"A 1950s housewife with hair curlers and an apron, {LAUGH}.",
    "laugh-3": f"A chubby old man with a bow tie and suspenders, {LAUGH}, holding his belly.",
    "laugh-4": f"A 1950s teenage boy with a crew cut and a striped shirt, {LAUGH}.",
    "laugh-5": f"An elegant 1950s lady with pearls and a pillbox hat, {LAUGH}.",
    "laugh-6": f"An old grandmother with glasses and a cardigan, {LAUGH}, slapping her knee.",
    "prof-1": f"An old bald professor with round glasses and a tweed jacket, {THINK}.",
    "prof-2": f"A round-faced old professor with neatly combed grey hair, a goatee and a white lab coat, {THINK}.",
    "prof-3": f"A bearded old scholar with a bow tie and a waistcoat, {THINK}.",
}
ITEMS.update({
    "body": "A vintage 19th-century anatomical chart of the whole human body, standing straight, front view, arms slightly away from the body, showing the muscles, the heart and the nervous system, in an old medical engraving style with aged sepia ink.",
    "heart": "A realistic anatomical human heart with its aorta and vessels, like an old medical photograph / engraving.",
    "brain": "A realistic human brain seen from the side, like an old medical photograph / engraving, detailed folds.",
    "eye": "One single large realistic human eye, wide open, staring straight ahead, with its eyelids, lashes and eyebrow, cut out as an almond shape.",
    "hand-point": "A vintage human hand with a shirt cuff, the index finger pointing straight at the camera in strong foreshortening, like the famous 'I want you' poster pose, the other fingers curled.",
    "lungs": "A realistic pair of human lungs with the trachea and bronchi, like an old medical photograph / engraving.",
    "magnifier": "An antique magnifying glass with a brass rim and a turned wooden handle, lying diagonally.",
})
H = {"Authorization": f"Key {KEY}", "Content-Type": "application/json"}

def fal(endpoint, payload, timeout=600):
    sub = json.load(urllib.request.urlopen(urllib.request.Request(f"https://queue.fal.run/{endpoint}", data=json.dumps(payload).encode(), headers=H), timeout=120))
    t0 = time.time()
    while True:
        st = json.load(urllib.request.urlopen(urllib.request.Request(sub["status_url"], headers=H), timeout=60))
        if st.get("status") == "COMPLETED": break
        if time.time() - t0 > timeout: raise RuntimeError(f"{endpoint} timed out")
        time.sleep(3)
    try:
        return json.load(urllib.request.urlopen(urllib.request.Request(sub["response_url"], headers=H), timeout=60))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{endpoint} failed: {e.read().decode()[:400]}")

def get(url, path):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "spirit-reels"}), timeout=120) as r, open(path, "wb") as f:
        f.write(r.read())

# Hand-tint wording proven in boards/model-test/compare-color-v2.jpg (round 2).
TINT = ("Authentic hand-coloured vintage photograph scanned from a worn 1950s magazine page. The base is a black-and-white "
        "photo printed in coarse halftone: the halftone dot pattern is clearly visible everywhere, with heavy film grain and soft, "
        "slightly blurred print detail. Thin, translucent watercolour tints were brushed on top by hand: very faded, desaturated, "
        "washed-out pastel colours (dusty rose skin, faded slate blue, olive, ochre, a muted brick red), uneven and not perfectly "
        "inside the lines, with the grey photo showing through everywhere. Low contrast, aged yellowed tone overall, never "
        "saturated, never glossy, nothing modern or clean.")
CSTYLE = (f"{TINT} The object is shown alone, whole, centred, filling about 75% of the frame, isolated on a plain flat white "
          "background with nothing else, no text, no people, no hands. Looks like it was cut out of an old print for a paper collage.")
CPSTYLE = (f"{TINT} One single person only, shown from the waist up, centred, filling most of the frame, isolated on a plain flat "
           "white background with nothing else, no text. Looks like it was cut out of an old print for a paper collage.")
BW = bool(os.environ.get("BW"))
RAW, CUT = ("raw", "cut") if BW else ("raw-color", "cut-color")

def prompt(name):
    if name in PEOPLE: return f"{PEOPLE[name]} {PSTYLE if BW else CPSTYLE}"
    return f"{ITEMS[name]} {STYLE if BW else CSTYLE}"

def _lib():
    """spirit-reels/scripts/image_library.py — the shared library with the 20-uses-in-50-videos cap."""
    d = ROOT
    while d != "/" and not os.path.exists(f"{d}/scripts/image_library.py"): d = os.path.dirname(d)
    sys.path.insert(0, f"{d}/scripts"); import image_library
    return image_library

def one(name):
    raw, cut = f"{ROOT}/assets/vintage/{RAW}/{name}.png", f"{ROOT}/assets/vintage/{CUT}/{name}.png"
    if os.path.exists(cut) and not os.environ.get("FORCE"): return f"{name} (exists, skipped)"
    L, slug, style = _lib(), os.path.basename(ROOT), ("vintage-bw" if BW else "vintage-color")
    if not os.environ.get("FORCE"):
        img = L.acquire(slug, style, name)          # reuse from the library when under the cap
        if img:
            shutil.copyfile(L.path(img, "cut"), cut)
            if L.library()[img].get("raw"): shutil.copyfile(L.path(img, "raw"), raw)
            return f"{name} (reused {img})"
    r = fal("openai/gpt-image-2", {"prompt": prompt(name), "num_images": 1, "image_size": "square_hd", "quality": "low", "output_format": "png"})
    url = r["images"][0]["url"]; get(url, raw)
    c = fal("fal-ai/birefnet/v2", {"image_url": url, "model": "General Use (Heavy)", "output_format": "png"})
    get(c["image"]["url"], cut)
    img = L.add(slug, style, name, cut, raw, desc=(PEOPLE.get(name) or ITEMS.get(name)), prompt=prompt(name), model="openai/gpt-image-2 low")
    return f"{name} (generated → {img})"

if __name__ == "__main__":
    os.makedirs(f"{ROOT}/assets/vintage/{RAW}", exist_ok=True); os.makedirs(f"{ROOT}/assets/vintage/{CUT}", exist_ok=True)
    names = sys.argv[1:] or list(ITEMS) + list(PEOPLE)
    with ThreadPoolExecutor(4) as ex:
        for fut in [ex.submit(one, n) for n in names]:
            try: print("ok", fut.result())
            except Exception as e: print("FAIL", e)
