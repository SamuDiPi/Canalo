    // ============================================================================
    // GESTIONE MENU A TENDINA STILE WINDOWS / CAD DESKTOP & PWA OFFLINE READY
    // ============================================================================
    function closeAllMenus() {
      document.querySelectorAll(".win-dropdown").forEach(d => d.classList.add("hidden"));
      document.querySelectorAll(".win-menu-btn").forEach(b => b.classList.remove("bg-slate-800", "text-white"));
      const tabsDrop = document.getElementById("tabsDropdownMenu");
      if (tabsDrop) tabsDrop.classList.add("hidden");
    }

    // ============================================================================
    // GESTIONE SCORCIATOIE PERSONALIZZABILI & IMPOSTAZIONI CARTIGLIO
    // ============================================================================
    const DEFAULT_KEY_SHORTCUTS = {
      openDwg: { key: 'o', ctrl: true, shift: false, alt: false, label: 'Apri / Importa DWG' },
      openPdf: { key: 'u', ctrl: true, shift: false, alt: false, label: 'Importa PDF Unifilare' },
      exportDxf: { key: 'e', ctrl: true, shift: false, alt: false, label: 'Scarica DXF 1:1' },
      fitAll: { key: 'Home', ctrl: false, shift: false, alt: false, label: 'Zoom Tutto (Centra)' },
      swapDims: { key: 'i', ctrl: true, shift: false, alt: false, label: 'Inverti Base L e H' },
      clearTray: { key: 'Delete', ctrl: false, shift: false, alt: false, label: 'Svuota cavi della sezione' },
      undo: { key: 'z', ctrl: true, shift: false, alt: false, label: 'Annulla' },
      redo: { key: 'y', ctrl: true, shift: false, alt: false, label: 'Ripeti' },
      recalculate: { key: 'F5', ctrl: false, shift: false, alt: false, label: 'Ricalcola Portate' },
      cartiglio: { key: 'F2', ctrl: false, shift: false, alt: false, label: 'Dati Cartiglio & Committente' },
      openDb: { key: 'F3', ctrl: false, shift: false, alt: false, label: 'Catalogo Tecnico Database' },
      shortcuts: { key: 'F4', ctrl: false, shift: false, alt: false, label: 'Personalizza Scorciatoie' },
      help: { key: 'F1', ctrl: false, shift: false, alt: false, label: 'Guida Rapida' },
      saveJson: { key: 's', ctrl: true, shift: false, alt: false, label: 'Salva Progetto JSON' }
    };

    let userShortcuts = Object.assign({}, DEFAULT_KEY_SHORTCUTS);
    let rebindingAction = null;

    function loadUserShortcuts() {
      try {
        const saved = localStorage.getItem("canaloCAD_userShortcuts");
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach(k => {
            if (userShortcuts[k]) userShortcuts[k] = parsed[k];
          });
        }
      } catch (e) {}
      updateMenuBadges();
    }

    function saveUserShortcuts() {
      try {
        localStorage.setItem("canaloCAD_userShortcuts", JSON.stringify(userShortcuts));
      } catch (e) {}
      updateMenuBadges();
    }

    function formatShortcutLabel(s) {
      if (!s || !s.key) return "-";
      const parts = [];
      if (s.ctrl) parts.push("Ctrl");
      if (s.alt) parts.push("Alt");
      if (s.shift) parts.push("Shift");
      let k = s.key;
      if (k === " ") k = "Spazio";
      else if (k.length === 1) k = k.toUpperCase();
      parts.push(k);
      return parts.join("+");
    }

    function matchShortcutEvent(e, s) {
      if (!s || !s.key) return false;
      const ctrlMatch = !!s.ctrl === !!(e.ctrlKey || e.metaKey);
      const altMatch = !!s.alt === !!e.altKey;
      const shiftMatch = !!s.shift === !!e.shiftKey;
      const keyMatch = s.key.toLowerCase() === (e.key || "").toLowerCase();
      return ctrlMatch && altMatch && shiftMatch && keyMatch;
    }

    function updateMenuBadges() {
      const bDwg = document.getElementById("badgeMenuDwg"); if (bDwg) bDwg.textContent = formatShortcutLabel(userShortcuts.openDwg);
      const bPdf = document.getElementById("badgeMenuPdf"); if (bPdf) bPdf.textContent = formatShortcutLabel(userShortcuts.openPdf);
      const bDxf = document.getElementById("badgeMenuDxf"); if (bDxf) bDxf.textContent = formatShortcutLabel(userShortcuts.exportDxf);
      const bSwap = document.getElementById("badgeMenuSwap"); if (bSwap) bSwap.textContent = formatShortcutLabel(userShortcuts.swapDims);
      const bDb = document.getElementById("badgeMenuDb"); if (bDb) bDb.textContent = formatShortcutLabel(userShortcuts.openDb);
      const bCart = document.getElementById("badgeMenuCartiglio"); if (bCart) bCart.textContent = formatShortcutLabel(userShortcuts.cartiglio);
      const bSc = document.getElementById("badgeMenuShortcuts"); if (bSc) bSc.textContent = formatShortcutLabel(userShortcuts.shortcuts);
      const bHelp = document.getElementById("badgeMenuHelp"); if (bHelp) bHelp.textContent = formatShortcutLabel(userShortcuts.help);
    }

    function renderShortcutsTable() {
      const container = document.getElementById("shortcutsTableBody");
      if (!container) return;
      container.innerHTML = "";
      Object.entries(userShortcuts).forEach(([actionId, sc]) => {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between p-2.5 hover:bg-slate-900 transition";
        row.innerHTML = `
          <div>
            <div class="font-bold text-white text-xs">${sc.label}</div>
            <div class="text-[11px] text-slate-400 mono">Azione: ${actionId}</div>
          </div>
          <button type="button" onclick="startRebinding('${actionId}')" id="scBtn_${actionId}" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 rounded text-amber-300 mono text-xs font-bold transition flex items-center gap-1.5" title="Clicca per riassegnare">
            <span>${formatShortcutLabel(sc)}</span>
            <span class="text-[11px] text-slate-400">✏️</span>
          </button>
        `;
        container.appendChild(row);
      });
    }

    function startRebinding(actionId) {
      rebindingAction = actionId;
      const banner = document.getElementById("rebindBanner");
      if (banner) {
        banner.classList.remove("hidden");
        banner.textContent = `In ascolto per "${userShortcuts[actionId].label}"... Premi la nuova combinazione di tasti sulla tastiera (o Esc per annullare)`;
      }
      const btn = document.getElementById(`scBtn_${actionId}`);
      if (btn) btn.className = "px-2.5 py-1 bg-amber-500 text-slate-950 font-bold border border-amber-400 rounded text-xs animate-pulse";
    }

    function resetDefaultShortcuts() {
      userShortcuts = JSON.parse(JSON.stringify(DEFAULT_KEY_SHORTCUTS));
      saveUserShortcuts();
      renderShortcutsTable();
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = "✓ Scorciatoie ripristinate ai valori predefiniti!";
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
      }
    }

    function openShortcutsModal() {
      closeAllMenus();
      rebindingAction = null;
      renderShortcutsTable();
      const m = document.getElementById("keyboardShortcutsModal");
      if (m) m.classList.remove("hidden");
    }

    function closeShortcutsModal() {
      rebindingAction = null;
      const b = document.getElementById("rebindBanner");
      if (b) b.classList.add("hidden");
      const m = document.getElementById("keyboardShortcutsModal");
      if (m) m.classList.add("hidden");
    }

    function openCartiglioSettingsModal() {
      closeAllMenus();
      const elClient = document.getElementById("cfgClient"); if (elClient) elClient.value = state.tb.client || "PROGETTO ESECUTIVO";
      const elProj = document.getElementById("cfgProject"); if (elProj) elProj.value = state.tb.project || "IMPIANTI ELETTRICI E SPECIALI";
      const elAuth = document.getElementById("cfgAuthor"); if (elAuth) elAuth.value = state.tb.author || "STUDIO TECNICO";
      const elCheck = document.getElementById("cfgChecker"); if (elCheck) elCheck.value = state.tb.checker || "RESPONSABILE TECNICO";
      const elDoc = document.getElementById("cfgDocCode"); if (elDoc) elDoc.value = state.tb.docCode || "PE-IMP-EL-PART-02";
      const elRev = document.getElementById("cfgRev"); if (elRev) elRev.value = state.tb.rev || "Rev. 00";
      const elScale = document.getElementById("cfgScale"); if (elScale) elScale.value = state.scale || "1:1";
      const elPlan = document.getElementById("cfgPlanTag"); if (elPlan) elPlan.value = state.planTag || "SEZ. A-A | H=+3.20m";
      const m = document.getElementById("cartiglioSettingsModal");
      if (m) m.classList.remove("hidden");
    }

    function closeCartiglioSettingsModal() {
      const m = document.getElementById("cartiglioSettingsModal");
      if (m) m.classList.add("hidden");
    }

    function saveCartiglioSettings() {
      state.tb.client = (document.getElementById("cfgClient").value || "PROGETTO ESECUTIVO").trim();
      state.tb.project = (document.getElementById("cfgProject").value || "IMPIANTI ELETTRICI").trim();
      state.tb.author = (document.getElementById("cfgAuthor").value || "STUDIO TECNICO").trim();
      state.tb.checker = (document.getElementById("cfgChecker").value || "").trim();
      state.tb.docCode = (document.getElementById("cfgDocCode").value || "PE-IMP-EL-PART-02").trim();
      state.tb.rev = (document.getElementById("cfgRev").value || "Rev. 00").trim();
      state.tb.scaleRev = `Scala ${document.getElementById("cfgScale").value || state.scale || "1:1"} - ${state.tb.rev}`;
      state.scale = document.getElementById("cfgScale").value || state.scale || "1:1";
      state.planTag = (document.getElementById("cfgPlanTag").value || "SEZ. A-A | H=+3.20m").trim();

      const elClient = document.getElementById("inpClient"); if (elClient) elClient.value = state.tb.client;
      const elDoc = document.getElementById("inpDocCode"); if (elDoc) elDoc.value = state.tb.docCode;
      const elAuth = document.getElementById("inpAuthor"); if (elAuth) elAuth.value = state.tb.author;
      const elRev = document.getElementById("inpScaleRev"); if (elRev) elRev.value = state.tb.scaleRev;
      const elScale = document.getElementById("inpScale"); if (elScale) elScale.value = state.scale;
      const elDxfScale = document.getElementById("selDxfScale"); if (elDxfScale) elDxfScale.value = state.scale;
      const elPlan = document.getElementById("inpPlanTag"); if (elPlan) elPlan.value = state.planTag;

      const saveDef = document.getElementById("cfgSaveDefaults")?.checked;
      if (saveDef) {
        try {
          localStorage.setItem("canaloCAD_cartiglioDefaults", JSON.stringify({
            client: state.tb.client,
            project: state.tb.project,
            author: state.tb.author,
            checker: state.tb.checker,
            docCode: state.tb.docCode,
            rev: state.tb.rev,
            planTag: state.planTag,
            scale: state.scale
          }));
        } catch (e) {}
      }

      closeCartiglioSettingsModal();
      drawScene();
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = `✓ Dati cartiglio e committente aggiornati: ${state.tb.client} | ${state.tb.author}`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold";
      }
    }

    function loadCartiglioDefaults() {
      try {
        const saved = localStorage.getItem("canaloCAD_cartiglioDefaults");
        if (saved) {
          const data = JSON.parse(saved);
          if (data.client) state.tb.client = data.client;
          if (data.project) state.tb.project = data.project;
          if (data.author) state.tb.author = data.author;
          if (data.checker) state.tb.checker = data.checker;
          if (data.docCode) state.tb.docCode = data.docCode;
          if (data.rev) state.tb.rev = data.rev;
          if (data.planTag) state.planTag = data.planTag;
          if (data.scale) state.scale = data.scale;
        }
      } catch (e) {}
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
        if (!e.target.closest("#winMenuBar") && !e.target.closest("#tabsDropdownContainer")) {
          closeAllMenus();
        }
      });

      document.addEventListener("keydown", (e) => {
        // Se stiamo riassegnando una scorciatoia nella modale
        if (rebindingAction) {
          e.preventDefault();
          e.stopPropagation();
          if (e.key === "Escape") {
            rebindingAction = null;
            const b = document.getElementById("rebindBanner");
            if (b) b.classList.add("hidden");
            renderShortcutsTable();
            return;
          }
          if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
          userShortcuts[rebindingAction] = {
            key: e.key,
            ctrl: !!(e.ctrlKey || e.metaKey),
            shift: !!e.shiftKey,
            alt: !!e.altKey,
            label: userShortcuts[rebindingAction].label
          };
          saveUserShortcuts();
          rebindingAction = null;
          const b = document.getElementById("rebindBanner");
          if (b) b.classList.add("hidden");
          renderShortcutsTable();
          return;
        }

        // Se l'utente sta digitando in un campo di testo, non intercettare lettere/numeri
        const activeTag = (document.activeElement && document.activeElement.tagName) || "";
        const isInput = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
        if (isInput && !e.key.startsWith("F") && e.key !== "Escape") return;

        // Navigazione rapida tra le schede aperte (Ctrl+PageDown / Ctrl+PageUp / Alt+Frecce)
        if ((e.ctrlKey && (e.key === "PageDown" || e.key === "PageUp")) || (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowLeft"))) {
          if (projectSections && projectSections.length > 1) {
            e.preventDefault();
            const isNext = e.key === "PageDown" || e.key === "ArrowRight";
            const nextIdx = isNext
              ? (currentSectionIdx + 1) % projectSections.length
              : (currentSectionIdx - 1 + projectSections.length) % projectSections.length;
            switchSectionTab(nextIdx);
            return;
          }
        }

        if (e.key === "Escape") {
          closeAllMenus();
          closeExportDialog();
          toggleTabsDropdown(false);
          closeQuickHelpModal();
          closePwaOfflineModal();
          closeCartiglioSettingsModal();
          closeShortcutsModal();
          closePdfImportScopeModal();
          const dbM = document.getElementById("databaseCatalogModal");
          if (dbM && !dbM.classList.contains("hidden")) toggleDatabaseModal();
          const expM = document.getElementById("exportOptionsModal");
          if (expM && !expM.classList.contains("hidden")) toggleExportOptionsModal();
          return;
        }

        // Valutazione scorciatoie personalizzate
        if (matchShortcutEvent(e, userShortcuts.openDwg)) {
          e.preventDefault();
          const dwgInp = document.getElementById("dwgInput");
          if (dwgInp) dwgInp.click();
        } else if (matchShortcutEvent(e, userShortcuts.openPdf)) {
          e.preventDefault();
          const pdfInp = document.getElementById("pdfInput");
          if (pdfInp) pdfInp.click();
        } else if (matchShortcutEvent(e, userShortcuts.exportDxf)) {
          e.preventDefault();
          exportAutoCADDXF();
        } else if (matchShortcutEvent(e, userShortcuts.fitAll)) {
          e.preventDefault();
          fitAll();
        } else if (matchShortcutEvent(e, userShortcuts.swapDims)) {
          e.preventDefault();
          swapDimensions();
        } else if (matchShortcutEvent(e, userShortcuts.undo)) {
          e.preventDefault();
          undoLastChange();
        } else if (matchShortcutEvent(e, userShortcuts.redo) || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")) {
          e.preventDefault();
          redoLastChange();
        } else if (matchShortcutEvent(e, userShortcuts.clearTray)) {
          e.preventDefault();
          clearCables();
        } else if (matchShortcutEvent(e, userShortcuts.recalculate)) {
          e.preventDefault();
          recalculateAll();
        } else if (matchShortcutEvent(e, userShortcuts.cartiglio)) {
          e.preventDefault();
          openCartiglioSettingsModal();
        } else if (matchShortcutEvent(e, userShortcuts.openDb)) {
          e.preventDefault();
          toggleDatabaseModal(true);
        } else if (matchShortcutEvent(e, userShortcuts.shortcuts)) {
          e.preventDefault();
          openShortcutsModal();
        } else if (matchShortcutEvent(e, userShortcuts.help)) {
          e.preventDefault();
          showQuickHelpModal();
        } else if (matchShortcutEvent(e, userShortcuts.saveJson)) {
          e.preventDefault();
          exportProjectJSON();
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

    // PWA reale: manifest e service worker (sw.js) si attivano solo se la pagina è servita via http(s).
    // Aprendo il file con doppio clic (file://) le voci offline vengono nascoste.
    function initPwaOffline() {
      const badge = document.getElementById("pwaStatusBadge");
      const isHttp = location.protocol === "https:" || location.protocol === "http:";
      const canSw = isHttp && "serviceWorker" in navigator && window.isSecureContext;
      document.querySelectorAll("[data-pwa-only]").forEach(el => el.classList.toggle("hidden", !canSw));
      if (!canSw) { if (badge) badge.classList.add("hidden"); return; }

      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "manifest.webmanifest";
      document.head.appendChild(link);

      const setBadge = (txt, ok) => {
        if (!badge) return;
        badge.classList.remove("hidden");
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-slate-500"}"></span> ${txt}`;
        badge.title = ok ? "Le risorse dell'app sono in cache: funziona anche senza connessione" : "Modalità offline in preparazione";
      };
      setBadge("Offline: preparazione…", false);
      navigator.serviceWorker.register("sw.js").then(reg => {
        const done = () => setBadge("Disponibile offline", true);
        if (reg.active) done();
        navigator.serviceWorker.ready.then(done);
      }).catch(err => {
        console.warn("Service worker non registrato:", err);
        if (badge) badge.classList.add("hidden");
      });
    }

    // Modali accessibili: focus al primo campo all'apertura, ritorno al pulsante d'origine alla chiusura,
    // Tab confinato nella finestra, clic sullo sfondo = chiudi (come Esc).
    function initModalA11y() {
      const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      document.querySelectorAll('[role="dialog"]').forEach(modal => {
        const heading = modal.querySelector("h2, h3");
        if (heading && !modal.hasAttribute("aria-label")) modal.setAttribute("aria-label", heading.textContent.trim());
        let opener = null;
        new MutationObserver(() => {
          const open = !modal.classList.contains("hidden");
          if (open && !modal._wasOpen) {
            opener = document.activeElement;
            const first = [...modal.querySelectorAll(FOCUSABLE)].find(el => el.offsetParent !== null);
            setTimeout(() => (first || modal).focus({ preventScroll: true }), 0);
          } else if (!open && modal._wasOpen && opener && opener.isConnected) {
            opener.focus({ preventScroll: true });
          }
          modal._wasOpen = open;
        }).observe(modal, { attributes: true, attributeFilter: ["class"] });

        modal.addEventListener("keydown", e => {
          if (e.key !== "Tab") return;
          const items = [...modal.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
          if (!items.length) return;
          const first = items[0], last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
        modal.addEventListener("mousedown", e => {
          if (e.target === modal) document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        });
      });
    }

    window.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("[data-app-version]").forEach(el => { el.textContent = APP_VERSION; });
      initModalA11y();
      initUiShell();
      loadCartiglioDefaults();
      loadUserShortcuts();
      initWindowsMenuBar();
      initPwaOffline();
      initCatalogDropdown();
      populateBrandSeries();
      initMultiSectionTabs();
      setEngineBadge("Motore DWG: al primo import", "idle");

      // Riprende il lavoro dell'ultima sessione, se presente
      if (restoreAutosave()) {
        pushStateToUI();
        fitAll();
        syncActiveSectionToMultiStore();
        toast(`Ripreso il progetto dell'ultima sessione (${projectSections.length} ${projectSections.length === 1 ? "scheda" : "schede"})`, "info", { label: "Nuovo progetto", onClick: newProject }, 6000);
      } else {
        resetProject();
        syncActiveSectionToMultiStore();
      }

      const onResize = debounce(() => { drawInteractiveLoadCurveWidget(); drawScene(); }, 100);
      window.addEventListener("resize", onResize);
      // Ultimo salvataggio prima di chiudere o ricaricare la pagina
      window.addEventListener("pagehide", () => { if (scheduleSectionSync.pending()) scheduleSectionSync.flush(); });
    });
