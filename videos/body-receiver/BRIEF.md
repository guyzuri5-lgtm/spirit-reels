# body-receiver — BRIEF

Monk spiritual reel, 1080×1920, Hebrew (RTL captions, Rubik), ~45s.
Source: Guy's Hebrew script (2026-11-18), "הגוף הוא מקלט".
Status: **script v1 approved 2026-11-18 (with scene 14). v1 rejected (too small, boring). v2 rejected (not in the seven-gates image language). v3 sent. 2026-11-19: Guy chose to go back to storyboard v1 and improve it with new guidelines (v2, v3 kept in boards/gen-v*.mjs.bak).**

## Script v1 (one line = one scene)

| # | קריינות | סימון בכתוביות | רעיון ויזואלי |
|---|---|---|---|
| 01 | כולנו סומכים על וויי-פיי ובלוטות', בלי לחשוב פעמיים. | _סומכים_ | טלפון עם קשתות וויי-פיי מהבהבות, אייקון בלוטות' קופץ, הנזיר `thumb` |
| 02 | אבל תגידו "תדר" או "אנרגיה"... | | שני צ'יפים "תדר" / "אנרגיה" נוחתים (LAND) |
| 03 | ...ומיד אתם הזויים. | *הזויים* | חותמת אדומה "הזוי" על הצ'יפים, הנזיר `laugh` |
| 04 | תראו, הטלפון קולט הודעות דרך גלים שאי אפשר לראות. | *לראות* | גלים מקווקווים שקופים עפים לטלפון, בועות הודעה נוחתות אחת-אחת |
| 05 | ואף אחד לא שואל שאלות, כי המכונה מגיבה. | _מגיבה_ | PRESS על כפתור, הטלפון מצלצל, וי ירוק, הנזיר `explain` |
| 06 | עכשיו, תסתכלו על הגוף. | | מעבר halftone, miniMonk עומד נוחת על הבמה |
| 07 | הלב עובד על אותות חשמליים. | _חשמליים_ | לב פועם + קו א.ק.ג נמתח (DRAW), מונה דופק מתגלגל |
| 08 | המוח מייצר פעילות חשמלית. | _פעילות_ | ראש בפרופיל עם גל זהב וניצוצות |
| 09 | ושיר אחד משנה לכם את מצב הרוח תוך שניות. | _שניות_ | תווים עולים (RISE), מד מצב רוח קופץ מאדום לירוק, ספירה 3-2-1 |
| 10 | אז למה זה נושא מביך? | *מביך* | הנזיר `chin`, בועת "?" גדולה |
| 11 | כי ברגע שצוחקים על שאלה, אף אחד לא מחפש תשובה. | *צוחקים* / _תשובה_ | "חחח" קופצים סביב סימן השאלה, זכוכית מגדלת נעצרת עם איקס |
| 12 | תנו לי לחדש לכם: גם הגוף הוא מקלט, בדיוק כמו הטלפון שלכם. | _מקלט_ | הטלפון נהפך (morph) לגוף של הנזיר, אנטנה ותדר עוברים ביניהם, MONKPOP |
| 13 | וברגע שמבינים את זה, אפשר להתחיל לכוון את התחנה. | _לכוון_ | כפתור רדיו מסתובב, מחוג זז מרעש אדום לגל ירוק נקי, BURST, הנזיר `calm` |
| 14 (אופציונלי) | נסו עכשיו: שלוש נשימות איטיות, ותרגישו את התחנה משתנה. | _נשימות_ | breathOrb מתנפח ומתכווץ 3 פעמים, מונה 1-2-3 |

## Notes
- כמעט מילה במילה מהטקסט של גיא, רק פוצל למשפטים קצרים ונוספה "ה" ב"המכונה מגיבה".
- סצנה 14 נוספה לפי כלל הסקיל (לסיים בתרגול קטן או שאלה). אפשר לחתוך.
- "הגוף הוא מקלט" מוצג כמטאפורה, בלי טענה מדעית שהגוף קולט גלים. הלב, המוח והשיר הם עובדות נכונות.
- Voice: MONK_VOICE `3nyjs2pl3InjAOoN8lAY`, `eleven_v3`, only after the silent cut is approved.
- Music: sitar+tabla from `assets/music-options/`.

