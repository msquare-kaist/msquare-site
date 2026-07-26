# -*- coding: utf-8 -*-
"""Motion/polish contract: hero cascade, language-toggle freeze, timeline
draw-in, reduced-motion finished states, no-JS completeness, pressed states.

Run with the site served at localhost:8765 (python -m http.server 8765).
Needs: pip install playwright  (uses the installed Chrome via channel="chrome").
"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from playwright.sync_api import sync_playwright

B = "http://localhost:8765"
bad = 0
def ok(l, c, e=""):
    global bad
    if not c: bad += 1
    print(f"  {'OK  ' if c else 'FAIL'}  {l}  {e}")

FULL = "matrix(1, 0, 0, 1, 0, 0)"

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")

    print("=== hero cascade ends fully visible ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page()
    pg.goto(B + "/", wait_until="networkidle"); pg.wait_for_timeout(1900)
    r = pg.evaluate("""() => ['.hero__eyebrow','.hero__h1','.hero__tex','.hero__gloss'].map(s => {
        const e = [...document.querySelectorAll(s)].find(x => x.getBoundingClientRect().height > 0);
        return e ? +getComputedStyle(e).opacity : -1; })""")
    ok("all 4 hero lines opacity ~1", all(x > 0.98 for x in r), str([round(x, 2) for x in r]))
    ok("hero--shown freeze set", pg.evaluate("document.querySelector('.hero').classList.contains('hero--shown')"))
    ctx.close()

    print("=== language toggle after freeze does not re-hide ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page()
    pg.goto(B + "/", wait_until="networkidle"); pg.wait_for_timeout(1500)
    pg.click("#lang-toggle"); pg.wait_for_timeout(120)
    r = pg.evaluate("""() => { const e=[...document.querySelectorAll('.hero__h1')].find(x=>x.getBoundingClientRect().height>0);
        return +getComputedStyle(e).opacity; }""")
    ok("h1 stays opaque after toggle", r > 0.9, f"op={round(r, 2)}")
    ctx.close()

    print("=== timeline axis draws then settles full ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 1000}); pg = ctx.new_page()
    pg.goto(B + "/", wait_until="networkidle")
    H = pg.evaluate("document.body.scrollHeight")
    for y in range(0, H, 300):
        pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(40)
    pg.wait_for_timeout(1300)
    r = pg.evaluate("""() => { const a=document.querySelector('.tl-b .tl__axis');
        return {t:getComputedStyle(a).transform, drawn:a.closest('.tl__seg').classList.contains('is-drawn')}; }""")
    ok("axis segment is-drawn", r["drawn"])
    ok("axis at full scale", r["t"] in ("none", FULL), r["t"])
    ctx.close()

    print("=== reduced motion: finished, not mid-animation ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce"); pg = ctx.new_page()
    pg.goto(B + "/", wait_until="networkidle")
    pg.evaluate("document.getElementById('history').scrollIntoView()"); pg.wait_for_timeout(700)
    r = pg.evaluate("""() => { const h=[...document.querySelectorAll('.hero__h1')].find(x=>x.getBoundingClientRect().height>0);
        const ax=document.querySelector('.tl-a .tl__axis'); const nd=document.querySelector('.tl-item__node');
        return {hero:+getComputedStyle(h).opacity, axis:getComputedStyle(ax).transform, node:getComputedStyle(nd).transform}; }""")
    ok("hero visible under RM", r["hero"] > 0.98, f"op={r['hero']}")
    ok("axis full under RM", r["axis"] in ("none", FULL), r["axis"])
    ok("node full under RM", r["node"] in ("none", FULL), r["node"])
    ctx.close()

    print("=== no-JS: numbers accented, hero + axis visible ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, java_script_enabled=False); pg = ctx.new_page()
    pg.goto(B + "/", wait_until="load"); pg.wait_for_timeout(400)
    r = pg.evaluate("""() => { const h=[...document.querySelectorAll('.hero__h1')].find(x=>x.getBoundingClientRect().height>0);
        const num=document.querySelector('.head__num'); const ax=document.querySelector('.tl-a .tl__axis');
        return {hero:+getComputedStyle(h).opacity, num:getComputedStyle(num).color, axis:getComputedStyle(ax).transform}; }""")
    ok("hero visible no-JS", r["hero"] > 0.98, f"op={r['hero']}")
    ok("section number colored", "rgb" in r["num"], r["num"])
    ok("axis full no-JS", r["axis"] in ("none", FULL), r["axis"])
    ctx.close()

    print("=== pressed state rule exists ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page()
    pg.goto(B + "/", wait_until="networkidle"); pg.wait_for_timeout(500)
    has_active = pg.evaluate("""() => {
        let found = false;
        for (const sheet of document.styleSheets) {
          try { for (const rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes(':active') && rule.style.transform) found = true;
          } } catch (e) {}
        }
        return found; }""")
    ok(":active pressed rule present", has_active)
    ctx.close()

    b.close()
print("\nFAILURES:", bad)
