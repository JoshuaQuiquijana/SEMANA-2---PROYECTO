/* Escenarios Sistemas Lineales (Módulo 2) */
const SC={
  NORMAL:{n:'Normal',d:'Matriz tridiagonal 4×4 (diagonal 4, vecinos −1), SPD y diagonalmente dominante.',build:()=>tri(4,4)},
  ESTRES:{n:'Estrés',d:'Matriz tridiagonal 10×10 con diagonal 2,2: más datos y convergencia lenta.',build:()=>tri(10,2.2)},
  MAL:{n:'Mal condicionado',d:'Matriz de Hilbert 5×5, SPD pero con κ muy alto y sin dominancia diagonal. Experimento numérico, no fallo físico.',build:()=>{const n=5;return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>1/(i+j+1)))}}
};
function tri(n,d){return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?d:Math.abs(i-j)===1?-1:0))}
let cur='NORMAL';const seg=document.getElementById('seg');
Object.entries(SC).forEach(([k,v])=>{const b=document.createElement('button');b.textContent=v.n;b.dataset.k=k;b.onclick=()=>{cur=k;mark()};seg.appendChild(b)});
function mark(){seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.k===cur));document.getElementById('scd').textContent=SC[cur].d}

let last=null;
function run(){
  const msg=document.getElementById('msg');msg.textContent='';
  const tol=parseFloat(document.getElementById('tol').value),mx=parseInt(document.getElementById('mx').value);
  if(!(tol>0&&tol<1)){msg.textContent='La tolerancia debe estar entre 0 y 1 (por ejemplo 1e-8).';return}
  if(!(mx>=1&&mx<=5000)){msg.textContent='Las iteraciones máximas deben estar entre 1 y 5000.';return}
  const A=SC[cur].build(),n=A.length,xs=Array.from({length:n},(_,i)=>i+1),b=mv(A,xs),k=cond(A);
  const ref=chol(A,b);if(!ref){msg.textContent='La matriz no es definida positiva; el gradiente conjugado estándar no aplica.';return}
  const R=[['Jacobi',jacobi(A,b,tol,mx)],['Gauss-Seidel',gs(A,b,tol,mx)],['Gradiente conjugado',cg(A,b,tol,mx)]];
  const L=lu(A,b);R.splice(2,0,['LU (pivoteo)',{x:L,h:[],c:true,direct:1}]);R.push(['Cholesky (referencia)',{x:ref,h:[],c:true,direct:1}]);
  const rows=R.map(([m,r])=>{const e=sub(r.x,xs),ea=Math.max(...e.map(Math.abs)),er=n2(e)/n2(xs);return{m,it:r.direct?'directo':r.h.length,c:r.c,r:res(A,r.x,b),ea,er,ep:er*100,h:r.h}});
  const db=b.map((v,i)=>v*0.001*Math.sin(i+1)),xp=lu(A,b.map((v,i)=>v+db[i])),sens=(n2(sub(xp,xs))/n2(xs))/(n2(db)/n2(b));
  last={sc:cur,tol,mx,k,sens,rows,n};render(last);
  last.params={tipo:'lineal',sc:cur,tol,mx};
  last.metodos=rows.map(r=>({metodo:r.m,tol,max:mx,conv:r.c,iter:r.h.map(v=>({res:v})),valor:r.ea,err:{abs:r.ea,rel:r.er,pct:r.ep,residuo:r.r}}));
  return last;
}
function render(o){
  const out=document.getElementById('out'),fail=o.rows.filter(r=>!r.c);
  const tb=o.rows.map(r=>`<tr><td>${r.m}</td><td>${r.it}</td><td class="${r.c?'ok':'no'}">${r.c?'sí':'no'}</td><td>${f(r.r)}</td><td>${f(r.ea)}</td><td>${f(r.er)}</td><td>${f(r.ep)} %</td></tr>`).join('');
  const cols=['var(--c1)','var(--c2)','var(--c3)'],it=o.rows.filter(r=>r.h.length);
  const all=it.flatMap(r=>r.h).filter(v=>v>0&&isFinite(v)).map(Math.log10),lo=Math.floor(Math.min(...all)),hi=Math.ceil(Math.max(...all)),mxk=Math.max(...it.map(r=>r.h.length)),W=640,H=210,P=42;
  const X=k=>P+(W-P-10)*k/Math.max(1,mxk-1),Y=v=>10+(H-30)*(hi-v)/Math.max(1,hi-lo);
  let g='';for(let v=lo;v<=hi;v++)g+=`<line x1="${P}" x2="${W-10}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="4" y="${Y(v)+4}">1e${v}</text>`;
  const paths=it.map((r,i)=>`<polyline fill="none" stroke-width="2" stroke="${cols[i]}" points="${r.h.map((v,k)=>isFinite(v)&&v>0?X(k)+','+Y(Math.max(lo,Math.min(hi,Math.log10(v)))):'').filter(Boolean).join(' ')}"/>`).join('');
  const names=it.map((r,i)=>`<span><i style="background:${cols[i]}"></i>${r.m}</span>`).join('');
  const vMaxE=Math.max(...o.rows.map(r=>r.ea).filter(isFinite),1e-12);
  const barsE=o.rows.map((r,i)=>{const bh=((H-45)*r.ea)/vMaxE;const x=P+i*115;const y=H-25-bh;return `<rect x="${x}" y="${y}" width="80" height="${Math.max(2,bh)}" fill="${cols[i%3]}"/><text x="${x}" y="${H-8}">${r.m.split(' ')[0]} (${f(r.ea)})</text>`}).join('');
  const spd=o.k>1e4;
  const num=`${fail.length?`No convergieron en ${o.mx} iteraciones: ${fail.map(r=>r.m).join(', ')}. Esto es un fallo de convergencia del método iterativo, distinto del mal condicionamiento de la matriz. `:'Todos los métodos iterativos alcanzaron la tolerancia. '}Los métodos directos (LU y Cholesky) dan residuo y error cercanos a la precisión de máquina cuando κ es moderado. ${spd?`Con κ∞ ≈ ${f(o.k)}, un residuo pequeño no garantiza un error pequeño en x.`:`Con κ∞ ≈ ${f(o.k)} el problema está bien condicionado.`}`;
  const prob=`Si estos sistemas calibran α y β del modelo D(t), una perturbación del 0,1 % en los datos se amplificó ${f(o.sens)} veces en la solución. ${o.sens>20?'Con esa sensibilidad, el instante estimado de inspección sería poco confiable.':'Las estimaciones de α, β y del umbral son estables ante pequeñas perturbaciones.'} Datos sintéticos sin conexión con fallas reales.`;
  o.interp=num+' | '+prob;out.innerHTML=`<div class="panel"><h3>Resultados · ${SC[o.sc].n}</h3><p>Matriz ${o.n}×${o.n}, κ∞(A) = ${f(o.k)}. Amplificación de perturbación del 0,1 %: ${f(o.sens)}.</p><div class="wrap"><table><tr><th>Método</th><th>Iteraciones</th><th>Convergió</th><th>Residuo ‖r‖₂</th><th>Error abs. (máx)</th><th>Error relativo</th><th>Error %</th></tr>${tb}</table></div></div>
  <div class="two">
    <div class="panel"><h3>Gráfico 1 · Convergencia del residuo</h3><div class="leg">${names}</div><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${H-20}" y2="${H-20}" stroke="var(--line)"/>${g}${paths}<text x="${P}" y="${H-4}">iteración 1 → ${mxk}</text></svg></div>
    <div class="panel"><h3>Gráfico 2 · Error absoluto por método</h3><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${H-25}" y2="${H-25}" stroke="var(--line)"/>${barsE}</svg></div>
  </div>
  <div class="two"><div class="panel"><h3>Conclusión numérica</h3><p>${num}</p></div><div class="panel"><h3>Conclusión del problema</h3><p>${prob}</p></div></div>`;
}
