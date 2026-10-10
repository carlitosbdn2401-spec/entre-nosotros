import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase.js";

const UID_MIEMBROS = [
  "BO9OTnpEPCSCrljTUjRfs2qu39i2",
  "j1mbdehEbCansXpAl3Awwc5azcB3"
];

let uidRegistrado = null;
let iniciando = false;

async function iniciarNotificaciones(usuario) {
  if (!Capacitor.isNativePlatform()) {
    console.info("[Notificaciones] Navegador web: registro push nativo omitido.");
    return;
  }

  if (!usuario || !UID_MIEMBROS.includes(usuario.uid)) return;
  if (iniciando || uidRegistrado === usuario.uid) return;

  iniciando = true;

  try {
    await PushNotifications.addListener("registration", async (token) => {
      try {
        if (auth.currentUser?.uid !== usuario.uid) return;

        await setDoc(
          doc(db, "parejas", "nuestro-espacio", "dispositivos", usuario.uid),
          {
            token: token.value,
            plataforma: "android",
            actualizado: serverTimestamp()
          },
          { merge: true }
        );

        uidRegistrado = usuario.uid;
        console.info("[Notificaciones] Token del dispositivo guardado correctamente.");
      } catch (error) {
        console.error(
          "[Notificaciones] No se pudo guardar el token:",
          error.code || "",
          error.message
        );
      }
    });

    await PushNotifications.addListener("registrationError", (error) => {
      console.error("[Notificaciones] Error de registro:", error.error);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.info("[Notificaciones] Aviso recibido:", notification.title || "Sin título");
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.info("[Notificaciones] El usuario abrió una notificación.");
      window.dispatchEvent(new CustomEvent("notificacion-abierta", {
        detail: action.notification
      }));
    });

    let permiso = await PushNotifications.checkPermissions();

    if (permiso.receive === "prompt") {
      permiso = await PushNotifications.requestPermissions();
    }

    if (permiso.receive !== "granted") {
      console.warn("[Notificaciones] Permiso no concedido:", permiso.receive);
      return;
    }

    await PushNotifications.register();
    console.info("[Notificaciones] Solicitud de registro enviada a Android.");
  } catch (error) {
    console.error(
      "[Notificaciones] Error al iniciar:",
      error.code || "",
      error.message || error
    );
  } finally {
    iniciando = false;
  }
}

onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    uidRegistrado = null;
    return;
  }

  iniciarNotificaciones(usuario);
});
