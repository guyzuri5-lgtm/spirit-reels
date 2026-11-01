# spirit-reels

העלאה אוטומטית של סרטוני אנימציה לעמוד האינסטגרם @spiritualist_77777.

- מוסיפים סרטון לתור: `python3 scripts/enqueue.py video.mp4 --caption "..." --tags "..."`
- פעמיים ביום (10:00 ו-19:00 שעון ישראל בחורף) GitHub Actions מעלה את הסרטון הבא בתור.
- כל מה שעלה מתועד ב-`posted/`, וסטטוס ההרצה האחרונה ב-`status/last_run.json`.
- אם העלאה נכשלת, גיטהאב שולח מייל.

פרטים טכניים: `CLAUDE.md`.
