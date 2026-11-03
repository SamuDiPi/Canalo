const assert = require("assert");

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

  // 5. Rimuove grandezze elettriche pure isolate alla fine o all'inizio
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

// TEST 1: The exact case from user's screenshot!
const input1 = "QPT-DX-N C-21 Alimentazione Centralina DALI 1 / 1,053";
const res1 = cleanUtenzaDescription(input1, "QPT-DX-N C-21");
console.log("Test 1 Result:", `"${res1}"`);
assert.strictEqual(res1, "Alimentazione Centralina DALI");

// TEST 2: With label prefix
const input2 = "Descrizione: Alimentazione Centralina DALI";
const res2 = cleanUtenzaDescription(input2);
assert.strictEqual(res2, "Alimentazione Centralina DALI");

// TEST 3: Multi-word description with building details
const input3 = "QP-1 C-4 Centrale Trattamento Aria CTA-01 Piano Primo";
const res3 = cleanUtenzaDescription(input3, "QP-1 C-4");
assert.strictEqual(res3, "Centrale Trattamento Aria CTA-01 Piano Primo");

// TEST 4: Power and voltage in raw text
const input4 = "Alimentazione Boiler (Accumulo ACS) 15kW 400V";
const res4 = cleanUtenzaDescription(input4);
assert.strictEqual(res4, "Alimentazione Boiler (Accumulo ACS)");

console.log("✓ ALL CLEAN TESTS PASSED!");

