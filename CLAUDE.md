# spirit-reels

Fully automatic posting of short animated videos to the Instagram account **@master__spirit**.
This repo is the *technical pipeline only*. How the videos look and what they say is decided elsewhere.

## How it works
1. A finished video is added to the queue (the `queue` branch) with `scripts/enqueue.py`.
2. GitHub Actions (`.github/workflows/publish.yml`) posts the oldest queued video **twice a day**
   (08:00 and 17:00 UTC), or immediately when an item is queued with `--now`.
3. Before every post it checks the token belongs to @master__spirit and stops otherwise.
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
- The page was renamed by Guy on 2026-11-19 from @spiritualist_77777 to **@master__spirit** (same account, `ig_user_id` unchanged).
- Never change `ig_username` / `ig_user_id` in `config.json` to another account.
- The Instagram token is the `IG_ACCESS_TOKEN` Actions secret (a never-expiring system-user token). Never print or commit it.
- Do not commit videos to `main`; the queue branch is compacted after each post so the repo stays small.

## Video styles and skills
- **riso** (`riso/`, spec in `docs/house-style.md`): the current fully automatic line. Hebrew, Gemini voice "Orus",
  specs pushed to `riso/specs/` are produced and queued by `riso-produce.yml`.
- **The monk** (`.claude/skills/monk-spiritual-video/`): HyperFrames explainer reels (Hebrew, RTL captions, ElevenLabs voice "The Monk (Hebrew)") with a
  code-drawn laughing monk. Projects go in `videos/<slug>/`; each step waits for Guy's approval, then the final mp4 is
  queued with `scripts/enqueue.py`. Use this skill whenever Guy asks for a monk video / "הנזיר".
- Talk to Guy in Hebrew, masculine form.

## Separation (important)
- This page (@master__spirit) must never mix with Guy's main Instagram page or with the creatora project.
  The monk skill and engine here are a separate copy; never push to creatora's remotes or copy creatora's
  characters/films in.
- The style library (86 AI Style Atlas styles) lives in the Claude Project "עמוד אינסטגרם ספירטואליטי 7777"
  (`style-library-1.md`, `style-library-2.md`); use a style from it only when Guy asks for one.

## Optional: gouache poster engine
`engine/` renders a JSON spec into a reel in the "gouache travel poster" style (see `samples/*.json`):
`node engine/render.js spec.json out.mp4` (`--check`, `--preview out.png`). Needs playwright + ffmpeg.
