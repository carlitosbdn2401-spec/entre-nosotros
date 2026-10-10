const boton = document.getElementById("boton-girar-ruleta");
const disco = document.getElementById("ruleta-disco");
const estado = document.getElementById("ruleta-estado");
const resultado = document.getElementById("ruleta-resultado");
const resultadoIcono = document.getElementById("ruleta-resultado-icono");
const resultadoTitulo = document.getElementById("ruleta-resultado-titulo");
const resultadoTexto = document.getElementById("ruleta-resultado-texto");
const secreto = document.getElementById("ruleta-secreto-revelado");

const premios = [
  {nombre:"Puntos extra",icono:"🪙",peso:30,texto:"¡Has conseguido la categoría de puntos extra! La cantidad se configurará al conectar los premios."},
  {nombre:"Vale romántico",icono:"💋",peso:25,texto:"¡Un vale romántico os espera! Los vales se definirán en la tienda de la pareja."},
  {nombre:"Cena o experiencia",icono:"🍽️",peso:20,texto:"¡Ha salido una cena o experiencia para compartir juntos!"},
  {nombre:"Premio picante",icono:"🔥",peso:19,texto:"¡Ha salido un premio picante normal! Deberá respetar las preferencias acordadas por ambos."},
  {nombre:"Nuestro secreto ❤️‍🔥",icono:"🖤❔",peso:1,secreto:true,texto:"Ha salido el premio picante secreto."},
  {nombre:"Premio exclusivo legendario",icono:"👑",peso:5,texto:"¡Ha salido un premio exclusivo legendario!"}
];
function claveMes(){const d=new Date();return `ruleta-prueba-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function premioAleatorio(){let n=Math.random()*100;for(const p of premios){n-=p.peso;if(n<0)return p;}return premios[0];}
function actualizarEstado(){if(localStorage.getItem(claveMes())){boton.disabled=true;boton.textContent="❤️ Giro de prueba utilizado";estado.textContent="Ya has usado el giro de prueba de este mes en este dispositivo.";}}
boton?.addEventListener("click",()=>{
  if(boton.disabled||localStorage.getItem(claveMes()))return;
  boton.disabled=true;resultado.hidden=true;secreto.hidden=true;estado.textContent="La ruleta está girando… ✨";
  const premio=premioAleatorio();
  disco.style.transform=`rotate(${360*6+Math.floor(Math.random()*360)}deg)`;
  window.setTimeout(()=>{
    resultadoIcono.textContent=premio.icono;
    resultadoTitulo.textContent=premio.secreto?"Nuestro secreto ❤️‍🔥":premio.nombre;
    resultadoTexto.textContent=premio.texto;
    secreto.hidden=!premio.secreto;resultado.hidden=false;
    estado.textContent="¡Ya tenemos resultado! Esta versión todavía es una prueba local.";
    localStorage.setItem(claveMes(),JSON.stringify({premio:premio.nombre,fecha:new Date().toISOString(),prueba:true}));
    boton.textContent="❤️ Giro de prueba utilizado";
    resultado.scrollIntoView({behavior:"smooth",block:"nearest"});
  },5100);
});
actualizarEstado();
