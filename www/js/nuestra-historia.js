
(function () {
  const inicio = new Date(2024, 8, 15, 20, 0, 0);

  function sumarMeses(fecha, cantidad) {
    const resultado = new Date(fecha);
    const dia = resultado.getDate();
    resultado.setDate(1);
    resultado.setMonth(resultado.getMonth() + cantidad);
    const ultimoDia = new Date(
      resultado.getFullYear(),
      resultado.getMonth() + 1,
      0
    ).getDate();
    resultado.setDate(Math.min(dia, ultimoDia));
    return resultado;
  }

  function actualizarContador() {
    const ahora = new Date();
    if (ahora < inicio) return;

    let cursor = new Date(inicio);
    let anios = 0;
    let meses = 0;
    let dias = 0;

    while (sumarMeses(cursor, 12) <= ahora) {
      cursor = sumarMeses(cursor, 12);
      anios++;
    }

    while (sumarMeses(cursor, 1) <= ahora) {
      cursor = sumarMeses(cursor, 1);
      meses++;
    }

    while (true) {
      const siguiente = new Date(cursor);
      siguiente.setDate(siguiente.getDate() + 1);
      if (siguiente > ahora) break;
      cursor = siguiente;
      dias++;
    }

    let restante = Math.max(0, ahora - cursor);
    const horas = Math.floor(restante / 3600000);
    restante %= 3600000;
    const minutos = Math.floor(restante / 60000);
    restante %= 60000;
    const segundos = Math.floor(restante / 1000);

    const valores = {
      anios, meses, dias, horas, minutos, segundos
    };

    for (const [id, valor] of Object.entries(valores)) {
      document.getElementById("nh-" + id).textContent =
        String(valor).padStart(2, "0");
    }
  }

  actualizarContador();
  setInterval(actualizarContador, 1000);
})();
