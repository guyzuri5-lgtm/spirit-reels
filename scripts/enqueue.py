#!/usr/bin/env python3
"""Add a finished video (or a gouache spec) to the posting queue.

    python3 scripts/enqueue.py VIDEO.mp4 --caption "..." --tags "רוחניות,נשימה" [--now] [--id 2026-11-02-a] [--not-before 2026-11-03T08:00:00Z]
    python3 scripts/enqueue.py SPEC.json --caption "..." ...         (rendered by the publisher before posting)

The queue lives on the `queue` branch: queue/<id>/{video.mp4|spec.json, meta.json}.
Items are posted oldest-first (by id), twice a day. --now posts it right away.
Run from a clone of this repo; uses plain git (the session's GitHub access).
"""
import argparse, datetime as dt, json, pathlib, shutil, subprocess, sys, tempfile, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config.json").read_text())
REMOTE = subprocess.run(["git", "-C", str(ROOT), "remote", "get-url", "origin"], capture_output=True, text=True).stdout.strip() or f"https://github.com/{CFG['repo']}"
MAX_MB = 95


def git(*a, cwd):
    return subprocess.run(["git", *a], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--caption", required=True)
    ap.add_argument("--tags", default="")
    ap.add_argument("--now", action="store_true")
    ap.add_argument("--id", default=None)
    ap.add_argument("--not-before", default=None)
    ap.add_argument("--platforms", default=None, help="comma list, default all: instagram,facebook")
    a = ap.parse_args()
    src = pathlib.Path(a.source)
    if not src.exists():
        sys.exit(f"not found: {src}")
    if src.suffix.lower() == ".mp4":
        mb = src.stat().st_size / 1e6
        if mb > MAX_MB:
            sys.exit(f"video is {mb:.0f}MB; keep it under {MAX_MB}MB (re-encode with a higher CRF)")
        probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name", "-of", "csv=p=0", str(src)], capture_output=True, text=True).stdout.strip()
        print("video:", probe, f"{mb:.1f}MB")
    elif src.suffix.lower() != ".json":
        sys.exit("source must be .mp4 or a .json spec")
    item_id = a.id or dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    meta = {"caption": a.caption, "hashtags": [t.strip() for t in a.tags.split(",") if t.strip()], "post_now": a.now, "added_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")}
    if a.not_before:
        meta["not_before"] = a.not_before
    if a.platforms:
        meta["platforms"] = [p.strip() for p in a.platforms.split(",") if p.strip()]
    for attempt in range(3):
        tmp = pathlib.Path(tempfile.mkdtemp(prefix="queue-"))
        has = subprocess.run(["git", "ls-remote", "--exit-code", "--heads", REMOTE, CFG["queue_branch"]], capture_output=True).returncode == 0
        if has:
            git("clone", "-q", "--depth", "1", "--branch", CFG["queue_branch"], REMOTE, str(tmp / "q"), cwd=tmp)
        else:
            (tmp / "q").mkdir()
            git("init", "-q", "-b", CFG["queue_branch"], cwd=tmp / "q")
            git("remote", "add", "origin", REMOTE, cwd=tmp / "q")
        q = tmp / "q"
        # the queue branch carries a copy of the workflow so pushes to it can trigger "post now"
        wf = q / ".github" / "workflows"
        wf.mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / ".github" / "workflows" / "publish.yml", wf / "publish.yml")
        d = q / "queue" / item_id
        if d.exists():
            sys.exit(f"item {item_id} already queued")
        d.mkdir(parents=True)
        shutil.copy(src, d / ("video.mp4" if src.suffix.lower() == ".mp4" else "spec.json"))
        (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        git("add", "-A", cwd=q)
        git("-c", "user.name=spirit-reels", "-c", "user.email=noreply@anthropic.com", "commit", "-qm", f"queue: add {item_id}" + (" (post now)" if a.now else ""), cwd=q)
        r = subprocess.run(["git", "push", "-q", "origin", f"HEAD:{CFG['queue_branch']}"], cwd=q, capture_output=True, text=True)
        shutil.rmtree(tmp, ignore_errors=True)
        if r.returncode == 0:
            print(f"queued {item_id}" + (" — posting now" if a.now else " — will post at the next slot"))
            return
        print("push failed, retrying:", r.stderr.strip()[:300])
        time.sleep(5)
    sys.exit("could not push to the queue branch")


if __name__ == "__main__":
    main()
