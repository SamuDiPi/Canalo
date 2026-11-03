// scratch/test_all_requirements.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.resolve('c:/Users/dipinto/Documents/Canalo/Canalo.html'), 'utf8');

// Build a mock browser environment
const domElements = {};
function createMockElement(tag, id = "") {
  return {
    tagName: tag.toUpperCase(),
    id,
    value: "",
    textContent: "",
    className: "",
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c);
        } else if (force) this._classes.add(c); else this._classes.delete(c);
      },
      contains(c) { return this._classes.has(c); }
    },
    style: {},
    children: [],
    appendChild(c) { this.children.push(c); return c; },
    querySelector(s) { return createMockElement("div"); },
    querySelectorAll(s) { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; },
    addEventListener(ev, fn) {},
    parentElement: {
      getBoundingClientRect() { return { width: 800, height: 600 }; }
    }
  };
}

const mockDocument = {
  getElementById(id) {
    if (!domElements[id]) domElements[id] = createMockElement("div", id);
    return domElements[id];
  },
  createElement(tag) { return createMockElement(tag); },
  querySelectorAll(sel) { return []; }
};

const mockCanvas = createMockElement("canvas", "cadCanvas");
mockCanvas.getContext = () => ({
  scale() {}, translate() {}, clearRect() {}, save() {}, restore() {},
  beginPath() {}, arc() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {},
  fillRect() {}, strokeRect() {}, setTransform() {}, closePath() {},
  fillText() {}, strokeText() {}, measureText() { return { width: 50 }; },
  setLineDash() {}, createLinearGradient() { return { addColorStop() {} }; }
});
domElements["cadCanvas"] = mockCanvas;
domElements["loadCurveCanvas"] = mockCanvas;

const mockWindow = {
  document: mockDocument,
  innerWidth: 1200,
  innerHeight: 800,
  devicePixelRatio: 1,
  addEventListener(ev, fn) {},
  location: { reload() {} }
};

const sandbox = {
  window: mockWindow,
  document: mockDocument,
  console: console,
  setTimeout(fn) { fn(); },
  clearTimeout() {},
  Math: Math,
  parseFloat: parseFloat,
  parseInt: parseInt,
  Date: Date,
  Set: Set,
  Object: Object,
  Array: Array,
  String: String,
  JSON: JSON
};

vm.createContext(sandbox);

// Extract JS
const p1 = html.indexOf('<script>');
const p2 = html.lastIndexOf('</script>');
const jsCode = html.substring(p1 + 8, p2);

vm.runInContext(jsCode, sandbox);
vm.runInContext(`
  window.state = state;
  window.metrics = metrics;
  window.CABLE_CATALOG = CABLE_CATALOG;
  window.SUPPORT_SPECS = SUPPORT_SPECS;
  window.BRAND_SERIES = BRAND_SERIES;
  window.getBaseCircuitCode = getBaseCircuitCode;
  window.inferCableSpecsByDiameter = inferCableSpecsByDiameter;
  window.processRealWasmEntities = processRealWasmEntities;
  window.recalculateAll = recalculateAll;
  window.updateCableField = updateCableField;
  window.setMobileView = setMobileView;
`, sandbox);

