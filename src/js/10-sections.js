    // ============================================================================
    // 8. PROGETTO MULTI-SEZIONE: SCHEDE, SALVATAGGIO AUTOMATICO, ANNULLA/RIPETI
    // ============================================================================
    let projectSections = [];
    let currentSectionIdx = 0;

    const AUTOSAVE_KEY = "canalo_v16_multisections";
    const HISTORY_LIMIT = 60;
    // Stato "pulito" di riferimento: completa i campi mancanti di progetti salvati con versioni precedenti
    const DEFAULT_SECTION_STATE = JSON.parse(JSON.stringify(state));

    function cloneStateSnapshot(st) {
      return JSON.parse(JSON.stringify(st));
    }

    function normalizeSection(sec) {
      const base = cloneStateSnapshot(DEFAULT_SECTION_STATE);
      const s = (sec && typeof sec === "object") ? sec : {};
      const out = Object.assign(base, s);
      out.tb = Object.assign({}, DEFAULT_SECTION_STATE.tb, s.tb || {});
      out.cables = Array.isArray(s.cables) ? s.cables.filter(c => c && typeof c === "object" && +c.d > 0) : [];
      out.septumPositions = Array.isArray(s.septumPositions) ? s.septumPositions : [];
      ["width", "height", "thk", "lengthM", "spanM"].forEach(k => {
        out[k] = (+out[k] > 0) ? +out[k] : DEFAULT_SECTION_STATE[k];
      });
      return out;
    }

    // --- Cronologia Annulla / Ripeti -------------------------------------------
    // Ogni voce è lo stato serializzato di tutte le schede; le modifiche ravvicinate
    // (es. un trascinamento) confluiscono in un'unica voce grazie alla sincronizzazione differita.
    let historyStack = [];
    let historyIdx = -1;

    function serializeProject() {
      return JSON.stringify(projectSections);
    }

    function recordHistory(json) {
      if (historyIdx >= 0 && historyStack[historyIdx].json === json) {
        historyStack[historyIdx].idx = currentSectionIdx;
        return;
      }
      historyStack = historyStack.slice(0, historyIdx + 1);
      historyStack.push({ json, idx: currentSectionIdx });
      if (historyStack.length > HISTORY_LIMIT) historyStack.shift();
      historyIdx = historyStack.length - 1;
      updateUndoButtons();
    }

    function updateUndoButtons() {
      document.querySelectorAll("[data-undo]").forEach(b => { b.disabled = historyIdx <= 0; });
      document.querySelectorAll("[data-redo]").forEach(b => { b.disabled = historyIdx >= historyStack.length - 1; });
    }

    function applyHistoryEntry(entry) {
      projectSections = JSON.parse(entry.json).map(normalizeSection);
      currentSectionIdx = Math.min(Math.max(0, entry.idx || 0), projectSections.length - 1);
      state = cloneStateSnapshot(projectSections[currentSectionIdx]);
      pushStateToUI(); // include recalculateAll()
      // Allinea subito archivio e voce di cronologia allo stato ricalcolato, senza creare nuove voci
      scheduleSectionSync.cancel();
      projectSections[currentSectionIdx] = cloneStateSnapshot(state);
      historyStack[historyIdx] = { json: serializeProject(), idx: currentSectionIdx };
      renderMultiSectionTabs();
      persistProject();
      updateUndoButtons();
    }

    function undoLastChange() {
      if (scheduleSectionSync.pending()) scheduleSectionSync.flush();
      if (historyIdx <= 0) { toast("Niente da annullare", "info", null, 2000); return; }
      historyIdx--;
      applyHistoryEntry(historyStack[historyIdx]);
      toast("Modifica annullata", "info", { label: "Ripeti", onClick: redoLastChange }, 3000);
    }

    function redoLastChange() {
      if (scheduleSectionSync.pending()) scheduleSectionSync.flush();
      if (historyIdx >= historyStack.length - 1) { toast("Niente da ripetere", "info", null, 2000); return; }
      historyIdx++;
      applyHistoryEntry(historyStack[historyIdx]);
      toast("Modifica ripetuta", "info", null, 2000);
    }

    // --- Salvataggio automatico ------------------------------------------------
    let autosaveWarned = false;
    function persistProject() {
      const ok = safeStorage.set(AUTOSAVE_KEY, JSON.stringify({ version: APP_VERSION, savedAt: new Date().toISOString(), currentSectionIdx, projectSections }));
      if (!ok && !autosaveWarned) {
        autosaveWarned = true;
        toast("Salvataggio automatico non disponibile in questo browser: salva il progetto come file (Progetto → Salva file).", "warn", null, 9000);
      }
      setSaveState(ok);
    }

    // Ripristina il progetto dell'ultima sessione. Restituisce true se ha caricato qualcosa.
    function restoreAutosave() {
      const raw = safeStorage.get(AUTOSAVE_KEY);
      if (!raw) return false;
      try {
        const data = JSON.parse(raw);
        if (!Array.isArray(data.projectSections) || data.projectSections.length === 0) return false;
        projectSections = data.projectSections.map(normalizeSection);
        currentSectionIdx = Math.min(Math.max(0, data.currentSectionIdx || 0), projectSections.length - 1);
        state = cloneStateSnapshot(projectSections[currentSectionIdx]);
        return true;
      } catch (e) {
        console.warn("Salvataggio automatico illeggibile, ignorato:", e);
        return false;
      }
    }

    // --- Sincronizzazione scheda attiva ----------------------------------------
    // Immediata: copia lo stato nella scheda, aggiorna le schede, salva e registra la cronologia.
    function syncActiveSectionToMultiStore() {
      scheduleSectionSync.cancel();
      if (projectSections.length === 0) {
        projectSections.push(cloneStateSnapshot(state));
        currentSectionIdx = 0;
      } else {
        projectSections[currentSectionIdx] = cloneStateSnapshot(state);
      }
      renderMultiSectionTabs();
      persistProject();
      recordHistory(serializeProject());
    }
    // Differita: usata nei percorsi frequenti (ricalcolo, trascinamenti, digitazione)
    const scheduleSectionSync = debounce(() => syncActiveSectionToMultiStore(), 350);

    // Nuovo progetto: una sola scheda vuota (annullabile)
    function newProject() {
      if (scheduleSectionSync.pending()) scheduleSectionSync.flush();
      const hadContent = projectSections.length > 1 || state.cables.length > 0;
      const keepTb = state.tb;
      state = cloneStateSnapshot(DEFAULT_SECTION_STATE);
      state.tb = cloneStateSnapshot(keepTb); // i dati cartiglio restano quelli dello studio
      projectSections = [cloneStateSnapshot(state)];
      currentSectionIdx = 0;
      resetProject();
      syncActiveSectionToMultiStore();
      if (hadContent) toast("Nuovo progetto creato", "info", { label: "Annulla", onClick: undoLastChange }, 7000);
    }

    function deleteSectionTabAt(idx, event) {
      if (event) event.stopPropagation();
      if (projectSections.length <= 1) {
        clearCables();
        return;
      }
      if (scheduleSectionSync.pending()) scheduleSectionSync.flush();
      projectSections[currentSectionIdx] = cloneStateSnapshot(state);
      const removed = projectSections[idx];
      projectSections.splice(idx, 1);
      if (currentSectionIdx >= projectSections.length) {
        currentSectionIdx = projectSections.length - 1;
      } else if (currentSectionIdx > idx) {
        currentSectionIdx--;
      }
      state = cloneStateSnapshot(projectSections[currentSectionIdx]);
      pushStateToUI();
      fitAll();
      syncActiveSectionToMultiStore();
      toast(`Scheda "${(removed && removed.title) || idx + 1}" chiusa`, "info", { label: "Annulla", onClick: undoLastChange }, 7000);
    }

    function scrollTabsLeft() {
      const box = document.getElementById("multiSectionTabs");
      if (box) box.scrollBy({ left: -240, behavior: "smooth" });
    }

    function scrollTabsRight() {
      const box = document.getElementById("multiSectionTabs");
      if (box) box.scrollBy({ left: 240, behavior: "smooth" });
    }

    function toggleTabsDropdown(forceState) {
      const menu = document.getElementById("tabsDropdownMenu");
      if (!menu) return;
      const isHidden = menu.classList.contains("hidden");
      const shouldOpen = (forceState !== undefined) ? forceState : isHidden;
      if (shouldOpen) {
        closeAllMenus();
        menu.classList.remove("hidden");
        const activeItem = menu.querySelector(".tab-dropdown-active");
        if (activeItem) {
          setTimeout(() => { if (activeItem && typeof activeItem.scrollIntoView === 'function') activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 30);
        }
      } else {
        menu.classList.add("hidden");
      }
    }

    function initMultiSectionTabs() {
      const box = document.getElementById("multiSectionTabs");
      if (box && !box._wheelBound) {
        box._wheelBound = true;
        box.addEventListener("wheel", (e) => {
          if (e.deltaY !== 0) {
            e.preventDefault();
            box.scrollLeft += e.deltaY;
          }
        }, { passive: false });
      }
    }

    function renderMultiSectionTabs() {
      const box = document.getElementById("multiSectionTabs");
      if (!box) return;
      box.innerHTML = "";

      const lblTabsCount = document.getElementById("lblTabsCount");
      if (lblTabsCount) lblTabsCount.textContent = `Schede (${projectSections.length})`;

      const tabsDropdownCountBadge = document.getElementById("tabsDropdownCountBadge");
      if (tabsDropdownCountBadge) {
        tabsDropdownCountBadge.textContent = `${projectSections.length} ${projectSections.length === 1 ? 'scheda' : 'schede'}`;
      }

      const dropList = document.getElementById("tabsDropdownList");
      if (dropList) dropList.innerHTML = "";

      let activeTabWrapper = null;

      projectSections.forEach((sec, idx) => {
        const active = idx === currentSectionIdx;

        // Estrazione titolo pulito tra parentesi (es. Anello BT - Lato SX)
        const mParen = String(sec.title || "").match(/\(([^)]+)\)/);
        const displayName = mParen ? mParen[1].trim() : (sec.title || `Canalina ${idx + 1}`);
        const cableCount = Array.isArray(sec.cables) ? sec.cables.length : 0;
        const dims = `${sec.width}x${sec.height} mm`;
        const tooltip = `Scheda #${idx + 1}: ${sec.title || displayName}\nDimensioni: ${dims}\nCavi posati: ${cableCount}\nSerie: ${sec.type || 'P2000'}`;

        // 1. Creazione Tab nello Strip orizzontale
        const tabWrapper = document.createElement("div");
        tabWrapper.className = "group inline-flex items-center rounded-md text-xs mono transition shadow-sm flex-shrink-0 " +
          (active
            ? "bg-amber-500 text-slate-950 font-bold border border-amber-400 active-tab shadow-amber-500/20"
            : "bg-slate-800 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/80");

        const btn = document.createElement("button");
        btn.type = "button";
        btn.onclick = () => switchSectionTab(idx);
        btn.className = "px-2.5 py-1 flex items-center gap-1.5 focus:outline-none max-w-[210px] text-left";
        btn.title = tooltip;

        const idxBadge = document.createElement("span");
        idxBadge.className = "text-[11px] " + (active ? "text-slate-900 font-extrabold" : "text-amber-400 font-semibold");
        idxBadge.textContent = `#${idx + 1}`;

        const nameSpan = document.createElement("span");
        nameSpan.className = "truncate max-w-[110px] font-medium";
        nameSpan.textContent = displayName;

        const dimsSpan = document.createElement("span");
        dimsSpan.className = "text-[11px] " + (active ? "text-slate-900/80" : "text-slate-400") + " whitespace-nowrap hidden sm:inline";
        dimsSpan.textContent = `(${sec.width}x${sec.height})`;

        btn.appendChild(idxBadge);
        btn.appendChild(nameSpan);
        btn.appendChild(dimsSpan);
        tabWrapper.appendChild(btn);

        if (projectSections.length > 1) {
          const btnClose = document.createElement("button");
          btnClose.type = "button";
          btnClose.innerHTML = "&times;";
          btnClose.title = `Chiudi scheda #${idx + 1} "${displayName}"`;
          btnClose.className = "px-1.5 py-1 text-xs " +
            (active ? "text-slate-950/70 hover:text-slate-950 hover:bg-amber-600/30" : "text-slate-400 hover:text-white hover:bg-red-500") +
            " rounded-r-md transition focus:outline-none";
          btnClose.onclick = (e) => deleteSectionTabAt(idx, e);
          tabWrapper.appendChild(btnClose);
        }

        box.appendChild(tabWrapper);
        if (active) activeTabWrapper = tabWrapper;

        // 2. Popolamento Dropdown Salto Rapido
        if (dropList) {
          const item = document.createElement("div");
          item.className = "flex items-center justify-between px-3 py-2 hover:bg-slate-800 transition cursor-pointer " +
            (active ? "bg-[#243045] border-l-4 border-l-[#A8C7FA] tab-dropdown-active" : "");

          const leftBtn = document.createElement("button");
          leftBtn.type = "button";
          leftBtn.className = "flex-1 text-left min-w-0 pr-2 focus:outline-none";
          leftBtn.onclick = () => {
            switchSectionTab(idx);
            toggleTabsDropdown(false);
          };

          leftBtn.innerHTML = `
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-[11px] font-mono font-bold ${active ? 'text-sky-200' : 'text-slate-400'}">#${idx + 1}</span>
              <span class="text-xs font-semibold ${active ? 'text-sky-100' : 'text-slate-200'} truncate">${escapeHtml(displayName)}</span>
              ${active ? '<span class="text-[11px] px-1 py-0.2 rounded bg-[#284777] text-[#D6E3FF] font-bold ml-auto flex-shrink-0">Aperta</span>' : ''}
            </div>
            <div class="text-[11px] text-slate-400 mono mt-0.5 truncate flex items-center gap-2">
              <span>📏 ${dims}</span>
              <span>&bull;</span>
              <span>⚡ ${cableCount} cavi</span>
              <span>&bull;</span>
              <span>${escapeHtml(sec.type || 'P2000')}</span>
            </div>
          `;
          item.appendChild(leftBtn);

          if (projectSections.length > 1) {
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "px-1.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-red-500/80 rounded transition";
            delBtn.innerHTML = "&times;";
            delBtn.title = `Elimina scheda #${idx + 1}`;
            delBtn.onclick = (e) => {
              deleteSectionTabAt(idx, e);
              toggleTabsDropdown(false);
            };
            item.appendChild(delBtn);
          }

          dropList.appendChild(item);
        }
      });


      // Porta in vista la scheda attiva solo quando cambia (non a ogni ricalcolo)
      const scrollKey = `${currentSectionIdx}/${projectSections.length}`;
      if (activeTabWrapper && scrollKey !== lastTabScrollKey) {
        lastTabScrollKey = scrollKey;
        requestAnimationFrame(() => {
          if (activeTabWrapper.isConnected) activeTabWrapper.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
      }
    }
    let lastTabScrollKey = "";
    // Dopo il renderer delle schede: aggiorna selettore e pannello Progetto con le etichette nuove
    const _renderTabsBase = renderMultiSectionTabs;
    renderMultiSectionTabs = function () { _renderTabsBase(); renderProjectPanel(); };

    function switchSectionTab(idx) {
      if (idx < 0 || idx >= projectSections.length || idx === currentSectionIdx) return;
      projectSections[currentSectionIdx] = cloneStateSnapshot(state);
      currentSectionIdx = idx;
      state = cloneStateSnapshot(projectSections[currentSectionIdx]);
      pushStateToUI(); // include recalculateAll()
      fitAll();
      renderMultiSectionTabs();
    }

    function addNewSectionTab(duplicateCurrent = false) {
      projectSections[currentSectionIdx] = cloneStateSnapshot(state);
      const nextNum = projectSections.length + 1;
      const letter = String.fromCharCode(64 + Math.min(26, nextNum));
      const newSec = cloneStateSnapshot(state);
      newSec.planTag = `SEZ. ${letter}-${letter} | H=+3.20m`;
      if (duplicateCurrent) {
        newSec.title = `${state.title.replace(/\s*\(Copia\)/i, "")} (Sez. ${letter}-${letter})`;
      } else {
        newSec.title = `NUOVA CANALINA ${String(nextNum).padStart(2, "0")} - L=${state.width}mm H=${state.height}mm`;
        newSec.cables = [];
        newSec.support = "none";
        newSec.pdfLoaded = false;
      }
      projectSections.push(newSec);
      currentSectionIdx = projectSections.length - 1;
      state = cloneStateSnapshot(newSec);
      pushStateToUI();
      fitAll();
      syncActiveSectionToMultiStore();
    }

    function deleteCurrentSectionTab() {
      deleteSectionTabAt(currentSectionIdx);
    }

    // ---------------------------------------------------------------------------
    // FILE DI PROGETTO .ccad (CanaloCAD): contiene TUTTE le sezioni del progetto.
    // Dentro è JSON leggibile; si riaprono anche i vecchi file .json.
    // Dove il browser lo consente (File System Access API) "Salva" riscrive lo stesso file.
    // ---------------------------------------------------------------------------
    const CCAD_EXT = ".ccad";
    const CCAD_MIME = "application/x-canalocad";
    const CCAD_PICKER_TYPES = [{ description: "Progetto CanaloCAD", accept: { [CCAD_MIME]: [CCAD_EXT] } }];
    let projectFileHandle = null;
    let projectFileName = "";

    function buildProjectPayload() {
      syncActiveSectionToMultiStore();
      return JSON.stringify({ format: "CanaloCAD project", app: APP_NAME, version: APP_VERSION, savedAt: new Date().toISOString(), currentSectionIdx, projectSections }, null, 2);
    }

    function suggestedProjectName() {
      const base = (projectFileName || state.tb.docCode || "PROGETTO_CANALINE").replace(/\.(ccad|json)$/i, "").replace(/[^a-zA-Z0-9_ -]/g, "_").trim();
      return `${base || "PROGETTO_CANALINE"}${CCAD_EXT}`;
    }

    // Salva il progetto. saveAs = true chiede sempre dove salvare.
    async function saveProject(saveAs = false) {
      const text = buildProjectPayload();
      const n = projectSections.length;
      const done = (name) => toast(`Progetto salvato: ${name} (${n} ${n === 1 ? "sezione" : "sezioni"})`, "ok", null, 3000);
      if (window.showSaveFilePicker) {
        try {
          if (!projectFileHandle || saveAs) {
            projectFileHandle = await window.showSaveFilePicker({ suggestedName: suggestedProjectName(), types: CCAD_PICKER_TYPES });
          }
          const w = await projectFileHandle.createWritable();
          await w.write(new Blob([text], { type: CCAD_MIME }));
          await w.close();
          projectFileName = projectFileHandle.name;
          done(projectFileName);
          return;
        } catch (e) {
          if (e && e.name === "AbortError") return; // l'utente ha annullato
          console.warn("Salvataggio diretto non riuscito, uso il download:", e);
          projectFileHandle = null;
        }
      }
      const name = suggestedProjectName();
      downloadBlob(new Blob([text], { type: CCAD_MIME }), name);
      done(name);
    }
    // Nome storico usato da menu e scorciatoie
    function exportProjectJSON() { return saveProject(false); }

    function loadProjectText(text, fileName) {
      let data;
      try { data = JSON.parse(text); } catch (e) { throw new Error("il file non è un progetto CanaloCAD valido"); }
      if (!data || !Array.isArray(data.projectSections) || data.projectSections.length === 0) {
        throw new Error("il file non contiene sezioni di progetto CanaloCAD");
      }
      if (scheduleSectionSync.pending()) scheduleSectionSync.flush();
      projectSections = data.projectSections.map(normalizeSection);
      currentSectionIdx = Math.min(Math.max(0, data.currentSectionIdx || 0), projectSections.length - 1);
      state = cloneStateSnapshot(projectSections[currentSectionIdx]);
      projectFileName = fileName || "";
      pushStateToUI();
      fitAll();
      syncActiveSectionToMultiStore();
      toast(`Progetto "${fileName}" aperto (${projectSections.length} ${projectSections.length === 1 ? "sezione" : "sezioni"})`, "ok", { label: "Annulla", onClick: undoLastChange });
    }

    async function openProjectFile(file, handle = null) {
      try {
        loadProjectText(await file.text(), file.name);
        projectFileHandle = handle; // con l'handle, "Salva" riscrive lo stesso file
      } catch (e) {
        console.error("Errore apertura progetto:", e);
        toast(`Impossibile aprire "${file.name}": ${e.message}`, "error", null, 8000);
      }
    }

    // Apri progetto: selettore del sistema se disponibile (mantiene il file per "Salva"), altrimenti <input>
    // Apri progetto: si usa sempre il selettore classico <input type="file">, sincrono rispetto al clic.
    // (Il selettore moderno, se falliva, ripiegava sul classico dopo un await: il browser lo
    // considerava non più un gesto dell'utente e lo bloccava senza alcun messaggio.)
    function openProjectDialog() {
      document.getElementById("jsonProjectInput").click();
    }

    // Smista un insieme di file al lettore giusto in base all'estensione (import, trascinamento)
    function routeImportedFiles(files) {
      const list = Array.from(files || []);
      if (!list.length) return;
      const ext = f => (f.name.toLowerCase().match(/\.[a-z0-9]+$/) || [""])[0];
      const project = list.find(f => ext(f) === ".ccad" || ext(f) === ".json");
      if (project) { openProjectFile(project); return; }
      const pdfs = list.filter(f => ext(f) === ".pdf");
      const cads = list.filter(f => ext(f) === ".dwg" || ext(f) === ".dxf");
      if (pdfs.length) importPDFFile({ files: pdfs, value: "" });
      if (cads.length) importCADFile({ files: cads, value: "" });
      if (!pdfs.length && !cads.length) toast(`Formato non riconosciuto: "${list[0].name}". Si possono aprire file .ccad, .dwg, .dxf e .pdf.`, "warn", null, 7000);
    }

    async function importProjectJSON(inputEl) {
      const file = inputEl.files && inputEl.files[0];
      if (!file) return;
      try { await openProjectFile(file, null); } finally { inputEl.value = ""; }
    }

    // App installata (PWA): doppio clic su un file .ccad apre direttamente il progetto
    function initProjectFileLaunch() {
      if (!("launchQueue" in window)) return;
      window.launchQueue.setConsumer(async (params) => {
        const handle = params.files && params.files[0];
        if (handle) await openProjectFile(await handle.getFile(), handle);
      });
    }

