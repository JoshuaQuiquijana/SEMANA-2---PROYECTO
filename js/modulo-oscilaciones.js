/* Módulo 3: Oscilaciones */
const SC_VIE={
  NORMAL:{n:'Normal',d:'Vibración libre subamortiguada (m=1000, c=500, k=2000, F₀=0, h=0,05).',p:{m:1000,c:500,k:2000,f0:0,h:0.05,n:80,sub:40}},
  ESTRES:{n:'Estrés',d:'Fuerza externa F₀=400 N y menor amortiguamiento c=150, h=0,1.',p:{m:1000,c:150,k:2000,f0:400,h:0.1,n:80,sub:40}},
  MAL:{n:'Mal condicionado',d:'Amortiguamiento muy bajo (c=5) con alta sensibilidad de oscilación.',p:{m:1000,c:5,k:2000,f0:200,h:0.05,n:100,sub:50}}
};
let curVie='NORMAL';const segVie=document.getElementById('segVie');
Object.entries(SC_VIE).forEach(([k,v])=>{const b=document.createElement('button');b.textContent=v.n;b.onclick=()=>{curVie=k;markVie();const p=v.p;document.getElementById('vieM').value=p.m;document.getElementById('vieC').value=p.c;document.getElementById('vieK').value=p.k;document.getElementById('vieF').value=p.f0;document.getElementById('vieH').value=p.h;document.getElementById('vieN').value=p.n;document.getElementById('vieSub').value=p.sub};segVie.appendChild(b)});
function markVie(){segVie.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',Object.keys(SC_VIE)[i]===curVie));document.getElementById('scdVie').textContent=SC_VIE[curVie].d}

let lastVie=null;
function runVie(){
  const m=parseFloat(document.getElementById('vieM').value),c=parseFloat(document.getElementById('vieC').value),k=parseFloat(document.getElementById('vieK').value),f0=parseFloat(document.getElementById('vieF').value),h=parseFloat(document.getElementById('vieH').value),pasos=Math.max(1,parseInt(document.getElementById('vieN').value)||80),sub=Math.max(2,parseInt(document.getElementById('vieSub').value)||40);
  if(!(m>0)||!(k>0)||!(h>0)){document.getElementById('outVie').innerHTML='<div class="no">Ingresa m > 0, k > 0 y h > 0.</div>';return;}
  const w0=Math.sqrt(k/m),zeta=c/(2*Math.sqrt(m*k));
  const deriv=(t,Y)=>[Y[1],(f0*Math.cos(w0*t)-c*Y[1]-k*Y[0])/m];
  const r2=rk2(deriv,0,[1,0],h,pasos),r4=rk4(deriv,0,[1,0],h,pasos);
  const tFin=pasos*h;
  const x4Fn=t=>{const idx=Math.min(r4.length-1,Math.max(0,Math.round(t/h)));return r4[idx].Y[0];};
  const iTrap=trapecioCompuesto(t=>Math.pow(x4Fn(t),2),0,tFin,sub);
  const iSimp=simpson13Compuesto(t=>Math.pow(x4Fn(t),2),0,tFin,sub);
  const iRom=romberg(t=>Math.pow(x4Fn(t),2),0,tFin,4).valor;
  const diffFin=Math.abs(r4[r4.length-1].Y[0]-r2[r2.length-1].Y[0]);

  const W=640,H=190,P=44;
  const ys2=r2.map(p=>p.Y[0]),ys4=r4.map(p=>p.Y[0]),allY=[...ys2,...ys4];
  const yMin=Math.min(...allY),yMax=Math.max(...allY),span=Math.max(1e-6,yMax-yMin);
  const Xe=i=>P+(W-P-10)*i/Math.max(1,r2.length-1),Ye=v=>10+(H-30)*(1-(v-yMin)/span);
  const p2=ys2.map((v,i)=>`${Xe(i)},${Ye(v)}`).join(' '),p4=ys4.map((v,i)=>`${Xe(i)},${Ye(v)}`).join(' ');
  const y0=Ye(0);
  const valsI=[iTrap,iSimp,iRom],mI=Math.max(...valsI,1e-9);
  const barsI=valsI.map((val,i)=>{const bh=((H-45)*val)/mI;const x=P+i*140;const y=H-25-bh;return `<rect x="${x}" y="${y}" width="85" height="${Math.max(2,bh)}" fill="${['var(--c1)','var(--c2)','var(--c3)'][i]}"/><text x="${x}" y="${H-8}">${['Trapecio','Simpson','Romberg'][i]} (${f(val)})</text>`}).join('');

  document.getElementById('outVie').innerHTML=`
    <p>ω₀ = <b>${f(w0)} rad/s</b> · ζ = <b>${f(zeta)}</b> · t_final = <b>${f(tFin)} s</b> · |x_RK4 − x_RK2| final = <b>${f(diffFin)} m</b>.</p>
    <div class="wrap"><table><tr><th>Método / Magnitud</th><th>Resultado</th><th>Observación</th></tr>
      <tr><td>RK2 final x(t_fin)</td><td>${f(r2[r2.length-1].Y[0])} m</td><td>Orden O(h²)</td></tr>
      <tr><td>RK4 final x(t_fin)</td><td>${f(r4[r4.length-1].Y[0])} m</td><td>Orden O(h⁴)</td></tr>
      <tr><td>Trapecio ∫x(t)²dt</td><td>${f(iTrap)}</td><td>Subintervalos: ${sub}</td></tr>
      <tr><td>Simpson 1/3 ∫x(t)²dt</td><td>${f(iSimp)}</td><td>Subintervalos pares</td></tr>
      <tr><td>Romberg ∫x(t)²dt</td><td>${f(iRom)}</td><td>Extrapolación Richardson</td></tr>
    </table></div>
    <div class="two" style="margin-top:12px">
      <div class="panel"><h3>Gráfico 1 · Desplazamiento x(t): RK2 vs RK4</h3><div class="leg"><span><i style="background:var(--c1)"></i>RK2</span><span><i style="background:var(--c2)"></i>RK4</span></div><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${y0}" y2="${y0}" stroke="var(--line)"/><polyline fill="none" stroke-width="2" stroke="var(--c1)" points="${p2}"/><polyline fill="none" stroke-width="2" stroke="var(--c2)" points="${p4}"/><text x="${P}" y="${H-4}">0 → ${f(tFin)} s</text></svg></div>
      <div class="panel"><h3>Gráfico 2 · Energía integrada ∫x(t)²dt</h3><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${H-25}" y2="${H-25}" stroke="var(--line)"/>${barsI}</svg></div>
    </div>
    <div class="two"><div class="panel"><h3>Conclusión numérica</h3><p>RK4 mantiene mayor precisión que RK2 cuando crece el paso h o hay fuerza externa; Romberg acelera la convergencia de la integral.</p></div><div class="panel"><h3>Conclusión del problema</h3><p>Con amortiguamiento ζ pequeño, las oscilaciones persisten más y son sensibles a cambios de parámetros. Modelo sintético educativo.</p></div></div>`;
  lastVie={sc:curVie,m,c,k,f0,h,pasos,sub};
}
document.getElementById('runVie').onclick=runVie;