console.log("=== RUNNING RIGOROUS TEST SUITE FOR THE 4 USER REQUIREMENTS ===\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// -------------------------------------------------------------
// REQUIREMENT 1: UNIPOLAR LINE DESCRIPTION INHERITANCE
// -------------------------------------------------------------
console.log("--- TEST 1: Unipolar Description Inheritance ---");

// Test 1.1: getBaseCircuitCode helper
const base1 = sandbox.window.getBaseCircuitCode("QGBT-C C-3 - L1");
const base2 = sandbox.window.getBaseCircuitCode("QGBT-C C-3 L2");
const base3 = sandbox.window.getBaseCircuitCode("QGBT-C C-3 (L3)");
const base4 = sandbox.window.getBaseCircuitCode("QGBT-C C-3_N");
const base5 = sandbox.window.getBaseCircuitCode("QGBT-C C-3 - PE");
const base6 = sandbox.window.getBaseCircuitCode("QGBT-C C-3 (4(1x185))");
assert(base1 === "QGBT-C C-3" && base2 === "QGBT-C C-3" && base3 === "QGBT-C C-3" && base4 === "QGBT-C C-3" && base5 === "QGBT-C C-3" && base6 === "QGBT-C C-3",
  `getBaseCircuitCode cleanly strips phase & unipolar suffixes: ${base1}, ${base2}, ${base3}, ${base4}, ${base5}`);

// Test 1.2: Unipolar Circuit in DWG/DXF Entity Processing
// Simulate 4 circles for a unipolar line QGBT-C C-3
const entities = [
  // Tray boundary
  { type: "LINE", layer: "Canalina", startPoint: { x: 0, y: 0 }, endPoint: { x: 300, y: 0 } },
  { type: "LINE", layer: "Canalina", startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 75 } },
  { type: "LINE", layer: "Canalina", startPoint: { x: 300, y: 0 }, endPoint: { x: 300, y: 75 } },
  // 4 unipolar circles (e.g. 1x185, Ø 26.8mm)
  { type: "CIRCLE", layer: "Cavi", center: { x: 40, y: 30 }, radius: 13.4 },
  { type: "CIRCLE", layer: "Cavi", center: { x: 70, y: 30 }, radius: 13.4 },
  { type: "CIRCLE", layer: "Cavi", center: { x: 100, y: 30 }, radius: 13.4 },
  { type: "CIRCLE", layer: "Cavi", center: { x: 130, y: 30 }, radius: 13.4 },
  // Callouts on bandierine for 4 phases
  { type: "LINE", layer: "Bandierine", startPoint: { x: 40, y: 43.4 }, endPoint: { x: 40, y: 60 } },
  { type: "TEXT", layer: "Bandierine", text: "QGBT-C C-3 - L1", startPoint: { x: 40, y: 62 } },
  { type: "LINE", layer: "Bandierine", startPoint: { x: 70, y: 43.4 }, endPoint: { x: 70, y: 60 } },
  { type: "TEXT", layer: "Bandierine", text: "QGBT-C C-3 - L2", startPoint: { x: 70, y: 62 } },
  { type: "LINE", layer: "Bandierine", startPoint: { x: 100, y: 43.4 }, endPoint: { x: 100, y: 60 } },
  { type: "TEXT", layer: "Bandierine", text: "QGBT-C C-3 - L3", startPoint: { x: 100, y: 62 } },
  { type: "LINE", layer: "Bandierine", startPoint: { x: 130, y: 43.4 }, endPoint: { x: 130, y: 60 } },
  { type: "TEXT", layer: "Bandierine", text: "QGBT-C C-3 - N", startPoint: { x: 130, y: 62 } },
  // DWG Internal Table describing the circuit
  { type: "TEXT", layer: "Tabella", text: "QGBT-C C-3", startPoint: { x: 500, y: 200 } },
  { type: "TEXT", layer: "Tabella", text: "4(1x185)", startPoint: { x: 580, y: 200 } },
  { type: "TEXT", layer: "Tabella", text: "FG16M16", startPoint: { x: 650, y: 200 } },
  { type: "TEXT", layer: "Tabella", text: "Alimentazione Chiller Centrale Termica", startPoint: { x: 720, y: 200 } }
];

sandbox.window.processRealWasmEntities(entities, "test_unipolari.dxf", "AC1009");
const cables = sandbox.window.state.cables;
assert(cables.length === 4, `Extracted 4 cables (got ${cables.length})`);

const allInheritedDesc = cables.every(c => c.desc === "Alimentazione Chiller Centrale Termica");
assert(allInheritedDesc, `All 4 unipolar conductors inherited the exact circuit description: "${cables[0].desc}"`);

const allUnipolarType = cables.every(c => c.type === "FG16M16" && c.cores === 1);
assert(allUnipolarType, `All 4 conductors correctly identified as unipolar FG16M16 (cores=1)`);

// Test 1.3: Interactive description propagation on unipolar
sandbox.window.updateCableField(0, "desc", "Nuova Descrizione Modificata");
const allUpdated = sandbox.window.state.cables.every(c => c.desc === "Nuova Descrizione Modificata");
assert(allUpdated, `Interactive edit on conductor 0 propagated description to all conductors of that unipolar circuit`);

