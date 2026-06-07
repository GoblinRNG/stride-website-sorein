/* ============================================================
   RDA BYGG AB — rda-3d-construction.js
   Namespaced. No global pollution. Progressive enhancement.
   ============================================================ */
;(function (window, document) {
  'use strict';

  window.RDA = window.RDA || {};

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      var args = arguments, self = this;
      if (!ticking) { ticking = true; requestAnimationFrame(function () { fn.apply(self, args); ticking = false; }); }
    };
  }

  /* ── Scroll reveal ─────────────────────────── */
  function initReveal(root) {
    var els = qsa('.rda-reveal', root);
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── Hero parallax scene ───────────────────── */
  function initHero(root) {
    var scene = qs('.rda-scene', root);
    if (!scene || reduceMotion) return;
    var layers = qsa('[data-depth]', scene);
    var rect = null;

    function measure() { rect = scene.getBoundingClientRect(); }
    measure();
    on(window, 'resize', rafThrottle(measure));

    function move(px, py) {
      // px, py in range -0.5..0.5
      scene.style.transform = 'rotateY(' + (px * 6) + 'deg) rotateX(' + (-py * 6) + 'deg)';
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-depth')) || 0;
        l.style.transform = 'translate3d(' + (px * d * 40) + 'px,' + (py * d * 40) + 'px,0)';
      });
    }

    if (!isTouch) {
      on(scene, 'mousemove', rafThrottle(function (e) {
        if (!rect) measure();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        move(px, py);
      }));
      on(scene, 'mouseleave', function () { move(0, 0); });
    } else if (window.DeviceOrientationEvent) {
      on(window, 'deviceorientation', rafThrottle(function (e) {
        if (e.gamma == null) return;
        move(clamp(e.gamma / 45, -0.5, 0.5), clamp((e.beta - 45) / 45, -0.5, 0.5));
      }));
    }
  }

  /* ── Material cards: flip + tilt ───────────── */
  function initMaterials(root) {
    qsa('.rda-mat', root).forEach(function (card) {
      on(card, 'click', function () { card.classList.toggle('is-flipped'); });
      on(card, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.toggle('is-flipped'); }
      });
      if (reduceMotion || isTouch) return;
      on(card, 'mousemove', rafThrottle(function (e) {
        if (card.classList.contains('is-flipped')) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateY(' + (px * 9) + 'deg) rotateX(' + (-py * 9) + 'deg) translateZ(6px)';
      }));
      on(card, 'mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ── Scroll-build sequence ─────────────────── */
  function initBuild(root) {
    var stage = qs('.rda-build__stage', root);
    var steps = qsa('.rda-build__step', root);
    if (!stage || !steps.length) return;
    var total = steps.length; // 5

    if (reduceMotion) { stage.setAttribute('data-step', String(total - 1)); steps[total - 1].classList.add('is-active'); return; }

    function update() {
      var r = stage.getBoundingClientRect();
      var vh = window.innerHeight;
      // progress 0..1 as the stage travels through the viewport center band
      var progress = clamp((vh * 0.85 - r.top) / (vh * 0.7 + r.height * 0.5), 0, 1);
      var idx = clamp(Math.floor(progress * total), 0, total - 1);
      stage.setAttribute('data-step', String(idx));
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i <= idx); });
    }
    update();
    on(window, 'scroll', rafThrottle(update), { passive: true });
    on(window, 'resize', rafThrottle(update));
  }

  /* ── Before / After slider ─────────────────── */
  function initBeforeAfter(root) {
    qsa('.rda-ba__frame', root).forEach(function (frame) {
      var after = qs('.rda-ba__after', frame);
      var handle = qs('.rda-ba__handle', frame);
      var range = qs('.rda-ba__range', frame);
      if (!after || !handle) return;

      function set(pct) {
        pct = clamp(pct, 0, 100);
        after.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
        handle.style.left = pct + '%';
        if (range && Number(range.value) !== pct) range.value = pct;
      }
      set(50);

      if (range) on(range, 'input', function () { set(Number(range.value)); });

      var dragging = false;
      function fromEvent(clientX) {
        var r = frame.getBoundingClientRect();
        set(((clientX - r.left) / r.width) * 100);
      }
      on(frame, 'pointerdown', function (e) {
        if (e.target === range) return; // let native range handle keyboard/focus
        dragging = true; frame.setPointerCapture && frame.setPointerCapture(e.pointerId); fromEvent(e.clientX);
      });
      on(frame, 'pointermove', function (e) { if (dragging) fromEvent(e.clientX); });
      on(window, 'pointerup', function () { dragging = false; });
    });
  }

  /* ── Mobile sticky CTA ─────────────────────── */
  function initSticky(root) {
    var sticky = qs('.rda-sticky', root);
    var hero = qs('.rda-hero', root);
    if (!sticky || !hero) return;
    if (!('IntersectionObserver' in window)) { return; }
    var io = new IntersectionObserver(function (entries) {
      sticky.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0 });
    io.observe(hero);
  }

  /* ── Quote form graceful enhancement ───────── */
  function initForm(root) {
    var form = qs('[data-rda-form]', root);
    if (!form) return;
    // If no real action endpoint set, handle locally with a friendly confirmation.
    on(form, 'submit', function (e) {
      if (form.getAttribute('action')) return; // real backend handles it
      e.preventDefault();
      var note = qs('.rda-form__note', form);
      form.querySelectorAll('input,select,textarea,button').forEach(function (el) { el.disabled = true; });
      if (note) {
        note.textContent = 'Thank you — your request has been noted. We will be in touch shortly to plan your next step.';
        note.style.color = '#6f8f74';
      }
    });
  }

  /* ── Boot ──────────────────────────────────── */
  function boot() {
    qsa('[data-rda-section="construction"]').forEach(function (root) {
      initReveal(root);
      initHero(root);
      initMaterials(root);
      initBuild(root);
      initBeforeAfter(root);
      initSticky(root);
      initForm(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Shopify theme editor support
  document.addEventListener('shopify:section:load', function (e) {
    var root = e.target.querySelector('[data-rda-section="construction"]') || e.target;
    if (root) {
      initReveal(root); initHero(root); initMaterials(root);
      initBuild(root); initBeforeAfter(root); initSticky(root); initForm(root);
    }
  });

})(window, document);
