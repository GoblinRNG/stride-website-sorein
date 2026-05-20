/* === SOREIN BUILDER JS === */
(function () {
  'use strict';
  var VAT_RATE = 0.25;

  function fmt(cents) {
    var kr = cents / 100;
    return kr.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function setText(sel, val) { var el = document.querySelector(sel); if (el) el.textContent = val; }

  function init() {
    var script = document.querySelector('[data-builder-products]'); if (!script) return;
    var products;
    try { products = JSON.parse(script.textContent || script.innerText); } catch (e) { showError('Builder config error. Connect products in theme settings.'); return; }
    var battQty = 0, invQty = 0;

    document.querySelectorAll('[data-stepper]').forEach(function (stepper) {
      var minus = stepper.querySelector('[data-stepper-minus]');
      var plus = stepper.querySelector('[data-stepper-plus]');
      var val = stepper.querySelector('[data-stepper-val]');
      if (!minus || !plus || !val) return;
      var min = parseInt(val.min || 0, 10), max = parseInt(val.max || 99, 10);
      minus.addEventListener('click', function () {
        var cur = parseInt(val.value, 10); if (cur > min) { val.value = cur - 1; onStepChange(stepper.dataset.module, cur - 1); }
      });
      plus.addEventListener('click', function () {
        var cur = parseInt(val.value, 10); if (cur < max) { val.value = cur + 1; onStepChange(stepper.dataset.module, cur + 1); }
      });
    });

    function onStepChange(mod, qty) {
      if (mod === 'battery') battQty = qty;
      if (mod === 'inverter') invQty = qty;
      recalculate(); updateStack();
    }

    function recalculate() {
      var b = products.base || {}, bat = products.battery || {}, inv = products.inverter || {}, ch = products.chassis || {};
      var subtotal = (b.price || 0) + battQty * (bat.price || 0) + invQty * (inv.price || 0) + (ch.price || 0);
      var vat = Math.round(subtotal * (VAT_RATE / (1 + VAT_RATE)));
      var excl = subtotal - vat;
      var klarna = Math.round(subtotal / 36);
      var totalGrams = (b.weight_g || 0) + battQty * (bat.weight_g || 0) + invQty * (inv.weight_g || 0) + (ch.weight_g || 0);
      setText('[data-builder-subtotal]', fmt(subtotal));
      setText('[data-builder-excl]', fmt(excl));
      setText('[data-builder-vat]', fmt(vat));
      setText('[data-builder-klarna]', fmt(klarna));
      setText('[data-builder-weight]', (totalGrams / 1000).toFixed(1) + ' kg');
    }

    function updateStack() {
      var stack = document.querySelector('[data-builder-stack]'); if (!stack) return;
      stack.innerHTML = '';
      var layers = [
        { label: (products.chassis && products.chassis.title) || 'Chassis & Frame', cls: 'sorein-module-layer--chassis' },
        { label: (products.base && products.base.title) || 'A6 Base Unit', cls: 'sorein-module-layer--base' }
      ];
      for (var b = 0; b < battQty; b++) layers.push({ label: (products.battery && products.battery.title) || 'Battery Module', cls: 'sorein-module-layer--battery' });
      if (invQty > 0) layers.push({ label: (products.inverter && products.inverter.title) || 'Inverter Module', cls: 'sorein-module-layer--inverter' });
      layers.forEach(function (layer, i) {
        var div = document.createElement('div'); div.className = 'sorein-module-layer ' + layer.cls;
        var span = document.createElement('span'); span.className = 'sorein-module-layer__label'; span.textContent = layer.label;
        div.appendChild(span); stack.appendChild(div);
        setTimeout(function () { div.classList.add('is-present'); }, i * 80);
      });
    }

    function showError(msg) {
      var err = document.querySelector('.sorein-builder__error');
      if (err) { err.textContent = msg; err.classList.add('is-visible'); }
    }

    var addBtn = document.querySelector('[data-builder-add]');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var items = [];
        var b = products.base, bat = products.battery, inv = products.inverter, ch = products.chassis;
        if (b && b.id) items.push({ id: b.id, quantity: 1 });
        if (ch && ch.id) items.push({ id: ch.id, quantity: 1 });
        if (bat && bat.id && battQty > 0) items.push({ id: bat.id, quantity: battQty });
        if (inv && inv.id && invQty > 0) items.push({ id: inv.id, quantity: invQty });
        if (!items.length) { showError('Connect products in theme settings first.'); return; }
        addBtn.disabled = true; addBtn.textContent = 'Adding…';
        fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items }) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.status) { window.Sorein && window.Sorein.showToast && window.Sorein.showToast('Error: ' + (d.description || 'Could not add.'), 'error'); }
            else { window.Sorein && window.Sorein.showToast && window.Sorein.showToast('Configuration added to cart!', 'success'); window.Sorein && window.Sorein.openCart && window.Sorein.openCart(); }
          })
          .catch(function () { window.Sorein && window.Sorein.showToast && window.Sorein.showToast('Something went wrong.', 'error'); })
          .finally(function () { addBtn.disabled = false; addBtn.textContent = 'Add Configuration to Cart'; });
      });
    }

    recalculate(); updateStack();
  }

  window.Sorein = window.Sorein || {};
  window.Sorein.Builder = { init: init };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }

})();
