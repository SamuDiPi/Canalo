// Let's test with realistic aspect ratio:
// x: width [0, 0.75]
// z: length [0, 2.2]
// y: height [0, 0.4]

const cos30 = Math.cos(Math.PI / 6); // 0.866
const sin30 = Math.sin(Math.PI / 6); // 0.5

const pts2 = [
  { x: -0.1, y: -0.4, z: 0.2 }, // bracket 1
  { x: 1.05, y: -0.4, z: 0.2 },
  { x: 1.05, y: 0.6, z: 0.2 },
  { x: -0.1, y: -0.4, z: 1.8 }, // bracket 2
  { x: 1.05, y: -0.4, z: 1.8 },
  { x: 1.05, y: 0.6, z: 1.8 },
  { x: 0, y: 0, z: 0 },         // tray start
  { x: 0.75, y: 0, z: 0 },
  { x: 0, y: 0.4, z: 0 },
  { x: 0.75, y: 0.4, z: 0 },
  { x: 0, y: 0, z: 2.0 },       // tray end
  { x: 0.75, y: 0, z: 2.0 },
  { x: 0, y: 0.4, z: 2.0 },
  { x: 0.75, y: 0.4, z: 2.0 }
];

// Screen mapping:
// u = (z * cos25 - x * cos35)
// v = (z * sin25 + x * sin35 + y)
const angZ = 24 * Math.PI / 180;
const angX = 30 * Math.PI / 180;

const projected2 = pts2.map(p => ({
  u: p.z * Math.cos(angZ) - p.x * Math.cos(angX),
  v: p.z * Math.sin(angZ) + p.x * Math.sin(angX) + p.y * 1.0
}));

const minU2 = Math.min(...projected2.map(p => p.u));
const maxU2 = Math.max(...projected2.map(p => p.u));
const minV2 = Math.min(...projected2.map(p => p.v));
const maxV2 = Math.max(...projected2.map(p => p.v));

console.log('Aspect ratio fitted:');
console.log('u range:', (maxU2 - minU2).toFixed(2));
console.log('v range:', (maxV2 - minV2).toFixed(2));
const availW = 244, availH = 76;
const scale = Math.min(availW / (maxU2 - minU2), availH / (maxV2 - minV2));
console.log('Scale:', scale.toFixed(2));
console.log('Fitted W:', ((maxU2 - minU2) * scale).toFixed(1), '<=', availW);
console.log('Fitted H:', ((maxV2 - minV2) * scale).toFixed(1), '<=', availH);

