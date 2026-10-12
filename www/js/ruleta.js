import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";

const boton = document.getElementById("boton-girar-ruleta");
const disco = document.getElementById("ruleta-disco");
const estado = document.getElementById("ruleta-estado");
const resultado = document.getElementById("ruleta-resultado");
const resultadoIcono = document.getElementById("ruleta-resultado-icono");
const resultadoTitulo = document.getElementById("ruleta-resultado-titulo");
const resultadoTexto = document.getElementById("ruleta-resultado-texto");
const secreto = document.getElementById("ruleta-secreto-revelado");


let girando = false;
let estadoValido = false;
let disponibles = 0;
let rotacionActual = 0;
let solicitudPendiente = null;
const CLAVE_SOLICITUD_PENDIENTE = "entre-nosotros-ruleta-pendiente";

const premios = [
  {
    nombre: "Puntos extra",
    icono: "🪙",
    texto: "¡Has conseguido la categoría de puntos extra! La cantidad se configurará al conectar los premios."
  },
  {
    nombre: "Vale romántico",
    icono: "💋",
    texto: "¡Un vale romántico os espera! Los vales se definirán en la tienda de la pareja."
  },
  {
    nombre: "Cena o experiencia",
    icono: "🍽️",
    texto: "¡Ha salido una cena o experiencia para compartir juntos!"
  },
  {
    nombre: "Premio picante normal",
    icono: "🔥",
    texto: "¡Ha salido un premio picante normal! Deberá respetar las preferencias acordadas por ambos."
  },
  {
    nombre: "Nuestro secreto ❤️‍🔥",
    icono: "🖤❔",
    secreto: true,
    texto: "Ha salido el premio picante secreto."
  },
  {
    nombre: "Premio exclusivo legendario",
    icono: "👑",
    texto: "¡Ha salido un premio exclusivo legendario!"
  }
];


const capaGajos = document.getElementById("ruleta-gajos");

function crearGajosRuleta() {
  if (!capaGajos) return;

  const cantidades = [12, 10, 8, 7, 1, 2];
  const orden = cantidades.flatMap((cantidad, indice) =>
    Array(cantidad).fill(indice)
  );

  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }

  capaGajos.replaceChildren();

  orden.forEach((premioIndice, gajoIndice) => {
    const marca = document.createElement("span");
    const angulo = (gajoIndice + 0.5) * 9;
      const radianes = angulo * Math.PI / 180;
    marca.className = "ruleta-marca";
    marca.dataset.premioIndice = premioIndice;
    marca.dataset.gajoIndice = gajoIndice;
    marca.textContent = premios[premioIndice].icono;
    marca.style.left = `${50 + Math.sin(radianes) * 36}%`;
    marca.style.top = `${50 - Math.cos(radianes) * 36}%`;
    capaGajos.appendChild(marca);
  });
}

crearGajosRuleta();

function actualizarContador() {
  const restantes = Math.max(0, Math.min(2, disponibles));

  document.querySelectorAll("#ruleta-contador .ruleta-tirada")
    .forEach((corazon, i) => {
      const usada = i >= restantes;
      corazon.classList.toggle("usada", usada);
      corazon.textContent = usada ? "♡" : "♥";
    });

  const cuenta = document.getElementById("ruleta-tiradas-texto");

  if (cuenta) {
    cuenta.textContent = restantes === 2
      ? "Tienes 2 tiradas disponibles este mes ❤️"
      : restantes === 1
        ? "Te queda 1 tirada este mes ❤️"
        : "Has utilizado tus 2 tiradas mensuales ❤️";
  }

  if (boton) {
    boton.disabled = girando || !estadoValido || restantes === 0;
    boton.textContent = girando
      ? "✨ La ruleta está girando…"
      : restantes
        ? `✨ Girar mi ruleta (${restantes})`
        : "❤️ Has utilizado tus 2 tiradas";
  }

  if (estado && !girando && estadoValido && restantes === 0) {
    estado.textContent = "Volverás a tener 2 tiradas el próximo mes.";
  }
}

