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
  modal.innerHTML = `
  <style>
  #animacion-canje{position:fixed;inset:0;z-index:99999;background:#160812ed;display:grid;place-items:center;padding:20px}
  #animacion-canje .tarjeta{background:linear-gradient(145deg,#6b2348,#24101f);color:#fff0f6;text-align:center;padding:30px 20px;border-radius:25px;border:2px solid #e9a5c7;max-width:330px;width:100%;box-shadow:0 0 40px #ff69b477;animation:entrada .6s ease}
  #animacion-canje .icono{font-size:75px;animation:flotar 1.5s infinite}
  #animacion-canje .destellos{font-size:30px;margin:18px}
  #animacion-canje button{background:#f5b5d2;color:#42142d;border:0;border-radius:20px;padding:12px 25px;font-weight:bold}
  @keyframes entrada{from{transform:scale(.3) rotate(-8deg);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes flotar{50%{transform:translateY(-10px) scale(1.08)}}
  
  #animacion-canje .sobre{position:relative;width:230px;height:145px;margin:25px auto 15px;background:linear-gradient(145deg,#f7c5dc,#b64c80);border-radius:8px;box-shadow:0 8px 25px #ff75b855;perspective:500px}
  #animacion-canje .solapa{position:absolute;z-index:3;inset:0;background:#fce1ed;clip-path:polygon(0 0,100% 0,50% 65%);transform-origin:top;animation:abrir-sobre .9s .4s forwards}
  #animacion-canje .revelacion{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:salir-sobre 1s 1s both}
  #animacion-canje .revelacion .icono{font-size:65px}
  #animacion-canje .extra-cena,#animacion-canje .extra-masaje,#animacion-canje .extra-besos,#animacion-canje .extra-abrazo,#animacion-canje .extra-pelicula,#animacion-canje .extra-rosa,#animacion-canje .extra-pasion,#animacion-canje .extra-premio{font-size:27px;line-height:1.8;animation:salir-sobre 1.2s 1.2s both;filter:drop-shadow(0 0 8px #ffd66b)}
  #animacion-canje .brillo{font-size:25px;filter:drop-shadow(0 0 8px #ffd66b);animation:destello 1s infinite alternate}
  @keyframes abrir-sobre{to{transform:rotateX(180deg);z-index:0}}
  @keyframes salir-sobre{from{transform:translateY(45px) scale(.35);opacity:0}to{transform:translateY(-18px) scale(1);opacity:1}}
  @keyframes destello{to{filter:drop-shadow(0 0 15px #ffd66b);transform:scale(1.12)}}
</style>
  <div class="tarjeta">
  <div>✨ UNA RECOMPENSA PARA VOSOTROS ✨</div>
  <div class="sobre"><div class="solapa"></div><div class="revelacion"><div class="icono">${e[0]}</div><div class="brillo">${e[1]} ✨ 💖</div>${escenaExtra}</div></div>
  <h2>${e[2]}</h2>
  <div class="destellos">${e[1]} ✨ 💖</div>
  <p>${estado==="pendiente"?"¡Canje registrado! Pendiente de aprobación.":"¡Recompensa canjeada! Disfrutad vuestro momento."}</p>
  <button id="cerrar-animacion">Continuar ❤️</button>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector("#cerrar-animacion").onclick = () => modal.remove();
}
