import { combinarEntradas, eliminarEntradaCompartida, compartirEntradaLocal, guardarReaccionDiario } from "./diario-sync.js";
import { ponerTextoConIconos } from "./iconos-texto.js";
import { auth } from "./firebase.js";

function añadirReaccionesDiario(p, entrada) {
 const opciones = [
  ["❤️","Me encanta"],
  ["💔","No me gusta"],
  ["🥰","Me emociona"],
  ["😂","Me hace reír"],
  ["🔥","Me calienta"]
 ];
 const miembros = [
  "BO9OTnpEPCSCrljTUjRfs2qu39i2",
  "j1mbdehEbCansXpAl3Awwc5azcB3"
 ];
 const actual = auth.currentUser?.uid;
 const bloque = document.createElement("section");
 bloque.className = "diario-reacciones";
 bloque.style.cssText = "margin:16px 0;padding:10px 0;border-top:1px solid #c5a15b";
 const titulo = document.createElement("small");
 titulo.textContent = "¿Qué te hace sentir esta entrada?";
 bloque.append(titulo);
 const botones = document.createElement("div");
 botones.style.cssText = "display:flex;flex-wrap:wrap;gap:7px;margin:10px 0";
 const reacciones = entrada.reacciones || {};
 opciones.forEach(([emoji, nombre]) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = emoji + " " + nombre;
  b.title = nombre;
  b.style.cssText = "border:1px solid #c5a15b;border-radius:16px;padding:7px 10px;background:" + (reacciones[actual] === emoji ? "#681b32" : "#fff5df") + ";color:" + (reacciones[actual] === emoji ? "#fff5df" : "#49252b") + ";font-size:13px";
  b.disabled = !actual || !entrada.cloudId;
  b.addEventListener("click", async () => {
   try {
    b.disabled = true;
    await guardarReaccionDiario(entrada, emoji);
   } catch (error) {
    console.error("No se pudo guardar la reacción:", error);
    alert(error.message || "No se ha podido guardar la reacción.");
   } finally {
    b.disabled = false;
   }
  });
  botones.append(b);
 });
 bloque.append(botones);
 const resumen = document.createElement("div");
 resumen.className = "diario-reacciones-resumen";
 resumen.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:10px 0;font-size:20px";
 miembros.forEach(uid => {
  const emoji = reacciones[uid];
  const opcion = opciones.find(x => x[0] === emoji);
  if (!opcion) return;
  const icono = document.createElement("span");
  icono.textContent = (uid === actual ? "Tú " : "Tu pareja ") + opcion[0];
  icono.title = (uid === actual ? "Tú: " : "Tu pareja: ") + opcion[1];
  icono.setAttribute("aria-label", icono.title);
  resumen.append(icono);
 });
 if (resumen.childElementCount) {
  const ancla = p.querySelector("img") || p.querySelector("p");
  if (ancla) ancla.insertAdjacentElement("afterend", resumen);
  else p.append(resumen);
 }
 const nombres = miembros.map(uid => {
  const quien = uid === actual ? "Tú" : "Tu pareja";
  const emoji = reacciones[uid];
  const opcion = opciones.find(x => x[0] === emoji);
  const linea = document.createElement("div");
  linea.style.cssText = "font-size:13px;margin-top:5px";
  linea.textContent = quien + ": " + (opcion ? opcion[0] + " " + opcion[1] : "Sin reacción");
  return linea;
 });
 nombres.forEach(linea => bloque.append(linea));
 p.append(bloque);
}

const DB='entre-nosotros-diario';
const tipos=['recuerdo','foto','mensaje','dedicatoria'];
const nombres=['Añadir recuerdo','Añadir foto','Mensajes','Dedicatorias'];
let pagina=-1, foto=null, inicioX=0, inicioY=0, timer, pasandoPagina=false, modoLibro=false;

