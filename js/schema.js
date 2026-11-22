/* Copia de db/schema.sql para crear la base SQLite en el navegador. Mantener ambos archivos iguales. */
const SCHEMA_SQL = `-- Modelo relacional base para SIMTELE-RISK

CREATE TABLE caso_estudio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(120) NOT NULL,
  modelo_version VARCHAR(40) NOT NULL
);

CREATE TABLE escenario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caso_id INTEGER NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('NORMAL', 'ESTRES', 'MAL_CONDICIONADO')),
  parametros_json TEXT NOT NULL,
  fuente_datos VARCHAR(200) NOT NULL,
  FOREIGN KEY (caso_id) REFERENCES caso_estudio(id)
);

CREATE TABLE simulacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  escenario_id INTEGER NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_equipo VARCHAR(150),
  estado VARCHAR(30) NOT NULL,
  FOREIGN KEY (escenario_id) REFERENCES escenario(id)
);

CREATE TABLE ejecucion_metodo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  simulacion_id INTEGER NOT NULL,
  metodo VARCHAR(80) NOT NULL,
  tolerancia REAL,
  paso REAL,
  max_iter INTEGER,
  convergio BOOLEAN NOT NULL,
  tiempo_ms REAL,
  FOREIGN KEY (simulacion_id) REFERENCES simulacion(id)
);

CREATE TABLE iteracion_resultado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ejecucion_id INTEGER NOT NULL,
  numero INTEGER NOT NULL,
  aproximacion_json TEXT NOT NULL,
  residual REAL,
  error_abs REAL,
  error_rel REAL,
  FOREIGN KEY (ejecucion_id) REFERENCES ejecucion_metodo(id)
);

CREATE TABLE resultado_resumen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ejecucion_id INTEGER NOT NULL,
  referencia_json TEXT,
  valor_json TEXT NOT NULL,
  metrica_error_json TEXT NOT NULL,
  interpretacion TEXT,
  FOREIGN KEY (ejecucion_id) REFERENCES ejecucion_metodo(id)
);

-- Registros iniciales de los cuatro casos de estudio
INSERT INTO caso_estudio (nombre, modelo_version) VALUES
  ('Detención de emergencia de cabinas', '1.0'),
  ('Deterioro mecánico y mantenimiento', '1.0'),
  ('Oscilaciones por viento', '1.0'),
  ('Reconstrucción de señales de sensores', '1.0');`;
