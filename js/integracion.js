/* Integración */
function trapecioCompuesto(f, a, b, n){
  const h = (b - a)/n;
  let s = 0.5*(f(a) + f(b));
  for(let i = 1; i < n; i++) s += f(a + i*h);
  return h*s;
}
function simpson13Compuesto(f, a, b, n){
  const m = n % 2 === 0 ? n : n + 1;
  const h = (b - a)/m;
  let s = f(a) + f(b);
  for(let i = 1; i < m; i++) s += (i % 2 === 0 ? 2 : 4) * f(a + i*h);
  return (h/3)*s;
}
function romberg(f, a, b, niveles = 4){
  const R = Array.from({length: niveles}, () => Array(niveles).fill(0));
  for(let i = 0; i < niveles; i++){
    const n = Math.pow(2, i);
    R[i][0] = trapecioCompuesto(f, a, b, n);
    for(let j = 1; j <= i; j++){
      const p4 = Math.pow(4, j);
      R[i][j] = (p4*R[i][j-1] - R[i-1][j-1]) / (p4 - 1);
    }
  }
  return {valor: R[niveles-1][niveles-1], tabla: R};
}
