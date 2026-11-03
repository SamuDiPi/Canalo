const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('c:/Users/dipinto/Documents/Canalo/Canalo.html', 'utf8');

// Extract main JS block (largest script)
const scriptMatches = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
const mainScript = scriptMatches.map(m => m[1]).sort((a, b) => b.length - a.length)[0];
assert(mainScript && mainScript.length > 1000, "Main script not found");
const jsCode = mainScript;

// Create a DOM mock
const mockElements = {};
const domMock = {
  getElementById: (id) => {
    if (!mockElements[id]) {
      mockElements[id] = {
        value: "",
        textContent: "",
        className: "",
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        addEventListener: () => {},
        removeEventListener: () => {},
        parentElement: { getBoundingClientRect: () => ({ width: 1200, height: 800 }) },
        getContext: () => ({
          setTransform: () => {},
          clearRect: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          scale: () => {},
          fillRect: () => {},
          beginPath: () => {},
          arc: () => {},
          fill: () => {},
          stroke: () => {},
          moveTo: () => {},
          lineTo: () => {},
          closePath: () => {},
          strokeRect: () => {},
          fillText: () => {}
        })
      };
    }
    return mockElements[id];
  },
  createElement: (tag) => ({
    tagName: tag,
    className: "",
    innerHTML: "",
    appendChild: () => {}
  }),
  addEventListener: () => {},
  title: ""
};

const context = vm.createContext({
  window: {
    devicePixelRatio: 1,
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} }
  },
  document: domMock,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Math: Math,
  parseFloat: parseFloat,
  parseInt: parseInt,
  String: String,
  Array: Array,
  Object: Object
});

vm.runInContext(jsCode, context);

// Test 1: Check live description update on unipolar cables
console.log("Setting up test cables in state...");
vm.runInContext(`
state.cables = [
  { id: 1, code: "QPT-DX-N C-21 - L1", desc: "Alimentazione Centralina DALI", d: 14, w: 0.28, sec: 2.5, cores: 1, x: 20, y: 10, type: "FG16M16", form: "1X10" },
  { id: 2, code: "QPT-DX-N C-21 - L2", desc: "Alimentazione Centralina DALI", d: 14, w: 0.28, sec: 2.5, cores: 1, x: 35, y: 10, type: "FG16M16", form: "1X10" },
  { id: 3, code: "QPT-DX-N C-21 - PE", desc: "Alimentazione Centralina DALI", d: 14, w: 0.28, sec: 2.5, cores: 1, x: 50, y: 10, type: "FS17", form: "1X10" }
];
`, context);

// Set input DOM elements
mockElements["descInp_0"] = { value: "Alimentazione Centralina DALI" };
mockElements["descInp_1"] = { value: "Alimentazione Centralina DALI" };
mockElements["descInp_2"] = { value: "Alimentazione Centralina DALI" };

// Simulate user typing live into descInp_0
console.log("Testing onCableDescInput live reactivity...");
vm.runInContext('onCableDescInput(0, "Alimentazione Luci Piano Terra")', context);

assert.strictEqual(vm.runInContext('state.cables[0].desc', context), "Alimentazione Luci Piano Terra");
assert.strictEqual(vm.runInContext('state.cables[1].desc', context), "Alimentazione Luci Piano Terra");
assert.strictEqual(vm.runInContext('state.cables[2].desc', context), "Alimentazione Luci Piano Terra");
assert.strictEqual(mockElements["descInp_1"].value, "Alimentazione Luci Piano Terra");
assert.strictEqual(mockElements["descInp_2"].value, "Alimentazione Luci Piano Terra");
console.log("✓ PASS: onCableDescInput updates state and peer input fields instantaneously!");

// Test 2: Check buildCADScene with 3D axonometry
console.log("Testing buildCADScene with enhanced 3D isometric scene...");
vm.runInContext(`
state.showIso3D = true;
state.trayType = "perforated";
state.support = "wall_med";
state.spanM = 1.5;
state.clamps = true;
state.reiCount = 1;
`, context);

const res = vm.runInContext('buildCADScene()', context);
assert(res && res.prims, "buildCADScene did not return prims");

const isoPrims = res.prims.filter(p => p.layer === "VISTA_3D_ISO");
console.log(`Total CAD primitives: ${res.prims.length}, 3D Iso primitives: ${isoPrims.length}`);
assert(isoPrims.length > 20, "Expected at least 20 3D Iso primitives");

const polyPrims = isoPrims.filter(p => p.t === "poly");
console.log(`3D Solid Polygons: ${polyPrims.length}`);
assert(polyPrims.length >= 10, "Expected at least 10 solid polygons for 3D faces");

const dimLinePrims = isoPrims.filter(p => p.t === "text" && p.str.includes("PASSO MENSOLE"));
console.log(`3D Dimension text count: ${dimLinePrims.length}`);
const quoteLabel = dimLinePrims.find(p => p.str.startsWith("PASSO MENSOLE Ls ="));
assert(quoteLabel, "Expected dimension line label starting with 'PASSO MENSOLE Ls ='");
assert(quoteLabel.str.includes("Ls = 1.50 m"), "Expected span distance in text");

console.log("✓ PASS: buildCADScene correctly generates complete 3D isometric axonometry with solid faces, brackets and dimensioning!");

// Test 3: Check cleanUtenzaDescription
assert.strictEqual(vm.runInContext('cleanUtenzaDescription("QPT-DX-N C-21 Alimentazione Centralina DALI 1 / 1,053")', context), "Alimentazione Centralina DALI");
console.log("✓ PASS: cleanUtenzaDescription verified!");

console.log("ALL TESTS PASSED WITH 0 ERRORS!");
