#!/usr/bin/env python3
"""Publish the next queued reel to Instagram (runs inside GitHub Actions).

Queue layout (on the `queue` branch, checked out at --queue):
    queue/<id>/video.mp4    the finished vertical video (H.264/AAC, 9:16)   -- or --
    queue/<id>/spec.json    a gouache-engine spec, rendered here first
    queue/<id>/meta.json    {"caption": "...", "hashtags": ["..."], "post_now": false, "not_before": "2026-11-05T08:00:00Z"}
Items are posted oldest-first by folder name. Stdlib only.
"""
import argparse, datetime as dt, json, os, pathlib, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config.json").read_text())
VER = CFG["graph_version"]
TOKEN = os.environ.get("IG_ACCESS_TOKEN", "").strip()
FB_TOKEN = os.environ.get("FB_ACCESS_TOKEN", "").strip()


def log(*a):
    print(*a, flush=True)


def http(method, url, params=None, data=None, headers=None, timeout=120):
    params = dict(params or {})
    if "access_token" not in params and not (headers and "Authorization" in headers):
        params["access_token"] = TOKEN
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise RuntimeError(f"{method} {url.split('?')[0]} -> HTTP {e.code}: {body[:600]}")


def detect_host():
    """Return the Graph host that accepts this token, after checking it belongs to the configured account."""
    errors = []
    for host in ("https://graph.facebook.com", "https://graph.instagram.com"):
        try:
            if host.endswith("instagram.com"):
                me = http("GET", f"{host}/{VER}/me", {"fields": "user_id,username"})
            else:
                me = http("GET", f"{host}/{VER}/{CFG['ig_user_id']}", {"fields": "id,username"})
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
            continue
        user = (me.get("username") or "").lower()
        if user != CFG["ig_username"].lower():
            raise SystemExit(f"SAFETY STOP: token belongs to @{user or '?'} but this pipeline only posts to @{CFG['ig_username']}")
        log(f"token ok for @{user} via {host}")
        return host
    raise SystemExit("token check failed on both hosts:\n" + "\n".join(errors))


def pick_item(qdir, mode, only=None, failures=None):
    failures = failures or {}
    items = sorted(p for p in qdir.iterdir() if p.is_dir()) if qdir.exists() else []
    now = dt.datetime.now(dt.timezone.utc)
    for p in items:
        if only and p.name != only:
            continue
        if failures.get(p.name, 0) >= 3 and not only:
            log(f"skip {p.name}: failed {failures[p.name]} times")
            continue
        meta = json.loads((p / "meta.json").read_text()) if (p / "meta.json").exists() else {}
        if mode == "push" and not meta.get("post_now"):
            continue
        nb = meta.get("not_before")
        if nb and mode == "schedule" and dt.datetime.fromisoformat(nb.replace("Z", "+00:00")) > now:
            continue
        if not ((p / "video.mp4").exists() or (p / "spec.json").exists()):
            log(f"skip {p.name}: no video.mp4 or spec.json")
            continue
        return p, meta
    return None, None


def build_caption(meta):
    cap = (meta.get("caption") or "").strip()
    tags = " ".join("#" + t.lstrip("#").replace(" ", "_") for t in meta.get("hashtags") or [])
    return (cap + ("\n\n" + tags if tags else "")).strip()[:2200]


def publish(host, video, caption, public_url):
    uid = CFG["ig_user_id"]
    size = video.stat().st_size
    container = None
    try:  # 1) resumable upload of the local file (Facebook-login style tokens)
        c = http("POST", f"{host}/{VER}/{uid}/media", {"media_type": "REELS", "upload_type": "resumable", "caption": caption, "share_to_feed": "true"})
        container = c["id"]
        up = http("POST", f"https://rupload.facebook.com/ig-api-upload/{VER}/{container}", data=video.read_bytes(),
                  headers={"Authorization": f"OAuth {TOKEN}", "offset": "0", "file_size": str(size)}, timeout=600)
        log("uploaded:", up)
    except Exception as e:  # noqa: BLE001
        log("resumable upload failed, falling back to video_url:", e)
        container = http("POST", f"{host}/{VER}/{uid}/media", {"media_type": "REELS", "video_url": public_url, "caption": caption, "share_to_feed": "true"})["id"]
    for _ in range(90):  # wait for Instagram to process (up to ~15 min)
        st = http("GET", f"{host}/{VER}/{container}", {"fields": "status_code,status"})
        log("status:", st.get("status_code"), st.get("status", ""))
        if st.get("status_code") == "FINISHED":
            break
        if st.get("status_code") in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"processing failed: {st}")
        time.sleep(10)
    else:
        raise RuntimeError("processing timed out")
    media_id = http("POST", f"{host}/{VER}/{uid}/media_publish", {"creation_id": container})["id"]
    try:
        link = http("GET", f"{host}/{VER}/{media_id}", {"fields": "permalink"}).get("permalink")
    except Exception:  # noqa: BLE001
        link = None
    return media_id, link


