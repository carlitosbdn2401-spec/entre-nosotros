import { mostrarAnimacionCanje } from "./tienda-animaciones.js";
const CLAVE = "entreNosotrosTiendaPruebaV1";
const paginasVales = {
  r1: "prueba-vale-besos.html",
  r2: "prueba-abrazo-para-dos.html",
  r3: "prueba-momento-relax.html",
  r4: "prueba-cena-especial.html",
  r5: "prueba-noche-de-peli.html",
  r6: "prueba-caja-misteriosa.html",
  r7: "prueba-vale-picante.html",
  r8: "prueba-premio-exclusivo.html"
};

const recompensasIniciales = [
  {id:"r1",icono:"💋",nombre:"Vale de besos",descripcion:"Un momento lleno de besos.",precio:25,tipo:"inmediato",personalizada:false},
  {id:"r2",icono:"🤗",nombre:"Abrazo largo",descripcion:"Un abrazo sin prisas, solo para nosotros.",precio:20,tipo:"inmediato",personalizada:false},
  {id:"r3",icono:"💆",nombre:"Masaje relajante",descripcion:"Un masaje para desconectar juntos.",precio:60,tipo:"aprobacion",personalizada:false},
  {id:"r4",icono:"🍽️",nombre:"Cena especial",descripcion:"Elegimos una cena y disfrutamos juntos.",precio:120,tipo:"aprobacion",personalizada:false},
  {id:"r5",icono:"🎬",nombre:"Noche de peli",descripcion:"Peli elegida por quien canjea y tiempo juntos.",precio:45,tipo:"inmediato",personalizada:false},
  {id:"r6",icono:"🌹",nombre:"Sorpresa romántica",descripcion:"Una pequeña sorpresa preparada con cariño.",precio:90,tipo:"aprobacion",personalizada:false},
  {id:"r7",icono:"🔥",nombre:"Vale picante",descripcion:"Una experiencia acordada y deseada por ambos.",precio:100,tipo:"aprobacion",personalizada:false},
  {id:"r8",icono:"👑",nombre:"Premio exclusivo",descripcion:"Un premio especial que decidiremos juntos.",precio:180,tipo:"aprobacion",personalizada:false}
];