async function consultarEstado() {
  estadoValido = false;
  actualizarContador();
  if (estado) estado.textContent = "Consultando tus tiradas… ❤️";

  try {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error("Inicia sesión para consultar tus tiradas.");

    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit"
    }).formatToParts(new Date());
    const valores = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    const mes = `${valores.year}-${valores.month}`;
    const referencia = doc(db, "parejas", "nuestro-espacio", "ruletaSegura", `${usuario.uid}_${mes}`);
    const snapshot = await getDoc(referencia);
    const giros = snapshot.exists() && Array.isArray(snapshot.data().giros)
      ? snapshot.data().giros : [];

    disponibles = Math.max(0, 2 - giros.length);
    estadoValido = true;
    actualizarContador();

    if (estado && disponibles > 0) {
      estado.textContent = "Tu ruleta está preparada. ¡Mucha suerte! ❤️";
    }
  } catch (error) {
    console.error("No se pudo consultar la ruleta:", error);
    if (estado) estado.textContent =
      "No se han podido consultar tus tiradas. Comprueba tu conexión e inténtalo de nuevo.";
  }

  actualizarContador();
}

function crearRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}

function mostrarPremio(nombre) {
  const premio = premios.find(p => p.nombre === nombre);

  if (!premio) {
    throw new Error("El servidor ha devuelto un premio desconocido.");
  }

  const clases = [
    "premio-puntos", "premio-romantico", "premio-experiencia",
    "premio-picante", "premio-secreto", "premio-legendario"
  ];

  resultado.classList.remove(...clases);
  resultadoIcono.classList.remove("icono-revelando");
  resultadoIcono.textContent = premio.icono;
  resultadoTitulo.textContent = premio.secreto
    ? "Nuestro secreto ❤️‍🔥"
    : premio.nombre;
  resultadoTexto.textContent = premio.texto;
  secreto.hidden = !premio.secreto;

  resultado.classList.add(clases[premios.indexOf(premio)]);
  resultado.hidden = false;
  void resultado.offsetWidth;
  resultadoIcono.classList.remove("icono-revelando");
  void resultadoIcono.offsetWidth;
  resultadoIcono.classList.add("icono-revelando");
}

