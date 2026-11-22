/* Raíces (Módulo 2) */
const SC_RAI={
  NORMAL:{n:'Normal',d:'Parámetros nominales (D₀=0.10, α=0.015, β=0.001, umbral=0.30).',p:{d0:0.10,alpha:0.015,beta:0.001,umbral:0.30,a:0,b:30,x0:5}},
  ESTRES:{n:'Estrés',d:'Crecimiento acelerado (α=0.04, β=0.003) con umbral 0.60.',p:{d0:0.10,alpha:0.04,beta:0.003,umbral:0.60,a:0,b:20,x0:4}},
  MAL:{n:'Mal condicionado',d:'Derivada pequeña o intervalo amplio [0, 50] con variación lenta.',p:{d0:0.299,alpha:0.0001,beta:0.00001,umbral:0.30,a:0,b:50,x0:1}}
};
let curRai='NORMAL';const segRai=document.getElementById('segRai');
Object.entries(SC_RAI).forEach(([k,v])=>{const b=document.createElement('button');b.textContent=v.n;b.onclick=()=>{curRai=k;markRai();const p=v.p;['d0','alpha','beta','dumbral','ra','rb','rx0'].forEach((id,i)=>document.getElementById(id).value=Object.values(p)[i])};segRai.appendChild(b)});
function markRai(){segRai.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',Object.keys(SC_RAI)[i]===curRai));document.getElementById('scdRai').textContent=SC_RAI[curRai].d}

let lastRaices=null;
document.getElementById('runRaices').onclick=()=>{
  const d0=parseFloat(document.getElementById('d0').value),alpha=parseFloat(document.getElementById('alpha').value),beta=parseFloat(document.getElementById('beta').value),umbral=parseFloat(document.getElementById('dumbral').value);
  const a=parseFloat(document.getElementById('ra').value),b=parseFloat(document.getElementById('rb').value),x0=parseFloat(document.getElementById('rx0').value);
  const tol=parseFloat(document.getElementById('tol').value)||1e-8,mx=parseInt(document.getElementById('mx').value)||500;
  const fDet=t=>d0+alpha*t+beta*t*t-umbral,dfDet=t=>alpha+2*beta*t;
  const ref=raizCuadraticaAnalitica(d0,alpha,beta,umbral);
  const mBis=biseccion(fDet,a,b,tol,mx),mNew=newtonRaphson(fDet,dfDet,x0,tol,mx),mSec=secante(fDet,Math.max(0,x0-1),x0+1,tol,mx);
  const lista=[['Bisección',mBis],['Newton-Raphson',mNew],['Secante',mSec]];
  const filas=lista.map(([nombre,resM])=>{
    const eAbs=(ref!==null&&isFinite(resM.raiz))?Math.abs(ref-resM.raiz):NaN;
    const eRel=(ref&&Math.abs(ref)>0&&isFinite(eAbs))?eAbs/Math.abs(ref):NaN;
    return `<tr><td>${nombre}</td><td>${isFinite(resM.raiz)?f(resM.raiz)+' meses':'—'}</td><td>${resM.it}</td><td class="${resM.conv?'ok':'no'}">${resM.conv?'sí':'no'}</td><td>${isFinite(resM.raiz)?f(Math.abs(fDet(resM.raiz))):'—'}</td><td>${isFinite(eAbs)?f(eAbs):'—'}</td><td>${isFinite(eRel)?f(eRel*100)+' %':'N/A'}</td></tr>`;
  }).join('');
  const bisErrs=mBis.hist.map(h=>h.errEst).filter(v=>v>0&&isFinite(v));
  const loR=bisErrs.length?Math.floor(Math.min(...bisErrs.map(Math.log10))):-6,hiR=bisErrs.length?Math.ceil(Math.max(...bisErrs.map(Math.log10))):1;
  const W=640,H=190,P=42;
  const Xr=k=>P+(W-P-10)*k/Math.max(1,bisErrs.length-1),Yr=v=>10+(H-30)*(hiR-v)/Math.max(1,hiR-loR);
  let gR='';for(let v=loR;v<=hiR;v++)gR+=`<line x1="${P}" x2="${W-10}" y1="${Yr(v)}" y2="${Yr(v)}" stroke="var(--line)"/><text x="4" y="${Yr(v)+4}">1e${v}</text>`;
  const polyBis=bisErrs.map((v,k)=>`${Xr(k)},${Yr(Math.max(loR,Math.min(hiR,Math.log10(v))))}`).join(' ');
  const barsIt=lista.map(([n,m],i)=>{const bh=((H-45)*(m.it||1))/Math.max(1,...lista.map(([,x])=>x.it||1));const x=P+i*140;const y=H-25-bh;return `<rect x="${x}" y="${y}" width="85" height="${Math.max(2,bh)}" fill="${['var(--c1)','var(--c2)','var(--c3)'][i]}"/><text x="${x}" y="${H-8}">${n.split('-')[0]} (${m.it})</text>`}).join('');
  const numR=`${lista.map(([n,m])=>`${n}: ${m.conv?m.it+' iter.':'sin conv.'}`).join(' · ')}. Newton y Secante convergen rápido cuando f'(t) no es nula; Bisección es robusta si existe cambio de signo en [a,b].`;
  const probR=ref!==null?`El umbral D_umbral=${f(umbral)} se alcanza en ~${f(ref)} meses bajo parámetros sintéticos.`:`No existe raíz real t ≥ 0 para estos parámetros sintéticos.`;
  document.getElementById('outRaices').innerHTML=`
    <p>Referencia analítica (raíz ≥ 0): <b>${ref!==null?f(ref)+' meses':'No existe raíz real ≥ 0'}</b>.</p>
    <div class="wrap"><table><tr><th>Método</th><th>t_umbral</th><th>Iter.</th><th>Conv.</th><th>|f(t)|</th><th>Error abs.</th><th>Error %</th></tr>${filas}</table></div>
    <div class="two" style="margin-top:12px">
      <div class="panel"><h3>Gráfico 1 · Error estimado Bisección (log₁₀)</h3><svg viewBox="0 0 ${W} ${H}">${gR}<polyline fill="none" stroke-width="2" stroke="var(--c1)" points="${polyBis}"/><text x="${P}" y="${H-4}">iteración 1 → ${Math.max(1,bisErrs.length)}</text></svg></div>
      <div class="panel"><h3>Gráfico 2 · Iteraciones por método</h3><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${H-25}" y2="${H-25}" stroke="var(--line)"/>${barsIt}</svg></div>
    </div>
    <div class="two"><div class="panel"><h3>Conclusión numérica</h3><p>${numR}</p></div><div class="panel"><h3>Conclusión del problema</h3><p>${probR}</p></div></div>`;
  lastRaices={sc:curRai,d0,alpha,beta,umbral,a,b,x0,tol,mx};
};
