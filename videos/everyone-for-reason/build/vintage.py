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

# body-armor (2026-11-20): Reich's seven armor rings
ITEMS.update({
    "padlock": "A big old heavy iron padlock, closed and locked, with a thick shackle, slightly rusty.",
    "chem-flask": "A vintage glass laboratory flask (Erlenmeyer) half full of a golden liquid, bubbling, with a cork stopper and a little steam.",
    "armor": "A medieval knight's suit of plate armour standing upright, polished steel with rivets, front view, the helmet visor closed, the steel plates clearly made of horizontal bands around the body.",
    "dentures": "A pair of old wind-up chattering false teeth (joke toy dentures) with pink gums and big white teeth, the mouth half open, on little orange feet.",
    "pelvis": "A vintage anatomical engraving of the human pelvis bone (hips and sacrum), front view, old medical textbook plate in aged sepia ink.",
    "mask": "A white porcelain Venetian theatre mask covering the full face, with a calm frozen smile, empty eye holes, faint gold trim and a thin crack across it.",
})
PEOPLE.update({
    "man-jaw": "A 1950s office man in a shirt and tie clenching his jaw hard, teeth gritted and visible, the cheek muscles bulging, tense and stressed, one hand gripping his temple.",
    "analyst": "A 1950s psychoanalyst with a beard, round glasses and a tweed suit, sitting in an armchair, writing in a small notebook and looking up curiously over his glasses.",
    "man-stare": "A 1950s man in a grey suit staring blankly into the distance with an empty, far-away look, the face frozen and expressionless, the eyes wide and glassy.",
    "man-angry": "A 1950s man in a vest and rolled-up sleeves shouting in rage, the mouth wide open showing his teeth, the fists clenched, veins on the neck.",
    "man-swallow": "A 1950s man in a suit swallowing a huge gulp, both hands on his throat, the eyes bulging, the cheeks puffed, comic and nervous.",
    "woman-hold": "A 1950s woman with a neat hairdo and a polka-dot blouse holding her breath, the cheeks puffed full of air, the lips pressed shut, the shoulders raised up tight.",
    "man-belly": "A 1950s man in a white shirt and suspenders hunched over clutching his belly with both hands, the face tense and worried.",
    "boxer": "A 1950s boxer in shorts and gloves with both fists raised in a tight defensive guard in front of his face, the belly tensed, the eyes wary.",
    "couple-hug": "A 1950s couple hugging tenderly, the woman in a flowered dress and the man in a cardigan, both smiling warmly with the eyes closed.",
})
H = {"Authorization": f"Key {KEY}", "Content-Type": "application/json"}

# everyone-for-reason (2026-11-22): "כל אדם מגיע מסיבה"
ITEMS.update({
    "door": "An old wooden front door of a 1950s house standing half open, a warm bright light shining out through the gap, with a brass knob and a small doormat, front view.",
    "filing-cabinet": "An old grey metal office filing cabinet with four drawers, the drawers pulled half open and bursting with stacks of papers and folders sticking out.",
    "gift-box": "A vintage wrapped gift box with polka-dot paper and a big red satin ribbon bow on top, the lid slightly lifted.",
})
PEOPLE.update({
    "ex-teacher": "A glamorous 1950s young woman with curled hair and red lipstick, holding a long wooden teacher's pointer stick pointing up, giving a playful wink.",
    "nerd-student": "A smug 1950s college student with thick black glasses, slicked hair, a sweater vest and a tall stack of books under one arm, raising his other hand eagerly high in the air with a know-it-all smirk.",
    "boss-fire": "A stern bald 1950s boss in a dark suit and tie, red-faced and furious, shouting with the mouth open and pointing sharply to the side with an outstretched arm, as if saying you are fired.",
    "woman-serene": "A serene 1950s woman with a neat hairdo and a cardigan, her eyes gently closed and a soft knowing smile, one hand resting on her heart.",
    # v2 (Guy's note at 0:16): many more people who don't know
    "shrug-1": "A 1950s housewife in an apron with curled hair, shrugging both shoulders with both palms turned up, eyebrows raised and mouth pulled down, clearly saying I have no idea.",
    "shrug-2": "A 1950s mailman in a cap and uniform scratching his head with one hand, puzzled, squinting and frowning, completely confused.",
    "shrug-3": "A young 1950s woman in a polka-dot dress with a finger on her lips and the eyes rolled up, puzzled and unsure, head tilted.",
})

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
