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
  let selected = -1;
  let step = 1;
  let mode = 'mover';
  let editing = false;
  let panel, toggle, status;

  const style = document.createElement('style');
  style.textContent = `
    .nh-tarjetas-nuevas img[data-nh-editor="1"] {
      left:var(--nh-ed-left)!important;
      top:var(--nh-ed-top)!important;
      width:var(--nh-ed-width)!important;
      height:var(--nh-ed-height)!important;
    }
    .nh-editor-pair[data-nh-editor-pair="1"] {
      position:absolute!important;
      left:var(--nh-pair-left)!important;
      top:var(--nh-pair-top)!important;
      width:var(--nh-pair-width)!important;
      height:var(--nh-pair-height)!important;
      transform:none!important;
    }
    body.nh-editor-active .nh-foto-principal,
    body.nh-editor-active .nh-marco-principal {
      pointer-events:auto!important;
      cursor:pointer!important;
    }
    .nh-editor-toggle {
      position:fixed;right:12px;bottom:95px;z-index:99998;
      border:1px solid #f7d9a5;border-radius:24px;
      padding:11px 17px;background:linear-gradient(145deg,#8b2945,#40101f);
      color:#fff0d5;font-family:'Great Vibes',cursive;font-size:20px;
      box-shadow:0 3px 12px #0009, inset 0 1px 2px #ffffff55;
    }
    .nh-editor-panel {
      position:fixed;left:50%;bottom:12px;transform:translateX(-50%);
      width:min(94vw,390px);z-index:99999;box-sizing:border-box;
      padding:12px;border:1px solid #d8b875;border-radius:17px;
      background:linear-gradient(145deg,#28121b,#10090d);
      color:#f8e9df;box-shadow:0 5px 25px #000c;
      font-family:'Great Vibes',cursive;
    }
    .nh-editor-panel[hidden],.nh-editor-toggle[hidden]{display:none!important}
    .nh-editor-title{text-align:center;color:#f7d9a5;font-size:23px;margin-bottom:8px}
    .nh-editor-status{text-align:center;font-size:19px;margin:5px 0 9px}
    .nh-editor-row{display:flex;justify-content:center;gap:7px;margin:7px 0}
    .nh-editor-panel button{
      min-height:38px;min-width:42px;padding:6px 11px;
      border:1px solid #d8b875;border-radius:10px;
      color:#fff0d5;background:linear-gradient(145deg,#76243c,#35101e);
      box-shadow:inset 0 1px 2px #ffffff35,0 2px 5px #0008;
      font-family:'Great Vibes',cursive;font-size:19px;
    }
    .nh-editor-panel button.active{
      background:linear-gradient(145deg,#d6b46b,#89632e);
      color:#241018;border-color:#fff0bd;
    }
    .nh-editor-arrows{display:grid;grid-template-columns:repeat(3,48px);gap:6px;justify-content:center}
    .nh-editor-arrows button{font-family:sans-serif;font-size:20px}
    .nh-editor-save{min-width:130px!important;background:linear-gradient(145deg,#c9a65c,#80602d)!important;color:#241018!important}
    .nh-editor-close{position:absolute;right:9px;top:8px;min-width:34px!important}
    .nh-editor-panel button:disabled{opacity:.4}
    .nh-editor-selected{outline:2px dashed #f7d9a5;outline-offset:2px}
  `;
  document.head.appendChild(style);

  function visible(el) {
    return !!el && el.getClientRects().length > 0;
  }

  function readGeometry() {
    const box = overlay.getBoundingClientRect();
    if (!box.width || !box.height) return false;

    geometry = cards.map(card => {
      const r = card.getBoundingClientRect();
      return {
        x: (r.left - box.left) / box.width * 100,
        y: (r.top - box.top) / box.height * 100,
        w: r.width / box.width * 100,
        h: r.height / box.height * 100
      };
    });
    return true;
  }

  function applyGeometry(index) {
    const card = cards[index];
    const g = geometry[index];
    if (!card || !g) return;

    card.dataset.nhEditor = '1';
    card.style.setProperty('--nh-ed-left', `${g.x}%`);
    card.style.setProperty('--nh-ed-top', `${g.y}%`);
    card.style.setProperty('--nh-ed-width', `${g.w}%`);
    card.style.setProperty('--nh-ed-height', `${g.h}%`);
  }

  function readPairBase() {
    const box = section.querySelector('.nh-historia').getBoundingClientRect();
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

      el.classList.add('nh-editor-pair');
      el.dataset.nhEditorPair = '1';
      el.style.setProperty('--nh-pair-left', `${g.x}%`);
      el.style.setProperty('--nh-pair-top', `${g.y}%`);
      el.style.setProperty('--nh-pair-width', `${g.w}%`);
      el.style.setProperty('--nh-pair-height', `${g.h}%`);
    });
  }

  function selectCard(index) {
    cards.forEach(card => card.classList.remove('nh-editor-selected'));
    pairElements.forEach(el => el.classList.remove('nh-editor-selected'));
    selected = index;
    if (selected >= 0 && selected < 5 && cards[selected]) {
      cards[selected].classList.add('nh-editor-selected');
    } else if (selected === 5) {
      pairElements.forEach(el => el.classList.add('nh-editor-selected'));
    }
    updateStatus();
  }

  function updateStatus() {
    if (!status) return;
    status.textContent = selected < 0
      ? 'Toca una tarjeta o la foto/marco'
      : selected === 5
        ? 'Foto y marco principal seleccionados'
        : `Tarjeta ${String(selected + 1).padStart(2, '0')} seleccionada`;
  }

  function change(dx, dy) {
    if (selected < 0) return;

    const box = section.querySelector('.nh-historia').getBoundingClientRect();
    const px = step / box.width * 100;
    const py = step / box.height * 100;
    const g = selected === 5 ? pairGeometry : geometry[selected];
    if (!g) return;

    if (mode === 'mover') {
      g.x += dx * px;
      g.y += dy * py;
    } else {
      const direction = mode === 'aumentar' ? 1 : -1;

      if (dx < 0) {
        g.x -= direction * px;
        g.w += direction * px;
      } else if (dx > 0) {
        g.w += direction * px;
      }

      if (dy < 0) {
        g.y -= direction * py;
        g.h += direction * py;
      } else if (dy > 0) {
        g.h += direction * py;
      }
    }

    g.w = Math.max(1, g.w);
    g.h = Math.max(1, g.h);
    if (selected === 5) applyPairGeometry();
    else applyGeometry(selected);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(geometry));
      if (pairGeometry) {
        localStorage.setItem(PAIR_STORAGE_KEY, JSON.stringify(pairGeometry));
      }
      status.textContent = 'Cambios guardados correctamente';
    } catch (error) {
      status.textContent = 'No se pudieron guardar los cambios';
    }
  }

  function makeButton(text, action, parent, active = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    if (active) button.classList.add('active');
    button.addEventListener('click', action);
    parent.appendChild(button);
    return button;
  }

  function createPanel() {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nh-editor-toggle';
    toggle.textContent = 'Editar tarjetas';
    toggle.hidden = true;
    document.body.appendChild(toggle);

    panel = document.createElement('div');
    panel.className = 'nh-editor-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="nh-editor-title">Ajustar tarjetas</div>
      <button type="button" class="nh-editor-close" aria-label="Cerrar">×</button>
      <div class="nh-editor-status"></div>
      <div class="nh-editor-row nh-editor-steps"></div>
      <div class="nh-editor-row nh-editor-modes"></div>
      <div class="nh-editor-arrows">
        <span></span><button type="button" data-dir="up">↑</button><span></span>
        <button type="button" data-dir="left">←</button>
        <button type="button" data-dir="down">↓</button>
        <button type="button" data-dir="right">→</button>
      </div>
      <div class="nh-editor-row">
        <button type="button" class="nh-editor-save">Guardar cambios</button>
      </div>`;
    document.body.appendChild(panel);

    status = panel.querySelector('.nh-editor-status');
    const steps = panel.querySelector('.nh-editor-steps');
    [1, 3, 5].forEach(value => {
      const b = makeButton(`${value} px`, () => {
        step = value;
        steps.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      }, steps, value === 1);
    });

    const modes = panel.querySelector('.nh-editor-modes');
    [['MOVER','mover'],['AUMENTAR','aumentar'],['DISMINUIR','disminuir']].forEach(([label,value]) => {
      const b = makeButton(label, () => {
        mode = value;
        modes.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      }, modes, value === 'mover');
    });

    panel.querySelectorAll('[data-dir]').forEach(button => {
      button.addEventListener('click', () => {
        if (button.dataset.dir === 'up') change(0, -1);
        if (button.dataset.dir === 'down') change(0, 1);
        if (button.dataset.dir === 'left') change(-1, 0);
        if (button.dataset.dir === 'right') change(1, 0);
      });
    });

    panel.querySelector('.nh-editor-save').addEventListener('click', save);
    panel.querySelector('.nh-editor-close').addEventListener('click', closeEditor);

    toggle.addEventListener('click', () => {
      editing = true;
      document.body.classList.add('nh-editor-active');
      panel.hidden = false;
      toggle.hidden = true;
      updateStatus();
    });
  }

  function closeEditor() {
    editing = false;
    document.body.classList.remove('nh-editor-active');
    panel.hidden = true;
    toggle.hidden = false;
    cards.forEach(card => card.classList.remove('nh-editor-selected'));
    pairElements.forEach(el => el.classList.remove('nh-editor-selected'));
    selected = -1;
  }

  function initialize() {
    section = document.querySelector(SECTION);
    if (!section || !visible(section)) return false;

    overlay = section.querySelector('.nh-tarjetas-nuevas');
    if (!overlay) return false;

    cards = Array.from(overlay.querySelectorAll('img')).slice(0, 5);
    if (cards.length !== 5 || !readGeometry() || !readPairBase()) return false;

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

    geometry.forEach((_, i) => applyGeometry(i));

    try {
      const savedPair = JSON.parse(localStorage.getItem(PAIR_STORAGE_KEY) || 'null');
      if (savedPair && ['x','y','w','h'].every(k => Number.isFinite(savedPair[k]))) {
        pairGeometry = {...savedPair};
      }
    } catch (_) {}
    applyPairGeometry();

    if (!panel) createPanel();
    toggle.hidden = false;

    cards.forEach((card, index) => {
      card.addEventListener('click', event => {
        if (!editing) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        selectCard(index);
      }, true);
    });

    const historia = section;

    if (historia && historia.dataset.nhPairClick !== '1') {
      historia.dataset.nhPairClick = '1';

      historia.addEventListener('click', event => {
        if (!editing) return;

        // No interceptar los toques de las cinco tarjetas.
        if (event.target.closest('.nh-tarjetas-nuevas img')) return;

        const x = event.clientX;
        const y = event.clientY;
        const insidePair = pairElements.some(el => {
          const r = el.getBoundingClientRect();
          return x >= r.left && x <= r.right &&
                 y >= r.top && y <= r.bottom;
        });

        if (!insidePair) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        selectCard(5);
      }, true);
    }

    return true;
  }

  function watch() {
    const observer = new MutationObserver(() => {
      if (section && visible(section)) {
        if (!cards.length) initialize();
        toggle && (toggle.hidden = false);
      } else if (toggle) {
        toggle.hidden = true;
        panel.hidden = true;
        editing = false;
      }
    });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  function start() {
    if (!initialize()) watch();
    else watch();

    window.addEventListener('resize', () => {
      if (!editing && section && visible(section)) {
        requestAnimationFrame(() => {
          geometry.forEach((_, i) => applyGeometry(i));
          applyPairGeometry();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }
})();
