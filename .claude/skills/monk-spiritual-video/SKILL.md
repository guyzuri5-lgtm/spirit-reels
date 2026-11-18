---
name: monk-spiritual-video
description: Make a spiritual explainer reel (1080×1920, English, ~45–60s) presented by THE MONK. He is a chubby, bald, laughing Buddhist monk in a saffron robe with the right shoulder bare (face after the laughing-Budai porcelain ref), code-drawn in Savta Rivka's paper/halftone language. Topics are breath and breathing exercises, energy, chakras, meditation, mindfulness, calm and similar. The engine and rules are the same as cyber-explainer-video (word-by-word captions, wiggle, no shot over 1.5s, storyboard → silent → voice → render); only the presenter, the topics and the prop kit change. Use whenever Guy (or Eitan) asks for a video with the monk / "הנזיר" / "סרטון של הנזיר", or a spiritual / breathing / נשימה / צ'אקרות / אנרגיות / מדיטציה / רוחני reel in this look, or notes on one. Cyber stories with the grandma go to cyber-explainer-video. Talk to Guy in Hebrew.
---

# Spiritual explainer with the monk

Talk to Guy in Hebrew, masculine form. That covers every message, update and the wrap-up box. On-screen text and narration are in **English**.

**This is a twin of `cyber-explainer-video`** (Guy, 2026-11-18). The look, motion rules, engine and order of work are identical. Three things change:
1. **The presenter** is the monk instead of Savta Rivka.
2. **The topics** are spiritual (breath, energy, chakras, meditation), not cyber.
3. **The props** are a spiritual kit instead of bots and buildings.

The motion background is in `reference/animation-plan.md` here. (The cyber skill and its reference film live in creatora and are deliberately not copied into this repo.)

