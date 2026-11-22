/* Historial (localStorage, con respaldo) */
const K='simtele-hist';let mem=[];
const load=()=>{try{return JSON.parse(localStorage.getItem(K)||'[]')}catch(e){return mem}};
const store=a=>{mem=a;try{localStorage.setItem(K,JSON.stringify(a))}catch(e){}};

document.getElementById('run').onclick=run;
document.getElementById('save').onclick=()=>{
  const o=last||run();if(!o)return;
  const a=load();
  a.unshift({id:Date.now(),kind:'lineal',d:new Date().toLocaleString('es'),sc:o.sc,tol:o.tol,mx:o.mx,k:o.k,res:o.rows.map(r=>[r.m,r.it,r.c,r.ea])});
  store(a);alert('Experimento de sistemas lineales guardado.');
};
document.getElementById('saveDet').onclick=()=>{
  if(!lastDet)runDet();if(!lastDet)return;
  const a=load();
  a.unshift({id:Date.now(),kind:'det',d:new Date().toLocaleString('es'),params:lastDet});
  store(a);alert('Experimento de Detención guardado.');
};
document.getElementById('saveVie').onclick=()=>{
  if(!lastVie)runVie();if(!lastVie)return;
  const a=load();
  a.unshift({id:Date.now(),kind:'vie',d:new Date().toLocaleString('es'),params:lastVie});
  store(a);alert('Experimento de Oscilaciones guardado.');
};
document.getElementById('saveSen').onclick=()=>{
  if(!lastInterp)runInterp();if(!lastInterp)return;
  const a=load();
  a.unshift({id:Date.now(),kind:'interp',d:new Date().toLocaleString('es'),params:lastInterp});
  store(a);alert('Experimento de Sensores guardado.');
};

function renderHist(){
  const a=load(),h=document.getElementById('hist');
  h.innerHTML=a.length?'':'<p>Aún no hay experimentos guardados. Ejecuta y guarda uno desde cualquier módulo.</p>';
  a.forEach(e=>{
    const d=document.createElement('div');d.className='hrow';
    let desc='';
    if(e.kind==='det'){
      desc=`<b>Detención (${e.params.sc})</b> · v₀=${e.params.v0}, a=${e.params.a}, tᵣ=${e.params.tr}, h=${e.params.h}<br><small style="color:var(--muted)">${e.d}</small>`;
    } else if(e.kind==='vie'){
      desc=`<b>Oscilaciones (${e.params.sc})</b> · m=${e.params.m}, c=${e.params.c}, k=${e.params.k}, h=${e.params.h}<br><small style="color:var(--muted)">${e.d}</small>`;
    } else if(e.kind==='interp'){
      desc=`<b>Sensores (${e.params.sc})</b> · ${e.params.sen} · nodos=${e.params.n} · η=${e.params.noise}<br><small style="color:var(--muted)">${e.d}</small>`;
    } else {
      desc=`<b>Deterioro Lineal (${SC[e.sc].n})</b> · tol ${e.tol} · máx ${e.mx} · κ∞ ${f(e.k)}<br><small style="color:var(--muted)">${e.d}</small>`;
    }
    d.innerHTML=`<span>${desc}</span><span><button>Relanzar</button> <button>Eliminar</button></span>`;
    const [rl,del]=d.querySelectorAll('button');
    rl.onclick=()=>{
      if(e.kind==='det'){
        go('detencion');const p=e.params;
        document.getElementById('detV0').value=p.v0;document.getElementById('detA').value=p.a;document.getElementById('detTr').value=p.tr;document.getElementById('detH').value=p.h;document.getElementById('detSub').value=p.sub;runDet();
      } else if(e.kind==='vie'){
        go('viento');const p=e.params;
        document.getElementById('vieM').value=p.m;document.getElementById('vieC').value=p.c;document.getElementById('vieK').value=p.k;document.getElementById('vieF').value=p.f0;document.getElementById('vieH').value=p.h;document.getElementById('vieN').value=p.pasos;document.getElementById('vieSub').value=p.sub;runVie();
      } else if(e.kind==='interp'){
        go('sensores');const p=e.params;
        document.getElementById('intSen').value=p.sen;document.getElementById('intN').value=p.n;document.getElementById('intA').value=p.a;document.getElementById('intB').value=p.b;document.getElementById('intNoise').value=p.noise;runInterp();
      } else {
        go('deterioro');cur=e.sc;document.getElementById('tol').value=e.tol;document.getElementById('mx').value=e.mx;mark();run();
      }
    };
    del.onclick=()=>{store(load().filter(x=>x.id!==e.id));renderHist()};
    h.appendChild(d);
  });
}
mark();markRai();markDet();markVie();markSen();
const h0=location.hash.slice(1);go(document.getElementById(h0)?h0:'inicio');
