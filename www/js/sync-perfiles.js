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
