const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlPath = path.resolve(__dirname, "..", "Canalo.html");
const html = fs.readFileSync(htmlPath, "utf-8");

const p1 = html.indexOf('<script>');
const p2 = html.lastIndexOf('</script>');
const jsCode = html.substring(p1 + 8, p2);

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

let downloadedBlobContent = null;
let downloadedFileName = null;

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
    createElement: tag => {
      const el = getOrCreateMockElement(tag);
      if (tag === "a") {
        el.click = () => {
          downloadedFileName = el.download;
        };
      }
      return el;
    },
    title: ""
  },
  Blob: class {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      downloadedBlobContent = parts.join("");
    }
  },
  URL: {
    createObjectURL: () => "blob:mock-url"
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
  window.recalculateAll = recalculateAll;
  window.exportAutoCADDXF = exportAutoCADDXF;
`, sandbox);

// Set up cables and clamps
sandbox.window.state.title = "PASSERELLA DORSALE CHILLER - L=300mm H=75mm";
sandbox.window.state.scale = "1:100";
sandbox.window.state.width = 300;
sandbox.window.state.height = 75;
sandbox.window.state.clamps = true;
sandbox.window.state.cables = [
  { id: 1, code: "QGBT-C C-3 - L1", d: 26.8, w: 2.05, sec: 185, cores: 1, x: 50, y: 15, sys: "BT_POWER", form: "1(1x185)", type: "FG16M16", desc: "Chiller" },
  { id: 2, code: "QGBT-C C-3 - L2", d: 26.8, w: 2.05, sec: 185, cores: 1, x: 80, y: 15, sys: "BT_POWER", form: "1(1x185)", type: "FG16M16", desc: "Chiller" },
  { id: 3, code: "QGBT-C C-3 - PE", d: 18.0, w: 1.05, sec: 95,  cores: 1, x: 110, y: 15, sys: "BT_POWER", form: "1(1x95)",  type: "FG17",    desc: "Chiller" }
];
sandbox.document.getElementById("exportName").value = "PASSERELLA_DORSALE_CHILLER_300x75_Costruttivo";

sandbox.window.recalculateAll();
sandbox.window.exportAutoCADDXF();

console.log("Downloaded file name:", downloadedFileName);
if (!downloadedBlobContent) {
  console.error("DXF Blob was not created!");
  process.exit(1);
}

const dxf = downloadedBlobContent;
console.log("DXF length:", dxf.length);

// Checks
const hasAC1009 = dxf.includes("AC1009");
const hasFascetteLayer = dxf.includes("FASCETTE_ANCORAGGIO");
const hasScaleInTitle = dxf.includes("SCALA 1:100");
const hasDecoupledPE = dxf.includes("FG16M16 / FG17");
const hasEOF = dxf.trim().endsWith("EOF");

console.log("Has AC1009 header:", hasAC1009);
console.log("Has FASCETTE_ANCORAGGIO layer in tables and entities:", hasFascetteLayer);
console.log("Has SCALA 1:100 in text:", hasScaleInTitle);
console.log("Has FG16M16 / FG17 in table text:", hasDecoupledPE);
console.log("Ends cleanly with EOF:", hasEOF);

if (hasAC1009 && hasFascetteLayer && hasScaleInTitle && hasDecoupledPE && hasEOF) {
  console.log("✓ ALL DXF INTEGRITY CHECKS PASSED 100%!");
  process.exit(0);
} else {
  console.error("✗ DXF check failed!");
  process.exit(1);
}
