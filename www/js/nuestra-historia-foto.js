(() => {
  function ajustarFotoHistoria() {
    document.querySelectorAll('.nuestra-historia .nh-historia').forEach(historia => {
      const marco = historia.querySelector('.nh-marco-principal');
      const foto = historia.querySelector('.nh-foto-principal');
      if (!marco || !foto || !marco.complete || !marco.naturalWidth) return;

      const x = marco.offsetLeft;
      const y = marco.offsetTop;
      const w = marco.offsetWidth;
      const h = marco.offsetHeight;

      foto.style.position = 'absolute';
      foto.style.left = (x + w * 271 / 1200) + 'px';
      foto.style.top = (y + h * 159 / 900) + 'px';
      foto.style.width = (w * 678 / 1200) + 'px';
      foto.style.height = (h * 534 / 900) + 'px';
      foto.style.objectFit = 'cover';
      foto.style.objectPosition = 'center';
    });
  }

  function iniciar() {
    document.querySelectorAll('.nuestra-historia .nh-marco-principal').forEach(marco => {
      if (!marco.complete) marco.addEventListener('load', ajustarFotoHistoria, {once:true});
    });
    ajustarFotoHistoria();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, {once:true});
  } else {
    iniciar();
  }

  window.addEventListener('load', ajustarFotoHistoria);
  window.addEventListener('resize', ajustarFotoHistoria);
})();
