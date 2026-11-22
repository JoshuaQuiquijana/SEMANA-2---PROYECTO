/* Interpolación */
function interpLagrange(xs, ys, t){
  let sum = 0;
  for(let i = 0; i < xs.length; i++){
    let li = 1;
    for(let j = 0; j < xs.length; j++) if(i !== j) li *= (t - xs[j]) / (xs[i] - xs[j]);
    sum += ys[i] * li;
  }
  return sum;
}
function tablaNewtonDD(xs, ys){
  const dd = ys.slice();
  for(let j = 1; j < xs.length; j++) for(let i = xs.length - 1; i >= j; i--) dd[i] = (dd[i] - dd[i-1]) / (xs[i] - xs[i-j]);
  return dd;
}
function interpNewton(xs, dd, t){
  let val = dd[xs.length - 1];
  for(let i = xs.length - 2; i >= 0; i--) val = val * (t - xs[i]) + dd[i];
  return val;
}
function buildSplineNatural(xs, ys){
  const n = xs.length, h = Array(n - 1);
  for(let i = 0; i < n - 1; i++) h[i] = xs[i+1] - xs[i];
  const m = n - 2, M = Array(n).fill(0);
  if(m > 0){
    const a = Array(m).fill(0), b = Array(m).fill(0), c = Array(m).fill(0), d = Array(m).fill(0);
    for(let i = 0; i < m; i++){
      const idx = i + 1;
      a[i] = h[idx - 1]; b[i] = 2*(h[idx - 1] + h[idx]); c[i] = h[idx];
      d[i] = 6*(((ys[idx+1] - ys[idx])/h[idx]) - ((ys[idx] - ys[idx-1])/h[idx-1]));
    }
    for(let i = 1; i < m; i++){ const w = a[i]/b[i-1]; b[i] -= w*c[i-1]; d[i] -= w*d[i-1]; }
    const sol = Array(m).fill(0); sol[m - 1] = d[m - 1]/b[m - 1];
    for(let i = m - 2; i >= 0; i--) sol[i] = (d[i] - c[i]*sol[i+1])/b[i];
    for(let i = 0; i < m; i++) M[i + 1] = sol[i];
  }
  return {xs, ys, h, M};
}
function evalSplineNatural(sp, t){
  const {xs, ys, h, M} = sp, n = xs.length;
  let i = 0;
  if(t <= xs[0]) i = 0; else if(t >= xs[n - 1]) i = n - 2; else while(i < n - 2 && t > xs[i + 1]) i++;
  const hi = h[i], dx1 = xs[i+1] - t, dx2 = t - xs[i];
  return (M[i]*Math.pow(dx1, 3) + M[i+1]*Math.pow(dx2, 3))/(6*hi) + ((ys[i] - M[i]*hi*hi/6)*dx1 + (ys[i+1] - M[i+1]*hi*hi/6)*dx2)/hi;
}
function rmse(refArr, predArr){
  const k = Math.min(refArr.length, predArr.length);
  if(!k) return NaN;
  return Math.sqrt(refArr.slice(0, k).reduce((acc, v, idx) => acc + Math.pow(v - predArr[idx], 2), 0) / k);
}
