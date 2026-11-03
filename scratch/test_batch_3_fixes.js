const assert = require("assert");

// 1. TEST DESCRIPTION EXTRACTION FROM MULTI-LINE / SPLIT ITEMS
function testDescriptionMerging() {
  function cleanUtenzaDescription(raw) {
    if (!raw) return "";
    let s = String(raw).replace(/\r?\n/g, " ").trim();
    s = s.replace(/^(?:Descrizione(?:\s*utenza)?|Utenza|Linea|Nome\s*circuito)\s*[:=-]\s*/i, "");
    s = s.replace(/\([A-Z0-9_.-]*C-?\d+[A-Z0-9_.-]*\)/gi, "");
    s = s.replace(/\b(?:Q[A-Z0-9_.-]+\s+)?C-?\d+\b/gi, "");
    s = s.replace(/\b(?:P\s*=\s*)?\d+(?:[.,]\d+)?\s*(?:k?W|k?VA|k?VAR)\b/gi, "");
    s = s.replace(/\b(?:I[nbd]|Idn|Icu|Ics|Icn)\s*=?\s*\d+(?:[.,]\d+)?\s*(?:m?A|kA)?\b/gi, "");
    s = s.replace(/\b\d+(?:[.,]\d+)?\s*(?:kA|mA|A)\b/gi, "");
    s = s.replace(/\b(?:400|230|110|24)\s*V\b/gi, "");
    s = s.replace(/\b50\s*Hz\b/gi, "");
    s = s.replace(/\b(?:3F\+N|3P\+N|1F\+N|1P\+N|[1-4]P)\b/gi, "");
    s = s.replace(/\b(?:L\s*=\s*)?\d+(?:[.,]\d+)?\s*m\b/gi, "");
    s = s.replace(/\b(?:d[vV]|Δ[vV])?\s*=?\s*\d+(?:[.,]\d+)?\s*%/gi, "");
    s = s.replace(/\bcos\s*(?:[\u03c6\u03a6φΦ]|phi)?\s*=?\s*\d*(?:[.,]\d+)?\b/gi, "");
    s = s.replace(/\b[BCD]\d{1,3}\b/g, "");
    s = s.replace(/\b(?:Curva|Curve)\s*[BCD]\b/gi, "");
    s = s.replace(/\b(?:iC60[A-Z]?|NSX\d*|Tmax(?:\s*XT\d?)?|S200|DS200)\b/gi, "");
    s = s.replace(/\b(?:FG16[A-Z0-9]*|FTG18[A-Z0-9]*|FS17|FG17|H07[A-Z0-9-]*|H1Z2Z2-K|RG16[A-Z0-9]*)\b/gi, "");
    s = s.replace(/\b(?:0[.,]6\/1\s*kV|1\s*kV|LSZH|CPR|Cca|Eca|B2ca)\b/gi, "");
    s = s.replace(/\b\d+\s*\([0-9xXGg,+]+\)|\b[1-5][xXGg]\d+(?:[.,]\d+)?\b/g, "");
    s = s.replace(/\(\s*\)|\[\s*\]/g, "");
    s = s.replace(/^[-\s|/,.:;]+|[-\s|/,.:;]+$/g, "");
    s = s.replace(/\s*\|\s*/g, " - ");
    s = s.replace(/\s{2,}/g, " ").trim();
    return s;
  }

  // Multi-line split test
  const colItems = [
    { str: "Alimentazione", y: 100 },
    { str: "Boiler", y: 95 },
    { str: "15kW 400V", y: 80 }
  ];

  const descItems = colItems.filter(it => {
    const s = it.str.trim();
    if (/\b(?:400|230)\s*V\b/i.test(s)) return false;
    if (/\b\d+\s*kW\b/i.test(s)) return false;
    return true;
  });

  const joined = descItems.map(it => it.str).join(" ");
  const clean = cleanUtenzaDescription(joined);
  assert.strictEqual(clean, "Alimentazione Boiler");
  console.log("✓ PASS Description Merging: 'Alimentazione Boiler'");
}

