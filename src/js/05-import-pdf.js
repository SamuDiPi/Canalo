    // Importazione PDF Unifilare con accoppiamento esatto (Punti 3 e 4)
    async function importPDFFile(inputEl) {
      const files = Array.from((inputEl && inputEl.files) || []);
      if (!files || files.length === 0) return;
      const file = files[0];
      const badge = document.getElementById("wasmStatusBadge");
      const banner = document.getElementById("statusBanner");
      if (badge) badge.textContent = `Lettura PDF "${file.name}"...`;
      if (banner) {
        banner.textContent = `Lettura PDF Unifilare "${file.name}" in corso...`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold";
      }

      const allPdfItems = [];
      try {
        const buf = await file.arrayBuffer();
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const tc = await page.getTextContent();
          const items = tc.items.map(it => ({ str: it.str.trim(), x: it.transform[4], y: it.transform[5] })).filter(it => it.str.length > 0);
          allPdfItems.push(...items);

          // Riconosce qualsiasi intestazione colonna di schema unifilare (es. "QGBT-P C-22", "QP1-DX-N C-4", ecc.)
          const headers = items.filter(it => /^[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+C-\d+/i.test(it.str) || /\bC-\d+\b/i.test(it.str));
          const descLabels = items.filter(it => /^(?:Descrizione(?:\s*(?:utenza|circuito|linea))?|Designazione|Utenza|Oggetto)\s*:?$/i.test(it.str.trim()));

          headers.forEach(ch => {
            const mHeaderCode = ch.str.match(/^([A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+C-?\d+|C-?\d+|[A-Z0-9_-]+-C\d+)\b/i);
            const rawCode = mHeaderCode ? mHeaderCode[1].trim() : ch.str.replace(/\s+/g, " ").trim();
            const inlineDesc = (mHeaderCode && ch.str.length > mHeaderCode[0].length) ? cleanUtenzaDescription(ch.str.substring(mHeaderCode[0].length), rawCode) : null;
            const normCode = normalizeLineKey(rawCode);

            const colItems = items.filter(it => Math.abs(it.x - ch.x) < 48 && it.y < ch.y).sort((a, b) => b.y - a.y);
            const colTexts = colItems.map(c => c.str);

            const cableMatch = colTexts.find(t => /FG16|FTG18|H1Z2Z2|FS17|FG17|RG16|H07/i.test(t)) || null;
            const peMatch = colTexts.find(t => /(?:PE\s*[-:_]?\s*|\+)?(?:FG17|FS17|H07V-K|N07V-K)\b/i.test(t) && t !== cableMatch) || null;
            const peCableMatch = peMatch ? (peMatch.match(/FG17|FS17|H07V-K|N07V-K/i) || [null])[0] : null;

            const formMatch = colTexts.find(t => /\d+\s*\([0-9xXGg,+]+\)|\b[1-5][xXGg]\d+(?:[.,]\d+)?/i.test(t)) || null;
            const ibMatch = colTexts.find(t => /^\d+(?:[.,]\d+)?\s*\/\s*0[.,]\d+$/.test(t));
            const parsedIb = ibMatch ? parseFloat(ibMatch.split("/")[0].replace(",", ".")) : 10;

            // Estrazione mirata e pulita della sola descrizione utenza dalla riga Descrizione
            let descStr = null;
            let targetLabel = descLabels.filter(dl => dl.y < ch.y).sort((a, b) => (ch.y - a.y) - (ch.y - b.y))[0];
            if (!targetLabel && descLabels.length > 0) {
              targetLabel = descLabels.slice().sort((a, b) => Math.abs(a.y - ch.y) - Math.abs(b.y - ch.y))[0];
            }

            const isCircuitCodeToken = (s) => {
              const t = String(s || "").trim();
              if (!t) return false;
              if (t === rawCode || t === ch.str.trim()) return true;
              if (/^(?:[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*\s+)?C-?\d+$/i.test(t)) return true;
              if (/^[A-Z0-9]{2,12}(?:[-._/][A-Z0-9]{1,10})*$/i.test(t) && rawCode.includes(t)) return true;
              return false;
            };

            const isElectricalRatingToken = (s) => {
              const t = String(s || "").trim();
              if (!t) return false;
              if (/^\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?$/.test(t)) return true;
              if (/^\d+(?:[.,]\d+)?\s*(?:k?W|k?VA|k?VAR|Hz|V|A|kA|mA)$/i.test(t)) return true;
              if (/^(?:P|In|Ib|Idn|Icu|Ics)\s*=/i.test(t)) return true;
              return false;
            };

            if (targetLabel) {
              const descItems = items.filter(it =>
                Math.abs(it.x - ch.x) < 48 &&
                Math.abs(it.y - targetLabel.y) <= 10 &&
                it !== targetLabel &&
                !isCircuitCodeToken(it.str) &&
                !isElectricalRatingToken(it.str) &&
                it.str.trim() !== cableMatch &&
                it.str.trim() !== formMatch &&
                it.str.trim() !== peCableMatch &&
                it.str.trim() !== peMatch
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
                !isCircuitCodeToken(it.str) &&
                !isElectricalRatingToken(it.str) &&
                it.str.trim() !== cableMatch &&
                it.str.trim() !== formMatch &&
                it.str.trim() !== peCableMatch &&
                it.str.trim() !== peMatch &&
                !/^\d+$/.test(it.str.trim())
              ).sort((a, b) => (Math.abs(b.y - a.y) > 3 ? (b.y - a.y) : (a.x - b.x)));

              if (fallbackItems.length > 0) {
                const merged = fallbackItems.map(it => it.str.trim()).join(" ");
                descStr = cleanUtenzaDescription(merged, rawCode) || null;
              }
            }

            if (!descStr && inlineDesc) {
              descStr = inlineDesc;
            }

            const entry = { rawCode, desc: descStr, cable: cableMatch, peCable: peCableMatch, form: formMatch, ib: parsedIb };
            unifilareDict[normCode] = entry;
            const baseCode = getBaseCircuitCode(rawCode);
            unifilareDict[normalizeLineKey(baseCode)] = entry;

            // Registra anche indicizzazioni aggiuntive per numero circuito (es. "C-21", "C21")
            const mC = rawCode.match(/\b(C-?\d+)\b/i);
            if (mC) {
              const cTag = normalizeLineKey(mC[1]);
              if (!unifilareDict[cTag]) unifilareDict[cTag] = entry;
              const cNoHyphen = cTag.replace("-", "");
              if (!unifilareDict[cNoHyphen]) unifilareDict[cNoHyphen] = entry;
            }
            if (normCode.startsWith("OGBT")) unifilareDict[normCode.replace(/^OGBT/, "QGBT")] = entry;
          });
        }
        const linesCount = Object.keys(unifilareDict).length;
        if (badge) badge.textContent = `PDF Unifilare Attivo (${linesCount} linee)`;

        // Se c'è solo una scheda aperta, la scelta è immediata e automatica (nessun popup)
        if (!projectSections || projectSections.length <= 1) {
          pendingPdfImport = { fileName: file.name, allPdfItems, linesCount };
          applyPdfImportScope("current");
        } else {
          // Più schede aperte: apri il modal per permettere all'utente di scegliere
          openPdfImportScopeModal(file.name, linesCount, allPdfItems);
        }
      } catch (err) {
        console.error("Errore lettura PDF:", err);
        toast(`Errore lettura PDF "${file.name}": ${err.message || err}`, "error", null, 8000);
        if (banner) {
          banner.textContent = `Errore lettura PDF "${file.name}": ${err.message || err}`;
          banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold";
        }
      } finally {
        if (inputEl) inputEl.value = "";
      }
    }

    // ============================================================================
    // GESTIONE AMBITO IMPORTAZIONE PDF UNIFILARE (SCHEDA CORRENTE VS TUTTE LE SCHEDE)
    // ============================================================================
    let pendingPdfImport = null;

    function applyUnifilareToSection(sec, dict, allPdfItems, fileName, isCurrentSection = false) {
      if (!sec) return 0;
      let matchedCount = 0;
      sec.pdfLoaded = true;

      if (Array.isArray(sec.cables)) {
        sec.cables.forEach(c => {
          const u = findInUnifilareDict(c.code) || findInUnifilareDict(getBaseCircuitCode(c.code));
          if (u) {
            matchedCount++;
            if (u.desc) c.desc = u.desc;
            if (u.cable) c.type = u.cable;
            if (u.peCable) c.peType = u.peCable;
            if (u.form) {
              c.form = u.form;
              c.sec = parseSectionFromForm(u.form, c.sec);
              c.cores = isUnipolarCable(c) ? 1 : (u.form.includes("5G") || u.form.includes("4G") ? 3 : 2);
            }
            c.ib = u.ib || 10;

            if (isUnipolarCable(c)) {
              const base = getBaseCircuitCode(c.code);
              sec.cables.forEach(other => {
                if (other !== c && getBaseCircuitCode(other.code) === base) {
                  if (u.desc) other.desc = u.desc;
                  if (u.cable && !(/PE|TERRA/i.test(other.code))) other.type = u.cable;
                  if (u.peCable && (/PE|TERRA/i.test(other.code))) {
                    other.type = u.peCable;
                    other.peType = u.peCable;
                  }
                }
              });
            }
          } else {
            if (c.desc) c.desc = cleanUtenzaDescription(c.desc, c.code);
          }
        });

        // Registra automaticamente nel DB qualsiasi nuovo cavo identificato dallo schema
        sec.cables.forEach(c => registerCableInCatalog(c));
      }

      // Aggiorna titolo canalina e nome file se era generico o se trovato nel documento
      if (allPdfItems && fileName) {
        const pdfTrayName = extractTrayNameFromInput(allPdfItems, fileName, sec.width, sec.height);
        if (pdfTrayName && pdfTrayName.isExplicit && (isCurrentSection || (sec.title && sec.title.startsWith("NUOVA CANALINA")))) {
          sec.title = pdfTrayName.title;
          if (isCurrentSection) {
            const elInpTitle = document.getElementById("inpTitle"); if (elInpTitle) elInpTitle.value = sec.title;
            const qTitlePdf = document.getElementById("inpTitleQuick"); if (qTitlePdf) qTitlePdf.value = sec.title;
            const hTitle = document.getElementById("headerTitle"); if (hTitle) hTitle.textContent = sec.title;
            const elExpName = document.getElementById("exportName"); if (elExpName) elExpName.value = pdfTrayName.exportFile;
          }
        } else if (sec.title && sec.title.startsWith("NUOVA CANALINA") && fileName) {
          const pdfBase = fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]+/g, " ").trim();
          if (pdfBase && !/schema|unifilare/i.test(pdfBase)) {
            sec.title = `${pdfBase} - L=${sec.width}mm H=${sec.height}mm`;
            if (isCurrentSection) {
              const elInpTitle = document.getElementById("inpTitle"); if (elInpTitle) elInpTitle.value = sec.title;
              const hTitle = document.getElementById("headerTitle"); if (hTitle) hTitle.textContent = sec.title;
              const cleanTag = pdfBase.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
              const elExpName = document.getElementById("exportName"); if (elExpName) elExpName.value = cleanTag || "CANALINA_01";
            }
          }
        }
      }

      return matchedCount;
    }

    function openPdfImportScopeModal(fileName, linesCount, allPdfItems) {
      pendingPdfImport = { fileName, linesCount, allPdfItems };
      const m = document.getElementById("pdfImportScopeModal");
      if (!m) return;

      const elFile = document.getElementById("pdfScopeFileName");
      if (elFile) elFile.textContent = fileName || "schema_unifilare.pdf";

      const elLines = document.getElementById("pdfScopeLinesCount");
      if (elLines) elLines.textContent = `${linesCount || 0} linee trovate`;

      const elOpenTabs = document.getElementById("pdfScopeOpenTabsCount");
      if (elOpenTabs) elOpenTabs.textContent = `${projectSections.length} schede canalina`;

      const mParen = String(state.title || "").match(/\(([^)]+)\)/);
      const curName = mParen ? mParen[1].trim() : (state.title || `Canalina ${currentSectionIdx + 1}`);

      const elCurBadge = document.getElementById("pdfScopeCurrentBadge");
      if (elCurBadge) elCurBadge.textContent = `#${currentSectionIdx + 1}`;

      const elCurDetails = document.getElementById("pdfScopeCurrentDetails");
      if (elCurDetails) {
        elCurDetails.textContent = `${curName} (${state.width}x${state.height} mm • ${state.cables.length} cavi posati)`;
      }

      const elAllBadge = document.getElementById("pdfScopeAllBadge");
      if (elAllBadge) elAllBadge.textContent = `Tutte (${projectSections.length})`;

      m.classList.remove("hidden");
    }

    function closePdfImportScopeModal() {
      const m = document.getElementById("pdfImportScopeModal");
      if (m) m.classList.add("hidden");
      pendingPdfImport = null;
    }

    function applyPdfImportScope(scope) {
      if (!pendingPdfImport) return;
      const fileName = pendingPdfImport.fileName;
      const allPdfItems = pendingPdfImport.allPdfItems;
      closePdfImportScopeModal();

      const badge = document.getElementById("wasmStatusBadge");
      const banner = document.getElementById("statusBanner");

      if (scope === "all") {
        syncActiveSectionToMultiStore();

        let totalMatched = 0;
        let totalCables = 0;
        let updatedSectionsCount = 0;

        projectSections.forEach((sec, idx) => {
          const isCur = idx === currentSectionIdx;
          const matched = applyUnifilareToSection(sec, unifilareDict, allPdfItems, fileName, isCur);
          totalMatched += matched;
          totalCables += (sec.cables ? sec.cables.length : 0);
          if (matched > 0) updatedSectionsCount++;
        });

        state = cloneStateSnapshot(projectSections[currentSectionIdx]);

        if (badge) badge.textContent = `PDF Unifilare Attivo (${Object.keys(unifilareDict).length} linee)`;
        if (banner) {
          banner.textContent = `✓ PDF Unifilare sincronizzato per TUTTE le ${projectSections.length} schede aperte (${totalMatched}/${totalCables} cavi aggiornati in ${updatedSectionsCount} tratte canalina)!`;
          banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold";
        }
      } else {
        // Solo scheda corrente
        const matched = applyUnifilareToSection(state, unifilareDict, allPdfItems, fileName, true);
        syncActiveSectionToMultiStore();

        if (badge) badge.textContent = `PDF Unifilare Attivo (${Object.keys(unifilareDict).length} linee)`;
        if (banner) {
          const mParen = String(state.title || "").match(/\(([^)]+)\)/);
          const curName = mParen ? mParen[1].trim() : (state.title || `Canalina ${currentSectionIdx + 1}`);
          banner.textContent = `✓ PDF Unifilare sincronizzato per la scheda corrente #${currentSectionIdx + 1} "${curName}" (${matched}/${state.cables.length} cavi DWG abbinati)!`;
          banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold";
        }
      }

      const elElec = document.getElementById("kpiElectricalCard"); if (elElec) elElec.classList.remove("hidden");
      const elBar = document.getElementById("kpiBar"); if (elBar) elBar.className = "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2";

      pushStateToUI();
      recalculateAll();
      updateTableUI();
      drawScene();
      renderMultiSectionTabs();
    }

        function cleanUtenzaDescription(raw, codeToStrip = "") {
      if (!raw) return "";
      let s = String(raw).replace(/\r?\n/g, " ").trim();

      // 1. Rimuove prefissi di etichetta (es. "Descrizione:", "Descrizione utenza:", "Designazione:")
      s = s.replace(/^(?:Descrizione(?:\s*(?:utenza|circuito|linea))?|Designazione|Utenza|Oggetto)\s*[:=-]\s*/i, "");

      // 2. Rimuove la sigla specifica del circuito passata come argomento se presente all'inizio o alla fine o tra parentesi
      if (codeToStrip) {
        const esc = String(codeToStrip).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        s = s.replace(new RegExp(`^${esc}\\s*[-:–—]?\\s*`, "i"), "");
        s = s.replace(new RegExp(`\\s*[-:–—]?\\s*${esc}$`, "i"), "");
        s = s.replace(new RegExp(`\\(\\s*${esc}\\s*\\)`, "gi"), "");
      }

      // 3. Rimuove codici circuito tra parentesi (es. "(QPT-DX-N C-21)", "(C-21)")
      s = s.replace(/\([^)]*\bC-?\d+\b[^)]*\)/gi, "");
      s = s.replace(/\([^)]*\b(?:QGBT|QP|QE|QUADRO|UPS|IRAI|EVAC|TD)[^)]*\)/gi, "");

      // 4. Rimuove qualsiasi sigla utenza / codice quadro-circuito all'inizio o alla fine (es. "QPT-DX-N C-21", "QGBT-P C-22", "C-21")
      const panelPrefix = `(?:(?:[QO][A-Z0-9._-]*|[A-Z0-9]+-[A-Z0-9._-]+)\\s+)?`;
      s = s.replace(new RegExp(`^${panelPrefix}C-?\\d+\\b\\s*[-:–—]?\\s*`, "i"), "");
      s = s.replace(new RegExp(`\\s*[-:–—]?\\s*${panelPrefix}C-?\\d+\\b\\s*$`, "i"), "");

      // 5. Rimuove rapporti di potenza / corrente anche con unità (es. "1 / 1,053", "/ 1,053", "1 / 1.053 kW", "15 / 24,5")
      s = s.replace(/\b\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?\s*(?:k?W|k?VA|k?VAR|Hz|V|A|kA|mA)?\b/gi, "");
      s = s.replace(/(?:^|\s)\/?\s*\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?\s*(?:k?W|k?VA|k?VAR|Hz|V|A|kA|mA)?\b/gi, "");
      s = s.replace(/(?:^|\s)\/\s*\d+(?:[.,]\d+)?\s*(?:k?W|k?VA|k?VAR|Hz|V|A|kA|mA)?\b/gi, "");

      // 6. Rimuove grandezze elettriche pure isolate (potenza, tensione, frequenza, corrente, cosphi)
      s = s.replace(/\b(?:P\s*=\s*)?\d+(?:[.,]\d+)?\s*(?:k?W|k?VA|k?VAR)\b/gi, "");
      s = s.replace(/\b(?:400|230|110|24)\s*V\b/gi, "");
      s = s.replace(/\b\d+(?:[.,]\d+)?\s*Hz\b/gi, "");
      s = s.replace(/\b(?:cos\s*phi|cos\s*φ)\s*=?\s*\d+(?:[.,]\d+)?\b/gi, "");
      s = s.replace(/\b(?:I[nbd]|Idn|Icu|Ics|Icn)\s*=?\s*\d+(?:[.,]\d+)?\s*(?:m?A|kA)?\b/gi, "");
      s = s.replace(/\b(?:k?W|k?VA|k?VAR)\b/gi, "");

      // 7. Rimuove formazioni cavi e tipi cavo residui
      s = s.replace(/\b(?:FG16[A-Z0-9]*|FTG18[A-Z0-9]*|FS17|FG17|H07[A-Z0-9-]*|H1Z2Z2-K|RG16[A-Z0-9]*)\b/gi, "");
      s = s.replace(/\b\d+\s*\([0-9xXGg,+]+\)|\b[1-5][xXGg]\d+(?:[.,]\d+)?\b/g, "");

      // 7b. Rimuove termini di polarità spuria e tipologie costruttive cavo (es. "Quadripolare", "Multipolare", "Cavo Unipolare")
      s = s.replace(/\b(?:cavo\s+|linea\s+)?(?:uni|bi|tri|quadri|penta|multi)polare\b/gi, "");
      s = s.replace(/\b(?:unipolare|bipolare|tripolare|quadripolare|pentapolare|multipolare)\b/gi, "");
      s = s.replace(/\b(?:cavo\s+)?(?:bt|mt|b\.t\.|m\.t\.)\b/gi, "");
      s = s.replace(/\b(?:monofase|trifase(?:\s*\+\s*n(?:eutro)?)?)\b/gi, "");

      // 8. Pulizia punteggiatura e spazi residui
      s = s.replace(/^[-+\s|/,.:;–—]+|[-+\s|/,.:;–—]+$/g, "");
      s = s.replace(/\s{2,}/g, " ").trim();

      // 9. Se molto lunga (> 65 caratteri), tronca con ellissi
      if (s.length > 65) {
        s = s.substring(0, 62).trim() + "..";
      }
      return s;
    }

    function getDisplayCableType(cable, allCables = []) {
      if (!cable) return "";
      if (cable.type && cable.type.includes("/")) return cable.type;
      if (cable.peType && cable.peType !== cable.type) {
        return `${cable.type} / ${cable.peType}`;
      }
      const base = getBaseCircuitCode(cable.code);
      if (base && Array.isArray(allCables) && allCables.length > 0) {
        const related = allCables.filter(c => getBaseCircuitCode(c.code) === base);
        if (related.length > 1) {
          const peConductor = related.find(c => /PE|TERRA|G\/V|GV/i.test(c.code) || /G\/V|PE/i.test(c.form) || /FG17|FS17/i.test(c.type));
          const phaseConductor = related.find(c => !(/PE|TERRA|G\/V|GV/i.test(c.code) || /FG17|FS17/i.test(c.type)));
          if (peConductor && phaseConductor && peConductor.type && phaseConductor.type && peConductor.type !== phaseConductor.type) {
            return `${phaseConductor.type} / ${peConductor.type}`;
          }
        }
      }
      return cable.type || "FG16M16";
    }

    function extractTrayNameFromInput(rawTexts, fileName, width = 200, height = 75) {
      let foundName = null;
      let isExplicit = false;

      function scoreTrayCandidate(cand) {
        if (!cand) return -100;
        const s = String(cand).trim();
        if (s.length < 2 || s.length > 80) return -100;
        // Escludi se sono solo dimensioni es. "300x75", "75 x 300 mm"
        if (/^\d+\s*[xX]\s*\d+/i.test(s)) return -100;
        // Escludi unità singole o acronimi normativi standard
        if (/^(mm|cm|m|kg|dan|n|kw|a|v|hz|cei|uni|iec|en|iso|rev\.?\s*\d*|scala|scale|foglio|tavola|pag\.?\s*\d*)$/i.test(s)) return -100;
        if (/^cei\b/i.test(s)) return -100;
        // Escludi formazioni cavo es. "C-21", "3G2.5", "1x16"
        if (/^C-?\d+$/i.test(s) || /^[1-5][xXGg]\d+/i.test(s)) return -100;
        if (!/[a-zA-Z]{2,}/.test(s)) return -100;

        let score = 10;
        if (/anello/i.test(s)) score += 60;
        if (/lato\s+(?:dx|sx|nord|sud|est|ovest)/i.test(s)) score += 50;
        if (/\b(?:bt|mt|at)\b/i.test(s)) score += 35;
        if (/\b(?:pt|p1|p2|p3|p-1|piano|terra|interrato|copertura|quadro|qgbt|edp|dorsale|montante|distribuzione)\b/i.test(s)) score += 30;
        if (/\b(?:sx|dx)\b/i.test(s)) score += 25;
        if (/\b(?:canale|canalina|passerella|tratta|tronco)\b/i.test(s)) score += 30;
        if (s.includes("-") || s.includes("/")) score += 15;
        if (s.length >= 6 && s.length <= 45) score += 10;
        return score;
      }

      const allCandidates = [];

      // A. Controlla il nome del file di input se contiene parentesi (...)
      if (fileName) {
        const fileRegex = /\(([^)]+)\)/g;
        let fm;
        while ((fm = fileRegex.exec(fileName)) !== null) {
          const c = fm[1].trim();
          const sc = scoreTrayCandidate(c);
          if (sc > 0) allCandidates.push({ name: c, score: sc + 30 });
        }
      }

      // B. Controlla i testi estratti dal DWG / DXF / PDF
      if (Array.isArray(rawTexts) && rawTexts.length > 0) {
        const cleanedItems = rawTexts.map(t => ({
          str: cleanAcadMText(t.str || ""),
          x: t.x || 0,
          y: t.y || 0
        })).filter(t => t.str.length > 0);

        // 1. Cerca nei singoli testi diciture con parentesi
        cleanedItems.forEach(t => {
          const s = t.str;
          const hasPrefix = /(?:Dati\s+caratteristici|Dati\s+tecnici|Dati|Canalina|Canale|Passerella|Condotto|Tratta|Tronco|Sezione|Particolare)/i.test(s);
          const regexP = /\(([^)]+)\)/g;
          let m;
          while ((m = regexP.exec(s)) !== null) {
            const cand = m[1].trim();
            const sc = scoreTrayCandidate(cand);
            if (sc > 0) {
              allCandidates.push({ name: cand, score: sc + (hasPrefix ? 50 : 20) });
            }
          }
        });

        // 2. Cerca nel testo unito se spezzato in entità adiacenti
        const allJoined = cleanedItems.map(t => t.str).join(" ");
        const regexAll = /\(([^)]+)\)/g;
        let jm;
        while ((jm = regexAll.exec(allJoined)) !== null) {
          const cand = jm[1].trim();
          const sc = scoreTrayCandidate(cand);
          if (sc > 0) {
            allCandidates.push({ name: cand, score: sc + 15 });
          }
        }

        // 3. Cerca diciture con due punti o trattino: "Dati caratteristici canalina: [Nome]"
        cleanedItems.forEach(t => {
          const mColon = t.str.match(/(?:Dati\s+caratteristici(?:\s+della)?\s+(?:canalina|passerella|canale)|(?:canalina|passerella|canale))\s*[:=-]\s*([A-Za-z0-9_\-./\s]{3,50})/i);
          if (mColon && mColon[1]) {
            const cand = mColon[1].trim();
            const sc = scoreTrayCandidate(cand);
            if (sc > 0) allCandidates.push({ name: cand, score: sc + 10 });
          }
        });

        // 4. Header convenzionali canalina/passerella
        cleanedItems.forEach(t => {
          const mHead = t.str.match(/^(?:CANALINA|CANALE|PASSERELLA|CONDOTTO|TRONCO)\s+([A-Za-z0-9_\-./\s]{2,40})/i);
          if (mHead && mHead[1]) {
            const cand = mHead[1].trim();
            const sc = scoreTrayCandidate(cand);
            if (sc > 0) allCandidates.push({ name: cand, score: sc + 5 });
          }
        });
      }

      // Scegli il candidato con il punteggio più alto
      if (allCandidates.length > 0) {
        allCandidates.sort((a, b) => b.score - a.score);
        foundName = allCandidates[0].name;
        isExplicit = true;
      }

      let cleanBase = foundName ? foundName : (fileName || "CANALINA").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, " ").trim();
      cleanBase = cleanBase.replace(/^(?:Dati\s+caratteristici\s+(?:della\s+)?(?:canalina|passerella|canale)\s*[:=-]?\s*)/i, "")
                          .replace(/\s*-\s*L=\s*\d+\s*mm\s*H=\s*\d+\s*mm/i, "")
                          .replace(/\b\d+\s*[xX]\s*\d+(?:\s*mm)?\b/gi, "")
                          .replace(/L=\s*\d+\s*mm/i, "")
                          .replace(/H=\s*\d+\s*mm/i, "")
                          .replace(/^[\"'\s]+|[\"'\s]+$/g, "")
                          .trim();
      if (!cleanBase) cleanBase = "CANALINA 01";

      const title = cleanBase;
      const exportFile = cleanBase.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
      return { title, exportFile, cleanBase, isExplicit };
    }

    function onScaleChange(val) {
      state.scale = val || "1:1";
      state.tb.scaleRev = `Scala ${state.scale} - ${state.tb.rev || "Rev. 00"}`;
      const elInp = document.getElementById("inpScale");
      if (elInp) elInp.value = state.scale;
      const elDxf = document.getElementById("selDxfScale");
      if (elDxf) elDxf.value = state.scale;
      const elCfg = document.getElementById("cfgScale");
      if (elCfg) elCfg.value = state.scale;
      const elRev = document.getElementById("inpScaleRev");
      if (elRev) elRev.value = state.tb.scaleRev;
      drawScene();
    }

    function onTextScaleChange(val) {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0.2 || num > 3.0) return;
      state.textScale = num;
      try {
        localStorage.setItem("canaloCAD_textScale", num.toString());
      } catch (e) {}
      const valStr = num.toString();
      const el1 = document.getElementById("selTextScale"); if (el1) el1.value = valStr;
      const el2 = document.getElementById("optDxfTextScale"); if (el2) el2.value = valStr;
      const el3 = document.getElementById("cfgTextScale"); if (el3) el3.value = valStr;
      drawScene();
    }

    function toggleSectionExport(sec, enabled) {
      if (sec === "chart") {
        state.showLoadChart = enabled;
        const c1 = document.getElementById("chkExportChart"); if (c1) c1.checked = enabled;
        const c2 = document.getElementById("menuChkChart"); if (c2) c2.checked = enabled;
      } else if (sec === "bom") {
        state.showBOM = enabled;
        const c1 = document.getElementById("chkExportBOM"); if (c1) c1.checked = enabled;
        const c2 = document.getElementById("menuChkBOM"); if (c2) c2.checked = enabled;
      } else if (sec === "iso3d") {
        state.showIso3D = enabled;
        const c1 = document.getElementById("chkExportIso3D"); if (c1) c1.checked = enabled;
        const c2 = document.getElementById("menuChk3D"); if (c2) c2.checked = enabled;
        const c3 = document.getElementById("chkIso3D"); if (c3) c3.checked = enabled;
      } else if (sec === "cartiglio") {
        state.showCartiglio = enabled;
        const c1 = document.getElementById("chkExportCartiglio"); if (c1) c1.checked = enabled;
        const c2 = document.getElementById("menuChkCartiglio"); if (c2) c2.checked = enabled;
      } else if (sec === "tableDesc") {
        state.showTableDesc = Boolean(enabled);
        state.hideTableDesc = !enabled;
        const c1 = document.getElementById("chkExportTableDesc"); if (c1) c1.checked = state.showTableDesc;
        const c2 = document.getElementById("menuChkTableDesc"); if (c2) c2.checked = state.showTableDesc;
      }
      drawScene();
    }

    function toggleTableDesc(enabled) {
      toggleSectionExport("tableDesc", enabled);
      syncActiveSectionToMultiStore();
    }

    function toggleLayoutMode() {
      state.layoutMode = (state.layoutMode === "minimal") ? "standard" : "minimal";
      updateLayoutUI();
      syncActiveSectionToMultiStore();
      recalculateAll();
      fitAll();
    }

    function setLayoutMode(mode) {
      state.layoutMode = mode === "minimal" ? "minimal" : "standard";
      updateLayoutUI();
      syncActiveSectionToMultiStore();
      recalculateAll();
      fitAll();
    }

    function updateLayoutUI() {
      const isMin = state.layoutMode === "minimal";
      const btn = document.getElementById("btnToggleLayout");
      if (btn) {
        btn.innerHTML = isMin
          ? `<span>📐 Layout: Minimal (2D+Tab)</span>`
          : `<span>📑 Layout: Standard (Affiancato)</span>`;
        btn.className = isMin
          ? "inline-flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-bold text-xs transition shadow-sm"
          : "inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-medium text-xs transition";
      }
      const chkMenu = document.getElementById("menuChkLayoutMinimal");
      if (chkMenu) chkMenu.checked = isMin;
      const chkExp = document.getElementById("chkExportMinimalLayout");
      if (chkExp) chkExp.checked = isMin;
    }

    function toggleCableCallouts(enabled) {
      if (typeof enabled === "boolean") {
        state.showCableCallouts = enabled;
      } else {
        state.showCableCallouts = !(state.showCableCallouts !== false);
      }
      updateCableCalloutsUI();
      syncActiveSectionToMultiStore();
      drawScene();
    }

    function updateCableCalloutsUI() {
      const showCallouts = state.showCableCallouts !== false;
      const btn = document.getElementById("btnToggleCallouts");
      if (btn) {
        btn.innerHTML = showCallouts
          ? `<span>🏷️ Testi Cavi 2D: Estesi</span>`
          : `<span>🏷️ Testi Cavi 2D: Solo #</span>`;
        btn.className = showCallouts
          ? "inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-medium text-xs transition"
          : "inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold text-xs transition shadow-sm";
      }
      const chkMenu = document.getElementById("menuChkCallouts");
      if (chkMenu) chkMenu.checked = showCallouts;
      const chkExp = document.getElementById("chkExportCallouts");
      if (chkExp) chkExp.checked = showCallouts;
    }
