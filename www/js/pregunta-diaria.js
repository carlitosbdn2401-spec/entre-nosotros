import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, doc, onSnapshot, setDoc, serverTimestamp
} from "firebase/firestore";

const raiz = document.getElementById("pregunta-diaria-contenido");
if (!raiz) throw new Error("No se encuentra pregunta-diaria-contenido");

const preguntas = [
  "¿Qué pequeño detalle mío te hace sentir querido/a?",
  "¿Qué recuerdo nuestro te hace sonreír siempre?",
  "¿Qué te gustaría que hiciéramos juntos próximamente?",
  "¿En qué momento te has sentido especialmente cerca de mí?",
  "¿Qué es lo que más admiras de nuestra relación?",
  "¿Qué plan sencillo te hace ilusión compartir conmigo?",
  "¿Qué canción te recuerda a nosotros y por qué?",
  "¿Qué gesto mío te alegra un día difícil?",
  "¿Qué lugar te gustaría descubrir conmigo?",
  "¿Qué has aprendido de ti desde que estamos juntos?",
  "¿Cuál sería para ti una tarde perfecta a mi lado?",
  "¿Qué cosa nueva te gustaría aprender conmigo?",
  "¿Qué momento cotidiano nuestro te gustaría guardar para siempre?",
  "¿Qué te gustaría que hiciéramos más a menudo?",
  "¿Qué es lo que te hace sentir más comprendido/a?",
  "¿Qué sueño te gustaría que cumpliéramos juntos?",
  "¿Qué fue lo primero que te llamó la atención de mí?",
  "¿Qué tradición bonita podríamos crear como pareja?",
  "¿Qué palabra describe mejor lo que sientes por mí hoy?",
  "¿Qué puedo hacer para que te sientas más acompañado/a?"
];

function fechaLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function preguntaDelDia(fecha) {
  let hash = 0;
  for (const c of fecha) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return { id: hash % preguntas.length, texto: preguntas[hash % preguntas.length] };
}

const escapar = texto => String(texto ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
})[c]);

raiz.innerHTML = `
<style>
#pregunta-diaria-contenido .momento-titulo {
  margin:0 0 14px;text-align:center;color:#F7D9A5;
  font-family:'Great Vibes',cursive;font-size:30px;font-weight:normal;line-height:1.3;
}
#pregunta-diaria-contenido .momento-tarjetas {
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;
}
#pregunta-diaria-contenido .momento-tarjeta {
  min-width:0;min-height:112px;height:100%;box-sizing:border-box;
  padding:12px 5px;text-align:center;display:flex;
  flex-direction:column;align-items:center;justify-content:center;gap:5px;
  border:1px solid #B89A62;border-radius:13px;
  background:linear-gradient(145deg,#482033,#351522 55%,#1c1017);
  box-shadow:inset 1px 1px 0 rgba(247,217,165,.15),0 3px 0 #0b0609,0 5px 8px rgba(0,0,0,.3);
  color:#F7D9A5;font:inherit;
}
#pregunta-diaria-contenido button.momento-activo {
  appearance:none;-webkit-appearance:none;width:100%;margin:0;
  cursor:pointer;font-family:inherit;
}
#pregunta-diaria-contenido .momento-seleccionado {
  border:2px solid #F7D9A5 !important;
  background:linear-gradient(145deg,#85506a,#603047 55%,#3d1b2c) !important;
  box-shadow:inset 0 0 0 1px rgba(247,217,165,.55),
    0 0 14px rgba(247,217,165,.5),0 3px 0 #0b0609 !important;
  filter:brightness(1.15);

}
#pregunta-diaria-contenido .momento-activo:focus-visible {
  outline:2px solid #F7D9A5;outline-offset:3px;
}
#pregunta-diaria-contenido .momento-simbolo {
  display:block;margin-bottom:7px;color:#F7D9A5;font-size:25px;line-height:1.2;
}
#pregunta-diaria-contenido .momento-nombre {
  display:block;margin-bottom:6px;color:#F7D9A5;
  font-family:'Great Vibes',cursive;font-size:19px;font-weight:normal;line-height:1.3;
}
#pregunta-diaria-contenido .momento-detalle {
  display:block;color:#ead9df;font-family:Lora,Georgia,serif;font-size:11px;line-height:1.4;
}
#pregunta-diaria-contenido .pd-panel {
  margin-top:18px;padding:16px;border:1px solid #754052;border-radius:15px;
  background:#21131b;color:#f5e9ed;
}
#pregunta-diaria-contenido .pd-panel h3 {
  margin:0 0 12px;color:#F7D9A5;font-family:'Great Vibes',cursive;
  font-size:26px;font-weight:normal;
}
#pregunta-diaria-contenido .pd-panel textarea {
  display:block;width:100%;min-height:100px;box-sizing:border-box;margin:10px 0;
  padding:12px;border:1px solid #754052;border-radius:10px;
  background:#12090e;color:#fff;font-family:Lora,Georgia,serif;font-size:14px;resize:vertical;
}
#pregunta-diaria-contenido .pd-panel button {
  width:100%;padding:11px;border:1px solid #B89A62;border-radius:10px;
  background:#681b32;color:#fff;font-family:'Great Vibes',cursive;font-size:20px;
}
#pregunta-diaria-contenido .pd-respuesta {
  margin:10px 0;padding:12px;border-radius:10px;background:#351522;
  overflow-wrap:anywhere;white-space:pre-wrap;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.6;
}
@media(max-width:360px) {
  #pregunta-diaria-contenido .momento-tarjetas {gap:5px}
  #pregunta-diaria-contenido .momento-tarjeta {padding:10px 3px}
  #pregunta-diaria-contenido .momento-nombre {font-size:17px}
  #pregunta-diaria-contenido .momento-detalle {font-size:10px}
}
</style>
<div id="nuestro-momento-hoy">
  <h3 class="momento-titulo">Nuestro momento de hoy</h3>
  <div class="momento-tarjetas">
    <button type="button" class="momento-tarjeta momento-activo" data-panel="pregunta">
      <span class="momento-simbolo" aria-hidden="true">✦</span>
      <span class="momento-nombre">Una pregunta</span>
      <span class="momento-detalle">Descubrir algo nuevo</span>
    </button>
    <button type="button" class="momento-tarjeta momento-activo" data-panel="respuestas">
      <span class="momento-simbolo" aria-hidden="true">♡</span>
      <span class="momento-nombre">Dos respuestas</span>
      <span class="momento-detalle">Compartir lo que sentimos</span>
    </button>
    <button type="button" class="momento-tarjeta momento-activo" data-panel="momento" aria-pressed="false">
      <span class="momento-simbolo" aria-hidden="true">✧</span>
      <span class="momento-nombre">Un momento</span>
      <span class="momento-detalle">Algo especial entre nosotros</span>
    </button>
  </div>
</div>
<div id="pd-panel" class="pd-panel" aria-live="polite">Comprobando la sesión…</div>
`;