// 2. TEST TITLE EXACT EXTRACTION
function testTitleExact() {
  function extractTrayNameFromInput(rawTexts, fileName, width = 200, height = 75) {
    let foundName = null;
    let isExplicit = false;

    if (Array.isArray(rawTexts) && rawTexts.length > 0) {
      for (const t of rawTexts) {
        const s = String(t.str || "").trim();
        const mParen = s.match(/(?:Dati\s+caratteristici\s+(?:della\s+)?(?:canalina|passerella|canale)|(?:canalina|passerella|canale|condotto|sezione))\s*[^(]*\(([^)]+)\)/i);
        if (mParen && mParen[1] && mParen[1].trim().length >= 2) {
          foundName = mParen[1].trim();
          isExplicit = true;
          break;
        }
      }

      if (!foundName) {
        const allJoined = rawTexts.map(t => t.str || "").join(" ");
        const mJoined = allJoined.match(/(?:Dati\s+caratteristici\s+(?:della\s+)?(?:canalina|passerella|canale)|(?:canalina|passerella|canale|condotto|sezione))\s*[^(]*\(([^)]+)\)/i);
        if (mJoined && mJoined[1] && mJoined[1].trim().length >= 2) {
          foundName = mJoined[1].trim();
          isExplicit = true;
        }
      }

      if (!foundName) {
        for (const t of rawTexts) {
          const s = String(t.str || "").trim();
          if (/canalina|passerella|canale/i.test(s) && !/distinta|tabella|particolare\s+costruttivo|legenda|materiale/i.test(s)) {
            const mAnyParen = s.match(/\(([A-Za-z0-9\s-_/.]+)\)/);
            if (mAnyParen && mAnyParen[1] && !/^\d+[xX]\d+/i.test(mAnyParen[1]) && mAnyParen[1].trim().length >= 3) {
              foundName = mAnyParen[1].trim();
              isExplicit = true;
              break;
            }
          }
        }
      }
    }

    let cleanBase = foundName ? foundName : (fileName || "CANALINA").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, " ").trim();
    if (!cleanBase) cleanBase = "CANALINA 01";

    // Se il nome è stato trovato esplicitamente tra parentesi, il titolo è ESATTAMENTE quello
    const title = cleanBase;
    const exportFile = cleanBase.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return { title, exportFile, cleanBase, isExplicit };
  }

  const rawTexts = [
    { str: "Dati caratteristici della canalina (Anello PT - Lato DX)" }
  ];
  const res = extractTrayNameFromInput(rawTexts, "test.dwg", 300, 75);
  assert.strictEqual(res.title, "Anello PT - Lato DX");
  assert.strictEqual(res.exportFile, "Anello_PT_Lato_DX");
  console.log("✓ PASS Title Exact: '" + res.title + "'");
}

// 3. TEST 3D VERTICALITY & PROPORTIONS
function test3DProportions() {
  const leftBoxX = -48, lowestY = -60, leftBoxW = 392, isoH = 114;
  const isoY = lowestY - isoH - 12;
  const uMinX = leftBoxX + 18, uMaxX = leftBoxX + leftBoxW - 18;
  const uMinY = isoY + 12, uMaxY = isoY + isoH - 24;
  const uW = uMaxX - uMinX, uH = uMaxY - uMinY;

  // New projection with enhanced verticality:
  // ny ranges from -0.22 (supports) to 0.70 (ceiling)
  // ny coefficient is 0.52 * uH (previously 0.36)
  const iso = (nx, ny, nz) => ({
    px: uMinX + (0.34 + 0.50 * nz - 0.30 * nx) * uW,
    py: uMinY + (0.08 + 0.22 * nz + 0.16 * nx + 0.52 * ny) * uH
  });

  const testPoints = [
    { nx: 0, ny: -0.15, nz: 0 },
    { nx: 1, ny: -0.15, nz: 0 },
    { nx: 0, ny: 0.55, nz: 0 },
    { nx: 1, ny: 0.55, nz: 0 },
    { nx: 0, ny: -0.15, nz: 1 },
    { nx: 1, ny: -0.15, nz: 1 },
    { nx: 0, ny: 0.55, nz: 1 },
    { nx: 1, ny: 0.55, nz: 1 }
  ];

  testPoints.forEach((pt, i) => {
    const p = iso(pt.nx, pt.ny, pt.nz);
    assert(p.px >= leftBoxX && p.px <= leftBoxX + leftBoxW, `P${i} px overflow: ${p.px}`);
    assert(p.py >= isoY && p.py <= isoY + isoH, `P${i} py overflow: ${p.py}`);
  });

  // Check vertical height of tray sponda
  const pBottom = iso(0, 0, 0);
  const pTop = iso(0, 0.55, 0);
  const trayPixelH = pTop.py - pBottom.py;
  assert(trayPixelH >= 20, `Tray sponda height ${trayPixelH} is sufficiently tall and not crushed!`);
  console.log(`✓ PASS 3D Proportions: Sponda height is ${trayPixelH.toFixed(1)}mm (tall, elegant and not schiacciata)!`);
}

testDescriptionMerging();
testTitleExact();
test3DProportions();
console.log("\nALL PRELIMINARY LOGIC TESTS PASSED!");

