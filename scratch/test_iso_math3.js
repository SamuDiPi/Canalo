const angZ = 18 * Math.PI / 180;
const angX = 36 * Math.PI / 180;

// Span Ls with 2 brackets at z=1.0 and z=3.6 (distance = 2.6)
// Total tray length z from 0 to 4.5
// Tray width x from 0 to 1.0
// Tray height y from 0 to 0.55
// Brackets y from -0.45 to 0.70

const pts = [
  // Brackets
  { x: -0.15, y: -0.45, z: 0.9 },
  { x: 1.25, y: -0.45, z: 0.9 },
  { x: 1.25, y: 0.75, z: 0.9 },
  { x: -0.15, y: -0.45, z: 3.5 },
  { x: 1.25, y: -0.45, z: 3.5 },
  { x: 1.25, y: 0.75, z: 3.5 },
  // Tray
  { x: 0, y: 0, z: 0.2 },
  { x: 1.0, y: 0, z: 0.2 },
  { x: 0, y: 0.55, z: 0.2 },
  { x: 1.0, y: 0.55, z: 0.2 },
  { x: 0, y: 0, z: 4.2 },
  { x: 1.0, y: 0, z: 4.2 },
  { x: 0, y: 0.55, z: 4.2 },
  { x: 1.0, y: 0.55, z: 4.2 }
];

const projected = pts.map(p => ({
  u: p.z * Math.cos(angZ) - p.x * Math.cos(angX),
  v: p.z * Math.sin(angZ) + p.x * Math.sin(angX) + p.y * 1.1
}));

const minU = Math.min(...projected.map(p => p.u));
const maxU = Math.max(...projected.map(p => p.u));
const minV = Math.min(...projected.map(p => p.v));
const maxV = Math.max(...projected.map(p => p.v));

console.log('u range:', (maxU - minU).toFixed(2));
console.log('v range:', (maxV - minV).toFixed(2));
const availW = 244, availH = 76;
const scale = Math.min(availW / (maxU - minU), availH / (maxV - minV));
console.log('Scale:', scale.toFixed(2));
console.log('Fitted W:', ((maxU - minU) * scale).toFixed(1), '<=', availW);
console.log('Fitted H:', ((maxV - minV) * scale).toFixed(1), '<=', availH);

