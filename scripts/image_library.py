"""Shared image library for spirit-reels videos (Guy, 2026-11-19).

Rule: reuse an image we already have instead of generating a new one, but one image may appear in at most
MAX_USES (20) of any WINDOW (50) consecutive videos. Over that, generate a new variant (heart~2, heart~3, …).

Layout (spirit-reels/assets/image-library/):
  library.json   {"<style>/<name>[~N]": {"name", "style", "desc", "prompt", "model", "created", "source_video", "raw", "cut"}}
  usage.json     {"videos": [{"slug", "date", "images": [ids]}]}   — one entry per video, in production order
  <style>/       the image files (<id-tail>.png = cut-out, <id-tail>.raw.png = original)

CLI:
  python3 scripts/image_library.py list [--style vintage-color] [--q heart]   what we have + recent uses
  python3 scripts/image_library.py register <video-slug>                      count a video in the window (even with no images)
  python3 scripts/image_library.py usage                                       videos in the window and their images
Python (used by build/vintage.py):
  acquire(slug, style, name) -> id or None    reusable variant under the cap, recorded as used by <slug>
  add(slug, style, name, cut, raw, **meta) -> id   store a newly generated image as a new variant, recorded as used
"""
import json, os, shutil, sys, datetime, argparse, threading, functools

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(os.path.dirname(HERE), "assets", "image-library")
MAX_USES, WINDOW = 20, 50
_LOCK = threading.RLock()   # build scripts call us from several threads at once


def _locked(fn):
    @functools.wraps(fn)
    def w(*a, **k):
        with _LOCK: return fn(*a, **k)
    return w


def _load(f, empty):
    p = os.path.join(LIB, f)
    return json.load(open(p)) if os.path.exists(p) else empty


def _save(f, data):
    os.makedirs(LIB, exist_ok=True)
    p = os.path.join(LIB, f)
    json.dump(data, open(p + ".tmp", "w"), ensure_ascii=False, indent=1)
    os.replace(p + ".tmp", p)


def library(): return _load("library.json", {})
def usage(): return _load("usage.json", {"videos": []})


@_locked
def register(slug):
    """Make sure <slug> has an entry in the usage log (appended at the end = newest video)."""
    u = usage()
    if not any(v["slug"] == slug for v in u["videos"]):
        u["videos"].append({"slug": slug, "date": datetime.date.today().isoformat(), "images": []})
        _save("usage.json", u)
    return u


def uses_in_window(img_id, slug):
    """How many videos used img_id among the WINDOW-1 videos before <slug> (plus <slug> itself if already recorded)."""
    vids = register(slug)["videos"]
    i = next(k for k, v in enumerate(vids) if v["slug"] == slug)
    window = vids[max(0, i - (WINDOW - 1)): i + 1]
    return sum(img_id in v["images"] for v in window)


@_locked
def allowed(img_id, slug):
    vids = register(slug)["videos"]
    me = next(v for v in vids if v["slug"] == slug)
    if img_id in me["images"]: return True          # already counted for this video
    return uses_in_window(img_id, slug) < MAX_USES


@_locked
def _record(slug, img_id):
    u = register(slug)
    me = next(v for v in u["videos"] if v["slug"] == slug)
    if img_id not in me["images"]:
        me["images"].append(img_id); _save("usage.json", u)


def variants(style, name):
    return sorted((k for k, v in library().items() if v["style"] == style and v["name"] == name),
                  key=lambda k: int(k.split("~")[1]) if "~" in k else 1)


@_locked
def acquire(slug, style, name):
    """Return the id of a reusable image for (style, name) that is under the cap, and record the use; None = generate."""
    ok = [k for k in variants(style, name) if allowed(k, slug)]
    if not ok: return None
    best = min(ok, key=lambda k: uses_in_window(k, slug))   # spread uses across variants
    _record(slug, best)
    return best


def path(img_id, kind="cut"):
    return os.path.join(LIB, library()[img_id][kind])


@_locked
def add(slug, style, name, cut, raw=None, **meta):
    """Copy a newly generated image into the library as the next free variant of (style, name); record its use."""
    lib = library(); n = len(variants(style, name)) + 1
    img_id = f"{style}/{name}" + (f"~{n}" if n > 1 else "")
    while img_id in lib: n += 1; img_id = f"{style}/{name}~{n}"
    tail = img_id.split("/", 1)[1]
    os.makedirs(os.path.join(LIB, style), exist_ok=True)
    rel_cut = f"{style}/{tail}.png"; shutil.copyfile(cut, os.path.join(LIB, rel_cut))
    rel_raw = None
    if raw: rel_raw = f"{style}/{tail}.raw.png"; shutil.copyfile(raw, os.path.join(LIB, rel_raw))
    lib[img_id] = {"name": name, "style": style, "cut": rel_cut, "raw": rel_raw, "source_video": slug,
                   "created": datetime.date.today().isoformat(), **meta}
    _save("library.json", lib)
    _record(slug, img_id)
    return img_id


def _recent_count(img_id):
    vids = usage()["videos"][-WINDOW:]
    return sum(img_id in v["images"] for v in vids)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    l = sp.add_parser("list"); l.add_argument("--style"); l.add_argument("--q")
    r = sp.add_parser("register"); r.add_argument("slug")
    sp.add_parser("usage")
    a = ap.parse_args()
    if a.cmd == "list":
        for k, v in sorted(library().items()):
            if a.style and v["style"] != a.style: continue
            if a.q and a.q.lower() not in (k + " " + v.get("desc", "")).lower(): continue
            print(f"{k:34} {_recent_count(k):>2}/{MAX_USES} in last {WINDOW}  {v.get('desc', '')[:90]}")
    elif a.cmd == "register":
        register(a.slug); print("registered", a.slug)
    elif a.cmd == "usage":
        for v in usage()["videos"][-WINDOW:]:
            print(f"{v['date']}  {v['slug']:24} {len(v['images'])} images")
