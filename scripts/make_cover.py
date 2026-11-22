#!/usr/bin/env python3
"""Make the feed cover (1080x1920 JPEG) for a monk reel: the monk at the bottom, a Hebrew title above him.

    python3 scripts/make_cover.py --style A --title "צליל אחד|שמעלה *פי 15*|את מה|שהגוף צריך" --video videos/x/renders/x.mp4 --out videos/x/renders/cover.jpg

Title markup: "|" = line break, *word* = red, _word_ = green, ^word^ = gold.
Styles (Guy approved all six on 2026-11-22; pick by the title's content, see the monk skill "Cover"):
  A  big black headline, key word red              (default: a plain claim / hook)
  B  dark tilted card with tape                    (a list, rule or "X things")
  C  huge number + a line above (--kicker) and below (--sub) (--num is the number; the title is the word under it)
  D  speech bubble from the monk                   (a quote, a dialogue, a joke, a provocation)
  E  gold marker behind the lines + --sub          (a definition: "X is Y")
  F  serif headline + red pill (--kicker)          (a practice / exercise / invitation to try)
Background: frame 0 of --video (the monk's opening pose), or --bg image, or assets/cover/monk-default.png.
The title sits in y 330..1170, inside Instagram's 3:4 grid crop and above the monk's head; text shrinks to fit.
"""
import argparse, html, pathlib, re, shutil, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

HEAD = """<!doctype html><html dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;800;900&family=Frank+Ruhl+Libre:wght@700;900&display=block" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden}
body{background:#efece6 url(bg.png) 0 0/1080px 1920px no-repeat;font-family:Rubik,sans-serif;color:#161412;position:relative}
.wrap{position:absolute;left:70px;right:70px;top:330px;height:840px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.r{color:#e5302a}.g{color:#16a35f}.y{color:#e8a317}
.fit{display:inline-block;max-width:940px;white-space:nowrap}
</style></head><body>"""

# shrink every .fit block until the whole .wrap fits its box
FIT_JS = """<script>
document.fonts.ready.then(()=>{const w=document.querySelector('.wrap');const fs=[...document.querySelectorAll('[data-fs]')];
let k=1;const W=w.getBoundingClientRect();
const over=()=>[...w.querySelectorAll('div')].some(e=>{const r=e.getBoundingClientRect();return r.top<W.top-1||r.bottom>W.bottom+1||e.scrollWidth>e.clientWidth+2;});
while(over()&&k>0.4){k-=0.03;fs.forEach(e=>e.style.fontSize=(+e.dataset.fs*k)+'px');}
document.title='ready';});
</script>"""


def mark(s):
    s = html.escape(s)
    s = re.sub(r"\*(.+?)\*", r'<span class="r">\1</span>', s)
    s = re.sub(r"_(.+?)_", r'<span class="g">\1</span>', s)
    s = re.sub(r"\^(.+?)\^", r'<span class="y">\1</span>', s)
    return s


def lines(t):
    return "<br>".join(mark(x.strip()) for x in t.split("|"))


