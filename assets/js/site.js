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
    } else {
      startParallax();
      vidCtl.forEach(function (c) { c.start(); });
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
