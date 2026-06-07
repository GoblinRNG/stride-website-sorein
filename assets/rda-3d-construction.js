/* ============================================================
   RDA BYGG AB — rda-3d-construction.js  ·  v2 (premium pass)
   Namespaced. No global pollution. Progressive enhancement.
   ============================================================ */
;(function (window, document) {
  'use strict';

  window.RDA = window.RDA || {};

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  function qs(s, c) { return (c || document).querySelector(s); }
  function qsa(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rafThrottle(fn) {
    var t = false;
    return function () { var a = arguments, s = this; if (!t) { t = true; requestAnimationFrame(function () { fn.apply(s, a); t = false; }); } };
  }

  /* ── Reveal (single + staggered) ───────────── */
  function initReveal(root) {
    var els = qsa('.rda-reveal, .rda-stagger', root);
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach(function (e) { e.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ── Hero parallax (eased + idle float) ────── */
  function initHero(root) {
    var scene = qs('.rda-scene', root);
    if (!scene || reduceMotion) return;
    var layers = qsa('[data-depth]', scene);
    var rect = null, tx = 0, ty = 0, cx = 0, cy = 0, running = false, t0 = 0;

    function measure() { rect = scene.getBoundingClientRect(); }
    measure();
    on(window, 'resize', rafThrottle(measure));

    function frame(ts) {
      cx = lerp(cx, tx, 0.08); cy = lerp(cy, ty, 0.08);
      var fl = Math.sin((ts || 0) / 1800) * 0.5; // idle float
      scene.style.transform = 'rotateY(' + (cx * 7) + 'deg) rotateX(' + (-cy * 7) + 'deg)';
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-depth')) || 0;
        l.style.transform = 'translate3d(' + ((cx * d * 42) + fl * d * 3).toFixed(2) + 'px,' + ((cy * d * 42) + fl * d * 2).toFixed(2) + 'px,0)';
      });
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001 || !isTouch) { requestAnimationFrame(frame); }
      else { running = false; }
    }
    function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

    if (!isTouch) {
      on(scene, 'mousemove', function (e) { if (!rect) measure(); tx = (e.clientX - rect.left) / rect.width - 0.5; ty = (e.clientY - rect.top) / rect.height - 0.5; start(); });
      on(scene, 'mouseleave', function () { tx = 0; ty = 0; start(); });
      start();
    } else if (window.DeviceOrientationEvent) {
      on(window, 'deviceorientation', rafThrottle(function (e) { if (e.gamma == null) return; tx = clamp(e.gamma / 45, -0.5, 0.5); ty = clamp((e.beta - 45) / 45, -0.5, 0.5); start(); }));
    }
  }

  /* ── Material cards: flip + tilt + sheen ───── */
  function initMaterials(root) {
    qsa('.rda-mat', root).forEach(function (card) {
      var front = qs('.rda-mat__front', card);
      function flip() { var f = card.classList.toggle('is-flipped'); card.setAttribute('aria-pressed', f ? 'true' : 'false'); }
      on(card, 'click', flip);
      on(card, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
      if (reduceMotion || isTouch) return;
      on(card, 'mousemove', rafThrottle(function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        if (front) { front.style.setProperty('--mx', (px * 100) + '%'); front.style.setProperty('--my', (py * 100) + '%'); }
        if (!card.classList.contains('is-flipped')) card.style.transform = 'rotateY(' + ((px - 0.5) * 10) + 'deg) rotateX(' + (-(py - 0.5) * 10) + 'deg) translateZ(8px)';
      }));
      on(card, 'mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ── Scroll-build (steps + progress bar) ───── */
  function initBuild(root) {
    var stage = qs('.rda-build__stage', root);
    var steps = qsa('.rda-build__step', root);
    var bar = qs('.rda-build__progress i', root);
    if (!stage || !steps.length) return;
    var total = steps.length;
    if (reduceMotion) { stage.setAttribute('data-step', String(total - 1)); steps.forEach(function (s) { s.classList.add('is-active'); }); if (bar) bar.style.width = '100%'; return; }
    function update() {
      var r = stage.getBoundingClientRect(), vh = window.innerHeight;
      var progress = clamp((vh * 0.82 - r.top) / (vh * 0.62 + r.height * 0.5), 0, 1);
      var idx = clamp(Math.floor(progress * total), 0, total - 1);
      stage.setAttribute('data-step', String(idx));
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i <= idx); });
      if (bar) bar.style.width = (progress * 100).toFixed(1) + '%';
    }
    update();
    on(window, 'scroll', rafThrottle(update), { passive: true });
    on(window, 'resize', rafThrottle(update));
  }

  /* ── Animated stat counters ────────────────── */
  function initStats(root) {
    var nums = qsa('.rda-stat__num[data-count]', root);
    if (!nums.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) { nums.forEach(function (n) { render(n, parseFloat(n.getAttribute('data-count'))); }); return; }
    function render(n, v) {
      var dec = (n.getAttribute('data-decimals') | 0);
      n.firstChild ? (n.childNodes[0].nodeValue = v.toFixed(dec)) : (n.textContent = v.toFixed(dec));
      // preserve prefix/suffix spans by only updating the value text node
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var n = e.target, target = parseFloat(n.getAttribute('data-count')), dec = (n.getAttribute('data-decimals') | 0);
        var suffix = n.querySelector('span') ? n.querySelector('span').outerHTML : '';
        var t0 = null, dur = 1400;
        function step(ts) {
          if (!t0) t0 = ts; var p = clamp((ts - t0) / dur, 0, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          n.innerHTML = (target * eased).toFixed(dec) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ── Before / After ────────────────────────── */
  function initBeforeAfter(root) {
    qsa('.rda-ba__frame', root).forEach(function (frame) {
      var after = qs('.rda-ba__after', frame), handle = qs('.rda-ba__handle', frame), range = qs('.rda-ba__range', frame);
      if (!after || !handle) return;
      function set(pct) { pct = clamp(pct, 0, 100); after.style.clipPath = 'inset(0 0 0 ' + pct + '%)'; handle.style.left = pct + '%'; if (range && Number(range.value) !== pct) range.value = pct; }
      set(50);
      if (range) on(range, 'input', function () { set(Number(range.value)); });
      var dragging = false;
      function fromX(x) { var r = frame.getBoundingClientRect(); set(((x - r.left) / r.width) * 100); }
      on(frame, 'pointerdown', function (e) { if (e.target === range) return; dragging = true; frame.setPointerCapture && frame.setPointerCapture(e.pointerId); fromX(e.clientX); });
      on(frame, 'pointermove', function (e) { if (dragging) fromX(e.clientX); });
      on(window, 'pointerup', function () { dragging = false; });
    });
  }

  /* ── Mobile sticky CTA ─────────────────────── */
  function initSticky(root) {
    var sticky = qs('.rda-sticky', root), hero = qs('.rda-hero', root);
    if (!sticky || !hero || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) { sticky.classList.toggle('is-visible', !entries[0].isIntersecting); }, { threshold: 0 });
    io.observe(hero);
  }

  /* ── Quote form graceful enhancement ───────── */
  function initForm(root) {
    var form = qs('[data-rda-form]', root);
    if (!form) return;
    on(form, 'submit', function (e) {
      if (form.getAttribute('action')) return;
      e.preventDefault();
      var note = qs('.rda-form__note', form);
      qsa('input,select,textarea,button', form).forEach(function (el) { el.disabled = true; });
      if (note) { note.textContent = 'Thank you — your request has been noted. We will be in touch shortly to plan your next step.'; note.style.color = '#7c9a6e'; }
    });
  }

  /* ── Button cursor sheen-position (primary) ── */
  function initBtnSheen(root) {
    if (reduceMotion || isTouch) return;
    qsa('.rda-btn--primary', root).forEach(function (b) {
      on(b, 'mousemove', rafThrottle(function (e) { var r = b.getBoundingClientRect(); b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); }));
    });
  }

  function initAll(root) {
    initReveal(root); initHero(root); initMaterials(root); initBuild(root);
    initStats(root); initBeforeAfter(root); initSticky(root); initForm(root); initBtnSheen(root);
  }

  function boot() { qsa('[data-rda-section="construction"]').forEach(initAll); }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
  document.addEventListener('shopify:section:load', function (e) { var r = e.target.querySelector('[data-rda-section="construction"]') || e.target; if (r) initAll(r); });

})(window, document);
