function calc3DProjection(leftBoxX, isoY, leftBoxW, isoH) {
  const padX = 14, padY = 12;
  const uMinX = leftBoxX + padX;
  const uMaxX = leftBoxX + leftBoxW - padX;
  const uMinY = isoY + padY;
  const uMaxY = isoY + isoH - padY - 14;
  const availW = uMaxX - uMinX;
  const availH = uMaxY - uMinY;

  const angZ = 18 * Math.PI / 180;
  const angX = 35 * Math.PI / 180;
  const cosZ = Math.cos(angZ), sinZ = Math.sin(angZ);
  const cosX = Math.cos(angX), sinX = Math.sin(angX);

  const zMax = 6.6;
  const z1 = 1.4, z2 = 5.2;
  const xMin = -0.2, xMax = 1.25;
  const yMin = -0.45, yMax = 0.70;

  const keyPts = [
    { x: xMax, y: yMin, z: z1 },
    { x: xMin, y: yMin, z: z1 },
    { x: xMax, y: yMax, z: z2 },
    { x: xMin, y: yMax, z: z2 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0.45, z: 0 },
    { x: 1, y: 0.45, z: 0 },
    { x: 0, y: 0, z: zMax },
    { x: 1, y: 0, z: zMax },
    { x: 0, y: 0.45, z: zMax },
    { x: 1, y: 0.45, z: zMax },
    { x: 0.5, y: -0.35, z: z1 },
    { x: 0.5, y: -0.35, z: z2 }
  ];

  const rawProj = keyPts.map(p => ({
    u: p.z * cosZ - p.x * cosX,
    v: p.z * sinZ + p.x * sinX + p.y * 1.05
  }));

  const minU = Math.min(...rawProj.map(p => p.u));
  const maxU = Math.max(...rawProj.map(p => p.u));
  const minV = Math.min(...rawProj.map(p => p.v));
  const maxV = Math.max(...rawProj.map(p => p.v));

  const uSpan = maxU - minU;
  const vSpan = maxV - minV;

  const scale = Math.min((availW - 8) / uSpan, (availH - 4) / vSpan);

  const fittedW = uSpan * scale;
  const fittedH = vSpan * scale;
  const offsetX = uMinX + (availW - fittedW) / 2 - minU * scale;
  const offsetY = uMinY + (availH - fittedH) / 2 - minV * scale;

  return { scale, fittedW, fittedH, availW, availH, uSpan, vSpan };
}

console.log(calc3DProjection(-48, -250, 292, 120));

