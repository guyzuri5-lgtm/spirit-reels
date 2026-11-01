# riso — the house video style of @spiritualist_77777

Risograph-print look (cream paper / mottled navy, spot inks navy·orange·pink·yellow·teal, misregistered fills,
halftone, boiling lines, giant slam words, paper-label karaoke captions, a "● LIVE" label top-right).
Full style notes: Claude Project doc `house-style.md`.

A video = **one JSON spec** in `riso/specs/<id>.json`. Pushing it to `main` triggers the `riso-produce`
workflow: Gemini voiceover (voice in `riso/voice.json`) → word timing from the audio → frames → sound → the
posting queue. `riso/done/<id>.json` marks it produced. Publishing (10:00 / 19:00 Israel) is `publish.yml`.

## Spec
```json
{
  "id": "20261102-a",                       // unique, sortable (yyyymmdd-a / -b)
  "topic": "הצליל שמעלה פי 15",              // short, used to avoid repeating topics
  "caption": "post text (Hebrew, 1–3 short lines + a question/CTA)",
  "tags": "רוחניות,נשימה,מודעות",            // comma list, no #
  "script": "the narration, exactly as the captions show it. Digits allowed (פי 15).",
  "tts": "same text for the voice: numbers in words (פִּי חֲמֵשׁ עֶשְׂרֵה), niqqud where ambiguous",
  "keywords": ["פי", "15", "תחמוצת", "החנקן"],      // caption words that get the pink underline
  "live": {"label": "NO", "from": 1, "to": 15, "start_at": "מעלה", "end_at": "פי"},  // or {"text": "HUM · 001"}
  "beats": [ { "type": "...", ... }, { "at": "word", "type": "...", ... } ]
}
```
Rules for `script` / `tts`:
- 30–60 seconds ≈ 75–140 words. Short spoken sentences, commas where the narrator should breathe.
- **`tts` must have exactly the same punctuation (, . ? !) as `script`** – timing aligns pauses to punctuation.
- No quotes or brackets in the script. Hebrew only (numbers as digits are fine in `script`).

### Timing anchors
Any key `at`, `at2` or ending in `_at` takes a **word from the script** (punctuation ignored) – the moment the
narrator starts saying it. Use `"word#2"` for the 2nd occurrence, or a number of seconds. Prefer distinctive words.
The first beat starts at 0 (no `at`). **A new beat at least every ~2.5 s of speech**
(about every 6–8 words); the builder auto-splits anything longer than 2.8 s into a re-framed variant, but
designed beats look better. Change background/framing between neighbouring beats.

### Common beat options (all types)
- `bg`: `paper` | `navy` | `pink` | `yellow` | `teal` (tinted paper)
- `slam`: `{"text": "פה סגור", "at": "פה", "color": "pink|orange|yellow|navy|teal", "text2": "…", "at2": "…", "dark": true}`
   – one giant word/phrase (≤ 12 letters reads best; two words max)
- `tag`: `{"title": "ייצור רציף", "sub": "NO · 24/7"}` – small paper label top-left (`sub` = Latin/digits mono)

### Beat types
| type | what it shows | options |
|---|---|---|
| `figure` | the house character (round head, bun, closed eyes) | `framing`: `wide` / `face` (extreme close-up, pink disc) / `porthole` (in a clock ring, navy) / `flow` (particles pour into the chest, icon on chest); `mood`: `calm` `awake` `surprised` `tense` `tired`; `rings` (vibration rings + hum sound); `mmm` (true or text drifting from lips); `ring_mouth_at`; `icon`, `particle`, `direction`: `in`/`out`, `tint` (flow) ; `body` colour |
| `meter` | counter panel climbing on a sunburst | `title` (Hebrew), `code` (Latin), `from`, `to`, `prefix` (default ×), `suffix`, `peak_at`, `peak_text`, `peak_color`, `sunburst`:false |
| `head` | profile head, regions light up | `framing`: `wide` (navy) / `scan` (teal paper, scan bar) / `map` (zoom on face, labels) / `close` (big close-up, use `focus`); `regions`: `[{"name": forehead|nose|cheeks|brain|throat|ear|thirdeye|jaw|mouth, "at": "...", "label": "מצח", "sub": "FRONTAL"}]` (max 3 labels); `ghost_at` (dotted outlines appear); `flow`: `{"from": "nose|mouth", "particle": "dot"|icon|["N","O"], "at": "..."}` |
| `hero` | one big icon centred, rings + orbiting particles | `icon` (see list) or `atoms`: `["N","O"]`; `color`; `label` (short); `particle`; `orbit`: false |
| `word` | 1–3 giant words slamming in one by one, confetti | `words`: `[{"text": "עכשיו", "at": "עכשיו", "color": "pink"}]`; `sunburst` |
| `cards` | 2–4 paper cards with icon + text sliding in | `items`: `[{"text": "מרחיב כלי דם", "sub": "VESSELS", "icon": "heart", "at": "..."}]` – text ≤ 18 chars |
| `wave` | sine waves across the screen | `lines`: `[{"color": "yellow", "amp": 160, "freq": 3, "noise": 0.6, "amp_to": 60, "freq_to": 1.5, "label": "מתח", "sub": "STRESS"}]`, `calm_at` (waves smooth out) |
| `breath` | circle expanding/contracting | `period` (s), `in_label`, `out_label` |
| `versus` | split screen: top (navy) vs bottom (appears at `b_at`) | `a`: `{"icon": "cross", "color": "pink", "label": "...", "sub": "..."}`, `b`: `{...}`, `b_at` |
| `chart` | bars rising, one highlighted | `bars`: `[{"label": "רגיל", "value": 1, "show": "×1"}, {"label": "המהום", "value": 15, "show": "×15", "hi": true}]` |

Icons: `heart drop flame leaf moon eye bell lungs brain sun star lotus check cross clock battery wave spiral`.
Particles: `"dot"`, any icon name, or an atom list like `["N","O"]`.

## Commands
```
python3 riso/build.py riso/specs/X.json --vo some.wav --preview 1,4.5,9   # PNG previews (needs a wav)
python3 riso/build.py riso/specs/X.json --vo some.wav                      # full local render
python3 riso/build.py riso/specs/X.json --enqueue                          # (CI) TTS + render + queue
```
Without a wav (no Gemini access outside CI) check a spec structurally with
`python3 riso/check.py riso/specs/X.json` – it fakes timing from syllables and renders previews.