function abrirDB(){
 return new Promise((ok,fail)=>{
  const r=indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('entradas'))r.result.createObjectStore('entradas',{keyPath:'id',autoIncrement:true})};
  r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error);
 });
}
async function entradas(){
 const db=await abrirDB();
 return new Promise((ok,fail)=>{
  const r=db.transaction('entradas').objectStore('entradas').getAll();
  r.onsuccess=async()=>{
   const locales=r.result.reverse();
   db.close();
   try{ok(await combinarEntradas(locales))}
   catch(error){console.error("Error al combinar el diario:",error);ok(locales)}
  };
  r.onerror=()=>{db.close();fail(r.error)};
 });
}
async function borrarEntradaDiario(entrada) {
 if(entrada.cloudId){
  await eliminarEntradaCompartida(entrada);
  return;
 }
 const db=await abrirDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("entradas","readwrite");
  tx.objectStore("entradas").delete(entrada.id);
  tx.oncomplete=()=>{db.close();resolve()};
  tx.onerror=()=>{db.close();reject(tx.error)};
 });
}

function zona(texto,top,accion){
 const b=document.createElement('button');b.className='diario-zona';
 b.style.top=top+'%';b.setAttribute('aria-label',texto);b.onclick=accion;return b;
}
function indice(){
 pagina=-1;foto=null;modoLibro=false;
 const c=document.getElementById('diario-pagina-actual');c.replaceChildren();
 const caja=document.createElement('div');caja.className='diario-indice';
 const img=document.createElement('img');img.src='/assets/indice-del-gif.png';img.alt='Índice de nuestro diario';caja.append(img);
 [24,36,48,60].forEach((top,i)=>caja.append(zona(nombres[i],top,()=>mostrarPagina(i,0,true))));
 c.append(caja);
}
async function mostrarPagina(i, numero=0, editar=false){
 modoLibro=false;
 pagina=i;
 window.diarioNumero=numero;
 const c=document.getElementById("diario-pagina-actual");
 c.replaceChildren();
 const p=document.createElement("div");
 p.className="diario-pagina";
 const listaEntradas=(await entradas()).filter(e=>e.tipo===tipos[i]);
 numero=Math.max(0,Math.min(numero,Math.max(0,listaEntradas.length-1)));
 window.diarioNumero=numero;
 const e=listaEntradas[numero];
 const accion=(texto,fn,clase)=>{
  const el=document.createElement("span");
  ponerTextoConIconos(el, texto);
  el.className="diario-accion-texto "+(clase||"");
  el.setAttribute("role","button");
  el.tabIndex=0;
  el.onclick=fn;
  el.onkeydown=ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();fn()}};
  return el;
 };
 const pie=document.createElement("div");
 pie.className="diario-pie-acciones";
 let eliminar;
 if(editar){
  const area=document.createElement("textarea");
  area.placeholder=i===0?"Escribe nuestro recuerdo…":i===1?"Escribe algo sobre esta foto…":i===2?"Escribe tu mensaje…":"Escribe tu dedicatoria…";
  p.append(area);
  let archivo=null;
  if(i===1){
   const input=document.createElement("input");
   input.type="file";input.accept="image/*";
   input.onchange=()=>{archivo=input.files[0]||null};
   p.append(input);
  }
  const guardar=document.createElement("button");
  ponerTextoConIconos(guardar, "Guardar ❤️");
  guardar.onclick=async()=>{
   const texto=area.value.trim();
   if(!texto&&!archivo){alert("Escribe algo o elige una foto ❤️");return}
   try{
    const fecha=new Date().toLocaleDateString("es-ES");
    const entrada={tipo:tipos[i],texto,foto:archivo,fecha};
    const db=await abrirDB();
    const tx=db.transaction("entradas","readwrite");
    const solicitud=tx.objectStore("entradas").add(entrada);
    let idGuardado=null;
    solicitud.onsuccess=()=>{idGuardado=solicitud.result};

    try{
     await new Promise((resolve,reject)=>{
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error||new Error("Se canceló el guardado local."));
     });
    }catch(error){
     db.close();
     throw error;
    }
    db.close();

    entrada.id=idGuardado;
    let cloudId=null;

    try{
     cloudId=await compartirEntradaLocal(entrada);
    }catch(error){
     console.error("No se pudo sincronizar la entrada del diario:",error);
     alert("La entrada está guardada en este dispositivo, pero no se pudo sincronizar con Firebase: "+error.message);
     mostrarPagina(i,0,false);
     return;
    }

    const actualizadas=(await entradas()).filter(x=>x.tipo===tipos[i]);
    alert(cloudId
     ? "Guardado y sincronizado con Firebase ❤️"
     : "Guardado en este dispositivo, pero no sincronizado. Comprueba que has iniciado sesión con una cuenta autorizada.");
    mostrarPagina(i,Math.max(0,actualizadas.length-1),false);
   }catch(err){alert("Error al guardar: "+err.message)}
  };
  p.append(guardar);
  pie.append(accion("Índice",indice));
 }else{
  if(e){
   if(e.texto){
    const texto=document.createElement("p");
    ponerTextoConIconos(texto, e.texto);
    texto.style.whiteSpace="pre-wrap";
    p.append(texto);
   }
   const fuenteFoto = e.fotoData || (e.foto ? URL.createObjectURL(e.foto) : null);
  if(fuenteFoto){
    const im=document.createElement("img");
    im.src=fuenteFoto;
    im.alt="Foto guardada en nuestro diario";
    im.style.maxWidth="100%";im.style.height="auto";
    p.append(im);
   }
   if(e.fecha){
    const fecha=document.createElement("small");
    fecha.textContent=e.fecha;
    p.append(fecha);
   }
   eliminar=accion("Eliminar",async()=>{
    if(!confirm("¿Eliminar solo esta entrada?"))return;
    try{
     await borrarEntradaDiario(e);
     const restantes=(await entradas()).filter(x=>x.tipo===tipos[i]);
     mostrarPagina(i,Math.min(numero,Math.max(0,restantes.length-1)),false);
    }catch(error){
     console.error("Error al eliminar la entrada:",error);
     alert("No se ha podido eliminar");
    }
   },"diario-eliminar");
  }
  pie.append(accion("Índice",indice));
  if(e)pie.append(eliminar);
 }
 if(e) añadirReaccionesDiario(p, e);
 p.append(pie);
 c.append(p);
}

