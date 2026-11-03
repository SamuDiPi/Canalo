const assert = require("assert");

// 1. TEST TRAY TITLE EXTRACTION
function extractTrayNameFromInput(rawTexts, fileName, width = 200, height = 75) {
  let foundName = null;

  if (Array.isArray(rawTexts) && rawTexts.length > 0) {
    // REGEX PRIORITARIA: cerca diciture come "Dati caratteristici della canalina (Anello PT - Lato DX)"
    for (const t of rawTexts) {
      const s = String(t.str || "").trim();
      // Caso 1: Nome racchiuso tra parentesi dopo "Dati caratteristici..." o "Canalina/Passerella/Canale"
      const mParen = s.match(/(?:Dati\s+caratteristici\s+(?:della\s+)?(?:canalina|passerella|canale)|(?:canalina|passerella|canale|condotto|sezione))\s*[^(]*\(([^)]+)\)/i);
      if (mParen && mParen[1] && mParen[1].trim().length >= 2) {
        foundName = mParen[1].trim();
        break;
      }
      // Caso 1B: qualsiasi parentesi contenente testo descrittivo non numerico accanto alla canalina
      if (/canalina|passerella|canale/i.test(s)) {
        const mAnyParen = s.match(/\(([A-Za-z0-9\s-_/.]+)\)/);
        if (mAnyParen && mAnyParen[1] && !/^\d+[xX]\d+/i.test(mAnyParen[1]) && mAnyParen[1].trim().length >= 3) {
          foundName = mAnyParen[1].trim();
          break;
        }
      }
    }

    // Se non trovato con parentesi, cerca etichette esplicite
    if (!foundName) {
      const p1 = rawTexts.find(t => /^(?:CANALINA|CANALE|PASSERELLA|CONDOTTO|TRONCO)\s+([A-Za-z0-9_\-./\s]{2,40})/i.test(t.str.trim()));
      if (p1) foundName = p1.str.trim();
    }

    if (!foundName) {
      const p4 = rawTexts.find(t => /^(?:OGGETTO|TITOLO|ELABORATO)\s*[:=-]\s*(.+)/i.test(t.str.trim()));
      if (p4) {
        const m = p4.str.trim().match(/^(?:OGGETTO|TITOLO|ELABORATO)\s*[:=-]\s*(.+)/i);
        if (m && m[1]) foundName = m[1].trim();
      }
    }
  }

  let cleanBase = foundName ? foundName : (fileName || "CANALINA").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, " ").trim().toUpperCase();
  cleanBase = cleanBase.replace(/\s*-\s*L=\s*\d+\s*mm\s*H=\s*\d+\s*mm/i, "")
                      .replace(/\b\d+\s*[xX]\s*\d+(?:\s*mm)?\b/gi, "")
                      .replace(/L=\s*\d+\s*mm/i, "")
                      .replace(/H=\s*\d+\s*mm/i, "")
                      .trim();
  if (!cleanBase) cleanBase = "CANALINA 01";

  const title = `${cleanBase} - L=${width}mm H=${height}mm`;
  const exportFile = cleanBase.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") + `_${width}x${height}_Costruttivo`;
  return { title, exportFile, cleanBase };
}

// Test User Example: "Dati caratteristici della canalina (Anello PT - Lato DX)"
const inputTexts = [
  { str: "Dati caratteristici della canalina (Anello PT - Lato DX)" },
  { str: "Scala 1:1" }
];
const res = extractTrayNameFromInput(inputTexts, "disegno.dwg", 300, 75);
console.log("Extracted title:", res.title);
console.log("Clean base name:", res.cleanBase);
console.log("Export filename:", res.exportFile);

assert.strictEqual(res.cleanBase, "Anello PT - Lato DX");
assert.strictEqual(res.title, "Anello PT - Lato DX - L=300mm H=75mm");
assert.strictEqual(res.exportFile, "Anello_PT_Lato_DX_300x75_Costruttivo");
console.log("✓ PASS: Tray name extraction perfectly matches user requirement!");

// 2. TEST UNIFILARE MATCHING AND CLEAN DESCRIPTION
function normalizeLineKey(str) {
  return String(str || "").trim().replace(/\s+/g, " ").toUpperCase();
}

