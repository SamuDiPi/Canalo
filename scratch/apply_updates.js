const fs = require('fs');

let content = fs.readFileSync('Canalo.html', 'utf8');

// ============================================================================
// 1. UPDATE pushStateToUI and syncFromUI to synchronize inpTitleQuick
// ============================================================================
const targetPush = `function pushStateToUI() {
      document.getElementById("inpTitle").value = state.title;`;
const replPush = `function pushStateToUI() {
      document.getElementById("inpTitle").value = state.title;
      const qTitle = document.getElementById("inpTitleQuick");
      if (qTitle) qTitle.value = state.title;`;
content = content.replace(targetPush, replPush);

const targetSync = `function syncFromUI() {
      state.title = document.getElementById("inpTitle").value || "CANALINA 01";`;
const replSync = `function syncFromUI() {
      state.title = document.getElementById("inpTitle").value || "CANALINA 01";
      const qTitle = document.getElementById("inpTitleQuick");
      if (qTitle) qTitle.value = state.title;`;
content = content.replace(targetSync, replSync);

// ============================================================================
// 2. UPDATE processRealWasmEntities:
//    - sync inpTitleQuick
//    - registerCableInCatalog for all loaded cables
// ============================================================================
const targetWasmTitle = `      state.title = trayNameInfo.title;
      document.getElementById("exportName").value = trayNameInfo.exportFile;

      document.getElementById("inpWidth").value = state.width;
      document.getElementById("inpHeight").value = state.height;
      document.getElementById("inpTitle").value = state.title;
      document.getElementById("headerTitle").textContent = state.title;`;

const replWasmTitle = `      state.title = trayNameInfo.title;
      document.getElementById("exportName").value = trayNameInfo.exportFile;

      document.getElementById("inpWidth").value = state.width;
      document.getElementById("inpHeight").value = state.height;
      document.getElementById("inpTitle").value = state.title;
      const qTitleWasm = document.getElementById("inpTitleQuick");
      if (qTitleWasm) qTitleWasm.value = state.title;
      document.getElementById("headerTitle").textContent = state.title;`;
content = content.replace(targetWasmTitle, replWasmTitle);

const targetWasmRegister = `        const isAnyUni = group.some(c => isUnipolarCable(c));
        if (validDesc && (isAnyUni || group.length > 1)) {
          group.forEach(c => {
            c.desc = validDesc;
          });
        }
      });

      pushStateToUI();`;

const replWasmRegister = `        const isAnyUni = group.some(c => isUnipolarCable(c));
        if (validDesc && (isAnyUni || group.length > 1)) {
          group.forEach(c => {
            c.desc = validDesc;
          });
        }
      });

      // Registra automaticamente nel database cavi qualsiasi tipologia non presente (Punto 4)
      state.cables.forEach(c => registerCableInCatalog(c));

      pushStateToUI();`;
content = content.replace(targetWasmRegister, replWasmRegister);

// ============================================================================
// 3. UPDATE importPDFFile:
//    - gather all descriptive tokens in cell band and join with space
//    - register cables in catalog
//    - sync inpTitleQuick
// ============================================================================
const targetPdfDesc = `            // Filtro rigoroso per estrarre ESCLUSIVAMENTE la sola descrizione testuale dell'utenza (es. "Alimentazione Boiler")
            let descStr = null;
            for (const it of colItems) {
              if (ch.y - it.y <= 2 || ch.y - it.y >= 75) continue;
              const s = it.str.trim();
              if (s.length < 3) continue;
              if (/^\\d+(?:[.,]\\d+)?$/.test(s)) continue;
              if (s === cableMatch || s === formMatch || s === peMatch) continue;
              if (/^C-\\d+$/i.test(s)) continue;
              if (/\\b(?:400|230|110|24)\\s*V\\b/i.test(s)) continue;
              if (/\\b\\d+(?:[.,]\\d+)?\\s*(?:k?W|k?VA|k?VAR|Hz)\\b/i.test(s) || /^P\\s*=/i.test(s)) continue;
              if (/\\b\\d+(?:[.,]\\d+)?\\s*(?:kA|mA|A)\\b/i.test(s) || /^(?:In|Ib|Idn|Icu|Ics)\\s*=/i.test(s)) continue;
              if (/\\b(?:3F\\+N|3P\\+N|1F\\+N|1P\\+N|[1-4]P)\\b/i.test(s)) continue;
              if (/\\b\\d+(?:[.,]\\d+)?\\s*m\\b/i.test(s) || /^L\\s*=/i.test(s)) continue;
              if (/\\b\\d+(?:[.,]\\d+)?\\s*%/i.test(s) || /^d[vV]\\s*=/i.test(s) || /^"[vV]\\s*=/i.test(s)) continue;
              if (/\\bcos\\s*[\\u03c6phi]\\b/i.test(s)) continue;
              if (/\\b[BCD]\\d{1,3}\\b/i.test(s)) continue;
              if (/\\b(?:iC60[A-Z]?|NSX\\d*|Tmax|S200|DS200|Curva\\s*[BCD]|Curve\\s*[BCD])\\b/i.test(s)) continue;
              if (/\\b(?:FG16|FTG18|FS17|FG17|H07|0[.,]6\\/1\\s*kV|1\\s*kV|LSZH|CPR)\\b/i.test(s)) continue;
              if (/^(?:Descrizione|Utenza|Sigla|Quadro|Linea|Cavo|Formazione|Sezione|Potenza|Corrente|Interruttore|Modello|Lungh|Caduta)\\b/i.test(s)) continue;

              const cleaned = cleanUtenzaDescription(s);
              if (cleaned && cleaned.length >= 3 && !/^\\d+$/.test(cleaned)) {
                descStr = cleaned;
                break;
              }
            }
            if (!descStr) {
              const rawDescFallback = colItems
                .filter(it => ch.y - it.y > 2 && ch.y - it.y < 75 && !/^\\d+$/.test(it.str.trim()))
                .map(it => it.str.trim())
                .join(" ");
              descStr = cleanUtenzaDescription(rawDescFallback) || null;
            }`;