window.diario=function(){
 const caja=document.getElementById('diario');
 const abrir=caja.style.display!=='block';
 caja.style.display=abrir?'block':'none';
 if(!abrir)return;
 const anim=document.getElementById('diario-animacion');
 const contenido=document.getElementById('diario-libro-contenido');
 contenido.hidden=true;
 anim.hidden=false;
 const im=anim.querySelector('img');
 if(im)im.src='/assets/gifapp.gif?v='+Date.now();
 clearTimeout(timer);
 timer=setTimeout(()=>{
  anim.hidden=true;
  contenido.hidden=false;
  indice();
 },4240);
};
async function mostrarPaginaLibro(numero=0){
 modoLibro=true;
 const todas=await entradas();
 const c=document.getElementById('diario-pagina-actual');
 c.replaceChildren();
 if(!todas.length){
  pagina=-2;
  const p=document.createElement('div');
  p.className='diario-pagina';
  ponerTextoConIconos(p, 'Todavía no hay páginas guardadas.');
  const volver=document.createElement('span');
  volver.className='diario-accion-texto';
  ponerTextoConIconos(volver, 'Índice');
  volver.setAttribute('role','button');
  volver.onclick=indice;
  p.append(volver);
  c.append(p);
  window.diarioNumero=0;
  return;
 }
 numero=Math.max(0,Math.min(numero,todas.length-1));
 pagina=-2;
 window.diarioNumero=numero;
 const e=todas[numero];
 const p=document.createElement('div');
 p.className='diario-pagina';
 const titulo=document.createElement('small');
 ponerTextoConIconos(titulo, ({recuerdo:'Recuerdo',foto:'Foto',mensaje:'Mensaje',dedicatoria:'Dedicatoria'}[e.tipo]||'Diario'));
 p.append(titulo);
 if(e.texto){
  const texto=document.createElement('p');
  ponerTextoConIconos(texto, e.texto);
  texto.style.whiteSpace='pre-wrap';
  p.append(texto);
 }
 const fuenteFoto = e.fotoData || (e.foto ? URL.createObjectURL(e.foto) : null);
  if(fuenteFoto){
  const im=document.createElement('img');
  im.src=fuenteFoto;
  im.alt='Foto guardada en nuestro diario';
  im.style.maxWidth='100%';
  im.style.maxHeight='300px';
  im.style.height='auto';
  p.append(im);
 }
 if(e.fecha){
  const fecha=document.createElement('small');
  fecha.textContent=e.fecha;
  p.append(fecha);
 }
 const pie=document.createElement('div');
 pie.className='diario-pie-acciones';
 const accion=(texto,fn,clase)=>{
  const el=document.createElement('span');
  ponerTextoConIconos(el, texto);
  el.className='diario-accion-texto '+(clase||'');
  el.setAttribute('role','button');
  el.tabIndex=0;
  el.onclick=fn;
  el.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();fn()}};
  return el;
 };
 pie.append(accion('Índice',indice));
 pie.append(accion('Eliminar',async()=>{
  if(!confirm('¿Eliminar solo esta entrada?'))return;
  try{
   await borrarEntradaDiario(e);
   const restantes=await entradas();
   if(restantes.length)mostrarPaginaLibro(Math.min(numero,restantes.length-1));
   else mostrarPaginaLibro(0);
  }catch(error){
   console.error("Error al eliminar la entrada:",error);
   alert("No se ha podido eliminar");
  }
 },'diario-eliminar'));
 if(e) añadirReaccionesDiario(p, e);
 p.append(pie);
 c.append(p);
}
const contenido=document.getElementById('diario-libro-contenido');
if(contenido){
 contenido.addEventListener('touchstart',e=>{
  if(!e.changedTouches.length)return;
  inicioX=e.changedTouches[0].screenX;
  inicioY=e.changedTouches[0].screenY;
 },{passive:true});
 contenido.addEventListener('touchend',async e=>{
  if(!e.changedTouches.length||pasandoPagina)return;
  const dx=e.changedTouches[0].screenX-inicioX;
  const dy=e.changedTouches[0].screenY-inicioY;
  if(Math.abs(dx)<=60||Math.abs(dx)<=Math.abs(dy)*1.25)return;
  if(e.target.closest('.diario-pie-acciones,.diario-zona,textarea,input,button'))return;
  if(pagina===-1){
   if(dx<0){
    pasandoPagina=true;
    try{await mostrarPaginaLibro(0)}catch(err){console.error(err)}
    finally{pasandoPagina=false}
   }
   return;
  }
  const actual=Number.isInteger(window.diarioNumero)?window.diarioNumero:0;
  const siguiente=actual+(dx<0?1:-1);
  const contenedorPagina=document.getElementById('diario-pagina-actual');
  const hojaActual=contenedorPagina.querySelector(':scope > .diario-pagina');
  if(!hojaActual||hojaActual.querySelector('textarea,input'))return;
  const lista=modoLibro?await entradas():(await entradas()).filter(x=>x.tipo===tipos[pagina]);
  if(!lista[actual]||siguiente<0||siguiente>=lista.length)return;
  pasandoPagina=true;
  const hojaSaliente=hojaActual.cloneNode(true);
  hojaSaliente.classList.add('diario-hoja-saliente');
  hojaSaliente.setAttribute('aria-hidden','true');
  try{
   if(modoLibro)await mostrarPaginaLibro(siguiente);
   else await mostrarPagina(pagina,siguiente,false);
   contenedorPagina.append(hojaSaliente);
   const haciaIzquierda=dx<0;
   hojaSaliente.style.transformOrigin=haciaIzquierda?"right center":"left center";
   const animacion=hojaSaliente.animate([
    {transform:'translateX(0) rotateY(0deg)',boxShadow:'0 0 5px #0002',opacity:1},
    {transform:haciaIzquierda?'translateX(-105%) rotateY(78deg)':'translateX(105%) rotateY(-78deg)',boxShadow:haciaIzquierda?'-18px 4px 22px #0005':'18px 4px 22px #0005',opacity:.96}
   ],{duration:1300,easing:'cubic-bezier(.45,.05,.25,1)',fill:'forwards'});
   await animacion.finished;
   hojaSaliente.remove();
  }catch(err){hojaSaliente.remove();console.error('No se pudo pasar la página:',err)}
  finally{pasandoPagina=false}
 },{passive:true});
}
window.addEventListener("diario-sincronizado", () => {
 const caja = document.getElementById("diario");
 if (!caja || caja.style.display !== "block") return;

 const contenedor = document.getElementById("diario-pagina-actual");
 if (!contenedor || contenedor.querySelector("textarea,input")) return;

 if (pagina === -1) return;

 const numero = Number.isInteger(window.diarioNumero)
  ? window.diarioNumero : 0;

 if (pagina === -2) {
  mostrarPaginaLibro(numero);
 } else if (pagina >= 0) {
  mostrarPagina(pagina, numero, false);
 }
});

window.mostrarRecuerdos=entradas;
