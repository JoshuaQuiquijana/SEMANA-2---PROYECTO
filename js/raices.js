/* Raíces */
function raizCuadraticaAnalitica(d0, alpha, beta, umbral){
  const c = d0 - umbral;
  if(Math.abs(beta) < 1e-14){
    if(Math.abs(alpha) < 1e-14) return null;
    const t = -c / alpha;
    return t >= 0 ? t : null;
  }
  const disc = alpha*alpha - 4*beta*c;
  if(disc < 0) return null;
  const r1 = (-alpha - Math.sqrt(disc)) / (2*beta);
  const r2 = (-alpha + Math.sqrt(disc)) / (2*beta);
  const candidatas = [r1, r2].filter(v => isFinite(v) && v >= 0).sort((a,b) => a - b);
  return candidatas.length ? candidatas[0] : null;
}
function biseccion(f, a, b, tol, mx){
  let fa = f(a), fb = f(b), hist = [];
  if(!isFinite(fa) || !isFinite(fb) || fa*fb > 0) return {raiz: NaN, it: 0, conv: false, hist};
  let mid = a, prev = a;
  for(let k = 1; k <= mx; k++){
    mid = 0.5*(a + b);
    const fm = f(mid);
    const errEst = k === 1 ? Math.abs(b - a) : Math.abs(mid - prev);
    hist.push({k, x: mid, fx: fm, errEst});
    if(Math.abs(fm) === 0 || errEst < tol || Math.abs(b - a)*0.5 < tol) return {raiz: mid, it: k, conv: true, hist};
    if(fa*fm < 0){ b = mid; fb = fm; } else { a = mid; fa = fm; }
    prev = mid;
  }
  return {raiz: mid, it: mx, conv: false, hist};
}
function newtonRaphson(f, df, x0, tol, mx){
  let x = x0, hist = [];
  for(let k = 1; k <= mx; k++){
    const fx = f(x), dfx = df(x);
    if(!isFinite(fx) || !isFinite(dfx) || Math.abs(dfx) < 1e-14) return {raiz: x, it: k, conv: false, hist};
    const xNext = x - fx/dfx;
    const errEst = Math.abs(xNext - x);
    hist.push({k, x: xNext, fx: f(xNext), errEst});
    x = xNext;
    if(!isFinite(x)) return {raiz: NaN, it: k, conv: false, hist};
    if(errEst < tol && Math.abs(f(x)) < tol) return {raiz: x, it: k, conv: true, hist};
  }
  return {raiz: x, it: mx, conv: false, hist};
}
function secante(f, x0, x1, tol, mx){
  let f0 = f(x0), f1 = f(x1), hist = [];
  for(let k = 1; k <= mx; k++){
    const denom = f1 - f0;
    if(!isFinite(f0) || !isFinite(f1) || Math.abs(denom) < 1e-15) return {raiz: x1, it: k, conv: false, hist};
    const x2 = x1 - f1*(x1 - x0)/denom;
    const f2 = f(x2);
    const errEst = Math.abs(x2 - x1);
    hist.push({k, x: x2, fx: f2, errEst});
    x0 = x1; f0 = f1; x1 = x2; f1 = f2;
    if(!isFinite(x1)) return {raiz: NaN, it: k, conv: false, hist};
    if(errEst < tol && Math.abs(f1) < tol) return {raiz: x1, it: k, conv: true, hist};
  }
  return {raiz: x1, it: mx, conv: false, hist};
}
