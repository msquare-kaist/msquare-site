/* ============================================================================
   MSquare (수학문제연구회) · KAIST — site.js
   Vanilla, no dependencies, no build step.

   Everything here is an ENHANCEMENT. The page renders complete and correct
   with JS disabled: the M² is a static masked mark, the covers and the K5 are
   baked SVG, timeline positions are CSS calc(), .reveal is visible by default
   (only the .js class, set inline in <head>, hides it), and the nav degrades
   to a plain link list via .no-js.

   AUTHOR-TIME NOTE: latticePoints() and knn() below are the JS twins of the
   generator in tools/gen_geo.py, which bakes the three Our Works covers and
   the K5 pentagram straight into index.html. One motif, three states.
   Re-run that script only if you want to regenerate the art.
   ========================================================================= */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var HOVER = window.matchMedia('(hover: hover)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------ 1. theme */
  var root = document.documentElement;
  var toggle = $('#theme-toggle');
  var OSDark = window.matchMedia('(prefers-color-scheme: dark)');

  function isDark() {
    return root.dataset.theme ? root.dataset.theme === 'dark' : OSDark.matches;
  }
  /* The markup can only hard-code ONE label, so it is wrong for every visitor
     whose page resolves to dark — via the OS or via the persisted choice the
     inline <head> script stamps. Derive it from the theme actually rendered.
     It must track the LANGUAGE too: the SVG is decorative, so this label is the
     button's only accessible name, and a Korean string is unreadable to the
     English audience the toggle exists for. */
  function syncLabel() {
    if (!toggle) return;
    var dark = isDark();
    var ko = root.dataset.lang !== 'en';
    toggle.setAttribute('aria-label',
      ko ? (dark ? '밝은 테마로 전환' : '어두운 테마로 전환')
         : (dark ? 'Switch to light theme' : 'Switch to dark theme'));
    toggle.setAttribute('aria-pressed', String(dark));
    // the name is now language-dependent, so declare which language it is in
    toggle.setAttribute('lang', ko ? 'ko' : 'en');
  }
  if (toggle) {
    syncLabel();
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('m2-theme', next); } catch (e) {}
      syncLabel();
    });
    // Keep the label honest when the OS flips and no manual choice is stored.
    OSDark.addEventListener('change', function () {
      if (!root.dataset.theme) syncLabel();
    });
  }

  /* --------------------------------------------------------- 1b. language */
  /* CSS already renders exactly one language from <html data-lang>, which the
     pre-paint script stamps. This only flips the flag and remembers it. */
  var langBtn = $('#lang-toggle');
  function syncLang() {
    var ko = root.dataset.lang !== 'en';
    root.lang = ko ? 'ko' : 'en';
    if (langBtn) {
      // The label names the language you are switching TO, so it is written in
      // that language — and must declare it, or a screen reader reads Korean
      // with an English voice.
      langBtn.setAttribute('aria-label', ko ? 'Switch to English' : '한국어로 보기');
      langBtn.setAttribute('lang', ko ? 'en' : 'ko');
    }
    syncLabel();   // the theme button's name is language-dependent too
  }
  syncLang();
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      root.dataset.lang = root.dataset.lang === 'en' ? 'ko' : 'en';
      try { localStorage.setItem('m2-lang', root.dataset.lang); } catch (e) {}
      syncLang();
    });
  }

  /* -------------------------------------------------------------- 2. nav */
  var nav = $('.nav');
  var sentinel = $('#top-sentinel');
  if (nav && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      nav.classList.toggle('is-stuck', !es[0].isIntersecting);
    }, { rootMargin: '-40px 0px 0px 0px' }).observe(sentinel);
  }

  /* mobile menu: the trigger is the word MENU. Focus trapped, Esc closes. */
  var burger = $('#nav-burger');
  var panel = $('#nav-nav');
  function setMenu(open) {
    if (!panel || !burger) return;
    panel.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && panel) {
    burger.addEventListener('click', function () {
      setMenu(panel.classList.contains('is-open') ? false : true);
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        setMenu(false);
        burger.focus();
      }
      if (e.key === 'Tab' && panel.classList.contains('is-open')) {
        var f = $$('a, button', panel).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    // A resize past the breakpoint must not strand the page with overflow:hidden.
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* active section underline */
  var links = $$('.nav__link');
  var byId = {};
  links.forEach(function (a) {
    var id = a.getAttribute('href');
    if (id && id.charAt(0) === '#') byId[id.slice(1)] = a;
  });
  var sections = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var seen = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var best = null, bestR = 0;
      Object.keys(seen).forEach(function (id) { if (seen[id] > bestR) { bestR = seen[id]; best = id; } });
      links.forEach(function (a) { a.classList.remove('is-active'); });
      if (best && byId[best]) byId[best].classList.add('is-active');
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, .01, .5, 1] });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------------------------------------------------------- 3. reveals */
  var reveals = $$('.reveal');
  reveals.forEach(function (el) {
    // cap the stagger at 6 steps — beyond that it reads as lag, not rhythm
    var group = el.parentElement ? $$('.reveal', el.parentElement).indexOf(el) : 0;
    el.style.setProperty('--i', String(Math.min(group < 0 ? 0 : group, 6)));
  });
  if (RM.matches || !('IntersectionObserver' in window)) {
    // NEVER construct the observer under reduce — content would sit at
    // opacity:0 forever for exactly the users who most need to read it.
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in-view');
        rio.unobserve(e.target);   // never re-animate on scroll-back
      });
    }, { threshold: .15, rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { rio.observe(el); });
  }

  /* ---------------------------------------------------- 3b. hero + timeline
     The hero copy cascades in on load; freeze the final state after so a later
     language toggle (which swaps display:none nodes) can't replay it. */
  var heroSec = $('.hero');
  if (heroSec) setTimeout(function () { heroSec.classList.add('hero--shown'); }, 1200);

  /* The to-scale history axis draws itself in as each segment enters. Under
     reduced motion (or no IO) it is simply stamped drawn — the finished axis. */
  var tlSegs = $$('.tl__seg');
  if (tlSegs.length) {
    if (RM.matches || !('IntersectionObserver' in window)) {
      tlSegs.forEach(function (el) { el.classList.add('is-drawn'); });
    } else {
      var tio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-drawn');
          tio.unobserve(e.target);   // one-shot: scroll-back never re-draws
        });
      }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
      tlSegs.forEach(function (el) { tio.observe(el); });
    }
  }

  /* ------------------------------------------- 4. the lattice and its k-NN */
  var A = 36;                       // lattice constant
  var DY = A * Math.sqrt(3) / 2;    // true triangular row pitch — not a square grid

  function latticePoints(w, h) {
    var pts = [];
    for (var r = 0, y = 0; y <= h + DY; r++, y = r * DY) {
      var off = (r % 2) ? A / 2 : 0;
      for (var x = off; x <= w + A; x += A) pts.push({ x: x, y: y });
    }
    return pts;
  }

  function knn(pts, px, py, k) {
    var d = [];
    for (var i = 0; i < pts.length; i++) {
      var dx = pts[i].x - px, dy = pts[i].y - py;
      d.push({ i: i, d2: dx * dx + dy * dy });
    }
    d.sort(function (a, b) { return a.d2 - b.d2; });
    return d.slice(0, k);
  }

  var geo = $('#hero-geo');
  var knnG = geo ? $('.hero-geo__knn', geo) : null;
  /* Not particles.js: the dots are a FIXED lattice — nothing drifts, nothing
     floats, nothing autoplays. The only moving thing is the pointer's own k-NN
     ball, a labelled mathematical object with a defined radius. It appears
     exactly once on the page. Pointer-driven, so it stays under reduced motion;
     only the lattice parallax is disabled there. */
  if (geo && knnG && HOVER.matches) {
    var VB = { w: 1440, h: 900 };
    var pts = latticePoints(VB.w, VB.h);
    var queued = false, last = null;

    function draw(p) {
      var near = knn(pts, p.x, p.y, 6);
      var r = Math.sqrt(near[near.length - 1].d2);
      var out = '<circle class="knn__ball" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) +
                '" r="' + r.toFixed(1) + '"/>';
      near.forEach(function (n) {
        var q = pts[n.i];
        out += '<line class="knn__spoke" x1="' + p.x.toFixed(1) + '" y1="' + p.y.toFixed(1) +
               '" x2="' + q.x + '" y2="' + q.y + '"/>' +
               '<circle class="knn__nb" cx="' + q.x + '" cy="' + q.y + '" r="2.4"/>';
      });
      knnG.innerHTML = out;
    }

    function toUser(ev) {
      // getScreenCTM handles preserveAspectRatio="slice" correctly; hand-rolled
      // ratio math does not.
      var ctm = geo.getScreenCTM();
      if (!ctm) return null;
      var pt = geo.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      return pt.matrixTransform(ctm.inverse());
    }

    window.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      last = ev;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        var p = toUser(last);
        if (p) draw(p);
      });
    }, { passive: true });

    var heroEl = $('.hero') || $('.dhero');   // department pages use .dhero
    if (heroEl) {
      heroEl.addEventListener('pointerleave', function () { knnG.innerHTML = ''; });
    }
  }

  /* --------------------------------------- 4b. department scene playback */
  /* preload="none": not a byte of video is fetched until playback is wanted, so
     the poster is the whole cost until then.

     The markup ships `controls` because that is the correct state when nothing
     else runs — with JS off it is the only way to reach the animation. We keep
     the controls even while autoplaying: WCAG 2.2.2 wants a pause mechanism for
     anything that auto-starts and moves for more than five seconds, and these
     loop. Under reduced motion we simply never autoplay; the poster is already
     the finished frame, so the still page loses nothing. */
  var vidCtl = $$('.dvid').map(function (v) {
    var io = null;
    function play() { v.play().catch(function () {}); }
    function start() {
      if (RM.matches || io) return;
      if (!('IntersectionObserver' in window)) { play(); return; }
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) play(); else v.pause(); });
      }, { threshold: .25 });
      io.observe(v);
    }
    function stop() {
      if (io) { io.disconnect(); io = null; }
      v.pause();
    }
    start();
    return { start: start, stop: stop };
  });

  /* --------------------------------------------- 5. hero parallax fallback */
  /* Firefox has no scroll-driven CSS; without this it gets a dead hero. */
  var supportsSDA = window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()');
  var parallaxOn = false;
  var pq = false;
  function onScroll() {
    if (pq) return;
    pq = true;
    requestAnimationFrame(function () {
      pq = false;
      var y = window.scrollY || window.pageYOffset || 0;
      root.style.setProperty('--sy', String(y));
      root.style.setProperty('--hero-o', String(Math.max(0, 1 - y / (0.6 * window.innerHeight))));
    });
  }
  function startParallax() {
    if (parallaxOn || supportsSDA || RM.matches) return;
    parallaxOn = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  function stopParallax() {
    if (!parallaxOn) return;
    parallaxOn = false;
    window.removeEventListener('scroll', onScroll);
    root.style.removeProperty('--sy');
    root.style.removeProperty('--hero-o');
  }
  startParallax();
  // Honour a LIVE change, not just the state at load. Someone who starts to feel
  // unwell and flips the OS switch must have the motion stop NOW — including a
  // video that is already looping, which CSS cannot reach at all.
  RM.addEventListener('change', function (e) {
    if (e.matches) {
      stopParallax();
      reveals.forEach(function (el) { el.classList.add('in-view'); });
      vidCtl.forEach(function (c) { c.stop(); });
      if (simplex) simplex.stop();
    } else {
      startParallax();
      vidCtl.forEach(function (c) { c.start(); });
      if (simplex) simplex.start();
    }
  });

  /* ------------------------- 6. departments: K5 <-> roster cross-highlight */
  /* A real graph as a real navigation object: decorative AND functional. */
  var k5 = $('.k5');
  var depts = $$('.dept');
  if (k5 && depts.length) {
    var verts = $$('.k5__v', k5);
    var k5edges = $$('.k5__edge', k5);
    function litDept(n, on) {
      verts.forEach(function (v) { if (+v.dataset.dept === n) v.classList.toggle('is-lit', on); });
      k5edges.forEach(function (e) {
        if (+e.dataset.a === n || +e.dataset.b === n) e.classList.toggle('is-lit', on);
      });
      depts.forEach(function (d) { if (+d.dataset.dept === n) d.classList.toggle('is-lit', on); });
    }
    depts.forEach(function (d) {
      var n = +d.dataset.dept;
      d.addEventListener('pointerenter', function () { litDept(n, true); });
      d.addEventListener('pointerleave', function () { litDept(n, false); });
      d.addEventListener('focusin', function () { litDept(n, true); });
      d.addEventListener('focusout', function () { litDept(n, false); });
    });
    verts.forEach(function (v) {
      var n = +v.dataset.dept;
      v.addEventListener('pointerenter', function () { litDept(n, true); });
      v.addEventListener('pointerleave', function () { litDept(n, false); });
    });
  }

  /* ----------------------------------- 6b. the K5 is really a 4-simplex
     K5 is the edge graph of the 4-simplex (5-cell): 5 vertices, 10 edges.
     So the flat pentagram is one PROJECTION of a 4D object — and here it
     slowly tumbles through a double rotation (x–w and y–z planes, at
     incommensurate speeds, so the pose never repeats), projected 4D→3D→2D
     into the same SVG. Same motif, one dimension deeper.

     The baked pentagram markup IS the no-JS / reduced-motion state: this
     code only rewrites coordinates on the existing elements, so data-a/b
     and data-dept survive and the roster cross-highlight keeps working. */
  var simplex = (function () {
    var svg = k5;
    if (!svg) return null;
    var sVerts = $$('.k5__v', svg);
    var sEdges = $$('.k5__edge', svg);
    if (sVerts.length !== 5 || sEdges.length !== 10) return null;

    // Regular 5-cell, centred: four "base" vertices and an apex along w.
    var R5 = Math.sqrt(5);
    var V4 = [
      [1, 1, 1, -1 / R5], [1, -1, -1, -1 / R5],
      [-1, 1, -1, -1 / R5], [-1, -1, 1, -1 / R5],
      [0, 0, 0, 4 / R5],
    ];
    var C = 100, S = 46;                 // centre + scale in the 200x200 viewBox
    var running = false, inView = !('IntersectionObserver' in window);
    var raf = 0, acc = 0, last = null, tick = 0;

    // The baked flat pentagram is the contract for no-JS AND reduced motion.
    // Snapshot it before the first frame so stop() can put it back — otherwise
    // a live RM flip would freeze the mark in a skewed, half-faded mid-pose.
    var baked = {
      v: sVerts.map(function (el) {
        return [el.getAttribute('cx'), el.getAttribute('cy'), el.getAttribute('r')];
      }),
      e: sEdges.map(function (el) {
        return [el.getAttribute('x1'), el.getAttribute('y1'),
                el.getAttribute('x2'), el.getAttribute('y2')];
      }),
    };
    function restore() {
      sVerts.forEach(function (el, i) {
        el.setAttribute('cx', baked.v[i][0]);
        el.setAttribute('cy', baked.v[i][1]);
        el.setAttribute('r', baked.v[i][2]);
        el.removeAttribute('fill-opacity');
      });
      sEdges.forEach(function (el, i) {
        el.setAttribute('x1', baked.e[i][0]); el.setAttribute('y1', baked.e[i][1]);
        el.setAttribute('x2', baked.e[i][2]); el.setAttribute('y2', baked.e[i][3]);
        el.removeAttribute('stroke-opacity');
      });
    }

    function frame(ts) {
      if (last !== null) acc += ts - last;
      last = ts;
      tick ^= 1;
      if (tick) {                        // draw every OTHER frame: sub-pixel
        if (running) raf = requestAnimationFrame(frame);   // motion, half cost
        return;
      }
      var t = acc / 1000;
      // golden-ratio speed ratio — genuinely irrational, so the pose never
      // exactly repeats (0.22/0.143 was 20:13 and looped every ~9.5 min)
      var a = t * .22, b = t * (.22 / 1.618033988749895);
      var ca = Math.cos(a), sa = Math.sin(a);
      var cb = Math.cos(b), sb = Math.sin(b);
      var P = V4.map(function (v) {
        var x = v[0] * ca - v[3] * sa, w = v[0] * sa + v[3] * ca;   // x–w plane
        var y = v[1] * cb - v[2] * sb, z = v[1] * sb + v[2] * cb;   // y–z plane
        var k4 = 2.8 / (2.8 - w * .55);  // 4D -> 3D perspective
        var X = x * k4, Y = y * k4, Z = z * k4;
        var k3 = 3.4 / (3.4 - Z * .8);   // 3D -> 2D perspective
        return { x: C + X * k3 * S, y: C + Y * k3 * S,
                 d: Math.max(0, Math.min(1, (Z + 1.7) / 3.4)) };    // depth 0..1
      });
      sVerts.forEach(function (el, i) {
        el.setAttribute('cx', P[i].x.toFixed(2));
        el.setAttribute('cy', P[i].y.toFixed(2));
        el.setAttribute('r', (3 + 2.6 * P[i].d).toFixed(2));
        el.setAttribute('fill-opacity', (.4 + .6 * P[i].d).toFixed(2));
      });
      sEdges.forEach(function (el) {
        var i = +el.dataset.a - 1, j = +el.dataset.b - 1;
        el.setAttribute('x1', P[i].x.toFixed(2)); el.setAttribute('y1', P[i].y.toFixed(2));
        el.setAttribute('x2', P[j].x.toFixed(2)); el.setAttribute('y2', P[j].y.toFixed(2));
        el.setAttribute('stroke-opacity', (.3 + .65 * ((P[i].d + P[j].d) / 2)).toFixed(2));
      });
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || RM.matches || !inView) return;
      running = true; last = null;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false; last = null;
      cancelAnimationFrame(raf);
      restore();   // the resting state is always the baked pentagram
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          inView = e.isIntersecting;
          if (inView) start(); else stop();
        });
      }, { threshold: .1 }).observe(svg);
    } else {
      start();
    }
    return { start: start, stop: stop };
  })();

  /* ------------------------------ 6c. pointer depth on the Works cards
     The plane tilts toward the cursor (≤ ~3.5°). The card's existing 220ms
     ease-out transition is what makes it FLOW after the pointer rather than
     snap. Hover-capable devices only; under reduced motion the vars are never
     written, so the rotation stays zero. */
  if (HOVER.matches) {
    $$('.work').forEach(function (card) {
      card.addEventListener('pointermove', function (ev) {
        if (RM.matches) return;
        var r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var px = (ev.clientX - r.left) / r.width - .5;
        var py = (ev.clientY - r.top) / r.height - .5;
        card.style.setProperty('--ry', (px * 5).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (py * -4).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.removeProperty('--ry');
        card.style.removeProperty('--rx');
      });
    });
  }

  /* --------------------------------------------------------- 7. back to top */
  var top = $('#to-top');
  if (top) {
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' });
    });
    if ('IntersectionObserver' in window && sentinel) {
      new IntersectionObserver(function (es) {
        top.classList.toggle('is-on', !es[0].isIntersecting);
      }, { rootMargin: '150% 0px 0px 0px' }).observe(sentinel);
    }
  }

})();
