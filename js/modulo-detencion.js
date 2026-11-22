/* Módulo 1: Detención */
const SC_DET={
  NORMAL:{n:'Normal',d:'v₀=12 m/s, a=1,5 m/s², tᵣ=1,0 s, h=0,1 s.',p:{v0:12,a:1.5,tr:1.0,h:0.1,sub:20}},
  ESTRES:{n:'Estrés',d:'v₀=18 m/s, a=1,0 m/s², tᵣ=1,5 s, h=0,25 s.',p:{v0:18,a:1.0,tr:1.5,h:0.25,sub:20}},
  MAL:{n:'Mal condicionado',d:'Desaceleración muy pequeña (a=0,05 m/s²): t_det se vuelve muy sensible.',p:{v0:12,a:0.05,tr:1.0,h:0.2,sub:20}}
};
let curDet='NORMAL';const segDet=document.getElementById('segDet');
Object.entries(SC_DET).forEach(([k,v])=>{const b=document.createElement('button');b.textContent=v.n;b.onclick=()=>{curDet=k;markDet();const p=v.p;document.getElementById('detV0').value=p.v0;document.getElementById('detA').value=p.a;document.getElementById('detTr').value=p.tr;document.getElementById('detH').value=p.h;document.getElementById('detSub').value=p.sub};segDet.appendChild(b)});
function markDet(){segDet.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',Object.keys(SC_DET)[i]===curDet));document.getElementById('scdDet').textContent=SC_DET[curDet].d}

let lastDet=null;
function runDet(){
  const v0=parseFloat(document.getElementById('detV0').value),a=parseFloat(document.getElementById('detA').value),tr=parseFloat(document.getElementById('detTr').value),h=parseFloat(document.getElementById('detH').value),sub=Math.max(2,parseInt(document.getElementById('detSub').value)||20);
  if(!(v0>0)||!(a>0)||!(h>0)){document.getElementById('outDet').innerHTML='<div class="no">Ingresa v₀ > 0, a > 0 y h > 0.</div>';return;}
  const tDet=v0/a,dFren=(v0*v0)/(2*a),dReac=v0*tr,dTot=dReac+dFren;
  const pasos=Math.max(1,Math.min(2000,Math.ceil(tDet/h))),hEf=tDet/pasos;
  const deriv=(t,Y)=>[Y[1],-a];
  const r2=rk2(deriv,0,[0,v0],hEf,pasos),r4=rk4(deriv,0,[0,v0],hEf,pasos);
  const vExact=t=>v0-a*t;
  const iTrap=trapecioCompuesto(vExact,0,tDet,sub),iSimp=simpson13Compuesto(vExact,0,tDet,sub),iRom=romberg(vExact,0,tDet,4).valor;
  const x2Fin=r2[r2.length-1].Y[0],x4Fin=r4[r4.length-1].Y[0];
  const e2=Math.abs(dFren-x2Fin),e4=Math.abs(dFren-x4Fin);

  const W=640,H=190,P=44;
  const ys2=r2.map(p=>p.Y[0]),ys4=r4.map(p=>p.Y[0]),yMax=Math.max(...ys2,...ys4,dFren,1);
  const Xe=i=>P+(W-P-10)*i/Math.max(1,r2.length-1),Ye=v=>10+(H-30)*(1-v/yMax);
  const p2=ys2.map((v,i)=>`${Xe(i)},${Ye(v)}`).join(' '),p4=ys4.map((v,i)=>`${Xe(i)},${Ye(v)}`).join(' ');
  const errsInt=[Math.abs(dFren-iTrap),Math.abs(dFren-iSimp),Math.abs(dFren-iRom)];
  const mIntMax=Math.max(...errsInt,1e-12);
  const barsI=errsInt.map((er,i)=>{const bh=((H-45)*er)/mIntMax;const x=P+i*140;const y=H-25-bh;return `<rect x="${x}" y="${y}" width="85" height="${Math.max(2,bh)}" fill="${['var(--c1)','var(--c2)','var(--c3)'][i]}"/><text x="${x}" y="${H-8}">${['Trapecio','Simpson','Romberg'][i]} (${f(er)})</text>`}).join('');

  document.getElementById('outDet').innerHTML=`
    <p>Analítico: t_det = <b>${f(tDet)} s</b> · d_frenado = <b>${f(dFren)} m</b> · d_reacción = <b>${f(dReac)} m</b> · d_total = <b>${f(dTot)} m</b>.</p>
    <div class="wrap"><table><tr><th>Método</th><th>Valor aprox.</th><th>Error abs. vs ref.</th></tr>
      <tr><td>RK2 (Heun) x(t_det)</td><td>${f(x2Fin)} m</td><td>${f(e2)}</td></tr>
      <tr><td>RK4 x(t_det)</td><td>${f(x4Fin)} m</td><td>${f(e4)}</td></tr>
      <tr><td>Trapecio ∫v(t)dt</td><td>${f(iTrap)} m</td><td>${f(errsInt[0])}</td></tr>
      <tr><td>Simpson 1/3 ∫v(t)dt</td><td>${f(iSimp)} m</td><td>${f(errsInt[1])}</td></tr>
      <tr><td>Romberg ∫v(t)dt</td><td>${f(iRom)} m</td><td>${f(errsInt[2])}</td></tr>
    </table></div>
    <div class="two" style="margin-top:12px">
      <div class="panel"><h3>Gráfico 1 · Posición de frenado x(t)</h3><div class="leg"><span><i style="background:var(--c1)"></i>RK2</span><span><i style="background:var(--c2)"></i>RK4</span></div><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${H-20}" y2="${H-20}" stroke="var(--line)"/><polyline fill="none" stroke-width="2" stroke="var(--c1)" points="${p2}"/><polyline fill="none" stroke-width="2" stroke="var(--c2)" points="${p4}"/><text x="${P}" y="${H-4}">0 → ${f(tDet)} s</text></svg></div>
      <div class="panel"><h3>Gráfico 2 · Error de integración ∫v(t)dt</h3><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${H-25}" y2="${H-25}" stroke="var(--line)"/>${barsI}</svg></div>
    </div>
    <div class="two"><div class="panel"><h3>Conclusión numérica</h3><p>RK4 y Romberg alcanzan mayor precisión que RK2 y Trapecio para el mismo refinamiento. Con desaceleraciones muy pequeñas, la división t_det = v₀/a amplifica errores.</p></div><div class="panel"><h3>Conclusión del problema</h3><p>El tiempo de reacción tᵣ aporta una distancia adicional v₀·tᵣ antes de iniciar el frenado. Modelo sintético y simplificado, sin sistemas reales de seguridad.</p></div></div>`;
  lastDet={sc:curDet,v0,a,tr,h,sub};
}
document.getElementById('runDet').onclick=runDet;