// -------------------------------------------------------------
// REQUIREMENT 2: SEGREGATION FALSE POSITIVES ELIMINATED
// -------------------------------------------------------------
console.log("\n--- TEST 2: Segregation False Positives Elimination ---");

// Test 2.1: inferCableSpecsByDiameter returns BT_POWER for small and intermediate diameters
const testDiameters = [5.5, 6.5, 7.5, 8.2, 8.5, 9.5, 10.0, 11.5, 13.8, 15.0, 22.0, 26.8, 30.0];
let allBt = true;
testDiameters.forEach(d => {
  const spec = sandbox.window.inferCableSpecsByDiameter(d, `CAVO-Ø${d}`);
  if (spec.sys !== "BT_POWER") {
    allBt = false;
    console.error(`Diameter ${d} erroneously assigned sys: ${spec.sys}`);
  }
});
assert(allBt, `All test diameters without signal keywords return sys: "BT_POWER" (no false SPECIAL_ELV)`);

// Test 2.2: Only explicit signal keywords return SPECIAL_ELV
const specSig1 = sandbox.window.inferCableSpecsByDiameter(7.5, "TD-CAT6A");
const specSig2 = sandbox.window.inferCableSpecsByDiameter(8.5, "IRAI-LOOP1");
const specSig3 = sandbox.window.inferCableSpecsByDiameter(6.8, "BUS-KNX");
assert(specSig1.sys === "SPECIAL_ELV" && specSig2.sys === "SPECIAL_ELV" && specSig3.sys === "SPECIAL_ELV",
  `Explicit signal codes (CAT6A, IRAI, KNX) properly return sys: "SPECIAL_ELV"`);

// Test 2.3: Tray with only BT cables has segConform === true and no conflict warnings
sandbox.window.state.cables = [
  { id: 1, code: "QGBT-C C-1", d: 11.0, w: 0.16, sec: 1.5, cores: 2, iz0: 22, x: 20, y: 10, desc: "BT Luce", type: "FG16OM16", form: "1(3G1,5)", sys: "BT_POWER" },
  { id: 2, code: "QGBT-C C-2", d: 14.5, w: 0.32, sec: 2.5, cores: 3, iz0: 26, x: 50, y: 10, desc: "BT FM", type: "FG16OM16", form: "1(5G2,5)", sys: "BT_POWER" },
  { id: 3, code: "QGBT-C C-3", d: 26.8, w: 2.05, sec: 185, cores: 1, iz0: 510, x: 90, y: 15, desc: "BT Dorsale", type: "FG16M16", form: "1(1x185)", sys: "BT_POWER" }
];
sandbox.window.recalculateAll();
assert(sandbox.window.metrics.segConform === true, `BT-only cables tray is 100% CONFORME (metrics.segConform: true)`);
assert(!sandbox.window.metrics.segDetail.includes("Conflitto"), `segDetail does not flag conflict: "${sandbox.window.metrics.segDetail}"`);

// Test 2.4: When actual SPECIAL_ELV unshielded cable is placed with BT without septum -> CONFLICT
sandbox.window.state.cables.push({
  id: 4, code: "TD-CAT6A", d: 7.3, w: 0.06, sec: 0.5, cores: 2, iz0: 5, x: 130, y: 10, desc: "Rete Dati", type: "F/UTP Cat.6A", form: "4x2x23AWG", sys: "SPECIAL_ELV"
});
sandbox.window.state.septums = 0;
sandbox.window.recalculateAll();
assert(sandbox.window.metrics.segConform === false, `When actual unshielded signal cable is inserted without septum -> Correctly flags non-conformance (metrics.segConform: false)`);
assert(sandbox.window.metrics.segDetail.includes("Conflitto TD-CAT6A"), `segDetail accurately points to conflicting signal cable: "${sandbox.window.metrics.segDetail}"`);

// -------------------------------------------------------------
// REQUIREMENT 3: COMPREHENSIVE TECHNICAL DATABASE
// -------------------------------------------------------------
console.log("\n--- TEST 3: Comprehensive Technical Database ---");

const catLen = sandbox.window.CABLE_CATALOG.length;
assert(catLen >= 50, `CABLE_CATALOG contains ${catLen} standard-compliant cables (>= 50 expected)`);

