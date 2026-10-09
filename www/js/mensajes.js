import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

const UID_MIEMBROS = [
  "BO9OTnpEPCSCrljTUjRfs2qu39i2",
  "j1mbdehEbCansXpAl3Awwc5azcB3"
];

const mensajes = [
  { tipo: "Romántico", texto: "Entre todas las casualidades de mi vida, tú eres mi favorita. ❤️" },
  { tipo: "Tierno", texto: "Ojalá pudiera darte ahora mismo un abrazo de esos que hacen que todo esté bien. 🥰" },
  { tipo: "Divertido", texto: "Aviso importante: alguien increíble acaba de aparecer en mis pensamientos. Sí, eres tú. 😘" },
  { tipo: "Picante", texto: "Tengo una idea para cuando estemos juntos… pero prefiero susurrártela al oído. 💋" },
  { tipo: "Profundo", texto: "No necesito que todos los días sean perfectos; me basta con saber que podemos afrontarlos juntos. ❤️‍🔥" },
  { tipo: "Romántico", texto: "Si pudiera elegir dónde terminar el día, elegiría a tu lado. 🌙" },
  { tipo: "Tierno", texto: "Espero que hoy encuentres un motivo para sonreír. Y, si no aparece ninguno, aquí tienes uno: yo me acuerdo de ti. 💗" },
  { tipo: "Divertido", texto: "Mi cabeza tenía cosas que hacer, pero tú te has colado otra vez. No pienso presentar una queja. 😂💕" },
  { tipo: "Picante", texto: "Te debo un beso. Bueno, quizá varios. Ya negociaremos las condiciones. 😏💋" },
  { tipo: "Profundo", texto: "Me gusta poder ser yo contigo, sin fingir y sin miedo. Eso también es amor. 🖤" },
  { tipo: "Romántico", texto: "Aunque ahora no esté a tu lado, quería hacerme un huequito en tu día. 💌" },
  { tipo: "Tierno", texto: "Cuídate mucho, cariño. Hay alguien que quiere seguir compartiendo contigo un montón de momentos bonitos. 🌹" },
  { tipo: "Divertido", texto: "Se busca: una persona para recibir besos inesperados. La recompensa es ilimitada. 🥰" },
  { tipo: "Profundo", texto: "Gracias por ser parte de mi historia. Me encanta que todavía nos queden tantas páginas por escribir. 📖❤️" },
  { tipo: "Romántico", texto: "Si te llega este mensaje, imagina que también te llega un abrazo mío. 🤗💖" }
];

const coleccionMensajes = () =>
  collection(db, "parejas", "nuestro-espacio", "mensajes");

const boton = document.getElementById("boton-acordado");
const estado = document.getElementById("estado-mensajes");
const tarjeta = document.getElementById("mensaje-sorpresa");
const textoSorpresa = document.getElementById("texto-sorpresa");
const lista = document.getElementById("lista-mensajes");
const contadorNoLeidos = document.getElementById("contador-no-leidos");
const contadorNoLeidosMenu = document.getElementById("contador-no-leidos-menu");
const avisoRomantico = document.getElementById("aviso-romantico");
let documentosActuales = [];

function claveLeidos() {
  return usuarioActual ? "entre-nosotros-leidos-" + usuarioActual.uid : "";
}

function idsLeidos() {
  try {
    return JSON.parse(localStorage.getItem(claveLeidos()) || "[]");
  } catch {
    return [];
  }
}

function guardarLeidos(ids) {
  if (!usuarioActual) return;
  localStorage.setItem(claveLeidos(), JSON.stringify([...new Set(ids)]));
}

function actualizarContador() {
  if (!usuarioActual || !contadorNoLeidos) return;

  const leidos = new Set(idsLeidos());
  const pendientes = documentosActuales.filter(m =>
    m.para === usuarioActual.uid && !leidos.has(m.id)
  ).length;

  if (avisoRomantico) avisoRomantico.style.display = pendientes ? "block" : "none";

  const texto = pendientes > 99 ? "99+" : String(pendientes);
  for (const contador of [contadorNoLeidos, contadorNoLeidosMenu]) {
    if (!contador) continue;
    contador.textContent = texto;
    contador.style.display = pendientes ? "inline-block" : "none";
    contador.setAttribute("aria-label", pendientes + (pendientes === 1 ? " mensaje sin leer" : " mensajes sin leer"));
  }
}

function marcarMensajesComoLeidos() {
  if (!usuarioActual) return;

  const leidos = idsLeidos();
  const nuevos = documentosActuales
    .filter(m => m.para === usuarioActual.uid)
    .map(m => m.id);

  guardarLeidos([...leidos, ...nuevos]);
  actualizarContador();
}

