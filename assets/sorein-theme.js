/* === SOREIN ENERGY GRID — MAIN THEME JS === */
(function () {
  'use strict';

  window.Sorein = window.Sorein || {};

  var S = {
    formatSEK: function (cents) {
      var kr = cents / 100;
      return kr.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },
    qs: function (sel, ctx) { return (ctx || document).querySelector(sel); },
    qsa: function (sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); },
    on: function (el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); },
    debounce: function (fn, delay) {
      var t;
      return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, delay || 120); };
    }
  };
  window.Sorein.utils = S;

  /* NAV */
  function initNav() {
    var nav = S.qs('.sorein-nav');
    var toggle = S.qs('.sorein-nav__mobile-toggle');
    var menu = S.qs('.sorein-nav__mobile-menu');
    var close = S.qs('.sorein-nav__mobile-close');
    if (!nav) return;
    window.addEventListener('scroll', S.debounce(function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    }, 50), { passive: true });
    function openMenu() {
      if (!menu) return;
      menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false');
      toggle && toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      if (!menu) return;
      menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true');
      toggle && toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    S.on(toggle, 'click', openMenu);
    S.on(close, 'click', closeMenu);
    S.on(document, 'keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    S.on(S.qs('[data-cart-toggle]'), 'click', function () {
      window.Sorein.openCart && window.Sorein.openCart();
    });
  }

  /* CART DRAWER */
  function initCartDrawer() {
    var drawer = S.qs('#sorein-cart-drawer');
    var overlay = S.qs('#sorein-cart-overlay');
    var closeBtn = S.qs('.sorein-cart-drawer__close');
    var itemsEl = S.qs('#sorein-cart-items');
    var totalEl = S.qs('#sorein-cart-total');
    var emptyEl = S.qs('.sorein-cart-drawer__empty');
    var countBadge = S.qs('.sorein-nav__cart-badge');
    if (!drawer) return;

    function openCart() {
      drawer.classList.add('is-open'); overlay && overlay.classList.add('is-visible');
      drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
      refreshCart();
    }
    function closeCart() {
      drawer.classList.remove('is-open'); overlay && overlay.classList.remove('is-visible');
      drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    }
    function refreshCart() {
      fetch('/cart.js').then(function (r) { return r.json(); }).then(function (cart) {
        renderItems(cart);
        if (totalEl) totalEl.textContent = S.formatSEK(cart.total_price);
        if (countBadge) { countBadge.textContent = cart.item_count; countBadge.hidden = cart.item_count === 0; }
        window.Sorein.cartState = { item_count: cart.item_count, total_price: cart.total_price };
      });
    }
    function renderItems(cart) {
      if (!itemsEl) return;
      itemsEl.innerHTML = '';
      if (cart.item_count === 0) {
        if (emptyEl) emptyEl.hidden = false; itemsEl.hidden = true; return;
      }
      if (emptyEl) emptyEl.hidden = true; itemsEl.hidden = false;
      cart.items.forEach(function (item) {
        var li = document.createElement('li'); li.className = 'sorein-cart-item';
        var img = document.createElement('img'); img.className = 'sorein-cart-item__img';
        img.src = item.image ? item.image.replace(/(\.[a-z]+)$/, '_100x100$1') : ''; img.alt = item.title; img.loading = 'lazy'; img.width = 72; img.height = 72;
        var info = document.createElement('div');
        var title = document.createElement('p'); title.className = 'sorein-cart-item__title'; title.textContent = item.product_title; info.appendChild(title);
        if (item.variant_title && item.variant_title !== 'Default Title') {
          var vt = document.createElement('p'); vt.className = 'sorein-cart-item__variant'; vt.textContent = item.variant_title; info.appendChild(vt);
        }
        var pr = document.createElement('p'); pr.className = 'sorein-cart-item__price'; pr.textContent = S.formatSEK(item.line_price); info.appendChild(pr);
        var rm = document.createElement('button'); rm.className = 'sorein-cart-item__remove';
        rm.setAttribute('aria-label', 'Remove ' + item.product_title);
        rm.innerHTML = '<svg class="sorein-icon" width="14" height="14" viewBox="0 0 24 24"><use href="#icon-close"></use></svg>';
        rm.addEventListener('click', function () {
          fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.key, quantity: 0 }) }).then(refreshCart);
        });
        li.appendChild(img); li.appendChild(info); li.appendChild(rm); itemsEl.appendChild(li);
      });
    }
    window.Sorein.openCart = openCart;
    window.Sorein.closeCart = closeCart;
    window.Sorein.refreshCart = refreshCart;
    S.on(overlay, 'click', closeCart); S.on(closeBtn, 'click', closeCart);
    S.qsa('[data-cart-close]').forEach(function (el) { S.on(el, 'click', closeCart); });
    S.on(document, 'keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeCart(); });
  }

  /* ADD TO CART */
  function initAddToCart() {
    S.on(document, 'submit', function (e) {
      var form = e.target.closest('[data-add-to-cart]'); if (!form) return;
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      if (btn && btn.disabled) return;
      if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
      var varId = form.querySelector('[name="id"]').value;
      var qty = parseInt((form.querySelector('[name="quantity"]') || {}).value || 1, 10);
      fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: parseInt(varId, 10), quantity: qty }] }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.status) { window.Sorein.showToast(d.description || 'Could not add.', 'error'); }
          else { window.Sorein.showToast('Added to cart!', 'success'); window.Sorein.openCart && window.Sorein.openCart(); }
        })
        .catch(function () { window.Sorein.showToast('Something went wrong.', 'error'); })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = 'Add to Cart'; } });
    });
    S.on(document, 'click', function (e) {
      var btn = e.target.closest('[data-quick-add]'); if (!btn || btn.disabled) return;
      var varId = btn.dataset.variantId; if (!varId) return;
      btn.disabled = true; btn.textContent = '…';
      fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: parseInt(varId, 10), quantity: 1 }] }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.status) { window.Sorein.showToast('Could not add.', 'error'); }
          else { window.Sorein.showToast('Added!', 'success'); window.Sorein.openCart && window.Sorein.openCart(); }
        })
        .catch(function () { window.Sorein.showToast('Something went wrong.', 'error'); })
        .finally(function () { btn.disabled = false; btn.textContent = 'Quick Add'; });
    });
  }

  /* FAQ */
  function initFAQ() {
    S.qsa('.sorein-faq__question').forEach(function (btn) {
      S.on(btn, 'click', function () {
        var item = btn.closest('.sorein-faq__item');
        var answer = item.querySelector('.sorein-faq__answer');
        var isOpen = item.classList.contains('is-open');
        S.qsa('.sorein-faq__item.is-open').forEach(function (o) {
          if (o !== item) { o.classList.remove('is-open'); o.querySelector('.sorein-faq__answer').style.maxHeight = null; o.querySelector('.sorein-faq__question').setAttribute('aria-expanded', 'false'); }
        });
        if (isOpen) { item.classList.remove('is-open'); answer.style.maxHeight = null; btn.setAttribute('aria-expanded', 'false'); }
        else { item.classList.add('is-open'); answer.style.maxHeight = answer.scrollHeight + 'px'; btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* SCROLL REVEAL */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      S.qsa('.sorein-reveal, [data-stagger]').forEach(function (el) { el.classList.add('is-visible'); }); return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    S.qsa('.sorein-reveal, [data-stagger]').forEach(function (el) { observer.observe(el); });
  }

  /* TABS */
  function initTabs() {
    S.on(document, 'click', function (e) {
      var tab = e.target.closest('[data-tab]'); if (!tab) return;
      var tabId = tab.dataset.tab;
      var container = tab.closest('[data-tabs-container]') || document;
      S.qsa('[data-tab]', container).forEach(function (t) { t.classList.toggle('is-active', t.dataset.tab === tabId); t.setAttribute('aria-selected', String(t.dataset.tab === tabId)); });
      S.qsa('[data-tab-content]', container).forEach(function (p) { p.classList.toggle('is-active', p.dataset.tabContent === tabId); });
    });
  }

  /* PDP */
  function initPDP() {
    var pdp = S.qs('.sorein-pdp'); if (!pdp) return;
    S.qsa('.sorein-pdp__gallery-thumb').forEach(function (thumb) {
      S.on(thumb, 'click', function () {
        var src = thumb.dataset.galleryThumb; var mainImg = S.qs('#sorein-gallery-main-img');
        if (mainImg && src) mainImg.src = src;
        S.qsa('.sorein-pdp__gallery-thumb').forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
      });
    });
    var variantData = [];
    var variantScript = S.qs('#sorein-product-variants-json');
    if (variantScript) { try { variantData = JSON.parse(variantScript.textContent); } catch (e) {} }
    S.on(pdp, 'click', function (e) {
      var btn = e.target.closest('.sorein-variant-btn'); if (!btn) return;
      var group = btn.closest('.sorein-pdp__option-values');
      S.qsa('.sorein-variant-btn', group).forEach(function (b) { b.classList.remove('is-selected'); }); btn.classList.add('is-selected');
      var selectedOpts = {};
      S.qsa('.sorein-variant-btn.is-selected', pdp).forEach(function (b) { selectedOpts['option' + b.dataset.option] = b.dataset.value; });
      var matched = variantData.find(function (v) {
        return Object.keys(selectedOpts).every(function (k) { var pos = parseInt(k.replace('option', ''), 10); return v['option' + pos] === selectedOpts[k]; });
      });
      if (matched) {
        var idInput = S.qs('#sorein-pdp-variant-id'); if (idInput) idInput.value = matched.id;
        var priceEl = S.qs('#sorein-pdp-price .sorein-price__current'); if (priceEl) priceEl.textContent = S.formatSEK(matched.price);
        var addBtn = S.qs('.sorein-pdp__add-btn');
        if (addBtn) { addBtn.disabled = !matched.available; addBtn.textContent = matched.available ? 'Add to Cart' : 'Sold Out'; }
      }
    });
  }

  /* TOAST */
  window.Sorein.showToast = function (msg, type) {
    var toast = S.qs('#sorein-toast'); if (!toast) return;
    toast.textContent = msg; toast.className = 'is-visible' + (type ? ' is-' + type : '');
    clearTimeout(toast._t); toast._t = setTimeout(function () { toast.className = ''; }, 3500);
  };

  /* ORBIT CAROUSEL */
  function initOrbit() {
    S.qsa('[data-orbit-track]').forEach(function (track) {
      var wrapper = track.closest('.sorein-universe__track-wrapper');
      var section = wrapper ? wrapper.parentElement : null;
      var prev = section ? section.querySelector('[data-orbit-prev]') : null;
      var next = section ? section.querySelector('[data-orbit-next]') : null;
      var cardW = (track.querySelector('.sorein-card') || {}).offsetWidth || 320;
      S.on(prev, 'click', function () { track.scrollBy({ left: -(cardW + 20), behavior: 'smooth' }); });
      S.on(next, 'click', function () { track.scrollBy({ left: cardW + 20, behavior: 'smooth' }); });
    });
  }

  /* 3D TILT */
  function initTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    S.qsa('.sorein-card--3d').forEach(function (card) {
      S.on(card, 'mousemove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(800px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-4px)';
      });
      S.on(card, 'mouseleave', function () {
        card.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)'; card.style.transform = '';
        setTimeout(function () { card.style.transition = ''; }, 500);
      });
    });
  }

  /* ENERGY NODES */
  function initEnergyNodes() {
    var first = S.qs('.sorein-energy-node-card');
    if (first) first.classList.add('is-active');
    S.on(document, 'click', function (e) {
      var node = e.target.closest('.sorein-energy-node-card'); if (!node) return;
      var container = node.closest('.sorein-routes-grid');
      S.qsa('.sorein-energy-node-card', container).forEach(function (n) { n.classList.remove('is-active'); });
      node.classList.add('is-active');
      var filter = node.dataset.filter;
      var resultEl = document.querySelector('.sorein-energy-routes__result');
      if (resultEl && node.querySelector('.sorein-energy-node-card__title')) {
        resultEl.textContent = 'Filtering: ' + node.querySelector('.sorein-energy-node-card__title').textContent;
      }
      window.Sorein.filterProducts && window.Sorein.filterProducts(filter);
    });
  }

  /* SPLINE LAZY LOAD */
  function initSpline() {
    S.qsa('[data-spline-url]').forEach(function (container) {
      var url = container.dataset.splineUrl; if (!url) return;
      var loader = container.querySelector('.sorein-spline-loader');
      var observer = new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return; obs.unobserve(container);
        var s = document.createElement('script'); s.type = 'module';
        s.src = 'https://unpkg.com/@splinetool/viewer@1.0.0/build/spline-viewer.js';
        s.onload = function () {
          var viewer = document.createElement('spline-viewer');
          viewer.setAttribute('url', url); viewer.setAttribute('loading-anim', 'false');
          container.appendChild(viewer); if (loader) loader.style.display = 'none';
        };
        document.head.appendChild(s);
      }, { threshold: 0.1 });
      observer.observe(container);
    });
  }

  /* INIT */
  function init() {
    initNav(); initCartDrawer(); initAddToCart(); initFAQ();
    initReveal(); initTabs(); initPDP(); initOrbit();
    initTilt(); initEnergyNodes(); initSpline();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }

})();
