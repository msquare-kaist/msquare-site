# -*- coding: utf-8 -*-
"""All six pages x both languages x two widths: language leakage, overflow,
JS errors, 404s."""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from playwright.sync_api import sync_playwright

PAGES = ["/", "/departments/academic.html", "/departments/pr.html",
         "/departments/competition.html", "/departments/kai-square.html",
         "/departments/ml.html"]
BASE = "http://localhost:8765"
bad = 0

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for path in PAGES:
        for lang in ("ko", "en"):
            for w in (390, 1440):
                ctx = b.new_context(viewport={"width": w, "height": 900})
                pg = ctx.new_page()
                errs, fails = [], []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.on("response", lambda r: fails.append(f"{r.status} {r.url.rsplit('/',1)[-1]}")
                      if r.status >= 400 else None)
                pg.goto(BASE + path, wait_until="networkidle")
                pg.evaluate("l => localStorage.setItem('m2-lang', l)", lang)
                pg.reload(wait_until="networkidle")
                pg.wait_for_timeout(450)
                r = pg.evaluate("""() => {
                    const cur = document.documentElement.dataset.lang;
                    const other = cur === 'ko' ? 'en' : 'ko';
                    const leak = [...document.querySelectorAll('[data-tr="' + other + '"]')]
                        .filter(e => e.getBoundingClientRect().height > 0).length;
                    const shown = [...document.querySelectorAll('[data-tr="' + cur + '"]')]
                        .filter(e => e.getBoundingClientRect().height > 0).length;
                    return {lang: document.documentElement.lang, dl: cur, leak, shown};
                }""")
                ov = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                ok = (r["leak"] == 0 and ov <= 0 and not errs and not fails
                      and r["lang"] == lang and r["shown"] > 0)
                if not ok:
                    bad += 1
                print(f"  {path:32} {lang} w={w:<5} shown={r['shown']:<3} leak={r['leak']} "
                      f"ov={ov} err={len(errs)} 404={fails[:1]} {'OK' if ok else '*** FAIL'}")
                if errs:
                    print("     JS:", errs[0][:120])
                ctx.close()
    b.close()

print("\nFAILURES:", bad)
