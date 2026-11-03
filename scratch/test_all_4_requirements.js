const fs = require('fs');
const assert = require("assert");

const html = fs.readFileSync('c:/Users/dipinto/Documents/Canalo/Canalo.html', 'utf8');

// 1. Verify Cartiglio Tavola CAD card is NOT in sidebar HTML
assert.strictEqual(
  html.includes('<h2 class="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">Cartiglio Tavola CAD</h2>'),
  false,
  "Cartiglio card should be removed from sidebar"
);
console.log("✓ Requirement 3 PASS: Cartiglio card removed from sidebar UI.");

// 2. Verify all constructive section checkboxes are checked by default in HTML
assert.strictEqual(
  html.includes('id="menuChk3D" checked'),
  true,
  "menuChk3D must be checked by default"
);
assert.strictEqual(
  html.includes('id="menuChkChart" checked'),
  true,
  "menuChkChart must be checked by default"
);
assert.strictEqual(
  html.includes('id="menuChkBOM" checked'),
  true,
  "menuChkBOM must be checked by default"
);
assert.strictEqual(
  html.includes('id="menuChkCartiglio" checked'),
  true,
  "menuChkCartiglio must be checked by default"
);
assert.strictEqual(
  html.includes('id="chkExportChart" type="checkbox" checked'),
  true,
  "chkExportChart must be checked by default"
);
assert.strictEqual(
  html.includes('id="chkExportBOM" type="checkbox" checked'),
  true,
  "chkExportBOM must be checked by default"
);
assert.strictEqual(
  html.includes('id="chkExportIso3D" type="checkbox" checked'),
  true,
  "chkExportIso3D must be checked by default"
);
assert.strictEqual(
  html.includes('id="chkExportCartiglio" type="checkbox" checked'),
  true,
  "chkExportCartiglio must be checked by default"
);
console.log("✓ Requirement 2 PASS: All constructive drawing section checkboxes are checked by default.");

// 3. Extract and verify functions from script
const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
const jsCode = scriptMatch[1];

const vm = require("vm");
const mockContext2d = {
  clearRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  fillText: () => {},
  measureText: () => ({ width: 10 }),
  save: () => {},
  restore: () => {},
  scale: () => {},
  translate: () => {},
  rotate: () => {},
  closePath: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  setTransform: () => {}
};

const mockDocument = {
  getElementById: (id) => {
    return {
      value: "Test",
      checked: true,
      classList: { contains: () => false, add: () => {}, remove: () => {}, toggle: () => {} },
      textContent: "",
      getContext: () => mockContext2d,
      addEventListener: () => {},
      width: 400,
      height: 200
    };
  },
  createElement: (tag) => ({
    href: "",
    download: "",
    click: () => {}
  }),
  addEventListener: () => {},
  title: ""
};

const mockWindow = {
  document: mockDocument,
  Blob: class { constructor(parts) { this.content = parts.join(""); } },
  URL: { createObjectURL: () => "blob:test" },
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {}
};

const context = vm.createContext({
  window: mockWindow,
  document: mockDocument,
  Blob: mockWindow.Blob,
  URL: mockWindow.URL,
  localStorage: mockWindow.localStorage,
  console: console,
  Math: Math,
  parseFloat: parseFloat,
  parseInt: parseInt,
  String: String,
  Array: Array,
  Object: Object
});

vm.runInContext(jsCode, context);

// Test cleanUtenzaDescription (Aggiornato per requisito 10: solo la descrizione pulita senza codice e senza valori/rapporti elettrici)
const desc1 = vm.runInContext('cleanUtenzaDescription("QPT-DX-N C-21 Alimentazione Centralina DALI 1 / 1,053")', context);
assert.strictEqual(desc1, "Alimentazione Centralina DALI");

const desc2 = vm.runInContext('cleanUtenzaDescription("Descrizione: Alimentazione Boiler (Accumulo ACS) 15kW 400V")', context);
assert.strictEqual(desc2, "Alimentazione Boiler (Accumulo ACS)");

const desc3 = vm.runInContext('cleanUtenzaDescription("Pompa Calore PDC-01 (Inverter) P=22kW 400V 50Hz")', context);
assert.strictEqual(desc3, "Pompa Calore PDC-01 (Inverter)");

console.log("✓ Requirement 1 PASS: cleanUtenzaDescription isolates only the clean description string without circuit code or electrical ratios.");

// Test getScaleFactor
assert.strictEqual(vm.runInContext('getScaleFactor("1:1")', context), 1.0);
assert.strictEqual(vm.runInContext('getScaleFactor("1:2")', context), 0.5);
assert.strictEqual(vm.runInContext('getScaleFactor("1:5")', context), 0.2);
assert.strictEqual(vm.runInContext('getScaleFactor("1:10")', context), 0.1);
assert.strictEqual(vm.runInContext('getScaleFactor("1:20")', context), 0.05);
assert.strictEqual(vm.runInContext('getScaleFactor("1:50")', context), 0.02);
assert.strictEqual(vm.runInContext('getScaleFactor("1:100")', context), 0.01);
console.log("✓ Requirement 4A PASS: getScaleFactor correctly computes exact math scales.");

// Test exportAutoCADDXF with scale 1:1 vs 1:100
vm.runInContext(`
  state.width = 300;
  state.height = 75;
  state.cables = [
    { id: 1, code: "C-1", d: 20, x: 20, y: 10, sec: 16, type: "FG16M16", desc: "Alimentazione Boiler 15kW" }
  ];
`, context);

// Test 1:1
vm.runInContext(`
  state.scale = "1:1";
  var capturedDxf1_1 = null;
  Blob = class {
    constructor(parts) {
      capturedDxf1_1 = parts.join("");
    }
  };
  exportAutoCADDXF();
`, context);

const capturedDxf1_1 = vm.runInContext("capturedDxf1_1", context);
assert(capturedDxf1_1 !== null, "DXF at 1:1 generated");
assert(capturedDxf1_1.includes("300.000"), "DXF at 1:1 should contain tray base 300.000");

// Test 1:100
vm.runInContext(`
  state.scale = "1:100";
  var capturedDxf1_100 = null;
  Blob = class {
    constructor(parts) {
      capturedDxf1_100 = parts.join("");
    }
  };
  exportAutoCADDXF();
`, context);

const capturedDxf1_100 = vm.runInContext("capturedDxf1_100", context);
assert(capturedDxf1_100 !== null, "DXF at 1:100 generated");
// At 1:100, the 300mm tray base line goes from 0.000 to 3.000
assert(capturedDxf1_100.includes("3.000"), "DXF at 1:100 should contain scaled tray base 3.000");
assert(!capturedDxf1_100.includes("300.000"), "DXF at 1:100 must NOT contain unscaled 300.000 coordinates");

console.log("✓ Requirement 4B PASS: Real scale 1:100 scales CAD model entities so measuring the 300mm tray in AutoCAD yields 3.000 mm.");
console.log("\n>>> ALL 4 USER REQUIREMENTS VERIFIED SUCCESSFULLY! <<<");