function getBaseCircuitCode(str) {
  let s = String(str || "").trim();
  s = s.replace(/\s*\(\s*\d*\(?\d+[xXGg]\d+(?:[.,]\d+)?\)?\s*\)\s*$/i, "").trim();
  if (/^CAVO-\d+$/i.test(s)) return s;
  s = s.replace(/(?:[-_/\s]+(?:(?:FASE|COND|POLO)\s*)?(?:L[123]|F[123]|R|S|T|N|PE|TERRA)|[./]\d+|\(\s*(?:L[123]|F[123]|R|S|T|N|PE|TERRA|[1-9])\s*\))$/i, "").trim();
  return s;
}

let unifilareDict = {};

function findInUnifilareDict(codeStr) {
  if (!codeStr) return null;
  const k1 = normalizeLineKey(codeStr);
  if (unifilareDict[k1]) return unifilareDict[k1];

  const base = getBaseCircuitCode(codeStr);
  const kBase = normalizeLineKey(base);
  if (unifilareDict[kBase]) return unifilareDict[kBase];

  const kCompact = k1.replace(/[^A-Z0-9]/g, "");
  const kBaseCompact = kBase.replace(/[^A-Z0-9]/g, "");
  for (const [k, val] of Object.entries(unifilareDict)) {
    const c = k.replace(/[^A-Z0-9]/g, "");
    if (c === kCompact || c === kBaseCompact) return val;
  }

  // Corrispondenza per numero circuito C-xx o L-xx
  const mCircNum = base.match(/\b(?:C|L)-?(\d+)\b/i) || codeStr.match(/\b(?:C|L)-?(\d+)\b/i);
  if (mCircNum) {
    const num = parseInt(mCircNum[1], 10);
    for (const [k, val] of Object.entries(unifilareDict)) {
      const mk = k.match(/\b(?:C|L)-?(\d+)\b/i);
      if (mk && parseInt(mk[1], 10) === num) return val;
    }
  }
  return null;
}

