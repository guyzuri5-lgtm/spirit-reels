---
name: monk-spiritual-video
description: Make a spiritual explainer reel (1080×1920, Hebrew, ~45–60s) presented by THE MONK. He is a chubby, bald, laughing Buddhist monk in a saffron robe with the right shoulder bare (face after the laughing-Budai porcelain ref), code-drawn in a paper / ink / halftone language. Topics are breath and breathing exercises, energy, chakras, meditation, mindfulness, calm and similar. Word-by-word Hebrew captions, constant motion, no shot over 1.5s, and a fixed order of work (storyboard → silent → voice → render). Use whenever Guy (or Eitan) asks for a video with the monk / "הנזיר" / "סרטון של הנזיר", or a spiritual / breathing / נשימה / צ'אקרות / אנרגיות / מדיטציה / רוחני reel in this look, or notes on one. Talk to Guy in Hebrew.
---

# Spiritual explainer with the monk

Talk to Guy in Hebrew, masculine form. That covers every message, update and the wrap-up box. On-screen text, captions and narration are in **Hebrew** (since 2026-11-18; the first Hebrew film is `videos/seven-gates`). Captions run right to left in Rubik.

This skill belongs to the spirituality page @spiritualist_77777 only. It stands on its own: the presenter is the monk, the topics are spiritual, and every prop is drawn for them. The motion rules (and why they are the way they are) are in `reference/animation-plan.md`.

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
| `kit/build/monk-lib.js` | **The monk.** `MONK(o,x,y,w)` is the bust presenter (in gen.mjs `PRESENTER` = `MONK`). `MONKFULL(o,x,y,w)` is the full body: `kind:'stand'` or `'sit'`. **Approved design (2026-11-18). Never redraw him.** |
| `kit/build/ink-lib.js` | The shared drawing parts the monk is built from (hands, arms, eyes / brows / mouth, head rig, ink outline, halftone shadow and glow textures). monk-lib needs it loaded first. Don't delete it. |
| `kit/build/board.mjs` | Builds the storyboard sheet from one still per shot. |
| `kit/assets/…`, `package.json`, `hyperframes.json` | Fonts, grain, HyperFrames skeleton (pinned 0.9.59). |
| `reference/monk/` | His approved sheets (`monk-sheet.jpg`, `monk-full.jpg`), the demo frames (`demo-scenes.jpg`), and the scripts that drew the sheets. |
| `reference/animation-plan.md` | The motion language: frame analysis of Guy's reference reels, the micro-motion layer, morphs, the head rig and the no-frozen-frame rule. |

## 1. The monk
- **Locked look:**
  - Head: pear-shaped and bald, with shine and stubble. Long earlobes.
  - Face: apple cheeks, crescent laughing eyes, and a wide grin with teeth.
  - Robe: saffron (`#e8892b`) over his left shoulder, with the right shoulder and arm bare.
  - Accessories: wooden mala beads, and a wood bracelet on the bare wrist.
  - Full body: a big round belly, a sash and sandals.
  - Textures: ink outline, halftone shadow, halftone glow and grain.
- **Bust poses** (`poses` in a scene, e.g. `poses: [[0, ['explain', 'laugh']], [1.4, ['calm']]]`):
  - calm: palms together, eyes closed
  - beads: counting the mala, eyes closed
  - explain
  - point
  - laugh
  - thumb
  - shock
  - worry
  - celebrate: both arms up (the payoff, "it worked")
  - excited: hands on his head ("wow")
  - cover: hands over his eyes; peek: one hand down, one eye peeking (before a reveal)
  - chin: fist on his chin, eyes up (thinking, a question)
  - relax: hands behind his head, eyes closed (let it go, the calm after)
  - crossed: palms together with a skeptic look
- **His character:** warm, funny and calm, like the laughing Budai. Mostly calm / beads / laugh / explain; shock and worry only for the "problem" beats (stress, a racing mind, shallow breathing).
- **Glow behind his head:** gold by default (calm, energy), green when it's good, red for shock or worry.
- **He is fixed at the bottom** for the whole film, in the same place in every scene. For a full-body moment (an intro, a demonstration of a posture, the chakras on a body), put `miniMonk(x, y, w, 'meditate'|'sit'|'pray'|'stand'|'wave'|'belly')` **on the stage**. The demo's s03 does this.

## 2. The spirit kit (in gen.mjs, after the props kit)

