const {setGlobalOptions} = require("firebase-functions");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp, getApps} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const crypto = require("crypto");

setGlobalOptions({region: "europe-west1", maxInstances: 3});

if (getApps().length === 0) initializeApp();

const db = getFirestore();

const MIEMBROS_AUTORIZADOS = [
  "BO9OTnpEPCSCrljTUjRfs2qu39i2",
  "j1mbdehEbCansXpAl3Awwc5azcB3",
];

const PREMIOS = [
  {nombre: "Puntos extra", peso: 30},
  {nombre: "Vale romántico", peso: 25},
  {nombre: "Cena o experiencia", peso: 20},
  {nombre: "Premio picante normal", peso: 19},
  {nombre: "Nuestro secreto ❤️‍🔥", peso: 1},
  {nombre: "Premio exclusivo legendario", peso: 5},
];

function obtenerMesMadrid() {
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find(p => p.type === "year").value;
  const mes = partes.find(p => p.type === "month").value;
  return `${anio}-${mes}`;
}

function elegirPremio() {
  const numero = crypto.randomInt(0, 100);
  let acumulado = 0;

  for (const premio of PREMIOS) {
    acumulado += premio.peso;
    if (numero < acumulado) return premio.nombre;
  }

  throw new Error("No se pudo determinar el premio.");
}

exports.ruletaPareja = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Debes iniciar sesión para utilizar la ruleta."
    );
  }

  const uid = request.auth.uid;

  if (!MIEMBROS_AUTORIZADOS.includes(uid)) {
    throw new HttpsError(
      "permission-denied",
      "No tienes permiso para utilizar esta ruleta."
    );
  }

  const accion = request.data?.accion;

  if (accion !== "estado" && accion !== "girar") {
    throw new HttpsError(
      "invalid-argument",
      "La acción solicitada no es válida."
    );
  }

  const mes = obtenerMesMadrid();
  const referencia = db.collection("ruletaSegura")
      .doc(`${uid}_${mes}`);

  if (accion === "estado") {
    const documento = await referencia.get();
    const datos = documento.exists ? documento.data() : {};
    const giros = Array.isArray(datos.giros) ? datos.giros : [];

    return {
      mes,
      utilizadas: giros.length,
      disponibles: Math.max(0, 2 - giros.length),
      giros: giros.map(g => ({
        premio: g.premio,
        fecha: g.fecha,
      })),
    };
  }

  const requestId = request.data?.requestId;

  if (
    typeof requestId !== "string" ||
    !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "La identificación de la tirada no es válida."
    );
  }

  return db.runTransaction(async (transaccion) => {
    const documento = await transaccion.get(referencia);
    const datos = documento.exists ? documento.data() : {};
    const giros = Array.isArray(datos.giros) ? datos.giros : [];

    const repetida = giros.find(g => g.requestId === requestId);

    if (repetida) {
      return {
        premio: repetida.premio,
        mes,
        utilizadas: giros.length,
        disponibles: Math.max(0, 2 - giros.length),
        repetida: true,
      };
    }

    if (giros.length >= 2) {
      throw new HttpsError(
        "resource-exhausted",
        "Ya has utilizado tus dos tiradas de este mes."
      );
    }

    const premio = elegirPremio();

    const nuevosGiros = [
      ...giros,
      {
        requestId,
        premio,
        fecha: new Date().toISOString(),
      },
    ];

    transaccion.set(referencia, {
      uid,
      mes,
      giros: nuevosGiros,
      updatedAt: FieldValue.serverTimestamp(),
      ...(documento.exists
        ? {}
        : {createdAt: FieldValue.serverTimestamp()}),
    });

    return {
      premio,
      mes,
      utilizadas: nuevosGiros.length,
      disponibles: 2 - nuevosGiros.length,
      repetida: false,
    };
  });
});

const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {getMessaging} = require("firebase-admin/messaging");

exports.notificarDiario = onDocumentCreated(
  "parejas/nuestro-espacio/diarioEntradas/{entradaId}",
  async (event) => {
    const documento = event.data;
    if (!documento) return;

    const entrada = documento.data();
    const autorUid = entrada.autorUid;

    if (!MIEMBROS_AUTORIZADOS.includes(autorUid)) {
      console.warn("[Diario] Entrada ignorada: autor no autorizado.");
      return;
    }

    const destinatarioUid = MIEMBROS_AUTORIZADOS.find(
      (uid) => uid !== autorUid
    );

    const avisoRef = db.collection("diarioAvisosEnviados")
      .doc(`${event.params.entradaId}_${destinatarioUid}`);

    const dispositivoRef = db.collection("parejas")
      .doc("nuestro-espacio")
      .collection("dispositivos")
      .doc(destinatarioUid);

    const resultado = await db.runTransaction(async (tx) => {
      const aviso = await tx.get(avisoRef);
      if (aviso.exists) return { enviado: false };

      const dispositivo = await tx.get(dispositivoRef);
      const token = dispositivo.exists ? dispositivo.data().token : null;
      if (!token) return { enviado: false, sinToken: true };

      tx.create(avisoRef, {
        entradaId: event.params.entradaId,
        destinatarioUid,
        estado: "pendiente",
        creado: FieldValue.serverTimestamp()
      });

      return { enviado: true, token };
    });

    if (resultado.sinToken) {
      console.warn("[Diario] El destinatario todavía no tiene token registrado.");
      return;
    }
    if (!resultado.enviado) {
      console.info("[Diario] Aviso ya registrado; no se duplica.");
      return;
    }

    const esFoto = Boolean(entrada.fotoData);
    const mensaje = {
      token: resultado.token,
      notification: {
        title: "Entre Nosotros 💌",
        body: esFoto
          ? "Tu pareja ha compartido una foto en el diario."
          : "Tu pareja ha añadido una nueva entrada al diario."
      },
      data: {
        tipo: "diario",
        entradaId: String(event.params.entradaId),
        seccion: String(entrada.tipo || "")
      },
      android: { priority: "high" }
    };

    try {
      await getMessaging().send(mensaje);
      await avisoRef.update({
        estado: "enviado",
        enviado: FieldValue.serverTimestamp()
      });
      console.info("[Diario] Notificación enviada al otro miembro.");
    } catch (error) {
      await avisoRef.update({
        estado: "error",
        error: String(error.code || error.message || "Error desconocido")
      });
      throw error;
    }
  }
);
