import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence
} from "firebase/auth";

const formulario = document.getElementById("formularioAcceso");
const acceso = document.getElementById("accesoFirebase");
const contenido = document.getElementById("contenidoApp");
const mensaje = document.getElementById("mensajeAcceso");
const pruebaRuleta = new URLSearchParams(location.search).get("pruebaRuleta") === "1";
const pruebaPerfiles = new URLSearchParams(location.search).get("pruebaPerfiles") === "1";

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const correo = document.getElementById("correoAcceso").value.trim();
  const clave = document.getElementById("claveAcceso").value;
  const recordar = document.getElementById("recordarmeAcceso").checked;

  mensaje.textContent = "Comprobando tu cuenta…";

  try {
    await setPersistence(
      auth,
      recordar ? browserLocalPersistence : inMemoryPersistence
    );
    await signInWithEmailAndPassword(auth, correo, clave);
    mensaje.textContent = "";
  } catch (error) {
    console.error("Error de acceso:", error.code);
    mensaje.textContent =
      error.code === "auth/invalid-credential"
        ? "El correo o la contraseña no son correctos."
        : error.code === "auth/too-many-requests"
        ? "Hay demasiados intentos. Espera un poco y vuelve a probar."
        : "No se ha podido iniciar sesión. Comprueba los datos y la conexión.";
  }
});

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    acceso.style.display = "none";
    contenido.style.display = "block";

    if (!document.getElementById("botonCerrarSesion")) {
      const boton = document.createElement("button");
      boton.id = "botonCerrarSesion";
      boton.setAttribute("aria-label", "Cerrar sesión");
      boton.title = "Cerrar sesión";
      boton.innerHTML = '<img src="/assets/iconos-realistas/Power.png" alt="" style="width:21px;height:23px;object-fit:contain;display:block;">';
      boton.style.cssText = "display:flex;align-items:center;justify-content:center;width:30px;height:30px;margin:3px 3px 3px auto;padding:0;border:1px solid rgba(255,255,255,.22);border-radius:50%;background:linear-gradient(145deg,#333,#171717);box-shadow:0 2px 5px rgba(0,0,0,.28);cursor:pointer;";
      boton.addEventListener("click", async () => {
        await signOut(auth);
      });

      contenido.prepend(boton);
    }
  } else if (pruebaRuleta || pruebaPerfiles) {
    acceso.style.display = "none";
    contenido.style.display = "block";
    if (typeof window.mostrarVista === "function") {
      window.mostrarVista(pruebaPerfiles ? "nosotros" : "ruleta");
    }
  } else {
    contenido.style.display = "none";
    acceso.style.display = "block";
    formulario.reset();
  }
});
