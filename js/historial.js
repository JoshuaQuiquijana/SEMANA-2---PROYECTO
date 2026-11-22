/* Historial de experimentos: guardar, listar, relanzar y eliminar usando SQLite (db.js) */
let toastT;
function aviso(txt) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = txt; t.style.display = 'block';
  clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', 8000);
}

function guardar(o) {
  if (!o || !o.metodos) return;
  if (!DB) { aviso('La base de datos no está disponible (no se pudo cargar sql.js desde cdnjs). Revisa la conexión.'); return; }
  try { guardarSimulacion(o); aviso('Experimento guardado en la base de datos SQLite.'); }
  catch (e) { aviso('No se pudo guardar: ' + e.message); }
}
document.getElementById('run').onclick = run;
document.getElementById('save').onclick = () => { last = null; run(); guardar(last); };
document.getElementById('saveDet').onclick = () => { lastDet = null; runDet(); guardar(lastDet); };
document.getElementById('saveVie').onclick = () => { lastVie = null; runVie(); guardar(lastVie); };
document.getElementById('saveSen').onclick = () => { lastInterp = null; runInterp(); guardar(lastInterp); };
document.getElementById('saveRai').onclick = () => { lastRaices = null; document.getElementById('runRaices').click(); guardar(lastRaices); };
document.getElementById('dlDb').onclick = () => {
  if (!DB) { aviso('La base de datos no está disponible.'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([DB.export()], {type: 'application/octet-stream'}));
  a.download = 'simtele-risk.db'; a.click(); URL.revokeObjectURL(a.href);
};

const TITULO = {det: 'Detención', lineal: 'Deterioro · sistemas lineales', raices: 'Deterioro · raíces', vie: 'Oscilaciones', sen: 'Sensores'};
const NOM_ESC = {NORMAL: 'Normal', ESTRES: 'Estrés', MAL: 'Mal condicionado'};

function comparar(simId, nuevos) {
  const guardados = valoresGuardados(simId);
  let n = 0, mal = [];
  nuevos.forEach(m => {
    if (!(m.metodo in guardados)) return;
    n++;
    const a = guardados[m.metodo], b = m.valor, fa = Number.isFinite(a), fb = Number.isFinite(b);
    if (!((!fa && !fb) || (fa && fb && Math.abs(a - b) <= 1e-9 * (1 + Math.abs(a))))) mal.push(m.metodo);
  });
  aviso(mal.length ? 'Atención: difieren de lo guardado: ' + mal.join(', ') + '.'
                   : `Experimento recuperado y repetido: los ${n} resultados coinciden con los guardados (tolerancia 1e-9).`);
}

function relanzar(e) {
  const p = e.params, v = (id, x) => document.getElementById(id).value = x;
  let o = null;
  if (p.tipo === 'det') {
    go('detencion'); curDet = p.sc; markDet();
    v('detV0', p.v0); v('detA', p.a); v('detTr', p.tr); v('detH', p.h); v('detSub', p.sub);
    lastDet = null; runDet(); o = lastDet;
  } else if (p.tipo === 'vie') {
    go('viento'); curVie = p.sc; markVie();
    v('vieM', p.m); v('vieC', p.c); v('vieK', p.k); v('vieF', p.f0); v('vieH', p.h); v('vieN', p.pasos); v('vieSub', p.sub);
    lastVie = null; runVie(); o = lastVie;
  } else if (p.tipo === 'sen') {
    go('sensores'); curSen = p.sc; markSen();
    v('intSen', p.sen); v('intN', p.n); v('intA', p.a); v('intB', p.b); v('intNoise', p.noise);
    lastInterp = null; runInterp(); o = lastInterp;
  } else if (p.tipo === 'raices') {
    go('deterioro'); curRai = p.sc; markRai();
    v('d0', p.d0); v('alpha', p.alpha); v('beta', p.beta); v('dumbral', p.umbral); v('ra', p.a); v('rb', p.b); v('rx0', p.x0);
    v('tol', p.tol); v('mx', p.mx);
    lastRaices = null; document.getElementById('runRaices').click(); o = lastRaices;
  } else {
    go('deterioro'); cur = p.sc; mark(); v('tol', p.tol); v('mx', p.mx);
    last = null; run(); o = last;
  }
  if (o) comparar(e.id, o.metodos);
}

function renderHist() {
  const h = document.getElementById('hist');
  if (!DB) { h.innerHTML = '<p>La base de datos SQLite no se pudo cargar. Se necesita conexión para descargar sql.js desde cdnjs.</p>'; return; }
  const a = listarSimulaciones();
  h.innerHTML = a.length ? '' : '<p>Aún no hay experimentos guardados. Ejecuta y guarda uno desde cualquier módulo.</p>';
  a.forEach(e => {
    const d = document.createElement('div'); d.className = 'hrow';
    const datos = Object.entries(e.params).filter(([k]) => !['tipo', 'sc'].includes(k)).map(([k, x]) => `${k}=${x}`).join(', ');
    d.innerHTML = `<span><b>${TITULO[e.params.tipo]} · ${NOM_ESC[e.params.sc]}</b> <small>(simulación #${e.id})</small><br><small>${datos}<br>${e.fecha} UTC · ${e.metodos} métodos guardados</small></span>
      <span><button>Relanzar</button> <button>Eliminar</button></span>`;
    const [rl, del] = d.querySelectorAll('button');
    rl.onclick = () => relanzar(e);
    del.onclick = () => { eliminarSimulacion(e.id); renderHist(); };
    h.appendChild(d);
  });
}

mark(); markRai(); markDet(); markVie(); markSen();
const h0 = location.hash.slice(1);
go(document.getElementById(h0) ? h0 : 'inicio');