const replPdfDesc = `            // Filtro rigoroso per estrarre la descrizione testuale completa ma compatta dell'utenza (es. "Alimentazione Boiler")
            const descTokens = [];
            for (const it of colItems) {
              if (ch.y - it.y <= 2 || ch.y - it.y >= 85) continue;
              const s = it.str.trim();
              if (s.length < 2) continue;
              if (/^\\d+(?:[.,]\\d+)?$/.test(s)) continue;
              if (s === cableMatch || s === formMatch || s === peMatch) continue;
              if (/^C-\\d+$/i.test(s)) continue;
              if (/\\b(?:400|230|110|24)\\s*V\\b/i.test(s)) continue;
              if (/\\b\\d+(?:[.,]\\d+)?\\s*(?:k?W|k?VA|k?VAR|Hz)\\b/i.test(s) || /^P\\s*=/i.test(s)) continue;
              if (/\\b\\d+(?:[.,]\\d+)?\\s*(?:kA|mA|A)\\b/i.test(s) || /^(?:In|Ib|Idn|Icu|Ics)\\s*=/i.test(s)) continue;
              if (/\\b(?:3F\\+N|3P\\+N|1F\\+N|1P\\+N|[1-4]P)\\b/i.test(s)) continue;
              if (/\\b\\d+(?:[.,]\\d+)?\\s*m\\b/i.test(s) || /^L\\s*=/i.test(s)) continue;
              if (/\\b\\d+(?:[.,]\\d+)?\\s*%/i.test(s) || /^d[vV]\\s*=/i.test(s) || /^[Δ\\u0394][vV]\\s*=/i.test(s)) continue;
              if (/\\bcos\\s*(?:[\\u03c6\\u03a6φΦ]|phi)?\\b/i.test(s)) continue;
              if (/\\b[BCD]\\d{1,3}\\b/i.test(s)) continue;
              if (/\\b(?:iC60[A-Z]?|NSX\\d*|Tmax|S200|DS200|Curva\\s*[BCD]|Curve\\s*[BCD])\\b/i.test(s)) continue;
              if (/\\b(?:FG16|FTG18|FS17|FG17|H07|0[.,]6\\/1\\s*kV|1\\s*kV|LSZH|CPR)\\b/i.test(s)) continue;
              if (/^(?:Descrizione|Utenza|Sigla|Quadro|Linea|Cavo|Formazione|Sezione|Potenza|Corrente|Interruttore|Modello|Lungh|Caduta)\\b/i.test(s)) continue;

              descTokens.push(s);
            }

            let descStr = null;
            if (descTokens.length > 0) {
              const merged = descTokens.join(" ");
              const cleaned = cleanUtenzaDescription(merged);
              if (cleaned && cleaned.length >= 3 && !/^\\d+$/.test(cleaned)) {
                descStr = cleaned;
              }
            }
            if (!descStr) {
              const rawDescFallback = colItems
                .filter(it => ch.y - it.y > 2 && ch.y - it.y < 85 && !/^\\d+$/.test(it.str.trim()))
                .map(it => it.str.trim())
                .join(" ");
              descStr = cleanUtenzaDescription(rawDescFallback) || null;
            }`;
content = content.replace(targetPdfDesc, replPdfDesc);

const targetPdfTitleSync = `        const pdfTrayName = extractTrayNameFromInput(items, file.name, state.width, state.height);
        if (pdfTrayName && pdfTrayName.isExplicit) {
          state.title = pdfTrayName.title;
          document.getElementById("inpTitle").value = state.title;
          document.getElementById("headerTitle").textContent = state.title;
          document.getElementById("exportName").value = pdfTrayName.exportFile;
        }`;

const replPdfTitleSync = `        // Registra automaticamente nel DB qualsiasi nuovo cavo identificato dallo schema
        state.cables.forEach(c => registerCableInCatalog(c));

        // Aggiorna titolo canalina e nome file se era rimasto default o se trovato nel documento
        const pdfTrayName = extractTrayNameFromInput(items, file.name, state.width, state.height);
        if (pdfTrayName && pdfTrayName.isExplicit) {
          state.title = pdfTrayName.title;
          document.getElementById("inpTitle").value = state.title;
          const qTitlePdf = document.getElementById("inpTitleQuick");
          if (qTitlePdf) qTitlePdf.value = state.title;
          document.getElementById("headerTitle").textContent = state.title;
          document.getElementById("exportName").value = pdfTrayName.exportFile;
        }`;
content = content.replace(targetPdfTitleSync, replPdfTitleSync);

// ============================================================================
// 4. UPDATE cleanUtenzaDescription
// ============================================================================
const targetCleanDesc = `    function cleanUtenzaDescription(raw) {
      if (!raw) return "";
      let s = String(raw).trim();
      if (s.includes("\\n")) {
        const lines = s.split("\\n").map(l => l.trim()).filter(l => l.length > 0);
        s = lines[0] || "";
      }`;

const replCleanDesc = `    function cleanUtenzaDescription(raw) {
      if (!raw) return "";
      let s = String(raw).replace(/\\r?\\n/g, " ").trim();`;
content = content.replace(targetCleanDesc, replCleanDesc);

// ============================================================================
// 5. UPDATE extractTrayNameFromInput:
//    - Return cleanBase as title directly without dimension suffix when explicit
// ============================================================================
const targetTrayReturn = `      let cleanBase = foundName ? foundName : (fileName || "CANALINA").replace(/\\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, " ").trim();
      cleanBase = cleanBase.replace(/^(?:Dati\\s+caratteristici\\s+(?:della\\s+)?(?:canalina|passerella|canale)\\s*[:=-]?\\s*)/i, "")
                          .replace(/\\s*-\\s*L=\\s*\\d+\\s*mm\\s*H=\\s*\\d+\\s*mm/i, "")
                          .replace(/\\b\\d+\\s*[xX]\\s*\\d+(?:\\s*mm)?\\b/gi, "")
                          .replace(/L=\\s*\\d+\\s*mm/i, "")
                          .replace(/H=\\s*\\d+\\s*mm/i, "")
                          .trim();
      if (!cleanBase) cleanBase = "CANALINA 01";

      const title = \`\${cleanBase} - L=\${width}mm H=\${height}mm\`;
      const exportFile = cleanBase.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") + \`_\${width}x\${height}_Costruttivo\`;
      return { title, exportFile, cleanBase, isExplicit };`;

