/* Módulo 4: Sensores / Interpolación */
const SC_SEN={
  NORMAL:{n:'Normal',d:'Señal limpia, 8 nodos equiespaciados en [0, 6], ruido η=0.',p:{sen:'sin',n:8,a:0,b:6,noise:0}},
  ESTRES:{n:'Estrés',d:'Ruido sintético η=0,05 y 6 nodos.',p:{sen:'sin',n:6,a:0,b:6,noise:0.05}},
  MAL:{n:'Mal condicionado',d:'16 nodos equiespaciados en [0, 8]: oscilación tipo Runge en polinomios globales.',p:{sen:'sin',n:16,a:0,b:8,noise:0.01}}
};
let curSen='NORMAL';const segSen=document.getElementById('segSen');
Object.entries(SC_SEN).forEach(([k,v])=>{const b=document.createElement('button');b.textContent=v.n;b.onclick=()=>{curSen=k;markSen();const p=v.p;document.getElementById('intSen').value=p.sen;document.getElementById('intN').value=p.n;document.getElementById('intA').value=p.a;document.getElementById('intB').value=p.b;document.getElementById('intNoise').value=p.noise};segSen.appendChild(b)});
function markSen(){segSen.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',Object.keys(SC_SEN)[i]===curSen));document.getElementById('scdSen').textContent=SC_SEN[curSen].d}

let lastInterp=null;
function runInterp(){
  const sen=document.getElementById('intSen').value,nTot=Math.max(5,Math.min(20,parseInt(document.getElementById('intN').value)||8)),a=parseFloat(document.getElementById('intA').value),b=parseFloat(document.getElementById('intB').value),noise=parseFloat(document.getElementById('intNoise').value)||0;
  if(!(b>a)){document.getElementById('outInterp').innerHTML='<div class="no">t_fin debe ser mayor que t_inicio.</div>';return;}
  const fn=sen==='exp'?t=>Math.exp(-t):t=>Math.sin(t);
  const allT=Array.from({length:nTot},(_,i)=>a+(b-a)*i/(nTot-1));
  const ocultosIdx=new Set([Math.floor(nTot/3),Math.floor(2*nTot/3)]);
  const xs=[],ys=[],testT=[],testRef=[];
  allT.forEach((t,idx)=>{
    const yReal=fn(t);
    if(ocultosIdx.has(idx)){testT.push(t);testRef.push(yReal);}
    else{xs.push(t);ys.push(yReal+(noise?noise*Math.sin(idx+1):0));}
  });
  const dd=tablaNewtonDD(xs,ys),sp=buildSplineNatural(xs,ys);
  const predLag=testT.map(t=>interpLagrange(xs,ys,t)),predNew=testT.map(t=>interpNewton(xs,dd,t)),predSp=testT.map(t=>evalSplineNatural(sp,t));
  const maxErr=arr=>Math.max(...arr.map((v,i)=>Math.abs(testRef[i]-v)));
  const rmseLag=rmse(testRef,predLag),rmseNew=rmse(testRef,predNew),rmseSp=rmse(testRef,predSp);

  const W=640,H=190,P=44;
  const gridX=Array.from({length:50},(_,i)=>a+(b-a)*i/49);
  const yAll=[...ys,...gridX.map(evalSplineNatural.bind(null,sp))];
  const yMin=Math.min(...yAll),yMax=Math.max(...yAll),spanY=Math.max(1e-6,yMax-yMin);
  const Xc=t=>P+(W-P-10)*(t-a)/(b-a),Yc=v=>10+(H-30)*(1-(v-yMin)/spanY);
  const polySp=gridX.map(t=>`${Xc(t)},${Yc(evalSplineNatural(sp,t))}`).join(' ');
  const ptsNodes=xs.map((t,i)=>`<circle cx="${Xc(t)}" cy="${Yc(ys[i])}" r="3.5" fill="var(--c1)"/>`).join('');
  const valsR=[rmseLag,rmseNew,rmseSp],vMaxR=Math.max(...valsR,1e-6);
  const barsR=valsR.map((val,i)=>{const bh=((H-45)*val)/vMaxR;const x=P+i*140;const y=H-25-bh;return `<rect x="${x}" y="${y}" width="85" height="${Math.max(2,bh)}" fill="${['var(--c1)','var(--c2)','var(--c3)'][i]}"/><text x="${x}" y="${H-8}">${['Lagrange','Newton','Spline'][i]} (${f(val)})</text>`}).join('');

  document.getElementById('outInterp').innerHTML=`
    <p>Nodos usados: ${xs.length} · Puntos ocultados: [${testT.map(t=>f(t)).join(', ')}].</p>
    <div class="wrap"><table><tr><th>Método</th><th>Predicción en ocultos</th><th>RMSE</th><th>Error abs. máx.</th></tr>
      <tr><td>Lagrange</td><td>${predLag.map(f).join(', ')}</td><td>${f(rmseLag)}</td><td>${f(maxErr(predLag))}</td></tr>
      <tr><td>Newton (DD)</td><td>${predNew.map(f).join(', ')}</td><td>${f(rmseNew)}</td><td>${f(maxErr(predNew))}</td></tr>
      <tr><td>Spline cúbico</td><td>${predSp.map(f).join(', ')}</td><td>${f(rmseSp)}</td><td>${f(maxErr(predSp))}</td></tr>
    </table></div>
    <div class="two" style="margin-top:12px">
      <div class="panel"><h3>Gráfico 1 · Reconstrucción Spline cúbico y nodos</h3><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${H-20}" y2="${H-20}" stroke="var(--line)"/><polyline fill="none" stroke-width="2" stroke="var(--c3)" points="${polySp}"/>${ptsNodes}<text x="${P}" y="${H-4}">t = ${f(a)} → ${f(b)}</text></svg></div>
      <div class="panel"><h3>Gráfico 2 · RMSE en puntos ocultados</h3><svg viewBox="0 0 ${W} ${H}"><line x1="${P}" x2="${W-10}" y1="${H-25}" y2="${H-25}" stroke="var(--line)"/>${barsR}</svg></div>
    </div>
    <div class="two"><div class="panel"><h3>Conclusión numérica</h3><p>Lagrange y Newton definen el mismo polinomio interpolante global; los splines cúbicos ofrecen mayor estabilidad local frente a ruido y muchos nodos.</p></div><div class="panel"><h3>Conclusión del problema</h3><p>El ruido η y el espaciamiento de nodos afectan la precisión de reconstrucción de señales sintéticas. No representa telemetría real.</p></div></div>`;
  lastInterp={sc:curSen,sen,n:nTot,a,b,noise};
}
document.getElementById('runInterp').onclick=runInterp;