def publish_facebook(video, caption):
    """Post the same video as a Reel on the Facebook Page (optional; needs FB_ACCESS_TOKEN + fb_page_id)."""
    pid = CFG.get("fb_page_id")
    if not (FB_TOKEN and pid):
        return None
    host = "https://graph.facebook.com"
    page = http("GET", f"{host}/{VER}/{pid}", {"fields": "id,name,access_token", "access_token": FB_TOKEN})
    if str(page.get("id")) != str(pid):
        raise RuntimeError(f"SAFETY STOP: token does not reach page {pid}")
    want = (CFG.get("fb_page_name") or "").strip().lower()
    if want and (page.get("name") or "").strip().lower() != want:
        raise RuntimeError(f"SAFETY STOP: page is '{page.get('name')}', expected '{CFG.get('fb_page_name')}'")
    ptok = page.get("access_token") or FB_TOKEN
    start = http("POST", f"{host}/{VER}/{pid}/video_reels", {"upload_phase": "start", "access_token": ptok})
    vid = start["video_id"]
    http("POST", f"https://rupload.facebook.com/video-upload/{VER}/{vid}", data=video.read_bytes(),
         headers={"Authorization": f"OAuth {ptok}", "offset": "0", "file_size": str(video.stat().st_size)}, timeout=600)
    http("POST", f"{host}/{VER}/{pid}/video_reels", {"upload_phase": "finish", "video_id": vid, "video_state": "PUBLISHED", "description": caption, "access_token": ptok})
    for _ in range(60):
        st = http("GET", f"{host}/{VER}/{vid}", {"fields": "status,permalink_url", "access_token": ptok})
        vs = (st.get("status") or {}).get("video_status")
        log("facebook status:", vs)
        if vs in ("ready", "published") or ((st.get("status") or {}).get("publishing_phase") or {}).get("status") == "complete":
            link = st.get("permalink_url")
            return {"video_id": vid, "permalink": ("https://www.facebook.com" + link) if link and link.startswith("/") else link}
        if vs == "error":
            raise RuntimeError(f"facebook processing failed: {st}")
        time.sleep(10)
    return {"video_id": vid, "permalink": None, "note": "still processing"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--queue", required=True)
    ap.add_argument("--posted", required=True)
    ap.add_argument("--mode", choices=["schedule", "push", "manual"], default="schedule")
    ap.add_argument("--only", default=None, type=lambda v: v or None)
    ap.add_argument("--result", default="result.json")
    ap.add_argument("--failures", default=None)
    a = ap.parse_args()
    res = {"time": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "mode": a.mode, "ok": False}
    try:
        if not TOKEN:
            raise SystemExit("IG_ACCESS_TOKEN secret is missing")
        fails = json.loads(pathlib.Path(a.failures).read_text()) if a.failures and pathlib.Path(a.failures).exists() else {}
        item, meta = pick_item(pathlib.Path(a.queue), a.mode, a.only, fails)
        if not item:
            res.update(ok=True, note="nothing to post")
            log("nothing to post")
            return
        res["item"] = item.name
        video = item / "video.mp4"
        if not video.exists():
            log("rendering spec with the gouache engine...")
            subprocess.run(["node", str(ROOT / "engine" / "render.js"), str(item / "spec.json"), str(video)], check=True)
        plats = meta.get("platforms") or ["instagram", "facebook"]
        media_id = link = None
        if "instagram" in plats:
            host = detect_host()
            public_url = f"https://raw.githubusercontent.com/{CFG['repo']}/{CFG['queue_branch']}/queue/{item.name}/video.mp4"
            media_id, link = publish(host, video, build_caption(meta), public_url)
        res.update(ok=True, media_id=media_id, permalink=link)
        fb = None
        if "facebook" in plats:
            try:
                fb = publish_facebook(video, build_caption(meta))
                if fb:
                    log(f"FACEBOOK {item.name}: {fb.get('permalink') or fb.get('video_id')}")
            except Exception as e:  # noqa: BLE001  (Instagram already posted: record, don't fail the item)
                fb = {"error": str(e)[:500]}
                log("facebook failed:", e)
                if "instagram" not in plats:
                    raise
        res["facebook"] = fb
        out = pathlib.Path(a.posted) / f"{item.name}.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps({**meta, "posted_at": res["time"], "media_id": media_id, "permalink": link, "facebook": fb}, ensure_ascii=False, indent=2))
        res["remove"] = item.name
        log(f"POSTED {item.name}: {link or media_id}")
    except SystemExit as e:
        res["error"] = str(e)
        raise
    except Exception as e:  # noqa: BLE001
        res["error"] = str(e)
        raise
    finally:
        pathlib.Path(a.result).write_text(json.dumps(res, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
