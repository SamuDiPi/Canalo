    // ============================================================================
    // 12. INTERFACCIA MATERIAL 3: PANNELLI, CONTROLLI SEGMENTATI, VERIFICHE, ESPORTA
    // Solo interfaccia: non modifica la scena CAD né gli export.
    // ============================================================================
    var currentPanel = "sezione";
    var selectedCableIdx = -1;
    var lastStatusToast = { text: "", t: 0 };

    const fmtIt = (v, d = 0) => (Number.isFinite(+v) ? (+v).toFixed(d).replace(".", ",") : "—");

    // --- Pannelli della rail ---------------------------------------------------
    function showPanel(name, forceOpen = false) {
      const side = document.getElementById("sidePanel");
      if (!side) return;
      if (name === currentPanel && !forceOpen && !side.classList.contains("collapsed")) {
        side.classList.add("collapsed"); // secondo clic sulla voce attiva: più spazio al foglio
      } else {
        side.classList.remove("collapsed");
      }
      currentPanel = name;
      document.querySelectorAll("[data-panel-body]").forEach(el => el.classList.toggle("hidden", el.dataset.panelBody !== name));
      const open = !side.classList.contains("collapsed");
      document.querySelectorAll(".rail-item[data-panel]").forEach(b => {
        const on = b.dataset.panel === name && open;
        b.classList.toggle("active", on);
        if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      });
      const title = document.querySelector(`[data-panel-body="${name}"] .panel-title`);
      side.setAttribute("aria-label", title ? title.textContent : "Pannello");
      safeStorage.set("canaloCAD_panel", name);
      drawScene(); // la larghezza del foglio cambia
    }

    // --- Pulsanti segmentati collegati a una <select> nascosta -----------------
    function initSegmented() {
      document.querySelectorAll("[data-seg-for]").forEach(group => {
        group.addEventListener("click", e => {
          const btn = e.target.closest("button[data-value]");
          const sel = document.getElementById(group.dataset.segFor);
          if (!btn || !sel || sel.value === btn.dataset.value) return;
          sel.value = btn.dataset.value;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          refreshSegmented();
        });
      });
    }

    function refreshSegmented() {
      document.querySelectorAll("[data-seg-for]").forEach(group => {
        const sel = document.getElementById(group.dataset.segFor);
        if (!sel) return;
        const cur = sel.value;
        group.querySelectorAll("button[data-value]").forEach(b => {
          const v = b.dataset.value;
          const same = v === cur || (v !== "" && !isNaN(v) && !isNaN(cur) && cur !== "" && +v === +cur);
          b.setAttribute("aria-pressed", String(same));
        });
      });
      document.querySelectorAll("[data-seg-help]").forEach(p => {
        const sel = document.getElementById(p.dataset.segHelp);
        if (sel) p.textContent = p.getAttribute(`data-help-${sel.value}`) || "";
      });
    }

    // --- Verifiche a semaforo ------------------------------------------------------
    function maxSafeSpan(totalKgM) {
      for (let s = 3.0; s >= 1.0 - 1e-9; s -= 0.05) {
        if (calcAllowedLinearLoadKgM(state.support, s) >= totalKgM) return Math.round(s * 20) / 20;
      }
      return null;
    }

    function buildChecks() {
      const m = metrics || {};
      const n = state.cables.length;
      const out = [];
      const hasSupport = state.support && state.support !== "none";

      if (n === 0) {
        out.push({ id: "empty", tone: "info", chip: "Nessun cavo", title: "Nessun cavo nella sezione", text: "Aggiungi cavi dal catalogo oppure importa un disegno DWG/DXF.", action: { id: "addCables", label: "Aggiungi cavi" } });
      } else {
        if (m.segConform === false) {
          const code = (String(m.segDetail || "").match(/Conflitto (.+?):/) || [])[1] || "di segnale";
          out.push({ id: "seg", tone: "warn", chip: "Segregazione: serve un setto", title: "Cavi di segnale e di potenza nello stesso scomparto",
            text: `Il cavo ${code} non è schermato e si trova accanto a cavi di potenza: separali con un setto.`,
            ref: "Segregazione · CEI 64-8 art. 528.1",
            action: (state.septums || 0) < 2 ? { id: "addSeptum", label: "Aggiungi setto separatore" } : null });
        } else {
          const onlyPower = !state.cables.some(c => c.sys === "SPECIAL_ELV");
          out.push({ id: "seg", tone: "ok", chip: "Segregazione", title: "Segregazione rispettata",
            text: onlyPower ? "Nella sezione ci sono solo cavi di potenza." : "Potenza e segnali sono in scomparti separati.", ref: "CEI 64-8 art. 528.1" });
        }

        const reserve = parseFloat((document.getElementById("inpSpareReserve") || {}).value) || 30;
        if ((m.sparePct || 0) >= reserve) {
          out.push({ id: "fill", tone: "ok", chip: `Riempimento ${fmtIt(m.fillPct, 0)} %`, title: "Riempimento", value: `${fmtIt(m.fillPct, 1)} %`,
            text: `Resta il ${fmtIt(m.sparePct, 0)} % di spazio libero (riserva richiesta ${fmtIt(reserve, 0)} %).` });
        } else {
          out.push({ id: "fill", tone: "warn", chip: `Riempimento ${fmtIt(m.fillPct, 0)} %`, title: "Spazio libero sotto la riserva", value: `${fmtIt(m.fillPct, 1)} %`,
            text: `Resta il ${fmtIt(m.sparePct, 0)} % di spazio libero, ne serve almeno il ${fmtIt(reserve, 0)} %.`,
            action: { id: "autosize", label: "Allarga la canalina" } });
        }
      }

      if (!hasSupport) {
        out.push({ id: "load", tone: "info", chip: "Staffaggio da definire", title: "Staffaggio non definito", text: "Scegli un supporto per verificare carico sulle mensole e freccia.", action: { id: "chooseSupport", label: "Scegli supporto" } });
      } else {
        if ((m.loadPct || 0) <= 100) {
          out.push({ id: "load", tone: "ok", chip: `Carico mensole ${fmtIt(m.loadPct, 0)} %`, title: "Carico sulle mensole", value: `${fmtIt(m.loadPct, 0)} %`,
            text: `${fmtIt(m.totalKgM, 1)} kg/m su ${fmtIt(m.qMaxKgM, 1)} kg/m ammessi con passo ${fmtIt(state.spanM, 2)} m.`, ref: "Stima secondo CEI EN 61537" });
        } else {
          const s = maxSafeSpan(m.totalKgM || 0);
          out.push({ id: "load", tone: "error", chip: `Mensole sovraccariche ${fmtIt(m.loadPct, 0)} %`, title: "Mensole sovraccariche", value: `${fmtIt(m.loadPct, 0)} %`,
            text: `${fmtIt(m.totalKgM, 1)} kg/m su ${fmtIt(m.qMaxKgM, 1)} kg/m ammessi: riduci il passo o scegli un supporto più robusto.`, ref: "Stima secondo CEI EN 61537",
            action: s ? { id: "reduceSpan", label: `Riduci il passo a ${fmtIt(s, 2)} m`, arg: s } : { id: "chooseSupport", label: "Cambia supporto" } });
        }
        const deflOk = (m.deflectionMm || 0) <= (m.maxDeflectionMm || 0);
        out.push({ id: "defl", tone: deflOk ? "ok" : "warn", chip: "Freccia", title: deflOk ? "Freccia della passerella" : "Freccia oltre il limite",
          value: `${fmtIt(m.deflectionMm, 1)} / ${fmtIt(m.maxDeflectionMm, 1)} mm`, text: deflOk ? "Abbassamento tra le mensole entro il limite di L/200." : "L'abbassamento tra le mensole supera L/200: riduci il passo." });
      }

      if (n > 0) {
        if ((m.pullDaN || 0) > (m.maxPullDaN || Infinity)) {
          out.push({ id: "pull", tone: "warn", chip: "Tiro di posa", title: "Tiro di posa eccessivo", value: `${fmtIt(m.pullDaN, 0)} daN`,
            text: `Stimato ${fmtIt(m.pullDaN, 0)} daN, massimo ${fmtIt(m.maxPullDaN, 0)} daN: riduci curve o lunghezza del tratto di tiro.` });
        } else {
          out.push({ id: "pull", tone: "ok", chip: "Tiro di posa", title: "Tiro di posa", value: `${fmtIt(m.pullDaN, 0)} daN`, text: `Entro il massimo stimato di ${fmtIt(m.maxPullDaN, 0)} daN.` });
        }
        out.push({ id: "bend", tone: "ok", chip: `Curvatura R ${fmtIt(m.maxBendR, 0)}`, title: "Raggio di curvatura", value: `R ${fmtIt(m.maxBendR, 0)} mm`,
          text: `Le curve da R ${fmtIt(m.fitR, 0)} mm vanno bene per il cavo più rigido (${m.critCode || "—"}).` });

        if (!state.pdfLoaded) {
          out.push({ id: "amp", tone: "info", chip: "Portate da verificare", title: "Portate dei cavi non verificate", text: "Importa lo schema unifilare PDF per controllare correnti e cadute di tensione.", action: { id: "importPdf", label: "Importa schema PDF" } });
        } else if (m.deratingFailCode) {
          out.push({ id: "amp", tone: "error", chip: "Portata insufficiente", title: "Portata insufficiente", text: `Per il cavo ${m.deratingFailCode} la portata ridotta (Iz × Kr, Kr = ${fmtIt(m.kr, 2)}) è inferiore alla corrente di impiego.`, ref: "CEI UNEL 35024" });
        } else {
          out.push({ id: "amp", tone: "ok", chip: "Portate", title: "Portate dei cavi", value: `ΔV ${fmtIt(m.maxDv, 2)} %`, text: `Kr = ${fmtIt(m.kr, 2)} su ${m.nLayers || 1} strati: tutte le portate superano la corrente di impiego.`, ref: "CEI UNEL 35024" });
        }
      }
      return out;
    }

    const TONE_ICON = { ok: "i-ok", warn: "i-warn", error: "i-error", info: "i-info" };

    function renderChecks() {
      const checks = buildChecks();
      const e = escapeHtml;
      const order = { error: 0, warn: 1, info: 2, ok: 3 };
      const sorted = checks.slice().sort((a, b) => order[a.tone] - order[b.tone]);
      const list = document.getElementById("checksList");
      if (list) {
        list.innerHTML = sorted.map(c => `
          <div class="check ${c.tone}" ${c.tone === "error" || c.tone === "warn" ? 'role="alert"' : ""}>
            <svg class="ico st" aria-hidden="true"><use href="#${TONE_ICON[c.tone]}"/></svg>
            <div class="flex-1 min-w-0">
              <div class="head"><h3>${e(c.title)}</h3>${c.value ? `<span class="val">${e(c.value)}</span>` : ""}</div>
              <p>${e(c.text)}</p>
              ${c.action ? `<button type="button" class="btn ${c.tone === "info" ? "btn-outlined" : "btn-filled"} btn-sm mt-3" data-check-action="${c.action.id}" data-arg="${c.action.arg != null ? c.action.arg : ""}">${e(c.action.label)}</button>` : ""}
              ${c.ref ? `<div class="ref">${e(c.ref)}</div>` : ""}
            </div>
          </div>`).join("");
      }
      const chips = document.getElementById("checkChips");
      if (chips) {
        chips.innerHTML = checks.map(c => `<button type="button" role="listitem" class="chip ${c.tone}" data-open-checks><svg class="ico ico-s st" aria-hidden="true"><use href="#${TONE_ICON[c.tone]}"/></svg>${e(c.chip)}</button>`).join("");
      }
      const bad = checks.filter(c => c.tone === "warn" || c.tone === "error");
      const badge = document.getElementById("railBadgeChecks");
      if (badge) {
        badge.textContent = bad.length;
        badge.classList.toggle("hidden", bad.length === 0);
        badge.classList.toggle("err", checks.some(c => c.tone === "error"));
        badge.setAttribute("aria-label", `${bad.length} ${bad.length === 1 ? "punto" : "punti"} da sistemare`);
      }
      const okN = checks.filter(c => c.tone === "ok").length;
      const sum = document.getElementById("checksSummary");
      if (sum) sum.textContent = bad.length
        ? `${bad.length} ${bad.length === 1 ? "punto da sistemare" : "punti da sistemare"}, ${okN} ${okN === 1 ? "controllo superato" : "controlli superati"}.`
        : (okN ? "Tutti i controlli sono superati." : "");
      const cnt = document.getElementById("lblCableCount");
      if (cnt) cnt.textContent = state.cables.length;
    }

    function runCheckAction(id, arg) {
      if (id === "addSeptum") {
        const sel = document.getElementById("inpSeptums");
        sel.value = String(Math.min(2, (state.septums || 0) + 1));
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        refreshSegmented();
        toast("Setto separatore aggiunto", "ok", { label: "Annulla", onClick: undoLastChange });
      } else if (id === "autosize") {
        autoSizeTray();
        toast(`Larghezza portata a ${state.width} mm`, "ok", { label: "Annulla", onClick: undoLastChange });
      } else if (id === "reduceSpan") {
        setSpanM(parseFloat(arg));
        toast(`Passo ridotto a ${fmtIt(state.spanM, 2)} m`, "ok", { label: "Annulla", onClick: undoLastChange });
      } else if (id === "chooseSupport") {
        showPanel("staffaggio", true);
        setTimeout(() => document.getElementById("inpSupport")?.focus(), 0);
      } else if (id === "importPdf") {
        document.getElementById("pdfInput").click();
      } else if (id === "addCables") {
        showPanel("cavi", true);
        setTimeout(() => document.getElementById("selCableCatalog")?.focus(), 0);
      }
    }

    // --- Distinta: comprimi/espandi e selezione collegata al disegno ---------------
    function toggleDistinta(force) {
      const body = document.getElementById("distBody");
      const btn = document.getElementById("btnDistToggle");
      if (!body || !btn) return;
      const open = typeof force === "boolean" ? force : body.classList.contains("hidden");
      body.classList.toggle("hidden", !open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Comprimi distinta" : "Espandi distinta");
      const ico = btn.querySelector("svg");
      if (ico) ico.style.transform = open ? "rotate(180deg)" : "";
      safeStorage.set("canaloCAD_distOpen", open ? "1" : "0");
      drawScene();
    }

    function selectCable(idx, scrollRow = false) {
      selectedCableIdx = (idx >= 0 && idx < state.cables.length) ? idx : -1;
      document.querySelectorAll("#tblBody tr[data-idx]").forEach(tr => {
        const on = +tr.dataset.idx === selectedCableIdx;
        tr.classList.toggle("row-sel", on);
        tr.setAttribute("aria-selected", String(on));
        if (on && scrollRow) tr.scrollIntoView({ block: "nearest" });
      });
      drawScene();
    }

    // Anello di evidenziazione disegnato sopra la scena (non fa parte della tavola né degli export)
    function drawSelectionOverlay(ctx) {
      const c = state.cables[selectedCableIdx];
      if (!c || !(c.x >= 0)) return;
      ctx.save();
      ctx.strokeStyle = "#A8C7FA";
      ctx.lineWidth = Math.max(0.6, 2 / camScale);
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(c.x, -c.y, c.d / 2 + 1.4, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = Math.max(1.2, 5 / camScale);
      ctx.beginPath(); ctx.arc(c.x, -c.y, c.d / 2 + 2.6, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // --- Pannello Progetto e selettore sezione ------------------------------------
    function renderProjectPanel() {
      const e = escapeHtml;
      const n = projectSections.length;
      const label = n === 1 ? "1 sezione" : `${n} sezioni`;
      const cur = state;
      const name = document.getElementById("sectionPickerName");
      if (name) name.textContent = (String(cur.title || "").match(/\(([^)]+)\)/) || [])[1] || cur.title || "Sezione";
      const dims = document.getElementById("sectionPickerDims");
      if (dims) dims.textContent = `${cur.width} × ${cur.height}`;
      const cnt = document.getElementById("lblTabsCount");
      if (cnt) cnt.textContent = `· ${label}`;
      const badge = document.getElementById("tabsDropdownCountBadge");
      if (badge) badge.textContent = label;

      const ttl = document.getElementById("projSectionsTitle");
      if (ttl) ttl.textContent = `Sezioni (${n})`;
      const list = document.getElementById("projSectionsList");
      if (list) {
        list.innerHTML = projectSections.map((sec, i) => {
          const active = i === currentSectionIdx;
          const nCab = Array.isArray(sec.cables) ? sec.cables.length : 0;
          return `<div role="listitem"><button type="button" class="choice ${active ? "on" : ""}" data-section-idx="${i}" ${active ? 'aria-current="true"' : ""} style="padding: ${active ? "11px 13px" : "12px 14px"}">
            <span class="flex-1 min-w-0"><span class="block font-semibold text-sm truncate">${e(sec.title || `Sezione ${i + 1}`)}</span>
            <span class="block mono text-xs mt-0.5" style="color: var(--md-on-surface-variant)">${e(sec.width)} × ${e(sec.height)} mm · ${nCab} ${nCab === 1 ? "cavo" : "cavi"}</span></span>
            ${active ? '<span class="tag primary">Aperta</span>' : ""}</button></div>`;
        }).join("");
      }
      const tb = document.getElementById("projTitleBlock");
      if (tb) {
        const t = state.tb || {};
        const rows = [["Committente", t.client], ["Progetto", t.project], ["Progettista", t.author], ["Codice", t.docCode], ["Revisione", t.rev], ["Scala", state.scale]];
        tb.innerHTML = rows.map(([k, v]) => `<dt style="color: var(--md-on-surface-variant)">${k}</dt><dd class="m-0 truncate">${e(v || "—")}</dd>`).join("");
      }
    }

    // --- Dialogo Esporta -----------------------------------------------------------
    let exportKind = "dxf";
    function openExportDialog() {
      closeAllMenus();
      const d = document.getElementById("exportDialog");
      if (!d) return;
      const n = projectSections.length;
      const sub = document.getElementById("expDlgSub");
      if (sub) sub.textContent = `Sezione attiva: ${state.title}`;
      const row = document.getElementById("expAllRow");
      if (row) row.classList.toggle("hidden", n <= 1);
      const lbl = document.getElementById("expAllLabel");
      if (lbl) lbl.textContent = `Tutte le sezioni del progetto (${n} file)`;
      updateExportChoices();
      d.classList.remove("hidden");
    }
    function closeExportDialog() {
      const d = document.getElementById("exportDialog");
      if (d) d.classList.add("hidden");
    }
    function updateExportChoices() {
      document.querySelectorAll("#expChoices [data-exp]").forEach(b => b.setAttribute("aria-checked", String(b.dataset.exp === exportKind)));
      const all = document.getElementById("expAllSections");
      const allowAll = exportKind === "dxf" || exportKind === "scr";
      if (all) { all.disabled = !allowAll; if (!allowAll) all.checked = false; }
    }
    function runExport() {
      const all = document.getElementById("expAllSections");
      const many = all && all.checked && projectSections.length > 1;
      closeExportDialog();
      if (exportKind === "dxf") many ? exportAllSectionsDXF() : exportAutoCADDXF();
      else if (exportKind === "scr") many ? exportAllSectionsAutoLISP() : exportAutoLISPDWG();
      else if (exportKind === "doc") exportWordReport();
      else if (exportKind === "csv") exportCSV();
      if (!many) toast("File scaricato", "ok", null, 2500);
    }

    // --- Messaggi di stato → notifiche -----------------------------------------------
    // Le funzioni esistenti scrivono l'esito in #statusBanner: qui diventa una notifica.
    function initStatusToasts() {
      const banner = document.getElementById("statusBanner");
      if (!banner) return;
      new MutationObserver(() => {
        const text = banner.textContent.replace(/^[✓⚠]\s*/, "").trim();
        if (!text || /in corso|^Caricamento|^Lettura/i.test(text)) return;
        const now = Date.now();
        if (text === lastStatusToast.text && now - lastStatusToast.t < 3000) return;
        lastStatusToast = { text, t: now };
        const cls = banner.className;
        const tone = /red-/.test(cls) ? "error" : /amber-/.test(cls) ? "warn" : /emerald-/.test(cls) ? "ok" : "info";
        toast(text, tone, null, tone === "error" ? 9000 : 4500);
      }).observe(banner, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    }

    function setSaveState(ok) {
      const el = document.getElementById("saveState");
      if (!el) return;
      el.innerHTML = ok
        ? '<svg class="ico ico-s" style="color: var(--md-ok)" aria-hidden="true"><use href="#i-tick"/></svg><span>Salvato</span>'
        : '<svg class="ico ico-s" style="color: var(--md-warn)" aria-hidden="true"><use href="#i-warn"/></svg><span>Non salvato</span>';
      el.title = ok ? "Salvato automaticamente in questo browser" : "Il browser non permette il salvataggio automatico: salva il progetto come file";
    }

    function initUiShell() {
      initSegmented();
      initStatusToasts();
      initHelpToc();

      // Azioni dentro elenchi generati (delegazione)
      document.addEventListener("click", e => {
        const act = e.target.closest("[data-check-action]");
        if (act) { runCheckAction(act.dataset.checkAction, act.dataset.arg); return; }
        if (e.target.closest("[data-open-checks]")) { showPanel("verifiche", true); return; }
        const sec = e.target.closest("[data-section-idx]");
        if (sec) { switchSectionTab(+sec.dataset.sectionIdx); return; }
        const exp = e.target.closest("#expChoices [data-exp]");
        if (exp) { exportKind = exp.dataset.exp; updateExportChoices(); return; }
      });
      // Selezione dalla distinta (clic sulla riga, non sui campi)
      const body = document.getElementById("tblBody");
      if (body) body.addEventListener("click", e => {
        const tr = e.target.closest("tr[data-idx]");
        if (!tr || e.target.closest("button")) return;
        if (!e.target.closest("input")) selectCable(+tr.dataset.idx);
        else if (+tr.dataset.idx !== selectedCableIdx) selectCable(+tr.dataset.idx);
      });
      // Frecce nel gruppo di scelte del dialogo Esporta
      const choices = document.getElementById("expChoices");
      if (choices) choices.addEventListener("keydown", e => {
        if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
        e.preventDefault();
        const items = [...choices.querySelectorAll("[data-exp]")];
        const i = items.findIndex(b => b.dataset.exp === exportKind);
        const next = items[(i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
        exportKind = next.dataset.exp; updateExportChoices(); next.focus();
      });
      // Il foglio si adatta quando cambia lo spazio (pannello aperto/chiuso, distinta)
      const area = document.getElementById("cadDropArea");
      if (area && "ResizeObserver" in window) new ResizeObserver(() => drawScene()).observe(area);
      // Tablet: un tocco sul foglio chiude il pannello aperto sopra
      if (area) area.addEventListener("pointerdown", () => {
        const side = document.getElementById("sidePanel");
        if (window.matchMedia("(max-width: 1279px)").matches && side && !side.classList.contains("collapsed")) {
          side.classList.add("collapsed");
          document.querySelectorAll(".rail-item.active").forEach(b => { b.classList.remove("active"); b.removeAttribute("aria-current"); });
        }
      }, true);

      // Preferenze di vista
      const narrow = window.matchMedia("(max-width: 1279px)").matches;
      const savedPanel = safeStorage.get("canaloCAD_panel");
      showPanel(["sezione", "cavi", "staffaggio", "verifiche", "progetto"].includes(savedPanel) ? savedPanel : "sezione", true);
      if (narrow) {
        // Tablet: il pannello si apre sopra il foglio solo quando serve
        document.getElementById("sidePanel").classList.add("collapsed");
        document.querySelectorAll(".rail-item.active").forEach(b => { b.classList.remove("active"); b.removeAttribute("aria-current"); });
      }
      if (safeStorage.get("canaloCAD_distOpen") === "0") toggleDistinta(false);
      refreshSegmented();
    }

    // --- Guida --------------------------------------------------------------------
    // Filtra gli argomenti che contengono tutte le parole cercate
    function filterHelp(q) {
      const words = String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      document.querySelectorAll("#helpBody [data-help]").forEach(sec => {
        const ok = !words.length || words.every(w => sec.textContent.toLowerCase().includes(w));
        sec.classList.toggle("hidden", !ok);
        const link = document.querySelector(`#helpToc a[href="#${sec.id}"]`);
        if (link) link.classList.toggle("hidden", !ok);
        if (ok) shown++;
      });
      const none = document.getElementById("helpNoResults");
      if (none) none.classList.toggle("hidden", shown > 0);
    }

    // Evidenzia nell'indice l'argomento visibile
    function initHelpToc() {
      const body = document.getElementById("helpBody");
      const toc = document.getElementById("helpToc");
      if (!body || !toc) return;
      let lockTocUntil = 0;
      const mark = () => {
        if (Date.now() < lockTocUntil) return;
        const top = body.getBoundingClientRect().top + 40;
        let cur = null;
        body.querySelectorAll("[data-help]:not(.hidden)").forEach(s => { if (s.getBoundingClientRect().top <= top) cur = s.id; });
        if (!cur) { const first = body.querySelector("[data-help]:not(.hidden)"); cur = first && first.id; }
        toc.querySelectorAll("a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === `#${cur}`));
      };
      body.addEventListener("scroll", () => requestAnimationFrame(mark), { passive: true });
      toc.addEventListener("click", e => {
        const a = e.target.closest("a[href^='#']");
        if (!a) return;
        e.preventDefault();
        const target = document.getElementById(a.getAttribute("href").slice(1));
        toc.querySelectorAll("a").forEach(x => x.classList.toggle("on", x === a));
        if (target) target.scrollIntoView({ block: "start" });
        lockTocUntil = Date.now() + 700; // durante lo scorrimento animato non cambiare voce
      });
      mark();
    }

    // Apre la guida in una finestra pulita (testo nero su bianco) pronta per stampa o PDF
    function printHelp() {
      const body = document.getElementById("helpBody");
      if (!body) return;
      const clone = body.cloneNode(true);
      clone.querySelectorAll(".hidden").forEach(el => el.classList.remove("hidden"));
      clone.querySelector("#helpNoResults")?.remove();
      const w = window.open("", "_blank");
      if (!w) { toast("Il browser ha bloccato la finestra di stampa: consenti i popup per questa pagina.", "warn"); return; }
      w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Guida di CanaloCAD v${APP_VERSION}</title>
        <style>
          body{font:11pt/1.55 Arial,Helvetica,sans-serif;color:#111;margin:18mm 16mm;max-width:180mm}
          h1{font-size:20pt;margin:0 0 4mm} h3{font-size:14pt;margin:8mm 0 2mm;page-break-after:avoid}
          section{page-break-inside:auto} p,li,dd{orphans:3;widows:3}
          table{border-collapse:collapse;width:100%;margin:2mm 0 4mm;font-size:10pt} th,td{border:1px solid #bbb;padding:1.5mm 2mm;text-align:left;vertical-align:top} th{background:#eee}
          kbd{font:600 9pt Consolas,monospace;border:1px solid #999;border-radius:3px;padding:0 1.5mm}
          .note{border-left:3px solid #999;padding:1mm 3mm;color:#333;background:#f4f4f4}
          dt{font-weight:bold;margin-top:3mm} dd{margin:0 0 0 0}
          .st-ok{color:#1b7a36}.st-warn{color:#9a5b00}.st-err{color:#b3261e}.st-info{color:#2a5aa8}
        </style></head><body><h1>Guida di CanaloCAD <small style="font-weight:normal;font-size:11pt">v${APP_VERSION}</small></h1>${clone.innerHTML}</body></html>`);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 300);
    }
