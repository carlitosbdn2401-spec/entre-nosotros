(() => {
  function ajustarFotoHistoria() {
    document.querySelectorAll('.nuestra-historia').forEach(historia => {
      const contenedor = historia.querySelector('.nuestra-historia-container');
      const marco = historia.querySelector('.nh-marco-principal');
      const foto = historia.querySelector('.nh-foto-principal');

      if (!contenedor || !marco || !foto || !marco.complete || !marco.naturalWidth) return;

      const ancho = marco.offsetWidth;
      const alto = marco.offsetHeight;

      // La vista puede estar oculta al iniciar la aplicación.
      if (!ancho || !alto) return;

      foto.style.position = 'absolute';
      foto.style.left = (marco.offsetLeft + ancho * 271 / 1200) + 'px';
      foto.style.top = (marco.offsetTop + alto * 159 / 900) + 'px';
      foto.style.width = (ancho * 678 / 1200) + 'px';
      foto.style.height = (alto * 534 / 900) + 'px';
      foto.style.objectFit = 'cover';
      foto.style.objectPosition = 'center';
    });
  }

  function iniciar() {
    document.querySelectorAll('.nuestra-historia').forEach(historia => {
      const contenedor = historia.querySelector('.nuestra-historia-container');
      const marco = historia.querySelector('.nh-marco-principal');

      if (marco && !marco.complete) {
        marco.addEventListener('load', ajustarFotoHistoria);
      }

      if (window.ResizeObserver && contenedor) {
        const observador = new ResizeObserver(ajustarFotoHistoria);
        observador.observe(contenedor);
      }
    });

    ajustarFotoHistoria();
    requestAnimationFrame(ajustarFotoHistoria);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }

  window.addEventListener('load', ajustarFotoHistoria);
  window.addEventListener('resize', ajustarFotoHistoria);
  window.addEventListener('pageshow', ajustarFotoHistoria);
})();
