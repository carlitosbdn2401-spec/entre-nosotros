from pathlib import Path
import sys

p = Path("www/index.html")
html = p.read_text(encoding="utf-8")

if 'id="panel-inicio"' in html:
    print("El menú ya está instalado.")
    sys.exit(0)

checks = [
    "</style>",
    '<div class="fecha" id="fecha"></div>',
    '<section class="perfil">',
    '<section class="sobre">\n      <div class="hora">10:00 · Buenos días</div>',
    '<section class="sobre">\n      <div class="hora">20:00 · Nuestro momento</div>',
    '<section class="sobre" id="seccion-mensajes">',
    '<section class="sobre">\n      <div class="hora">Nuestro espacio privado</div>',
    '    </div>\n  </main>',
]
for check in checks:
    if check not in html:
        print("No se encuentra:", repr(check))
        print("No se ha modificado nada.")
        sys.exit(1)

css = """
/* Navegación romántica */
.app { padding-bottom: 100px; }
#panel-inicio { margin-top: 22px; }
.bienvenida {
  padding: 25px 21px;
  border: 1px solid rgba(216,183,121,.35);
  border-radius: 24px;
  background: radial-gradient(circle at 90% 5%,rgba(197,44,75,.3),transparent 45%),linear-gradient(145deg,#351522,#211018);
}
.mini-titulo { color:var(--oro);font-size:12px;letter-spacing:2px;text-transform:uppercase; }
.bienvenida h2 { font-size:26px;line-height:1.3;margin:14px 0 10px; }
.bienvenida p { color:var(--suave);line-height:1.6; }
.corazon-decorativo { text-align:right;font-size:32px; }
.titulo-accesos { margin:27px 0 14px;font-size:19px; }
.rejilla-accesos { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px; }
button.tarjeta-acceso {
  width:100%;min-height:125px;padding:15px 13px;text-align:left;
  color:var(--texto);background:linear-gradient(145deg,#2b1722,#1c1017);
  border:1px solid rgba(216,183,121,.24);border-radius:19px;
}
.icono-acceso { display:block;font-size:27px;margin-bottom:10px; }
.nombre-acceso { display:block;font-size:15px;font-weight:bold;margin-bottom:5px; }
.detalle-acceso { display:block;color:var(--suave);font-size:12px;line-height:1.4; }
#navegacion-inferior {
  position:fixed;z-index:999;bottom:0;left:50%;transform:translateX(-50%);
  width:min(100%,480px);box-sizing:border-box;display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;
  padding:9px 6px calc(9px + env(safe-area-inset-bottom));
  background:rgba(25,12,19,.97);border-top:1px solid rgba(216,183,121,.25);
}
#navegacion-inferior button {
  min-width:0;padding:7px 1px;color:var(--suave);background:transparent;
  border:1px solid transparent;border-radius:12px;box-shadow:none;
  font-size:10px;line-height:1.4;
}
#navegacion-inferior .nav-icono { display:block;font-size:21px;margin-bottom:3px; }
#navegacion-inferior button.activo {
  color:#ffd7e1;background:rgba(197,44,75,.18);border-color:rgba(197,44,75,.28);
}
@media(max-width:350px) {
  .rejilla-accesos { gap:8px; }
  button.tarjeta-acceso { padding:12px 9px; }
  #navegacion-inferior button { font-size:9px; }
}
"""

html = html.replace("</style>", css + "\n</style>", 1)

