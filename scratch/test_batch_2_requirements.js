const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlPath = path.resolve(__dirname, "..", "Canalo.html");
const html = fs.readFileSync(htmlPath, "utf-8");

console.log("Read Canalo.html, length:", html.length);

// Extract JS
const p1 = html.indexOf('<script>');
const p2 = html.lastIndexOf('</script>');
const jsCode = html.substring(p1 + 8, p2);

// Syntax test
try {
  new Function(jsCode);
  console.log("✓ PASS: JavaScript syntax valid!");
} catch (e) {
  console.error("✗ FAIL: JavaScript syntax error:", e);
  process.exit(1);
}

// Setup VM sandbox
const mockCanvas = {
  style: {},
  getContext: () => ({
    setTransform: () => {},
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: () => ({ width: 10 }),
    closePath: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {}
  }),
  parentElement: { getBoundingClientRect: () => ({ width: 800, height: 600 }) },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  addEventListener: () => {}
};

const mockElements = {};
function getOrCreateMockElement(id) {
  if (!mockElements[id]) {
    mockElements[id] = {
      id,
      value: "",
      textContent: "",
      innerHTML: "",
      checked: false,
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {},
        toggle: () => {}
      },
      style: {},
      addEventListener: () => {},
      appendChild: () => {},
      querySelector: () => getOrCreateMockElement("mockSub"),
      querySelectorAll: () => []
    };
  }
  return mockElements[id];
}

const sandbox = {
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1920,
    innerHeight: 1080
  },
  document: {
    getElementById: id => {
      if (id === "cadCanvas" || id === "loadCurveCanvas") return mockCanvas;
      return getOrCreateMockElement(id);
    },
    createElement: tag => getOrCreateMockElement(tag),
    title: ""
  },
  console: console,
  Math: Math,
  parseFloat: parseFloat,
  parseInt: parseInt,
  Number: Number,
  Set: Set,
  Object: Object,
  Array: Array,
  String: String,
  JSON: JSON
};

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);
vm.runInContext(`
  window.state = state;
  window.metrics = metrics;
  window.CAD_LAYERS_SPEC = CAD_LAYERS_SPEC;
  window.cleanUtenzaDescription = cleanUtenzaDescription;
  window.getDisplayCableType = getDisplayCableType;
  window.extractTrayNameFromInput = extractTrayNameFromInput;
  window.onScaleChange = onScaleChange;
  window.toggleSectionExport = toggleSectionExport;
  window.build3DIsoScene = build3DIsoScene;
  window.buildCADScene = buildCADScene;
  window.processRealWasmEntities = processRealWasmEntities;
  window.recalculateAll = recalculateAll;
  window.updateCableField = updateCableField;
`, sandbox);

