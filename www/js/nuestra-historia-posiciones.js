(() => {
  'use strict';

  const STORAGE_KEY = 'nh-editor-tarjetas-v1';
  const PAIR_STORAGE_KEY = 'nh-editor-foto-marco-v1';
  const SECTION = '.nuestra-historia[data-vista="nuestra-historia"]';

  let section, overlay, cards = [];
  let geometry = [];
  let pairElements = [];
  let pairBase = [];
  let pairBaseBounds = null;
  let pairGeometry = null;
  let applied = false;

  const style = document.createElement('style');
  style.textContent = `
    .nh-tarjetas-nuevas img[data-nh-posicion="1"] {
      left:var(--nh-ed-left)!important;
      top:var(--nh-ed-top)!important;
      width:var(--nh-ed-width)!important;
      height:var(--nh-ed-height)!important;
    }
    .nh-posicion-pair[data-nh-posicion-pair="1"] {
      position:absolute!important;
      left:var(--nh-pair-left)!important;
      top:var(--nh-pair-top)!important;
      width:var(--nh-pair-width)!important;
      height:var(--nh-pair-height)!important;
      transform:none!important;
    }
  `;
  document.head.appendChild(style);

  function visible(el) {
    return !!el && el.getClientRects().length > 0;
  }

  function applyCard(index) {
    const card = cards[index];
    const g = geometry[index];
    if (!card || !g) return;

    card.dataset.nhPosicion = '1';
    card.style.setProperty('--nh-ed-left', `${g.x}%`);
    card.style.setProperty('--nh-ed-top', `${g.y}%`);
    card.style.setProperty('--nh-ed-width', `${g.w}%`);
    card.style.setProperty('--nh-ed-height', `${g.h}%`);
  }

  function readPairBase() {
    const historia = section.querySelector('.nh-historia');
    if (!historia) return false;

    const box = historia.getBoundingClientRect();

    pairElements = [
      section.querySelector('.nh-foto-principal'),
      section.querySelector('.nh-marco-principal')
    ];

    if (!box.width || !box.height || pairElements.some(el => !el)) return false;

    pairBase = pairElements.map(el => {
      const r = el.getBoundingClientRect();
      return {
        x: (r.left - box.left) / box.width * 100,
        y: (r.top - box.top) / box.height * 100,
        w: r.width / box.width * 100,
        h: r.height / box.height * 100
      };
    });

    const left = Math.min(...pairBase.map(g => g.x));
    const top = Math.min(...pairBase.map(g => g.y));
    const right = Math.max(...pairBase.map(g => g.x + g.w));
    const bottom = Math.max(...pairBase.map(g => g.y + g.h));

    pairBaseBounds = {
      x: left, y: top, w: right - left, h: bottom - top
    };

    pairGeometry = {...pairBaseBounds};
    return true;
  }

  function applyPairGeometry() {
    if (!pairGeometry || !pairBaseBounds || !pairElements.length) return;

    const sx = pairGeometry.w / pairBaseBounds.w;
    const sy = pairGeometry.h / pairBaseBounds.h;

    pairElements.forEach((el, i) => {
      const base = pairBase[i];
      const g = {
        x: pairGeometry.x + (base.x - pairBaseBounds.x) * sx,
        y: pairGeometry.y + (base.y - pairBaseBounds.y) * sy,
        w: base.w * sx,
        h: base.h * sy
      };

      el.classList.add('nh-posicion-pair');
      el.dataset.nhPosicionPair = '1';
      el.style.setProperty('--nh-pair-left', `${g.x}%`);
      el.style.setProperty('--nh-pair-top', `${g.y}%`);
      el.style.setProperty('--nh-pair-width', `${g.w}%`);
      el.style.setProperty('--nh-pair-height', `${g.h}%`);
    });
  }

  function initialize() {
    if (applied) return true;

    section = document.querySelector(SECTION);
    if (!visible(section)) return false;

    overlay = section.querySelector('.nh-tarjetas-nuevas');
    if (!overlay) return false;

    cards = Array.from(overlay.querySelectorAll('img')).slice(0, 5);
    if (cards.length !== 5) return false;

    const box = overlay.getBoundingClientRect();
    if (!box.width || !box.height || !readPairBase()) return false;

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length === 5) {
        geometry = saved.map((g, i) =>
          g && ['x','y','w','h'].every(k => Number.isFinite(g[k]))
            ? {...g}
            : null
        );
      }
    } catch (_) {}

    geometry.forEach((g, i) => {
      if (g) applyCard(i);
    });

    try {
      const savedPair = JSON.parse(localStorage.getItem(PAIR_STORAGE_KEY) || 'null');
      if (savedPair && ['x','y','w','h'].every(k => Number.isFinite(savedPair[k]))) {
        pairGeometry = {...savedPair};
      }
    } catch (_) {}

    applyPairGeometry();
    applied = true;
    observer.disconnect();
    console.log('Nuestra Historia: posiciones guardadas restauradas.');
    return true;
  }

  const observer = new MutationObserver(() => {
    if (!applied) initialize();
  });

  function start() {
    if (initialize()) return;

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    window.addEventListener('load', initialize, {once:true});
    window.addEventListener('resize', () => {
      if (applied) {
        geometry.forEach((g, i) => {
          if (g) applyCard(i);
        });
        applyPairGeometry();
      } else {
        initialize();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }
})();
