(function () {
  let mapa = null;

  function iniciarMapa() {
    const elemento = document.getElementById('mapa-lugares');
    if (!elemento || !window.L) return;

    if (!mapa) {
      mapa = L.map(elemento).setView([40.2, -3.7], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapa);
    }

    setTimeout(() => mapa.invalidateSize(), 200);
  }

  document.addEventListener('vista-cambiada', function (evento) {
    if (evento.detail.nombre === 'lugares-especiales') {
      iniciarMapa();
    }
  });
})();
