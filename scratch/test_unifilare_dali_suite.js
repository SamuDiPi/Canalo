const assert = require("assert");

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanUtenzaDescription(raw, codeToStrip = "") {
  if (!raw) return "";
  let s = String(raw).replace(/\r?\n/g, " ").trim();

  // 1. Rimuove prefissi di etichetta (es. "Descrizione:", "Descrizione utenza:", "Designazione:")
  s = s.replace(/^(?:Descrizione(?:\s*(?:utenza|circuito|linea))?|Designazione|Utenza|Oggetto)\s*[:=-]\s*/i, "");

  // 2. Rimuove la sigla specifica del circuito passata come argomento se presente all'inizio o alla fine
  if (codeToStrip) {
    const esc = codeToStrip.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`^${esc}\\s*[-:–—]?\\s*`, "i"), "");
    s = s.replace(new RegExp(`\\s*[-:–—]?\\s*${esc}$`, "i"), "");
  }

  // 3. Rimuove qualsiasi sigla utenza / codice quadro-circuito (es. "QPT-DX-N C-21", "QGBT-P C-22", "C-21")
  s = s.replace(/^(?:[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+)?C-?\d+\b\s*[-:–—]?\s*/i, "");
  s = s.replace(/\s*[-:–—]?\s*(?:[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+)?C-?\d+\b\s*$/i, "");
  s = s.replace(/\([A-Z0-9_.-]*C-?\d+[A-Z0-9_.-]*\)/gi, "");

  // 4. Rimuove rapporti di potenza / corrente (es. "1 / 1,053", "15 / 24,5", "10 / 0,4")
  s = s.replace(/\b\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?\b/g, "");

  // 5. Rimuove grandezze elettriche pure isolate
  s = s.replace(/\b(?:P\s*=\s*)?\d+(?:[.,]\d+)?\s*(?:k?W|k?VA|k?VAR)\b/gi, "");
  s = s.replace(/\b(?:400|230|110|24)\s*V\b/gi, "");
  s = s.replace(/\b(?:I[nbd]|Idn|Icu|Ics|Icn)\s*=?\s*\d+(?:[.,]\d+)?\s*(?:m?A|kA)?\b/gi, "");

  // 6. Rimuove formazioni cavi e tipi cavo residui
  s = s.replace(/\b(?:FG16[A-Z0-9]*|FTG18[A-Z0-9]*|FS17|FG17|H07[A-Z0-9-]*|H1Z2Z2-K|RG16[A-Z0-9]*)\b/gi, "");
  s = s.replace(/\b\d+\s*\([0-9xXGg,+]+\)|\b[1-5][xXGg]\d+(?:[.,]\d+)?\b/g, "");

  // 7. Pulizia punteggiatura e spazi residui
  s = s.replace(/^[-\s|/,.:;–—]+|[-\s|/,.:;–—]+$/g, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

// Simulate PDF extraction with exact geometry of electrical unifilare
const simulatedPdfItems = [
  // Left table row labels
  { str: "Sigla circuito", x: 20, y: 500 },
  { str: "Descrizione", x: 20, y: 485 },
  { str: "Potenza / Corrente", x: 20, y: 470 },
  { str: "Tipo cavo", x: 20, y: 455 },
  { str: "Formazione", x: 20, y: 440 },

  // Column for C-21
  { str: "QPT-DX-N C-21", x: 120, y: 500 },
  { str: "Alimentazione Centralina DALI", x: 120, y: 485 },
  { str: "1 / 1,053", x: 120, y: 470 },
  { str: "FG16M16", x: 120, y: 455 },
  { str: "3G1.5", x: 120, y: 440 }
];

function extractFromSimulatedPage(items) {
  const headers = items.filter(it => /^[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+C-\d+/i.test(it.str));
  const descLabels = items.filter(it => /^(?:Descrizione(?:\s*(?:utenza|circuito|linea))?|Designazione|Utenza|Oggetto)\s*:?$/i.test(it.str.trim()));

  const result = {};

  headers.forEach(ch => {
    const rawCode = ch.str.replace(/\s+/g, " ").trim();
    const colItems = items.filter(it => Math.abs(it.x - ch.x) < 48 && it.y < ch.y).sort((a, b) => b.y - a.y);
    const colTexts = colItems.map(c => c.str);

    const cableMatch = colTexts.find(t => /FG16|FTG18|H1Z2Z2|FS17|FG17|RG16|H07/i.test(t)) || null;
    const formMatch = colTexts.find(t => /\d+\s*\([0-9xXGg,+]+\)|\b[1-5][xXGg]\d+(?:[.,]\d+)?/i.test(t)) || null;

    let descStr = null;
    let targetLabel = descLabels.filter(dl => dl.y < ch.y).sort((a, b) => (ch.y - a.y) - (ch.y - b.y))[0];
    if (!targetLabel && descLabels.length > 0) {
      targetLabel = descLabels.slice().sort((a, b) => Math.abs(a.y - ch.y) - Math.abs(b.y - ch.y))[0];
    }

    if (targetLabel) {
      const descItems = items.filter(it =>
        Math.abs(it.x - ch.x) < 48 &&
        Math.abs(it.y - targetLabel.y) <= 8 &&
        it !== targetLabel &&
        it.str.trim() !== rawCode &&
        it.str.trim() !== cableMatch &&
        it.str.trim() !== formMatch &&
        !/^\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?$/.test(it.str.trim()) &&
        !/^(?:[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+)?C-?\d+$/i.test(it.str.trim())
      ).sort((a, b) => (Math.abs(b.y - a.y) > 3 ? (b.y - a.y) : (a.x - b.x)));

      if (descItems.length > 0) {
        const merged = descItems.map(it => it.str.trim()).join(" ");
        descStr = cleanUtenzaDescription(merged, rawCode);
      }
    }

    if (!descStr) {
      const fallbackItems = colItems.filter(it =>
        it.y < ch.y &&
        (ch.y - it.y) < 85 &&
        it.str.trim() !== ch.str.trim() &&
        it.str.trim() !== rawCode &&
        it.str.trim() !== cableMatch &&
        it.str.trim() !== formMatch &&
        !/^\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?$/.test(it.str.trim()) &&
        !/^(?:[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+)?C-?\d+$/i.test(it.str.trim())
      ).sort((a, b) => (Math.abs(b.y - a.y) > 3 ? (b.y - a.y) : (a.x - b.x)));
      if (fallbackItems.length > 0) {
        const merged = fallbackItems.map(it => it.str.trim()).join(" ");
        descStr = cleanUtenzaDescription(merged, rawCode) || null;
      }
    }

    result[rawCode] = descStr;
  });

  return result;
}

const extracted = extractFromSimulatedPage(simulatedPdfItems);
console.log("Extracted descriptions:", extracted);
assert.strictEqual(extracted["QPT-DX-N C-21"], "Alimentazione Centralina DALI");
console.log("✓ PASS: Extracted ONLY 'Alimentazione Centralina DALI' without circuit code and without 1 / 1,053!");

// Test fallback as well (when descLabel is missing)
const noLabelItems = simulatedPdfItems.filter(it => it.x > 50); // only column items, no row labels
const extractedFallback = extractFromSimulatedPage(noLabelItems);
console.log("Extracted fallback descriptions:", extractedFallback);
assert.strictEqual(extractedFallback["QPT-DX-N C-21"], "Alimentazione Centralina DALI");
console.log("✓ PASS: Fallback also extracts ONLY 'Alimentazione Centralina DALI'!");

// Test escapeHtml
assert.strictEqual(escapeHtml('Alimentazione "DALI" & Boiler'), 'Alimentazione &quot;DALI&quot; &amp; Boiler');
console.log("✓ PASS: escapeHtml works correctly!");

