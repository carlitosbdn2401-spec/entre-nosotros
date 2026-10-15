import { crearEscena3D } from "./escenas-3d.js";
const escenas = {
r1:["💌","💋","Lluvia de besos"],
r2:["🫂","💕","Abrazo para dos"],
r3:["💑","👐","Momento de relax"],
r4:["🍽️","🥂","Nuestra cena especial"],
r5:["🎬","🍿","Noche de película"],
r6:["🌹","🌸","Una rosa para ti"],
r7:["❤️‍🔥","🔥","Se enciende la pasión"],
r8:["👑","💎","Premio exclusivo"]
};

export function mostrarAnimacionCanje(recompensa, estado) {
  document.getElementById("animacion-canje")?.remove();
  const e = escenas[recompensa.id] || ["🎁","💖","Sorpresa especial"];
  const modal = document.createElement("div");
  const escenasExtra = {
    r1:"<div class=\"extra-besos\">😘　💋　😘<br>💖　💕　💖</div>",
    r2:"<div class=\"extra-abrazo\">🫂　💑<br>💕　✨　💕</div>",
    r3:"<div class=\"extra-masaje\">🛏️　💆　👐<br>🌿　✨　🌿</div>",
    r4:"<div class=\"extra-cena\">🍴　🍽️　🥂<br>🕯️　🌹　🕯️</div>",
    r5:"<div class=\"extra-pelicula\">🎬　🍿　🥤<br>🌟　🎞️　🌟</div>",
    r6:"<div class=\"extra-rosa\">🌹　🌹　🌹<br>🌸　🌺　🌸</div>",
    r7:"<div class=\"extra-pasion\">❤️‍🔥　💋　❤️‍🔥<br>💘　✨　💘</div>",
    r8:"<div class=\"extra-premio\">🎁　👑　💎<br>✨　🌟　✨</div>"
  };
  const escenaExtra = escenasExtra[recompensa.id] || "";
  modal.id = "animacion-canje";
  modal.classList.add(recompensa.id || "r8");
  modal.innerHTML = `
  <style>
  #animacion-canje{position:fixed;inset:0;z-index:99999;background:#160812ed;display:grid;place-items:center;padding:20px}
  #animacion-canje .tarjeta{background:linear-gradient(145deg,#6b2348,#24101f);color:#fff0f6;text-align:center;padding:30px 20px;border-radius:25px;border:2px solid #e9a5c7;max-width:330px;width:100%;box-shadow:0 0 40px #ff69b477;animation:entrada .6s ease}
  #animacion-canje .icono{font-size:75px;animation:flotar 1.5s infinite}
  #animacion-canje .destellos{height:22px;margin:18px;position:relative} #animacion-canje .destellos:before{content:"✦  ✧  ✦";color:#e9b949;font-size:24px;letter-spacing:12px}
  #animacion-canje button{background:#f5b5d2;color:#42142d;border:0;border-radius:20px;padding:12px 25px;font-weight:bold}
  @keyframes entrada{from{transform:scale(.3) rotate(-8deg);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes flotar{50%{transform:translateY(-10px) scale(1.08)}}


  #animacion-canje .sobre{
    position:relative;width:min(100%,320px);aspect-ratio:1.65;height:auto;
    margin:35px auto 25px;overflow:visible;isolation:isolate;
    background:linear-gradient(145deg,#f5bdce 0%,#e88fab 58%,#c96583 100%);
    border:2px solid #d4af37;
    box-shadow:0 18px 35px #0007,inset 0 0 22px #fff2;
    perspective:1000px;
  }
  #animacion-canje .body-shine{
    position:absolute;inset:0;z-index:0;pointer-events:none;
    background:linear-gradient(115deg,transparent 25%,#fff2 48%,transparent 70%);
  }
  #animacion-canje .interior{
    position:absolute;inset:0;z-index:1;opacity:0;pointer-events:none;
    clip-path:polygon(0 0,100% 0,50% 43%);
    background:linear-gradient(145deg,#a54a69 0%,#84314f 52%,#54172f 100%);
    transition:opacity .25s ease;
  }
  #animacion-canje .sobre.abierto .interior{opacity:1}
  #animacion-canje .pliegue{
    position:absolute;top:0;width:57.7%;height:2px;
    background:linear-gradient(90deg,#9a7024,#fff0b0 45%,#d4af37 80%,#fff0b0);
    box-shadow:0 1px 2px #3c1524;
  }
  #animacion-canje .pliegue.izq{left:0;transform-origin:left center;transform:rotate(27.5deg)}
  #animacion-canje .pliegue.der{right:0;transform-origin:right center;transform:rotate(-27.5deg)}
  #animacion-canje .solapa{
    position:absolute;left:0;top:0;width:100%;height:43%;z-index:3;
    clip-path:polygon(0 0,100% 0,50% 100%);
    transform-origin:50% 0;
    background:linear-gradient(155deg,#f9d0dc 0%,#ed9bb4 58%,#d87596 100%);
    filter:drop-shadow(0 3px 2px #53223866);
    animation:abrir-sobre .9s .4s cubic-bezier(.2,.7,.2,1) forwards;
    pointer-events:none;
  }
  #animacion-canje .solapa:after{
    content:"";position:absolute;inset:0;
    clip-path:polygon(0 0,100% 0,50% 100%);
    background:linear-gradient(155deg,#84314f 0%,#641d39 58%,#421126 100%);
    transform:rotateX(180deg);backface-visibility:hidden;
  }
  #animacion-canje .borde-solapa{
    position:absolute;top:0;width:57.7%;height:2px;
    background:linear-gradient(90deg,#a87926,#fff0b0,#d4af37);
  }
  #animacion-canje .borde-solapa.izq{left:0;transform-origin:left center;transform:rotate(27.5deg)}
  #animacion-canje .borde-solapa.der{right:0;transform-origin:right center;transform:rotate(-27.5deg)}
  #animacion-canje .lacrado{
    position:absolute;z-index:5;top:43%;left:50%;
    transform:translate(-50%,-50%);
    width:clamp(42px,11vw,58px);aspect-ratio:1;border-radius:50%;
    display:grid;place-items:center;
    background:radial-gradient(circle at 32% 25%,#fff1bb 0%,#e6c66c 32%,#b58a32 68%,#77521b 100%);
    border:2px solid #f5e3a2;
    box-shadow:0 3px 9px #0008,inset 0 0 0 2px #9c762e;
    color:#fff4cb;font-size:30px;text-shadow:0 1px 2px #75501c;
    clip-path:circle(50%);
    transition:clip-path .3s ease .65s;
    pointer-events:none;
  }
  #animacion-canje .sobre.abierto .lacrado{
    clip-path:polygon(6% 27%,0% 38%,0% 70%,15% 90%,30% 98%,50% 100%,70% 98%,85% 90%,100% 70%,100% 38%,94% 27%,50% 50%);
  }
  #animacion-canje .tarjeta-vale{
    position:absolute;z-index:2;left:50%;bottom:5%;
    width:76%;min-height:78%;padding:12px 8px;
    box-sizing:border-box;border:2px solid #d4af37;border-radius:10px;
    background:linear-gradient(155deg,#fff9f4,#f8dce7);
    color:#6b2348;text-align:center;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
    opacity:0;transform:translate(-50%,35%) scale(.65);
    box-shadow:0 5px 15px #0004;
    animation:tarjeta-sale 1s 1s cubic-bezier(.2,.7,.2,1) forwards;
  }
  #animacion-canje .tarjeta-vale .mini-icono{font-size:30px;line-height:1.2}
  #animacion-canje .tarjeta-vale strong{font-size:13px;letter-spacing:1px}
  #animacion-canje .tarjeta-vale small{font-size:10px}
  #animacion-canje .video-abrazo-para-dos{display:block;width:100%;height:76px;object-fit:cover;object-position:center;border:1px solid #d4af37;border-radius:7px;box-sizing:border-box;background:#24101f;}
  @keyframes tarjeta-sale{
    0%{opacity:0;transform:translate(-50%,35%) scale(.65)}
    100%{opacity:1;transform:translate(-50%,-48%) scale(1)}
  }

  #animacion-canje .foto-premio{display:block;width:218px;height:145px;object-fit:cover;object-position:center;margin:14px auto;border:2px solid #d8b56a;border-radius:12px;box-shadow:0 5px 20px #0008;animation:foto-revelada 1.3s 0.85s both}
  @keyframes foto-revelada{from{opacity:0;transform:translateY(16px) scale(.94);filter:brightness(.55) blur(3px)}to{opacity:1;transform:translateY(0) scale(1);filter:brightness(1) blur(0)}}
  #animacion-canje .escena-3d{display:block;width:210px;height:160px;margin:auto;filter:drop-shadow(0 10px 12px #0005);animation:escena-flotante 2.5s ease-in-out infinite}
  @keyframes escena-flotante{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-7px) rotate(1deg)}}
  #animacion-canje .solapa{position:absolute;z-index:3;left:0;top:0;width:100%;height:43%;background:linear-gradient(155deg,#f9d0dc 0%,#ed9bb4 58%,#d87596 100%);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:50% 0;animation:abrir-sobre .9s .4s forwards;pointer-events:none}

  #animacion-canje .revelacion .icono{font-size:65px}
  #animacion-canje .extra-cena,#animacion-canje .extra-masaje,#animacion-canje .extra-besos,#animacion-canje .extra-abrazo,#animacion-canje .extra-pelicula,#animacion-canje .extra-rosa,#animacion-canje .extra-pasion,#animacion-canje .extra-premio{font-size:27px;line-height:1.8;animation:salir-sobre 1.2s 1.2s both;filter:drop-shadow(0 0 8px #ffd66b)}
  #animacion-canje .brillo{font-size:25px;filter:drop-shadow(0 0 8px #ffd66b);animation:destello 1s infinite alternate}
  @keyframes abrir-sobre{to{transform:rotateX(180deg);z-index:0}}
  @keyframes salir-sobre{from{transform:translateY(45px) scale(.35);opacity:0}to{transform:translateY(-18px) scale(1);opacity:1}}
  @keyframes destello{to{filter:drop-shadow(0 0 15px #ffd66b);transform:scale(1.12)}}
  #animacion-canje.r1 .extra-besos{animation:besos 1.5s infinite alternate}
  #animacion-canje.r2 .extra-abrazo{animation:abrazo 1.2s infinite alternate}
  #animacion-canje.r3 .extra-masaje{animation:relax 3s infinite alternate}
  #animacion-canje.r4 .extra-cena{animation:brillo 1.5s infinite alternate}
  #animacion-canje.r5 .extra-pelicula{animation:flotar 2s infinite}
  #animacion-canje.r6 .extra-rosa{animation:rosa 2s infinite alternate}
  #animacion-canje.r7 .extra-pasion{animation:brillo .8s infinite alternate}
  #animacion-canje.r8 .extra-premio{animation:brillo 1s infinite alternate}
  @keyframes besos{to{transform:translateY(-10px) scale(1.1)}}
  @keyframes abrazo{to{transform:scale(1.12)}}
  @keyframes relax{to{transform:translateY(-5px)}}
  @keyframes rosa{to{transform:scale(1.15) rotate(5deg)}}
  @keyframes brillo{to{transform:scale(1.15);filter:drop-shadow(0 0 15px #ffd66b)}}

#animacion-canje .sobre:after{content:"";position:absolute;z-index:8;left:50%;top:40%;width:240px;height:240px;pointer-events:none;background:radial-gradient(circle,#fff8b0 1px,transparent 2px),radial-gradient(circle,#e9b949 1.5px,transparent 3px),radial-gradient(circle,#fff 1px,transparent 2px);background-size:17px 19px,29px 31px,11px 13px;transform:translate(-50%,-50%) scale(.15);opacity:0;animation:purpurina-dorada 2.4s 1.1s ease-out forwards}
@keyframes purpurina-dorada{0%{transform:translate(-50%,-50%) scale(.15);opacity:0}15%{opacity:1}60%{transform:translate(-50%,-20%) scale(1.2);opacity:.9}100%{transform:translate(-50%,35%) scale(1.6);opacity:0}}
</style>
  <div class="tarjeta">
  <div class="cabecera-premio">UNA RECOMPENSA PARA VOSOTROS</div>
  <div class="sobre abierto">
    <div class="body-shine"></div>
    <div class="interior"><div class="pliegue izq"></div><div class="pliegue der"></div></div>
    <div class="tarjeta-vale"><span class="mini-icono">${e[0]}</span><strong>${recompensa.nombre}</strong>${recompensa.id === "r2" ? '<video class="video-abrazo-para-dos" src="/assets/abrazo-para-dos.mp4" autoplay muted loop playsinline preload="metadata" aria-label="Pareja abrazándose en una escena romántica"></video>' : ""}<small>Un detalle para nosotros</small></div>

    <div class="solapa"><span class="borde-solapa izq"></span><span class="borde-solapa der"></span></div>
    <div class="lacrado">♥</div>
  </div>
  <h2>${e[2]}</h2>
  <div class="destellos"></div>
  <p>${estado==="pendiente"?"¡Canje registrado! Pendiente de aprobación.":"¡Recompensa canjeada! Disfrutad vuestro momento."}</p>
  <button id="abrir-vale-canje">Abrir mi vale ❤️</button>
  <button id="cerrar-animacion">Continuar</button>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector("#abrir-vale-canje").onclick = () => {
    const paginas = {
      r1: "prueba-vale-besos.html",
      r2: "prueba-abrazo-para-dos.html",
      r3: "prueba-momento-relax.html",
      r4: "prueba-cena-especial.html",
      r5: "prueba-noche-de-peli.html",
      r6: "prueba-caja-misteriosa.html",
      r7: "prueba-vale-picante.html",
      r8: "prueba-premio-exclusivo.html"
    };
    const pagina = paginas[recompensa.id];
    if (pagina) window.location.href = "./" + pagina;
    else window.alert("Esta recompensa personalizada todavía no tiene un vale propio.");
  };
  modal.querySelector("#cerrar-animacion").onclick = () => modal.remove();
}
