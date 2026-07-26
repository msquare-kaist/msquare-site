# -*- coding: utf-8 -*-
"""Regression: no-JS, reduced motion, video policy, timeline geometry, overflow."""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"
DEPT = BASE + "/departments/ml.html"
bad = 0

def ok(label, cond, extra=""):
    global bad
    if not cond:
        bad += 1
    print(f"  {'OK  ' if cond else 'FAIL'}  {label}  {extra}")

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")

    print("=== no-JS: both languages must show, nothing stranded ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, java_script_enabled=False)
    pg = ctx.new_page(); pg.goto(BASE + "/", wait_until="load"); pg.wait_for_timeout(600)
    r = pg.evaluate("""() => ({
        hiddenReveal: [...document.querySelectorAll('.reveal')].filter(e=>+getComputedStyle(e).opacity<0.9).length,
        koVisible: [...document.querySelectorAll('[data-tr="ko"]')].filter(e=>e.getBoundingClientRect().height>0).length,
        enVisible: [...document.querySelectorAll('[data-tr="en"]')].filter(e=>e.getBoundingClientRect().height>0).length,
        langBtn: getComputedStyle(document.getElementById('lang-toggle')).display,
    })""")
    ok("no .reveal stranded at opacity 0", r["hiddenReveal"] == 0, f"hidden={r['hiddenReveal']}")
    ok("Korean visible without JS", r["koVisible"] > 20, f"n={r['koVisible']}")
    ok("English visible without JS", r["enVisible"] > 20, f"n={r['enVisible']}")
    ok("dead language button hidden without JS", r["langBtn"] == "none", r["langBtn"])
    ctx.close()

    print("\n=== no-JS: department page ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, java_script_enabled=False)
    pg = ctx.new_page(); pg.goto(DEPT, wait_until="load"); pg.wait_for_timeout(500)
    r = pg.evaluate("""() => {
        const v = document.querySelector('.dvid');
        return {poster: !!v.getAttribute('poster'), preload: v.preload,
                controls: v.hasAttribute('controls'),
                decorative: v.getAttribute('aria-hidden') === 'true',
                untouchable: getComputedStyle(v).pointerEvents === 'none',
                caption: !!document.querySelector('.dfig figcaption'),
                intro: document.querySelector('.dintro').getBoundingClientRect().height};
    }""")
    ok("poster present (the no-JS/RM still)", r["poster"])
    ok("preload=none", r["preload"] == "none", r["preload"])
    ok("GIF-like: no controls", not r["controls"])
    ok("GIF-like: untouchable (pointer-events none)", r["untouchable"])
    ok("decorative (aria-hidden)", r["decorative"])
    ok("caption removed", not r["caption"])
    ok("intro text visible", r["intro"] > 0)
    ctx.close()

    print("\n=== reduced motion ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    pg = ctx.new_page(); pg.goto(DEPT, wait_until="networkidle"); pg.wait_for_timeout(1800)
    r = pg.evaluate("""() => {
        const v = document.querySelector('.dvid');
        return {paused: v.paused,
                hiddenReveal: [...document.querySelectorAll('.reveal')].filter(e=>+getComputedStyle(e).opacity<0.9).length};
    }""")
    ok("video does NOT autoplay under reduce (poster stands in)", r["paused"])
    ok("page complete (no stranded reveals)", r["hiddenReveal"] == 0)
    ctx.close()

    print("\n=== normal: autoplay + pause mechanism ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page(); pg.goto(DEPT, wait_until="networkidle"); pg.wait_for_timeout(2500)
    r = pg.evaluate("""() => {
        const v = document.querySelector('.dvid');
        return {paused: v.paused, t: v.currentTime};
    }""")
    ok("video autoplays in view (gif-like)", not r["paused"], f"t={r['t']:.1f}s")
    ctx.close()

    print("\n=== overflow + timeline across widths (both languages) ===")
    for lang in ("ko", "en"):
        for w in (320, 390, 768, 900, 901, 1440, 1920):
            ctx = b.new_context(viewport={"width": w, "height": 900})
            pg = ctx.new_page()
            pg.goto(BASE + "/", wait_until="networkidle")
            pg.evaluate("l => localStorage.setItem('m2-lang', l)", lang)
            pg.reload(wait_until="networkidle"); pg.wait_for_timeout(350)
            ov = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            r = pg.evaluate("""() => [...document.querySelectorAll('.tl-b .tl-item')].map(e=>{
                const b=e.getBoundingClientRect();
                return {side:e.dataset.side, top:Math.round(b.top+scrollY), bot:Math.round(b.bottom+scrollY),
                        clip:e.scrollHeight>e.clientHeight+1};})""")
            two = pg.evaluate("matchMedia('(min-width: 901px)').matches")
            groups = ({"l": [x for x in r if x["side"] == "l"], "r": [x for x in r if x["side"] == "r"]}
                      if two else {"a": r})
            worst = None
            for g in groups.values():
                g.sort(key=lambda x: x["top"])
                for i in range(len(g) - 1):
                    gap = g[i + 1]["top"] - g[i]["bot"]
                    worst = gap if worst is None else min(worst, gap)
            clip = sum(1 for x in r if x["clip"])
            ok(f"{lang} w={w:<5} overflow={ov} tl-gap={worst} clipped={clip}",
               ov <= 0 and (worst is None or worst >= 0) and clip == 0)
            ctx.close()

    b.close()

print("\nFAILURES:", bad)
