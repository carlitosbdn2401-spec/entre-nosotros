(() => {
  'use strict';

  const SECTION = '.nuestra-historia[data-vista="nuestra-historia"]';
  const KEY = 'nh-editor-conjunto-v1';
  const KEY_BOTONES = 'nh-editor-conjunto-botones-v1';

  let section = null;
  let estados = {
    conjunto: null,
    volver: null,
    eliminar: null
  };

  function leerEstado() {
    try {
      const e = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (e && Number.isFinite(e.x) && Number.isFinite(e.y)) {
        estados.conjunto = {
          x: e.x,
          y: e.y,
          sx: e.sx ?? e.escala ?? 1,
          sy: e.sy ?? e.escala ?? 1,
          eliminado: e.eliminado === true
        };
      }
    } catch (_) {}

    try {
      const guardados = JSON.parse(localStorage.getItem(KEY_BOTONES) || 'null');
      ['volver', 'eliminar'].forEach(tipo => {
        const e = guardados && guardados[tipo];
        if (e && Number.isFinite(e.x) && Number.isFinite(e.y)) {
          estados[tipo] = {
            x: e.x,
            y: e.y,
            sx: e.sx ?? e.escala ?? 1,
            sy: e.sy ?? e.escala ?? 1
          };
        }
      });
    } catch (_) {}
  }

  function aplicar(el, estado, esConjunto = false) {
    if (!el || !estado) return;

    el.style.translate = `${estado.x}px ${estado.y}px`;
    el.style.scale = `${estado.sx} ${estado.sy}`;
    el.style.transformOrigin = 'top left';

    if (esConjunto) {
      el.style.display = estado.eliminado ? 'none' : '';
    }
  }

  function comprobarPantalla() {
    if (!section) section = document.querySelector(SECTION);
    if (!section) return;

    const archivo = section.querySelector(
      '.nh-archivo-historia:not([hidden])'
    );

    if (!archivo) return;

    aplicar(
      archivo.querySelector('.nh-archivo-presentacion'),
      estados.conjunto,
      true
    );

    aplicar(
      archivo.querySelector('.nh-archivo-volver'),
      estados.volver
    );

    aplicar(
      archivo.querySelector('.nh-archivo-eliminar'),
      estados.eliminar
    );
  }

  leerEstado();

  document.addEventListener('vista-cambiada', () => {
    window.setTimeout(comprobarPantalla, 0);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', comprobarPantalla, { once: true });
  } else {
    comprobarPantalla();
  }
})();
