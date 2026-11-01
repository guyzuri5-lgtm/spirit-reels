#!/usr/bin/env python3
"""Produce every pending spec in riso/specs/ (oldest id first) and add the videos to the posting queue.

Runs in GitHub Actions (riso-produce workflow). A spec is pending until riso/done/<id>.json exists.
- Gemini quota exhausted -> stop; the next scheduled run retries.
- Any other failure -> counted in riso/done/<id>.fail; after 3 failures the spec is skipped.
"""
import json, pathlib, subprocess, sys, datetime as dt

HERE = pathlib.Path(__file__).resolve().parent
SPECS, DONE = HERE / "specs", HERE / "done"
MAX_PER_RUN = 2


def queued_ids():
    """ids already waiting in the posting queue (so a spec is never produced twice)"""
    r = subprocess.run(["git", "ls-remote", "--heads", "origin", "queue"], capture_output=True, text=True, cwd=HERE.parent)
    if not r.stdout.strip():
        return set()
    subprocess.run(["git", "fetch", "-q", "--depth", "1", "origin", "queue"], cwd=HERE.parent)
    t = subprocess.run(["git", "ls-tree", "--name-only", "FETCH_HEAD", "queue/"], capture_output=True, text=True, cwd=HERE.parent).stdout
    return {l.split("/", 1)[1] for l in t.split() if "/" in l}


def main():
    DONE.mkdir(exist_ok=True)
    subprocess.run(["git", "pull", "-q", "--rebase", "origin", "main"], cwd=HERE.parent)   # see what other runs finished
    inq = queued_ids()
    pending = []
    for p in sorted(SPECS.glob("*.json")):
        sid = json.loads(p.read_text())["id"]
        fail = DONE / f"{sid}.fail"
        if (DONE / f"{sid}.json").exists() or (fail.exists() and int(fail.read_text() or 0) >= 3):
            continue
        if sid in inq:   # produced by an overlapping run but not recorded yet
            print(f"{sid} is already in the posting queue - marking done"); (DONE / f"{sid}.json").write_text(json.dumps({"id": sid, "note": "found in queue"}))
            fail.unlink(missing_ok=True); continue
        pending.append((sid, p))
    print("pending:", [s for s, _ in pending], flush=True)
    made = 0
    for sid, p in pending[:MAX_PER_RUN]:
        r = subprocess.run([sys.executable, str(HERE / "build.py"), str(p), "--enqueue"])
        if r.returncode == 3:
            print("quota exhausted - stopping, will retry on the next run"); break
        if r.returncode != 0:
            fail = DONE / f"{sid}.fail"
            n = int(fail.read_text() or 0) + 1 if fail.exists() else 1
            fail.write_text(str(n)); print(f"FAILED {sid} (attempt {n})"); continue
        data = json.loads((HERE / "out" / sid / "data.json").read_text())
        # keep the raw voice + timing next to the record, so sync can be checked or re-timed later
        if not (DONE / f"{sid}.vo.ogg").exists():
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(HERE / "out" / sid / "vo_raw.wav"), "-c:a", "libopus", "-b:a", "64k", str(DONE / f"{sid}.vo.ogg")])
        (DONE / f"{sid}.data.json").write_text(json.dumps(data, ensure_ascii=False))
        (DONE / f"{sid}.json").write_text(json.dumps({"id": sid, "queued_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                                                       "duration": data["duration"], "beats": len(data["beats"]), "timing": data["timing_method"]}, ensure_ascii=False, indent=1))
        (DONE / f"{sid}.fail").unlink(missing_ok=True)
        made += 1
    print(f"produced {made} video(s)")
    if any((DONE / f"{s}.fail").exists() and int((DONE / f"{s}.fail").read_text()) >= 1 for s, _ in pending[:MAX_PER_RUN]) and made == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
