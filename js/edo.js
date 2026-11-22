/* EDO: RK2 y RK4 */
function rk2(derivFn, t0, Y0, h, pasos){
  let t = t0, Y = Y0.slice();
  const rows = [{k: 0, t, Y: Y.slice()}];
  for(let k = 1; k <= pasos; k++){
    const k1 = derivFn(t, Y);
    const Ye = Y.map((v, i) => v + h*k1[i]);
    const k2 = derivFn(t + h, Ye);
    Y = Y.map((v, i) => v + 0.5*h*(k1[i] + k2[i]));
    t = t0 + k*h;
    rows.push({k, t, Y: Y.slice()});
  }
  return rows;
}
function rk4(derivFn, t0, Y0, h, pasos){
  let t = t0, Y = Y0.slice();
  const rows = [{k: 0, t, Y: Y.slice()}];
  for(let k = 1; k <= pasos; k++){
    const k1 = derivFn(t, Y);
    const k2 = derivFn(t + 0.5*h, Y.map((v, i) => v + 0.5*h*k1[i]));
    const k3 = derivFn(t + 0.5*h, Y.map((v, i) => v + 0.5*h*k2[i]));
    const k4 = derivFn(t + h,     Y.map((v, i) => v + h*k3[i]));
    Y = Y.map((v, i) => v + (h/6)*(k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
    t = t0 + k*h;
    rows.push({k, t, Y: Y.slice()});
  }
  return rows;
}