function cargarDatos(){
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    if(datos && datos.saldos && Array.isArray(datos.recompensas) && Array.isArray(datos.canjes)) return datos;
  } catch(e) {}
  return {saldos:{yo:0,pareja:0},recompensas:recompensasIniciales,canjes:[]};
}
let datos = cargarDatos();
function guardar(){ localStorage.setItem(CLAVE,JSON.stringify(datos)); }
function persona(){ return document.getElementById("tienda-persona")?.value || "yo"; }
function escapar(s){
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderizar(){
  const saldo = document.getElementById("tienda-puntos");
  if(!saldo) return;
  saldo.textContent = datos.saldos[persona()] || 0;
  const catalogo = document.getElementById("tienda-catalogo");
  catalogo.innerHTML = datos.recompensas.map(r=>paginasVales[r.id] ? `
    <button type="button" class="tienda-tarjeta-vale" data-comprar="${escapar(r.id)}" aria-label="Canjear ${escapar(r.nombre)} por ${Number(r.precio)} puntos">
      <img src="/imagenes/vales/vale-${escapar(r.id)}.png" alt="${escapar(r.nombre)}">
    </button>` : `
    <article class="tienda-producto">
      <span class="producto-icono">${escapar(r.icono || "💝")}</span>
      <h4>${escapar(r.nombre)}</h4>
      <p>${escapar(r.descripcion || "Una recompensa para nosotros.")}</p>
      <span class="tienda-etiqueta">${r.tipo==="aprobacion"?"💌 Requiere aprobación":"💗 Canje inmediato"}</span>
      <span class="producto-precio">💎 ${Number(r.precio)} puntos</span>
      <button type="button" data-comprar="${escapar(r.id)}">Canjear</button>
    </article>`).join("");
  const canjes = document.getElementById("tienda-canjes");
  const mios = datos.canjes.filter(c=>c.persona===persona()).slice().reverse();
  canjes.innerHTML = mios.length ? mios.map(c=>`
    <div class="tienda-canje">
      <strong>${escapar(c.nombre)}</strong>
      <div class="tienda-estado">${c.estado==="pendiente"?"⏳ Pendiente de aprobación":c.estado==="disponible"?"💗 Disponible para utilizar":"❤️ Canje registrado"}</div>
      <small>${new Date(c.fecha).toLocaleDateString()}</small>
      ${paginasVales[c.recompensaId] ? `<button type="button" data-abrir-vale="${escapar(c.recompensaId)}">Abrir mi vale ❤️</button>` : ""}
    </div>`).join("") : '<p class="descripcion">Todavía no tienes canjes. ¡Elige una recompensa que te haga ilusión! ❤️</p>';
}
function aviso(msg){ window.alert(msg); }

document.addEventListener("click",e=>{
  const abrirVale = e.target.closest("[data-abrir-vale]");
  if (abrirVale) {
    const pagina = paginasVales[abrirVale.dataset.abrirVale];
    if (pagina) window.location.href = "./" + pagina;
    return;
  }

  const comprar = e.target.closest("[data-comprar]");
  if(comprar){
    const r = datos.recompensas.find(x=>x.id===comprar.dataset.comprar);
    if(!r) return;
    const p = persona();
    if((datos.saldos[p]||0) < Number(r.precio)){
      aviso("Todavía no tienes suficientes puntos. En esta versión puedes añadir puntos de prueba.");
      return;
    }
    if(!confirm(`¿Canjear «${r.nombre}» por ${r.precio} puntos?`)) return;
    datos.saldos[p] -= Number(r.precio);
    datos.canjes.push({
      id:"c"+Date.now(),persona:p,nombre:r.nombre,recompensaId:r.id,precio:Number(r.precio),
      estado:r.tipo==="aprobacion"?"pendiente":"disponible",
      fecha:new Date().toISOString()
    });
    guardar();renderizar();
    const paginaVale = paginasVales[r.id];
    if (paginaVale) {
      window.location.href = "./" + paginaVale;
    } else {
      mostrarAnimacionCanje(r, r.tipo==="aprobacion"?"pendiente":"disponible");
    }
  }
});
document.getElementById("tienda-persona")?.addEventListener("change",renderizar);
document.getElementById("tienda-añadir-puntos")?.addEventListener("click",()=>{
  const p=persona();
  datos.saldos[p]=(datos.saldos[p]||0)+50;
  guardar();renderizar();
});
document.getElementById("tienda-crear-recompensa")?.addEventListener("click",()=>{
  const nombre=document.getElementById("tienda-nombre-nuevo").value.trim();
  const descripcion=document.getElementById("tienda-descripcion-nueva").value.trim();
  const precio=Number(document.getElementById("tienda-precio-nuevo").value);
  const tipo=document.getElementById("tienda-tipo-nuevo").value;
  if(!nombre){aviso("Escribe un nombre para la recompensa.");return;}
  if(!Number.isInteger(precio)||precio<1||precio>100000){aviso("El precio debe ser un número entero entre 1 y 100000.");return;}
  datos.recompensas.push({
    id:"custom"+Date.now(),icono:"💝",nombre,descripcion,precio,tipo,personalizada:true
  });
  guardar();
  document.getElementById("tienda-nombre-nuevo").value="";
  document.getElementById("tienda-descripcion-nueva").value="";
  document.getElementById("tienda-precio-nuevo").value="30";
  renderizar();
  aviso("Recompensa añadida a la tienda de este dispositivo.");
});
document.addEventListener("vista-cambiada",e=>{
  if(e.detail?.nombre==="tienda") renderizar();
});
guardar();
renderizar();
