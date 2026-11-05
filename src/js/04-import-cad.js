    // ============================================================================
    // 5. VERO PARSER GEOMETRICO .DWG (LIBREDWG C/WASM) E MATCHING CON TABELLE/PDF
    // ============================================================================
    function extractRawAscii(uint8) {
      let s = "";
      for (let i = 0; i < uint8.length; i++) {
        const b = uint8[i];
        s += (b >= 32 && b <= 126) || b === 10 || b === 13 ? String.fromCharCode(b) : " ";
      }
      return s;
    }

    // Pulisce codici di formattazione AutoCAD MTEXT (es. \A1; \fArial|b0; {\H0.8x;...}) e decodifica sequenze \U+XXXX
    function cleanAcadMText(rawStr) {
      return String(rawStr || "")
        .replace(/\\U\+([0-9A-Fa-f]{4})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\P/gi, " ")
        .replace(/\\~|\^J/g, " ")
        .replace(/\\[A-Za-z][^;]*;/g, "")
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
    // Estrae e separa codice circuito pulito, formazione inline e descrizione inline
    function parseCalloutLabelString(rawLblStr) {
      let s = String(rawLblStr || "").trim();
      s = s.replace(/^#\d+\s+/, "").trim();
      let inlineForm = null;
      const mParen = s.match(/\(([^)]+)\)\s*$/);
      if (mParen && /[xXGg]\d+|Ø/i.test(mParen[1])) {
        const fm = mParen[1].match(/\d*\(\d+[xXGg]\d+(?:[.,]\d+)?\)|\b\d+[xXGg]\d+(?:[.,]\d+)?\b/i);
        if (fm) inlineForm = fm[0];
        s = s.substring(0, mParen.index).trim();
      }

      let cleanCode = s;
      let inlineDesc = null;

      // Se la stringa contiene un codice circuito seguito da una descrizione
      // es. "QPT-DX-N C-21 Alimentazione Centralina DALI 1 / 1,053"
      const mCode = s.match(/^([A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+C-?\d+|C-?\d+|[A-Z0-9_-]+-C\d+)\b/i);
      if (mCode) {
        cleanCode = mCode[1].trim();
        const rem = s.substring(mCode[0].length).trim();
        if (rem.length > 0) {
          inlineDesc = cleanUtenzaDescription(rem, cleanCode);
        }
      }

      return { cleanCode, inlineForm, inlineDesc };
    }


    async function processSingleCADFile(file) {
      const buf = await file.arrayBuffer();
      const uint8 = new Uint8Array(buf);
      const rawAscii = extractRawAscii(uint8);
      const headerVer = rawAscii.substring(0, 6).trim();

      if (file.name.toLowerCase().endsWith(".dxf") || (rawAscii.includes("SECTION") && rawAscii.includes("ENTITIES"))) {
        const log = parseDXFTextContent(rawAscii, file.name);
        return { success: true, log };
      }

      if (!globalLibreDwgInstance) {
        globalLibreDwgInstance = await loadLibreDwgWasmInstance();
      }

      const fileType = (globalLibreDwgLib && globalLibreDwgLib.Dwg_File_Type) ? globalLibreDwgLib.Dwg_File_Type.DWG : 0;
      let dwgDataPtr;
      try {
        dwgDataPtr = globalLibreDwgInstance.dwg_read_data(buf, fileType);
      } catch (eRead) {
        dwgDataPtr = globalLibreDwgInstance.dwg_read_data(uint8, fileType);
      }

      if (!dwgDataPtr) {
        throw new Error(`Il file DWG (${headerVer}) non è stato decodificato dal parser (puntatore nullo).`);
      }

      const db = globalLibreDwgInstance.convert(dwgDataPtr);
      let allEntities = (db && Array.isArray(db.entities)) ? [...db.entities] : [];
      if (allEntities.length === 0 && db && db.tables && db.tables.BLOCK_RECORD && Array.isArray(db.tables.BLOCK_RECORD.entries)) {
        db.tables.BLOCK_RECORD.entries.forEach(br => {
          if (Array.isArray(br.entities)) allEntities.push(...br.entities);
        });
      }

      if (allEntities.length > 0) {
        const log = processRealWasmEntities(allEntities, file.name, headerVer);
        return { success: true, log };
      } else {
        throw new Error(`Lettura completata, ma 0 entità visibili estratte dal DWG (${headerVer}).`);
      }
    }

    async function importCADFile(inputEl) {
      const files = Array.from((inputEl && inputEl.files) || []);
      if (!files || files.length === 0) return;
      const banner = document.getElementById("statusBanner");
      const inspBox = document.getElementById("dwgInspectorContent");

      if (banner) {
        banner.textContent = `Caricamento di ${files.length} file CAD in corso...`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold";
      }

      if (projectSections.length === 0) {
        projectSections.push(cloneStateSnapshot(state));
        currentSectionIdx = 0;
      } else {
        projectSections[currentSectionIdx] = cloneStateSnapshot(state);
      }

      let loadedCount = 0;
      const logs = [];
      const errorMsgs = [];

      for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const file = files[fIdx];
        if (banner) banner.textContent = `Caricamento file ${fIdx + 1}/${files.length}: "${file.name}"...`;

        const isCurrentEmpty = state.cables.length === 0 && state.title.startsWith("NUOVA CANALINA");
        if (fIdx > 0 || !isCurrentEmpty) {
          const newSec = cloneStateSnapshot(state);
          newSec.cables = [];
          newSec.title = file.name.replace(/\.(dwg|dxf)$/i, "");
          const nextLetter = String.fromCharCode(65 + Math.min(25, projectSections.length));
          newSec.planTag = `SEZ. ${nextLetter}-${nextLetter} | H=+3.20m`;
          projectSections.push(newSec);
          currentSectionIdx = projectSections.length - 1;
          state = cloneStateSnapshot(newSec);
        }

        try {
          const res = await processSingleCADFile(file);
          if (res && res.log) logs.push(res.log);
          projectSections[currentSectionIdx] = cloneStateSnapshot(state);
          loadedCount++;
        } catch (err) {
          console.error(`Errore caricamento ${file.name}:`, err);
          const msg = (err && err.message) ? err.message : String(err);
          logs.push(`ERRORE "${file.name}": ${msg}`);
          errorMsgs.push(`${file.name}: ${msg}`);
        }
      }

      renderMultiSectionTabs();
      pushStateToUI();
      recalculateAll();
      updateTableUI();
      fitAll();

      if (inspBox && logs.length > 0) inspBox.textContent = logs.join("\n\n" + "=".repeat(60) + "\n\n");
      const inspModal = document.getElementById("dwgInspectorModal");
      if (inspModal && (loadedCount > 0 || errorMsgs.length > 0)) inspModal.classList.remove("hidden");

      if (loadedCount > 0 && errorMsgs.length === 0) toast(`Importati ${loadedCount} file CAD`, "ok");
      else if (errorMsgs.length > 0) toast(`Errore import CAD — ${errorMsgs[0]}`, loadedCount > 0 ? "warn" : "error", null, 9000);

      if (banner) {
        if (loadedCount > 0 && errorMsgs.length === 0) {
          banner.textContent = `✓ Caricati con successo ${loadedCount} file CAD in ${projectSections.length} schede canalina distinte!`;
          banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
        } else if (loadedCount > 0 && errorMsgs.length > 0) {
          banner.textContent = `⚠ Caricati ${loadedCount}/${files.length} file CAD (${errorMsgs.length} errori: ${errorMsgs[0]})`;
          banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold";
        } else {
          banner.textContent = `Errore lettura DWG/DXF: ${errorMsgs[0] || 'Impossibile leggere il file'}`;
          banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold";
        }
      }
      if (inputEl) inputEl.value = "";
    }

    // Estrazione geometrica avanzata + ricostruzione catene Bandierine + lettura Tabelle DWG interne
    function processRealWasmEntities(entities, fileName, headerVer) {
      const traySegments = [];
      const rawCircles = [];
      const rawTexts = [];
      const bandierineSegments = [];

      const isTrayLay = (lay) => /CANAL|PASSERELL|TRAY|PROFIL|SEZION|CONDOTT|BORDO|CONTORN/i.test(lay);
      const isLeaderLay = (lay) => /BANDIERINE|LEADER|RICHIAM/i.test(lay);

      entities.forEach(ent => {
        const lay = String(ent.layer || "0").trim();
        const t = String(ent.type || "").toUpperCase();

        if (t === "LINE" && ent.startPoint && ent.endPoint) {
          if (isTrayLay(lay)) {
            traySegments.push({ x1: ent.startPoint.x, y1: ent.startPoint.y, x2: ent.endPoint.x, y2: ent.endPoint.y, lay });
          } else if (isLeaderLay(lay)) {
            bandierineSegments.push({ x1: ent.startPoint.x, y1: ent.startPoint.y, x2: ent.endPoint.x, y2: ent.endPoint.y });
          }
        } else if ((t === "LWPOLYLINE" || t === "POLYLINE") && Array.isArray(ent.vertices)) {
          for (let i = 0; i < ent.vertices.length - 1; i++) {
            const seg = { x1: ent.vertices[i].x, y1: ent.vertices[i].y, x2: ent.vertices[i + 1].x, y2: ent.vertices[i + 1].y, lay };
            if (isTrayLay(lay)) traySegments.push(seg);
            else if (isLeaderLay(lay)) bandierineSegments.push(seg);
          }
        } else if (t === "CIRCLE" && ent.center && typeof ent.radius === "number") {
          const d = +(ent.radius * 2).toFixed(1);
          // Escludiamo i micro-cerchi delle anime interne (< 4.5 mm) o simboli cornice
          if (d >= 4.5 && d <= 110.0 && (/CAVI/i.test(lay) || !/ANIME|CORNICE|CARTIGLIO|SIMB/i.test(lay))) {
            rawCircles.push({ cx: +ent.center.x.toFixed(2), cy: +ent.center.y.toFixed(2), r: +ent.radius.toFixed(2), d, lay });
          }
        } else if (t === "TEXT" || t === "MTEXT") {
          const rawStr = ent.text || ent.value || ent.string || "";
          const str = cleanAcadMText(rawStr);
          const pt = ent.startPoint || ent.insertionPoint || ent.position || { x: 0, y: 0 };
          if (str.length > 0) {
            rawTexts.push({ str, x: +(pt.x || 0).toFixed(2), y: +(pt.y || 0).toFixed(2), lay });
          }
        }
      });

      // Se non abbiamo trovato segmenti su layer specifici, recuperiamo le linee non-cavi e non-testi (es. layer '0' o generico)
      if (traySegments.length === 0) {
        entities.forEach(ent => {
          const lay = String(ent.layer || "0").trim();
          const t = String(ent.type || "").toUpperCase();
          if (/CAVI|ANIME|BANDIERINE|LEADER|RICHIAM|QUOTE|DIM|CORNICE|CARTIGLIO|TABELLA/i.test(lay)) return;
          if (t === "LINE" && ent.startPoint && ent.endPoint) {
            traySegments.push({ x1: ent.startPoint.x, y1: ent.startPoint.y, x2: ent.endPoint.x, y2: ent.endPoint.y, lay });
          } else if ((t === "LWPOLYLINE" || t === "POLYLINE") && Array.isArray(ent.vertices)) {
            for (let i = 0; i < ent.vertices.length - 1; i++) {
              traySegments.push({ x1: ent.vertices[i].x, y1: ent.vertices[i].y, x2: ent.vertices[i + 1].x, y2: ent.vertices[i + 1].y, lay });
            }
          }
        });
      }

      // Filtra eventuali cerchi concentrici (es. guaina interna disegnata sul layer Cavi dentro il cavo esterno)
      rawCircles.sort((a, b) => b.r - a.r);
      const outerCircles = [];
      rawCircles.forEach(c => {
        const isInsideExisting = outerCircles.some(outer => Math.hypot(c.cx - outer.cx, c.cy - outer.cy) < outer.r * 0.85);
        if (!isInsideExisting) outerCircles.push(c);
      });

      // =========================================================================
      // 1. ESTRAZIONE DIMENSIONI CANALINA (L, H) - LETTURA DIRETTA DAL FILE DI INPUT
      // Convenzione passerelle/canaline: se legge "75x300", 75 è l'altezza H e 300 la base L.
      // La dimensione maggiore è sempre la base (larghezza L), la minore è l'altezza (sponda H).
      // =========================================================================
      const allTextCorpus = rawTexts.map(t => t.str).join(" | ");
      let detectedW = null, detectedH = null;

      // Helper di assegnazione corretta (base L = maggiore, altezza H = minore)
      function assignTrayDims(dimA, dimB) {
        if (!dimA || !dimB) return;
        const d1 = parseInt(dimA, 10), d2 = parseInt(dimB, 10);
        if (isNaN(d1) || isNaN(d2)) return;
        detectedW = Math.max(d1, d2); // 300 è sempre la base
        detectedH = Math.min(d1, d2); // 75 è sempre l'altezza
      }

      // Priorità A: Ricerca esplicita "L=... H=..." o "B=... H=..." o "W=... H=..."
      const mExplicitLH = allTextCorpus.match(/(?:L|B|W|BASE|LARGHEZZA)\s*[:=]?\s*(\d{2,4})\s*(?:mm)?\s*[,;\s|/-]+\s*(?:H|ALT|ALTEZZA)\s*[:=]?\s*(\d{2,4})\s*(?:mm)?/i)
                       || allTextCorpus.match(/(?:H|ALT|ALTEZZA)\s*[:=]?\s*(\d{2,4})\s*(?:mm)?\s*[,;\s|/-]+\s*(?:L|B|W|BASE|LARGHEZZA)\s*[:=]?\s*(\d{2,4})\s*(?:mm)?/i);
      if (mExplicitLH) {
        const v1 = parseInt(mExplicitLH[1], 10), v2 = parseInt(mExplicitLH[2], 10);
        if (/H|ALT/i.test(mExplicitLH[0].split(/[,;\s|/-]+/)[0])) {
          assignTrayDims(v2, v1);
        } else {
          assignTrayDims(v1, v2);
        }
      }

      // Priorità B: Parola chiave canalina seguita da WxH o HxW (es. "CANALINA 75x300", "CANALE 400x75", "P31 75x300")
      if (!detectedW || !detectedH) {
        const mTrayKeyword = allTextCorpus.match(/(?:CANALINA|CANALE|PASSERELLA|TRAY|P31|CF|RKS|MKS)\b[^\d\n\r]*(\d{2,4})\s*[xX×*]\s*(\d{2,4})/i);
        if (mTrayKeyword) {
          assignTrayDims(mTrayKeyword[1], mTrayKeyword[2]);
        }
      }

      // Priorità C: Dimensioni isolate presenti nei testi del disegno (es. "75x300", "300x100", "75 x 300mm")
      if (!detectedW || !detectedH) {
        const allMatches = [...allTextCorpus.matchAll(/\b(\d{2,4})\s*[xX×*]\s*(\d{2,4})\s*(?:mm)?\b/gi)];
        for (const m of allMatches) {
          const d1 = parseInt(m[1], 10), d2 = parseInt(m[2], 10);
          const maxD = Math.max(d1, d2), minD = Math.min(d1, d2);
          if (maxD >= 40 && maxD <= 1200 && minD >= 20 && minD <= 300) {
            assignTrayDims(d1, d2);
            break;
          }
        }
      }

      // Priorità D: Nome del file di input (es. "Canale_75x300.dxf", "Passerella_400x75.dwg")
      if (!detectedW || !detectedH) {
        const mFile = fileName.match(/(\d{2,4})\s*[xX×*_-]\s*(\d{2,4})/);
        if (mFile) {
          const d1 = parseInt(mFile[1], 10), d2 = parseInt(mFile[2], 10);
          const maxD = Math.max(d1, d2), minD = Math.min(d1, d2);
          if (maxD >= 40 && maxD <= 1200 && minD >= 20 && minD <= 300) {
            assignTrayDims(d1, d2);
          }
        }
      }

      // Priorità E: Calcolo geometrico dai segmenti rilevati
      const VALID_WIDTHS = [50, 60, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1200];
      const VALID_HEIGHTS = [25, 30, 35, 40, 50, 60, 75, 80, 85, 100, 110, 120, 150, 200];
      const snapToStandard = (val, list) => list.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);

      let origX = 0, origY = 0;
      if (traySegments.length > 0) {
        const xs = traySegments.flatMap(s => [s.x1, s.x2]);
        const ys = traySegments.flatMap(s => [s.y1, s.y2]);
        origX = Math.min(...xs);
        origY = Math.min(...ys);
        const spanX = Math.max(...xs) - origX;
        const spanY = Math.max(...ys) - origY;
        if (!detectedW && spanX >= 40 && spanX <= 1200) detectedW = snapToStandard(spanX - 3, VALID_WIDTHS);
        if (!detectedH && spanY >= 20 && spanY <= 400)  detectedH = snapToStandard(spanY - 1.5, VALID_HEIGHTS);
      } else if (outerCircles.length > 0) {
        origX = Math.min(...outerCircles.map(c => c.cx - c.r)) - 12;
        origY = Math.min(...outerCircles.map(c => c.cy - c.r));
      }

      // Assicurazione finale: se detectedW < detectedH, inverti (base è sempre >= altezza)
      if (detectedW && detectedH && detectedW < detectedH) {
        const tmp = detectedW;
        detectedW = detectedH;
        detectedH = tmp;
      }

      // Assegna le dimensioni finali trovate direttamente dal file di input
      state.width = detectedW || state.width || 200;
      state.height = detectedH || state.height || 75;
      const geomW = state.width, geomH = state.height;

      const trayNameInfo = extractTrayNameFromInput(rawTexts, fileName, state.width, state.height);
      state.title = trayNameInfo.title;
      const elExp = document.getElementById("exportName"); if (elExp) elExp.value = trayNameInfo.exportFile;

      const elW = document.getElementById("inpWidth"); if (elW) elW.value = state.width;
      const elH = document.getElementById("inpHeight"); if (elH) elH.value = state.height;
      const elT = document.getElementById("inpTitle"); if (elT) elT.value = state.title;
      const qTitleWasm = document.getElementById("inpTitleQuick");
      if (qTitleWasm) qTitleWasm.value = state.title;
      const hTitle = document.getElementById("headerTitle"); if (hTitle) hTitle.textContent = state.title;
      document.title = `${state.title} — ${APP_NAME}`;

      // Default modalità di posa: Gravità & Scomparti (salvando le coordinate DWG in origX/origY)
      state.packing = "gravity";
      const elPack = document.getElementById("inpPacking"); if (elPack) elPack.value = "gravity";

      // 3. RICOSTRUZIONE EVENTUALI TABELLE CAVI PRESENTI NEL DWG (Raggruppamento per Righe Y)
      // Se nel DWG c'è già una tabella o legenda con Sigla, Descrizione, Tipo Cavo e Formazione, la leggiamo!
      const dwgTableByCode = {};
      const rowToleranceY = 2.8;
      const textRows = [];
      rawTexts.forEach(t => {
        let row = textRows.find(r => Math.abs(r.y - t.y) <= rowToleranceY);
        if (!row) {
          row = { y: t.y, items: [] };
          textRows.push(row);
        }
        row.items.push(t);
      });

      // Funzione di riconoscimento sigle/codici linea per evitare falsi positivi come descrizione
      const isCodeLike = (s) =>
        !/^CANALINA\b|^SCALA|^DATA|^DISEGNATORE|^VISTO|^DESCRIZIONE|^REV\b|^POS\b|^SIGLA\b|^Base\s+L|^H\s*=/i.test(s) &&
        (/[A-Z0-9]+.*C-\d+/i.test(s) || /^(?:QGBT|QP|QE|UPS|IRAI|EVAC|TD|LINEA|CAVO)/i.test(s) || /^#\d+\s+/i.test(s));

      textRows.forEach(row => {
        if (row.items.length < 2) return;
        row.items.sort((a, b) => a.x - b.x);
        const textsInRow = row.items.map(it => it.str.trim());

        // Cerca se nella riga c'è una sigla utenza (es. "QGBT-P C-22" o "QP1-DX-N C-4")
        const codeCandidate = textsInRow.find(s =>
          /^[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+C-\d+/i.test(s) ||
          /^(?:QGBT|QP|QE|QUADRO|UPS|IRAI|EVAC|TD)[A-Z0-9_.-]*(?:\s+C-\d+)?$/i.test(s)
        );
        if (!codeCandidate) return;

        const formCandidate = textsInRow.find(s => /\d*\s*\(\s*\d+[xXGg]\d+(?:[.,]\d+)?\s*\)|\b\d+[xXGg]\d+(?:[.,]\d+)?\b/i.test(s) && s !== codeCandidate);
        const typeCandidate = textsInRow.find(s => /FG16|FTG18|FS17|FG17|H07|RG16|UTP|CAT\./i.test(s) && s !== codeCandidate && s !== formCandidate);
        
        // Cerca colonna sigla cavo dedicata
        const siglaCavoCandidate = textsInRow.find(s =>
          s !== codeCandidate && s !== formCandidate && s !== typeCandidate &&
          /(?:^CV-?\d+|^CAV-?\d+|^(?:FG16|FTG18|FS17|FG17)[A-Z0-9_.-]*)/i.test(s)
        );

        // Estrazione diametro da colonna tabella (es. "18.5", "Ø 18.5", "18,5 mm")
        let diamCandidate = null;
        for (const t of textsInRow) {
          if (t === codeCandidate || t === formCandidate || t === typeCandidate || t === siglaCavoCandidate) continue;
          const mDiam = t.match(/^(?:[ØøD]|diam(?:\.|etro)?\s*:?)?\s*(\d+[.,]\d+)\s*(?:mm)?$/i);
          if (mDiam) {
            const v = parseFloat(mDiam[1].replace(",", "."));
            if (v >= 3 && v <= 80) { diamCandidate = v; break; }
          }
        }

        // Estrazione sezione da colonna tabella (es. "2.5 mm²", "16 mm2", "70")
        let secCandidate = null;
        for (const t of textsInRow) {
          if (t === codeCandidate || t === formCandidate || t === typeCandidate || t === siglaCavoCandidate) continue;
          const mSec = t.match(/^(?:sez(?:\.|ione)?\s*:?)?\s*(\d+(?:[.,]\d+)?)\s*(?:mm[²2]|mq)?$/i);
          if (mSec) {
            const v = parseFloat(mSec[1].replace(",", "."));
            if ([1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400].includes(v)) {
              secCandidate = v; break;
            }
          }
        }

        const descCandidate = textsInRow.find(s =>
          s !== codeCandidate &&
          s !== formCandidate &&
          s !== typeCandidate &&
          s !== siglaCavoCandidate &&
          !isCodeLike(s) &&
          !/^#?\d+$/.test(s) &&
          !/^\d+(?:[.,]\d+)?\s*(?:mm|kg|daN)?$/i.test(s) &&
          !/^(?:BT|ELV|POS|SIGLA|TIPO|FORMAZIONE)$/i.test(s) &&
          s.length >= 4
        );

        const normKey = normalizeLineKey(codeCandidate);
        const baseCandidate = getBaseCircuitCode(codeCandidate);
        const normBaseKey = normalizeLineKey(baseCandidate);
        const rowData = {
          rawCode: codeCandidate,
          baseCode: baseCandidate,
          form: formCandidate || null,
          type: typeCandidate || null,
          siglaCavo: siglaCavoCandidate || null,
          d: diamCandidate || null,
          sec: secCandidate || null,
          desc: descCandidate ? cleanUtenzaDescription(descCandidate) : null
        };
        dwgTableByCode[normKey] = rowData;
        if (!dwgTableByCode[normBaseKey]) {
          dwgTableByCode[normBaseKey] = rowData;
        }
      });

      // 4. ESTRAZIONE SIGLE SULLE BANDIERINE VICINO ALLA SEZIONE

      const calloutTexts = rawTexts.filter(t =>
        (isCodeLike(t.str) || /Testi|Bandierine/i.test(t.lay)) &&
        t.x >= origX - 350 && t.x <= origX + geomW + 350 &&
        !/^CANALINA\b|^Base\s+L|^H\s*=/i.test(t.str) &&
        !/^\d+$/.test(t.str.trim()) 
      );

      function traceLeaderFromCircle(cir) {
        const startSegs = bandierineSegments.filter(seg => {
          const d1 = Math.hypot(seg.x1 - cir.cx, seg.y1 - cir.cy);
          const d2 = Math.hypot(seg.x2 - cir.cx, seg.y2 - cir.cy);
          return d1 <= cir.r + 4.5 || d2 <= cir.r + 4.5;
        });

        let bestLabel = null;
        let bestLabelDist = 9999;

        for (const s0 of startSegs) {
          const d1 = Math.hypot(s0.x1 - cir.cx, s0.y1 - cir.cy);
          const d2 = Math.hypot(s0.x2 - cir.cx, s0.y2 - cir.cy);
          let curEnd = d1 < d2 ? { x: s0.x2, y: s0.y2 } : { x: s0.x1, y: s0.y1 };
          const visited = new Set([s0]);

          for (let hop = 0; hop < 3; hop++) {
            const nextSeg = bandierineSegments.find(s => {
              if (visited.has(s)) return false;
              return Math.hypot(s.x1 - curEnd.x, s.y1 - curEnd.y) < 3.5 || Math.hypot(s.x2 - curEnd.x, s.y2 - curEnd.y) < 3.5;
            });
            if (!nextSeg) break;
            visited.add(nextSeg);
            const nd1 = Math.hypot(nextSeg.x1 - curEnd.x, nextSeg.y1 - curEnd.y);
            curEnd = nd1 < 3.5 ? { x: nextSeg.x2, y: nextSeg.y2 } : { x: nextSeg.x1, y: nextSeg.y1 };
          }

          calloutTexts.forEach(lbl => {
            const dy = Math.abs(lbl.y - curEnd.y);
            const dx = Math.abs(lbl.x - curEnd.x);
            const dist = Math.hypot(dx * 0.45, dy * 2.2); 
            if (dy < 12 && dx < 120 && dist < bestLabelDist) {
              bestLabelDist = dist;
              bestLabel = lbl;
            }
          });
        }
        return bestLabel;
      }

      outerCircles.sort((a, b) => (a.cy - b.cy) || (a.cx - b.cx));

      // parseCalloutLabelString: usa la versione globale definita in testa al file
      const usedCalloutSet = new Set();

      state.cables = outerCircles.map((cir, idx) => {
        let matchedLblObj = traceLeaderFromCircle(cir);

        if (!matchedLblObj) {
          const unused = calloutTexts.filter(l => !usedCalloutSet.has(l));
          if (unused.length > 0) {
            unused.sort((a, b) => Math.hypot(a.x - cir.cx, a.y - cir.cy) - Math.hypot(b.x - cir.cx, b.y - cir.cy));
            matchedLblObj = unused[0];
          }
        }
        if (matchedLblObj) usedCalloutSet.add(matchedLblObj);

        const parsedLbl = parseCalloutLabelString(matchedLblObj ? matchedLblObj.str : `CAVO-${idx + 1}`);
        const exactCode = parsedLbl.cleanCode || `CAVO-${idx + 1}`;
        const baseCircuit = getBaseCircuitCode(exactCode);
        const normKey = normalizeLineKey(exactCode);
        const normBaseKey = normalizeLineKey(baseCircuit);

        const relX = +(cir.cx - origX).toFixed(1);
        const relY = +(cir.cy - origY).toFixed(1);
        const d = cir.d;

        const uInfo = findInUnifilareDict(exactCode) || findInUnifilareDict(baseCircuit);
        const dwgRow = dwgTableByCode[normKey] || dwgTableByCode[normBaseKey];
        const diamSpec = inferCableSpecsByDiameter(d, exactCode, matchedLblObj ? matchedLblObj.lay : "");

        const finalForm = (uInfo && uInfo.form) || (dwgRow && dwgRow.form) || parsedLbl.inlineForm || diamSpec.form;
        const finalType = (uInfo && uInfo.cable) || (dwgRow && dwgRow.type) || diamSpec.type;
        const fallbackDwgDesc = exactCode.startsWith("CAVO-") ? `Utenza ${exactCode.replace("CAVO-", "")}` : `Alimentazione ${baseCircuit}`;
        const finalDesc = (uInfo && uInfo.desc) || (dwgRow && cleanUtenzaDescription(dwgRow.desc, exactCode)) || (parsedLbl && parsedLbl.inlineDesc) || fallbackDwgDesc;
        const finalSec  = (dwgRow && dwgRow.sec) || parseSectionFromForm(finalForm, diamSpec.sec);
        const isUni     = /\b1X\d+|\(\s*1X\d+/i.test(finalForm) || /\bFG16M16\b|\bFS17\b|\bFG17\b/i.test(finalType);
        const finalCores = isUni ? 1 : (finalForm.includes("5G") || finalForm.includes("4G") ? 3 : 2);
        const finalD    = (dwgRow && dwgRow.d) ? dwgRow.d : d;

        return {
          id: idx + 1,
          code: exactCode,
          siglaCavo: (dwgRow && dwgRow.siglaCavo) || null,
          d: finalD,
          w: +(Math.pow(finalD / 10, 2) * 0.145).toFixed(2),
          sec: finalSec,
          cores: finalCores,
          iz0: diamSpec.iz0,
          ib: (state.pdfLoaded && uInfo) ? uInfo.ib : 0,
          bendK: diamSpec.bendK,
          trefoil: false,
          origX: relX,
          origY: relY,
          x: relX,
          y: relY,
          desc: finalDesc,
          type: finalType,
          form: finalForm,
          sys: diamSpec.sys
        };
      });

      // =========================================================================
      // EREDITARIETÀ DESCRIZIONE PER CIRCUITI UNIPOLARI E RAGGRUPPAMENTO
      // =========================================================================
      const circuitGroups = {};
      state.cables.forEach(c => {
        const base = getBaseCircuitCode(c.code);
        if (!circuitGroups[base]) circuitGroups[base] = [];
        circuitGroups[base].push(c);
      });

      // Associazione conduttori per formazioni unipolari (es. 4(1x185), 3(1x240)) con cerchi CAVO-x adiacenti
      Object.entries(circuitGroups).forEach(([base, group]) => {
        if (!base || base.startsWith("CAVO-")) return;
        const main = group[0];
        const formStr = String(main.form || "");
        let expectedCount = 1;
        const mCount = formStr.match(/^(\d+)\s*\(?\s*1[xX]\d+/i) || formStr.match(/^(\d+)[xX]\s*1[xX]\d+/i);
        if (mCount) expectedCount = parseInt(mCount[1], 10);
        else if (/3\(1x.*PE/i.test(formStr)) expectedCount = 5;
        else if (/3\(1x/i.test(formStr)) expectedCount = 4;

        if (expectedCount > group.length) {
          const missing = expectedCount - group.length;
          const candidates = state.cables.filter(c =>
            c.code.startsWith("CAVO-") && Math.abs(c.d - main.d) <= 3.0
          );
          candidates.sort((a, b) => Math.hypot(a.x - main.x, a.y - main.y) - Math.hypot(b.x - main.x, b.y - main.y));
          const toAdd = candidates.slice(0, missing);
          toAdd.forEach((tc, idx) => {
            const phaseSuffixes = ["L2", "L3", "N", "PE"];
            tc.code = `${base} - ${phaseSuffixes[group.length - 1 + idx] || (group.length + idx + 1)}`;
            tc.type = main.type;
            tc.form = main.form;
            tc.cores = 1;
            tc.sys = main.sys;
            group.push(tc);
          });
        }
      });

      // Propagazione rigorosa della descrizione a TUTTI i conduttori di ciascun circuito unipolare
      Object.entries(circuitGroups).forEach(([base, group]) => {
        if (!base || base.startsWith("CAVO-")) return;
        
        let validDesc = null;
        for (const c of group) {
          if (c.desc && !c.desc.startsWith("Alimentazione linea CAVO-") && c.desc !== `Alimentazione linea ${c.code}`) {
            validDesc = c.desc;
            break;
          }
        }
        if (!validDesc) {
          const u = findInUnifilareDict(base);
          if (u && u.desc) validDesc = u.desc;
          const dRow = dwgTableByCode[normalizeLineKey(base)];
          if (dRow && dRow.desc) validDesc = dRow.desc;
        }

        const isAnyUni = group.some(c => isUnipolarCable(c));
        if (validDesc && (isAnyUni || group.length > 1)) {
          group.forEach(c => {
            c.desc = validDesc;
          });
        }
      });

      // Registra automaticamente nel database cavi qualsiasi tipologia non presente (Punto 4)
      state.cables.forEach(c => registerCableInCatalog(c));

      pushStateToUI();
      recalculateAll();
      fitAll();

      let log = `=== REPORT DECOMPRESSIONE REALE LIBREDWG (${fileName} — ${headerVer}) ===\n`;
      log += `• Entità totali lette nel ModelSpace: ${entities.length}\n`;
      log += `• Segmenti sul layer 'Canalina': ${traySegments.length} -> Origine CAD=(${origX.toFixed(1)}, ${origY.toFixed(1)}) -> Dimensioni calcolate: Base L=${geomW}mm, Altezza H=${geomH}mm\n`;
      log += `• Righe Tabella DWG riconosciute: ${Object.keys(dwgTableByCode).length}\n`;
      log += `• Cerchi Cavi Estratti: ${outerCircles.length}\n`;
      state.cables.forEach((c, i) => {
        log += `   [Cavo #${i + 1}] Locale=(${c.x}, ${c.y}) mm | Ø=${c.d}mm | Sigla DWG: "${c.code}" | Tipo: ${c.type} | Formazione: ${c.form} (${isUnipolarCable(c) ? "UNIPOLARE 1X" : "MULTIPOLARE"}) | Desc: "${c.desc}"\n`;
      });
      return log;
    }

    function parseDXFTextContent(rawText, fileName) {
      const lines = rawText.split(/\r?\n/);
      const entities = [];
      let i = 0;

      while (i < lines.length - 1) {
        const code = lines[i].trim();
        const val = (lines[i + 1] || "").trim();

        if (code === "0" && (val === "LINE" || val === "CIRCLE" || val === "ARC" || val === "TEXT" || val === "MTEXT" || val === "LWPOLYLINE" || val === "POLYLINE" || val === "DIMENSION")) {
          const entType = val;
          let lay = "0", x1 = 0, y1 = 0, x2 = 0, y2 = 0, r = 0, txt = "";
          const polyVertices = [];
          let curX = null, curY = null;
          i += 2;

          while (i < lines.length - 1) {
            const c = lines[i].trim();
            const v = (lines[i + 1] || "").trim();
            if (c === "0") break; // Inizio nuova entità

            if (c === "8") lay = v;
            else if (c === "10") {
              x1 = parseFloat(v) || 0;
              curX = x1;
            } else if (c === "20") {
              y1 = parseFloat(v) || 0;
              curY = y1;
              if ((entType === "LWPOLYLINE" || entType === "POLYLINE") && curX !== null) {
                polyVertices.push({ x: curX, y: curY });
                curX = null;
              }
            } else if (c === "11") x2 = parseFloat(v) || 0;
            else if (c === "21") y2 = parseFloat(v) || 0;
            else if (c === "40") r = parseFloat(v) || 0;
            else if (c === "1" || c === "3") txt += (txt ? " " : "") + v;
            i += 2;
          }

          if (entType === "LINE") {
            entities.push({ type: "LINE", layer: lay, startPoint: { x: x1, y: y1 }, endPoint: { x: x2, y: y2 } });
          } else if (entType === "CIRCLE") {
            entities.push({ type: "CIRCLE", layer: lay, center: { x: x1, y: y1 }, radius: r });
          } else if ((entType === "LWPOLYLINE" || entType === "POLYLINE") && polyVertices.length >= 2) {
            entities.push({ type: "LWPOLYLINE", layer: lay, vertices: polyVertices });
          } else if (entType === "TEXT" || entType === "MTEXT" || entType === "DIMENSION") {
            if (txt.trim()) entities.push({ type: "TEXT", layer: lay, text: txt.trim(), startPoint: { x: x1, y: y1 } });
          }
          continue;
        }
        i += 2;
      }
      return processRealWasmEntities(entities, fileName, "DXF");
    }

