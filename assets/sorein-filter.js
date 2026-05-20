/* === SOREIN LIVE PRODUCT FILTER JS === */
(function () {
  'use strict';

  var activeFilter = 'all';
  var products = [];

  function init() {
    var dataScript = document.querySelector('[data-filter-products]');
    var grid = document.querySelector('[data-filter-grid]');
    var filterBar = document.querySelector('[data-filter-bar]');
    if (!dataScript || !grid) return;

    try { products = JSON.parse(dataScript.textContent || dataScript.innerText); }
    catch (e) { return; }

    filterBar && filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      activeFilter = btn.dataset.filter || 'all';
      document.querySelectorAll('[data-filter]').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.filter === activeFilter);
      });
      renderFiltered();
    });

    // mark first button active
    var firstBtn = document.querySelector('[data-filter="all"]');
    if (firstBtn) firstBtn.classList.add('is-active');
  }

  function renderFiltered() {
    var grid = document.querySelector('[data-filter-grid]');
    var empty = document.querySelector('.sorein-filter-empty');
    if (!grid) return;

    var filtered = activeFilter === 'all'
      ? products
      : products.filter(function (p) {
          return p.tags && p.tags.some(function (t) { return t.toLowerCase().replace(/\s+/g, '-') === activeFilter.toLowerCase(); });
        });

    // Animate out
    var cards = Array.from(grid.querySelectorAll('.sorein-card'));
    cards.forEach(function (card) { card.classList.add('is-filtering-out'); });

    setTimeout(function () {
      grid.innerHTML = '';
      if (filtered.length === 0) {
        if (empty) empty.classList.add('is-visible');
        return;
      }
      if (empty) empty.classList.remove('is-visible');

      filtered.forEach(function (product, i) {
        var card = buildCard(product);
        card.style.animationDelay = (i * 0.05) + 's';
        card.classList.add('is-filtering-in');
        grid.appendChild(card);
      });
    }, 200);
  }

  function buildCard(p) {
    var card = document.createElement('div');
    card.className = 'sorein-card sorein-card--3d';
    card.setAttribute('data-product-id', p.id);

    // image link
    var imgLink = document.createElement('a');
    imgLink.href = p.url;
    imgLink.className = 'sorein-card__img-link';
    imgLink.setAttribute('tabindex', '-1');
    imgLink.setAttribute('aria-hidden', 'true');

    var imgWrap = document.createElement('div');
    imgWrap.className = 'sorein-card__img-wrap';

    if (p.image) {
      var img = document.createElement('img');
      img.src = p.image;
      img.alt = p.title;
      img.className = 'sorein-card__img';
      img.loading = 'lazy';
      img.width = 600; img.height = 600;
      imgWrap.appendChild(img);
    } else {
      var placeholder = document.createElement('div');
      placeholder.className = 'sorein-card__img-placeholder';
      placeholder.innerHTML = '<svg class="sorein-icon" width="48" height="48" viewBox="0 0 24 24"><use href="#icon-battery"></use></svg>';
      imgWrap.appendChild(placeholder);
    }

    if (!p.available) {
      var badge = document.createElement('div');
      badge.className = 'sorein-card__badge sorein-card__badge--sold-out';
      badge.textContent = 'Sold Out';
      imgWrap.appendChild(badge);
    }

    imgLink.appendChild(imgWrap);
    card.appendChild(imgLink);

    // body
    var body = document.createElement('div');
    body.className = 'sorein-card__body';

    var titleEl = document.createElement('h3');
    titleEl.className = 'sorein-card__title';
    var titleLink = document.createElement('a');
    titleLink.href = p.url;
    titleLink.className = 'sorein-card__title-link';
    titleLink.textContent = p.title;
    titleEl.appendChild(titleLink);
    body.appendChild(titleEl);

    var priceWrap = document.createElement('div');
    priceWrap.className = 'sorein-card__price sorein-price';
    if (p.compare_at_price && p.compare_at_price > p.price) {
      var compareEl = document.createElement('s');
      compareEl.className = 'sorein-price__compare';
      compareEl.textContent = formatSEK(p.compare_at_price);
      priceWrap.appendChild(compareEl);
    }
    var priceEl = document.createElement('span');
    priceEl.className = 'sorein-price__current' + (p.compare_at_price > p.price ? ' sorein-price__current--sale' : '');
    priceEl.textContent = formatSEK(p.price);
    priceWrap.appendChild(priceEl);
    body.appendChild(priceWrap);

    var actions = document.createElement('div');
    actions.className = 'sorein-card__actions';
    var qaBtn = document.createElement('button');
    qaBtn.className = 'sorein-card__quick-add';
    qaBtn.textContent = p.available ? 'Quick Add' : 'Sold Out';
    qaBtn.disabled = !p.available;
    if (p.available && p.variant_id) {
      qaBtn.setAttribute('data-quick-add', '');
      qaBtn.setAttribute('data-variant-id', p.variant_id);
    }
    var viewBtn = document.createElement('a');
    viewBtn.href = p.url;
    viewBtn.className = 'sorein-btn sorein-btn--ghost sorein-btn--sm';
    viewBtn.textContent = 'View';
    actions.appendChild(qaBtn);
    actions.appendChild(viewBtn);
    body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  function formatSEK(cents) {
    var kr = cents / 100;
    return kr.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  window.Sorein = window.Sorein || {};
  window.Sorein.filterProducts = function (filter) {
    activeFilter = filter || 'all';
    // sync buttons if any
    document.querySelectorAll('[data-filter]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.filter === activeFilter);
    });
    renderFiltered();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