portada = """
    <section id="panel-inicio">
      <div class="bienvenida">
        <div class="mini-titulo">Un lugar solo nuestro</div>
        <h2>Qué bonito tenerte aquí ♡</h2>
        <p>Un pequeño universo para cuidarnos, compartir momentos y recordar todo lo que nos une.</p>
        <div class="corazon-decorativo">♡ ✨ ♡</div>
      </div>
      <h2 class="titulo-accesos">Nuestro espacio</h2>
      <div class="rejilla-accesos">
        <button type="button" class="tarjeta-acceso" data-vista-menu="mensajes"><span class="icono-acceso">💌</span><span class="nombre-acceso">Mensajes</span><span class="detalle-acceso">Un detalle para alegrarte el día</span></button>
        <button type="button" class="tarjeta-acceso" data-vista-menu="retos"><span class="icono-acceso">☀️</span><span class="nombre-acceso">Nuestros retos</span><span class="detalle-acceso">Un momento para nosotros</span></button>
        <button type="button" class="tarjeta-acceso" data-vista-menu="diario"><span class="icono-acceso">📖</span><span class="nombre-acceso">Nuestro diario</span><span class="detalle-acceso">Pequeños recuerdos que guardar</span></button>
        <button type="button" class="tarjeta-acceso" data-vista-menu="nosotros"><span class="icono-acceso">💑</span><span class="nombre-acceso">Nosotros</span><span class="detalle-acceso">Nuestros nombres y símbolos</span></button>
      </div>
    </section>
"""

html = html.replace(
    '<div class="fecha" id="fecha"></div>',
    '<div class="fecha" id="fecha"></div>\n' + portada,
    1
)

replacements = [
    ('<section class="perfil">', '<section class="perfil" data-vista="nosotros">'),
    ('<section class="sobre">\n      <div class="hora">10:00 · Buenos días</div>',
     '<section class="sobre" data-vista="retos">\n      <div class="hora">10:00 · Buenos días</div>'),
    ('<section class="sobre">\n      <div class="hora">20:00 · Nuestro momento</div>',
     '<section class="sobre" data-vista="retos">\n      <div class="hora">20:00 · Nuestro momento</div>'),
    ('<section class="sobre" id="seccion-mensajes">',
     '<section class="sobre" id="seccion-mensajes" data-vista="mensajes">'),
    ('<section class="sobre">\n      <div class="hora">Nuestro espacio privado</div>',
     '<section class="sobre" data-vista="diario">\n      <div class="hora">Nuestro espacio privado</div>'),
]
for original, nuevo in replacements:
    html = html.replace(original, nuevo, 1)

menu = """
    <nav id="navegacion-inferior" aria-label="Navegación principal">
      <button type="button" data-vista-menu="inicio" class="activo"><span class="nav-icono">🏠</span>Inicio</button>
      <button type="button" data-vista-menu="mensajes"><span class="nav-icono">💌</span>Mensajes</button>
      <button type="button" data-vista-menu="retos"><span class="nav-icono">☀️</span>Retos</button>
      <button type="button" data-vista-menu="diario"><span class="nav-icono">📖</span>Diario</button>
      <button type="button" data-vista-menu="nosotros"><span class="nav-icono">💑</span>Nosotros</button>
    </nav>
    <script>
    function mostrarVista(nombre) {
      const validas = ['inicio','mensajes','retos','diario','nosotros'];
      if (!validas.includes(nombre)) return;
      document.getElementById('panel-inicio').style.display = nombre === 'inicio' ? 'block' : 'none';
      document.querySelectorAll('[data-vista]').forEach(function(s) {
        s.style.display = s.dataset.vista === nombre ? '' : 'none';
      });
      document.querySelectorAll('#navegacion-inferior [data-vista-menu]').forEach(function(b) {
        const activo = b.dataset.vistaMenu === nombre;
        b.classList.toggle('activo', activo);
        if (activo) b.setAttribute('aria-current','page');
        else b.removeAttribute('aria-current');
      });
      if (nombre === 'diario' && typeof mostrarRecuerdos === 'function') mostrarRecuerdos();
      window.scrollTo(0,0);
    }
    document.querySelectorAll('[data-vista-menu]').forEach(function(b) {
      b.addEventListener('click',function() { mostrarVista(b.dataset.vistaMenu); });
    });
    mostrarVista('inicio');
    </script>
"""

html = html.replace('    </div>\n  </main>', menu + '\n    </div>\n  </main>', 1)

# Verificación antes de guardar.
for marcador in ['id="panel-inicio"', 'id="navegacion-inferior"',
                 'data-vista="mensajes"', 'data-vista="retos"',
                 'data-vista="diario"', 'data-vista="nosotros"']:
    if marcador not in html:
        print("Falta el marcador:", marcador)
        sys.exit(1)

p.write_text(html, encoding="utf-8")
print("Rediseño guardado correctamente.")
