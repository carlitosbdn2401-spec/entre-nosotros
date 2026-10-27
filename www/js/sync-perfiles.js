import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

const perfilRef = () =>
  doc(db, "parejas", "nuestro-espacio", "perfiles", "configuracion");

let detenerEscucha = null;
let guardandoDesdeNube = false;

function normalizarAvatar(valor) {
  const antiguos = {
    '❤️': '/assets/iconos-realistas/Icono1.png',
    '💕': '/assets/iconos-realistas/Icono1.png',
    '🌹': '/assets/iconos-realistas/perfil-rosa.png',
    '🖤': '/assets/iconos-realistas/perfil-corazon-negro.png',
    '🦋': '/assets/iconos-realistas/perfil-mariposa.png',
    '🌙': '/assets/iconos-realistas/perfil-luna.png',
    '🐻': '/assets/iconos-realistas/perfil-oso.png',
    '😘': '/assets/iconos-realistas/perfil-beso.png',
    '✨': '/assets/iconos-realistas/Icono8.png'
  };
  if (antiguos[valor]) return antiguos[valor];
  if (Object.values(antiguos).includes(valor)) return valor;
  return '/assets/iconos-realistas/Icono1.png';
}


function leerPerfilesLocales() {
  try {
    return JSON.parse(
      localStorage.getItem("perfiles-pareja") || "{}"
    );
  } catch {
    return {};
  }
}

function aplicarPerfiles(datos) {
  guardandoDesdeNube = true;


  datos = {
    ...datos,
    miAvatar: normalizarAvatar(datos.miAvatar || '❤️'),
    parejaAvatar: normalizarAvatar(datos.parejaAvatar || '💕')
  };

localStorage.setItem("perfiles-pareja", JSON.stringify(datos));

  const campos = {
    miNombre: datos.miNombre || "",
    parejaNombre: datos.parejaNombre || "",
    miAvatar: datos.miAvatar || "❤️",
    parejaAvatar: datos.parejaAvatar || "💕"
  };

  for (const [id, valor] of Object.entries(campos)) {
    const campo = document.getElementById(id);
    if (campo) campo.value = valor;
  }

  if (typeof window.actualizarVistaPerfiles === "function") {
    window.actualizarVistaPerfiles();
  }

  const estado = document.getElementById("estado-perfiles");
  if (estado) estado.textContent = "Perfiles sincronizados ❤️";

  guardandoDesdeNube = false;
}

async function guardarEnNube() {
  if (!auth.currentUser || guardandoDesdeNube) return;

  const datos = leerPerfilesLocales();

  try {
    await setDoc(perfilRef(), {
      ...datos,
      actualizado: serverTimestamp(),
      actualizadoPor: auth.currentUser.uid
    });

    const estado = document.getElementById("estado-perfiles");
    if (estado) estado.textContent = "Perfiles guardados y sincronizados ❤️";
  } catch (error) {
    console.error("Error sincronizando perfiles:", error);
    const estado = document.getElementById("estado-perfiles");
    if (estado) {
      estado.textContent =
        `Error ${error.code || "desconocido"}: ${error.message || "sin detalles"} | UID: ${auth.currentUser?.uid || "sin sesión"}`;
    }
  }
}

onAuthStateChanged(auth, (usuario) => {
  if (detenerEscucha) {
    detenerEscucha();
    detenerEscucha = null;
  }

  if (!usuario) return;

  detenerEscucha = onSnapshot(
    perfilRef(),
    async (snapshot) => {
      if (snapshot.exists()) {
        aplicarPerfiles(snapshot.data());
      } else {
        await guardarEnNube();
      }
    },
    (error) => {
      console.error("Error leyendo perfiles:", error);
      const estado = document.getElementById("estado-perfiles");
      if (estado) {
        estado.textContent =
          "No se pudieron cargar los perfiles. Revisa los permisos de Firestore.";
      }
    }
  );
});

document.addEventListener("DOMContentLoaded", () => {
  const boton = document.querySelector(
    'button[onclick="guardarPerfiles()"]'
  );

  if (boton) {
    boton.addEventListener("click", () => {
      setTimeout(guardarEnNube, 0);
    });
  }
});