const replTrayReturn = `      let cleanBase = foundName ? foundName : (fileName || "CANALINA").replace(/\\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, " ").trim();
      cleanBase = cleanBase.replace(/^(?:Dati\\s+caratteristici\\s+(?:della\\s+)?(?:canalina|passerella|canale)\\s*[:=-]?\\s*)/i, "")
                          .replace(/\\s*-\\s*L=\\s*\\d+\\s*mm\\s*H=\\s*\\d+\\s*mm/i, "")
                          .replace(/\\b\\d+\\s*[xX]\\s*\\d+(?:\\s*mm)?\\b/gi, "")
                          .replace(/L=\\s*\\d+\\s*mm/i, "")
                          .replace(/H=\\s*\\d+\\s*mm/i, "")
                          .trim();
      if (!cleanBase) cleanBase = "CANALINA 01";

      // Se il nome è stato specificato esplicitamente (es. tra parentesi), il titolo è ESATTAMENTE quello
      const title = cleanBase;
      const exportFile = cleanBase.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      return { title, exportFile, cleanBase, isExplicit };`;
content = content.replace(targetTrayReturn, replTrayReturn);

// ============================================================================
// 6. UPDATE build3DIsoScene:
//    - Enhanced vertical projection
//    - Taller sponde / flanges (spH = 0.55)
//    - Balanced support brackets and dimension line
// ============================================================================
const targetIsoScene = `      // Coordinate normalizzate:
      // nx: [0 (fronte destro), 1 (lato parete sinistro)]
      // ny: [-0.22 (livello inferiore mensole/tiranti), 0.70 (soffitto/ancoraggi a parete)]
      // nz: [0 (fronte sezione), 1 (retro assonometrico)]
      const iso = (nx, ny, nz) => ({
        px: uMinX + (0.36 + 0.52 * nz - 0.32 * nx) * uW,
        py: uMinY + (0.14 + 0.26 * nz + 0.14 * nx + 0.36 * ny) * uH
      });

      const iLine = (nx1, ny1, nz1, nx2, ny2, nz2, c = mat.stroke || "#94a3b8", lw = 0.45, alpha = 1) => {
        const p1 = iso(nx1, ny1, nz1), p2 = iso(nx2, ny2, nz2);
        line("VISTA_3D_ISO", p1.px, p1.py, p2.px, p2.py, c, lw, alpha);
      };

      // 1. SUPPORTO / MENSOLE (zSupports = [0.20, 0.80])
      const zSupports = [0.20, 0.80];
      zSupports.forEach(zs => {
        if (state.support.startsWith("wall_")) {
          // Parete verticale posteriore
          iLine(1.05, -0.22, zs, 1.05, 0.65, zs, "#475569", 0.4);
          // Piastra mensola a parete
          iLine(1.03, -0.20, zs, 1.03, 0.45, zs, "#94a3b8", 0.7);
          // Braccio orizzontale mensola sotto la canalina
          iLine(1.03, -0.05, zs, -0.06, -0.05, zs, "#94a3b8", 0.85);
          iLine(1.03, -0.09, zs, -0.06, -0.09, zs, "#64748b", 0.5);
          iLine(-0.06, -0.05, zs, -0.06, -0.09, zs, "#94a3b8", 0.6);
          // Puntone diagonale (wall_med e wall_heavy)
          if (state.support !== "wall_light") {
            iLine(1.03, -0.18, zs, 0.35, -0.05, zs, "#94a3b8", 0.75);
          }
        } else if (state.support === "ceiling_trap") {
          // Traversa orizzontale a trapezio sotto canalina
          iLine(-0.08, -0.06, zs, 1.08, -0.06, zs, "#94a3b8", 0.85);
          // Barre filettate M8/M10 verticali verso soffitto
          iLine(-0.06, -0.06, zs, -0.06, 0.68, zs, "#cbd5e1", 0.5);
          iLine(1.06, -0.06, zs, 1.06, 0.68, zs, "#cbd5e1", 0.5);
          // Piastrine di ancoraggio a soffitto
          iLine(-0.09, 0.68, zs, -0.03, 0.68, zs, "#94a3b8", 0.7);
          iLine(1.03, 0.68, zs, 1.09, 0.68, zs, "#94a3b8", 0.7);
        } else if (state.support === "ceiling_single") {
          // Pendino singolo centrale
          iLine(0.50, -0.06, zs, 0.50, 0.68, zs, "#cbd5e1", 0.75);
          iLine(-0.05, -0.06, zs, 1.05, -0.06, zs, "#94a3b8", 0.8);
          iLine(0.45, 0.68, zs, 0.55, 0.68, zs, "#94a3b8", 0.7);
        } else {
          // Supporto a pavimento omega
          iLine(-0.04, -0.05, zs, -0.04, -0.22, zs, "#94a3b8", 0.75);
          iLine(1.04, -0.05, zs, 1.04, -0.22, zs, "#94a3b8", 0.75);
          iLine(-0.08, -0.22, zs, 1.08, -0.22, zs, "#64748b", 0.5);
        }
      });

      // 2. CORPO DELLA CANALINA STILIZZATO PER TIPOLOGIA
      const trayStroke = mat.stroke || "#cbd5e1";
      if (state.trayType === "solid") {
        // Canale Chiuso Cieco
        iLine(0, 0, 0, 1, 0, 0, trayStroke, 0.7);
        iLine(1, 0, 0, 1, 0, 1, trayStroke, 0.7);
        iLine(1, 0, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(0, 0, 1, 0, 0, 0, trayStroke, 0.7);
        // Parete frontale
        iLine(0, 0, 0, 0, 0.40, 0, trayStroke, 0.75);
        iLine(0, 0.40, 0, 0, 0.40, 1, trayStroke, 0.75);
        iLine(0, 0.40, 1, 0, 0, 1, "#64748b", 0.45);
        // Parete posteriore
        iLine(1, 0, 0, 1, 0.40, 0, trayStroke, 0.75);
        iLine(1, 0.40, 0, 1, 0.40, 1, trayStroke, 0.75);
        iLine(1, 0.40, 1, 1, 0, 1, "#64748b", 0.45);
        // Bordini di ritorno a C
        iLine(0, 0.40, 0, 0.05, 0.40, 0, "#94a3b8", 0.5);
        iLine(0.05, 0.40, 0, 0.05, 0.40, 1, "#94a3b8", 0.4);
        iLine(1, 0.40, 0, 0.95, 0.40, 0, "#94a3b8", 0.5);
        iLine(0.95, 0.40, 0, 0.95, 0.40, 1, "#94a3b8", 0.4);

        if (state.cover !== "none") {
          iLine(-0.02, 0.43, 0, 1.02, 0.43, 0, "#38bdf8", 0.7);
          iLine(1.02, 0.43, 0, 1.02, 0.43, 1, "#38bdf8", 0.7);
          iLine(1.02, 0.43, 1, -0.02, 0.43, 1, "#0284c7", 0.45);
          iLine(-0.02, 0.43, 1, -0.02, 0.43, 0, "#38bdf8", 0.7);
        }
      } else if (state.trayType === "perforated") {
        // Canale Asolato con Feritoie
        iLine(0, 0, 0, 1, 0, 0, trayStroke, 0.7);
        iLine(1, 0, 0, 1, 0, 1, trayStroke, 0.7);
        iLine(1, 0, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(0, 0, 1, 0, 0, 0, trayStroke, 0.7);
        iLine(0, 0, 0, 0, 0.40, 0, trayStroke, 0.75);
        iLine(0, 0.40, 0, 0, 0.40, 1, trayStroke, 0.75);
        iLine(0, 0.40, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(1, 0, 0, 1, 0.40, 0, trayStroke, 0.75);
        iLine(1, 0.40, 0, 1, 0.40, 1, trayStroke, 0.75);
        iLine(1, 0.40, 1, 1, 0, 1, "#64748b", 0.45);
        // Feritoie asolate longitudinali lungo fondo e pareti
        for (let z = 0.08; z <= 0.92; z += 0.12) {
          iLine(0.25, 0, z, 0.25, 0, z + 0.05, "#f59e0b", 0.4);
          iLine(0.75, 0, z, 0.75, 0, z + 0.05, "#f59e0b", 0.4);
          iLine(0, 0.20, z, 0, 0.20, z + 0.05, "#f59e0b", 0.4);
          iLine(1, 0.20, z, 1, 0.20, z + 0.05, "#f59e0b", 0.4);
        }
      } else if (state.trayType === "mesh") {
        // Passerella a Filo Rete (Cablofil)
        iLine(0, 0.40, 0, 0, 0.40, 1, "#38bdf8", 0.7);
        iLine(1, 0.40, 0, 1, 0.40, 1, "#38bdf8", 0.7);
        iLine(0, 0, 0, 0, 0, 1, "#38bdf8", 0.7);
        iLine(1, 0, 0, 1, 0, 1, "#38bdf8", 0.7);
        iLine(0.33, 0, 0, 0.33, 0, 1, "#0284c7", 0.45);
        iLine(0.66, 0, 0, 0.66, 0, 1, "#0284c7", 0.45);
        for (let z = 0.05; z <= 0.95; z += 0.10) {
          iLine(0, 0.40, z, 0, 0, z, "#0284c7", 0.5);
          iLine(0, 0, z, 1, 0, z, "#0284c7", 0.5);
          iLine(1, 0, z, 1, 0.40, z, "#0284c7", 0.5);
        }
      } else if (state.trayType === "ladder") {
        // Passerella a Pioli / Scaletta
        iLine(0, 0.40, 0, 0, 0.40, 1, "#f59e0b", 0.75);
        iLine(0, 0, 0, 0, 0, 1, "#f59e0b", 0.75);
        iLine(0, 0, 0, 0, 0.40, 0, "#f59e0b", 0.75);
        iLine(0, 0, 1, 0, 0.40, 1, "#b45309", 0.5);

        iLine(1, 0.40, 0, 1, 0.40, 1, "#f59e0b", 0.75);
        iLine(1, 0, 0, 1, 0, 1, "#f59e0b", 0.75);
        iLine(1, 0, 0, 1, 0.40, 0, "#f59e0b", 0.75);
        iLine(1, 0, 1, 1, 0.40, 1, "#b45309", 0.5);

        for (let z = 0.08; z <= 0.92; z += 0.16) {
          iLine(0, 0.02, z, 1, 0.02, z, "#f59e0b", 0.85);
          iLine(0, 0.02, z + 0.03, 1, 0.02, z + 0.03, "#f59e0b", 0.85);
          iLine(0, 0.04, z + 0.015, 1, 0.04, z + 0.015, "#fbbf24", 0.5);
        }
      }

      // 3. CAVI CHE CORRONO NELLA CANALINA (Fasci ben definiti e puliti)
      const cableRuns = [
        { nx: 0.22, ny: 0.05, col: "#38bdf8" },
        { nx: 0.48, ny: 0.05, col: "#fbbf24" },
        { nx: 0.76, ny: 0.05, col: "#4ade80" }
      ];
      cableRuns.forEach(c => {
        iLine(c.nx, c.ny, 0, c.nx, c.ny, 1, c.col, 0.8);
      });

      // 4. FASCETTE ANCORAGGIO CAVI IN 3D (alle mensole)
      if (state.clamps) {
        zSupports.forEach(zs => {
          iLine(-0.02, 0.07, zs, 1.02, 0.07, zs, "#06b6d4", 0.75);
        });
      }

      // 5. SETTO TAGLIAFUOCO EI120 (se reiCount > 0)
      if (state.reiCount > 0) {
        const midZ = (zSupports[0] + zSupports[1]) / 2;
        iLine(-0.05, -0.05, midZ, -0.05, 0.48, midZ, "#ef4444", 0.75);
        iLine(-0.05, 0.48, midZ, 1.05, 0.48, midZ, "#ef4444", 0.75);
        iLine(1.05, 0.48, midZ, 1.05, -0.05, midZ, "#ef4444", 0.75);
        iLine(1.05, -0.05, midZ, -0.05, -0.05, midZ, "#ef4444", 0.75);
        const pRei = iso(1.06, 0.22, midZ);
        text("VISTA_3D_ISO", pRei.px + 2, pRei.py, 1.85, \`SETTO EI120 (\${state.reiCount}x)\`, "#f87171", "left");
      }

      // 6. QUOTA DELLA DISTANZA TRA LE MENSOLE (Passo Ls)
      const dimNy = -0.16;
      const pZ1 = iso(0.50, dimNy, zSupports[0]);
      const pZ2 = iso(0.50, dimNy, zSupports[1]);
      // Linee di testimone
      iLine(0.50, -0.06, zSupports[0], 0.50, dimNy - 0.03, zSupports[0], "#38bdf8", 0.35);
      iLine(0.50, -0.06, zSupports[1], 0.50, dimNy - 0.03, zSupports[1], "#38bdf8", 0.35);
      // Linea di quota
      line("VISTA_3D_ISO", pZ1.px, pZ1.py, pZ2.px, pZ2.py, "#f59e0b", 0.55);
      // Trattini terminali a 45
      line("VISTA_3D_ISO", pZ1.px - 1.5, pZ1.py - 1.5, pZ1.px + 1.5, pZ1.py + 1.5, "#f59e0b", 0.6);
      line("VISTA_3D_ISO", pZ2.px - 1.5, pZ2.py - 1.5, pZ2.px + 1.5, pZ2.py + 1.5, "#f59e0b", 0.6);

      const midPt = iso(0.50, dimNy, (zSupports[0] + zSupports[1]) / 2);
      text("VISTA_3D_ISO", midPt.px, midPt.py - 3.5, 2.15,
        \`PASSO MENSOLE Ls = \${state.spanM.toFixed(2)} m (SWL = \${metrics.qMaxKgM} kg/m)\`,
        "#fbbf24", "center");`;

