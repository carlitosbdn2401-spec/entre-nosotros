import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

const UID_MIEMBROS = [
  "BO9OTnpEPCSCrljTUjRfs2qu39i2",
  "j1mbdehEbCansXpAl3Awwc5azcB3"
];

const RUTA = ["parejas", "nuestro-espacio", "diarioEntradas"];

const URL_AVISOS_DIARIO =
  "https://avisos-diario.carlitos-bdn9836.workers.dev/notificar-diario";

const URL_AVISOS_REACCION =
  "https://avisos-diario.carlitos-bdn9836.workers.dev/notificar-reaccion";

let usuarioActual = null;
let entradasRemotas = [];
let cancelarEscucha = null;
const subidasEnCurso = new Set();

function coleccionDiario() {
  return collection(db, ...RUTA);
}

function comprimirFoto(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo) {
      resolve(null);
      return;
    }

    if (!archivo.type?.startsWith("image/")) {
      reject(new Error("El archivo seleccionado no es una imagen."));
      return;
    }

    const imagen = new Image();
    const url = URL.createObjectURL(archivo);

    imagen.onload = () => {
      try {
        const maxLado = 1000;
        const escala = Math.min(
          1,
          maxLado / Math.max(imagen.width, imagen.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(imagen.width * escala));
        canvas.height = Math.max(1, Math.round(imagen.height * escala));

        const contexto = canvas.getContext("2d");
        contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

        let calidad = 0.72;

        function intentar() {
          const resultado = canvas.toDataURL("image/jpeg", calidad);

          // Dejamos margen para el resto de campos del documento.
          if (resultado.length <= 700000) {
            URL.revokeObjectURL(url);
            resolve(resultado);
            return;
          }

          if (calidad > 0.4) {
            calidad -= 0.1;
            intentar();
            return;
          }

          if (canvas.width > 400 || canvas.height > 400) {
            canvas.width = Math.max(1, Math.round(canvas.width * 0.7));
            canvas.height = Math.max(1, Math.round(canvas.height * 0.7));
            contexto.drawImage(
              imagen, 0, 0, canvas.width, canvas.height
            );
            calidad = 0.55;
            intentar();
            return;
          }

          URL.revokeObjectURL(url);
          reject(new Error(
            "La fotografía sigue siendo demasiado grande para Firestore."
          ));
        }

        intentar();
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se ha podido leer la fotografía."));
    };

    imagen.src = url;
  });
}

async function avisarReaccionDiario(entradaId, reaccion) {
  try {
    const usuario = auth.currentUser;

    if (
      !usuario ||
      usuario.uid !== usuarioActual?.uid ||
      !UID_MIEMBROS.includes(usuario.uid)
    ) {
      return;
    }

    const token = await usuario.getIdToken();
    const eventoId = globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const respuesta = await fetch(URL_AVISOS_REACCION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ entradaId, reaccion, eventoId })
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      throw new Error(`HTTP ${respuesta.status}: ${detalle}`);
    }

    console.info("[Diario] Aviso de reacción enviado.");
  } catch (error) {
    console.error(
      "[Diario] La reacción se guardó, pero no se pudo enviar el aviso:",
      error
    );
  }
}

async function avisarNuevaEntrada(entradaId) {
  try {
    const usuario = auth.currentUser;

    if (
      !usuario ||
      usuario.uid !== usuarioActual?.uid ||
      !UID_MIEMBROS.includes(usuario.uid)
    ) {
      return;
    }

    const token = await usuario.getIdToken();

    const respuesta = await fetch(URL_AVISOS_DIARIO, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ entradaId })
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      throw new Error(`HTTP ${respuesta.status}: ${detalle}`);
    }

    console.info("[Diario] Solicitud de notificación enviada.");
  } catch (error) {
    console.error(
      "[Diario] La entrada se guardó, pero no se pudo enviar el aviso:",
      error
    );
  }
}

async function guardarEnNube(entrada, idDocumento) {
  if (!usuarioActual || !UID_MIEMBROS.includes(usuarioActual.uid)) {
    throw new Error("Inicia sesión con una cuenta autorizada.");
  }

  const fotoData = entrada.fotoData ||
    (entrada.foto ? await comprimirFoto(entrada.foto) : null);

  const datos = {
    tipo: entrada.tipo,
    texto: entrada.texto || "",
    fecha: entrada.fecha || new Date().toLocaleDateString("es-ES"),
    fotoData,
    autorUid: usuarioActual.uid,
    localId: Number.isInteger(entrada.id) ? entrada.id : null,
    actualizado: serverTimestamp()
  };

  if (JSON.stringify(datos).length > 850000) {
    throw new Error("La entrada es demasiado grande para compartirla.");
  }

  const referencia = idDocumento
    ? doc(db, ...RUTA, idDocumento)
    : doc(coleccionDiario());

  // Consultamos antes de guardar para no avisar al reintentar
  // la sincronización de una entrada que ya existe.
  const documentoAnterior = await getDoc(referencia);
  const esNuevaEntrada = !documentoAnterior.exists();

  await setDoc(referencia, {
    ...datos,
    creado: serverTimestamp()
  }, { merge: true });

  if (esNuevaEntrada) {
    await avisarNuevaEntrada(referencia.id);
  }

  return referencia.id;
}

