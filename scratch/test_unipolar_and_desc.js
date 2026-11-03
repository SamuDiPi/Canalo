const assert = require("assert");

function cleanUtenzaDescription(raw) {
  if (!raw) return "";
  let s = String(raw).replace(/\r?\n/g, " ").trim();
  s = s.replace(/^(?:Descrizione(?:\s*(?:utenza|circuito|linea))?|Designazione|Utenza|Oggetto)\s*[:=-]\s*/i, "");
  return s.replace(/\s{2,}/g, " ").trim();
}

function getBaseCircuitCode(code) {
  if (!code) return "";
  let s = String(code).trim();
  s = s.replace(/\s*[-_./]?\s*(?:(?:FASE|FASI|F)\s*[123RSTUVW]|L[123]|N(?:EUTRO)?|PE|TERRA|G\/V|GV)\b/gi, "");
  s = s.replace(/\s*[-_./]?\s*cavi?$/i, "");
  return s.trim();
}

const unifilareDict = {
  "QGBT-P C-22": {
    rawCode: "QGBT-P C-22",
    desc: "Alimentazione Boiler (Accumulo ACS) 15kW 400V - Quadro Q-ACS",
    cable: "FG16M16",
    peCable: "FG17",
    form: "1X185",
    ib: 320
  }
};

const cables = [
  { code: "QGBT-P C-22 L1", desc: "Cavo L1", type: "FG16M16" },
  { code: "QGBT-P C-22 L2", desc: "Cavo L2", type: "FG16M16" },
  { code: "QGBT-P C-22 L3", desc: "Cavo L3", type: "FG16M16" },
  { code: "QGBT-P C-22 N", desc: "Cavo N", type: "FG16M16" },
  { code: "QGBT-P C-22 PE", desc: "Cavo PE", type: "FG17" }
];

cables.forEach(c => {
  const base = getBaseCircuitCode(c.code);
  const u = unifilareDict[c.code] || unifilareDict[base];
  if (u) {
    if (u.desc) c.desc = u.desc;
  }
});

cables.forEach(c => {
  assert.strictEqual(c.desc, "Alimentazione Boiler (Accumulo ACS) 15kW 400V - Quadro Q-ACS");
});

console.log("✓ All unipolar conductors successfully inherited 100% full description verbatim!");