const replIsoScene = `      // Coordinate normalizzate con assonometria slanciata, volumetrica e non schiacciata (Punto 3):
      // nx: [0 (fronte destro), 1 (lato parete sinistro)]
      // ny: [-0.18 (supporti mensole), 0.70 (soffitto)]
      // nz: [0 (fronte sezione), 1 (retro assonometrico)]
      const iso = (nx, ny, nz) => ({
        px: uMinX + (0.34 + 0.50 * nz - 0.30 * nx) * uW,
        py: uMinY + (0.08 + 0.22 * nz + 0.16 * nx + 0.52 * ny) * uH
      });

      const iLine = (nx1, ny1, nz1, nx2, ny2, nz2, c = mat.stroke || "#94a3b8", lw = 0.45, alpha = 1) => {
        const p1 = iso(nx1, ny1, nz1), p2 = iso(nx2, ny2, nz2);
        line("VISTA_3D_ISO", p1.px, p1.py, p2.px, p2.py, c, lw, alpha);
      };

      // 1. SUPPORTO / MENSOLE (zSupports = [0.20, 0.80])
      const zSupports = [0.20, 0.80];
      zSupports.forEach(zs => {
        if (state.support.startsWith("wall_")) {
          // Parete verticale posteriore
          iLine(1.05, -0.18, zs, 1.05, 0.68, zs, "#475569", 0.4);
          // Piastra mensola a parete
          iLine(1.03, -0.16, zs, 1.03, 0.58, zs, "#94a3b8", 0.7);
          // Braccio orizzontale mensola sotto la canalina
          iLine(1.03, -0.05, zs, -0.06, -0.05, zs, "#94a3b8", 0.85);
          iLine(1.03, -0.09, zs, -0.06, -0.09, zs, "#64748b", 0.5);
          iLine(-0.06, -0.05, zs, -0.06, -0.09, zs, "#94a3b8", 0.6);
          // Puntone diagonale (wall_med e wall_heavy)
          if (state.support !== "wall_light") {
            iLine(1.03, -0.15, zs, 0.35, -0.05, zs, "#94a3b8", 0.75);
          }
        } else if (state.support === "ceiling_trap") {
          // Traversa orizzontale a trapezio sotto canalina
          iLine(-0.08, -0.06, zs, 1.08, -0.06, zs, "#94a3b8", 0.85);
          // Barre filettate M8/M10 verticali verso soffitto
          iLine(-0.06, -0.06, zs, -0.06, 0.70, zs, "#cbd5e1", 0.5);
          iLine(1.06, -0.06, zs, 1.06, 0.70, zs, "#cbd5e1", 0.5);
          // Piastrine di ancoraggio a soffitto
          iLine(-0.09, 0.70, zs, -0.03, 0.70, zs, "#94a3b8", 0.7);
          iLine(1.03, 0.70, zs, 1.09, 0.70, zs, "#94a3b8", 0.7);
        } else if (state.support === "ceiling_single") {
          // Pendino singolo centrale
          iLine(0.50, -0.06, zs, 0.50, 0.70, zs, "#cbd5e1", 0.75);
          iLine(-0.05, -0.06, zs, 1.05, -0.06, zs, "#94a3b8", 0.8);
          iLine(0.45, 0.70, zs, 0.55, 0.70, zs, "#94a3b8", 0.7);
        } else {
          // Supporto a pavimento omega
          iLine(-0.04, -0.05, zs, -0.04, -0.18, zs, "#94a3b8", 0.75);
          iLine(1.04, -0.05, zs, 1.04, -0.18, zs, "#94a3b8", 0.75);
          iLine(-0.08, -0.18, zs, 1.08, -0.18, zs, "#64748b", 0.5);
        }
      });

      // 2. CORPO DELLA CANALINA STILIZZATO PER TIPOLOGIA (Altezza sponda spH = 0.55)
      const trayStroke = mat.stroke || "#cbd5e1";
      const spH = 0.55;
      if (state.trayType === "solid") {
        // Canale Chiuso Cieco
        iLine(0, 0, 0, 1, 0, 0, trayStroke, 0.7);
        iLine(1, 0, 0, 1, 0, 1, trayStroke, 0.7);
        iLine(1, 0, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(0, 0, 1, 0, 0, 0, trayStroke, 0.7);
        // Parete frontale
        iLine(0, 0, 0, 0, spH, 0, trayStroke, 0.75);
        iLine(0, spH, 0, 0, spH, 1, trayStroke, 0.75);
        iLine(0, spH, 1, 0, 0, 1, "#64748b", 0.45);
        // Parete posteriore
        iLine(1, 0, 0, 1, spH, 0, trayStroke, 0.75);
        iLine(1, spH, 0, 1, spH, 1, trayStroke, 0.75);
        iLine(1, spH, 1, 1, 0, 1, "#64748b", 0.45);
        // Bordini di ritorno a C
        iLine(0, spH, 0, 0.05, spH, 0, "#94a3b8", 0.5);
        iLine(0.05, spH, 0, 0.05, spH, 1, "#94a3b8", 0.4);
        iLine(1, spH, 0, 0.95, spH, 0, "#94a3b8", 0.5);
        iLine(0.95, spH, 0, 0.95, spH, 1, "#94a3b8", 0.4);

        if (state.cover !== "none") {
          iLine(-0.02, spH + 0.03, 0, 1.02, spH + 0.03, 0, "#38bdf8", 0.7);
          iLine(1.02, spH + 0.03, 0, 1.02, spH + 0.03, 1, "#38bdf8", 0.7);
          iLine(1.02, spH + 0.03, 1, -0.02, spH + 0.03, 1, "#0284c7", 0.45);
          iLine(-0.02, spH + 0.03, 1, -0.02, spH + 0.03, 0, "#38bdf8", 0.7);
        }
      } else if (state.trayType === "perforated") {
        // Canale Asolato con Feritoie
        iLine(0, 0, 0, 1, 0, 0, trayStroke, 0.7);
        iLine(1, 0, 0, 1, 0, 1, trayStroke, 0.7);
        iLine(1, 0, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(0, 0, 1, 0, 0, 0, trayStroke, 0.7);
        iLine(0, 0, 0, 0, spH, 0, trayStroke, 0.75);
        iLine(0, spH, 0, 0, spH, 1, trayStroke, 0.75);
        iLine(0, spH, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(1, 0, 0, 1, spH, 0, trayStroke, 0.75);
        iLine(1, spH, 0, 1, spH, 1, trayStroke, 0.75);
        iLine(1, spH, 1, 1, 0, 1, "#64748b", 0.45);
        // Feritoie asolate longitudinali lungo fondo e pareti
        for (let z = 0.08; z <= 0.92; z += 0.12) {
          iLine(0.25, 0, z, 0.25, 0, z + 0.05, "#f59e0b", 0.4);
          iLine(0.75, 0, z, 0.75, 0, z + 0.05, "#f59e0b", 0.4);
          iLine(0, 0.28, z, 0, 0.28, z + 0.05, "#f59e0b", 0.4);
          iLine(1, 0.28, z, 1, 0.28, z + 0.05, "#f59e0b", 0.4);
        }
      } else if (state.trayType === "mesh") {
        // Passerella a Filo Rete (Cablofil)
        iLine(0, spH, 0, 0, spH, 1, "#38bdf8", 0.7);
        iLine(1, spH, 0, 1, spH, 1, "#38bdf8", 0.7);
        iLine(0, 0, 0, 0, 0, 1, "#38bdf8", 0.7);
        iLine(1, 0, 0, 1, 0, 1, "#38bdf8", 0.7);
        iLine(0.33, 0, 0, 0.33, 0, 1, "#0284c7", 0.45);
        iLine(0.66, 0, 0, 0.66, 0, 1, "#0284c7", 0.45);
        for (let z = 0.05; z <= 0.95; z += 0.10) {
          iLine(0, spH, z, 0, 0, z, "#0284c7", 0.5);
          iLine(0, 0, z, 1, 0, z, "#0284c7", 0.5);
          iLine(1, 0, z, 1, spH, z, "#0284c7", 0.5);
        }
      } else if (state.trayType === "ladder") {
        // Passerella a Pioli / Scaletta
        iLine(0, spH, 0, 0, spH, 1, "#f59e0b", 0.75);
        iLine(0, 0, 0, 0, 0, 1, "#f59e0b", 0.75);
        iLine(0, 0, 0, 0, spH, 0, "#f59e0b", 0.75);
        iLine(0, 0, 1, 0, spH, 1, "#b45309", 0.5);

        iLine(1, spH, 0, 1, spH, 1, "#f59e0b", 0.75);
        iLine(1, 0, 0, 1, 0, 1, "#f59e0b", 0.75);
        iLine(1, 0, 0, 1, spH, 0, "#f59e0b", 0.75);
        iLine(1, 0, 1, 1, spH, 1, "#b45309", 0.5);

        for (let z = 0.08; z <= 0.92; z += 0.16) {
          iLine(0, 0.02, z, 1, 0.02, z, "#f59e0b", 0.85);
          iLine(0, 0.02, z + 0.03, 1, 0.02, z + 0.03, "#f59e0b", 0.85);
          iLine(0, 0.04, z + 0.015, 1, 0.04, z + 0.015, "#fbbf24", 0.5);
        }
      }

      // 3. CAVI CHE CORRONO NELLA CANALINA (Fasci ben definiti e puliti)
      const cableRuns = [
        { nx: 0.22, ny: 0.06, col: "#38bdf8" },
        { nx: 0.48, ny: 0.06, col: "#fbbf24" },
        { nx: 0.76, ny: 0.06, col: "#4ade80" }
      ];
      cableRuns.forEach(c => {
        iLine(c.nx, c.ny, 0, c.nx, c.ny, 1, c.col, 0.8);
      });

      // 4. FASCETTE ANCORAGGIO CAVI IN 3D (alle mensole)
      if (state.clamps) {
        zSupports.forEach(zs => {
          iLine(-0.02, 0.08, zs, 1.02, 0.08, zs, "#06b6d4", 0.75);
        });
      }

      // 5. SETTO TAGLIAFUOCO EI120 (se reiCount > 0)
      if (state.reiCount > 0) {
        const midZ = (zSupports[0] + zSupports[1]) / 2;
        iLine(-0.05, -0.05, midZ, -0.05, spH + 0.08, midZ, "#ef4444", 0.75);
        iLine(-0.05, spH + 0.08, midZ, 1.05, spH + 0.08, midZ, "#ef4444", 0.75);
        iLine(1.05, spH + 0.08, midZ, 1.05, -0.05, midZ, "#ef4444", 0.75);
        iLine(1.05, -0.05, midZ, -0.05, -0.05, midZ, "#ef4444", 0.75);
        const pRei = iso(1.06, 0.28, midZ);
        text("VISTA_3D_ISO", pRei.px + 2, pRei.py, 1.85, \`SETTO EI120 (\${state.reiCount}x)\`, "#f87171", "left");
      }

      // 6. QUOTA DELLA DISTANZA TRA LE MENSOLE (Passo Ls)
      const dimNy = -0.13;
      const pZ1 = iso(0.50, dimNy, zSupports[0]);
      const pZ2 = iso(0.50, dimNy, zSupports[1]);
      // Linee di testimone
      iLine(0.50, -0.06, zSupports[0], 0.50, dimNy - 0.02, zSupports[0], "#38bdf8", 0.35);
      iLine(0.50, -0.06, zSupports[1], 0.50, dimNy - 0.02, zSupports[1], "#38bdf8", 0.35);
      // Linea di quota
      line("VISTA_3D_ISO", pZ1.px, pZ1.py, pZ2.px, pZ2.py, "#f59e0b", 0.55);
      // Trattini terminali a 45°
      line("VISTA_3D_ISO", pZ1.px - 1.5, pZ1.py - 1.5, pZ1.px + 1.5, pZ1.py + 1.5, "#f59e0b", 0.6);
      line("VISTA_3D_ISO", pZ2.px - 1.5, pZ2.py - 1.5, pZ2.px + 1.5, pZ2.py + 1.5, "#f59e0b", 0.6);

      const midPt = iso(0.50, dimNy, (zSupports[0] + zSupports[1]) / 2);
      text("VISTA_3D_ISO", midPt.px, midPt.py - 3.5, 2.15,
        \`PASSO MENSOLE Ls = \${state.spanM.toFixed(2)} m (SWL = \${metrics.qMaxKgM} kg/m)\`,
        "#fbbf24", "center");`;