export async function compartirEntradaLocal(entrada) {
  if (!usuarioActual || !UID_MIEMBROS.includes(usuarioActual.uid)) {
    return null;
  }

  const clave = `${usuarioActual.uid}-${entrada.id}`;

  if (entrada.cloudId || subidasEnCurso.has(clave)) {
    return entrada.cloudId || null;
  }

  subidasEnCurso.add(clave);

  try {
    const idDocumento = `local-${usuarioActual.uid}-${entrada.id}`;
    const cloudId = await guardarEnNube(entrada, idDocumento);
    await actualizarCloudIdLocal(entrada.id, cloudId);
    return cloudId;
  } finally {
    subidasEnCurso.delete(clave);
  }
}

function actualizarCloudIdLocal(id, cloudId) {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open("entre-nosotros-diario", 1);

    solicitud.onerror = () => reject(solicitud.error);

    solicitud.onsuccess = () => {
      const base = solicitud.result;

      if (!base.objectStoreNames.contains("entradas")) {
        base.close();
        resolve();
        return;
      }

      const transaccion = base.transaction("entradas", "readwrite");
      const almacen = transaccion.objectStore("entradas");
      const lectura = almacen.get(id);

      lectura.onsuccess = () => {
        if (lectura.result) {
          almacen.put({ ...lectura.result, cloudId });
        }
      };

      transaccion.oncomplete = () => {
        base.close();
        resolve();
      };

      transaccion.onerror = () => {
        base.close();
        reject(transaccion.error);
      };
    };
  });
}

function eliminarCopiaLocalPorCloudId(cloudId) {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open("entre-nosotros-diario", 1);

    solicitud.onerror = () => reject(solicitud.error);

    solicitud.onsuccess = () => {
      const base = solicitud.result;

      if (!base.objectStoreNames.contains("entradas")) {
        base.close();
        resolve();
        return;
      }

      const transaccion = base.transaction("entradas", "readwrite");
      const almacen = transaccion.objectStore("entradas");
      const lectura = almacen.getAll();

      lectura.onsuccess = () => {
        for (const entrada of lectura.result) {
          if (entrada.cloudId === cloudId) {
            almacen.delete(entrada.id);
          }
        }
      };

      transaccion.oncomplete = () => {
        base.close();
        resolve();
      };

      transaccion.onerror = () => {
        base.close();
        reject(transaccion.error);
      };
    };
  });
}

export async function combinarEntradas(locales) {
  const remotas = entradasRemotas.map(entrada => ({
    ...entrada,
    foto: null
  }));

  const idsRemotos = new Set(remotas.map(entrada => entrada.id));

  const pendientes = locales.filter(entrada =>
    !entrada.cloudId &&
    usuarioActual &&
    UID_MIEMBROS.includes(usuarioActual.uid)
  );

  for (const entrada of pendientes) {
    compartirEntradaLocal(entrada).catch(error => {
      console.error("No se pudo sincronizar una entrada:", error);
    });
  }

  const localesSinSubir = locales.filter(entrada =>
    !entrada.cloudId && !idsRemotos.has(entrada.id)
  );

  return [...remotas, ...localesSinSubir].sort((a, b) => {
    const fechaA = a.creado?.toMillis?.() || 0;
    const fechaB = b.creado?.toMillis?.() || 0;
    return fechaB - fechaA;
  });
}

export async function guardarEntradaCompartida(entrada) {
  return guardarEnNube(entrada, null);
}

export async function guardarReaccionDiario(entrada, reaccion) {
  const usuario = auth.currentUser;
  const reaccionesPermitidas = ["❤️", "💔", "🥰", "😂", "🔥"];

  if (!usuario || !UID_MIEMBROS.includes(usuario.uid)) {
    throw new Error("Inicia sesión con una cuenta autorizada.");
  }

  if (!entrada?.cloudId) {
    throw new Error("Esta entrada todavía no está sincronizada con Firebase.");
  }

  if (!reaccionesPermitidas.includes(reaccion)) {
    throw new Error("La reacción seleccionada no es válida.");
  }

  await updateDoc(doc(db, ...RUTA, entrada.cloudId), {
    [`reacciones.${usuario.uid}`]: reaccion,
    actualizado: serverTimestamp()
  });

  await avisarReaccionDiario(entrada.cloudId, reaccion);
}

export async function eliminarEntradaCompartida(entrada) {
  if (!entrada.cloudId) return;

  if (!usuarioActual || !UID_MIEMBROS.includes(usuarioActual.uid)) {
    throw new Error("No tienes permiso para eliminar esta entrada.");
  }

  await deleteDoc(doc(db, ...RUTA, entrada.cloudId));
  await eliminarCopiaLocalPorCloudId(entrada.cloudId);
}

onAuthStateChanged(auth, usuario => {
  if (cancelarEscucha) {
    cancelarEscucha();
    cancelarEscucha = null;
  }

  usuarioActual = usuario;
  entradasRemotas = [];

  if (!usuario || !UID_MIEMBROS.includes(usuario.uid)) {
    window.dispatchEvent(new CustomEvent("diario-sincronizado"));
    return;
  }

  cancelarEscucha = onSnapshot(
    coleccionDiario(),
    snapshot => {
      const idsAnteriores = new Set(entradasRemotas.map(entrada => entrada.id));

      entradasRemotas = snapshot.docs.map(documento => ({
        ...documento.data(),
        id: documento.id,
        cloudId: documento.id
      }));

      const idsActuales = new Set(entradasRemotas.map(entrada => entrada.id));

      for (const id of idsAnteriores) {
        if (!idsActuales.has(id)) {
          eliminarCopiaLocalPorCloudId(id).catch(error => {
            console.error("No se pudo limpiar una entrada eliminada:", error);
          });
        }
      }

      window.dispatchEvent(new CustomEvent("diario-sincronizado"));
    },
    error => {
      console.error("Error al sincronizar el diario:", error);
    }
  );
});