document.addEventListener("vista-cambiada", evento => {
  if (evento.detail?.nombre === "mensajes") {
    marcarMensajesComoLeidos();
  }
});


let usuarioActual = null;
let cancelarEscucha = null;
let ultimoTexto = "";

function mostrarEstado(texto) {
  if (estado) estado.textContent = texto;
}

function fechaLegible(fecha) {
  if (!fecha) return "Ahora mismo";
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escaparYMostrarMensajes(documentos) {
  if (!lista) return;

  const propios = documentos
    .filter(m => m.de === usuarioActual.uid || m.para === usuarioActual.uid)
    .sort((a, b) => {
      const ta = a.creado?.toMillis?.() || 0;
      const tb = b.creado?.toMillis?.() || 0;
      return tb - ta;
    })
    .slice(0, 30);

  lista.replaceChildren();

  if (!propios.length) {
    lista.textContent = "Todavía no hay cartitas. ¡Puedes enviar la primera! 💌";
    return;
  }

  for (const mensaje of propios) {
    const tarjetaMensaje = document.createElement("div");
    tarjetaMensaje.style.cssText =
      "margin:10px 0;padding:14px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(220,120,150,.2);";

    const etiqueta = document.createElement("div");
    etiqueta.style.cssText = "font-size:12px;opacity:.8;margin-bottom:6px;";
    etiqueta.textContent =
      (mensaje.de === usuarioActual.uid ? "Tú enviaste 💌" : "Para ti 💗") +
      " · " + fechaLegible(mensaje.creado?.toDate?.());

    const contenido = document.createElement("div");
    contenido.style.cssText = "white-space:pre-wrap;line-height:1.6;";
    contenido.textContent = mensaje.texto || "";

    tarjetaMensaje.append(etiqueta, contenido);
    lista.append(tarjetaMensaje);
  }
}

onAuthStateChanged(auth, usuario => {
  usuarioActual = usuario;

  if (cancelarEscucha) {
    cancelarEscucha();
    cancelarEscucha = null;
  }

  if (!usuario) {
    if (lista) lista.textContent = "Inicia sesión para ver vuestras cartitas.";
    if (boton) boton.disabled = true;
    return;
  }

  if (!UID_MIEMBROS.includes(usuario.uid)) {
    if (boton) boton.disabled = true;
    mostrarEstado("Esta cuenta no pertenece al espacio privado de la pareja.");
    return;
  }

  if (boton) boton.disabled = false;

  cancelarEscucha = onSnapshot(
    coleccionMensajes(),
    snapshot => {
      documentosActuales = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      escaparYMostrarMensajes(documentosActuales);

      if (document.body.dataset.vistaActual === "mensajes") {
        marcarMensajesComoLeidos();
      } else {
        actualizarContador();
      }
    },
    error => {
      console.error("Error leyendo cartitas:", error.code, error.message);
      if (lista) lista.textContent =
        "No se han podido cargar las cartitas. Comprueba la conexión.";
    }
  );
});

if (boton) {
  boton.addEventListener("click", async () => {
    if (!usuarioActual) {
      mostrarEstado("Inicia sesión para enviar una cartita. ❤️");
      return;
    }

    const destinatario = UID_MIEMBROS.find(uid => uid !== usuarioActual.uid);

    if (!destinatario) {
      mostrarEstado("No hemos encontrado la cuenta de tu pareja.");
      return;
    }

    const disponibles = mensajes.filter(m => m.texto !== ultimoTexto);
    const elegido = disponibles[Math.floor(Math.random() * disponibles.length)];
    ultimoTexto = elegido.texto;

    boton.disabled = true;
    mostrarEstado("Preparando una sorpresa para tu persona favorita… 💗");

    try {
      await addDoc(coleccionMensajes(), {
        de: usuarioActual.uid,
        para: destinatario,
        texto: elegido.texto,
        tipo: elegido.tipo,
        creado: serverTimestamp()
      });

      if (textoSorpresa) textoSorpresa.textContent = elegido.texto;
      if (tarjeta) tarjeta.style.display = "block";

      mostrarEstado("¡Tu cartita se ha enviado! ❤️");
    } catch (error) {
      console.error("Error enviando cartita:", error.code, error.message);
      mostrarEstado(
        error.code === "permission-denied"
          ? "Firebase ha rechazado el envío. Revisaremos los permisos."
          : "No se ha podido enviar. Comprueba la conexión e inténtalo de nuevo."
      );
    } finally {
      boton.disabled = false;
    }
  });
}