content = content.replace(targetIsoScene, replIsoScene);

// ============================================================================
// 7. ADD QUICK HELP & PWA MODALS BEFORE <script>
// ============================================================================
const modalsHtml = `  <!-- MODALE GUIDA RAPIDA E SCORCIATOIE (F1) -->
  <div id="quickHelpModal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
    <div class="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
      <div class="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center border border-cyan-500/30">?</span>
          <h3 class="text-sm font-bold text-white uppercase tracking-wide">Guida Rapida &amp; Scorciatoie CAD</h3>
        </div>
        <button type="button" onclick="closeQuickHelpModal()" class="text-slate-400 hover:text-white font-bold text-lg leading-none">&times;</button>
      </div>
      <div class="p-4 overflow-y-auto space-y-4 text-slate-300">
        <div>
          <h4 class="text-cyan-300 font-bold uppercase text-[11px] mb-1.5">Scorciatoie da Tastiera</h4>
          <div class="grid grid-cols-2 gap-2 text-[11px] mono">
            <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-400">Ctrl + O</span><span class="text-amber-300 font-bold">Apri DWG / DXF</span></div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-400">Home</span><span class="text-amber-300 font-bold">Zoom Tutto (Centra)</span></div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-400">Del / Canc</span><span class="text-amber-300 font-bold">Svuota Canalina</span></div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-400">F1</span><span class="text-amber-300 font-bold">Questa Guida</span></div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-400">F5</span><span class="text-amber-300 font-bold">Ricalcola Portate</span></div>
            <div class="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center"><span class="text-slate-400">Esc</span><span class="text-amber-300 font-bold">Chiudi Finestre / Menu</span></div>
          </div>
        </div>
        <div>
          <h4 class="text-cyan-300 font-bold uppercase text-[11px] mb-1.5">Comandi Mouse &amp; Touch</h4>
          <ul class="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
            <li><strong class="text-white">Pan (Spostamento):</strong> Clicca con tasto sinistro e trascina sulla tela CAD, oppure trascina con un dito su touch.</li>
            <li><strong class="text-white">Zoom:</strong> Ruota la rotellina del mouse in avanti/indietro, oppure fai pinch-to-zoom con due dita su touch.</li>
            <li><strong class="text-white">Selezione Cavo:</strong> Clicca o tocca un conduttore per evidenziarlo ed esaminarne la scheda tecnica.</li>
          </ul>
        </div>
        <div>
          <h4 class="text-cyan-300 font-bold uppercase text-[11px] mb-1.5">Caratteristiche Motore CAD</h4>
          <ul class="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
            <li><strong class="text-white">Motore DWG WASM:</strong> Decompressione diretta dei file binari AutoCAD in memoria client-side.</li>
            <li><strong class="text-white">PDF Unifilare:</strong> Accoppiamento automatico sigle, descrizioni utenze, sezioni e correnti di progetto.</li>
            <li><strong class="text-white">Verifica Curva EN 61537:</strong> Calcolo carico di lavoro ammissibile (SWL) e freccia elastica $f$.</li>
            <li><strong class="text-white">DXF 1:1 Compatibile:</strong> Esportazione conforme AutoCAD AC1009/R12 (apertura istantanea in LT 2021..2026).</li>
          </ul>
        </div>
      </div>
      <div class="p-3 bg-slate-950 border-t border-slate-800 text-right">
        <button type="button" onclick="closeQuickHelpModal()" class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition">Chiudi</button>
      </div>
    </div>
  </div>

  <!-- MODALE PWA OFFLINE READY -->
  <div id="pwaOfflineModal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
    <div class="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
      <div class="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center border border-emerald-500/30">✓</span>
          <h3 class="text-sm font-bold text-emerald-300 uppercase tracking-wide">PWA &amp; Disponibilità Offline</h3>
        </div>
        <button type="button" onclick="closePwaOfflineModal()" class="text-slate-400 hover:text-white font-bold text-lg leading-none">&times;</button>
      </div>
      <div class="p-4 overflow-y-auto space-y-3.5 text-slate-300 text-[11px] leading-relaxed">
        <div class="flex items-start gap-3 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl">
          <span class="text-2xl">⚡</span>
          <div>
            <div class="font-bold text-emerald-300 text-xs mb-0.5">Architettura 100% Client-Side e Sicura</div>
            <div>Constructive Cable Tray Studio opera interamente all'interno della memoria del browser. Tutti i calcoli (motore LibreDWG WebAssembly, parsing PDF unifilare, verifica curva EN 61537 ed export CAD DXF) avvengono localmente sul dispositivo. Nessun dato, file o disegno viene inviato a server esterni.</div>
          </div>
        </div>

        <div>
          <h4 class="text-cyan-300 font-bold uppercase text-[11px] mb-1">Come installare come App Desktop o Mobile:</h4>
          <ol class="list-decimal pl-4 space-y-1 text-slate-300">
            <li><strong>Google Chrome o Microsoft Edge (PC / Mac):</strong> Clicca sull'icona di installazione <span class="mono text-cyan-300">[⊕]</span> nella barra degli indirizzi o nel menu seleziona <em>"Installa Cable Tray Studio..."</em>.</li>
            <li><strong>Smartphone / Tablet Android:</strong> Apri il menu del browser (3 puntini) e tocca <em>"Aggiungi a schermata Home"</em> o <em>"Installa app"</em>.</li>
            <li><strong>iPhone / iPad (iOS Safari):</strong> Tocca il pulsante di condivisione <span class="mono text-cyan-300">[↑]</span> e seleziona <em>"Aggiungi alla schermata Home"</em>.</li>
          </ol>
        </div>

        <div>
          <h4 class="text-cyan-300 font-bold uppercase text-[11px] mb-1">Funzionamento Offline Completo</h4>
          <p>Grazie al Service Worker e al Web App Manifest incorporati, puoi aprire il software, calcolare ed esportare disegni DXF anche in cantiere o in assenza di connessione internet.</p>
        </div>
      </div>
      <div class="p-3 bg-slate-950 border-t border-slate-800 text-right">
        <button type="button" onclick="closePwaOfflineModal()" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded transition">Ho capito</button>
      </div>
    </div>
  </div>\n\n`;