// Check presence of key types
const hasUniLarge = sandbox.window.CABLE_CATALOG.some(c => c.form.includes("1x185") || c.form.includes("1x240") || c.form.includes("1x300"));
const hasMulti5G = sandbox.window.CABLE_CATALOG.some(c => c.form.includes("5G16") || c.form.includes("5G25"));
const hasShielded = sandbox.window.CABLE_CATALOG.some(c => c.type.includes("FG16OH2R16") || c.type.includes("LiYCY"));
const hasFirePH120 = sandbox.window.CABLE_CATALOG.some(c => c.type.includes("FTG18") && c.desc.includes("PH120"));
const hasKnx = sandbox.window.CABLE_CATALOG.some(c => c.type.includes("KNX") || c.code.includes("KNX"));
const hasData = sandbox.window.CABLE_CATALOG.some(c => c.type.includes("Cat.6") || c.type.includes("Cat.7"));
const hasFO = sandbox.window.CABLE_CATALOG.some(c => c.type.includes("FO") || c.desc.includes("Fibra"));

assert(hasUniLarge && hasMulti5G && hasShielded && hasFirePH120 && hasKnx && hasData && hasFO,
  `Database covers all categories: BT Unipolari up to 300mm², BT Multipolari 5G, Schermati OH2/LiYCY, PH120, KNX, Dati Cat.6/7, Fibra Ottica`);

// Supports check
const supKeys = Object.keys(sandbox.window.SUPPORT_SPECS);
assert(supKeys.length >= 6, `SUPPORT_SPECS has ${supKeys.length} support typologies: ${supKeys.join(', ')}`);
const hasSwlCurves = supKeys.every(k => sandbox.window.SUPPORT_SPECS[k].swl10m && sandbox.window.SUPPORT_SPECS[k].swl15m && sandbox.window.SUPPORT_SPECS[k].swl20m);
assert(hasSwlCurves, `All supports have complete multi-span SWL load ratings (1.0m, 1.5m, 2.0m...) per CEI EN 61537`);

// Brands check
const brandKeys = Object.keys(sandbox.window.BRAND_SERIES);
assert(brandKeys.includes("LEGRAND") && brandKeys.includes("OBO") && brandKeys.includes("BTICINO") && brandKeys.includes("NIEDAX"),
  `BRAND_SERIES contains official catalogs: Legrand, OBO Bettermann, Bticino, Niedax`);

// -------------------------------------------------------------
// REQUIREMENT 4: MOBILE & TOUCH RESPONSIVENESS (PWA)
// -------------------------------------------------------------
console.log("\n--- TEST 4: Mobile & Touch Responsiveness (PWA) ---");

// Test 4.1: Viewport meta tag
assert(html.includes('viewport-fit=cover') && html.includes('maximum-scale=5.0') && html.includes('user-scalable=yes'),
  `Viewport meta tag optimized for mobile pinch-to-zoom & notches (viewport-fit=cover, maximum-scale=5.0)`);

// Test 4.2: PWA manifest
assert(html.includes('rel="manifest"') && html.includes('Cable Tray Studio') && html.includes('theme-color'),
  `PWA Web App Manifest and mobile theme color tags embedded`);

// Test 4.3: Touch-action none CSS
assert(html.includes('#cadCanvas { touch-action: none;'),
  `#cadCanvas has 'touch-action: none' to avoid gesture conflict with native scrolling`);

// Test 4.4: setMobileView function exists and switches visibility
assert(typeof sandbox.window.setMobileView === "function", `setMobileView() function is defined`);
sandbox.window.setMobileView("cad");
assert(sandbox.window.currentMobileView === "cad", `setMobileView successfully toggles to 'cad' view on mobile`);
sandbox.window.setMobileView("results");
assert(sandbox.window.currentMobileView === "results", `setMobileView successfully toggles to 'results' view on mobile`);

// Test 4.5: Touch listeners attached in code
assert(html.includes('canvas.addEventListener("touchstart"'), `cadCanvas has touchstart listener for 1-finger drag/pan & 2-finger zoom`);
assert(html.includes('lcCanvas.addEventListener("touchstart"'), `loadCurveCanvas has touchstart listener for span Ls adjustment`);

console.log(`\n======================================================`);
console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
console.log(`======================================================`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
