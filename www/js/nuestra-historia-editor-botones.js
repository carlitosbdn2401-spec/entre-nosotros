(() => {
  'use strict';

  const KEY = 'nh-editor-botones-tarjetas-v1';
  const SECTION = '.nuestra-historia[data-vista="nuestra-historia"]';
  const tipos = [
    {id:'entrar', nombre:'Entrar en la sección', forma:'rectangular'},
    {id:'escribir', nombre:'Escribir recuerdo', forma:'cuadrado'},
    {id:'guardar', nombre:'Guardar recuerdo', forma:'capsula'},
    {id:'fotos', nombre:'Añadir fotografías', forma:'capsula'}
  ];

  let section, overlay, layer, cards = [], buttons = [];
  let geometry = [], selected = null, step = 1, mode = 'mover';
  let editing = false, panel, toggle, status, observer;

  const css = document.createElement('style');
  css.textContent = `
    .nh-botones-capa {
      position:absolute!important;inset:0!important;
      width:100%!important;height:100%!important;
      z-index:60!important;pointer-events:none!important;
    }
    .nh-boton-tarjeta {
      opacity:0!important;position:absolute;box-sizing:border-box;
      display:flex;align-items:center;justify-content:center;
      text-align:center;overflow:hidden;padding:2px 5px;
      border:2px solid #f7d9a5;border-radius:13px;
      background:linear-gradient(145deg,#76243c,#35101e);
      color:#fff0d5;font-family:'Great Vibes',cursive;
      font-size:clamp(11px,2.7vw,19px);line-height:1.05;
      text-shadow:0 1px 3px #000;
      box-shadow:inset 0 1px 3px #ffffff55,0 3px 7px #0009;
      pointer-events:auto;touch-action:manipulation;
    }
    body.nh-editor-botones-activo .nh-boton-tarjeta {
      opacity:0!important;cursor:pointer;
    }
    .nh-boton-tarjeta[data-forma="capsula"] {border-radius:999px}
    .nh-boton-tarjeta[data-forma="cuadrado"]:not(.nh-escribiendo):not(.nh-texto-guardado) {
      border-radius:0!important;
    }
    .nh-boton-tarjeta.nh-seleccionado {
      outline:3px dashed #fff0a8!important;
      outline-offset:3px;z-index:3;
    }

    .nh-editor-botones-toggle {
      display:none!important;
      position:fixed;right:12px;bottom:110px;z-index:100010;
      padding:9px 14px;border:1px solid #D4AF37;border-radius:10px;
      background:#211018;color:#F7D9A5;
      font:19px 'Great Vibes',cursive;
    }
    .nh-editor-botones-panel {
      display:none!important;
      position:fixed;left:0;right:0;top:8px;z-index:100011;
      box-sizing:border-box;padding:8px 10px;
      background:#211018;border-top:2px solid #D4AF37;
      color:#F7D9A5;font-family:'Great Vibes',cursive;
      display:flex;flex-direction:column;gap:7px;
      box-shadow:0 -4px 14px #0009;
    }
    .nh-editor-botones-panel[hidden],
    .nh-editor-botones-toggle[hidden] {display:none!important}
    .nh-editor-botones-cabecera {
      min-height:22px;display:flex;align-items:center;
      justify-content:center;position:relative;
    }
    .nh-editor-botones-titulo {font-size:19px;line-height:22px}
    .nh-editor-botones-cerrar {
      position:absolute;right:0;top:-2px;
      min-width:34px!important;min-height:28px!important;
      padding:1px 8px!important;font-size:17px!important;
    }
    .nh-editor-botones-status {
      text-align:center;font-size:16px;line-height:19px;
      min-height:19px;
    }
    .nh-editor-botones-controles {
      display:flex;align-items:center;justify-content:center;
      flex-wrap:wrap;gap:9px;
    }
    .nh-editor-botones-grupo {
      display:flex;align-items:center;justify-content:center;
      gap:5px;flex-wrap:wrap;
    }
    .nh-editor-botones-panel button {
      box-sizing:border-box;min-height:37px;min-width:39px;
      padding:4px 9px;border:1px solid #D4AF37;
      border-radius:8px;background:#10090d;color:#F7D9A5;
      font:17px 'Great Vibes',cursive;
      touch-action:manipulation;
    }
    .nh-editor-botones-panel button.active {
      background:#681b32;box-shadow:0 0 7px #D4AF37;
    }
    .nh-editor-botones-cruceta {
      display:grid;grid-template-columns:repeat(3,39px);
      grid-template-rows:repeat(2,37px);gap:4px;
    }
    .nh-editor-botones-cruceta button {
      min-width:39px;padding:2px;font-family:sans-serif;
      font-size:21px;line-height:1;
    }
    .nh-editor-botones-guardar {
      min-width:82px!important;
      background:linear-gradient(145deg,#c9a65c,#80602d)!important;
      color:#241018!important;font-size:19px!important;
    }
    @media(max-width:420px) {
      .nh-editor-botones-panel {padding:7px 5px;gap:5px}
      .nh-editor-botones-controles {gap:5px}
      .nh-editor-botones-grupo {gap:3px}
      .nh-editor-botones-panel button {
        min-width:34px;padding:3px 6px;font-size:15px;
      }
      .nh-editor-botones-cruceta {
        grid-template-columns:repeat(3,35px);
        grid-template-rows:repeat(2,35px);gap:3px;
      }
      .nh-editor-botones-cruceta button {min-width:35px}
      .nh-editor-botones-guardar {min-width:68px!important}
    }
  `;
  document.head.appendChild(css);

  function visible(el) {
    return !!el && el.getClientRects().length > 0;
  }

  function defaults(card) {
    const r = card.getBoundingClientRect();
    const w = r.width, h = r.height;
    const squareW = w * .17;
    return [
      {x:w*.26,y:h*.07,w:w*.48,h:h*.15},
      {x:w*.415,y:h*.40,w:squareW,h:squareW},
      {x:w*.04,y:h*.83,w:w*.40,h:h*.09},
      {x:w*.55,y:h*.83,w:w*.40,h:h*.09}
    ];
  }

  function loadGeometry() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (_) {}

    geometry = [];
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const base = defaults(card);
      for (let j = 0; j < 4; j++) {
        const old = Array.isArray(saved) ? saved[i * 4 + j] : null;
        geometry.push(
          old && ['x','y','w','h'].every(k => Number.isFinite(old[k]))
            ? {
                x:old.x*r.width/100,
                y:old.y*r.height/100,
                w:old.w*r.width/100,
                h:old.h*r.height/100
              }
            : {...base[j]}
        );
      }
    });
  }

  function apply(i) {
    const b = buttons[i], g = geometry[i];
    const card = cards[Math.floor(i / 4)];
    if (!b || !g || !card || !layer) return;

    const r = card.getBoundingClientRect();
    const o = layer.getBoundingClientRect();
    b.style.left = (r.left - o.left + g.x) + 'px';
    b.style.top = (r.top - o.top + g.y) + 'px';
    b.style.width = g.w + 'px';
    b.style.height = g.h + 'px';
  }

  function updateStatus(message) {
    if (!status) return;
    status.textContent = message || (
      selected === null
        ? 'Toca uno de los 20 botones para seleccionarlo'
        : `Tarjeta ${Math.floor(selected / 4) + 1} · ${tipos[selected % 4].nombre}`
    );
  }

  function select(i) {
    buttons.forEach(b => b.classList.remove('nh-seleccionado'));
    selected = i;
    if (i !== null && buttons[i]) {
      buttons[i].classList.add('nh-seleccionado');
    }
    updateStatus();
  }

  function change(dx, dy) {
    if (selected === null) {
      updateStatus('Primero selecciona un botón de una tarjeta');
      return;
    }

    const g = geometry[selected];
    if (!g) return;

    if (mode === 'mover') {
      g.x += dx * step;
      g.y += dy * step;
    } else if (mode === 'aumentar') {
      if (dx < 0) { g.x -= step; g.w += step; }
      if (dx > 0) { g.w += step; }
      if (dy < 0) { g.y -= step; g.h += step; }
      if (dy > 0) { g.h += step; }
    } else {
      if (dx < 0) {
        const amount = Math.min(step, Math.max(0, g.w - 12));
        g.x += amount;
        g.w -= amount;
      }
      if (dx > 0) g.w = Math.max(12, g.w - step);
      if (dy < 0) {
        const amount = Math.min(step, Math.max(0, g.h - 12));
        g.y += amount;
        g.h -= amount;
      }
      if (dy > 0) g.h = Math.max(12, g.h - step);
    }

    g.w = Math.max(12, g.w);
    g.h = Math.max(12, g.h);
    apply(selected);
  }

  function save() {
    try {
      const result = geometry.map((g, i) => {
        const r = cards[Math.floor(i / 4)].getBoundingClientRect();
        return {
          x:g.x / r.width * 100,
          y:g.y / r.height * 100,
          w:g.w / r.width * 100,
          h:g.h / r.height * 100
        };
      });
      localStorage.setItem(KEY, JSON.stringify(result));
      updateStatus('Las 20 posiciones se han guardado correctamente');
    } catch (_) {
      updateStatus('No se pudieron guardar los cambios');
    }
  }

  function addButton(parent, label, action, active = false, extraClass = '') {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    if (active) b.classList.add('active');
    if (extraClass) b.classList.add(extraClass);
    b.addEventListener('click', action);
    parent.appendChild(b);
    return b;
  }

  function createEditor() {
    if (panel) return;

    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nh-editor-botones-toggle';
    toggle.textContent = 'Editar 20 botones';
    toggle.hidden = true;
    document.body.appendChild(toggle);

    panel = document.createElement('div');
    panel.className = 'nh-editor-botones-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="nh-editor-botones-cabecera">
        <div class="nh-editor-botones-titulo">Ajustar botones de las cinco tarjetas</div>
        <button type="button" class="nh-editor-botones-cerrar" aria-label="Cerrar editor">×</button>
      </div>
      <div class="nh-editor-botones-status"></div>
      <div class="nh-editor-botones-controles">
        <div class="nh-editor-botones-grupo nh-editor-botones-modos"></div>
        <div class="nh-editor-botones-grupo nh-editor-botones-pasos"></div>
        <div class="nh-editor-botones-cruceta">
          <span></span><button type="button" data-dir="up" aria-label="Arriba">↑</button><span></span>
          <button type="button" data-dir="left" aria-label="Izquierda">←</button>
          <button type="button" data-dir="down" aria-label="Abajo">↓</button>
          <button type="button" data-dir="right" aria-label="Derecha">→</button>
        </div>
        <button type="button" class="nh-editor-botones-guardar">Guardar</button>
      </div>
    `;
    document.body.appendChild(panel);

    status = panel.querySelector('.nh-editor-botones-status');

    const modes = panel.querySelector('.nh-editor-botones-modos');
    [['Mover','mover'],['Aumentar','aumentar'],['Disminuir','disminuir']]
      .forEach(([label, value]) => {
        addButton(modes, label, event => {
          mode = value;
          modes.querySelectorAll('button').forEach(b =>
            b.classList.toggle('active', b === event.currentTarget)
          );
          updateStatus();
        }, value === 'mover');
      });

    const steps = panel.querySelector('.nh-editor-botones-pasos');
    [1,3,5].forEach(value => {
      addButton(steps, value + ' px', event => {
        step = value;
        steps.querySelectorAll('button').forEach(b =>
          b.classList.toggle('active', b === event.currentTarget)
        );
        updateStatus(`Paso seleccionado: ${value} píxeles`);
      }, value === 1);
    });

    panel.querySelectorAll('[data-dir]').forEach(b => {
      b.addEventListener('click', () => {
        const dir = b.dataset.dir;
        change(
          dir === 'left' ? -1 : dir === 'right' ? 1 : 0,
          dir === 'up' ? -1 : dir === 'down' ? 1 : 0
        );
      });
    });

    panel.querySelector('.nh-editor-botones-guardar')
      .addEventListener('click', save);
    panel.querySelector('.nh-editor-botones-cerrar')
      .addEventListener('click', closeEditor);

    toggle.addEventListener('click', openEditor);
  }

  function openEditor() {
    if (!visible(section)) return;
    editing = true;
    panel.hidden = false;
    toggle.hidden = true;
    document.body.classList.add('nh-editor-botones-activo');
    select(null);
  }

  function closeEditor() {
    editing = false;
    selected = null;
    buttons.forEach(b => b.classList.remove('nh-seleccionado'));
    document.body.classList.remove('nh-editor-botones-activo');
    if (panel) panel.hidden = true;
    if (toggle) toggle.hidden = !visible(section);
  }

  function build() {
    section = document.querySelector(SECTION);
    if (!visible(section)) return false;

    overlay = section.querySelector('.nh-tarjetas-nuevas');
    if (!overlay) return false;

    cards = Array.from(overlay.querySelectorAll(':scope > img')).slice(0, 5);
    if (cards.length !== 5) return false;

    layer = overlay.querySelector('.nh-botones-capa');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'nh-botones-capa';
      overlay.appendChild(layer);
    }

    layer.replaceChildren();
    buttons = [];
    loadGeometry();

    cards.forEach((card, ci) => {
      tipos.forEach((tipo, ti) => {
        const i = ci * 4 + ti;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'nh-boton-tarjeta';
        b.dataset.card = ci;
        b.dataset.tipo = tipo.id;
        b.dataset.forma = tipo.forma;
        b.textContent = tipo.nombre;
        b.setAttribute('aria-label', `Tarjeta ${ci + 1}: ${tipo.nombre}`);

        b.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();

          if (editing) {
            select(i);
            return;
          }

          window.dispatchEvent(new CustomEvent('nh:tarjeta-accion', {
            detail:{card:ci, type:tipo.id, button:b}
          }));
        });

        layer.appendChild(b);
        buttons.push(b);
      });
    });

    buttons.forEach((_, i) => apply(i));
    return true;
  }

  function scan() {
    createEditor();

    const currentSection = document.querySelector(SECTION);
    if (currentSection !== section) {
      section = currentSection;
    }

    if (!visible(section)) {
      if (editing) closeEditor();
      toggle.hidden = true;
      return;
    }

    if (!buttons.length || !layer || !layer.isConnected) {
      build();
    }

    if (!editing) toggle.hidden = false;
  }

  function start() {
    createEditor();
    scan();

    document.addEventListener('vista-cambiada', () => {
      window.setTimeout(scan, 0);
    });

    window.addEventListener('resize', () => {
      if (editing) return;
      if (visible(section)) buttons.forEach((_, i) => apply(i));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }
})();