| Prop | What it draws | Animate with |
|---|---|---|
| `breathOrb(x,y,r)` | Gold core in a dashed ring with a halftone field: the breath | `BREATHE(s,'orb-d',t,dur,from,to)` swell on the inhale, shrink on the exhale; `PULSE` on a hold |
| `lungs(x,y,k)` | Pink lungs with an ink outline | `IN … 'pop'`, then `BREATHE` |
| `chakraIcon(x,y,r,i)` | The chakra wheel `i`, from 0 = root to 6 = crown. Each has its own petal count and colour from `CHAKRAS`. | pop one after another, `RINGS` |
| `CHAKRAS` | `[name, colour, petals]` for all 7. The colours are allowed **only** for chakra content. | |
| `miniMonk(x,y,w,pose)` | The full-body monk as a stage prop. The chakra points on his spine, for `miniMonk(116,140,168)`: root 332, sacral 306, solar plexus 284, heart 261, throat 238, third eye 194, crown 166 (checked in seven-gates). | `IN … 'up'` |
| `lotus(x,y,k)` | A lotus on a green pad | `IN … 'up'`, with `rays` |
| `rays(x,y,r0,r1,n,c)` | Energy rays | `IN … 'fade'` |
| `bowl(x,y,k)` + `waves(id,x,y)` | Singing bowl on a cushion, and sound arcs | `DRAW` each `wv0..2` |
| `candle(x,y,k)` | Candle with a flame; the flame wiggles | |
| `headProfile` + `busyMind` / `calmMind` | A head in profile, with a red scribble inside (racing mind) or a green wave (calm) | `JITTER` the scribble, swap it for the wave |

Also use the whole base kit: card, chip, `hchip` (Hebrew label pill), stamp, tile (number tiles for counts such as 4-7-8), tape, check, cross, bubble, ring, htField, tileField, rosette. Plus all the motion verbs: IN, MOVE, TOO, OUT, DRAW, COUNT, TICK, PULSE, BUMP/BUMPD, RINGS, SPARK, CAMTO, CAMOUT, SHOT.

A new idea needs a new drawn object in the same style (ink outline, CARD fill, one soft shadow, mono label). Add it to the spirit kit, put its name in `WIGGLY`, and add it to the table above. Examples: a third-eye, a breath-count timer, a nervous-system diagram, a sun, a mountain, a tree.

### v7 motion kit (2026-11-18, from the frame analysis of Guy's "5 steps" reference reel)
These give each scene the reference's constant small activity. Reach for them every scene.

| Verb | What it does | Use for |
|---|---|---|
| `rollNum(s,n,x,y,v0,{size,cols,sep,dec,suffix})` + `ROLL(s,n,t,from,to,d,ease)` | An odometer number: the digits roll up with carries and leading zeros hide. `dec:1` + `183` → 18.3; `suffix:'K'`. Right edge at x. | breaths, minutes, days in a row, followers |
| `BURST(s,t,x,y,{n,kind})` | Particles burst out, arc up and fall | the payoff: confetti, hearts, sparks |
| `RISE(s,t0,t1,x,y,{kind})` | A stream floating up and swaying | hearts, light motes, bubbles all through a beat |
| `FALL(s,t,x,y,{n,kind})` | Drops from above and bounces on a line | coins, petals, leaves |
| `ABSORB(s,t,x,y,{n,kind,R,target})` | Particles fly in from a ring and vanish into a point; `target` pulses when they arrive | light gathering into a chakra or the breath orb |
| `LAND(s,n,t,{dust,shadow})` + `landShadow()` | Falls with a tilt, squashes on impact, springs back | any object arriving; better than `drop` |
| `PRESS(s,n,t,{x,y,swap})` + `keycap(x,y,txt)` | Pushed down + red ripple; `swap` = a pressed version shown from then on | a gong, a "start" key, a bell |
| `typeLine(s,n,x,y,text)` + `TYPE(s,n,t,{cps,from,to})` | Typed letter by letter with a caret that follows and then blinks (Hebrew by default) | an intention, a mantra, a search |
| `FROMWORD(s,n,t,word,svg,tx,ty)` | The object is born out of a caption word (a red underline flashes under it) and flies to its place; pass `t = null` to start right after the word appears | the key word becomes the thing |
| `reach(x,y,w,ang)` | The monk's bare arm reaching in from the bottom edge, fingertip at (x,y) | with `IN … 'up'` + `PRESS`: he touches the stage |

