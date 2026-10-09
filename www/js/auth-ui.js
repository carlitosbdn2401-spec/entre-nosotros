import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

const formulario = document.getElementById("formularioAcceso");
const acceso = document.getElementById("accesoFirebase");
const contenido = document.getElementById("contenidoApp");
const mensaje = document.getElementById("mensajeAcceso");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const correo = document.getElementById("correoAcceso").value.trim();
  const clave = document.getElementById("claveAcceso").value;

  mensaje.textContent = "Comprobando tu cuenta…";

  try {
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
      boton.textContent = "Cerrar sesión";
      boton.style.cssText =
        "display:block;margin:12px auto;padding:10px 16px;border-radius:10px;";
      boton.addEventListener("click", async () => {
        await signOut(auth);
      });

      contenido.prepend(boton);
    }
  } else {
    contenido.style.display = "none";
    acceso.style.display = "block";
    formulario.reset();
  }
});