let usuario = null;
let pregunta = null;
let fechaActual = "";
let respuestas = [];
let panelActual = "pregunta";
let cancelarFecha = null;
let cancelarRespuestas = null;
let cancelAuth = null;
let guardando = false;

const panel = () => document.getElementById("pd-panel");
const base = () => ["parejas","nuestro-espacio","preguntas-diarias"];

function actualizarTarjeta(seleccionada) {
  document.querySelectorAll("#nuestro-momento-hoy [data-panel]").forEach(boton => {
    const activa = boton.dataset.panel === seleccionada;
    boton.classList.toggle("momento-seleccionado", activa);
    boton.setAttribute("aria-pressed", String(activa));
  });
}

function mostrarPregunta() {
  panelActual = "pregunta";
  actualizarTarjeta("pregunta");
  panel().innerHTML = pregunta
    ? `<h3>La pregunta de hoy</h3>
       <p style="font-family:'Great Vibes',cursive;font-size:25px;line-height:1.5">${escapar(pregunta.texto)}</p>
       <p style="font-size:12px;color:#ead9df">Fecha: ${escapar(fechaActual)}</p>
       <button type="button" data-ir-respuestas>Escribir nuestras respuestas ♡</button>`
    : "Cargando la pregunta de hoy…";
}

function mostrarRespuestas() {
  panelActual = "respuestas";
  actualizarTarjeta("respuestas");
  const propia = respuestas.find(r => r.uid === usuario?.uid);
  const pareja = respuestas.find(r => r.uid !== usuario?.uid);
  const textoPropio = document.getElementById("pd-respuesta-propia")?.value
    ?? propia?.respuesta ?? "";

  panel().innerHTML = `
    <h3>Dos respuestas</h3>
    <p style="font-family:'Great Vibes',cursive;font-size:25px;line-height:1.5">${escapar(pregunta?.texto || "Cargando pregunta…")}</p>
    <form id="pd-formulario">
      <label for="pd-respuesta-propia">Tu respuesta</label>
      <textarea id="pd-respuesta-propia" maxlength="2000" required
        placeholder="Escribe aquí lo que sientes…">${escapar(textoPropio)}</textarea>
      <button type="submit" ${guardando || !pregunta ? "disabled" : ""}>
        ${guardando ? "Guardando…" : "Guardar mi respuesta ♡"}
      </button>
      <p id="pd-estado" role="status"></p>
    </form>
    <h3 style="margin-top:20px">Lo que compartimos</h3>
    <div class="pd-respuesta"><strong>Tu respuesta</strong><p>${escapar(propia?.respuesta || "Todavía no has respondido.")}</p></div>
    <div class="pd-respuesta"><strong>Respuesta de tu pareja</strong><p>${escapar(pareja?.respuesta || "Tu pareja aún no ha respondido.")}</p></div>
  `;

  document.getElementById("pd-formulario").addEventListener("submit", guardarRespuesta);
}

