from pathlib import Path
import sys

html_path = Path("www/index.html")
js_path = Path("www/js/mensajes.js")

html = html_path.read_text(encoding="utf-8")
js = js_path.read_text(encoding="utf-8")

if 'id="contador-no-leidos"' in html:
    print("El contador ya está instalado en el HTML.")
    sys.exit(0)

if 'function mostrarVista(nombre)' not in html:
    print("No se encuentra la función de navegación.")
    sys.exit(1)

if 'const lista = document.getElementById("lista-mensajes");' not in js:
    print("No se encuentra la estructura esperada de mensajes.js.")
    print("No se ha modificado ningún archivo.")
    sys.exit(1)

original = '''<span class="nombre-acceso">Mensajes</span><span class="detalle-acceso">Un detalle para alegrarte el día</span>'''

nuevo = '''<span class="nombre-acceso">Mensajes <span id="contador-no-leidos" style="display:none;background:#c52c4b;color:white;border-radius:20px;padding:2px 7px;font-size:12px;">0</span></span><span class="detalle-acceso">Un detalle para alegrarte el día</span>'''

if original not in html:
    print("No se encuentra la tarjeta de Mensajes esperada.")
    print("No se ha modificado ningún archivo.")
    sys.exit(1)

html = html.replace(original, nuevo, 1)

original_nav = '''      document.getElementById('panel-inicio').style.display = nombre === 'inicio' ? 'block' : 'none';'''

nuevo_nav = '''      document.body.dataset.vistaActual = nombre;
      document.dispatchEvent(new CustomEvent('vista-cambiada', { detail: { nombre: nombre } }));
      document.getElementById('panel-inicio').style.display = nombre === 'inicio' ? 'block' : 'none';'''

if original_nav not in html:
    print("No se encuentra el punto de navegación esperado.")
    sys.exit(1)

html = html.replace(original_nav, nuevo_nav, 1)

marcador = '''const lista = document.getElementById("lista-mensajes");'''

codigo = '''
const contadorNoLeidos = document.getElementById("contador-no-leidos");
let documentosActuales = [];

function claveLeidos() {
  return usuarioActual ? "entre-nosotros-leidos-" + usuarioActual.uid : "";
}

function idsLeidos() {
  try {
    return JSON.parse(localStorage.getItem(claveLeidos()) || "[]");
  } catch {
    return [];
  }
}

function guardarLeidos(ids) {
  if (!usuarioActual) return;
  localStorage.setItem(claveLeidos(), JSON.stringify([...new Set(ids)]));
}

function actualizarContador() {
  if (!usuarioActual || !contadorNoLeidos) return;

  const leidos = new Set(idsLeidos());
  const pendientes = documentosActuales.filter(m =>
    m.para === usuarioActual.uid && !leidos.has(m.id)
  ).length;

  contadorNoLeidos.textContent = pendientes > 99 ? "99+" : String(pendientes);
  contadorNoLeidos.style.display = pendientes ? "inline-block" : "none";
  contadorNoLeidos.setAttribute(
    "aria-label",
    pendientes + (pendientes === 1 ? " mensaje sin leer" : " mensajes sin leer")
  );
}

function marcarMensajesComoLeidos() {
  if (!usuarioActual) return;

  const leidos = idsLeidos();
  const nuevos = documentosActuales
    .filter(m => m.para === usuarioActual.uid)
    .map(m => m.id);

  guardarLeidos([...leidos, ...nuevos]);
  actualizarContador();
}

document.addEventListener("vista-cambiada", evento => {
  if (evento.detail?.nombre === "mensajes") {
    marcarMensajesComoLeidos();
  }
});
'''

js = js.replace(marcador, marcador + codigo, 1)

js = js.replace(
    '''  const propios = documentos
    .filter(m => m.de === usuarioActual.uid || m.para === usuarioActual.uid)''',
    '''  const propios = documentos
    .filter(m => m.de === usuarioActual.uid || m.para === usuarioActual.uid)''',
    1
)

old_snapshot = '''      const documentos = snapshot.docs.map(d => d.data());
      escaparYMostrarMensajes(documentos);'''

new_snapshot = '''      documentosActuales = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      escaparYMostrarMensajes(documentosActuales);

      if (document.body.dataset.vistaActual === "mensajes") {
        marcarMensajesComoLeidos();
      } else {
        actualizarContador();
      }'''

if old_snapshot not in js:
    print("No se encuentra el bloque de sincronización esperado.")
    print("No se ha modificado ningún archivo.")
    sys.exit(1)

js = js.replace(old_snapshot, new_snapshot, 1)

if 'documentosActuales = snapshot.docs.map' not in js:
    print("No se pudo preparar el contador.")
    sys.exit(1)

html_path.write_text(html, encoding="utf-8")
js_path.write_text(js, encoding="utf-8")

print("Contador instalado correctamente.")
print("HTML y mensajes.js actualizados.")
print("Los mensajes originales se conservan.")
