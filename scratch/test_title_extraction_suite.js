const assert = require("assert");

function cleanAcadMText(raw) {
  if (!raw) return "";
  let s = String(raw);
  s = s.replace(/\\A[0-2];/gi, "");
  s = s.replace(/\\C\d+;/gi, "");
  s = s.replace(/\\[A-Za-z][^;]*;/g, "");
  s = s.replace(/\{|\}/g, "");
  s = s.replace(/\r?\n|\\P|\\~|\^J/gi, " ");
  s = s.replace(/\\U\+([0-9A-Fa-f]{4})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  return s.replace(/\s{2,}/g, " ").trim();
}

function extractTrayNameFromInput(rawTexts, fileName, width = 200, height = 75) {
  let foundName = null;
  let isExplicit = false;

  if (Array.isArray(rawTexts) && rawTexts.length > 0) {
    const cleanedItems = rawTexts.map(t => ({
      str: cleanAcadMText(t.str || ""),
      x: t.x || 0,
      y: t.y || 0
    })).filter(t => t.str.length > 0);

    // REGOLA 1: Cerca nei singoli testi diciture con parentesi
    // Es. "Dati caratteristici della canalina (Anello PT - Lato DX)"
    // o "Canalina (Anello PT - Lato DX)" o "Dati (Anello PT - Lato DX)"
    for (const t of cleanedItems) {
      const s = t.str;
      const mParen = s.match(/(?:Dati\s+caratteristici|Dati\s+tecnici|Dati|Canalina|Canale|Passerella|Condotto|Tratta|Tronco|Sezione|Particolare)[^(]*\(([^)]+)\)/i);
      if (mParen && mParen[1]) {
        const candidate = mParen[1].trim();
        // Escludi se sono solo dimensioni o codici cavo
        if (!/^\d+\s*[xX]\s*\d+/i.test(candidate) && !/^C-\d+$/i.test(candidate) && candidate.length >= 2) {
          foundName = candidate;
          isExplicit = true;
          break;
        }
      }
    }

    // REGOLA 2: Cerca nel testo unito dell'intero disegno se spezzato in pi entit vicine
    if (!foundName) {
      const allJoined = cleanedItems.map(t => t.str).join(" ");
      const mJoined = allJoined.match(/(?:Dati\s+caratteristici|Dati\s+tecnici|Dati|Canalina|Canale|Passerella|Condotto|Tratta|Tronco|Sezione|Particolare)[^(]*\(([^)]+)\)/i);
      if (mJoined && mJoined[1]) {
        const candidate = mJoined[1].trim();
        if (!/^\d+\s*[xX]\s*\d+/i.test(candidate) && !/^C-\d+$/i.test(candidate) && candidate.length >= 2) {
          foundName = candidate;
          isExplicit = true;
        }
      }
    }

    // REGOLA 3: Cerca QUALSIASI entit testuale contenente un testo tra parentesi (...) non numerico
    // Es. L'utente nel disegno ha scritto semplicemente "(Anello PT - Lato DX)" come etichetta
    if (!foundName) {
      for (const t of cleanedItems) {
        const s = t.str;
        // Non considerare tabelle/legende/note
        if (/distinta|tabella|legenda|materiale|revisione/i.test(s)) continue;
        const mAnyParen = s.match(/\(([^)]+)\)/);
        if (mAnyParen && mAnyParen[1]) {
          const candidate = mAnyParen[1].trim();
          // Escludi se sono sezioni cavo o formule es. (1x185), (4G2.5), (300x75), (C-3)
          const isCableForm = /^\d+\s*[xX]\s*\d+/i.test(candidate) || /^[1-5][xXGg]\d+/i.test(candidate) || /^C-\d+$/i.test(candidate);
          const hasLetters = /[A-Za-z]{2,}/.test(candidate);
          if (!isCableForm && hasLetters && candidate.length >= 3) {
            foundName = candidate;
            isExplicit = true;
            break;
          }
        }
      }
    }

    // REGOLA 4: Diciture con due punti o trattino senza parentesi
    // Es. "Dati caratteristici della canalina: Anello PT - Lato DX"
    if (!foundName) {
      for (const t of cleanedItems) {
        const s = t.str;
        const mColon = s.match(/(?:Dati\s+caratteristici(?:\s+della)?\s+(?:canalina|passerella|canale)|(?:canalina|passerella|canale))\s*[:=-]\s*([A-Za-z0-9_\-./\s]{3,50})/i);
        if (mColon && mColon[1]) {
          const candidate = mColon[1].trim();
          if (!/^\d+\s*[xX]\s*\d+/i.test(candidate)) {
            foundName = candidate;
            isExplicit = true;
            break;
          }
        }
      }
    }

    // REGOLA 5: Header convenzionali di canalina/passerella
    if (!foundName) {
      const p1 = cleanedItems.find(t => /^(?:CANALINA|CANALE|PASSERELLA|CONDOTTO|TRONCO)\s+([A-Za-z0-9_\-./\s]{2,40})/i.test(t.str));
      if (p1) {
        foundName = p1.str.trim();
        isExplicit = true;
      }
    }

    // REGOLA 6: Sezione o Oggetto cartiglio
    if (!foundName) {
      const p4 = cleanedItems.find(t => /^(?:OGGETTO|TITOLO|ELABORATO)\s*[:=-]\s*(.+)/i.test(t.str));
      if (p4) {
        const m = p4.str.match(/^(?:OGGETTO|TITOLO|ELABORATO)\s*[:=-]\s*(.+)/i);
        if (m && m[1]) {
          foundName = m[1].trim();
          isExplicit = true;
        }
      }
    }
  }

  let cleanBase = foundName ? foundName : (fileName || "CANALINA").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, " ").trim();
  cleanBase = cleanBase.replace(/^(?:Dati\s+caratteristici\s+(?:della\s+)?(?:canalina|passerella|canale)\s*[:=-]?\s*)/i, "")
                      .replace(/\s*-\s*L=\s*\d+\s*mm\s*H=\s*\d+\s*mm/i, "")
                      .replace(/\b\d+\s*[xX]\s*\d+(?:\s*mm)?\b/gi, "")
                      .replace(/L=\s*\d+\s*mm/i, "")
                      .replace(/H=\s*\d+\s*mm/i, "")
                      .replace(/^["'\s]+|["'\s]+$/g, "")
                      .trim();
  if (!cleanBase) cleanBase = "CANALINA 01";

  const title = cleanBase;
  const exportFile = cleanBase.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return { title, exportFile, cleanBase, isExplicit };
}

console.log("=== TESTING ALL REAL-WORLD TITLE SHAPES ===");

const testCases = [
  {
    name: "Shape A: Standard string with canalina",
    input: [{ str: "Dati caratteristici della canalina (Anello PT - Lato DX)" }],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape B: Dati caratteristici without canalina",
    input: [{ str: "Dati caratteristici (Anello PT - Lato DX)" }],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape C: Canalina with parentheses directly",
    input: [{ str: "Canalina (Anello PT - Lato DX)" }],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape D: Passerella with parentheses",
    input: [{ str: "Dati passerella (Anello PT - Lato DX)" }],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape E: Split text entities",
    input: [
      { str: "Dati caratteristici della canalina" },
      { str: "(Anello PT - Lato DX)" }
    ],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape F: Standalone parenthesis entity",
    input: [
      { str: "Sezione 300x75" },
      { str: "(Anello PT - Lato DX)" }
    ],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape G: MText with AutoCAD formatting",
    input: [{ str: "{\\fArial|b1|i0;Dati caratteristici della canalina (Anello PT - Lato DX)}" }],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape H: Colon without parentheses",
    input: [{ str: "Dati caratteristici della canalina: Anello PT - Lato DX" }],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape I: Quotes around string",
    input: [{ str: "\"Dati caratteristici della canalina (Anello PT - Lato DX)\"" }],
    expected: "Anello PT - Lato DX"
  },
  {
    name: "Shape J: Conventional Passerella Dorsale",
    input: [{ str: "PASSERELLA DORSALE CHILLER" }],
    expected: "PASSERELLA DORSALE CHILLER"
  }
];

let allPassed = true;
testCases.forEach((tc, idx) => {
  const res = extractTrayNameFromInput(tc.input, "test.dwg", 300, 75);
  const ok = res.title === tc.expected;
  if (!ok) {
    console.error(`✗ FAIL Case ${idx + 1} (${tc.name}): Expected "${tc.expected}", got "${res.title}"`);
    allPassed = false;
  } else {
    console.log(`✓ PASS Case ${idx + 1} (${tc.name}): "${res.title}"`);
  }
});

assert(allPassed, "All title shapes must pass!");
console.log("\nALL TITLE SHAPES PASSED 100%!");
