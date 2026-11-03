const leftBoxX = -48;
const leftBoxW = 292; // e.g. W=200 -> 292
const isoH = 114;
const isoY = -200;

// Test standard isometric projection
// Box area: x in [leftBoxX, leftBoxX + leftBoxW], y in [isoY, isoY + isoH]
const padX = 24, padY = 16;
const boxMinX = leftBoxX + padX;
const boxMaxX = leftBoxX + leftBoxW - padX;
const boxMinY = isoY + padY;
const boxMaxY = isoY + isoH - padY - 8; // leave 8 for title

console.log('Available area:', {
  w: boxMaxX - boxMinX,
  h: boxMaxY - boxMinY
});

// Normalized isometric projection
// Let x in [-0.1, 1.25] (wall bracket at 1.25, front lip at -0.1)
// Let y in [-0.5, 0.8] (bracket strut down to -0.5, wall plate up to 0.8)
// Let z in [0, 1.0] (tray span from 0 to 1)

// Project:
// isoX = z * cos30 - x * cos30 = 0.866 * (z - x)
// isoY = z * sin30 + x * sin30 + y = 0.5 * (z + x) + y * yFactor

const cos30 = Math.cos(Math.PI / 6); // 0.866
const sin30 = Math.sin(Math.PI / 6); // 0.5

const pts = [
  { x: -0.1, y: -0.5, z: 0 },
  { x: 1.25, y: -0.5, z: 0 },
  { x: 1.25, y: 0.8, z: 1.0 },
  { x: -0.1, y: 0.8, z: 1.0 },
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 1, y: 0, z: 1 }
];

const projected = pts.map(p => ({
  u: cos30 * (p.z - p.x),
  v: sin30 * (p.z + p.x) + p.y * 0.9
}));

const minU = Math.min(...projected.map(p => p.u));
const maxU = Math.max(...projected.map(p => p.u));
const minV = Math.min(...projected.map(p => p.v));
const maxV = Math.max(...projected.map(p => p.v));

console.log('Projected range:');
console.log('u range:', minU, 'to', maxU, 'diff:', maxU - minU);
console.log('v range:', minV, 'to', maxV, 'diff:', maxV - minV);

// Fit scale:
const availW = boxMaxX - boxMinX;
const availH = boxMaxY - boxMinY;
const scale = Math.min(availW / (maxU - minU), availH / (maxV - minV));
console.log('Optimal scale:', scale);
console.log('Fitted W:', (maxU - minU) * scale, '<=', availW);
console.log('Fitted H:', (maxV - minV) * scale, '<=', availH);