content = content.replace("  <script>\n    // ============================================================================", modalsHtml + "  <script>\n    // ============================================================================");

// ============================================================================
// 8. ADD WINDOWS MENU LOGIC & PWA SERVICE WORKER AT END OF SCRIPT
// ============================================================================
const menuLogicJs = `    // ============================================================================
    // GESTIONE MENU A TENDINA STILE WINDOWS / CAD DESKTOP & PWA OFFLINE READY
    // ============================================================================
    function closeAllMenus() {
      document.querySelectorAll(".win-dropdown").forEach(d => d.classList.add("hidden"));
      document.querySelectorAll(".win-menu-btn").forEach(b => b.classList.remove("bg-slate-800", "text-white"));
    }

    function initWindowsMenuBar() {
      const menuBar = document.getElementById("winMenuBar");
      if (!menuBar) return;
      const items = menuBar.querySelectorAll(".win-menu-item");
      items.forEach(item => {
        const btn = item.querySelector(".win-menu-btn");
        const dd = item.querySelector(".win-dropdown");
        if (!btn || !dd) return;

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isClosed = dd.classList.contains("hidden");
          closeAllMenus();
          if (isClosed) {
            dd.classList.remove("hidden");
            btn.classList.add("bg-slate-800", "text-white");
          }
        });

        btn.addEventListener("mouseenter", () => {
          const anyOpen = Array.from(document.querySelectorAll(".win-dropdown")).some(d => !d.classList.contains("hidden"));
          if (anyOpen) {
            closeAllMenus();
            dd.classList.remove("hidden");
            btn.classList.add("bg-slate-800", "text-white");
          }
        });
      });

      document.addEventListener("click", (e) => {
        if (!e.target.closest("#winMenuBar")) {
          closeAllMenus();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeAllMenus();
          closeQuickHelpModal();
          closePwaOfflineModal();
          const dbM = document.getElementById("databaseCatalogModal");
          if (dbM && !dbM.classList.contains("hidden")) toggleDatabaseModal();
          const expM = document.getElementById("exportOptionsModal");
          if (expM && !expM.classList.contains("hidden")) toggleExportOptionsModal();
        } else if (e.key === "F1") {
          e.preventDefault();
          showQuickHelpModal();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "o" || e.key === "O")) {
          e.preventDefault();
          const dwgInp = document.getElementById("dwgInput");
          if (dwgInp) dwgInp.click();
        }
      });
    }

    function showQuickHelpModal() {
      closeAllMenus();
      const m = document.getElementById("quickHelpModal");
      if (m) m.classList.remove("hidden");
    }

    function closeQuickHelpModal() {
      const m = document.getElementById("quickHelpModal");
      if (m) m.classList.add("hidden");
    }

    function showPwaOfflineInfo() {
      closeAllMenus();
      const m = document.getElementById("pwaOfflineModal");
      if (m) m.classList.remove("hidden");
    }

    function closePwaOfflineModal() {
      const m = document.getElementById("pwaOfflineModal");
      if (m) m.classList.add("hidden");
    }

    function initPwaOffline() {
      if ("serviceWorker" in navigator) {
        try {
          const swCode = "const CACHE_NAME='canalo-cache-v16';self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(clients.claim()));self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});";
          const blob = new Blob([swCode], { type: "application/javascript" });
          const swUrl = URL.createObjectURL(blob);
          navigator.serviceWorker.register(swUrl).then(() => {
            const badge = document.getElementById("pwaStatusBadge");
            if (badge) {
              badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> PWA Offline Ready';
            }
          }).catch(() => {});
        } catch (e) {}
      }
    }\n\n`;

const targetDomLoaded = `    window.addEventListener("DOMContentLoaded", () => {
      initCatalogDropdown();
      populateBrandSeries();
      resetProject();
      syncActiveSectionToMultiStore();
      initLibreDwgEngine();
      window.addEventListener("resize", drawScene);
    });`;

const replDomLoaded = `${menuLogicJs}    window.addEventListener("DOMContentLoaded", () => {
      initWindowsMenuBar();
      initPwaOffline();
      initCatalogDropdown();
      populateBrandSeries();
      resetProject();
      syncActiveSectionToMultiStore();
      initLibreDwgEngine();
      window.addEventListener("resize", drawScene);
    });`;

content = content.replace(targetDomLoaded, replDomLoaded);

fs.writeFileSync('Canalo.html', content, 'utf8');
console.log('Successfully updated Canalo.html!');

