import { auth, db } from "./firebase.js";
import { ponerTextoConIconos } from "./iconos-texto.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

const respuestasRef = collection(
  db,
  "parejas",
  "nuestro-espacio",
  "respuestas-retos"
);

const tipos = {
  manana: {
    estado: "estado-manana",
    lista: "respuestas-manana",
    campo: "respuesta-manana",
    caja: "reto-manana"
  },
  noche: {
    estado: "estado-noche",
    lista: "respuestas-noche",
    campo: "respuesta-noche",
    caja: "reto-noche"
  }
};

let usuarioActual = null;
let respuestasActuales = [];
let cancelarEscucha = null;
const guardando = new Set();

function fechaLocal() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function mostrarEstado(tipo, mensaje) {
  const elemento = document.getElementById(tipos[tipo].estado);
  if (elemento) ponerTextoConIconos(elemento, mensaje);
}

function pintarRespuestas() {
  for (const [tipo, config] of Object.entries(tipos)) {
    const contenedor = document.getElementById(config.lista);
    if (!contenedor) continue;

    contenedor.replaceChildren();

    const delDia = respuestasActuales.filter(
      respuesta =>
        respuesta.fecha === fechaLocal() &&
        respuesta.tipo === tipo
    );

    if (delDia.length === 0) {
      const nota = document.createElement("p");
      ponerTextoConIconos(nota, "Todavía no hay respuestas para este reto. 💕");
      contenedor.appendChild(nota);
      continue;
    }

    for (const respuesta of delDia) {
      const propia = respuesta.uid === usuarioActual?.uid;
      const tarjeta = document.createElement("div");

      tarjeta.style.cssText =
        "margin:12px 0;padding:14px;border-radius:14px;" +
        "background:rgba(139,41,69,.16);" +
        "border:1px solid rgba(220,120,150,.3);";

      const autor = document.createElement("strong");
      ponerTextoConIconos(autor, propia ? "Tu respuesta ❤️" : "Tu pareja 💕");

      const texto = document.createElement("p");
      texto.style.cssText =
        "white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:0;";
      ponerTextoConIconos(texto, respuesta.respuesta || "");

      tarjeta.append(autor, texto);
      contenedor.appendChild(tarjeta);
    }

    const propia = delDia.some(r => r.uid === usuarioActual?.uid);
    const pareja = delDia.some(r => r.uid !== usuarioActual?.uid);

    if (propia && pareja) {
      mostrarEstado(tipo, "Los dos habéis respondido. ¡Qué bonito! ❤️");
    } else if (propia) {
      mostrarEstado(
        tipo,
        "Tu respuesta está sincronizada. Esperando a tu pareja 💌"
      );
    } else if (pareja) {
      mostrarEstado(tipo, "Tu pareja ya ha respondido a este reto 💌");
    }

    const miRespuesta = delDia.find(
      r => r.uid === usuarioActual?.uid
    );
    const campo = document.getElementById(config.campo);

    if (miRespuesta && campo && !guardando.has(tipo)) {
      campo.value = miRespuesta.respuesta || "";
    }
  }
}

async function guardarRespuesta(tipo) {
  const config = tipos[tipo];

  if (!config || !usuarioActual) {
    if (config) {
      mostrarEstado(tipo, "Inicia sesión para compartir tu respuesta.");
    }
    return;
  }

  const campo = document.getElementById(config.campo);
  const respuesta = campo?.value.trim();

  if (!respuesta) {
    alert("Escribe primero tu respuesta ♡");
    return;
  }

  if (guardando.has(tipo)) return;
  guardando.add(tipo);

  const boton = document.querySelector(
    `#${config.caja} button[onclick="guardar('${tipo}')"]`
  );

  if (boton) boton.disabled = true;

  mostrarEstado(tipo, "Guardando y sincronizando tu respuesta… 💗");

  try {
    const fecha = fechaLocal();
    const id = `${fecha}_${tipo}_${usuarioActual.uid}`;

    await setDoc(doc(respuestasRef, id), {
      fecha,
      tipo,
      uid: usuarioActual.uid,
      respuesta,
      actualizado: serverTimestamp()
    });

    mostrarEstado(tipo, "¡Tu respuesta está guardada y compartida! ❤️");
    document.getElementById(config.caja).style.display = "none";
  } catch (error) {
    console.error(
      "Error guardando la respuesta:",
      error.code,
      error.message
    );

    mostrarEstado(
      tipo,
      error.code === "permission-denied"
        ? "Firebase ha denegado el acceso. Hay que revisar sus reglas."
        : "No se pudo sincronizar. Comprueba la conexión e inténtalo de nuevo."
    );
  } finally {
    guardando.delete(tipo);
    if (boton) boton.disabled = false;
  }
}

window.guardar = guardarRespuesta;

onAuthStateChanged(auth, usuario => {
  if (cancelarEscucha) {
    cancelarEscucha();
    cancelarEscucha = null;
  }

  usuarioActual = usuario;
  respuestasActuales = [];
  pintarRespuestas();

  if (!usuario) {
    for (const tipo of Object.keys(tipos)) {
      mostrarEstado(tipo, "Inicia sesión para ver las respuestas compartidas.");
    }
    return;
  }

  cancelarEscucha = onSnapshot(
    respuestasRef,
    snapshot => {
      respuestasActuales = snapshot.docs.map(documento => ({
        id: documento.id,
        ...documento.data()
      }));
      pintarRespuestas();
    },
    error => {
      console.error(
        "Error leyendo las respuestas:",
        error.code,
        error.message
      );

      for (const tipo of Object.keys(tipos)) {
        mostrarEstado(
          tipo,
          error.code === "permission-denied"
            ? "No hay permiso para leer las respuestas en Firestore."
            : "No se pudieron cargar las respuestas compartidas."
        );
      }
    }
  );
});