function cleanUtenzaDescription(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  s = s.replace(/^(?:Descrizione(?:\s*utenza)?|Utenza|Linea|Nome\s*circuito)\s*[:=-]\s*/i, "");
  // Rimuove riferimenti a sigle circuito o quadri (es. "C-3", "QGBT-C C-3", "(C-3)")
  s = s.replace(/\b(?:Q[A-Z0-9_.-]+\s+)?C-?\d+\b/gi, "");
  s = s.replace(/\([A-Z0-9_.-]*C-?\d+[A-Z0-9_.-]*\)/gi, "");
  // Rimuove grandezze elettriche
  s = s.replace(/\b(?:P\s*=\s*)?\d+(?:[.,]\d+)?\s*(?:k?W|k?VA|k?VAR)\b/gi, "");
  s = s.replace(/\b(?:I[nbd]|Idn|Icu|Ics|Icn)\s*=\s*\d+(?:[.,]\d+)?\s*(?:m?A|kA)?\b/gi, "");
  s = s.replace(/\b\d+(?:[.,]\d+)?\s*(?:kA|mA|A)\b/gi, "");
  s = s.replace(/\b(?:400|230|110|24)\s*V\b/gi, "");
  s = s.replace(/\b50\s*Hz\b/gi, "");
  s = s.replace(/\b(?:3F\+N|3P\+N|1F\+N|1P\+N|[1-4]P)\b/gi, "");
  s = s.replace(/\b(?:L\s*=\s*)?\d+(?:[.,]\d+)?\s*m\b/gi, "");
  s = s.replace(/\b(?:d[vV]|Δ[vV])?\s*=?\s*\d+(?:[.,]\d+)?\s*%/gi, "");
  s = s.replace(/\bcos\s*[\u03c6phi]\s*=?\s*\d*(?:[.,]\d+)?\b/gi, "");
  s = s.replace(/\b[BCD]\d{1,3}\b/g, "");
  s = s.replace(/\b(?:Curva|Curve)\s*[BCD]\b/gi, "");
  s = s.replace(/\b(?:iC60[A-Z]?|NSX\d*|Tmax(?:\s*XT\d?)?|S200|DS200)\b/gi, "");
  s = s.replace(/\b(?:FG16[A-Z0-9]*|FTG18[A-Z0-9]*|FS17|FG17|H07[A-Z0-9-]*|H1Z2Z2-K|RG16[A-Z0-9]*)\b/gi, "");
  s = s.replace(/\b(?:0[.,]6\/1\s*kV|1\s*kV|LSZH|CPR|Cca|Eca|B2ca)\b/gi, "");
  s = s.replace(/\b\d+\s*\([0-9xXGg,+]+\)|\b[1-5][xXGg]\d+(?:[.,]\d+)?\b/g, "");
  s = s.replace(/^[-\s|/,.:;]+|[-\s|/,.:;]+$/g, "");
  s = s.replace(/\s*\|\s*/g, " - ");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

// Inseriamo nel dizionario del PDF la linea con codice semplice "C-3"
unifilareDict["C-3"] = {
  rawCode: "C-3",
  desc: cleanUtenzaDescription("Alimentazione Boiler 15kW 400V C16 4(1x185)"),
  cable: "FG16M16",
  form: "4(1x185)",
  ib: 25
};

console.log("Unifilare dict C-3 desc:", unifilareDict["C-3"].desc);
assert.strictEqual(unifilareDict["C-3"].desc, "Alimentazione Boiler");

// Verifichiamo che un cavo DWG chiamato "QGBT-C C-3 - L1" trovi esattamente "Alimentazione Boiler"
const matchResult = findInUnifilareDict("QGBT-C C-3 - L1");
assert(!!matchResult, "Cavo DWG QGBT-C C-3 - L1 trova corrispondenza in PDF unifilare C-3");
assert.strictEqual(matchResult.desc, "Alimentazione Boiler");
console.log("✓ PASS: Match unifilare e descrizione pulita 'Alimentazione Boiler' verificati!");

// 3. TEST 3D BOUNDS AND ZERO OVERFLOW
function test3DContained() {
  const prims = [];
  const line = (layer, x1, y1, x2, y2, color, lw = 0.4, alpha = 1) => prims.push({ t: "line", layer, x1, y1, x2, y2, color, lw, alpha });
  const rect = (layer, x, y, w, h, color, fill, solid = false) => prims.push({ t: "rect", layer, x, y, w, h, color, fill, solid });
  const text = (layer, x, y, h, str, color, align = "left", maxW = null) => prims.push({ t: "text", layer, x, y, h, str, color, align });

  const leftBoxX = -48, lowestY = -60, leftBoxW = 392, isoH = 110;
  const isoY = lowestY - isoH - 12;

  // Usable area:
  const uMinX = leftBoxX + 16;
  const uMaxX = leftBoxX + leftBoxW - 16;
  const uMinY = isoY + 12;
  const uMaxY = isoY + isoH - 24;
  const uW = uMaxX - uMinX;
  const uH = uMaxY - uMinY;

  // Let 3D coordinates be in normalized box:
  // x: 0 (right) to 1 (left)
  // y: 0 (bottom) to 1 (top)
  // z: 0 (front) to 1 (rear)
  // Axonometric mapping:
  // px = uMinX + (0.15 + 0.55 * z - 0.35 * x) * uW
  // py = uMinY + (0.15 + 0.35 * z + 0.15 * x + 0.45 * y) * uH
  const isoNorm = (nx, ny, nz) => ({
    px: uMinX + (0.38 + 0.54 * nz - 0.34 * nx) * uW,
    py: uMinY + (0.12 + 0.28 * nz + 0.15 * nx + 0.38 * ny) * uH
  });

  const iLine = (x1, y1, z1, x2, y2, z2, c = "#38bdf8", lw = 0.45) => {
    const p1 = isoNorm(x1, y1, z1), p2 = isoNorm(x2, y2, z2);
    line("VISTA_3D_ISO", p1.px, p1.py, p2.px, p2.py, c, lw);
  };

  // Test corners
  [0, 1].forEach(x => {
    [0, 1].forEach(y => {
      [0, 1].forEach(z => {
        const pt = isoNorm(x, y, z);
        assert(pt.px >= leftBoxX && pt.px <= leftBoxX + leftBoxW, `pt.px ${pt.px} outside [${leftBoxX}, ${leftBoxX + leftBoxW}]`);
        assert(pt.py >= isoY && pt.py <= isoY + isoH, `pt.py ${pt.py} outside [${isoY}, ${isoY + isoH}]`);
      });
    });
  });

  console.log("✓ PASS: Normalized 3D axonometry is 100% strictly contained inside view panel without any overflow!");
}

test3DContained();