async function guardarRespuesta(evento) {
  evento.preventDefault();
  if (!usuario || !pregunta || guardando) return;

  const campo = document.getElementById("pd-respuesta-propia");
  const texto = campo.value.trim();
  const estado = document.getElementById("pd-estado");
  if (!texto) {
    estado.textContent = "Escribe tu respuesta antes de guardarla.";
    return;
  }

  guardando = true;
  const boton = document.querySelector("#pd-formulario button[type=submit]");
  boton.disabled = true;
  boton.textContent = "Guardando…";

  try {
    const ref = doc(db, ...base(), fechaActual, "respuestas", usuario.uid);
    await setDoc(ref, {
      uid: usuario.uid,
      respuesta: texto,
      actualizadoEn: serverTimestamp()
    });
    estado.textContent = "Respuesta guardada y compartida ♡";
  } catch (error) {
    console.error("Error guardando la respuesta:", error);
    estado.textContent = error.code === "permission-denied"
      ? "Firebase ha denegado el acceso. Revisa las reglas."
      : "No se pudo guardar. Comprueba la conexión e inténtalo de nuevo.";
  } finally {
    guardando = false;
    mostrarRespuestas();
  }
}

function iniciarFecha() {
  if (cancelarFecha) cancelarFecha();
  if (cancelarRespuestas) cancelarRespuestas();
  cancelarFecha = cancelarRespuestas = null;
  pregunta = null;
  respuestas = [];
  fechaActual = fechaLocal();
  const elegida = preguntaDelDia(fechaActual);
  const ref = doc(db, ...base(), fechaActual);

  cancelarFecha = onSnapshot(ref, async snapshot => {
    if (!snapshot.exists()) {
      try {
        await setDoc(ref, {
          fecha: fechaActual,
          preguntaId: elegida.id,
          pregunta: elegida.texto,
          creadoEn: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Error preparando la pregunta diaria:", error);
        panel().textContent = error.code === "permission-denied"
          ? "Firebase ha denegado el acceso a la pregunta diaria."
          : "No se pudo cargar la pregunta. Comprueba la conexión.";
      }
      return;
    }

    const datos = snapshot.data();
    pregunta = {
      id: datos.preguntaId ?? elegida.id,
      texto: datos.pregunta || elegida.texto
    };

    if (!cancelarRespuestas) {
      const refRespuestas = collection(db, ...base(), fechaActual, "respuestas");
      cancelarRespuestas = onSnapshot(refRespuestas, snap => {
        respuestas = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        if (panelActual === "respuestas") mostrarRespuestas();
      }, error => {
        console.error("Error leyendo las respuestas:", error);
        if (panelActual === "respuestas") {
          panel().textContent = error.code === "permission-denied"
            ? "Firebase ha denegado el acceso a las respuestas."
            : "No se pudieron cargar las respuestas compartidas.";
        }
      });
    }

    if (panelActual === "pregunta") mostrarPregunta();
    else mostrarRespuestas();
  }, error => {
    console.error("Error leyendo la pregunta diaria:", error);
    panel().textContent = error.code === "permission-denied"
      ? "Firebase ha denegado el acceso. Revisa las reglas."
      : "No se pudo sincronizar la pregunta diaria.";
  });
}

function mostrarMomento() {
  panelActual = "momento";
  actualizarTarjeta("momento");
  if (typeof window.mostrarVista === "function") {
    window.mostrarVista("diario");
  }
}

raiz.addEventListener("click", evento => {
  if (evento.target.closest("[data-panel='pregunta']")) mostrarPregunta();
  if (evento.target.closest("[data-panel='respuestas']")) mostrarRespuestas();
  if (evento.target.closest("[data-panel='momento']")) mostrarMomento();
  if (evento.target.closest("[data-ir-respuestas]")) mostrarRespuestas();
});

cancelAuth = onAuthStateChanged(auth, nuevoUsuario => {
  usuario = nuevoUsuario;
  if (cancelarFecha) cancelarFecha();
  if (cancelarRespuestas) cancelarRespuestas();
  cancelarFecha = cancelarRespuestas = null;
  pregunta = null;
  respuestas = [];

  if (!usuario) {
    panel().textContent = "Inicia sesión para compartir la pregunta y las respuestas.";
    return;
  }
  panelActual = "pregunta";
  iniciarFecha();
});

window.addEventListener("beforeunload", () => {
  if (cancelarFecha) cancelarFecha();
  if (cancelarRespuestas) cancelarRespuestas();
  if (cancelAuth) cancelAuth();
});