| `HOP(s,n,t,[[dx,dy],…],{at,flip,h})` | A stage figure (e.g. `miniMonk`) jumps along points with a dotted trail, lands with a squash; `flip:[i]` = a somersault on hop i | climbing chakras, steps, days |
| `mountain(x,y,w,h,{flag})` + `ghost(s,n,mountainPath(…))` + `COLLAPSE(s,n,t,{at,dust})` + `GHOST(s,n,t)` | A black peak is crushed flat with a red shock line; its dashed outline stays behind | "what looked hard" / the thoughts that were there |
| `stepper(s,n,x,y,labels)` + `STEP(s,n,t,i)` | Dots joined by a dashed line (right → left); step i fills red and pulses, the one before turns into a green check | inhale → hold → exhale, any short sequence |
| `checklist(s,n,x,y,items)` + `CHECK(s,n,t,i,{ok})` | Rows with spinning loaders; each turns into a check (or a red cross) and a grey bar moves down | body scan, a practice checklist |
| `barGraph(s,n,x,y,w,h,vals,{weak})` + `GROW` / `SCAN` / `FIXBARS` | Bars rise; a magnifier slides along (bars magnified inside), turns red over the weak bars; then they grow back with red dots on top | a breath / heart / stress graph that evens out |
| `calendar(s,n,x,y,[[big,small],…],{head})` + `TEAR(s,n,t,i)` | A tear-off pad; each page rips away to the next | 21 days of practice, "tomorrow again" |
| `scales(s,n,x,y,{arm,left,right})` + `TIP(s,n,t,deg)` | A balance whose beam and pans tip and wobble (positive = right side down) | balance, this vs. that |
| `MONKPOP(s,t,k)` / `MONKZOOM(s,t0,t1,k)` | The presenter grows for a beat / holds bigger, then settles | the payoff line, a punchline |

Wrap these props with `s.W(n, …)` when you want `IN` and wiggle on them. All the verbs can be called before their prop is drawn in `props`.
Particle kinds: `confetti`, `heart`, `dot`, `light`, `leaf`, `petal`, `coin`, `star`, `spark`.
**Seek rule:** HyperFrames seeks with callbacks turned off, so never use `onUpdate`/`onComplete`; these verbs bake every frame into `tl.set`/`fromTo` at build time. `ROLL` and `TYPE` may be called before their `rollNum`/`typeLine` is drawn in `props`: they run after it.

## 3. Rules
The base rules:
- paper look and fonts
- the presenter is fixed and always talking
- **lip sync (2026-11-18):** when `assets/vo/narration.mp3` exists, gen.mjs drives the monk's mouth from the voice's loudness (needs ffmpeg), not from the caption words: open on sound, shut in the pauses, no blink while he speaks. Smile / smirk poses open with the `talk` mouth. Don't go back to word-timed flapping: Guy saw the mouth shut under the captions
- **no shot holds longer than 1.5s** (`HOLD sNN` warnings)
- lots of wiggle, something new every 0.3–0.6s
- morphs or carries instead of cuts, halftone wipes between acts
- captions are the narration word by word, at y 124
- everything is drawn in code, with no stock and no AI images
- show Guy any credit spend before making it

On top of those:
1. **Colour = meaning.**
   - ink `#161412` for structure
   - gold `#e8a317` = energy, light, breath
   - green `#16a35f` = calm, balance, the "good" result
   - red `#e5302a` = stress, tension, the problem
   - the 7 chakra colours only for chakras
   - In captions, `*word*` = red bold (Rubik 900) and `_word_` = green bold. Use red for the problem or the key word, and green for the calm or the answer.
2. **No glitch effects.** Show stress or a racing mind with `JITTER`, the red scribble, or a shaking card.
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
   - From Guy's text: turn it into short, spoken, everyday Hebrew (not written-formal), about 45–60s, one sentence per scene (1.5–5s each). Write the narration without niqqud, but spell out any word the voice might misread.
   - Keep his points and his order.
   - The project is `videos/<slug>/` **inside the spirit-reels repo** (never in creatora), made with `cp -R .claude/skills/monk-spiritual-video/kit/. videos/<slug>/`. Write a `BRIEF.md` with the script.
2. **Scenes in `build/gen.mjs`.**
   - Replace the demo scenes (from `/* DEMO scenes` to `/* ---------- write files`).
   - Keep `TILE_C`/`CORNER`/`tileFly` if you use the number-tile corner badge.
   - Morphs are per film: add entries to `MORPHS` (the template empties it).
   - `node build/gen.mjs` must end with no `HOLD`.