## v4 (2026-11-19): v1 + vintage cut-outs
Guy: add cut-outs of old vintage photos (antennas, radio, mood meter), generated with fal.
`build/vintage.py` → `assets/vintage/cut/*.png` (nano-banana-2 1K + birefnet; ~$0.80 total). `cut()` in gen.mjs draws one with a paper border + shadow.
- s01 rooftop TV antenna · s04 transmission tower (rings ripple from its top) · s09 barometer (STORMY→FAIR) as the mood meter, drawn needle
- s12 telescopic antennas shoot up out of the monk's head and the phone · s13 tube radio → tuning-dial close-up (drawn needle 88→104) → radio + green wave
- s14 transistor radio + "FM שקט" at the end
Status: v4 sent. v5 (2026-11-19): all stage props scaled 1.22x (PROP_K) — sent, waiting for Guy.
Silent render v1 (2026-11-19): renders/body-receiver-silent-v1.mp4 (+ -preview.mp4). Motion: median 2.71, 0.2% static frames, longest static 0.03s. Sent — waiting for Guy before narration.
Silent render v2 (2026-11-19, Guy's notes + vintage cut-outs, 11 hand-tinted): renders/body-receiver-silent-v2.mp4
Silent render v3 (2026-11-19, notes round 2: big BT/antenna, waves/bolts without words, centred crowds x2, bigger phone/tower, no-entry centred, brain contours, one giant antenna, no top clip): renders/body-receiver-silent-v3.mp4. Pending: 2 new puzzled people + 12 tints (fal balance).
Silent render v4 (2026-11-19: centred crowds, profs x2, no header text, smooth paper, caption boxes): renders/body-receiver-silent-v4.mp4
Silent render v5 (2026-11-19 round 3: antenna wiggle, BT buzz+bob, waves zoom, readable stamp, floating crowd, phone shiver, tower pulse, big body + orbiting magnifiers, ECG tilt, shaking player + big barometer, חחח flood, bigger body+antenna with coloured contours): renders/body-receiver-silent-v5.mp4

## Image model switch (2026-11-19)
Guy: generate new vintage cut-outs with **GPT Image 2 (quality low) on fal** (~0.6c/image), already hand-tinted in one pass —
no nano-banana-2 (8c) and no separate tint edit (8c). `build/vintage.py` now does this by default (→ raw-color/ + cut-color/;
`BW=1` for black-and-white; existing files are skipped unless `FORCE=1`). The current video's images were left untouched.
Model comparison boards: `boards/model-test/compare-full.jpg`, `compare-color-v2.jpg` (the tint prompt that won).
Silent render v6 (2026-11-19: textured הזוי stamp, gradual sporadic חחח flood, much bigger body with antenna behind, contours to the screen edge): renders/body-receiver-silent-v6.mp4
Voice v1 (2026-11-19): eleven_v3 take with 4 chuckles (588 credits; an earlier take without chuckles 549 credits unused), whisper large-v3 he transcript (fixed 5 misheard words), scenes fitted (37.13s): renders/body-receiver-v1-voice.mp4. No music yet.
v2 (2026-11-19): laugh sample 2 (high rolling laugh, trimmed 2.3s) spliced after הזויים and מביך? → 42.2s; music sitar-story ducked under voice (ffmpeg sidechain): renders/body-receiver-v2-music.mp4
v3 (2026-11-19): laughs halved to 1.2s, laughing face during laughs, phrase 'גם הגוף הוא מקלט' re-voiced (take 1, 20 credits) and spliced; music sitar-story: renders/body-receiver-v3-music.mp4 (40.1s)
Posted (queued --now) 2026-11-19 as 20261119-114646: renders/body-receiver-final.mp4 (65.8MB, 40.1s).