def body(style, title, kicker, sub, num):
    L = lines(title)
    if style == "A":
        return f'<div class="wrap"><div class="fit" data-fs="132" style="font-weight:900;font-size:132px;line-height:1.02;letter-spacing:-3px">{L}</div></div>'
    if style == "B":
        return f'''<div class="wrap"><div style="position:relative;transform:rotate(-3deg);background:#1b1917;color:#fff;border-radius:44px;padding:70px 64px 76px;box-shadow:10px 16px 0 rgba(0,0,0,.18);max-width:900px">
<div style="position:absolute;top:-34px;left:50%;transform:translateX(-50%) rotate(4deg);width:230px;height:64px;background:#e9dfc4;opacity:.9"></div>
<div class="fit" data-fs="112" style="font-weight:800;font-size:112px;line-height:1.05;letter-spacing:-2px;max-width:780px">{L}</div></div></div>'''
    if style == "C":
        if not num:
            sys.exit("style C needs --num")
        k = f'<div data-fs="72" style="font-weight:700;font-size:72px;line-height:1.1">{mark(kicker)}</div>' if kicker else ""
        s = f'<div class="fit" data-fs="62" style="font-weight:500;font-size:62px;line-height:1.2;margin-top:24px;color:#4a443d">{mark(sub)}</div>' if sub else ""
        nfs = 470 if len(num) <= 2 else (330 if len(num) <= 3 else 240)
        return f'''<div class="wrap">{k}
<div class="fit" data-fs="{nfs}" style="font-weight:900;font-size:{nfs}px;line-height:.86;color:#e5302a;letter-spacing:-10px;text-shadow:10px 12px 0 rgba(22,20,18,.12)">{html.escape(num)}</div>
<div class="fit" data-fs="120" style="font-weight:900;font-size:120px;line-height:1">{L}</div>{s}</div>'''
    if style == "D":
        return f'''<div class="wrap" style="justify-content:flex-end;padding-bottom:40px"><div style="position:relative;background:#fbfaf7;border:7px solid #161412;border-radius:70px;padding:64px 60px;box-shadow:12px 14px 0 rgba(0,0,0,.12);max-width:900px">
<div class="fit" data-fs="100" style="font-weight:800;font-size:100px;line-height:1.08;letter-spacing:-2px;max-width:770px">{L}</div>
<svg width="120" height="110" viewBox="0 0 120 110" style="position:absolute;bottom:-100px;left:300px"><path d="M8 0 L110 0 L30 104 Z" fill="#fbfaf7" stroke="#161412" stroke-width="7" stroke-linejoin="round"/><rect x="4" y="-8" width="112" height="14" fill="#fbfaf7"/></svg></div></div>'''
    if style == "E":
        hl = "background:linear-gradient(transparent 52%,#e8a317 52%,#e8a317 90%,transparent 90%);padding:0 14px"
        M = "<br>".join(f'<span style="{hl}">{mark(x.strip())}</span>' for x in title.split("|"))
        s = f'<div class="fit" data-fs="60" style="font-weight:500;font-size:60px;margin-top:40px;color:#4a443d">{mark(sub)}</div>' if sub else ""
        return f'<div class="wrap"><div class="fit" data-fs="128" style="font-weight:900;font-size:128px;line-height:1.22;letter-spacing:-2px">{M}</div>{s}</div>'
    if style == "F":
        k = f'<div data-fs="44" style="font-weight:700;font-size:44px;letter-spacing:6px;color:#e5302a;border:4px solid #e5302a;border-radius:60px;padding:10px 36px;margin-bottom:46px">{mark(kicker)}</div>' if kicker else ""
        return f'''<div class="wrap">{k}<div class="fit" data-fs="136" style="font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:136px;line-height:1.02">{L}</div></div>'''
    sys.exit(f"unknown style {style}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", required=True, choices=list("ABCDEF"))
    ap.add_argument("--title", required=True)
    ap.add_argument("--kicker", default="")
    ap.add_argument("--sub", default="")
    ap.add_argument("--num", default="")
    ap.add_argument("--video", default=None)
    ap.add_argument("--bg", default=None)
    ap.add_argument("--at", default="0", help="seconds into --video for the background frame")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="cover-"))
    bg = tmp / "bg.png"
    if a.video:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", a.at, "-i", a.video, "-frames:v", "1", "-vf", "scale=1080:1920", str(bg)], check=True)
    else:
        shutil.copy(a.bg or ROOT / "assets/cover/monk-default.png", bg)
    page = tmp / "cover.html"
    page.write_text(HEAD + body(a.style, a.title, a.kicker, a.sub, a.num) + FIT_JS + "</body></html>")
    png = tmp / "cover.png"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=6000",
                    "--window-size=1080,1920", f"--screenshot={png}", page.as_uri()], check=True, capture_output=True)
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(png), "-vf", "scale=1080:1920", "-q:v", "2", str(out)], check=True)
    (out.with_suffix(".html")).write_text(page.read_text().replace("url(bg.png)", "url(cover-bg.png)"))
    shutil.copy(bg, out.with_name("cover-bg.png"))
    shutil.rmtree(tmp, ignore_errors=True)
    print("cover:", out, "style", a.style)


if __name__ == "__main__":
    main()