## Running in the Claude app chat (claude.ai), not Claude Code
In the regular chat there is no access to Guy's Mac or the engine repo. Work in the code sandbox instead:
1. **Set up the project.** Copy this skill's `kit/` to a work folder (e.g. `/tmp/<slug>/`). The skill's files are readable where the skill is installed.
2. **Check the tools:** `node -v`, `ffmpeg -version`, `npx --yes hyperframes@0.9.59 --version`.
   - HyperFrames needs a headless Chrome. If `snapshot`/`render` fails for a missing browser, try `npx --yes puppeteer browsers install chrome-headless-shell` (or the system's chromium) once.
   - **If rendering can't work in the sandbox**, still run `node build/gen.mjs`. Hand Guy the project as a zip (compositions + index.html), and tell him it renders as-is in Claude Code with this same skill.
3. **Narration** needs the ElevenLabs connector. If it isn't connected, make the silent cut and say so. All other rules are unchanged: show the voice before spending credits, and Hebrew uses `eleven_v3`.
4. **Deliver every result as a downloadable file:** stills, storyboard jpg, preview mp4, and the project zip.
5. **Updates in a later chat:** ask Guy to attach the project zip from last time, unzip it, and continue from its `build/gen.mjs`. The sandbox is wiped between chats.

## 0. What's in this skill

| Path | What it is |
|---|---|
| `kit/build/gen.mjs` | The film generator and source of truth. It writes `compositions/sNN.html`, `index.html`, `STORYBOARD.md` and `build/frames.json`. It ships a **4-scene, 12s demo** (breath → 4-7-8 → chakras → root-to-crown) as a worked example; replace those scenes. |
| `kit/build/monk-lib.js` | **The monk.** `MONK(o,x,y,w)` is the bust presenter (in gen.mjs `RIVKA` = `MONK`, so every presenter call draws him). `MONKFULL(o,x,y,w)` is the full body: `kind:'stand'` or `'sit'`. **Approved design (2026-11-18). Never redraw him.** |
| `kit/build/rivka-lib-v2.js` | The shared drawing kit (hands, textures, ink outline, halftone shadow, head rig). monk-lib needs it loaded first. Don't delete it. |
| `kit/assets/…`, `package.json`, `hyperframes.json` | Fonts, grain, HyperFrames skeleton (pinned 0.9.59). |
| `reference/monk/` | His approved sheets (`monk-sheet.jpg`, `monk-full.jpg`), the demo frames (`demo-scenes.jpg`), and the scripts that drew the sheets. |
| `reference/animation-plan.md` | Why the motion is the way it is (frame analysis of Guy's reference reels, v4–v6 rules). |

## 1. The monk
- **Locked look:**
  - Head: pear-shaped and bald, with shine and stubble. Long earlobes.
  - Face: apple cheeks, crescent laughing eyes, and a wide grin with teeth.
  - Robe: saffron (`#e8892b`) over his left shoulder, with the right shoulder and arm bare.
  - Accessories: wooden mala beads, and a wood bracelet on the bare wrist.
  - Full body: a big round belly, a sash and sandals.
  - Same textures as Rivka: ink outline, halftone shadow, halftone glow and grain.
- **Bust poses** (`rv` in a scene):
  - calm: palms together, eyes closed
  - beads: counting the mala, eyes closed
  - explain
  - point
  - laugh
  - thumb
  - shock
  - worry
  - phone, laptop: only when the topic is screens or digital life
  - Aliases from the old engine: `crossed` = palms together with a skeptic look, `mug` = beads.
- **His character:** warm, funny and calm, like the laughing Budai. Mostly calm / beads / laugh / explain; shock and worry only for the "problem" beats (stress, a racing mind, shallow breathing).
- **Glow behind his head:** gold by default (calm, energy), green when it's good, red for shock or worry.
- **He is fixed at the bottom** for the whole film, exactly as Rivka was. For a full-body moment (an intro, a demonstration of a posture, the chakras on a body), put `miniMonk(x, y, w, 'meditate'|'sit'|'pray'|'stand'|'wave'|'belly')` **on the stage**. The demo's s03 does this.

## 2. The spirit kit (in gen.mjs, after the props kit)

| Prop | What it draws | Animate with |
|---|---|---|
| `breathOrb(x,y,r)` | Gold core in a dashed ring with a halftone field: the breath | `BREATHE(s,'orb-d',t,dur,from,to)` swell on the inhale, shrink on the exhale; `PULSE` on a hold |
| `lungs(x,y,k)` | Pink lungs with an ink outline | `IN … 'pop'`, then `BREATHE` |
| `chakraIcon(x,y,r,i)` | The chakra wheel `i`, from 0 = root to 6 = crown. Each has its own petal count and colour from `CHAKRAS`. | pop one after another, `RINGS` |
| `CHAKRAS` | `[name, colour, petals]` for all 7. The colours are allowed **only** for chakra content. | |
| `miniMonk(x,y,w,pose)` | The full-body monk as a stage prop. The chakra points on his body are in the demo s03: seat 334, belly 313, solar 291, chest 269, neck 247, brow 216, crown 168 (for `miniMonk(116,140,168)`). | `IN … 'up'` |
| `lotus(x,y,k)` | A lotus on a green pad | `IN … 'up'`, with `rays` |
| `rays(x,y,r0,r1,n,c)` | Energy rays | `IN … 'fade'` |
| `bowl(x,y,k)` + `waves(id,x,y)` | Singing bowl on a cushion, and sound arcs | `DRAW` each `wv0..2` |
| `candle(x,y,k)` | Candle with a flame; the flame wiggles | |
| `headProfile` + `busyMind` / `calmMind` | A head in profile, with a red scribble inside (racing mind) or a green wave (calm) | `JITTER` the scribble, swap it for the wave |

Also use the whole base kit: card, chip, stamp, tile (number tiles for counts such as 4-7-8), tape, check, cross, bubble, ring, htField, tileField, rosette. Plus all the motion verbs: IN, MOVE, TOO, OUT, DRAW, COUNT, TICK, PULSE, BUMP/BUMPD, RINGS, SPARK, CAMTO, CAMOUT, SHOT.

A new idea needs a new drawn object in the same style (ink outline, CARD fill, one soft shadow, mono label). Add it to the spirit kit, put its name in `WIGGLY`, and add it to the table above. Examples: a third-eye, a breath-count timer, a nervous-system diagram, a sun, a mountain, a tree.

## 3. Rules
Everything from cyber-explainer-video §2 holds:
- paper look and fonts
- the presenter is fixed and always talking
- **no shot holds longer than 1.5s** (`HOLD sNN` warnings)
- lots of wiggle, something new every 0.3–0.6s
- morphs or carries instead of cuts, halftone wipes between acts
- captions are the narration word by word, at y 124
- everything is drawn in code, with no stock and no AI images
- show Guy any credit spend before making it

What's different here:
1. **Colour = meaning, spiritual version.**
   - ink `#161412` for structure
   - gold `#e8a317` = energy, light, breath
   - green `#16a35f` = calm, balance, the "good" result
   - red `#e5302a` = stress, tension, the problem
   - the 7 chakra colours only for chakras
   - In captions, `*word*` = red serif and `_word_` = green serif. Use red for the problem or the key word, and green for the calm or the answer.
2. **No glitch.** Glitch was the cyber "fake" signal. Show stress or a racing mind with `JITTER`, the red scribble, or a shaking card instead.
3. **Breathing exercises are shown, not just said.** The orb or lungs swell and shrink with the count, a number tile slams on each count, and a running counter ticks. The motion follows the real breath timing in the narration.
4. **Honest framing.**
   - Present chakras, energy and similar ideas as tradition: "in yogic tradition", "many teachers say".
   - Never present them as medical or scientific fact.
   - No health promises ("cures anxiety", "heals").
   - Breathing exercises: use safe, common counts (box 4-4-4-4, 4-7-8, long exhale), and if the film has the viewer hold their breath, add a short "stop if you feel dizzy" line.
   - Real names (a teacher, a tradition, a study) must be checked; say "studies suggest" only with a real study behind it.
5. **Tone.** Warm, light and a bit funny (the laughing monk), never preachy. End on a small practice the viewer can do now, or a question.

## 4. Order of work (each step waits for Guy)
1. **The text.**
   - From Guy's text, usually Hebrew: translate it into short spoken English, about 45–60s, one sentence per scene (1.5–5s each).
   - Keep his points and his order.
   - The project is `videos/<slug>/` **inside the spirit-reels repo** (never in creatora), made with `cp -R .claude/skills/monk-spiritual-video/kit/. videos/<slug>/`. Write a `BRIEF.md` with the script.
2. **Scenes in `build/gen.mjs`.**
   - Replace the demo scenes (from `/* DEMO scenes` to `/* ---------- write files`).
   - Keep `TILE_C`/`CORNER`/`tileFly` if you use the number-tile corner badge.
   - Morphs are per film: add entries to `MORPHS` (the template empties it).
   - `node build/gen.mjs` must end with no `HOLD`.
3. **Storyboard.**
   - Snapshot one still per shot: `npx --yes hyperframes@0.9.59 snapshot --at <t,…> --out boards/stills-v1`, each ≥0.42s before a scene ends.
   - Build the sheet with `build/board-v6.mjs`, export it to jpg with headless Chrome, and send it to Guy.
4. **Silent animation.**
   - Lint: `npx --yes hyperframes@0.9.59 lint` with 0 errors.
   - Render: `npx hyperframes render -o renders/<slug>-silent-v1.mp4 --quiet`, plus a small preview for sending.
   - Motion check: the ffmpeg `tblend` metric (see cyber-explainer-video), aiming for a median ≥ 3.
5. **Narration** (only after Guy approves the silent cut).
   - **The monk has no voice yet.** Rivka's voice (`5u41aNhyCU6hXOcjPPv0`) is NOT his. Before the first narration, list 2–3 candidates with `creative_list_voices` and show Guy without generating anything: warm, older male, calm, slightly playful, unhurried. After he picks one, write its id here: `MONK_VOICE = (not chosen yet)`.
   - Spiritual narration can be a little slower than cyber: try `VO_SPEED` 1.0–1.05 instead of 1.12.
   - Then, the same as the cyber skill:
     - one take → `assets/vo/take.mp3`
     - `ffmpeg -i assets/vo/take.mp3 -filter:a atempo=<VO_SPEED> assets/vo/narration.mp3`
     - `npx hyperframes transcribe assets/vo/take.mp3 --json > assets/vo/take.transcript.json`
     - `node build/gen.mjs`, which fits scenes and captions to the real speech
   - Fix any `vo align failed` or hold > 1.6 with a `CAMTO`.
6. **Sound.** A soft ambient bed (pads, a singing-bowl hit on act changes, breath-like swells), with SFX on pops and slams kept gentle. Duck the music under the voice. Use `/media-use` + `/hyperframes-audio`, and show Guy any paid generation first.
7. **Final render + caption.** Render `renders/<slug>-v1-voice.mp4` and send the preview. After Guy approves, post it through the page's queue: `python3 scripts/enqueue.py videos/<slug>/renders/<slug>-v1-voice.mp4 --caption "..." --tags "breathwork,meditation"` (rules in the repo's CLAUDE.md). Write an English post caption with a hook, the idea, one practice and a question, plus hashtags such as #breathwork #meditation #mindfulness #chakras #spirituality.

## 5. HyperFrames / GSAP gotchas
These are the same as cyber-explainer-video §4:
- **Seek-safe:** `fromTo` + `immediateRender:false`, no `Math.random`, no `repeat:-1`.
- **Camera:** the matrix camera (`CAMTO`).
- **Morph blob:** it lives outside the camera.
- **Grain:** a single PNG layer.
- **Fonts:** bundled woff2 only.
- **Safe zone:** keep text away from the right-side button rail.
- **CAMTO and the presenter:** `CAMTO(s,t,cx,cy,k)` puts `(cx,cy)` at (200,290), so a low `cy` pushes everything down onto the monk. Keep stage content above y≈340 after the zoom; the demo's s03 shows the fix.

## 6. After every change
- Keep the film's own `STORYBOARD.md` current.
- If a rule or a prop changes, update this skill, then commit and push it to spirit-reels only. This copy belongs to @spiritualist_77777 and must never be pushed to creatora or mixed with it.
