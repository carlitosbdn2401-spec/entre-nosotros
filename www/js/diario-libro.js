const DIARIO_DB = 'entre-nosotros-diario';
let diarioTipo = 'recuerdo';
let diarioFoto = null;
let diarioTimer = null;

function abrirBaseDiario() {
  return new Promise((ok, error) => {
    const r = indexedDB.open(DIARIO_DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('entradas', {
      keyPath: 'id', autoIncrement: true
    });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => error(r.error);
  });
}

window.diario = function() {
  const caja = document.getElementById('diario');
  const abrir = caja.style.display !== 'block';
  caja.style.display = abrir ? 'block' : 'none';
  if (!abrir) return;

  const animacion = document.getElementById('diario-animacion');
  const contenido = document.getElementById('diario-libro-contenido');
  contenido.hidden = true;
  animacion.hidden = false;
  animacion.querySelector('img').src =
    '/assets/gifapp.gif?v=' + Date.now();

  clearTimeout(diarioTimer);
  diarioTimer = setTimeout(() => {
    animacion.hidden = true;
    contenido.hidden = false;
    mostrarEntradasDiario();
  }, 4240);
};

async function mostrarEntradasDiario() {
  const db = await abrirBaseDiario();
  const tx = db.transaction('entradas', 'readonly');
  const req = tx.objectStore('entradas').getAll();

  req.onsuccess = () => {
    const caja = document.getElementById('recuerdos');
    caja.replaceChildren();
    req.result.reverse().forEach(e => {
      const item = document.createElement('article');
      item.className = 'diario-entrada';
      const titulo = document.createElement('h4');
      titulo.textContent = e.tipo;
      const fecha = document.createElement('small');
      fecha.textContent = e.fecha;
      item.append(titulo, fecha);
      if (e.texto) {
        const texto = document.createElement('p');
        texto.textContent = e.texto;
        item.append(texto);
      }
      if (e.foto) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(e.foto);
        item.append(img);
      }
      caja.append(item);
    });
    db.close();
  };
};

window.seleccionarTipoDiario = function(tipo) {
  diarioTipo = tipo;
  diarioFoto = null;
  const nombres = {
    recuerdo: 'Nuestro recuerdo',
    foto: 'Una foto especial',
    mensaje: 'Un mensaje para ti',
    dedicatoria: 'Una dedicatoria'
  };
  document.getElementById('diario-editor-titulo').textContent =
    nombres[tipo] || nombres.recuerdo;
  document.getElementById('diario-texto').value = '';
  document.getElementById('diario-foto').value = '';
  document.getElementById('diario-foto-nombre').textContent = '';
  document.getElementById('diario-editor').hidden = false;
};

window.elegirFotoDiario = function() {
  document.getElementById('diario-foto').click();
};

document.addEventListener('DOMContentLoaded', () => {
  const campo = document.getElementById('diario-foto');
  if (!campo) return;
  campo.addEventListener('change', () => {
    diarioFoto = campo.files[0] || null;
    document.getElementById('diario-foto-nombre').textContent =
      diarioFoto ? diarioFoto.name : '';
    if (diarioFoto) diarioTipo = 'foto';
  });
});

window.cancelarEntradaDiario = function() {
  document.getElementById('diario-editor').hidden = true;
};

window.guardarEntradaDiario = async function() {
  const texto = document.getElementById('diario-texto').value.trim();
  if (!texto && !diarioFoto) {
    alert('Escribe algo o elige una foto ❤️');
    return;
  }
  try {
    const db = await abrirBaseDiario();
    const tx = db.transaction('entradas', 'readwrite');
    tx.objectStore('entradas').add({
      tipo: diarioTipo,
      texto,
      foto: diarioFoto,
      fecha: new Date().toLocaleDateString('es-ES')
    });
    tx.oncomplete = async () => {
      db.close();
      document.getElementById('diario-editor').hidden = true;
      await mostrarEntradasDiario();
      alert('Guardado en nuestro diario ❤️');
    };
    tx.onerror = () => {
      db.close();
      alert('No se ha podido guardar. Inténtalo de nuevo.');
    };
  } catch (e) {
    alert('Error al guardar: ' + e.message);
  }
};

window.mostrarRecuerdos = mostrarEntradasDiario;
