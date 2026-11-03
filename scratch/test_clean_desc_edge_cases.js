const assert = require("assert");

function cleanUtenzaDescription(raw, codeToStrip = "") {
  if (!raw) return "";
  let s = String(raw).replace(/\r?\n/g, " ").trim();

  // 1. Rimuove prefissi di etichetta (es. "Descrizione:", "Descrizione utenza:", "Designazione:")
  s = s.replace(/^(?:Descrizione(?:\s*(?:utenza|circuito|linea))?|Designazione|Utenza|Oggetto)\s*[:=-]\s*/i, "");

  // 2. Rimuove la sigla specifica del circuito passata come argomento se presente all'inizio o alla fine
  if (codeToStrip) {
    const esc = String(codeToStrip).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`^${esc}\\s*[-:–—]?\\s*`, "i"), "");
    s = s.replace(new RegExp(`\\s*[-:–—]?\\s*${esc}$`, "i"), "");
  }

  // 3. Rimuove qualsiasi sigla utenza / codice quadro-circuito all'inizio o alla fine (es. "QPT-DX-N C-21", "QGBT-P C-22", "C-21")
  // Il prefisso quadro inizia con Q/O (Quadro) oppure contiene trattini o numeri (es. QPT-DX-N, QGBT, Q-01)
  const panelPrefix = `(?:(?:[QO][A-Z0-9._-]*|[A-Z0-9]+-[A-Z0-9._-]+)\\s+)?`;
  s = s.replace(new RegExp(`^${panelPrefix}C-?\\d+\\b\\s*[-:–—]?\\s*`, "i"), "");
  s = s.replace(new RegExp(`\\s*[-:–—]?\\s*${panelPrefix}C-?\\d+\\b\\s*$`, "i"), "");
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

const tests = [
  { in: "QPT-DX-N C-21 Alimentazione Centralina DALI 1 / 1,053", code: "QPT-DX-N C-21", exp: "Alimentazione Centralina DALI" },
  { in: "QPT-DX-N C-21 Alimentazione Centralina DALI 1 / 1,053", code: "", exp: "Alimentazione Centralina DALI" },
  { in: "C-21 Alimentazione Centralina DALI", code: "", exp: "Alimentazione Centralina DALI" },
  { in: "Alimentazione Centralina DALI C-21", code: "", exp: "Alimentazione Centralina DALI" },
  { in: "Descrizione: Alimentazione Centralina DALI", code: "", exp: "Alimentazione Centralina DALI" },
  { in: "Descrizione utenza: Alimentazione Boiler", code: "", exp: "Alimentazione Boiler" },
  { in: "Alimentazione Quadro Q-EDP 15 kW 400V", code: "", exp: "Alimentazione Quadro Q-EDP" },
  { in: "Alimentazione Centralina DALI 1 / 1,053", code: "", exp: "Alimentazione Centralina DALI" },
  { in: "Alimentazione Centralina DALI", code: "", exp: "Alimentazione Centralina DALI" },
  { in: "Luce emergenza corridoio", code: "", exp: "Luce emergenza corridoio" },
  { in: "Prese FM laboratorio P=3kW", code: "", exp: "Prese FM laboratorio" }
];

tests.forEach((t, i) => {
  const actual = cleanUtenzaDescription(t.in, t.code);
  console.log(`Test ${i + 1}: input="${t.in}" -> actual="${actual}"`);
  assert.strictEqual(actual, t.exp);
});

console.log("All cleanUtenzaDescription tests PASSED!");
