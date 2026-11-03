const assert = require("assert");

function cleanUtenzaDescription(raw) {
  if (!raw) return "";
  let s = String(raw).replace(/\r?\n/g, " ").trim();
  s = s.replace(/^(?:Descrizione(?:\s*utenza)?|Designazione|Utenza)\s*[:=-]\s*/i, "");
  return s.replace(/\s{2,}/g, " ").trim();
}

function extractDescriptionFromUnifilareColumn(items, ch, cableMatch, formMatch) {
  // 1. Cerca l'etichetta di riga "Descrizione" sulla pagina
  const descLabel = items.find(it => /^(?:Descrizione(?:\s*utenza)?|Designazione)$/i.test(it.str.trim()));
  
  if (descLabel) {
    // Trovata la coordinata Y della riga Descrizione!
    // Raccoglie tutti gli elementi nella colonna di ch che cadono nella fascia della riga Descrizione
    const descItems = items.filter(it => 
      Math.abs(it.x - ch.x) < 46 && 
      Math.abs(it.y - descLabel.y) <= 22 &&
      it !== descLabel
    ).sort((a, b) => (b.y - a.y) || (a.x - b.x));

    if (descItems.length > 0) {
      const merged = descItems.map(it => it.str.trim()).join(" ");
      return cleanUtenzaDescription(merged);
    }
  }

  // 2. Fallback: se non c' l'etichetta esplicita "Descrizione", raccogli gli elementi testuali sotto l'header
  // escludendo solo l'header stesso, il cavo e la formazione
  const colItems = items.filter(it => 
    Math.abs(it.x - ch.x) < 46 && 
    it.y < ch.y && 
    ch.y - it.y < 85 &&
    it.str.trim() !== ch.str.trim() &&
    it.str.trim() !== cableMatch &&
    it.str.trim() !== formMatch
  ).sort((a, b) => (b.y - a.y) || (a.x - b.x));

  const merged = colItems.map(it => it.str.trim()).join(" ");
  return cleanUtenzaDescription(merged);
}

// TEST CASE 1: With explicit "Descrizione" row label and multi-word with numbers & parentheses
const pageItems1 = [
  { str: "Descrizione", x: 20, y: 350 },
  { str: "Tipo cavo", x: 20, y: 300 },
  { str: "QGBT-P C-22", x: 150, y: 400 },
  { str: "Alimentazione Boiler (Accumulo ACS) 15kW 400V", x: 150, y: 350 },
  { str: "FG16M16", x: 150, y: 300 }
];

const ch1 = pageItems1[2];
const desc1 = extractDescriptionFromUnifilareColumn(pageItems1, ch1, "FG16M16", "3G2.5");
assert.strictEqual(desc1, "Alimentazione Boiler (Accumulo ACS) 15kW 400V");
console.log("✓ PASS Test 1 (Full description preserved):", desc1);

// TEST CASE 2: Multi-line description in the Descrizione cell
const pageItems2 = [
  { str: "Descrizione utenza", x: 20, y: 350 },
  { str: "QP1 C-4", x: 150, y: 400 },
  { str: "Centrale Trattamento Aria CTA-01", x: 150, y: 355 },
  { str: "Piano Primo - Ala Est", x: 150, y: 345 }
];

const ch2 = pageItems2[1];
const desc2 = extractDescriptionFromUnifilareColumn(pageItems2, ch2, null, null);
assert.strictEqual(desc2, "Centrale Trattamento Aria CTA-01 Piano Primo - Ala Est");
console.log("✓ PASS Test 2 (Multi-line full description):", desc2);

// TEST CASE 3: Fallback when row header is missing
const pageItems3 = [
  { str: "QGBT C-3", x: 100, y: 500 },
  { str: "Pompa Ricircolo Primario P-01 (Inverter)", x: 100, y: 460 },
  { str: "FG16M16", x: 100, y: 400 }
];

const ch3 = pageItems3[0];
const desc3 = extractDescriptionFromUnifilareColumn(pageItems3, ch3, "FG16M16", null);
assert.strictEqual(desc3, "Pompa Ricircolo Primario P-01 (Inverter)");
console.log("✓ PASS Test 3 (Fallback without stripping anything):", desc3);

