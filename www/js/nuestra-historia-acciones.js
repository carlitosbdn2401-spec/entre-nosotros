(() => {
  'use strict';

  const DB = 'entre-nosotros-historia';
  const STORE = 'recuerdos';
  const VERSION = 1;
  const MARCO_V = '/assets/nuestra-historia/Mv1.png';
  const MARCO_H = '/assets/nuestra-historia/Mh1.png';

  const abrirDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  async function obtener(indice) {
    const id = `nh-etapa-${String(indice + 1).padStart(2, '0')}`;
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => {
        const d = req.result || { id, texto: '', fotos: [] };
        d.fotos = Array.isArray(d.fotos) ? d.fotos : [];
        d.memorias = Array.isArray(d.memorias)
          ? d.memorias : (d.texto ? [d.texto] : []);
        resolve(d);
      };
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

  const seccion = () => document.querySelector(
    '.nuestra-historia[data-vista="nuestra-historia"]'
  );

  const contenedor = () => seccion()?.querySelector(
    '.nuestra-historia-container'
  );

  const idTarjeta = i =>
    `nh-etapa-${String(i + 1).padStart(2, '0')}`;

  const estilo = document.createElement('style');
  estilo.id = 'nh-acciones-estilos';
  estilo.textContent = `
    .nh-boton-tarjeta.nh-texto-guardado {
      opacity:1!important;
      z-index:80!important;
      display:block!important;
      padding:5px!important;
      color:#F3E5AB!important;
      -webkit-text-fill-color:#F3E5AB!important;
      font:clamp(11px,2.7vw,17px) 'Great Vibes',cursive!important;
      white-space:normal;
      overflow:hidden;
      border:1.5px solid transparent!important;
      border-radius:7px!important;
      background-image:
        url('/assets/nuestra-historia/Fondo.jpg'),
        linear-gradient(135deg,#B38F27 0%,#F3E5AB 28%,#D4AF37 58%,#9A7B1C 100%)!important;
      background-size:cover,auto!important;
      background-origin:padding-box,border-box!important;
      background-clip:padding-box,border-box!important;
      background-position:center,center!important;
      background-repeat:no-repeat,no-repeat!important;
      box-shadow:inset 0 1px 4px #fff8,
                 inset 0 -3px 5px #5b3b16,
                 0 3px 8px #000b,
                 0 0 10px #d8b875!important;
      text-shadow:0 1px 3px #10090d,0 0 4px #10090d!important;
    }
    .nh-boton-tarjeta.nh-escribiendo {
      opacity:1!important;
      z-index:80!important;
      display:block!important;
      padding:5px!important;
      background-image:url('/assets/nuestra-historia/Fondo.jpg')!important;
      background-size:cover!important;
      background-position:center!important;
      background-repeat:no-repeat!important;
      border:1.5px solid transparent!important;
      border-radius:7px!important;
      background-image:
        url('/assets/nuestra-historia/Fondo.jpg'),
        linear-gradient(135deg,#B38F27 0%,#F3E5AB 28%,#D4AF37 58%,#9A7B1C 100%)!important;
      background-size:cover,auto!important;
      background-origin:padding-box,border-box!important;
      background-clip:padding-box,border-box!important;
      background-position:center,center!important;
      background-repeat:no-repeat,no-repeat!important;
      box-shadow:inset 0 1px 4px #fff8,
                 inset 0 -3px 5px #5b3b16,
                 0 3px 8px #000b,
                 0 0 10px #d8b875!important;
    }
    .nh-boton-tarjeta.nh-escribiendo .nh-escritura-campo::placeholder {
      color:#F3E5AB!important;
      -webkit-text-fill-color:#F3E5AB!important;
      opacity:1!important;
    }
    .nh-boton-tarjeta .nh-escritura-campo {
      display:block;
      width:100%;
      height:100%;
      min-height:0;
      box-sizing:border-box;
      resize:none;
      border:0;
      outline:0;
      background:transparent;
      color:#F3E5AB!important;
      -webkit-text-fill-color:#F3E5AB!important;
      text-shadow:0 1px 3px #10090d,0 0 4px #10090d;
      font:16px 'Great Vibes',cursive;
      padding:5px;
    }
    .nh-zona-editor.nh-texto-guardado {
      opacity:1!important;
      color:#F7D9A5!important;
      font:clamp(11px,2.7vw,17px) 'Great Vibes',cursive!important;
      line-height:1.15!important;
      text-shadow:0 1px 4px #10090d,0 0 5px #10090d!important;
      white-space:normal;
      overflow:hidden;
      padding:3px!important;
    }
    .nh-zona-editor.nh-escribiendo {
      opacity:1!important;
      z-index:8!important;
      display:block!important;
      padding:3px!important;
      background-image:url('/assets/nuestra-historia/Fondo.jpg')!important;
      background-size:cover!important;
      background-position:center!important;
      background-repeat:no-repeat!important;
      border:1px solid #F7D9A5!important;
      box-shadow:0 0 9px #80613f!important;
    }
    .nh-zona-editor .nh-escritura-campo {
      display:block;
      width:100%;
      height:100%;
      min-height:0;
      box-sizing:border-box;
      resize:none;
      padding:5px;
      border:0;
      outline:0;
      border-radius:3px;
      background:transparent;
      color:#F7D9A5;
      font:clamp(11px,2.7vw,17px) 'Great Vibes',cursive;
      line-height:1.15;
      text-align:center;
    }
    .nh-archivo-historia {
      position:relative;
      width:94%;
      max-width:720px;
      margin:20px auto;
      padding:58px 10px 15px;
      box-sizing:border-box;
      color:#f8e9df;
      font-family:'Great Vibes',cursive;
    }
    .nh-archivo-historia[hidden] {display:none!important}
    .nh-archivo-cabecera {
      position:absolute;
      top:-285px;
      left:10px;
      right:10px;
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:10px;
      margin:0;
      width:calc(100% - 20px);
      box-sizing:border-box;
    }
    .nh-archivo-cabecera .nh-archivo-volver {
      margin:0 auto 0 0!important;
      flex:0 0 auto;
    }
    .nh-archivo-cabecera .nh-archivo-eliminar {
      margin:0 0 0 auto!important;
      flex:0 0 auto;
    }

    .nh-archivo-titulo-imagen {
      display:block;
      width:115%;
      max-width:none;
      height:auto;
      box-sizing:border-box;
      object-fit:contain;
      margin:-92px auto 14px;
      position:relative;
      left:50%;
      transform:translateX(-50%);
    }

    .nh-archivo-presentacion{
      width:calc(100% - 20px);
      min-height:0;
      
    }
    .nh-archivo-historia h3 {
      margin:0;
      color:#F7D9A5;
      font:normal 30px 'Great Vibes',cursive;
    }
    .nh-archivo-titulo {
      width:calc(100% - 20px);
      box-sizing:border-box;
      text-align:center;
      margin:8px 10px 14px;
      padding:9px 12px;
      border-radius:12px;
      background:
        url('/assets/nuestra-historia/Fondo.jpg') center/cover no-repeat padding-box,
        linear-gradient(135deg,#fff4d5 0%,#D4AF37 18%,#fff0bd 38%,#9b7027 62%,#F7D9A5 82%,#80613f 100%) border-box;
      border:2px solid transparent;
      box-shadow:
        inset 0 2px 0 rgba(255,250,220,.85),
        inset 0 -3px 6px rgba(0,0,0,.38),
        0 2px 0 #8b6938,
        0 5px 0 #34202a,
        0 9px 18px rgba(0,0,0,.55);
    }
    .nh-archivo-presentacion {
      width:calc(100% - 20px);
      box-sizing:border-box;
      text-align:center;
      margin:8px 10px 18px;
      padding:12px;
      border-radius:12px;
      background:
        url('/assets/nuestra-historia/Fondo.jpg') center/cover no-repeat padding-box,
        linear-gradient(135deg,#fff4d5 0%,#D4AF37 18%,#fff0bd 38%,#9b7027 62%,#F7D9A5 82%,#80613f 100%) border-box;
      border:2px solid transparent;
      box-shadow:
        inset 0 2px 0 rgba(255,250,220,.75),
        inset 0 -3px 6px rgba(0,0,0,.38),
        0 2px 0 #8b6938,
        0 5px 0 #34202a,
        0 9px 18px rgba(0,0,0,.55);
    }
    .nh-archivo-presentacion h3 {
      font-size:clamp(27px,7vw,34px);
      line-height:1.2;
    }
    .nh-archivo-introduccion {
      margin:0;
      color:#F7D9A5;
      text-align:left;
      white-space:pre-line;
      font:clamp(20px,5vw,26px) 'Great Vibes',cursive;
      line-height:1.5;
    }
    .nuestra-historia .nh-archivo-historia .nh-archivo-cabecera button.nh-archivo-volver,
    .nuestra-historia .nh-archivo-historia .nh-archivo-cabecera button.nh-archivo-eliminar {
      padding:9px 15px!important;
      border:1.5px solid transparent!important;
      border-radius:12px!important;
      background:
        url('/assets/nuestra-historia/Fondo.jpg') center/cover no-repeat padding-box,
        linear-gradient(135deg,#fff4d5 0%,#D4AF37 22%,#fff0bd 42%,#9b7027 68%,#F7D9A5 100%) border-box!important;
      color:#D4AF37!important;
      -webkit-text-fill-color:#D4AF37!important;
      text-shadow:0 1px 2px rgba(0,0,0,.85)!important;
      font:28px 'Great Vibes',cursive!important;
      box-shadow:
        inset 0 2px 0 rgba(255,250,220,.9),
        inset 0 -2px 0 rgba(255,235,175,.85),
        inset 0 2px 4px rgba(255,239,207,.25),
        inset 0 -4px 7px rgba(0,0,0,.35),
        0 2px 0 #8b6938,
        0 4px 0 #34202a,
        0 7px 0 #170c13,
        0 11px 20px rgba(0,0,0,.5)!important;
      cursor:pointer;
    }
    .nh-archivo-historia button:disabled {
      opacity:.45;
      cursor:default;
    }


    /* TÍTULO DE LA ETAPA 01 FUERA DEL MARCO */
    .nuestra-historia .nh-archivo-historia .nh-archivo-titulo {
      display:block!important;
      width:100%!important;
      margin:0 0 12px!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      text-align:center!important;
    }

    /* ACABADO DEFINITIVO ARCHIVO HISTORIA */
    .nuestra-historia .nh-archivo-historia .nh-archivo-titulo {
      display:block!important;
      width:calc(100% - 20px)!important;
      box-sizing:border-box!important;
      margin:8px 10px 14px!important;
      padding:10px 12px!important;
      text-align:center!important;
      overflow-wrap:anywhere!important;
      border:2px solid #D4AF37!important;
      border-radius:12px!important;
      background:
        url('/assets/nuestra-historia/Fondo.jpg') center/cover no-repeat padding-box,
        linear-gradient(135deg,#fff4d5 0%,#D4AF37 18%,#fff0bd 38%,#9b7027 62%,#F7D9A5 82%,#80613f 100%) border-box!important;
      box-shadow:inset 0 2px 0 rgba(255,250,220,.9),
        inset 0 -4px 7px rgba(0,0,0,.4),
        0 2px 0 #8b6938,0 5px 0 #34202a,0 9px 18px rgba(0,0,0,.55)!important;
    }
    .nuestra-historia .nh-archivo-historia .nh-archivo-presentacion {
      display:block!important;
      width:calc(100% - 20px)!important;
      box-sizing:border-box!important;
      margin:8px 10px 18px!important;
      padding:12px!important;
      border:2px solid transparent!important;
      border-radius:12px!important;
      background-image:
        url('/assets/nuestra-historia/Fondo.jpg'),
        linear-gradient(135deg,#B38F27 0%,#F3E5AB 28%,#D4AF37 58%,#9A7B1C 100%)!important;
      background-origin:padding-box,border-box!important;
      background-clip:padding-box,border-box!important;
      background-position:center,center!important;
      background-size:cover,auto!important;
      background-repeat:no-repeat,no-repeat!important;
      box-shadow:
        inset 0 2px 3px rgba(255,250,220,.46),
        inset 0 -2px 3px rgba(255,235,175,.24),
        inset 0 -5px 8px rgba(0,0,0,.32),
        inset 0 0 0 2px rgba(212,175,55,.10),
        0 3px 0 #8b6938,
        0 5px 0 #34202a,
        0 9px 0 #170c13,
        0 13px 22px rgba(0,0,0,.48)!important;
    }
    .nuestra-historia .nh-archivo-historia .nh-archivo-introduccion {
      color:#F7D9A5!important;
      font-family:'Great Vibes',cursive!important;
    }
    .nuestra-historia .nh-archivo-historia .nh-archivo-cabecera button.nh-archivo-volver,
    .nuestra-historia .nh-archivo-historia .nh-archivo-cabecera button.nh-archivo-eliminar {
      border:2px solid #D4AF37!important;
      border-radius:12px!important;
      background:
        url('/assets/nuestra-historia/Fondo.jpg') center/cover no-repeat padding-box,
        linear-gradient(135deg,#fff4d5 0%,#D4AF37 22%,#fff0bd 42%,#9b7027 68%,#F7D9A5 100%) border-box!important;
      color:#D4AF37!important;
      -webkit-text-fill-color:#D4AF37!important;
      font:28px 'Great Vibes',cursive!important;
      box-shadow:inset 0 2px 0 rgba(255,250,220,.9),
        inset 0 -4px 7px rgba(0,0,0,.35),
        0 2px 0 #8b6938,0 4px 0 #34202a,
        0 7px 0 #170c13,0 11px 20px rgba(0,0,0,.5)!important;
    }

    .nh-archivo-lista {
      display:grid;
      gap:12px;
    }
    .nh-archivo-memoria {
      padding:12px;
      border:2px solid transparent;
      border-radius:10px;
      background-image:
        url('/assets/nuestra-historia/Fondo.jpg'),
        linear-gradient(135deg,#B38F27 0%,#F3E5AB 28%,#D4AF37 58%,#9A7B1C 100%);
      background-origin:padding-box,border-box;
      background-clip:padding-box,border-box;
      background-position:center,center;
      background-size:cover,auto;
      background-repeat:no-repeat,no-repeat;
      box-shadow:
        inset 0 2px 3px rgba(255,250,220,.46),
        inset 0 -2px 3px rgba(255,235,175,.24),
        inset 0 -5px 8px rgba(0,0,0,.32),
        inset 0 0 0 1px rgba(212,175,55,.10),
        0 3px 0 #8b6938,
        0 5px 0 #34202a,
        0 9px 0 #170c13,
        0 13px 22px rgba(0,0,0,.48);
      color:#F7D9A5;
      font:clamp(21px,5vw,25px) 'Great Vibes',cursive;
      white-space:pre-wrap;
      overflow-wrap:anywhere;
      cursor:pointer;
    }
    .nh-recuerdo-fijo { cursor:default!important; }
    .nh-archivo-foto {
      position:relative;
      padding:5px;
      border:1px solid transparent;
      border-radius:9px;
      background:transparent;
      cursor:pointer;
    }
    .nh-archivo-foto .nh-foto-imagen {
      position:relative;
      width:100%;
      height:clamp(230px,68vw,420px);
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
    }
    .nh-archivo-foto .nh-foto-contenido {
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
    }
    .nh-archivo-foto .nh-foto-ventana {
      position:absolute;
      inset:0;
      overflow:hidden;
    }
    .nh-archivo-foto .nh-foto-contenido img.nh-imagen,
    .nh-archivo-foto .nh-foto-contenido img.nh-marco {
      position:absolute;
      inset:0;
      display:block;
      width:100%;
      height:102%;
      object-fit:cover;
    }
    .nh-archivo-foto .nh-foto-contenido img.nh-marco {
      pointer-events:none;
    }
    .nh-archivo-foto .nh-foto-contenido.vertical img.nh-imagen {
      left:15.96%!important;
      top:10.31%!important;
      width:68.08%!important;
      height:78.19%!important;
      object-fit:cover!important;
      object-position:center center!important;
    }
    .nh-archivo-foto .nh-foto-contenido.horizontal .nh-foto-ventana {
      left:0;
      top:0;
      width:100%;
      height:102%;
    }
    .nh-archivo-foto .nh-foto-contenido.horizontal img.nh-imagen {
      position:absolute!important;
      left:2.86%!important;
      top:5.34%!important;
      right:auto!important;
      bottom:auto!important;
      width:94.06%!important;
      height:86.91%!important;
      object-fit:cover!important;
      object-position:center center!important;
    }
    .nh-archivo-foto .nh-foto-contenido.vertical img.nh-marco {
      width:100%;
      height:102%;
      left:0;
      top:-1%;
    }
    .nh-archivo-foto .nh-foto-contenido.horizontal img.nh-marco {
      width:calc(100% - 70px);
      height:calc(100.81% + 12px);
      left:35px;
      top:calc(-0.405% - 2px);
      object-fit:fill;
    }
    .nh-archivo-seleccionado {
      border:2px solid #F7D9A5!important;
      box-shadow:0 0 12px rgba(247,217,165,.65);
    }
    .nh-archivo-vacio {
      color:#F7D9A5;
      text-align:center;
      font:22px 'Great Vibes',cursive;
      padding:20px 5px;
    }
    .nh-archivo-estado {
      min-height:22px;
      margin-top:10px;
      color:#F7D9A5;
      font:19px 'Great Vibes',cursive;
    }
    .nh-detalle-activo > .nh-historia,
    .nh-detalle-activo > .nh-marco-principal,
    .nh-detalle-activo > .nh-tarjetas-nuevas,
    .nh-detalle-activo > .nh-boton-final,
    .nh-detalle-activo > .nh-frase-final {
      display:none!important;
    }
  `;
  document.head.appendChild(estilo);


  const entradas = new Map();
  const archivos = new Map();

  function obtenerZona(indice, tipo) {
    return seccion()?.querySelector(
      `.nh-boton-tarjeta[data-card="${indice}"][data-tipo="${tipo}"]`
    );
  }

  function mostrarTexto(indice, texto) {
    const zona = obtenerZona(indice, 'escribir');
    if (!zona || zona.classList.contains('nh-escribiendo')) return;
    zona.textContent = texto || '';
    zona.classList.toggle('nh-texto-guardado', !!texto);
  }

  async function abrirEscritura(indice, boton) {
    const zona = boton || obtenerZona(indice, 'escribir');
    if (!zona) return;
    if (zona.classList.contains('nh-escribiendo')) return;

    const datos = await obtener(indice);
    zona.classList.remove('nh-texto-guardado');
    zona.classList.add('nh-escribiendo');
    zona.replaceChildren();

    const campo = document.createElement('textarea');
    campo.className = 'nh-escritura-campo';
    campo.placeholder = 'Escribe aquí tu recuerdo...';
    campo.setAttribute('aria-label', `Escribir recuerdo ${indice + 1}`);
    campo.value = '';
    campo.addEventListener('click', e => e.stopPropagation());
    campo.addEventListener('pointerdown', e => e.stopPropagation());
    zona.appendChild(campo);
    campo.focus();
    campo.setSelectionRange(campo.value.length, campo.value.length);
  }

  async function guardarEscritura(indice) {
    const zona = obtenerZona(indice, 'escribir');
    const campo = zona?.querySelector('.nh-escritura-campo');
    if (!campo) {
      mostrarEstado(indice, 'Abre primero el cuadrado para escribir.');
      return;
    }

    const texto = campo.value.trim();
    if (!texto) {
      mostrarEstado(indice, 'Escribe tu recuerdo antes de guardarlo.');
      campo.focus();
      return;
    }

    try {
      const datos = await obtener(indice);
      if (datos.texto && datos.texto !== texto &&
          !datos.memorias.includes(datos.texto)) {
        datos.memorias.push(datos.texto);
      }
      if (!datos.memorias.includes(texto)) datos.memorias.push(texto);
      datos.texto = texto;
      await guardar(datos);

      zona.classList.remove('nh-escribiendo');
      zona.classList.add('nh-texto-guardado');
      zona.textContent = texto;
      mostrarEstado(indice, 'Recuerdo guardado.');
    } catch (_) {
      mostrarEstado(indice, 'No se pudo guardar el recuerdo.');
    }
  }

  function mostrarEstado(indice, mensaje) {
    const panel = archivos.get(indice);
    const estado = panel?.querySelector('.nh-archivo-estado');
    if (estado) estado.textContent = mensaje;
  }

  async function abrirGaleria(indice) {
    let entrada = entradas.get(indice);
    if (!entrada) {
      entrada = document.createElement('input');
      entrada.type = 'file';
      entrada.accept = 'image/*';
      entrada.multiple = true;
      entrada.hidden = true;
      document.body.appendChild(entrada);
      entradas.set(indice, entrada);

      entrada.addEventListener('change', async () => {
        const archivosSeleccionados = Array.from(entrada.files || [])
          .filter(f => f.type.startsWith('image/'));
        if (!archivosSeleccionados.length) return;

        try {
          const datos = await obtener(indice);
          for (const archivo of archivosSeleccionados) {
            const dimensiones = await new Promise((resolve, reject) => {
              const img = new Image();
              const url = URL.createObjectURL(archivo);
              img.onload = () => {
                resolve({
                  ancho: img.naturalWidth,
                  alto: img.naturalHeight
                });
                URL.revokeObjectURL(url);
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Imagen no válida'));
              };
              img.src = url;
            });
            datos.fotos.push({
              blob: archivo,
              orientacion: dimensiones.alto >= dimensiones.ancho
                ? 'vertical' : 'horizontal'
            });
          }
          await guardar(datos);
          mostrarEstado(indice, 'Fotografías guardadas.');
        } catch (_) {
          mostrarEstado(indice, 'No se pudieron guardar las fotografías.');
        } finally {
          entrada.value = '';
        }
      });
    }
    entrada.click();
  }

  function crearArchivo(indice) {
    let panel = archivos.get(indice);
    if (panel) return panel;

    panel = document.createElement('section');
    panel.className = 'nh-archivo-historia';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="nh-archivo-cabecera">
        <button type="button" class="nh-archivo-volver"
          aria-label="Volver atrás"
          style="display:block!important;visibility:visible!important;width:74px!important;height:56px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;flex:0 0 74px!important;transform:translate(-20px,50px)!important;">
          <img src="/assets/nuestra-historia/V.png" alt="Volver atrás"
               style="display:block;width:100%;height:100%;object-fit:contain;">
        </button>
        <button type="button" class="nh-archivo-eliminar" disabled
          aria-label="Eliminar"
          style="display:block!important;visibility:visible!important;width:74px!important;height:56px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;flex:0 0 74px!important;transform:translate(20px,50px)!important;">
          <img src="/assets/nuestra-historia/E.png" alt="Eliminar"
               style="display:block;width:100%;height:100%;object-fit:contain;">
        </button>
      </div>
      ${indice === 0 ? `
      <img class="nh-archivo-titulo-imagen"
           src="/assets/nuestra-historia/Cu.png"
           alt="Cuando nos conocimos">
      <div class="nh-archivo-presentacion">
        <p class="nh-archivo-introduccion">Todo comenzó el 15 de septiembre de 2024, cuando sus caminos se cruzaron a través de la aplicación +40.

Ella tenía una foto de perfil en la que solo destacaban sus ojos. Una mirada capaz de llamar la atención sin necesidad de mostrar nada más. Él, por su parte, aparecía junto a una fuente, con una postura un tanto chulilla que seguramente decía mucho de su personalidad. Dos fotografías muy diferentes, dos personas que todavía no imaginaban lo que estaba a punto de comenzar.

En aquel momento, los dos tenían pareja y ninguno buscaba enamorarse. Su intención era simplemente divertirse, desconectar un poco de la rutina y disfrutar de algo diferente, sin compromisos ni expectativas. Lo último que podían imaginar era que aquel encuentro acabaría cambiando sus vidas.

Desde aquel 15 de septiembre hasta el 4 de octubre no llegaron a verse en persona. Durante esos días, WhatsApp y Telegram se convirtieron en su punto de encuentro. Entre mensajes, conversaciones y ganas de seguir descubriéndose, fueron creando una conexión que iba creciendo poco a poco. Sin darse cuenta, cada conversación hacía que aquel primer encuentro estuviera un poquito más cerca.

Hasta que llegó el día de encontrarse cara a cara. El 4 de octubre de 2024, a las 14:30, se vieron por primera vez en la estación de Sants. Había nervios, emoción y muchísimas ganas de abrazarse, besarse y hablar sin pantallas de por medio. Y aquel primer encuentro llegó acompañado de ese primer beso que convirtió la ilusión en algo real.

Después compartieron una comida en un Burger King, continuaron la tarde entre cervezas, conversaciones y risas, descubriendo lo bien que podían sentirse estando juntos. La complicidad fue creciendo y también llegó su primer encuentro íntimo, otro momento de aquella jornada que ya estaba convirtiéndose en inolvidable.

Lo que había comenzado como una búsqueda de diversión, sin intención de ir más allá, empezó a transformarse en algo que ninguno había previsto. Los encuentros dejaron de ser simplemente una aventura, las conversaciones se hicieron cada vez más importantes y los sentimientos fueron ocupando un lugar que al principio ninguno esperaba.

Y así, lo que empezó con dos fotografías, una mirada de ojos que cautivaba y una pose algo chulilla junto a una fuente, terminó convirtiéndose en una historia de amor.

Porque ninguno de los dos salió a buscar el amor aquel 15 de septiembre, pero la vida tenía otros planes. Y lo que comenzó como diversión acabó siendo el principio de una historia que todavía siguen escribiendo juntos.</p>
      </div>` : ''}
      <div class="nh-archivo-lista"></div>
      <div class="nh-archivo-estado" role="status"></div>
    `;
    contenedor().appendChild(panel);
    archivos.set(indice, panel);

    panel.querySelector('.nh-archivo-volver').addEventListener('click', () => {
      panel.hidden = true;
      contenedor().classList.remove('nh-detalle-activo');
    });

    panel.querySelector('.nh-archivo-eliminar').addEventListener('click', async () => {
      const seleccion = panel._seleccion;
      if (!seleccion) return;
      try {
        const datos = await obtener(indice);
        if (seleccion.tipo === 'foto') {
          datos.fotos.splice(seleccion.indice, 1);
        } else {
          datos.memorias.splice(seleccion.indice, 1);
          if (datos.texto === seleccion.texto) {
            datos.texto = datos.memorias.length
              ? datos.memorias[datos.memorias.length - 1] : '';
          }
        }
        await guardar(datos);
        panel._seleccion = null;
        panel.querySelector('.nh-archivo-eliminar').disabled = true;
        mostrarEstado(indice, 'Elemento eliminado.');
        await pintarArchivo(indice);
        mostrarTexto(indice, (await obtener(indice)).texto);
      } catch (_) {
        mostrarEstado(indice, 'No se pudo eliminar el elemento.');
      }
    });

    return panel;
  }

  async function pintarArchivo(indice) {
    const panel = crearArchivo(indice);
    const lista = panel.querySelector('.nh-archivo-lista');
    const datos = await obtener(indice);
    lista.replaceChildren();

    panel._seleccion = null;
    panel.querySelector('.nh-archivo-eliminar').disabled = true;

    const memorias = datos.memorias.slice();
    if (datos.texto && !memorias.includes(datos.texto)) {
      memorias.push(datos.texto);
    }

    if (!memorias.length && !datos.fotos.length) {
      const vacio = document.createElement('div');
      vacio.className = 'nh-archivo-vacio';
      vacio.textContent = 'Todavía no hay recuerdos guardados.';
      lista.appendChild(vacio);
    }

    memorias.forEach((texto, posicion) => {
      const elemento = document.createElement('div');
      elemento.className = 'nh-archivo-memoria';
      elemento.textContent = texto;
      elemento.addEventListener('click', () => seleccionar(
        panel, elemento, { tipo: 'memoria', indice: posicion, texto }
      ));
      lista.appendChild(elemento);
    });

    datos.fotos.forEach((foto, posicion) => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'nh-archivo-foto';
      const zonaImagen = document.createElement('div');
      zonaImagen.className = 'nh-foto-imagen';
      const vertical = foto.orientacion === 'vertical';
      const contenido = document.createElement('div');
      contenido.className = 'nh-foto-contenido ' +
        (vertical ? 'vertical' : 'horizontal');
      const ventana = document.createElement('div');
      ventana.className = 'nh-foto-ventana';
      const imagen = document.createElement('img');
      imagen.className = 'nh-imagen';
      imagen.alt = 'Fotografía del recuerdo';
      const url = URL.createObjectURL(foto.blob);
      tarjeta._url = url;
      imagen.src = url;
      const marco = document.createElement('img');
      marco.className = 'nh-marco';
      marco.src = vertical ? MARCO_V : MARCO_H;
      marco.alt = '';
      marco.setAttribute('aria-hidden', 'true');
      ventana.appendChild(imagen);
      contenido.append(ventana, marco);
      zonaImagen.appendChild(contenido);
      tarjeta.appendChild(zonaImagen);

      const ajustar = () => {
        const anchoDisponible = zonaImagen.clientWidth;
        const altoDisponible = zonaImagen.clientHeight;
        if (!anchoDisponible || !altoDisponible) return;
        const proporcion = vertical ? 896 / 1174 : 1716 / 917;
        let ancho = anchoDisponible;
        let alto = ancho / proporcion;
        if (alto > altoDisponible) {
          alto = altoDisponible;
          ancho = alto * proporcion;
        }
        contenido.style.width = ancho + 'px';
        contenido.style.height = alto + 'px';
      };
      marco.addEventListener('load', ajustar);
      imagen.addEventListener('load', ajustar);
      requestAnimationFrame(ajustar);

      tarjeta.addEventListener('click', () => seleccionar(
        panel, tarjeta, { tipo: 'foto', indice: posicion }
      ));
      lista.appendChild(tarjeta);
    });

    lista.querySelectorAll('.nh-archivo-foto').forEach(t => {
      t.addEventListener('DOMNodeRemoved', () => {
        if (t._url) URL.revokeObjectURL(t._url);
      });
    });
  }

  function seleccionar(panel, elemento, seleccion) {
    panel.querySelectorAll('.nh-archivo-seleccionado')
      .forEach(e => e.classList.remove('nh-archivo-seleccionado'));
    elemento.classList.add('nh-archivo-seleccionado');
    panel._seleccion = seleccion;
    panel.querySelector('.nh-archivo-eliminar').disabled = false;
  }

  async function abrirArchivo(indice) {
    try {
      const panel = crearArchivo(indice);
      await pintarArchivo(indice);
      contenedor().classList.add('nh-detalle-activo');
      panel.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (_) {
      const panel = crearArchivo(indice);
      panel.hidden = false;
      panel.querySelector('.nh-archivo-estado').textContent =
        'No se pudo abrir el archivo local.';
    }
  }

  window.addEventListener('nh:tarjeta-accion', async evento => {
    const { card, type } = evento.detail || {};
    if (!Number.isInteger(card) || card < 0 || card > 4) return;

    try {
      if (type === 'escribir') {
        await abrirEscritura(card, evento.detail.button);
      } else if (type === 'guardar') {
        await guardarEscritura(card);
      } else if (type === 'fotos') {
        await abrirGaleria(card);
      } else if (type === 'entrar') {
        await abrirArchivo(card);
      }
    } catch (error) {
      console.error('Nuestra Historia:', error);
    }
  });

  async function iniciar() {
    for (let i = 0; i < 5; i++) {
      try {
        let datos = await obtener(i);
        if (i === 0) {
          const iniciales = [
            'Nuestro primer encuentro virtual\n15 de septiembre de 2024\nNos conocimos a través de la aplicación +40.',
            'Nuestro primer encuentro en persona\n4 de octubre de 2024 · 14:30\nEstación de Sants\nMuchos nervios y emoción, ganas de besarla, abrazarla y hablar mucho con ella.'
          ];
          let actualizado = false;
          for (const recuerdo of iniciales) {
            if (!datos.memorias.includes(recuerdo)) {
              datos.memorias.push(recuerdo);
              actualizado = true;
            }
          }
          if (actualizado) await guardar(datos);
        }
        mostrarTexto(i, datos.texto);
      } catch (error) {
        console.error('No se pudo cargar el recuerdo', i + 1, error);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();
