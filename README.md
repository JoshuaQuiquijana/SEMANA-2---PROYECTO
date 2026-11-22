
# SIMTELE-RISK

Aplicación web para el proyecto integrador de Métodos Numéricos. Estudia cuatro situaciones hipotéticas de un sistema de transporte por cable inspirado en Mi Teleférico (La Paz, Bolivia) y compara distintos métodos numéricos en tres escenarios: normal, estrés y mal condicionado.

Los datos y parámetros son sintéticos y con fines educativos. El sistema no describe fallas reales de la empresa ni se conecta a equipos de control.

Universidad Mayor de San Andrés · Facultad de Ciencias Puras y Naturales · Carrera de Informática  
Docente: Lic. Brigida Alexandra Carvajal Blanco

## Integrantes

- Quiñones Rosales Brandon Mikael
- Choque Yujra Joel
- Rojas Ramos Miguel Angel
- Quiquijana Calle Joshua Ivan
- Arias Vargas Camila Sarahí

## Módulos

| Módulo | Qué estudia | Métodos que usa |
|---|---|---|
| Detención de emergencia | Tiempo y distancia de frenado según velocidad, reacción y desaceleración | RK2, RK4, trapecio, Simpson 1/3, Romberg |
| Deterioro mecánico | Momento en que un indicador de deterioro llega al umbral de inspección | Bisección, Newton-Raphson, secante, Jacobi, Gauss-Seidel, LU, gradiente conjugado, Cholesky |
| Oscilaciones por viento | Respuesta de una cabina ante fuerza externa y amortiguamiento | RK2, RK4, trapecio, Simpson 1/3, Romberg |
| Reconstrucción de sensores | Recuperación de datos faltantes y efecto del ruido | Lagrange, Newton (diferencias divididas), spline cúbico |

Cada módulo tiene los tres escenarios (normal, estrés y mal condicionado), una tabla de resultados con errores, dos gráficos y dos conclusiones: una sobre los métodos y otra sobre el problema.

## Estructura del proyecto

```
simtele-risk/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── nav.js                    navegación y formato de números
│   ├── schema.js                 copia de db/schema.sql para crear la base en el navegador
│   ├── db.js                     conexión SQLite (sql.js): guardar, listar y eliminar
│   ├── algebra.js                sistemas lineales y número de condición
│   ├── raices.js                 bisección, Newton-Raphson, secante
│   ├── edo.js                    Runge-Kutta de 2.º y 4.º orden
│   ├── integracion.js            trapecio, Simpson 1/3, Romberg
│   ├── interpolacion.js          Lagrange, Newton, spline cúbico
│   ├── modulo-deterioro.js       laboratorio de sistemas lineales
│   ├── modulo-raices.js          tiempo hasta el umbral de inspección
│   ├── modulo-detencion.js
│   ├── modulo-oscilaciones.js
│   ├── modulo-sensores.js
│   └── historial.js              historial: guardar, relanzar y comparar con lo guardado
├── db/
│   └── schema.sql                modelo relacional
└── docs/
    └── Entrega_Semana_1.docx
```

`js/schema.js` es una copia de `db/schema.sql`; si se modifica una tabla hay que actualizar ambos archivos.

Los archivos de `js/` son scripts clásicos que comparten el ámbito global, por eso el orden de carga en `index.html` importa y no debe modificarse.

## Ejecución

No necesita instalación ni dependencias. Basta con abrir `index.html` en el navegador. También se puede servir en local:

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000`.

## Prueba de guardado y recuperación

1. Entrar a cualquier módulo, elegir un escenario y ejecutar.
2. Pulsar "Guardar" (o "Guardar en historial").
3. Recargar la página y abrir la sección Historial.
4. Pulsar "Relanzar": se leen los parámetros desde la base, se repite el cálculo y la aplicación indica si los resultados coinciden con los guardados (tolerancia 1e-9).

## Base de datos

La aplicación usa SQLite en el navegador mediante [sql.js](https://github.com/sql-js/sql.js) (versión 1.8.0, cargada desde cdnjs, por lo que necesita conexión a internet). Al iniciar por primera vez se crean las tablas de `db/schema.sql`: `caso_estudio`, `escenario`, `simulacion`, `ejecucion_metodo`, `iteracion_resultado` y `resultado_resumen`, junto con los cuatro casos de estudio.

Cada vez que se guarda un experimento se escriben:

- `escenario`: tipo (NORMAL, ESTRES, MAL_CONDICIONADO) y parámetros en JSON.
- `simulacion`: fecha, equipo y estado.
- `ejecucion_metodo`: un registro por método, con tolerancia, paso, máximo de iteraciones y si convergió.
- `iteracion_resultado`: iteraciones con aproximación, residual y errores (donde el método es iterativo).
- `resultado_resumen`: valor obtenido, referencia, métricas de error e interpretación.

El archivo de la base se conserva en el `localStorage` del navegador entre recargas. Desde el Historial se puede descargar como `simtele-risk.db` y abrir con cualquier cliente de SQLite.

## Limitaciones

- La base vive en el navegador de cada equipo; no hay una base compartida ni servidor.
- Se necesita conexión a internet para cargar sql.js.
- Los métodos directos y de interpolación guardan un solo resultado por método; las iteraciones se registran solo en los métodos iterativos.
- Los resultados de oscilaciones se comparan entre RK2 y RK4; no se contrasta aún con la solución analítica subamortiguada.
- Los modelos son simplificados y usan parámetros supuestos.
