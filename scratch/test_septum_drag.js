const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log("Starting Septum Dragging and Positioning Tests...");

const html = fs.readFileSync('Canalo.html', 'utf8');

// Set up virtual DOM mock
const elements = {};
function getMockElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      value: "",
      textContent: "",
      innerHTML: "",
      checked: false,
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      querySelectorAll: (sel) => [],
      querySelector: (sel) => ({ textContent: '', innerHTML: '', style: {} }),
      parentElement: {
        getBoundingClientRect: () => ({ width: 1000, height: 700, left: 0, top: 0 })
      },
      getBoundingClientRect: () => ({ width: 1000, height: 700, left: 0, top: 0 }),
      getContext: () => ({
        setTransform: () => {},
        clearRect: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        arc: () => {},
        fillText: () => {},
        setLineDash: () => {},
        measureText: (txt) => ({ width: txt.length * 5 })
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: () => {},
      style: {}
    };
  }
  return elements[id];
}

const context = {
  window: {},
  addEventListener: () => {},
  removeEventListener: () => {},
  document: {
    getElementById: (id) => getMockElement(id),
    querySelectorAll: (sel) => [],
    createElement: (tag) => getMockElement("created_" + tag),
    activeElement: null
  },
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Math: Math,
  Date: Date,
  parseFloat: parseFloat,
  parseInt: parseInt,
  Array: Array,
  String: String,
  JSON: JSON,
  Object: Object
};
context.window = context;
vm.createContext(context);

// Extract and run script
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, "Script tag not found");
vm.runInContext(scriptMatch[1], context);

console.log("1. Testing Septum Initialization & Defaults...");
vm.runInContext('state.width = 300; state.height = 75; state.septums = 1; state.septumPositions = [];', context);
let seps = vm.runInContext('getSeptumXList()', context);
assert.strictEqual(seps.length, 1, "Should have 1 septum");
assert.strictEqual(seps[0], 180, "Default 1 septum at 60% of 300mm should be 180mm");
console.log("✓ PASS: Default 1 septum initialized at 180mm!");

console.log("2. Testing moveSeptum() direct positioning...");
vm.runInContext('moveSeptum(0, 120)', context);
seps = vm.runInContext('getSeptumXList()', context);
assert.strictEqual(seps[0], 120, "Septum 0 should be moved to 120mm");
console.log("✓ PASS: moveSeptum correctly placed septum at 120mm!");

console.log("3. Testing boundary clamping...");
vm.runInContext('moveSeptum(0, 5)', context); // below min 15
seps = vm.runInContext('getSeptumXList()', context);
assert.strictEqual(seps[0], 15, "Septum 0 should clamp to minimum 15mm from left wall");

vm.runInContext('moveSeptum(0, 295)', context); // above max 300-15 = 285
seps = vm.runInContext('getSeptumXList()', context);
assert.strictEqual(seps[0], 285, "Septum 0 should clamp to maximum 285mm from left wall");
console.log("✓ PASS: Septum clamping respects tray walls (15mm to 285mm)!");

console.log("4. Testing 2 Setti Separatori...");
vm.runInContext('state.septums = 2; state.septumPositions = [];', context);
seps = vm.runInContext('getSeptumXList()', context);
assert.strictEqual(seps.length, 2, "Should have 2 septa");
console.log(`2 Septa positions: ${seps[0]}mm and ${seps[1]}mm`);
assert(seps[0] < seps[1], "Septum 0 must be to the left of septum 1");

vm.runInContext('moveSeptum(0, 100); moveSeptum(1, 220);', context);
seps = vm.runInContext('getSeptumXList()', context);
assert.strictEqual(seps[0], 100);
assert.strictEqual(seps[1], 220);

// Trying to move septum 0 past septum 1
vm.runInContext('moveSeptum(0, 250);', context);
seps = vm.runInContext('getSeptumXList()', context);
assert.strictEqual(seps[0], 220 - 15, "Septum 0 should clamp to 15mm left of septum 1");
console.log("✓ PASS: Multiple septa maintain safe separation!");

console.log("5. Testing CAD drawing primitives for draggable septum & compartment dimensions...");
vm.runInContext('state.septums = 1; state.septumPositions = [120]; state.cables = [];', context);
const cadScene = vm.runInContext('buildCADScene()', context);
assert(cadScene && cadScene.prims, "buildCADScene did not return prims");

const handleText = cadScene.prims.find(p => p.t === "text" && p.str === "◄ ►");
assert(handleText, "Expected '◄ ►' interactive drag handle text on septum");
assert.strictEqual(handleText.x, 120, "Handle text should be centered on septum X=120");

const labelText = cadScene.prims.find(p => p.t === "text" && p.str.includes("SETTO #1 (120mm)"));
assert(labelText, "Expected 'SETTO #1 (120mm)' label");

const comp1Dim = cadScene.prims.find(p => p.t === "text" && p.str.includes("L1 = 120 mm"));
assert(comp1Dim, "Expected compartment 1 dimension 'L1 = 120 mm'");

const comp2Dim = cadScene.prims.find(p => p.t === "text" && p.str.includes("L2 = 180 mm"));
assert(comp2Dim, "Expected compartment 2 dimension 'L2 = 180 mm'");
console.log("✓ PASS: CAD drawing generates interactive handle '◄ ►', septum badge, and exact compartment dimensions!");

console.log("6. Testing 3D isometric view septum rendering...");
const iso3D = cadScene.prims.filter(p => p.layer === "VISTA_3D_ISO");
const iso3DSepLabel = iso3D.find(p => p.t === "text" && p.str === "SETTO #1");
assert(iso3DSepLabel, "Expected SETTO #1 in 3D isometric view");
console.log("✓ PASS: 3D isometric view renders dynamic septum!");

console.log("7. Testing cable clearance resolution when septum moves...");
vm.runInContext(`
  state.cables = [
    { code: "C1", desc: "Test", form: "3G2.5", type: "FG16", x: 121, y: 10, d: 20, origX: 121, origY: 10, w: 0.5, cores: 3, sec: 2.5 }
  ];
  moveSeptum(0, 120);
`, context);
const cable = vm.runInContext('state.cables[0]', context);
assert(Math.abs(cable.x - 120) >= (cable.d / 2 + 0.75 + 0.4), "Cable must be moved outside the septum sheet");
console.log(`✓ PASS: Cable near septum correctly resolved to x=${cable.x} without collision!`);

console.log(">>> ALL SEPTUM POSITIONING & DRAGGING TESTS PASSED WITH 0 ERRORS! <<<");
