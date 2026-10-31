import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase.js';

(function () {
  let mapa = null;
  let marcadorUbicacion = null;
  let cancelarEscucha = null;
  let lugares = [];
  let marcadores = [];
  let categoriaActiva = '';
  let puntoElegido = null;
  let elegirPunto = false;

  const rutaLugares = () =>
    collection(db, 'parejas', 'nuestro-espacio', 'lugaresEspeciales');

  const elemento = id => document.getElementById(id);

  function estado(texto) {
    const campo = elemento('estado-ubicacion');
    if (campo) campo.textContent = texto;
  }

  function iniciarMapa() {
    const contenedor = elemento('mapa-lugares');
    if (!contenedor || !window.L) return;

    if (!mapa) {
      mapa = L.map(contenedor).setView([40.2, -3.7], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapa);

      mapa.on('click', evento => {
        if (!elegirPunto) return;
        puntoElegido = {
          lat: evento.latlng.lat,
          lng: evento.latlng.lng
        };

        if (marcadorUbicacion) {
          marcadorUbicacion.setLatLng([puntoElegido.lat, puntoElegido.lng]);
        } else {
          marcadorUbicacion = L.marker([puntoElegido.lat, puntoElegido.lng])
            .addTo(mapa);
        }

        marcadorUbicacion
          .bindPopup('📍 Lugar seleccionado')
          .openPopup();

        elegirPunto = false;
        actualizarPuntoElegido();
        estado('Punto seleccionado. Ya puedes guardar el lugar.');
      });
    }

    setTimeout(() => mapa.invalidateSize(), 200);
  }

  function actualizarPuntoElegido() {
    const texto = elemento('lugar-coordenadas');
    if (texto) {
      texto.textContent = puntoElegido
        ? `Ubicación seleccionada: ${puntoElegido.lat.toFixed(5)}, ${puntoElegido.lng.toFixed(5)}`
        : 'Selecciona una ubicación en el mapa o usa tu ubicación.';
    }
  }

  async function obtenerUbicacion() {
    if (Capacitor.isNativePlatform()) {
      let permisos = await Geolocation.checkPermissions();
      if (permisos.location !== 'granted') {
        permisos = await Geolocation.requestPermissions();
      }
      if (permisos.location !== 'granted') {
        throw new Error('No se concedió el permiso de ubicación.');
      }
    }

    const posicion = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    });

    return {
      lat: posicion.coords.latitude,
      lng: posicion.coords.longitude
    };
  }

  async function mostrarUbicacion() {
    const boton = elemento('boton-mi-ubicacion');
    if (boton) boton.disabled = true;
    estado('Solicitando ubicación…');

    try {
      puntoElegido = await obtenerUbicacion();
      iniciarMapa();
      if (!mapa) throw new Error('No se pudo iniciar el mapa.');

      mapa.setView([puntoElegido.lat, puntoElegido.lng], 16);

      if (marcadorUbicacion) {
        marcadorUbicacion.setLatLng([puntoElegido.lat, puntoElegido.lng]);
      } else {
        marcadorUbicacion = L.marker([puntoElegido.lat, puntoElegido.lng])
          .addTo(mapa);
      }
      marcadorUbicacion.bindPopup('Tu ubicación').openPopup();
      actualizarPuntoElegido();
      estado('Ubicación encontrada.');
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      estado(error.message || 'No se pudo obtener la ubicación. Comprueba los permisos y el GPS.');
    } finally {
      if (boton) boton.disabled = false;
    }
  }

  function lugaresVisibles() {
    return categoriaActiva === 'Favoritos'
      ? lugares.filter(lugar => lugar.favorito)
      : categoriaActiva
        ? lugares.filter(lugar => lugar.categoria === categoriaActiva)
        : lugares;
  }

  function dibujarLugares() {
    if (!mapa) return;

    marcadores.forEach(marcador => mapa.removeLayer(marcador));
    marcadores = [];

    const visibles = lugaresVisibles();

    visibles.forEach(lugar => {
      if (!Number.isFinite(lugar.lat) || !Number.isFinite(lugar.lng)) return;

      const marcador = L.marker([lugar.lat, lugar.lng]).addTo(mapa);
      const favorito = lugar.favorito ? ' ★' : '';
      const popup = document.createElement('div');
      const titulo = document.createElement('strong');
      titulo.textContent = (lugar.nombre || 'Lugar especial') + favorito;
      const categoria = document.createElement('p');
      categoria.textContent = lugar.categoria || '';
      popup.append(titulo, categoria);
      marcador.bindPopup(popup);
      marcadores.push(marcador);
    });

    dibujarLista(visibles);
  }

  function dibujarLista(visibles) {
    const lista = elemento('lista-lugares');
    if (!lista) return;
    lista.replaceChildren();

    if (!visibles.length) {
      const aviso = document.createElement('p');
      aviso.textContent = 'Todavía no hay lugares guardados en esta categoría.';
      lista.appendChild(aviso);
      return;
    }

    visibles.forEach(lugar => {
      const tarjeta = document.createElement('button');
      tarjeta.type = 'button';
      tarjeta.className = 'lugar-tarjeta';
      tarjeta.textContent =
        `${lugar.favorito ? '★ ' : ''}${lugar.nombre || 'Lugar especial'} — ${lugar.categoria || 'Sin categoría'}`;

      tarjeta.addEventListener('click', () => {
        if (!mapa || !Number.isFinite(lugar.lat) || !Number.isFinite(lugar.lng)) return;
        mapa.setView([lugar.lat, lugar.lng], 16);
        const marcador = marcadores.find(m =>
          m.getLatLng().lat === lugar.lat && m.getLatLng().lng === lugar.lng
        );
        if (marcador) marcador.openPopup();
      });
      lista.appendChild(tarjeta);
    });
  }

  function escucharLugares() {
    if (cancelarEscucha) cancelarEscucha();
    cancelarEscucha = null;

    if (!auth.currentUser) {
      estado('Inicia sesión para consultar los lugares compartidos.');
      return;
    }

    estado('Cargando lugares compartidos…');
    cancelarEscucha = onSnapshot(
      rutaLugares(),
      snapshot => {
        lugares = snapshot.docs.map(documento => ({
          id: documento.id,
          ...documento.data()
        }));
        dibujarLugares();
        estado(`Lugares sincronizados: ${lugares.length}.`);
      },
      error => {
        console.error('Error leyendo lugares:', error);
        estado(error.code === 'permission-denied'
          ? 'Firebase no permite consultar los lugares. Hay que revisar sus reglas.'
          : 'No se pudieron cargar los lugares. Comprueba la conexión.');
      }
    );
  }

  async function guardarLugar() {
    const nombre = elemento('lugar-nombre').value.trim();
    if (!nombre) {
      estado('Escribe el nombre del lugar.');
      elemento('lugar-nombre').focus();
      return;
    }
    if (!puntoElegido) {
      estado('Primero elige un punto en el mapa o usa tu ubicación.');
      return;
    }
    if (!auth.currentUser) {
      estado('Necesitas iniciar sesión para guardar lugares compartidos.');
      return;
    }

    const boton = elemento('lugar-guardar');
    boton.disabled = true;

    try {
      await addDoc(rutaLugares(), {
        nombre,
        categoria: elemento('lugar-categoria').value,
        favorito: elemento('lugar-favorito').checked,
        lat: puntoElegido.lat,
        lng: puntoElegido.lng,
        creadoPor: auth.currentUser.uid,
        creado: serverTimestamp()
      });

      elemento('lugar-nombre').value = '';
      elemento('lugar-favorito').checked = false;
      elemento('formulario-lugar').hidden = true;
      puntoElegido = null;
      actualizarPuntoElegido();
      estado('Lugar guardado y enviado a sincronización.');
    } catch (error) {
      console.error('Error guardando lugar:', error);
      estado(error.code === 'permission-denied'
        ? 'Firebase ha rechazado el guardado. Hay que revisar sus reglas.'
        : 'No se pudo guardar el lugar. Comprueba la conexión.');
    } finally {
      boton.disabled = false;
    }
  }

  elemento('lugares-abrir-formulario')?.addEventListener('click', () => {
    elemento('formulario-lugar').hidden = false;
    elemento('lugar-nombre').focus();
  });

  elemento('lugar-cancelar')?.addEventListener('click', () => {
    elemento('formulario-lugar').hidden = true;
    elegirPunto = false;
    puntoElegido = null;
    actualizarPuntoElegido();
  });

  elemento('lugar-elegir-mapa')?.addEventListener('click', () => {
    iniciarMapa();
    elegirPunto = true;
    estado('Toca en el mapa el punto donde está el lugar.');
  });

  elemento('lugar-usar-ubicacion')?.addEventListener('click', async () => {
    const boton = elemento('lugar-usar-ubicacion');
    boton.disabled = true;
    try {
      puntoElegido = await obtenerUbicacion();
      iniciarMapa();
      mapa.setView([puntoElegido.lat, puntoElegido.lng], 16);
      actualizarPuntoElegido();
      estado('Tu ubicación se usará para este lugar.');
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      estado(error.message || 'No se pudo obtener la ubicación.');
    } finally {
      boton.disabled = false;
    }
  });

  elemento('lugar-guardar')?.addEventListener('click', guardarLugar);

  elemento('lugares-ver-todos')?.addEventListener('click', () => {
    categoriaActiva = '';
    dibujarLugares();
    const puntos = lugaresVisibles()
      .filter(l => Number.isFinite(l.lat) && Number.isFinite(l.lng))
      .map(l => [l.lat, l.lng]);

    if (mapa && puntos.length) {
      mapa.fitBounds(puntos, { padding: [30, 30], maxZoom: 15 });
    }
    estado(`Mostrando todos los lugares: ${puntos.length}.`);
  });

  elemento('lugares-mostrar-lista')?.addEventListener('click', () => {
    const lista = elemento('lista-lugares');
    lista.hidden = !lista.hidden;
    if (!lista.hidden) dibujarLista(lugaresVisibles());
  });

  document.querySelectorAll('.lugares-categorias button[data-categoria]')
    .forEach(boton => {
      boton.addEventListener('click', () => {
        categoriaActiva = boton.dataset.categoria;
        dibujarLugares();
        estado(`Filtro: ${categoriaActiva}.`);
      });
    });

  elemento('boton-mi-ubicacion')?.addEventListener('click', mostrarUbicacion);

  onAuthStateChanged(auth, usuario => {
    if (cancelarEscucha) {
      cancelarEscucha();
      cancelarEscucha = null;
    }
    if (usuario) escucharLugares();
    else {
      lugares = [];
      dibujarLugares();
      estado('Inicia sesión para consultar los lugares compartidos.');
    }
  });

  document.addEventListener('vista-cambiada', evento => {
    if (evento.detail?.nombre === 'lugares-especiales') {
      iniciarMapa();
      dibujarLugares();
    }
  });
})();
