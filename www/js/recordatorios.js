import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const IDS_RECORDATORIOS = [1010, 1020];
const CANAL_RECORDATORIOS = "retos-diarios";

function proximaHora(hora, minuto) {
  const ahora = new Date();
  const fecha = new Date();

  fecha.setHours(hora, minuto, 0, 0);

  if (fecha.getTime() <= ahora.getTime()) {
    fecha.setDate(fecha.getDate() + 1);
  }

  return fecha;
}

async function programarRecordatorios() {
  if (!Capacitor.isNativePlatform()) {
    console.info("[Recordatorios] Solo se programan en la app Android.");
    return;
  }

  try {
    let permisos = await LocalNotifications.checkPermissions();

    if (permisos.display !== "granted") {
      permisos = await LocalNotifications.requestPermissions();
    }

    if (permisos.display !== "granted") {
      console.warn("[Recordatorios] No se concedió permiso para notificar.");
      return;
    }

    await LocalNotifications.createChannel({
      id: CANAL_RECORDATORIOS,
      name: "Retos diarios",
      description: "Recordatorios románticos de Entre Nosotros",
      importance: 4,
      visibility: 1,
      vibration: true,
      lights: true
    });

    const pendientes = await LocalNotifications.getPending();
    const existentes = pendientes.notifications
      .filter((notificacion) => IDS_RECORDATORIOS.includes(notificacion.id))
      .map((notificacion) => ({ id: notificacion.id }));

    if (existentes.length) {
      await LocalNotifications.cancel({ notifications: existentes });
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1010,
          title: "Buenos días, mi amor ❤️",
          body: "Tu reto de la mañana te espera. Un pequeño detalle puede alegrarnos el día. 💕",
          channelId: CANAL_RECORDATORIOS,
          schedule: {
            at: proximaHora(10, 0),
            repeats: true,
            allowWhileIdle: true
          },
          extra: { tipo: "reto-manana" }
        },
        {
          id: 1020,
          title: "Un momento para nosotros 💗",
          body: "Ya es hora de nuestro reto de la tarde. ¿Te acuerdas de mí? ❤️",
          channelId: CANAL_RECORDATORIOS,
          schedule: {
            at: proximaHora(20, 0),
            repeats: true,
            allowWhileIdle: true
          },
          extra: { tipo: "reto-tarde" }
        }
      ]
    });

    const comprobacion = await LocalNotifications.getPending();
    const programadas = comprobacion.notifications.filter(
      (notificacion) => IDS_RECORDATORIOS.includes(notificacion.id)
    );

    console.info(
      `[Recordatorios] Recordatorios pendientes: ${programadas.length} de 2.`
    );

    for (const notificacion of programadas) {
      console.info(
        `[Recordatorios] ID ${notificacion.id}: ${notificacion.title}`
      );
    }
  } catch (error) {
    console.error(
      "[Recordatorios] No se pudieron programar:",
      error?.code || "",
      error?.message || error
    );
  }
}

void programarRecordatorios();
