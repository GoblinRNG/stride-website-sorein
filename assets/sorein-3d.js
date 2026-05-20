/* ============================================
   SOREIN — sorein-3d.js
   Namespaced. No global pollution.
   ============================================ */
;(function (window, document) {
  'use strict';

  window.Sorein = window.Sorein || {};

  /* ── Utils ─────────────────────────────── */
  const S = {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isLowPower: navigator.hardwareConcurrency <= 2,

    formatSEK(amount) {
      // amount is in cents (Shopify money in subunits)
      const kr = amount / 100;
      return kr.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },

    qs(sel, ctx = document) { return ctx.querySelector(sel); },
    qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); },

    on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); },

    debounce(fn, delay = 120) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    },

    observeReveal() {
      if (!('IntersectionObserver' in window)) {
        S.qsa('.sorein-reveal').forEach(el => el.classList.add('is-visible'));
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      S.qsa('.sorein-reveal').forEach(el => io.observe(el));
    },

    showToast(msg, type = 'success') {
      let toast = S.qs('#sorein-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sorein-toast';
        toast.className = 'sorein-toast';
        toast.innerHTML = `<span class="sorein-toast__icon">${type === 'success' ? '✓' : '⚠'}</span><span class="sorein-toast__msg"></span>`;
        document.body.appendChild(toast);
      }
      toast.querySelector('.sorein-toast__msg').textContent = msg;
      toast.classList.add('is-visible');
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(() => toast.classList.remove('is-visible'), 3400);
    },
  };

  /* ── Nav scroll state ───────────────────── */
  function initNav() {
    const nav = S.qs('.sorein-nav');
    if (!nav) return;
    let ticking = false;
    const update = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    };
    S.on(window, 'scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    // Mobile menu
    const btn = S.qs('.sorein-nav__menu-btn');
    const mobile = S.qs('.sorein-nav__mobile');
    if (btn && mobile) {
      S.on(btn, 'click', () => {
        const open = mobile.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        mobile.setAttribute('aria-hidden', String(!open));
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }
  }

  /* ── Announcement countdown ─────────────── */
  function initAnnouncement() {
    const countdown = S.qs('.sorein-announcement__countdown[data-end]');
    if (!countdown) return;
    const endDate = new Date(countdown.dataset.end);
    if (isNaN(endDate.getTime())) return;
    const tick = () => {
      const diff = endDate - Date.now();
      if (diff <= 0) { countdown.textContent = 'Offer ended'; return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      countdown.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── Hero 3D / Tilt ─────────────────────── */
  function initHero(section) {
    if (!section || S.prefersReducedMotion) return;
    const visual = S.qs('.sorein-hero__visual', section);
    if (!visual) return;

    // Subtle pointer-follow tilt on the stack
    const stack = S.qs('.sorein-stack-3d', visual);
    if (!stack || S.isLowPower) return;

    let raf;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = visual.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = (clientX - cx) / (rect.width / 2);
        const dy = (clientY - cy) / (rect.height / 2);
        stack.style.transform = `rotateX(${8 - dy * 5}deg) rotateY(${-12 + dx * 8}deg)`;
        raf = null;
      });
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      stack.style.transform = '';
    };
    S.on(section, 'mousemove', onMove, { passive: true });
    S.on(section, 'mouseleave', onLeave);

    // Three.js lazy load — optional enhancement
    tryLoadThreeHero(section);
  }

  function tryLoadThreeHero(section) {
    if (S.prefersReducedMotion || S.isLowPower) return;
    const canvas = S.qs('#sorein-hero-canvas', section);
    if (!canvas) return;
    const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
    import(CDN).then(THREE => {
      buildThreeScene(THREE, canvas, section);
    }).catch(() => {
      // CSS fallback remains visible
    });
  }

  function buildThreeScene(THREE, canvas, section) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x00c9a7, 1.2);
    dirLight.position.set(2, 3, 3);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0x4fc3f7, 0.4);
    rimLight.position.set(-3, -1, 2);
    scene.add(rimLight);

    const mat = new THREE.MeshStandardMaterial({ color: 0x1a2744, roughness: 0.35, metalness: 0.7 });
    const matBatt = new THREE.MeshStandardMaterial({ color: 0x232c40, roughness: 0.3, metalness: 0.75 });
    const matInv = new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.3, metalness: 0.8 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.2, 1, 1, 1), mat);
    base.position.y = -1;
    const batt = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 1.0), matBatt);
    batt.position.y = 0.1;
    const inv = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.9), matInv);
    inv.position.y = 1.05;

    // Chamfer edges via group
    const group = new THREE.Group();
    group.add(base, batt, inv);
    group.rotation.y = -0.3;
    group.rotation.x = 0.1;
    scene.add(group);

    // Teal accent ring
    const ringGeo = new THREE.TorusGeometry(1.5, 0.012, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00c9a7, opacity: 0.5, transparent: true });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.4;
    scene.add(ring);

    let t = 0;
    let alive = true;
    const animate = () => {
      if (!alive) return;
      requestAnimationFrame(animate);
      t += 0.008;
      group.position.y = Math.sin(t) * 0.12;
      group.rotation.y = -0.3 + Math.sin(t * 0.5) * 0.1;
      ring.rotation.z = t * 0.3;
      ring.material.opacity = 0.3 + Math.sin(t * 2) * 0.15;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = S.debounce(() => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }, 200);
    S.on(window, 'resize', onResize);

    // Cleanup when section is removed by the theme editor
    document.addEventListener('shopify:section:unload', (e) => {
      if (e.target.contains(canvas)) { alive = false; renderer.dispose(); }
    }, { once: true });

    // Hide CSS fallback stack
    const cssStack = S.qs('.sorein-stack-3d', section);
    if (cssStack) { cssStack.style.opacity = '0'; cssStack.style.pointerEvents = 'none'; }
  }

  /* ── Product Card Tilt ──────────────────── */
  function initCardTilts(container = document) {
    if (S.prefersReducedMotion || S.isLowPower) return;
    S.qsa('.sorein-product-card', container).forEach(card => {
      let raf;
      S.on(card, 'mousemove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) translateY(-6px)`;
          raf = null;
        });
      }, { passive: true });
      S.on(card, 'mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        card.style.transform = '';
      });
    });
  }

  /* ── Orbit Track nav buttons ────────────── */
  function initOrbit(section) {
    if (!section) return;
    const track = S.qs('.sorein-orbit__track', section);
    const prevBtn = S.qs('[data-orbit-prev]', section);
    const nextBtn = S.qs('[data-orbit-next]', section);
    if (!track) return;
    const scroll = (dir) => {
      const cardW = track.querySelector('.sorein-product-card')?.offsetWidth || 320;
      track.scrollBy({ left: cardW * 2 * dir, behavior: 'smooth' });
    };
    S.on(prevBtn, 'click', () => scroll(-1));
    S.on(nextBtn, 'click', () => scroll(1));
  }

  /* ── Solar panel unfold on scroll ──────── */
  function initSolarFold(section) {
    if (!section || S.prefersReducedMotion) return;
    if (!('IntersectionObserver' in window)) return;
    const cards = S.qsa('.sorein-solar-panel-card', section);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('is-unfolded'), 300);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    cards.forEach(c => io.observe(c));
  }

  /* ── Solar Estimator ────────────────────── */
  function initSolarEstimator(section) {
    if (!section) return;
    const battSelect = S.qs('[data-estimator-battery]', section);
    const panelSelect = S.qs('[data-estimator-panel]', section);
    const barFill0to80 = S.qs('[data-bar-0to80]', section);
    const barFill80to100 = S.qs('[data-bar-80to100]', section);
    const time0to80 = S.qs('[data-time-0to80]', section);
    const time80to100 = S.qs('[data-time-80to100]', section);
    if (!battSelect || !panelSelect || !barFill0to80) return;

    const NET_EFF = 0.63;

    const calc = () => {
      const battWh = parseFloat(battSelect.value) || 1152;
      const panelW = parseFloat(panelSelect.value) || 200;
      const effectiveW = panelW * NET_EFF;
      const target80 = battWh * 0.8;
      const h0to80 = target80 / effectiveW;
      const h80to100 = (battWh * 0.2) / (effectiveW * 0.5); // taper speed at top-off
      const pct0to80 = Math.min(100, (1 / (1 + h0to80 / 3)) * 100);
      const pct80to100 = Math.min(100, pct0to80 * 0.4);

      const fmt = (h) => {
        if (h < 1) return `~${Math.round(h * 60)} min`;
        return `~${h.toFixed(1)} hrs`;
      };

      if (barFill0to80) barFill0to80.style.width = pct0to80.toFixed(1) + '%';
      if (barFill80to100) barFill80to100.style.width = pct80to100.toFixed(1) + '%';
      if (time0to80) time0to80.textContent = `Estimated time: ${fmt(h0to80)} (0–80%)`;
      if (time80to100) time80to100.textContent = `Estimated time: ${fmt(h80to100)} (80–100% top-off)`;
    };

    S.on(battSelect, 'change', calc);
    S.on(panelSelect, 'change', calc);
    calc();
  }

  /* ── A6 Builder ─────────────────────────── */
  function initBuilder(section) {
    if (!section) return;

    // Read product data exported by Liquid into script tag
    const dataEl = S.qs('[data-builder-products]', section);
    if (!dataEl) return;
    let products;
    try { products = JSON.parse(dataEl.textContent); } catch (e) { return; }

    const VAT = (parseFloat(section.dataset.vat) || 25) / 100;
    const MAX_BATT = parseInt(section.dataset.maxBatteries, 10) || 4;
    const MAX_INV = parseInt(section.dataset.maxInverters, 10) || 3;

    // State
    let state = {
      batteryQty: 0,
      inverterQty: 0,
      chassisVariantId: null,
    };

    // DOM refs
    const battPriceLine = S.qs('[data-builder-price="battery"]', section);
    const battStepPrice = S.qs('[data-step-price="battery"]', section);
    const invPriceLine = S.qs('[data-builder-price="inverter"]', section);
    const invStepPrice = S.qs('[data-step-price="inverter"]', section);
    const chassisOptions = S.qsa('[data-chassis-option]', section);
    const topPriceEl = S.qs('[data-builder-total-top]', section);
    const subtotalEl = S.qs('[data-builder-subtotal]', section);
    const vatEl = S.qs('[data-builder-vat]', section);
    const totalEl = S.qs('[data-builder-total]', section);
    const klarnaPerMonth = S.qs('[data-klarna-monthly]', section);
    const addBtn = S.qs('[data-builder-add-btn]', section);
    const errorEl = S.qs('[data-builder-error]', section);
    const weightEl = S.qs('[data-builder-weight]', section);
    const stackContainer = S.qs('[data-builder-stack]', section);

    // Get price from products object (in cents)
    const getVariantPrice = (handle, variantId = null) => {
      const p = products[handle];
      if (!p) return 0;
      if (variantId) {
        const v = p.variants.find(v => v.id === variantId);
        return v ? v.price : (p.variants[0]?.price || 0);
      }
      return p.variants[0]?.price || p.price || 0;
    };

    const getVariantWeight = (handle, variantId = null) => {
      const p = products[handle];
      if (!p) return 0;
      if (variantId) {
        const v = p.variants.find(v => v.id === variantId);
        return v ? (v.weight || 0) : (p.variants[0]?.weight || 0);
      }
      return p.variants[0]?.weight || 0;
    };

    const getVariantId = (handle, idx = 0) => {
      const p = products[handle];
      return p?.variants?.[idx]?.id || null;
    };

    // Default chassis to first option
    const chassisHandle = section.dataset.handleChassis;
    if (chassisOptions.length > 0) {
      const firstInput = S.qs('input', chassisOptions[0]);
      if (firstInput) {
        firstInput.checked = true;
        state.chassisVariantId = firstInput.value ? parseInt(firstInput.value, 10) : getVariantId(chassisHandle, 0);
      }
    }

    function recalc() {
      const baseHandle = section.dataset.handleBase;
      const battHandle = section.dataset.handleBattery;
      const invHandle = section.dataset.handleInverter;

      const basePrice = getVariantPrice(baseHandle);
      const battUnitPrice = getVariantPrice(battHandle);
      const invUnitPrice = getVariantPrice(invHandle);
      const chassisPrice = state.chassisVariantId
        ? getVariantPrice(chassisHandle, state.chassisVariantId)
        : getVariantPrice(chassisHandle);

      const baseTotal = basePrice;
      const battTotal = battUnitPrice * state.batteryQty;
      const invTotal = invUnitPrice * state.inverterQty;
      const chassisTotal = chassisPrice;

      const lineSum = baseTotal + battTotal + invTotal + chassisTotal;
      // Prices include VAT in Sweden — extract the VAT component from the inclusive total
      const vat = Math.round(lineSum * (VAT / (1 + VAT)));
      const total = lineSum;

      // Update line prices
      if (battPriceLine) battPriceLine.textContent = state.batteryQty > 0 ? S.formatSEK(battTotal) : '—';
      if (battStepPrice) battStepPrice.textContent = battUnitPrice > 0 ? `${S.formatSEK(battUnitPrice)} / unit` : '';
      if (invPriceLine) invPriceLine.textContent = state.inverterQty > 0 ? S.formatSEK(invTotal) : '—';
      if (invStepPrice) invStepPrice.textContent = invUnitPrice > 0 ? `${S.formatSEK(invUnitPrice)} / unit` : '';

      // Update summary
      if (subtotalEl) subtotalEl.textContent = S.formatSEK(lineSum);
      if (vatEl) vatEl.textContent = S.formatSEK(vat);
      if (totalEl) totalEl.textContent = S.formatSEK(total);
      if (topPriceEl) topPriceEl.textContent = S.formatSEK(total);
      if (klarnaPerMonth) {
        // total is in cents; divide by 100 to get SEK, then by 36 months
        const monthlyCents = Math.round(total / 36);
        klarnaPerMonth.textContent = S.formatSEK(monthlyCents);
      }

      // Weight (stored in grams, display in kg)
      const baseW = getVariantWeight(baseHandle);
      const battW = getVariantWeight(battHandle) * state.batteryQty;
      const invW = getVariantWeight(invHandle) * state.inverterQty;
      const chassisW = getVariantWeight(chassisHandle);
      const totalGrams = baseW + battW + invW + chassisW;
      const totalKg = (totalGrams / 1000).toFixed(1);
      if (weightEl) weightEl.textContent = totalKg;

      updateStack();
    }

    function makeModuleEl(stackType, modClass, labelText, nameText) {
      const el = document.createElement('div');
      el.className = `sorein-builder-module ${modClass}`;
      el.dataset.stackModule = stackType;
      const label = document.createElement('div');
      label.className = 'sorein-builder-module__label';
      label.textContent = labelText;
      const name = document.createElement('div');
      name.className = 'sorein-builder-module__name';
      name.textContent = nameText;
      const qty = document.createElement('span');
      qty.className = 'sorein-builder-module__qty';
      qty.textContent = '×1';
      const glow = document.createElement('div');
      glow.className = 'sorein-builder-module__glow';
      el.append(label, name, qty, glow);
      return el;
    }

    function updateStack() {
      if (!stackContainer) return;
      // Battery modules
      const existingBatts = S.qsa('[data-stack-module="battery"]', stackContainer);
      const existingInvs = S.qsa('[data-stack-module="inverter"]', stackContainer);

      // Remove excess
      existingBatts.slice(state.batteryQty).forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        setTimeout(() => el.remove(), 300);
      });
      existingInvs.slice(state.inverterQty).forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        setTimeout(() => el.remove(), 300);
      });

      // Add missing batteries
      const battHandle = section.dataset.handleBattery;
      const invHandle = section.dataset.handleInverter;
      const baseModule = S.qs('[data-stack-module="base"]', stackContainer);

      for (let i = existingBatts.length; i < state.batteryQty; i++) {
        const el = makeModuleEl('battery', 'sorein-builder-module--battery',
          'Expansion Battery', products[battHandle]?.title || 'EB210 Battery Module');
        if (baseModule) { stackContainer.insertBefore(el, baseModule); }
        else { stackContainer.appendChild(el); }
      }

      // Add missing inverters — inserted below batteries (closer to base)
      for (let i = existingInvs.length; i < state.inverterQty; i++) {
        const firstBatt = S.qs('[data-stack-module="battery"]', stackContainer);
        const anchor = firstBatt || baseModule;
        const el = makeModuleEl('inverter', 'sorein-builder-module--inverter',
          'Inverter', products[invHandle]?.title || 'Extra Inverter');
        if (anchor) { stackContainer.insertBefore(el, anchor); }
        else { stackContainer.appendChild(el); }
      }
    }

    // Qty steppers
    S.qsa('[data-builder-stepper]', section).forEach(stepper => {
      const target = stepper.dataset.builderStepper;
      const minusBtn = S.qs('[data-stepper-minus]', stepper);
      const plusBtn = S.qs('[data-stepper-plus]', stepper);
      const valEl = S.qs('[data-stepper-val]', stepper);
      const max = target === 'battery' ? MAX_BATT : MAX_INV;
      const min = 0;

      const update = (newVal) => {
        newVal = Math.max(min, Math.min(max, newVal));
        state[target + 'Qty'] = newVal;
        if (valEl) valEl.textContent = newVal;
        if (minusBtn) minusBtn.disabled = newVal <= min;
        if (plusBtn) plusBtn.disabled = newVal >= max;
        recalc();
      };

      S.on(minusBtn, 'click', () => update(state[target + 'Qty'] - 1));
      S.on(plusBtn, 'click', () => update(state[target + 'Qty'] + 1));
      update(state[target + 'Qty']); // init
    });

    // Chassis selection
    chassisOptions.forEach(opt => {
      const input = S.qs('input', opt);
      S.on(input, 'change', () => {
        state.chassisVariantId = input.value ? parseInt(input.value, 10) : null;
        recalc();
      });
    });

    // Add to cart
    S.on(addBtn, 'click', async () => {
      if (addBtn.disabled) return;
      if (errorEl) { errorEl.classList.remove('is-visible'); }

      const baseHandle = section.dataset.handleBase;
      const battHandle = section.dataset.handleBattery;
      const invHandle = section.dataset.handleInverter;

      const items = [];
      const baseId = getVariantId(baseHandle);
      if (!baseId) { showError('Base unit unavailable. Please try again.'); return; }
      items.push({ id: baseId, quantity: 1 });

      if (state.batteryQty > 0) {
        const battId = getVariantId(battHandle);
        if (!battId) { showError('Battery module variant unavailable.'); return; }
        items.push({ id: battId, quantity: state.batteryQty });
      }

      if (state.inverterQty > 0) {
        const invId = getVariantId(invHandle);
        if (!invId) { showError('Inverter variant unavailable.'); return; }
        items.push({ id: invId, quantity: state.inverterQty });
      }

      if (state.chassisVariantId) {
        items.push({ id: state.chassisVariantId, quantity: 1 });
      }

      addBtn.disabled = true;
      const origText = addBtn.innerHTML;
      addBtn.innerHTML = '<span class="sorein-spinner"></span> Adding to cart…';

      try {
        const cartUrl = window.Sorein?.routes?.cart_add_url || '/cart/add.js';
        const res = await fetch(cartUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ items }),
        });
        if (!res.ok) throw new Error('Cart error');
        S.showToast('System added to cart!');
        // Optionally update cart count
        updateCartCount();
      } catch (err) {
        showError('Could not add to cart. Please refresh and try again.');
      } finally {
        addBtn.disabled = false;
        addBtn.innerHTML = origText;
      }
    });

    function showError(msg) {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.classList.add('is-visible');
    }

    recalc(); // initial render
  }

  /* ── Product Page ATC ───────────────────── */
  function initPDP(section) {
    if (!section) return;
    const addBtn = S.qs('[data-pdp-add-btn]', section);
    const variantBtns = S.qsa('[data-variant-btn]', section);
    const priceEl = S.qs('[data-pdp-price]', section);
    const comparePriceEl = S.qs('[data-pdp-compare-price]', section);
    const thumbs = S.qsa('.sorein-pdp__thumb', section);
    const mainImg = S.qs('.sorein-pdp__main-img img', section);
    let selectedVariantId = null;

    // Variant switching
    variantBtns.forEach(btn => {
      S.on(btn, 'click', () => {
        variantBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        selectedVariantId = parseInt(btn.dataset.variantId, 10);
        if (priceEl) priceEl.textContent = S.formatSEK(parseInt(btn.dataset.variantPrice, 10));
        if (comparePriceEl && btn.dataset.variantCompare) {
          comparePriceEl.textContent = S.formatSEK(parseInt(btn.dataset.variantCompare, 10));
          comparePriceEl.hidden = false;
        } else if (comparePriceEl) {
          comparePriceEl.hidden = true;
        }
      });
    });

    // Init first variant
    if (variantBtns[0]) variantBtns[0].click();

    // Thumbnails
    thumbs.forEach(thumb => {
      S.on(thumb, 'click', () => {
        thumbs.forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
        if (mainImg && thumb.dataset.src) { mainImg.src = thumb.dataset.src; }
      });
    });

    // Add to cart
    S.on(addBtn, 'click', async () => {
      if (!selectedVariantId || addBtn.disabled) return;
      addBtn.disabled = true;
      const origText = addBtn.textContent;
      addBtn.textContent = 'Adding…';
      try {
        const cartUrl = window.Sorein?.routes?.cart_add_url || '/cart/add.js';
        const res = await fetch(cartUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ id: selectedVariantId, quantity: 1 }),
        });
        if (!res.ok) throw new Error();
        S.showToast('Added to cart!');
        updateCartCount();
      } catch {
        S.showToast('Could not add to cart. Please try again.', 'error');
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = origText;
      }
    });
  }

  /* ── Cart count update ──────────────────── */
  async function updateCartCount() {
    try {
      const res = await fetch('/cart.js', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const data = await res.json();
      const countEls = S.qsa('.sorein-nav__cart-count');
      countEls.forEach(el => {
        el.textContent = data.item_count;
        el.hidden = data.item_count === 0;
      });
    } catch { /* silent */ }
  }

  /* ── Comparison matrix tab ──────────────── */
  function initCompare(section) {
    if (!section) return;
    const rows = S.qsa('tbody tr', section);
    rows.forEach(row => {
      S.on(row, 'mouseenter', () => row.classList.add('is-hovered'));
      S.on(row, 'mouseleave', () => row.classList.remove('is-hovered'));
    });
  }

  /* ── Init all sections ──────────────────── */
  function initSection(section) {
    const type = section.dataset.sectionType;
    switch (type) {
      case 'sorein-hero-3d':       initHero(section); break;
      case 'sorein-product-orbit': initOrbit(section); initCardTilts(section); break;
      case 'sorein-featured-systems': initCardTilts(section); break;
      case 'sorein-a6-builder-3d': initBuilder(section); break;
      case 'sorein-solar-panels':  initSolarFold(section); initSolarEstimator(section); break;
      case 'sorein-comparison-matrix': initCompare(section); break;
    }
  }

  /* ── Boot ───────────────────────────────── */
  function boot() {
    initNav();
    initAnnouncement();
    S.observeReveal();
    S.qsa('[data-section-type]').forEach(initSection);
    // PDP
    const pdp = S.qs('[data-pdp-section]');
    if (pdp) initPDP(pdp);
    updateCartCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Shopify theme editor live reload
  document.addEventListener('shopify:section:load', (e) => {
    const section = e.target;
    initSection(section);
    S.observeReveal();
    initCardTilts(section);
  });

  // Expose for debugging
  window.Sorein._utils = S;

})(window, document);
