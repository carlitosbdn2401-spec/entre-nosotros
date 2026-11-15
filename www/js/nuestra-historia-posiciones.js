(() => {
  'use strict';

  const STORAGE_KEY = 'nh-editor-tarjetas-v1';
  const PAIR_STORAGE_KEY = 'nh-editor-foto-marco-v1';
  const SECTION = '.nuestra-historia[data-vista="nuestra-historia"]';

  const DEFAULT_CARD_GEOMETRY = [
    {x:-1.8421047490862632,y:40.32563647632678,w:54.080725285158096,h:29.463441423880095},
    {x:50.96016821349107,y:40.182277574814364,w:51.71052374543131,h:43.38996377440258},
    {x:-2.4822185193071427,y:68.14841078431864,w:55.68100971071029,h:37.34977130737735},
    {x:50.96016821349107,y:81.43539397280999,w:50.91927471484189,h:22.81955170768504},
    {x:-15.501422127760987,y:103.67230380522707,w:128.19345821229948,h:23.234495403178972}
  ];
  const DEFAULT_PAIR_GEOMETRY = {
    x:5.75746861258544,
    y:15.62783690193539,
    w:88.48328511512793,
    h:25.357003826958184
  };

  let section, overlay, cards = [];
  let geometry = DEFAULT_CARD_GEOMETRY.map(g => ({...g}));
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
    if (!pairGeometry || !pairElements.length) return;

    const historia = section.querySelector('.nh-historia');
    const container = section.querySelector('.nuestra-historia-container');
    if (!historia || !container) return;

    const historiaBox = historia.getBoundingClientRect();
    const containerBox = container.getBoundingClientRect();
    if (!historiaBox.width || !historiaBox.height ||
        !containerBox.width || !containerBox.height) return;

    const g = {
      x: (historiaBox.left - containerBox.left + pairGeometry.x / 100 * historiaBox.width) / containerBox.width * 100,
      y: (historiaBox.top - containerBox.top + pairGeometry.y / 100 * historiaBox.height) / containerBox.height * 100,
      w: (pairGeometry.w / 100 * historiaBox.width) / containerBox.width * 100,
      h: (pairGeometry.h / 100 * historiaBox.height) / containerBox.height * 100
    };

    pairElements.forEach(el => {
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

    geometry = DEFAULT_CARD_GEOMETRY.map(g => ({...g}));
    pairGeometry = {...DEFAULT_PAIR_GEOMETRY};

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length === 5) {
        saved.forEach((g, i) => {
          if (g && ['x','y','w','h'].every(k => Number.isFinite(g[k]))) {
            geometry[i] = {...g};
          }
        });
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
