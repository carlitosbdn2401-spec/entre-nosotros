const ICONOS_TEXTO = {
  "❤️": "01_corazon-entrada.png",
  "♥": "01_corazon-entrada.png",
  "💕": "08_corazon-rosa.png",
  "💗": "08_corazon-rosa.png",
  "💖": "34_corazon-brillante.png",
  "💝": "08_corazon-rosa.png",
  "💌": "07_carta-portada.png",
  "💋": "43_beso.png",
  "😘": "43_beso.png",
  "🥰": "13_abrazo.png",
  "🤗": "13_abrazo.png",
  "🫂": "26_abrazo-dos.png",
  "😂": "21_mensaje-divertido.png",
  "😏": "22_mensaje-picaro.png",
  "❤️‍🔥": "23_pasion.png",
  "🔥": "23_pasion.png",
  "🌹": "31_rosa.png",
  "🌸": "32_flor.png",
  "📖": "24_libro-recuerdos.png",
  "🎁": "33_regalo.png",
  "👑": "06_corona-decorativa.png",
  "💎": "18_premio-exclusivo.png",
  "🍽️": "41_cubiertos.png",
  "🥂": "29_brindis.png",
  "🎬": "16_noche-pelicula.png",
  "🍿": "30_palomitas.png",
  "💆": "14_masaje.png",
  "🌿": "36_plantas.png",
  "🕯️": "37_vela.png",
  "✨": "03_destello.png",
  "💫": "39_estrellas.png",
  "🛍️": "09_tienda.png"
};

export function ponerTextoConIconos(elemento, texto) {
  if (!elemento) return;

  elemento.replaceChildren();
  const expresion = new RegExp(
    Object.keys(ICONOS_TEXTO)
      .sort((a, b) => b.length - a.length)
      .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "gu"
  );

  let inicio = 0;
  const contenido = String(texto ?? "");

  for (const coincidencia of contenido.matchAll(expresion)) {
    const emoji = coincidencia[0];
    const posicion = coincidencia.index;

    if (posicion > inicio) {
      elemento.append(document.createTextNode(contenido.slice(inicio, posicion)));
    }

    const imagen = document.createElement("img");
    imagen.src = "/assets/iconos-app/" + ICONOS_TEXTO[emoji];
    imagen.alt = "";
    imagen.setAttribute("aria-hidden", "true");
    imagen.className = "icono-en-texto";
    imagen.style.cssText = "width:1.25em;height:1.25em;object-fit:contain;vertical-align:-0.25em;margin:0 .08em;";
    elemento.append(imagen);
    inicio = posicion + emoji.length;
  }

  if (inicio < contenido.length) {
    elemento.append(document.createTextNode(contenido.slice(inicio)));
  }
}
