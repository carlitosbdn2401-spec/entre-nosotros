export function crearEscena3D(id) {
  const permitidos = new Set(["r1","r2","r3","r4","r5","r6","r7","r8"]);
  const premio = permitidos.has(id) ? id : "r1";
  return `<img class="foto-premio" src="./imagenes/premios/${premio}.jpg" alt="Fotografía de la recompensa" loading="eager" onerror="this.style.display='none'">`;
}