async function girarRuleta() {
  if (girando || !estadoValido || disponibles <= 0) return;

  girando = true;
  actualizarContador();

  resultado.hidden = true;
  secreto.hidden = true;

  if (estado) estado.textContent = "La ruleta está girando… ✨";

  try {
    // Recuperamos la solicitud pendiente si hubo un fallo de conexión.
    if (!solicitudPendiente) {
      solicitudPendiente = sessionStorage.getItem(CLAVE_SOLICITUD_PENDIENTE);
      if (!solicitudPendiente) {
        solicitudPendiente = crearRequestId();
        sessionStorage.setItem(CLAVE_SOLICITUD_PENDIENTE, solicitudPendiente);
      }
    }

    const usuario = auth.currentUser;
    if (!usuario) throw new Error("Inicia sesión para girar la ruleta.");

    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit"
    }).formatToParts(new Date());
    const valores = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    const mes = `${valores.year}-${valores.month}`;
    const referencia = doc(db, "parejas", "nuestro-espacio", "ruletaSegura", `${usuario.uid}_${mes}`);
    const pesos = [30, 25, 20, 19, 1, 5];

    const datos = await runTransaction(db, async transaccion => {
      const snapshot = await transaccion.get(referencia);
      const guardado = snapshot.exists() ? snapshot.data() : {};
      const giros = Array.isArray(guardado.giros) ? guardado.giros : [];
      const repetida = giros.find(giro => giro.requestId === solicitudPendiente);

      if (repetida) {
        return { premio: repetida.premio, disponibles: Math.max(0, 2 - giros.length) };
      }
      if (giros.length >= 2) {
        const error = new Error("Ya has utilizado tus dos tiradas de este mes ❤️");
        error.code = "ruleta/sin-tiradas";
        throw error;
      }

      let sorteo = Math.random() * 100;
      let indicePremio = pesos.findIndex(peso => {
        sorteo -= peso;
        return sorteo < 0;
      });
      if (indicePremio < 0) indicePremio = pesos.length - 1;

      const premio = premios[indicePremio].nombre;
      const nuevosGiros = [...giros, {
        requestId: solicitudPendiente,
        premio,
        fecha: new Date().toISOString()
      }];

      transaccion.set(referencia, {
        uid: usuario.uid,
        mes,
        giros: nuevosGiros,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { premio, disponibles: 2 - nuevosGiros.length };
    });

    if (!datos || typeof datos.premio !== "string") {
      throw new Error("No se ha podido obtener un premio válido.");
    }

    disponibles = datos.disponibles;
    estadoValido = true;
    // Animamos la ruleta solo después de confirmar la tirada.
    const indice = premios.findIndex(p => p.nombre === datos.premio);

    if (indice < 0) {
      throw new Error("El servidor ha devuelto un premio desconocido.");
    }

    // La respuesta es valida: eliminamos la solicitud pendiente.
    sessionStorage.removeItem(CLAVE_SOLICITUD_PENDIENTE);
    solicitudPendiente = null;

    const marcas = [...(capaGajos?.querySelectorAll(".ruleta-marca") || [])]
      .filter(marca => Number(marca.dataset.premioIndice) === indice);

    let anguloFinal;

    if (marcas.length) {
      const marcaElegida = marcas[Math.floor(Math.random() * marcas.length)];
      const gajoIndice = Number(marcaElegida.dataset.gajoIndice);
      const centroGajo = (gajoIndice + 0.5) * 9;
      anguloFinal = (360 - centroGajo + 360) % 360;
    } else {
      const gradosAntes = pesos.slice(0, indice).reduce((a, b) => a + b, 0) * 3.6;
      const gradosSector = pesos[indice] * 3.6;
      const centroSector = gradosAntes + gradosSector / 2;
      anguloFinal = (360 - centroSector + 360) % 360;
    }

    const posicionActual = ((rotacionActual % 360) + 360) % 360;
    const ajuste = (anguloFinal - posicionActual + 360) % 360;
    const vueltas = rotacionActual + 360 * 6 + ajuste;

    if (disco) {
      rotacionActual = vueltas;
      disco.style.transform = `rotate(${rotacionActual}deg)`;
      disco.closest(".ruleta-contenedor")?.classList.add("girando");
    }

    window.setTimeout(() => {
      try {
        mostrarPremio(datos.premio);

        if (estado) {
          estado.textContent = "¡Ya tenemos resultado! ❤️";
        }

        if (resultado) {
          resultado.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
          });
        }
      } catch (error) {
        console.error("Error mostrando el premio:", error);
        if (estado) estado.textContent = error.message;
      } finally {
        disco?.closest(".ruleta-contenedor")?.classList.remove("girando");
        girando = false;
        actualizarContador();
      }
    }, 7600);

  } catch (error) {
    console.error("Error al girar la ruleta:", error);

    girando = false;
    await consultarEstado();

    if (estado) {
      estado.textContent =
        error.code === "ruleta/sin-tiradas"
          ? "Ya has utilizado tus dos tiradas de este mes ❤️"
          : "No se ha podido completar el giro. Comprueba tu conexión e inténtalo de nuevo.";
    }
  }
}

boton?.addEventListener("click", girarRuleta);

onAuthStateChanged(auth, usuario => {
  if (usuario) {
    consultarEstado();
  } else {
    estadoValido = false;
    disponibles = 0;
    actualizarContador();

    if (estado) {
      estado.textContent = "Inicia sesión para consultar tus tiradas. ❤️";
    }
  }
});