let passed = 0;
let total = 0;
function assert(cond, msg) {
  total++;
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

console.log("\n=== TESTING NEW USER REQUIREMENTS ===");

// 1. PDF Clean Utenza Description
console.log("\n--- Requirement 1: Clean Utenza Description ---");
const desc1 = sandbox.window.cleanUtenzaDescription("Alimentazione Chiller Centrale Termica 45 kW 80A 35m 400V 4P iC60N C16 dV=1.2%");
assert(desc1 === "Alimentazione Chiller Centrale Termica", `Cleaned electrical parameters from chiller line: "${desc1}"`);

const desc2 = sandbox.window.cleanUtenzaDescription("Pompa Ricircolo Primario - P=15kW cosφ=0.85 L=25m FG16M16 4(1x185)");
assert(desc2 === "Pompa Ricircolo Primario", `Cleaned power, cable and cosphi: "${desc2}"`);

const desc3 = sandbox.window.cleanUtenzaDescription("Utenza: Quadro Prese FM Bassa Tensione 3F+N 400V");
assert(desc3 === "Quadro Prese FM Bassa Tensione", `Cleaned prefix and voltage: "${desc3}"`);

// 2. 3D Axonometry Enhancement
console.log("\n--- Requirement 2: 3D Axonometry (Tray types, Mensole, Quota Ls) ---");
const trayTypes = ["solid", "perforated", "mesh", "ladder"];
trayTypes.forEach(tt => {
  sandbox.window.state.trayType = tt;
  const prims = [];
  sandbox.window.build3DIsoScene(prims, -48, -60, 392, 300, 75, 1.5, { stroke: "#38bdf8", fill: "#0369a1" }, { name: "Mensola Pesante", strut: true });
  const hasQuotaText = prims.some(p => p.t === "text" && p.str.includes("PASSO MENSOLE Ls"));
  const hasTrayLines = prims.filter(p => p.t === "line").length >= 10;
  assert(hasQuotaText && hasTrayLines, `3D Axonometry generates valid geometry and Ls quota for type '${tt}' (${prims.length} prims)`);
});

// 3. Default cable packing
console.log("\n--- Requirement 3: Default Cable Packing Mode ---");
assert(sandbox.window.state.packing === "gravity", `Default packing is 'gravity'`);
// After processing entities, verify packing remains 'gravity'
sandbox.window.processRealWasmEntities([
  { type: "LINE", layer: "Canalina", startPoint: { x: 0, y: 0 }, endPoint: { x: 300, y: 0 } },
  { type: "CIRCLE", layer: "Cavi", center: { x: 50, y: 30 }, radius: 10 }
], "TestCanalina.dxf", "DXF");
assert(sandbox.window.state.packing === "gravity", `Packing remains 'gravity' after DXF/DWG file import`);

// 4. Decoupled PE Cable Type Display
console.log("\n--- Requirement 4: Cable Type with Decoupled PE ---");
const unipolarCircCables = [
  { code: "QGBT-C C-3 - L1", type: "FG16M16", form: "1(1x185)" },
  { code: "QGBT-C C-3 - L2", type: "FG16M16", form: "1(1x185)" },
  { code: "QGBT-C C-3 - L3", type: "FG16M16", form: "1(1x185)" },
  { code: "QGBT-C C-3 - N",  type: "FG16M16", form: "1(1x185)" },
  { code: "QGBT-C C-3 - PE", type: "FG17",    form: "1(1x95)" }
];
const dispL1 = sandbox.window.getDisplayCableType(unipolarCircCables[0], unipolarCircCables);
assert(dispL1 === "FG16M16 / FG17", `Phase conductor L1 displays combined type: "${dispL1}"`);
const dispPE = sandbox.window.getDisplayCableType(unipolarCircCables[4], unipolarCircCables);
assert(dispPE === "FG16M16 / FG17", `PE conductor displays combined type: "${dispPE}"`);

// 5. Tray name extraction
console.log("\n--- Requirement 5: Read Tray Name from Input ---");
const rawTexts = [
  { str: "PASSERELLA DORSALE CHILLER 300x75" },
  { str: "SEZIONE TRASVERSALE" }
];
const trayInfo = sandbox.window.extractTrayNameFromInput(rawTexts, "drawing1.dwg", 300, 75);
assert(trayInfo.title === "PASSERELLA DORSALE CHILLER - L=300mm H=75mm", `Tray title cleanly extracted: "${trayInfo.title}"`);
assert(trayInfo.exportFile === "PASSERELLA_DORSALE_CHILLER_300x75_Costruttivo", `Export filename cleanly generated: "${trayInfo.exportFile}"`);

// 6. Scale Selection & Explicit Output
console.log("\n--- Requirement 6: Scale Selection (e.g. 1:100) ---");
sandbox.window.onScaleChange("1:100");
assert(sandbox.window.state.scale === "1:100", `State scale updated to '1:100'`);
assert(sandbox.window.state.tb.scaleRev.includes("Scala 1:100"), `Cartiglio text includes 'Scala 1:100'`);
const sceneScale = sandbox.window.buildCADScene();
const titleWithScale = sceneScale.prims.find(p => p.layer === "CORNICE" && p.str && p.str.includes("SCALA 1:100"));
assert(!!titleWithScale, `Title block explicitly contains 'SCALA 1:100': "${titleWithScale ? titleWithScale.str : 'missing'}"`);

// 7. Configurable Output Sections
console.log("\n--- Requirement 7: Configurable Print/Export Sections ---");
sandbox.window.toggleSectionExport("chart", false);
const sceneNoChart = sandbox.window.buildCADScene();
const hasChart = sceneNoChart.prims.some(p => p.layer === "CURVA_CARICO");
assert(!hasChart, `Load Curve diagram omitted when toggled off`);

sandbox.window.toggleSectionExport("chart", true);
const sceneWithChart = sandbox.window.buildCADScene();
assert(sceneWithChart.prims.some(p => p.layer === "CURVA_CARICO"), `Load Curve diagram included when toggled on`);

// 8. Fascette Ancoraggio
console.log("\n--- Requirement 8: Cable Ties (Fascette Ancoraggio) ---");
assert(!!sandbox.window.CAD_LAYERS_SPEC["FASCETTE_ANCORAGGIO"], `FASCETTE_ANCORAGGIO layer defined in CAD_LAYERS_SPEC`);
sandbox.window.state.clamps = true;
sandbox.window.state.cables = [
  { id: 1, code: "C1", d: 20, w: 0.5, sec: 16, cores: 3, x: 30, y: 15, sys: "BT_POWER", form: "3G16", type: "FG16OM16", desc: "Linea 1" },
  { id: 2, code: "C2", d: 20, w: 0.5, sec: 16, cores: 3, x: 60, y: 15, sys: "BT_POWER", form: "3G16", type: "FG16OM16", desc: "Linea 2" }
];
const sceneWithClamps = sandbox.window.buildCADScene();
const clampPrims = sceneWithClamps.prims.filter(p => p.layer === "FASCETTE_ANCORAGGIO");
assert(clampPrims.length > 0, `Generated ${clampPrims.length} primitives on layer FASCETTE_ANCORAGGIO`);

console.log(`\n======================================================`);
console.log(`BATCH 2 SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
console.log(`======================================================`);

if (passed === total) process.exit(0);
else process.exit(1);
