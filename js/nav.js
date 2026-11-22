const MODS=[
['inicio','Inicio'],['detencion','Detención'],['deterioro','Deterioro'],['viento','Oscilaciones'],['sensores','Sensores'],['historial','Historial']
];
const nav=document.getElementById('nav'),cards=document.getElementById('cards');
MODS.forEach(([id,n])=>{const b=document.createElement('button');b.textContent=n;b.dataset.p=id;b.onclick=()=>go(id);nav.appendChild(b)});
[['detencion','Detención de emergencia','Tiempo, distancia de frenado, RK2/RK4 e integración.'],['deterioro','Deterioro mecánico','Sistemas lineales SPD y umbral de inspección por raíces.'],['viento','Oscilaciones por viento','Respuesta de cabina a fuerza, amortiguamiento e integración.'],['sensores','Reconstrucción de sensores','Interpolación con puntos ocultados, ruido y efecto Runge.']].forEach(([id,t,d],i)=>{
const b=document.createElement('button');b.className='card';b.innerHTML=`<em class="num">0${i+1}</em><b>${t}</b><span>${d}</span><span class="st">Módulo activo · 3 escenarios</span>`;b.onclick=()=>go(id);cards.appendChild(b)});
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});
function go(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===id));nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.p===id));if(id==='historial')renderHist();scrollTo(0,0);try{history.replaceState(null,'','#'+id)}catch(e){}}

const f=v=>v===0?'0':!isFinite(v)?'∞':Math.abs(v)<1e-3||Math.abs(v)>=1e5?v.toExponential(2):v.toFixed(4);
