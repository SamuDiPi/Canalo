    // ============================================================================
    // GESTIONE RESPONSIVE MOBILE VIEW SWITCHER & MODALE DATABASE TECNICO
    // ============================================================================
    let currentMobileView = "controls"; // "controls" | "cad" | "results"
    if (typeof window !== "undefined") window.currentMobileView = currentMobileView;
    let currentDbCategory = "all";

    function setMobileView(view) {
      currentMobileView = view;
      if (typeof window !== "undefined") window.currentMobileView = view;
      const isMobile = window.innerWidth < 1024;
      const leftCol = document.getElementById("leftColSection");
      const cadView = document.getElementById("cadViewportContainer");
      const distView = document.getElementById("distintaContainer");
      const kpiBar = document.getElementById("kpiBar");

      const btnControls = document.getElementById("mobTabBtn_controls");
      const btnCad = document.getElementById("mobTabBtn_cad");
      const btnResults = document.getElementById("mobTabBtn_results");

      if (btnControls) btnControls.className = view === "controls" ? "flex-1 py-2 text-center rounded-lg bg-amber-500/20 text-amber-300 font-bold transition" : "flex-1 py-2 text-center rounded-lg text-slate-400 hover:text-white transition";
      if (btnCad) btnCad.className = view === "cad" ? "flex-1 py-2 text-center rounded-lg bg-cyan-500/20 text-cyan-300 font-bold transition" : "flex-1 py-2 text-center rounded-lg text-slate-400 hover:text-white transition";
      if (btnResults) btnResults.className = view === "results" ? "flex-1 py-2 text-center rounded-lg bg-emerald-500/20 text-emerald-300 font-bold transition" : "flex-1 py-2 text-center rounded-lg text-slate-400 hover:text-white transition";

      if (isMobile) {
        if (leftCol) leftCol.classList.toggle("hidden", view !== "controls");
        if (cadView) cadView.classList.toggle("hidden", view !== "cad");
        if (distView) distView.classList.toggle("hidden", view !== "results");
        if (kpiBar) kpiBar.classList.toggle("hidden", view === "controls");
        if (view === "cad") {
          setTimeout(() => { fitAll(); drawScene(); }, 60);
        }
      } else {
        if (leftCol) leftCol.classList.remove("hidden");
        if (cadView) cadView.classList.remove("hidden");
        if (distView) distView.classList.remove("hidden");
        if (kpiBar) kpiBar.classList.remove("hidden");
      }
    }

    function toggleDatabaseModal(forceOpen) {
      const modal = document.getElementById("databaseCatalogModal");
      if (!modal) return;
      if (forceOpen === true) {
        modal.classList.remove("hidden");
        renderDatabaseItems();
        return;
      }
      const isHidden = modal.classList.contains("hidden");
      if (isHidden) {
        modal.classList.remove("hidden");
        renderDatabaseItems();
      } else {
        modal.classList.add("hidden");
      }
    }

    function filterDbCategory(cat) {
      currentDbCategory = cat;
      const categories = ['all', 'bt_uni', 'bt_multi', 'signal', 'fire', 'data', 'trays_supports'];
      categories.forEach(c => {
        const btn = document.getElementById(`dbCatBtn_${c}`);
        if (!btn) return;
        if (c === cat) {
          btn.className = "px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold transition";
        } else {
          btn.className = "px-2.5 py-1 rounded-lg text-slate-300 hover:bg-slate-800 transition";
        }
      });
      renderDatabaseItems();
    }

    function renderDatabaseItems() {
      const searchTxt = (document.getElementById("dbSearchInp").value || "").trim().toLowerCase();
      const cablesTable = document.getElementById("dbCablesTableView");
      const supportsTable = document.getElementById("dbSupportsTableView");
      const tbody = document.getElementById("dbCablesTableBody");

      if (currentDbCategory === "trays_supports") {
        cablesTable.classList.add("hidden");
        supportsTable.classList.remove("hidden");
        renderDbSupportsAndTrays(searchTxt);
        return;
      }

      cablesTable.classList.remove("hidden");
      supportsTable.classList.add("hidden");
      tbody.innerHTML = "";

      let items = CABLE_CATALOG;
      if (currentDbCategory !== "all") {
        items = items.filter(c => c.cat === currentDbCategory);
      }
      if (searchTxt) {
        items = items.filter(c => 
          c.type.toLowerCase().includes(searchTxt) ||
          c.form.toLowerCase().includes(searchTxt) ||
          c.desc.toLowerCase().includes(searchTxt) ||
          (c.std && c.std.toLowerCase().includes(searchTxt))
        );
      }

      const dbCnt = document.getElementById("dbItemsCount");
      if (dbCnt) dbCnt.textContent = items.length;

      items.forEach(c => {
        const isUni = isUnipolarCable(c);
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-800/60 transition";
        const catBadge = c.cat === "bt_uni" ? '<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold">1X UNI</span>'
          : c.cat === "bt_multi" ? '<span class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[11px] font-bold">MULTI</span>'
          : c.cat === "signal" ? '<span class="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[11px] font-bold">SEGN</span>'
          : c.cat === "fire" ? '<span class="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[11px] font-bold">FIRE</span>'
          : '<span class="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-bold">DATI</span>';

        tr.innerHTML = `
          <td class="py-2 px-2">${catBadge}</td>
          <td class="py-2 px-2 font-bold text-white">${c.type}</td>
          <td class="py-2 px-2 text-emerald-300 font-bold">${c.form}</td>
          <td class="py-2 px-2 text-center text-cyan-300 font-bold">${c.d}</td>
          <td class="py-2 px-2 text-center text-slate-300">${c.w.toFixed(2)}</td>
          <td class="py-2 px-2 text-center text-amber-300">${c.sec}</td>
          <td class="py-2 px-2 text-center text-emerald-400 font-bold">${c.iz0} A</td>
          <td class="py-2 px-2 text-center text-purple-300">${Math.round(c.d * c.bendK)}mm</td>
          <td class="py-2 px-2 text-slate-300 font-sans max-w-xs">
            <div>${c.desc}</div>
            <div class="text-[11px] text-slate-400">${c.std || ""}</div>
          </td>
          <td class="py-2 px-2 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <input type="number" min="1" max="24" value="${isUni ? 3 : 1}" id="dbQty_${c.id}" class="w-10 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-center text-white text-[11px] mono">
              ${isUni ? `<label class="flex items-center gap-1 text-[11px] text-amber-300"><input type="checkbox" checked id="dbTrf_${c.id}" class="accent-amber-400">🔺3F</label>` : ''}
              <button type="button" onclick="addCableFromDbRow('${c.id}')" class="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded font-semibold transition text-[11px]">
                + Inserisci
              </button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    }

    function renderDbSupportsAndTrays(searchTxt) {
      const brandContainer = document.getElementById("dbBrandSeriesCards");
      const supContainer = document.getElementById("dbSupportsCards");
      brandContainer.innerHTML = "";
      supContainer.innerHTML = "";

      Object.entries(BRAND_SERIES).forEach(([brand, seriesList]) => {
        seriesList.forEach(ser => {
          if (searchTxt && !ser.name.toLowerCase().includes(searchTxt) && !brand.toLowerCase().includes(searchTxt)) return;
          const card = document.createElement("div");
          card.className = "bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between";
          card.innerHTML = `
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">${brand}</span>
                <span class="text-[11px] text-slate-400 font-mono">${ser.code}</span>
              </div>
              <h5 class="text-xs font-bold text-white mb-1">${ser.name}</h5>
              <div class="text-[11px] text-slate-400">Tipologia: <span class="text-cyan-300 font-semibold">${ser.type === "perforated" ? "Passerella Asolata" : ser.type === "mesh" ? "Passerella a Filo Rete" : "Canale Cieco"}</span></div>
            </div>
            <button type="button" onclick="applyBrandSeriesFromDb('${brand}', '${ser.id}')" class="mt-2.5 w-full py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-semibold text-[11px] transition">
              ✓ Applica a Progetto
            </button>`;
          brandContainer.appendChild(card);
        });
      });

      Object.entries(SUPPORT_SPECS).forEach(([key, spec]) => {
        if (searchTxt && !spec.name.toLowerCase().includes(searchTxt) && !spec.desc.toLowerCase().includes(searchTxt)) return;
        const card = document.createElement("div");
        card.className = "bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between";
        const badgeType = spec.type === "none" ? "NO STAFFAGGIO" : spec.type === "wall" ? "PARETE" : spec.type === "ceiling" ? "SOFFITTO" : "PAVIMENTO";
        const badgeSwl = spec.type === "none" ? "SWL: N/D" : `SWL: ${spec.swl15m} kg @1.5m`;
        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-[11px] mono font-bold px-1.5 py-0.5 rounded ${spec.type === 'none' ? 'bg-slate-800 text-slate-300' : 'bg-cyan-500/20 text-cyan-300'}">${badgeType}</span>
              <span class="text-[11px] text-emerald-400 font-bold mono">${badgeSwl}</span>
            </div>
            <h5 class="text-xs font-bold text-white mb-1">${spec.name}</h5>
            <p class="text-[11px] text-slate-400 mb-2 leading-relaxed">${spec.desc}</p>
            ${spec.type !== 'none' ? `
            <div class="grid grid-cols-4 gap-1 text-[11px] mono text-center bg-slate-900/80 p-1 rounded border border-slate-800 mb-2">
              <div><span class="text-slate-500">1.0m:</span> <span class="text-amber-300">${spec.swl10m}kg</span></div>
              <div><span class="text-slate-500">1.5m:</span> <span class="text-emerald-400 font-bold">${spec.swl15m}kg</span></div>
              <div><span class="text-slate-500">2.0m:</span> <span class="text-cyan-300">${spec.swl20m}kg</span></div>
              <div><span class="text-slate-500">2.5m:</span> <span class="text-purple-300">${spec.swl25m}kg</span></div>
            </div>` : ''}
          </div>
          <button type="button" onclick="applySupportFromDb('${key}')" class="w-full py-1 ${key === 'none' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'} rounded font-semibold text-[11px] transition">
            ✓ Seleziona Supporto
          </button>`;
        supContainer.appendChild(card);
      });
    }

    function addCableFromDbRow(id) {
      const item = CABLE_CATALOG.find(c => c.id === id);
      if (!item) return;
      const qtyInp = document.getElementById(`dbQty_${id}`);
      const qty = Math.max(1, Math.min(30, parseInt(qtyInp ? qtyInp.value : 1, 10) || 1));
      const trfInp = document.getElementById(`dbTrf_${id}`);
      const trefoil = trfInp ? trfInp.checked : false;

      const isUni = isUnipolarCable(item);
      const effectiveQty = (trefoil && isUni && qty === 1) ? 3 : qty;
      const batchId = Date.now();

      for (let q = 0; q < effectiveQty; q++) {
        const idx = state.cables.length + 1;
        const phaseLabels = ["L1", "L2", "L3", "N", "PE"];
        const suffix = trefoil ? phaseLabels[q % 3] : (effectiveQty > 1 ? phaseLabels[q % 5] || `${q + 1}` : "");
        const code = suffix ? `${item.code} - ${suffix}` : item.code;
        const trefoilGroupId = trefoil ? `TRF_${batchId}_${Math.floor(q / 3)}` : null;

        state.cables.push({
          id: idx,
          code,
          d: item.d,
          w: item.w,
          sec: item.sec,
          cores: item.cores,
          iz0: item.iz0,
          ib: 0,
          bendK: item.bendK,
          trefoil,
          trefoilGroupId,
          origX: 20 + ((idx - 1) % 6) * 16,
          origY: item.d / 2 + Math.floor((idx - 1) / 6) * 16,
          x: 20,
          y: item.d / 2,
          desc: item.desc,
          type: item.type,
          form: item.form,
          sys: item.sys
        });
      }

      recalculateAll();
      drawScene();
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = `✓ Inserito a progetto: ${effectiveQty}x ${item.type} ${item.form} (${item.desc})`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
      }
    }

    function applyBrandSeriesFromDb(brand, seriesId) {
      document.getElementById("inpBrand").value = brand;
      populateBrandSeries();
      document.getElementById("inpSeries").value = seriesId;
      state.seriesId = seriesId;
      syncFromUI();
      toggleDatabaseModal();
    }

    function applySupportFromDb(supKey) {
      document.getElementById("inpSupport").value = supKey;
      state.support = supKey;
      syncFromUI();
      toggleDatabaseModal();
    }

    const dropArea = document.getElementById("cadDropArea");
    dropArea.addEventListener("dragover", e => { e.preventDefault(); dropArea.classList.add("border-cyan-400"); });
    dropArea.addEventListener("dragleave", () => dropArea.classList.remove("border-cyan-400"));
    dropArea.addEventListener("drop", e => {
      e.preventDefault();
      dropArea.classList.remove("border-cyan-400");
      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) return;
      if (files[0].name.toLowerCase().endsWith(".pdf")) importPDFFile({ files, value: "" });
      else importCADFile({ files, value: "" });
    });