3. **Storyboard.**
   - Snapshot one still per shot: `npx --yes hyperframes@0.9.59 snapshot --at <t,…> --out boards/stills-v1`, each ≥0.42s before a scene ends.
   - Build the sheet with `node build/board.mjs boards/shots-v1.json boards/stills-v1 "<title>"`, export it to jpg with headless Chrome, and send it to Guy.
   - Check that no illustration, glow or zoom crosses up into the caption area: the stage is clipped under the captions, so anything above the line looks cut off.
4. **Silent animation.**
   - Lint: `npx --yes hyperframes@0.9.59 lint` with 0 errors.
   - Render: `npx hyperframes render -o renders/<slug>-silent-v1.mp4 --quiet`, plus a small preview for sending.
   - Motion check: the ffmpeg `tblend` metric (the command is in `reference/animation-plan.md`), aiming for a median ≥ 3.
5. **Narration** (only after Guy approves the silent cut).
   - **The monk's voice:** `MONK_VOICE = 3nyjs2pl3InjAOoN8lAY`, named "The Monk (Hebrew)" in the ElevenLabs library. Guy picked it on 2026-11-18 after five design rounds. It is a **Hebrew** voice: warm and male, a little higher than average, fast, bouncy and happy, and it laughs sometimes. Guy turned down voices that were deeper, and also cartoonish or squeaky ones, so don't swap it for anything else. Hebrew narration uses `eleven_v3`.
   - The voice is fast by nature. Start at `VO_SPEED` 1.0 and go up only when a shot needs it.
   - Then:
     - one take → `assets/vo/take.mp3`
     - `ffmpeg -i assets/vo/take.mp3 -filter:a atempo=<VO_SPEED> assets/vo/narration.mp3`
     - `npx hyperframes transcribe assets/vo/take.mp3 --json > assets/vo/take.transcript.json`
     - `node build/gen.mjs`, which fits scenes and captions to the real speech
   - Fix any `vo align failed` or hold > 1.6 with a `CAMTO`. (The word matcher keeps Hebrew letters, so Hebrew transcripts align.)
6. **Sound.** The music is Guy's pick, **Sitar Radiance** (Pixabay, free, no attribution). Copy `spirit-reels/assets/music-options/6-sitar-radiance.mp3` to the project's `assets/music/sitar-radiance.mp3`, and gen.mjs adds it under the voice at `MUSIC_VOL` 0.47 (≈ -22 LUFS, clearly audible, the voice on top). Don't run the media-use carve on it: its level lane buried the bed by 19 dB and Guy couldn't hear the music. For a different track, ask Guy first. He wants sitar in the "Shanti of Sitar" spirit, with a pulse (tabla). SFX on pops and slams stay gentle.
7. **Final render + caption.** Render `renders/<slug>-v1-voice.mp4` and send the preview. After Guy approves, post it through the page's queue: `python3 scripts/enqueue.py videos/<slug>/renders/<slug>-v1-voice.mp4 --caption "..." --tags "נשימה,מדיטציה,רוחניות"` (rules in the repo's CLAUDE.md). Write a Hebrew post caption with a hook, the idea, one practice and a question, plus hashtags such as נשימה, מדיטציה, מודעות, צאקרות, רוחניות (and a few English ones like breathwork, meditation).

## 5. HyperFrames / GSAP gotchas
- **Seek-safe:** `fromTo` + `immediateRender:false`, no `Math.random`, no `repeat:-1`.
- **Camera:** the matrix camera (`CAMTO`).
- **Morph blob:** it lives outside the camera.
- **Grain:** a single PNG layer.
- **Fonts:** bundled woff2 only. Hebrew uses Rubik (`HEB`, weights 700/800/900, in `kit/assets/fonts`); `SANS` falls back to Rubik, so Hebrew in `T()` still renders. Use `hchip()` for Hebrew label pills. Captions are `direction="rtl"` anchored at x=372.
- **Safe zone:** keep text away from the right-side button rail.
- **CAMTO and the presenter:** `CAMTO(s,t,cx,cy,k)` puts `(cx,cy)` at (200,290), so a low `cy` pushes everything down onto the monk. Keep stage content above y≈340 after the zoom; the demo's s03 shows the fix.

## 6. After every change
- Keep the film's own `STORYBOARD.md` current.
- If a rule or a prop changes, update this skill, then commit and push it to spirit-reels only. This copy belongs to @spiritualist_77777 and must never be pushed to creatora or mixed with it.
