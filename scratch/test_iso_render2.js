function calc3DProjection(leftBoxX, isoY, leftBoxW, isoH) {
  const padX = 14, padY = 12;
  const uMinX = leftBoxX + padX;
  const uMaxX = leftBoxX + leftBoxW - padX;
  const uMinY = isoY + padY;
  const uMaxY = isoY + isoH - padY - 14; // header space
  const availW = uMaxX - uMinX;
  const availH = uMaxY - uMinY;

  // Angles:
  // Z axis: 22 degrees (longitudinal depth running to the right)
  // X axis: 35 degrees (transversal width running to the upper-left)
  const angZ = 22 * Math.PI / 180;
  const angX = 35 * Math.PI / 180;
  const cosZ = Math.cos(angZ), sinZ = Math.sin(angZ);
  const cosX = Math.cos(angX), sinX = Math.sin(angX);

  // Normalized 3D model coordinates:
  // x in [-0.2, 1.25] (bracket from wall 1.25 to front overhang -0.2)
  // y in [-0.45, 0.70] (bracket strut -0.45, wall plate 0.70, tray 0 to 0.45)
  // z in [0, 4.2] (tray run, brackets at z=1.0 and z=3.2)
  const zMax = 4.2;
  const xMin = -0.2, xMax = 1.25;
  const yMin = -0.45, yMax = 0.70;

  // Key extrema points in normalized space:
  const keyPts = [
    { x: xMax, y: yMin, z: 1.0 },
    { x: xMin, y: yMin, z: 1.0 },
    { x: xMax, y: yMax, z: 3.2 },
    { x: xMin, y: yMax, z: 3.2 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0.45, z: 0 },
    { x: 1, y: 0.45, z: 0 },
    { x: 0, y: 0, z: zMax },
    { x: 1, y: 0, z: zMax },
    { x: 0, y: 0.45, z: zMax },
    { x: 1, y: 0.45, z: zMax },
    // Dimension line at y = -0.35
    { x: 0.5, y: -0.35, z: 1.0 },
    { x: 0.5, y: -0.35, z: 3.2 }
  ];

  // Normalized projected coords (without scaling):
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

  // Fit scale with safety margin
  const scale = Math.min((availW - 6) / uSpan, (availH - 4) / vSpan);

  // Center horizontally and vertically within available area
  const fittedW = uSpan * scale;
  const fittedH = vSpan * scale;
  const offsetX = uMinX + (availW - fittedW) / 2 - minU * scale;
  const offsetY = uMinY + (availH - fittedH) / 2 - minV * scale;

  const iso = (x, y, z) => ({
    px: +(offsetX + (z * cosZ - x * cosX) * scale).toFixed(2),
    py: +(offsetY + (z * sinZ + x * sinX + y * 1.05) * scale).toFixed(2)
  });

  return { iso, scale, fittedW, fittedH, availW, availH };
}

const res = calc3DProjection(-48, -250, 292, 120);
console.log('Result:', res);

