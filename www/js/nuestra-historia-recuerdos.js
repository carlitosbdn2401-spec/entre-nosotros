(function () {
  'use strict';

  const DB_NAME = 'entre-nosotros-historia';
  const STORE = 'recuerdos';
  const DB_VERSION = 1;
  const MARCO_V = '/assets/nuestra-historia/Marcov1.png';
  const MARCO_H = '/assets/nuestra-historia/Marcoh1.png';

  const estilos = `
    .nh-recuerdos {
      margin-top: 18px;
      padding: 15px;
      border: 1px solid #80613f;
      border-radius: 14px;
      background: #180b12;
      color: #f8e9df;
    }
    .nh-recuerdos h4 {
      margin: 0 0 12px;
      color: #F7D9A5;
      font-size: 29px;
      font-weight: normal;
    }
    .nh-recuerdos textarea {
      display: block;
      width: 100%;
      min-height: 110px;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid #80613f;
      border-radius: 10px;
      background: #10090d;
      color: #f8e9df;
      font: inherit;
      font-size: 23px;
      resize: vertical;
    }
    .nh-recuerdos button,
    .nh-recuerdos .nh-subir {
      display: inline-block;
      margin: 10px 5px 5px 0;
      padding: 9px 15px;
      border: 1px solid #F7D9A5;
      border-radius: 9px;
      background: #681b32;
      color: #fff0df;
      font: inherit;
      font-size: 22px;
      cursor: pointer;
    }
    .nh-recuerdos .nh-estado {
      min-height: 22px;
      margin-top: 7px;
      color: #F7D9A5;
      font-size: 19px;
    }
    .nh-galeria {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
      gap: 12px;
      margin-top: 15px;
    }
    .nh-foto {
      position: relative;
      min-width: 0;
      padding-bottom: 34px;
      box-sizing: border-box;
      overflow: hidden;
      border-radius: 8px;
      background: transparent;
    }
    .nh-foto-imagen {
      padding: 0;
      position: relative;
      width: 100%;
      height: 190px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .nh-foto-contenido {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nh-foto-contenido img.nh-imagen,
    .nh-foto-contenido img.nh-marco {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .nh-foto-contenido img.nh-marco {
      pointer-events: none;
      right: auto;
      bottom: auto;
    }
    .nh-foto-contenido img.nh-imagen {
      object-fit: cover;
      right: auto;
      bottom: auto;
    }

.nh-foto-contenido.vertical img.nh-imagen {
  left: 0.52% !important;
  top: 0.6% !important;
  width: 99.21% !important;
  height: 98.99% !important;
  object-fit: cover !important; object-position: center !important;
}
.nh-foto-contenido.horizontal .nh-foto-ventana {
  position: absolute;
  overflow: hidden;
  left: 0.26%;
  top: 0.5%;
  width: 98.87%;
  height: 98.66%;
}
.nh-foto-contenido.horizontal .nh-foto-ventana img.nh-imagen {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  right: auto !important;
  bottom: auto !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important; object-position: center !important;
}



    .nh-foto-contenido.vertical img.nh-marco {
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
    }
    .nh-foto-contenido.horizontal img.nh-marco {
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      object-fit: fill;
    }
    .nh-foto button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      position: absolute;
      right: 6px;
      bottom: 6px;
      z-index: 2;
      margin: 0;
      padding: 0;
      border: 1px solid #10090d;
      border-radius: 50%;
      background: #c52c4b;
      color: #10090d;
      font-size: 21px;
      line-height: 1;
    }
    .nh-subir input {
      display: none;
    }
    .nh-recuerdos button:disabled {
      opacity: .5;
      cursor: wait;
    }
  `;

  function abrirDB() {
    return new Promise((resolve, reject) => {
      const solicitud = indexedDB.open(DB_NAME, DB_VERSION);
      solicitud.onupgradeneeded = () => {
        const db = solicitud.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      solicitud.onsuccess = () => resolve(solicitud.result);
      solicitud.onerror = () => reject(solicitud.error);
    });
  }

  async function obtener(id) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || {
        id, texto: '', fotos: []
      });
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function guardar(datos) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(datos);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function crearInterfaz(evento, indice) {
    if (evento.querySelector('.nh-recuerdos')) return;

    const titulo = evento.querySelector('h3')?.textContent.trim()
      || 'Recuerdo ' + (indice + 1);
    const id = 'recuerdo-' + indice + '-' +
      titulo.toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const panel = document.createElement('div');
    panel.className = 'nh-recuerdos';
    panel.innerHTML = `
      <h4>Mi experiencia</h4>
      <textarea aria-label="Mi experiencia en este recuerdo"
        placeholder="Escribe cómo viviste este momento..."></textarea>
      <button type="button" class="nh-guardar">Guardar mi recuerdo</button>
      <label class="nh-subir">
        Añadir fotografías
        <input type="file" accept="image/*" multiple>
      </label>
      <div class="nh-estado" role="status" aria-live="polite"></div>
      <div class="nh-galeria"></div>
    `;
    evento.appendChild(panel);

    const textarea = panel.querySelector('textarea');
    const botonGuardar = panel.querySelector('.nh-guardar');
    const entrada = panel.querySelector('input[type="file"]');
    const estado = panel.querySelector('.nh-estado');
    const galeria = panel.querySelector('.nh-galeria');

    let datos = { id, texto: '', fotos: [] };

    function mostrarEstado(mensaje) {
      estado.textContent = mensaje;
    }

    function pintarFotos() {
      galeria.replaceChildren();

      datos.fotos.forEach((foto, posicion) => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'nh-foto';

        const imagen = document.createElement('img');
        imagen.className = 'nh-imagen';
        const url = URL.createObjectURL(foto.blob);
        imagen.src = url;
        imagen.alt = 'Fotografía del recuerdo';

        const marco = document.createElement('img');
        marco.className = 'nh-marco';
        marco.src = foto.orientacion === 'vertical' ? MARCO_V : MARCO_H;
        marco.alt = '';
        marco.setAttribute('aria-hidden', 'true');

        const eliminar = document.createElement('button');
        eliminar.type = 'button';
        eliminar.textContent = '×';
        eliminar.setAttribute('aria-label', 'Eliminar foto');
        eliminar.title = 'Eliminar foto';
        eliminar.addEventListener('click', async () => {
          datos.fotos.splice(posicion, 1);
          await guardar(datos);
          pintarFotos();
          mostrarEstado('Fotografía eliminada.');
        });

        const zonaImagen = document.createElement('div');
        zonaImagen.className = 'nh-foto-imagen';

        const contenido = document.createElement('div');
        contenido.className = 'nh-foto-contenido ' + (foto.orientacion === 'vertical' ? 'vertical' : 'horizontal');

        const ventana = document.createElement('div');
        ventana.className = 'nh-foto-ventana';
        ventana.appendChild(imagen);
        contenido.append(ventana, marco);


        zonaImagen.appendChild(contenido);

        tarjeta.append(zonaImagen, eliminar);
        galeria.appendChild(tarjeta);

        const ajustarContenido = () => {
          const anchoDisponible = zonaImagen.clientWidth;
          const altoDisponible = zonaImagen.clientHeight;
          const proporcion = foto.orientacion === 'vertical' ? 0.77 : 1.925;

          let ancho = anchoDisponible;
          let alto = ancho / proporcion;

          if (alto > altoDisponible) {
            alto = altoDisponible;
            ancho = alto * proporcion;
          }

          contenido.style.width = `${ancho}px`;
          contenido.style.height = `${alto}px`;

        };

        marco.addEventListener('load', ajustarContenido);
        if (marco.complete) ajustarContenido();

        window.addEventListener('resize', ajustarContenido);
        imagen.addEventListener('error', () => {
          URL.revokeObjectURL(url);
          mostrarEstado('No se pudo mostrar una fotografía.');
        }, { once: true });
      });
    }

    botonGuardar.addEventListener('click', async () => {
      botonGuardar.disabled = true;
      try {
        datos.texto = textarea.value;
        await guardar(datos);
        mostrarEstado('Recuerdo guardado en este móvil.');
      } catch (error) {
        mostrarEstado('No se pudo guardar el recuerdo.');
      } finally {
        botonGuardar.disabled = false;
      }
    });

    entrada.addEventListener('change', async () => {
      const archivos = Array.from(entrada.files || [])
        .filter(archivo => archivo.type.startsWith('image/'));

      if (!archivos.length) return;

      entrada.disabled = true;
      mostrarEstado('Preparando fotografías...');

      try {
        for (const archivo of archivos) {
          const dimensiones = await new Promise((resolve, reject) => {
            const imagen = new Image();
            const url = URL.createObjectURL(archivo);
            imagen.onload = () => {
              const resultado = {
                ancho: imagen.naturalWidth,
                alto: imagen.naturalHeight
              };
              URL.revokeObjectURL(url);
              resolve(resultado);
            };
            imagen.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error('Imagen no válida'));
            };
            imagen.src = url;
          });

          datos.fotos.push({
            blob: archivo,
            orientacion: dimensiones.alto >= dimensiones.ancho
              ? 'vertical' : 'horizontal'
          });
        }

        await guardar(datos);
        pintarFotos();
        mostrarEstado('Fotografías guardadas con sus marcos.');
      } catch (error) {
        mostrarEstado('No se pudieron añadir todas las fotografías.');
      } finally {
        entrada.disabled = false;
        entrada.value = '';
      }
    });

    obtener(id).then(resultado => {
      datos = resultado;
      textarea.value = datos.texto || '';
      pintarFotos();
    }).catch(() => {
      mostrarEstado('No se pudo abrir el almacenamiento local.');
    });
  }

  function iniciar() {
    const seccion = document.querySelector(
      '.nuestra-historia[data-vista="nuestra-historia"]'
    );
    if (!seccion || !window.indexedDB) return;

    if (!document.getElementById('nh-estilos-recuerdos')) {
      const estilo = document.createElement('style');
      estilo.id = 'nh-estilos-recuerdos';
      estilo.textContent = estilos;
      document.head.appendChild(estilo);
    }

    seccion.querySelectorAll('.evento').forEach(crearInterfaz);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();
