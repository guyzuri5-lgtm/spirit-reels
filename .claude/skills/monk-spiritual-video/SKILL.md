---
name: monk-spiritual-video
description: Make a spiritual explainer reel (1080×1920, Hebrew, ~45–60s) presented by THE MONK. He is a chubby, bald, laughing Buddhist monk in a saffron robe with the right shoulder bare (face after the laughing-Budai porcelain ref), code-drawn in a paper / ink / halftone language. Topics are breath and breathing exercises, energy, chakras, meditation, mindfulness, calm and similar. Word-by-word Hebrew captions, constant motion, no shot over 1.5s, and a fixed order of work (storyboard → silent → voice → render). Use whenever Guy (or Eitan) asks for a video with the monk / "הנזיר" / "סרטון של הנזיר", or a spiritual / breathing / נשימה / צ'אקרות / אנרגיות / מדיטציה / רוחני reel in this look, or notes on one. Talk to Guy in Hebrew.
---

# Spiritual explainer with the monk

Talk to Guy in Hebrew, masculine form. That covers every message, update and the wrap-up box. On-screen text, captions and narration are in **Hebrew** (since 2026-11-18; the first Hebrew film is `videos/seven-gates`). Captions run right to left in Rubik.

This skill belongs to the spirituality page @master__spirit only. It stands on its own: the presenter is the monk, the topics are spiritual, and every prop is drawn for them. The motion rules (and why they are the way they are) are in `reference/animation-plan.md`.

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
| `kit/build/gen.mjs` | The film generator and source of truth. It writes `compositions/sNN.html`, `index.html`, `STORYBOARD.md` and `build/frames.json`. It ships with **no scenes** (Guy, 2026-11-19: the old drawn-icon demo got copied, so it's gone). The style reference is the approved film **`videos/body-receiver/build/gen.mjs`** — read its scenes before writing new ones. |
| `kit/build/monk-lib.js` | **The monk.** `MONK(o,x,y,w)` is the bust presenter (in gen.mjs `PRESENTER` = `MONK`). `MONKFULL(o,x,y,w)` is the full body: `kind:'stand'` or `'sit'`. **Approved design (2026-11-18). Never redraw him.** |
| `kit/build/ink-lib.js` | The shared drawing parts the monk is built from (hands, arms, eyes / brows / mouth, head rig, ink outline, halftone shadow and glow textures). monk-lib needs it loaded first. Don't delete it. |
| `kit/build/vintage.py` | The vintage cut-out photos (1950s magazine, hand-tinted): reuses the shared image library first, generates only what's missing. See **Images**. |
| `kit/build/measure-caps.mjs` | Measures every caption line in the real font (headless Chrome) → `build/capw.json`, so each line's paper box fits it. Run between two `gen.mjs` runs. |
| `kit/build/board.mjs` | Builds the storyboard sheet from one still per shot. |
| `kit/build/measure-density.mjs` | How busy the film is: objects on screen, image sizes, drawn-only frames, how often new elements enter. Run it before every storyboard and compare with the targets in 3d. |
| `kit/assets/…`, `package.json`, `hyperframes.json` | Fonts, grain, HyperFrames skeleton (pinned 0.9.59). |
| `reference/monk/` | His approved sheets (`monk-sheet.jpg`, `monk-full.jpg`), and the scripts that drew the sheets. |
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
- **He is fixed at the bottom** for the whole film, in the same place in every scene. For a full-body moment (an intro, a demonstration of a posture, the chakras on a body), put `miniMonk(x, y, w, 'meditate'|'sit'|'pray'|'stand'|'wave'|'belly')` **on the stage** (body-receiver's s12 floats him up to the centre in meditation).

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
- the monk and the graphics are drawn in code; the only AI images are the vintage cut-out photos (see **Images** below), no stock
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

## 3c. Guy's look & motion rules (from the body-receiver notes, 2026-11-19)
These came from eight rounds of Guy's notes; a storyboard that breaks them gets rejected.

**Images**
- Small, centred drawn icons are "boring". Every line gets a **surprising, unconventional image that still shows the text**, and it is **big** (fills the stage). `PROP_K` (1.22) scales every scene's props; raise it per scene with `s.propK` / `s.propO`.
- **Generated vintage cut-outs are a fixed part of every reel** (see 3b): plan one or more for each line, where they fit the text (antennas, radios, meters, real organs, laughing / puzzled people, a pointing hand, an eye, a magnifier…). Drawn props support them. Draw them with `cut(s, name, x, y, w)` (paper border + shadow; `cut-color` is preferred automatically).
- Show Guy a contact sheet of the **new** images before putting them in the film.
- **Don't write the word when it can be shown:** no "תדר" / "אנרגיה" pills. Show running frequency waves, lightning in a ray burst.
- **Crowds** (`crowd(s, names, t0, step)`): centred, big, sporadic sizes; **at most two copies of a person**, each copy as far as possible from its twin (`CROWD` = 6 people × 2, `CROWD6` = 3 × 2, picked automatically). Need more people? Generate more.
- **Floods** (question marks, "חחח"): build up gradually and scatter over the whole screen in many colours; use an R2 scatter (`x = frac(.5 + i·.7549)`, `y = frac(.5 + i·.5698)`), never a single-ratio one (it makes diagonals).
- **Stamps:** big, readable, real stamp texture — `bigStamp(x, y, txt, { id: s.id })`.

**Frame**
- No small header text (kept hidden so counters still work), smooth paper background (no tile grid), and a **paper-coloured box behind every caption line**, sized to the line + margins. Widths are measured in the real font: `node build/gen.mjs && node build/measure-caps.mjs && node build/gen.mjs` (re-run after any caption change).
- **Never clip art under the captions** (`CLIP_Y` is off). Art may go up there; the caption box keeps the text readable. Don't design around that area either.

**Motion — nothing ever stands still**
- `FLOAT` (each piece drifts on its own: crowds), `SHIVER` (vibrate with small rotations around the centre: phone, heart, brain, player), `BUZZ` (phone buzz in short bursts with pauses, irregular rhythm), `PULSEL` (gentle fast zoom in/out: waves, tower), `ORBIT` (small circles: magnifiers), `WAVE` (an outline grows and fades — run it on a cut-out's contour, to the screen edge), `LAUGH` (laughing bob), `SCROLL` (waves running left → right), slow small tilts on cards.

**Voice**
- Laughs are **real rolling laughs**, not chuckles — higher-pitched, **short (~1.2s)**, only in a few places (after a punchline). Generate a few laugh samples in the monk voice (`[high-pitched giggly laugh] הי הי הי…`, `eleven_v3`, ~90 credits each), let Guy pick, trim and splice them into the take between lines.
- While he laughs, the presenter has the **laughing face**: add `['end', ['laugh']]` to the scene's `poses` ('end' = right after the last spoken word).
- Check the pronunciation of key words. To fix one, re-voice only that phrase with niqqud (e.g. `גם הגוף הוא מַקְלֵט,` ~20 credits), check it with the transcriber, and splice it in.

**Process** — talk to Guy in Hebrew only. When he asks to see something first (images, a still), show it before rendering. When he says stop, stop at once.

## 3d. Density, transitions and build-ups (from the humming-om notes, 2026-11-20)
Five more rounds of notes, on `videos/humming-om` (posted 2026-11-20). Its `build/gen.mjs` is the second style reference after body-receiver: read it for wipes, floods, the gun and the cage build-up.

**Density — measure it, don't guess.** The approved reference is body-receiver. Shot length was never the problem: both films cut every ~0.7s. What was different is how much is on screen:

| | body-receiver (target) | humming-om v1 (rejected as "big and quiet") |
|---|---|---|
| objects on screen (mean) | ~7.7 | 4.1 |
| one image, median size | ~13% of the frame | 34% |
| frames with no photo (drawn only) | ~25% | 8% |
| new element entering | every ~0.12s | every ~0.24s |

- Mix one hero image with **many small things** around it (crowds, floods, particles, small drawn props, numbers). A single giant image with a couple of overlays gets rejected.
- **About a quarter of the time is drawn-only** (no photo): a big drawn molecule, a drawn cage, the mini monk. A scene with no cut-out at all is fine when it is one of these beats.
- **The same image in two scenes at most.** Swap a third appearance for a drawn beat.
- Before sending a storyboard, run `node build/measure-density.mjs . boards/density.json` and compare it with the table above. It samples every composition in headless Chrome and prints objects per frame, image sizes and how often new elements enter.

**Transitions are built from the scene's own elements.** The things already in the scene keep multiplying until they cover the whole screen, then fly out at the start of the next scene, revealing it. Never use unrelated shapes for a wipe: Guy rejected plain red/white balls "that come from nowhere".
- Use `WIPE_IN(s, pre, items, t0, span, dist)` + `s.top += wipeSvg(s, pre, items, draw)` at the end of a scene, and `WIPE_OUT(...)` with the same items at the start of the next one.
- The items must be **opaque**, or the scene shows through.
- Examples:
  - The NO molecules flood in from the sides, cover the screen, and fly out into the vessels scene.
  - The cage bursts, its gold bubbles flood the screen, and they fly out into the next scene.

**Build-ups, not end states.** A scene starts normal and escalates step by step. For example, the cage starts with straight bars, fills bubble by bubble (each one trembling), and only once it is full do the bars stretch outward (tween the path `d`). Then it shakes harder, rocks, and bursts.

**Everything moves, always.** This includes photos of people (SHIVER + FLOAT + a slow PULSEL), UI cards, and hero objects after they land. For a hero object, loop zoom in → hold ~0.5s → zoom out → hold ~0.25s (the singing bowl), or keep it vibrating and swaying (the scroll). Nothing stops once it lands.

**Action scenes = visual overload with physics.**
- Show the verb literally:
  - exhaling → visible breath puffs out of the mouth;
  - fighting germs → a big drawn gun, recognisable at a glance, spraying bullets that recoil with every shot, with muzzle flashes and flying casings.
- Hits throw particles (a white X in a red circle) that pop up and fall with gravity.
- Placement is scattered and random-looking: never a neat order such as a spiral.

**Numbers are big and overlap their subject:** the BPM partly covers the heart, the years sit on the scroll, the graph partly covers the person. They are not small labels floating beside the subject.

**Presenter moves are continuous.** When the monk leaves his spot (e.g. jumps into the scene to sit cross-legged), swap the presenter for `miniMonk` in the same frame at the same place and size. Don't crossfade (it leaves a ghost). Set `s.clipH = 1600` in that scene so the stage clip doesn't cut him on the way.

## 4. Order of work (each step waits for Guy)
1. **The text.**
   - From Guy's text: turn it into short, spoken, everyday Hebrew (not written-formal), about 45–60s, one sentence per scene (1.5–5s each). Write the narration without niqqud, but spell out any word the voice might misread.
   - **Address the viewers in second person plural** (Guy, 2026-11-20): אתם, נשמתם, תנשמו, תחשבו, נסו, שלכם. Never the singular אתה / נסה / תחשוב / שלך. Convert every singular "you" in Guy's text, including verbs, imperatives and possessives.
   - Keep his points and his order.
   - The project is `videos/<slug>/` **inside the spirit-reels repo** (never in creatora), made with `cp -R .claude/skills/monk-spiritual-video/kit/. videos/<slug>/`. Write a `BRIEF.md` with the script.
2. **Scenes in `build/gen.mjs`.**
   - Write the scenes in the `SCENES` block. **Read `videos/body-receiver/build/gen.mjs` and `videos/humming-om/build/gen.mjs` first** and build in that style (wipes, floods, build-ups, the gun, the cage); never in the old drawn-icon style. Helpers for this are in the kit: `HF`, `gradual`, `WIPE_IN` / `WIPE_OUT` / `wipeSvg` / `WIPEGRID`, `s.clipH`.
   - **Almost every scene has at least one generated vintage cut-out** (`cut()`). gen.mjs warns `NO CUT-OUT sNN` for a scene without one. That is fine only for a deliberate drawn-only beat (see 3d), about a quarter of the film at most; otherwise add a cut-out. It also warns `MISSING CUT-OUT name` when an image isn't in the project yet (run `python3 build/vintage.py <names>`).
   - Plan the density from 3d up front: a hero image plus many small elements, two or three floods or crowds, the wipes between acts, and every number big.
   - Keep `TILE_C`/`CORNER`/`tileFly` if you use the number-tile corner badge.
   - Morphs are per film: add entries to `MORPHS` (the template empties it).
   - `node build/gen.mjs` must end with no `HOLD`.
3. **Storyboard.**
   - Snapshot one still per shot: `npx --yes hyperframes@0.9.59 snapshot --at <t,…> --out boards/stills-v1`, each ≥0.42s before a scene ends.
   - Build the sheet with `node build/board.mjs boards/shots-v1.json boards/stills-v1 "<title>"`, export it to jpg with headless Chrome, and send it to Guy.
   - Art is no longer clipped under the captions (each caption line sits on its own paper box), so nothing looks cut off up there; just keep the key part of an image out from under the caption box.
3b. **Images (rule from Guy, 2026-11-19).** Generate only images we don't already have.
   - First see what exists: `python3 scripts/image_library.py list --style vintage-color` (from the spirit-reels root). The shared library is `assets/image-library/`, built up from every past video.
   - In the project's `build/vintage.py`, reuse the library's **names** for the same concept (heart, brain, laugh-1, prof-2, tower…) so they're found; add new `ITEMS` / `PEOPLE` only for new concepts.
   - `python3 build/vintage.py <names>` then, per image: reuses a library copy if one is allowed, otherwise generates a new one (GPT Image 2 low on fal, ~0.6c, already hand-tinted) and adds it to the library. It prints `reused` / `generated` for each.
   - **The cap:** one image may appear in at most **20 of any 50 consecutive videos**. Over that, the script makes a new variant (`heart~2`, `heart~3`…) instead. Every use is logged in `assets/image-library/usage.json`.
   - Every video counts toward the 50, even one with no images: run `python3 scripts/image_library.py register <slug>` when you start the project.
   - Draw them in gen.mjs with `cut()` / `CUTDIR` (copy them from `videos/body-receiver/build/gen.mjs`).
   - Tell Guy how many were reused and how many generated (and the cost) before generating.
   - **The model (Guy's choice, 2026-11-19): GPT Image 2, `quality: "low"`, on fal** (`openai/gpt-image-2`, `image_size: "square_hd"`), then `fal-ai/birefnet/v2` for the cut-out. The fal key is `"fal"` in `~/.config/talking-head-to-ae/keys.json` (or env `FAL_KEY`). Guy stays on fal; no direct Google / OpenAI key.
     - **Why this model:** in a side-by-side test (`videos/body-receiver/boards/model-test/compare-full.jpg`) it was the only cheap model that got hands, expressions (pointing, fist on chin, eyes up) **and** dial text (STORMY · RAIN · CHANGE · FAIR · VERY DRY) right. Z-Image Turbo and FLUX.2 klein (~0.5c) garbled the text and missed poses. FLUX.1 Schnell is too weak for this.
     - **Retired:** nano-banana-2 on fal = 8c an image, plus 8c more for a separate tint edit (16c a coloured image). GPT Image 2 low is ~0.6c (token-billed; the exact figure is on the fal dashboard → Usage).
   - **The look:** colour comes in the same pass, written into the prompt (`TINT` in `vintage.py`), with no edit step. The prompt must ask for a worn 1950s magazine scan: coarse halftone dots, heavy grain, thin watercolour tints that are **very faded, desaturated, pastel**, with the grey photo showing through and an aged yellow tone. A plain "hand-coloured" prompt comes out saturated and modern (round 1); the working wording is round 2, in `boards/model-test/compare-color-v2.jpg`. Object / person on a plain white background, so the cut-out stays clean.
   - **Switches:** default output is colour → `assets/vintage/raw-color/` + `cut-color/` (gen.mjs prefers `cut-color`). `BW=1` makes black-and-white into `raw/` + `cut/` (library style `vintage-bw`). Files already in the project are skipped; `FORCE=1` regenerates and skips the library.
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
     - Hebrew transcript: `npx --yes hyperframes@0.9.59 transcribe assets/vo/take.mp3 --engine whisper --model large-v3 --language he --json` (the default `small.en` turns Hebrew into English nonsense). It writes `assets/vo/transcript.json`; save its `[{text,start,end}]` as `assets/vo/take.transcript.json`, and fix misheard words to the script's words (the first word of every scene must match, e.g. נו → תנו).
     - Laughs or re-voiced phrases spliced in: shift the later word times by the inserted length.
       - The approved short rolling laugh is `videos/body-receiver/assets/vo/laugh-cut.wav` (1.2s). Reuse it instead of paying for a new one.
     - Fitting to the voice can squeeze a beat that needs time (e.g. one word, "אום", came out at 0.8s; the cage build-up shrank to 1.7s). Insert a short silence after that word in the take (0.4–0.8s) and shift the later word times.
     - Generate through the ElevenLabs connector (`creative_generate_speech`, `generations_count: 1`). Price it first with `estimate_only: true`: a ~50s take was ~700 credits. Show Guy the price before generating.
     - Whisper mishears Hebrew words that the voice says correctly ("תחמוץ את" for תחמוצת, "פס אגור" for פה סגור). It also drops short words, such as את, and long hums. Align by meaning: re-insert missing words with estimated times, and find hums with an `astats` RMS scan.
     - `node build/gen.mjs`, which fits scenes and captions to the real speech
   - Fix any `vo align failed` or hold > 1.6 with a `CAMTO`. (The word matcher keeps Hebrew letters, so Hebrew transcripts align.)
6. **Sound.** The music is Guy's pick, **Sitar Radiance** (Pixabay, free, no attribution). Copy `spirit-reels/assets/music-options/6-sitar-radiance.mp3` to the project's `assets/music/sitar-radiance.mp3`, and gen.mjs adds it under the voice at `MUSIC_VOL` 0.47 (≈ -22 LUFS, clearly audible, the voice on top). Don't run the media-use carve on it: its level lane buried the bed by 19 dB and Guy couldn't hear the music. For a different track, ask Guy first. He wants sitar in the "Shanti of Sitar" spirit, with a pulse (tabla). SFX on pops and slams stay gentle.
7. **Final render + caption + cover.** Render `renders/<slug>-v1-voice.mp4` and send the preview. After Guy approves, make the cover (section 4b) and post both through the page's queue: `python3 scripts/enqueue.py videos/<slug>/renders/<slug>-v1-voice.mp4 --cover videos/<slug>/renders/cover.jpg --cover-style X --caption "..." --tags "נשימה,מדיטציה,רוחניות"` (rules in the repo's CLAUDE.md). **Every monk reel goes up with a cover**; never enqueue without `--cover`. Write a Hebrew post caption with a hook, the idea, one practice and a question, plus hashtags such as נשימה, מדיטציה, מודעות, צאקרות, רוחניות (and a few English ones like breathwork, meditation).

## 4b. The feed cover (Guy, 2026-11-22)

Every reel gets its own cover: **the monk's opening pose at the bottom** (frame 0 of the final video) and **a Hebrew title above him**, inside the 3:4 grid crop. Guy approved all six styles (samples: `samples/cover-options/`) and wants **a different style each time, chosen by what the title says**:

| Style | When | Example |
|---|---|---|
| **A** big black headline, key word red | a plain claim or surprising hook (default) | צליל אחד / שמעלה *פי 15* / את מה / שהגוף צריך |
| **B** dark tilted card with tape | a list, rule, lesson, "X things" | ^7^ טבעות / השריון / שהגוף בונה |
| **C** huge red number | the title hangs on one number (7 gates, 4 seconds, 1 breath) | `--kicker "יש בגוף" --num 7 --title "שערים" --sub "ואחד מהם אולי סגור"` |
| **D** speech bubble from the monk | a quote, dialogue, joke, provocation, rhetorical question | וויי-פיי? _סומכים._ / אנרגיה? / *"הזוי"* 😂 |
| **E** gold marker behind the lines + small sub line | a definition / reframe, "X is Y" | הגוף שלכם / הוא מקלט + `--sub` |
| **F** serif headline + red pill | a practice, exercise, invitation to try | `--kicker "ניסוי של 10 שניות"` זמזום אחד / שהגוף שלכם / מחכה לו |

- When two styles fit, pick the one **not used in the last two posts** (check `cover_style` in the newest `posted/*.json` / the last BRIEFs), so the grid stays varied.
- The title is a short hook (2–5 words per line, 2–4 lines), not the caption. Plural you (אתם). Mark one key word: `*red*`, `_green_` or `^gold^`.
- `python3 scripts/make_cover.py --style X --title "line|line" [--kicker ..] [--sub ..] [--num ..] --video videos/<slug>/renders/<final>.mp4 --out videos/<slug>/renders/cover.jpg` (text auto-shrinks to fit; if frame 0 has no monk at the bottom, pass `--at <sec>` or `--bg assets/cover/monk-default.png`).
- Look at the cover (Read the jpg) before enqueueing, and write `cover style: X, title: ...` into the BRIEF. No separate approval: it goes up with the approved video, and Guy can ask for a change afterwards.
- `enqueue.py --cover` uploads the JPEG to fal's public CDN (Instagram takes the cover only as `cover_url`) and copies it into the queue item for the Facebook thumbnail.

## 5. HyperFrames / GSAP gotchas
- **Seek-safe:** `fromTo` + `immediateRender:false`, no `Math.random`, no `repeat:-1`.
- **Camera:** the matrix camera (`CAMTO`).
- **Morph blob:** it lives outside the camera.
- **Grain:** a single PNG layer.
- **Fonts:** bundled woff2 only. Hebrew uses Rubik (`HEB`, weights 700/800/900, in `kit/assets/fonts`); `SANS` falls back to Rubik, so Hebrew in `T()` still renders. Use `hchip()` for Hebrew label pills. Captions are `direction="rtl"` anchored at x=372.
- **Safe zone:** keep text away from the right-side button rail.
- **CAMTO and the presenter:** `CAMTO(s,t,cx,cy,k)` puts `(cx,cy)` at (200,290), so a low `cy` pushes everything down onto the monk. Keep stage content above y≈340 after the zoom.
- **Props are scaled by `PROP_K` 1.22 around x=200:** a prop at x is drawn at `200 + (x−200)·1.22`. Anything past x≈345 (or below x≈55) ends up off screen, and a zoomed CAMTO crops more. Check numbers and right-side objects in a still.
- **One unclosed `<g>` in a scene's markup puts the presenter inside the stage clip,** so he gets cut at y≈530. If the monk suddenly looks cut off in one scene, count the tags in what you just wrote. Wrap anything you animate with `s.W(n, …)` and drive recoil/jitter on its `-d` layer.
- **Instagram's limit is 95MB.** A 55s render at crf 23 came out at 98MB; re-encode at crf 25 (`-preset slow`), which gave ~67MB.

## 6. After every change
- Keep the film's own `STORYBOARD.md` current.
- If a rule or a prop changes, update this skill, then commit and push it to spirit-reels only. This copy belongs to @master__spirit and must never be pushed to creatora or mixed with it.
