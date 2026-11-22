/* Base de datos SQLite en el navegador (sql.js).
   Usa las tablas de db/schema.sql y guarda el archivo .db en localStorage para que sobreviva a recargas. */
const DB_KEY = 'simtele-db';
const CASO_ID = {det: 1, lineal: 2, raices: 2, vie: 3, sen: 4};   // orden del INSERT en schema.sql
const TIPO_ESC = {NORMAL: 'NORMAL', ESTRES: 'ESTRES', MAL: 'MAL_CONDICIONADO'};
let DB = null;

const aB64 = u8 => { let s = ''; u8.forEach(b => s += String.fromCharCode(b)); return btoa(s); };
const deB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const num = v => Number.isFinite(v) ? v : null;
const json = v => JSON.stringify(v, (k, x) => typeof x === 'number' && !Number.isFinite(x) ? null : x);

function consulta(sql, p = []) {
  const st = DB.prepare(sql), filas = [];
  st.bind(p);
  while (st.step()) filas.push(st.getAsObject());
  st.free();
  return filas;
}
const ultimoId = () => consulta('SELECT last_insert_rowid() AS id')[0].id;

function persistir() {
  try { localStorage.setItem(DB_KEY, aB64(DB.export())); } catch (e) { console.warn('No se pudo persistir la base', e); }
}

async function initDB() {
  const SQL = await initSqlJs({locateFile: f => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/' + f});
  let datos = null;
  try { const s = localStorage.getItem(DB_KEY); if (s) datos = deB64(s); } catch (e) {}
  DB = datos ? new SQL.Database(datos) : new SQL.Database();
  if (!datos) { DB.exec(SCHEMA_SQL); persistir(); }
}

/* Guarda una simulación completa: escenario, simulación, métodos, iteraciones y resumen. */
function guardarSimulacion(o) {
  const p = o.params;
  DB.run('BEGIN');
  try {
    DB.run('INSERT INTO escenario (caso_id, tipo, parametros_json, fuente_datos) VALUES (?,?,?,?)',
      [CASO_ID[p.tipo], TIPO_ESC[p.sc], json(p), 'Datos sintéticos generados en la aplicación']);
    const esc = ultimoId();
    DB.run('INSERT INTO simulacion (escenario_id, usuario_equipo, estado) VALUES (?,?,?)', [esc, 'Equipo SIMTELE-RISK', 'COMPLETADA']);
    const sim = ultimoId();
    o.metodos.forEach(m => {
      DB.run('INSERT INTO ejecucion_metodo (simulacion_id, metodo, tolerancia, paso, max_iter, convergio, tiempo_ms) VALUES (?,?,?,?,?,?,?)',
        [sim, m.metodo, num(m.tol), num(m.paso), num(m.max), m.conv ? 1 : 0, null]);
      const ej = ultimoId();
      (m.iter || []).forEach((it, i) => DB.run(
        'INSERT INTO iteracion_resultado (ejecucion_id, numero, aproximacion_json, residual, error_abs, error_rel) VALUES (?,?,?,?,?,?)',
        [ej, i + 1, json(it.x === undefined ? null : it.x), num(it.res), num(it.ea), num(it.er)]));
      DB.run('INSERT INTO resultado_resumen (ejecucion_id, referencia_json, valor_json, metrica_error_json, interpretacion) VALUES (?,?,?,?,?)',
        [ej, json(m.ref === undefined ? null : m.ref), json(m.valor), json(m.err || {}), o.interp || null]);
    });
    DB.run('COMMIT');
  } catch (e) { DB.run('ROLLBACK'); throw e; }
  persistir();
}

function listarSimulaciones() {
  return consulta(`SELECT s.id, s.fecha, c.nombre AS caso, e.tipo, e.parametros_json AS pj,
      (SELECT COUNT(*) FROM ejecucion_metodo m WHERE m.simulacion_id = s.id) AS metodos
    FROM simulacion s JOIN escenario e ON e.id = s.escenario_id JOIN caso_estudio c ON c.id = e.caso_id
    ORDER BY s.id DESC`).map(r => ({...r, params: JSON.parse(r.pj)}));
}

/* Valor principal guardado de cada método, para comparar al repetir el cálculo. */
function valoresGuardados(simId) {
  const mapa = {};
  consulta(`SELECT m.metodo, r.valor_json FROM ejecucion_metodo m JOIN resultado_resumen r ON r.ejecucion_id = m.id
    WHERE m.simulacion_id = ?`, [simId]).forEach(r => mapa[r.metodo] = JSON.parse(r.valor_json));
  return mapa;
}

function eliminarSimulacion(id) {
  const esc = consulta('SELECT escenario_id AS e FROM simulacion WHERE id = ?', [id])[0];
  DB.run('BEGIN');
  DB.run('DELETE FROM resultado_resumen WHERE ejecucion_id IN (SELECT id FROM ejecucion_metodo WHERE simulacion_id = ?)', [id]);
  DB.run('DELETE FROM iteracion_resultado WHERE ejecucion_id IN (SELECT id FROM ejecucion_metodo WHERE simulacion_id = ?)', [id]);
  DB.run('DELETE FROM ejecucion_metodo WHERE simulacion_id = ?', [id]);
  DB.run('DELETE FROM simulacion WHERE id = ?', [id]);
  if (esc) DB.run('DELETE FROM escenario WHERE id = ?', [esc.e]);
  DB.run('COMMIT');
  persistir();
}

initDB().then(() => {
  const h = document.getElementById('historial');
  if (h && h.classList.contains('on')) renderHist();
}).catch(e => { DB = null; console.error('No se pudo iniciar SQLite', e); });
