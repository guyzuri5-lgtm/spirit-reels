# spirit-reels

Fully automatic posting of short animated videos to the Instagram account **@spiritualist_77777**.
This repo is the *technical pipeline only*. How the videos look and what they say is decided elsewhere.

## How it works
1. A finished video is added to the queue (the `queue` branch) with `scripts/enqueue.py`.
2. GitHub Actions (`.github/workflows/publish.yml`) posts the oldest queued video **twice a day**
   (08:00 and 17:00 UTC), or immediately when an item is queued with `--now`.
3. Before every post it checks the token belongs to @spiritualist_77777 and stops otherwise.
4. Each post is logged in `posted/<id>.json` (with its permalink) and the run in `status/last_run.json`
   and `status/history.jsonl` on `main`. A failing item is retried; after 3 failures it is skipped.

## Adding a video (for any Claude session that makes videos)
```
python3 scripts/enqueue.py path/to/video.mp4 --caption "כיתוב לפוסט" --tags "רוחניות,נשימה,מודעות"
python3 scripts/enqueue.py path/to/video.mp4 --caption "..." --now        # post right away
python3 scripts/enqueue.py samples/breath.json --caption "..."            # a gouache-engine spec, rendered in CI
```
Video requirements: vertical 9:16 (1080x1920), H.264 video + AAC audio, 3–90 seconds, under 95 MB
(`ffmpeg ... -c:v libx264 -crf 23 -pix_fmt yuv420p -c:a aac -movflags +faststart`).
Caption up to ~2,000 characters; hashtags without the `#`.

## Checking what happened
`git fetch origin main && git show origin/main:status/last_run.json` — last run, ok/error, permalink, log tail.
`posted/` — everything that went up. The queue: `git ls-tree -r --name-only origin/queue`.

## Rules
- Never change `ig_username` / `ig_user_id` in `config.json` to another account.
- The Instagram token is the `IG_ACCESS_TOKEN` Actions secret (a never-expiring system-user token). Never print or commit it.
- Do not commit videos to `main`; the queue branch is compacted after each post so the repo stays small.

## Optional: gouache poster engine
`engine/` renders a JSON spec into a reel in the "gouache travel poster" style (see `samples/*.json`):
`node engine/render.js spec.json out.mp4` (`--check`, `--preview out.png`). Needs playwright + ffmpeg.
