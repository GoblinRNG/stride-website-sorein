/* === SOREIN ENERGY GRID ANIMATION JS === */
(function () {
  'use strict';

  /* Animates CSS 3D energy grid, floating labels, and hero parallax */

  function initEnergyGrid() {
    var hero = document.querySelector('.sorein-hero');
    if (!hero) return;

    // Floating label animations (stagger in)
    var labels = document.querySelectorAll('.sorein-hero__label');
    labels.forEach(function (label, i) {
      label.style.opacity = '0';
      label.style.transform = 'translateY(10px)';
      setTimeout(function () {
        label.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        label.style.opacity = '1';
        label.style.transform = 'translateY(0)';
      }, 800 + i * 150);
    });

    // Hero parallax on scroll
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      var heroModule = document.querySelector('.sorein-hero__module-3d');
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            if (heroModule) {
              var offset = window.scrollY * 0.2;
              heroModule.style.transform = 'translateY(' + offset + 'px)';
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    // Energy ring creation
    var energyBg = document.querySelector('.sorein-energy-grid-bg');
    if (energyBg) {
      [0, 1, 2].forEach(function (i) {
        var ring = document.createElement('div');
        ring.className = 'sorein-ring';
        var size = 200 + i * 120;
        ring.style.cssText = [
          'width:' + size + 'px',
          'height:' + size + 'px',
          'top:calc(50% - ' + (size / 2) + 'px)',
          'left:calc(60% - ' + (size / 2) + 'px)',
          'animation-delay:' + (i * 1) + 's'
        ].join(';');
        energyBg.appendChild(ring);
      });
    }
  }

  function initSolarVis() {
    var vis = document.querySelector('.sorein-solar__vis');
    if (!vis) return;

    // Sun element
    var sun = document.createElement('div');
    sun.className = 'sorein-solar__sun';
    vis.appendChild(sun);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var fill = vis.querySelector('.sorein-solar__charge-fill');
        if (entry.isIntersecting) {
          // trigger charge fill animation
          if (fill) fill.style.width = '60%';
        }
      });
    }, { threshold: 0.4 });
    observer.observe(vis);
  }

  function initTechReveal() {
    var cards = document.querySelectorAll('.sorein-tech-card');
    if (!cards.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    cards.forEach(function (card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      observer.observe(card);
    });

    // hack to add visible transition
    document.addEventListener('sorein:tech-visible', function (e) {
      var card = e.detail;
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  }

  function init() {
    initEnergyGrid();
    initSolarVis();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Sorein = window.Sorein || {};
  window.Sorein.EnergyGrid = { init: init };

})();
