const assert = require("assert");

function getScaleFactor(scaleStr) {
  if (!scaleStr) return 1.0;
  const parts = String(scaleStr).split(":");
  if (parts.length === 2) {
    const num = parseFloat(parts[0]) || 1;
    const den = parseFloat(parts[1]) || 1;
    if (den > 0) return num / den;
  }
  return 1.0;
}

assert.strictEqual(getScaleFactor("1:1"), 1.0);
assert.strictEqual(getScaleFactor("1:2"), 0.5);
assert.strictEqual(getScaleFactor("1:5"), 0.2);
assert.strictEqual(getScaleFactor("1:10"), 0.1);
assert.strictEqual(getScaleFactor("1:20"), 0.05);
assert.strictEqual(getScaleFactor("1:50"), 0.02);
assert.strictEqual(getScaleFactor("1:100"), 0.01);

const W = 300;
const s100 = getScaleFactor("1:100");
const scaledW = +(W * s100).toFixed(3);
assert.strictEqual(scaledW, 3);
console.log(`✓ 300mm scaled at 1:100 is exactly ${scaledW}mm CAD units`);

const s50 = getScaleFactor("1:50");
const scaledW50 = +(W * s50).toFixed(3);
assert.strictEqual(scaledW50, 6);
console.log(`✓ 300mm scaled at 1:50 is exactly ${scaledW50}mm CAD units`);

