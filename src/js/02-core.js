    // ============================================================================
    // 2. INIZIALIZZAZIONE E CONTROLLI INTERFACCIA
    // ============================================================================
    // Compatibilità con i vecchi nomi delle schede: ora i pannelli sono quelli della rail
    function showTab(id) {
      const map = { geom: "sezione", prod: "sezione", staff: "staffaggio", cavi: "cavi" };
      showPanel(map[id] || id, true);
    }

    function populateBrandSeries() {
      const b = document.getElementById("inpBrand").value;
      state.brand = b;
      const list = BRAND_SERIES[b] || BRAND_SERIES.LEGRAND;
      const sel = document.getElementById("inpSeries");
      sel.innerHTML = "";
      list.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id; opt.textContent = s.name;
        sel.appendChild(opt);
      });
      state.seriesId = list[0].id;
      syncFromUI();
    }

    function initCatalogDropdown() {
      const sel = document.getElementById("selCableCatalog");
      if (!sel) return;
      sel.innerHTML = "";
      const categories = [
        { cat: "bt_uni",   label: "⚡ Cavi BT Unipolari (1X) — FG16M16 / FS17" },
        { cat: "bt_multi", label: "🔌 Cavi BT Multipolari — FG16OM16 / H07RN-F" },
        { cat: "signal",   label: "📡 Segnali, Comando & Bus KNX — FG16OH2R16 / LiYCY" },
        { cat: "fire",     label: "🔥 Resistenti al Fuoco PH120 & EVAC — FTG18OM16" },
        { cat: "data",     label: "🌐 Reti Dati LAN & Fibra Ottica — Cat.6A/7 / FO" }
      ];

      categories.forEach(group => {
        const grpEl = document.createElement("optgroup");
        grpEl.label = group.label;
        const items = CABLE_CATALOG.filter(c => c.cat === group.cat);
        items.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c.id;
          opt.textContent = `${c.type} ${c.form} — ${c.desc} (Ø${c.d}mm, Iz0=${c.iz0}A)`;
          grpEl.appendChild(opt);
        });
        sel.appendChild(grpEl);
      });
    }

    function syncFromUI() {
      const getVal = (id, def) => {
        const el = document.getElementById(id);
        return el ? el.value : def;
      };
      const getNum = (id, def) => {
        const v = parseFloat(getVal(id, def));
        return isNaN(v) ? def : v;
      };
      const getChk = (id, def) => {
        const el = document.getElementById(id);
        return el ? el.checked : def;
      };

      const elTitle = document.getElementById("inpTitle");
      if (elTitle) state.title = elTitle.value;
      const elTitleQuick = document.getElementById("inpTitleQuick");
      if (elTitleQuick && document.activeElement === elTitleQuick) {
        state.title = elTitleQuick.value;
        if (elTitle) elTitle.value = state.title;
      }

      state.width = getNum("inpWidth", state.width);
      state.height = getNum("inpHeight", state.height);
      state.thk = getNum("inpThk", state.thk);
      state.lengthM = getNum("inpLength", state.lengthM);
      state.trayType = getVal("inpTrayType", state.trayType);
      state.packing = getVal("inpPacking", state.packing);
      state.planTag = getVal("inpPlanTag", state.planTag);
      state.edgeGuard = getChk("chkEdge", state.edgeGuard);
      state.clamps = getChk("chkClamps", state.clamps);
      state.showIso3D = getChk("chkIso3D", state.showIso3D);
      state.showPlanTag = getChk("chkPlanTag", state.showPlanTag);
      state.brand = getVal("inpBrand", state.brand);
      state.seriesId = getVal("inpSeries", state.seriesId);
      state.material = getVal("inpMaterial", state.material);
      state.cover = getVal("inpCover", state.cover);
      state.septums = parseInt(getVal("inpSeptums", state.septums || 0)) || 0;
      state.earth = getVal("inpEarth", state.earth);
      state.clearance = getNum("inpClearance", state.clearance);
      state.reiCount = getNum("inpRei", state.reiCount);
      state.support = getVal("inpSupport", state.support);
      state.spanM = getNum("inpSpan", state.spanM);
      state.seismic = getVal("inpSeismic", state.seismic);
      state.bends90 = getNum("inpBends", state.bends90);
      state.tees = getNum("inpTees", state.tees);
      state.reducers = getNum("inpReducers", state.reducers);

      const elSpanTxt = document.getElementById("lblSpan");
      if (elSpanTxt) elSpanTxt.textContent = `${state.spanM.toFixed(2)} m (${Math.round(state.spanM * 1000)} mm)`;

      updateSeptumUI();
      recalculateAll(); // ridisegna e sincronizza la scheda (in modo differito)
    }

    function resetProject() {
      state.width = 200;
      state.height = 75;
      state.bends90 = 0;
      state.tees = 0;
      state.reducers = 0;
      state.title = "NUOVA CANALINA 01 - L=200mm H=75mm";
      state.cables = [];
      state.septums = 0;
      state.septumPositions = [];
      state.showIso3D = true;
      state.showLoadChart = true;
      state.showBOM = true;
      state.showCartiglio = true;
      state.showTableDesc = true;
      state.hideTableDesc = false;
      state.layoutMode = "standard";
      state.showCableCallouts = true;
      state.support = "none";
      state.clamps = false;
      state.showPlanTag = false;
      state.pdfLoaded = false;
      pushStateToUI();
      recalculateAll();
      fitAll();
    }

    function swapDimensions() {
      const oldW = state.width;
      state.width = Math.max(50, state.height);
      state.height = Math.min(300, Math.max(35, oldW));
      state.title = state.title.replace(/L=\s*\d+\s*mm/i, `L=${state.width}mm`).replace(/H=\s*\d+\s*mm/i, `H=${state.height}mm`);
      pushStateToUI();
      recalculateAll();
      fitAll();
    }

    // Il tema riguarda solo il foglio CAD (sfondo e colori del disegno), non l'interfaccia
    function toggleTheme() {
      state.theme = state.theme === "dark" ? "light" : "dark";
      applyThemeUI();
      recalculateAll();
    }

    function applyThemeUI() {
      const bTheme = document.getElementById("btnTheme");
      if (bTheme) {
        const lbl = bTheme.querySelector("[data-theme-label]") || bTheme;
        lbl.textContent = state.theme === "dark" ? "Foglio: scuro" : "Foglio: chiaro";
      }
      const cadCanv = document.getElementById("cadCanvas");
      if (cadCanv) {
        cadCanv.classList.toggle("cad-grid-dark", state.theme !== "light");
        cadCanv.classList.toggle("cad-grid-light", state.theme === "light");
      }
    }

    function pushStateToUI() {
      const safeVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      const safeChk = (id, chk) => { const el = document.getElementById(id); if (el) el.checked = chk; };

      safeVal("inpTitle", state.title);
      safeVal("inpTitleQuick", state.title);
      safeVal("exportName", state.title.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, ""));
      safeVal("inpScale", state.scale || "1:1");
      safeVal("selDxfScale", state.scale || "1:1");
      safeVal("cfgScale", state.scale || "1:1");

      // Le option hanno valori "1.0", "1.2"...: String(1) darebbe "1" e lascerebbe la select vuota
      const valTextScale = (+state.textScale || 1.0).toFixed(1);
      safeVal("selTextScale", valTextScale);
      safeVal("optDxfTextScale", valTextScale);
      safeVal("cfgTextScale", valTextScale);

      safeChk("chkExportChart", state.showLoadChart !== false);
      safeChk("menuChkChart", state.showLoadChart !== false);
      safeChk("chkExportBOM", state.showBOM !== false);
      safeChk("menuChkBOM", state.showBOM !== false);
      safeChk("chkExportIso3D", state.showIso3D !== false);
      safeChk("menuChk3D", state.showIso3D !== false);
      safeChk("chkIso3D", state.showIso3D !== false);
      safeChk("chkExportCartiglio", state.showCartiglio !== false);
      safeChk("menuChkCartiglio", state.showCartiglio !== false);
      safeChk("chkExportTableDesc", state.showTableDesc !== false && !state.hideTableDesc);
      safeChk("menuChkTableDesc", state.showTableDesc !== false && !state.hideTableDesc);
      updateLayoutUI();
      updateCableCalloutsUI();

      safeVal("inpWidth", state.width);
      safeVal("inpHeight", state.height);
      safeVal("inpThk", (+state.thk || 1.5).toFixed(1)); // le option sono "1.5", "2.0", "2.5"
      safeVal("inpLength", state.lengthM);
      safeVal("inpTrayType", state.trayType);
      safeVal("inpPacking", state.packing);
      safeVal("inpPlanTag", state.planTag);
      safeChk("chkEdge", state.edgeGuard);
      safeChk("chkClamps", state.clamps);
      safeChk("chkPlanTag", state.showPlanTag);
      safeVal("inpBrand", state.brand);
      safeVal("inpMaterial", state.material);
      safeVal("inpCover", state.cover);
      safeVal("inpSeptums", String(state.septums || 0));

      updateSeptumUI();
      safeVal("inpEarth", state.earth);
      safeVal("inpClearance", String(state.clearance));
      safeVal("inpRei", state.reiCount);
      safeVal("inpSupport", state.support);
      safeVal("inpSpan", state.spanM);
      safeVal("inpSeismic", state.seismic);
      safeVal("inpBends", state.bends90);
      safeVal("inpTees", state.tees);
      safeVal("inpReducers", state.reducers);

      const elClient = document.getElementById("inpClient"); if (elClient) state.tb.client = elClient.value;
      const elDoc = document.getElementById("inpDocCode"); if (elDoc) state.tb.docCode = elDoc.value;
      const elAuthor = document.getElementById("inpAuthor"); if (elAuthor) state.tb.author = elAuthor.value;
      const elScaleRev = document.getElementById("inpScaleRev"); if (elScaleRev) state.tb.scaleRev = elScaleRev.value;
      const elScale = document.getElementById("inpScale"); if (elScale) state.scale = elScale.value || "1:1";

      state.title = state.title.replace(/L=\s*\d+\s*mm/i, `L=${state.width}mm`).replace(/H=\s*\d+\s*mm/i, `H=${state.height}mm`);
      safeVal("inpTitle", state.title);
      const hTitle = document.getElementById("headerTitle"); if (hTitle) hTitle.textContent = state.title;
      document.title = `${state.title} — ${APP_NAME}`;
      const elSpanTxt = document.getElementById("lblSpan"); if (elSpanTxt) elSpanTxt.textContent = `${state.spanM.toFixed(2)} m (${Math.round(state.spanM * 1000)} mm)`;
      const elElec = document.getElementById("kpiElectricalCard"); if (elElec) elElec.classList.toggle("hidden", !state.pdfLoaded);
      applyThemeUI();
      safeVal("exportName", state.title.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, ""));

      recalculateAll();
    }

    function getSeptumXList() {
      const n = state.septums || 0;
      if (n <= 0) {
        state.septumPositions = [];
        return [];
      }
      const W = state.width;
      if (!Array.isArray(state.septumPositions) || state.septumPositions.length !== n) {
        if (n === 1) {
          state.septumPositions = [Math.round(W * 0.6)];
        } else if (n === 2) {
          state.septumPositions = [Math.round(W * 0.34), Math.round(W * 0.68)];
        } else {
          state.septumPositions = [];
          for (let i = 1; i <= n; i++) {
            state.septumPositions.push(Math.round((W * i) / (n + 1)));
          }
        }
      }
      for (let i = 0; i < state.septumPositions.length; i++) {
        const minX = i === 0 ? 15 : state.septumPositions[i - 1] + 15;
        const maxX = i === state.septumPositions.length - 1 ? W - 15 : state.septumPositions[i + 1] - 15;
        if (state.septumPositions[i] < minX) state.septumPositions[i] = minX;
        if (state.septumPositions[i] > maxX) state.septumPositions[i] = maxX;
        state.septumPositions[i] = Math.round(state.septumPositions[i]);
      }
      return state.septumPositions;
    }

    function moveSeptum(idx, targetX) {
      if (idx < 0 || idx >= (state.septums || 0)) return;
      const W = state.width;
      const seps = getSeptumXList();
      const minX = idx === 0 ? 15 : seps[idx - 1] + 15;
      const maxX = idx === seps.length - 1 ? W - 15 : seps[idx + 1] - 15;
      const clampedX = Math.round(Math.max(minX, Math.min(maxX, targetX)));
      state.septumPositions[idx] = clampedX;

      // Mantieni i cavi distanziati dal setto per evitare sovrapposizioni grafiche
      const thkHalf = (state.thk || 1.5) / 2;
      state.cables.forEach(c => {
        if (c.x < 0) return;
        const r = c.d / 2;
        const safeD = r + thkHalf + 0.4;
        if (Math.abs(c.x - clampedX) < safeD) {
          if (c.x < clampedX) c.x = Math.max(r + 0.4, clampedX - safeD);
          else c.x = Math.min(W - r - 0.4, clampedX + safeD);
          c.origX = c.x;
        }
      });

      recalculateAll();
      drawScene();
      updateSeptumUI();
    }

    function updateSeptumUI() {
      const box = document.getElementById("septumPosControls");
      if (!box) return;
      if (!state.septums || state.septums <= 0) {
        box.classList.add("hidden");
        box.innerHTML = "";
        return;
      }
      box.classList.remove("hidden");
      const seps = getSeptumXList();
      const W = state.width;

      const existingInputs = box.querySelectorAll(".septum-range-input");
      if (existingInputs.length === seps.length) {
        seps.forEach((sx, idx) => {
          const rng = document.getElementById(`septumRange_${idx}`);
          const num = document.getElementById(`septumNum_${idx}`);
          const lbl = document.getElementById(`septumDimLabel_${idx}`);
          const minX = idx === 0 ? 15 : seps[idx - 1] + 15;
          const maxX = idx === seps.length - 1 ? W - 15 : seps[idx + 1] - 15;
          const wSx = idx === 0 ? sx : sx - seps[idx - 1];
          const wDx = idx === seps.length - 1 ? W - sx : seps[idx + 1] - sx;

          if (rng) {
            rng.min = minX; rng.max = maxX;
            if (document.activeElement !== rng) rng.value = sx;
          }
          if (num) {
            num.min = minX; num.max = maxX;
            if (document.activeElement !== num) num.value = sx;
          }
          if (lbl) {
            lbl.innerHTML = `SX: <strong class="text-white">${Math.round(wSx)}</strong>mm | DX: <strong class="text-white">${Math.round(wDx)}</strong>mm`;
          }
        });
        return;
      }

      let html = `<div class="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1 flex items-center justify-between">
        <span>Regolazione Posizione Setti (Trascina nel CAD o Regola)</span>
      </div>`;
      seps.forEach((sx, idx) => {
        const minX = idx === 0 ? 15 : seps[idx - 1] + 15;
        const maxX = idx === seps.length - 1 ? W - 15 : seps[idx + 1] - 15;
        const wSx = idx === 0 ? sx : sx - seps[idx - 1];
        const wDx = idx === seps.length - 1 ? W - sx : seps[idx + 1] - sx;
        html += `
          <div class="bg-slate-900/90 p-1.5 rounded border border-slate-800">
            <div class="flex items-center justify-between text-[11px] text-slate-300 mb-1">
              <span class="font-bold text-cyan-300">Setto #${idx + 1}</span>
              <span id="septumDimLabel_${idx}" class="mono text-slate-400">SX: <strong class="text-white">${Math.round(wSx)}</strong>mm | DX: <strong class="text-white">${Math.round(wDx)}</strong>mm</span>
            </div>
            <div class="flex items-center gap-1.5">
              <input type="range" id="septumRange_${idx}" class="septum-range-input flex-1 accent-cyan-400 h-1.5 bg-slate-700 rounded cursor-pointer" min="${minX}" max="${maxX}" value="${sx}" oninput="moveSeptum(${idx}, parseFloat(this.value))">
              <input type="number" id="septumNum_${idx}" class="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] mono text-cyan-300 text-center font-bold" min="${minX}" max="${maxX}" value="${sx}" oninput="moveSeptum(${idx}, parseFloat(this.value))">
              <span class="text-[11px] text-slate-400">mm</span>
            </div>
          </div>
        `;
      });
      box.innerHTML = html;
    }

    function isSpotFree(cable, x, y) {
      const W = state.width, H = state.height, r = cable.d / 2;
      if (x < r + 0.3 || x > W - r - 0.3) return false;
      if (y < r - 0.1 || y > H - r - 0.3) return false;

      for (const sx of getSeptumXList()) {
        if (Math.abs(x - sx) < r + state.thk / 2 + 0.3) return false;
      }

      for (const other of state.cables) {
        if (other === cable || other.x < 0) continue;
        if (Math.hypot(x - other.x, y - other.y) < r + other.d / 2 + 0.2) return false;
      }
      return true;
    }

    function resolveNonOverlappingPosition(dragCable, targetX, targetY) {
      const W = state.width, H = state.height, r = dragCable.d / 2;
      const clampedX = Math.max(r + 0.4, Math.min(W - r - 0.4, targetX));
      const clampedY = Math.max(r, Math.min(H - r - 0.4, targetY));

      if (isSpotFree(dragCable, clampedX, clampedY)) {
        return { x: +(clampedX.toFixed(1)), y: +(clampedY.toFixed(1)) };
      }

      const startX = dragCable.x, startY = dragCable.y;
      const dx = clampedX - startX, dy = clampedY - startY;
      const dist = Math.hypot(dx, dy);
      let bestX = startX, bestY = startY;

      if (dist > 0.05) {
        const steps = Math.min(70, Math.ceil(dist / 0.25));
        for (let s = 1; s <= steps; s++) {
          const tx = startX + (dx * s) / steps;
          const ty = startY + (dy * s) / steps;
          if (isSpotFree(dragCable, tx, ty)) {
            bestX = tx; bestY = ty;
          } else {
            break;
          }
        }
      }
      return { x: +(bestX.toFixed(1)), y: +(bestY.toFixed(1)) };
    }

    function findFreePositionNear(cable, targetX, targetY) {
      const W = state.width, H = state.height, r = cable.d / 2;
      const defX = Number.isFinite(targetX) ? targetX : (Number.isFinite(cable.x) && cable.x >= 0 ? cable.x : W / 2);
      const defY = Number.isFinite(targetY) ? targetY : (Number.isFinite(cable.y) && cable.y >= 0 ? cable.y : r + 1);
      const cx = Math.max(r + 0.4, Math.min(W - r - 0.4, defX));
      const cy = Math.max(r, Math.min(H - r - 0.4, defY));
      if (isSpotFree(cable, cx, cy)) return { x: +(cx.toFixed(1)), y: +(cy.toFixed(1)) };

      for (let rad = 0.8; rad <= Math.max(W, H); rad += 0.8) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
          const tx = cx + Math.cos(a) * rad;
          const ty = cy + Math.sin(a) * rad;
          if (isSpotFree(cable, tx, ty)) return { x: +(tx.toFixed(1)), y: +(ty.toFixed(1)) };
        }
      }
      return { x: +(cx.toFixed(1)), y: +(cy.toFixed(1)) };
    }

    function packByGravity(list, xMin, xMax) {
      const placed = [];
      const trefoilBuckets = {};
      const singleCables = [];
      list.forEach(c => {
        if (c.trefoil && c.trefoilGroupId) {
          if (!trefoilBuckets[c.trefoilGroupId]) trefoilBuckets[c.trefoilGroupId] = [];
          trefoilBuckets[c.trefoilGroupId].push(c);
        } else {
          singleCables.push(c);
        }
      });

      const packUnits = [];
      Object.entries(trefoilBuckets).forEach(([gid, group]) => {
        if (group.length === 3) {
          const d0 = group[0].d;
          packUnits.push({ isTrefoil: true, d: d0 * 2.02, baseD: d0, members: group });
        } else {
          group.forEach(c => packUnits.push({ isTrefoil: false, d: c.d, cable: c }));
        }
      });
      singleCables.forEach(c => packUnits.push({ isTrefoil: false, d: c.d, cable: c }));

      const sorted = packUnits.sort((a, b) => b.d - a.d);
      sorted.forEach(u => {
        if (u.isTrefoil) {
          const r = u.baseD / 2;
          const spanX = 2 * r;
          const startX = xMin + spanX + 0.6;
          const endX = Math.max(startX, xMax - spanX - 0.6);
          let bestX = startX, bestY = r, bestScore = 1e9;
          for (let tx = startX; tx <= endX; tx += 0.6) {
            let ty = r;
            const testCenters = [
              { dx: -r, dy: 0, r },
              { dx: +r, dy: 0, r },
              { dx: 0,  dy: r * 1.73205, r }
            ];
            for (const p of placed) {
              for (const tc of testCenters) {
                const distX = Math.abs((tx + tc.dx) - p.x);
                const minD = tc.r + p.d / 2 + 0.35;
                if (distX < minD) {
                  const reqBaseY = p.y + Math.sqrt(minD * minD - distX * distX) - tc.dy;
                  if (reqBaseY > ty) ty = reqBaseY;
                }
              }
            }
            const score = ty * 100 + tx;
            if (score < bestScore) { bestScore = score; bestX = tx; bestY = ty; }
          }
          const c0 = u.members[0], c1 = u.members[1], c2 = u.members[2];
          c0.x = +((bestX - r).toFixed(1)); c0.y = +(bestY.toFixed(1));
          c1.x = +((bestX + r).toFixed(1)); c1.y = +(bestY.toFixed(1));
          c2.x = +(bestX.toFixed(1));       c2.y = +((bestY + r * 1.73205).toFixed(1));
          placed.push(c0, c1, c2);
        } else {
          const c = u.cable;
          const r = c.d / 2;
          const startX = xMin + r + 0.5;
          const endX = Math.max(startX, xMax - r - 0.5);
          let bestX = startX, bestY = r, bestScore = 1e9;
          for (let tx = startX; tx <= endX; tx += 0.6) {
            let ty = r;
            for (const p of placed) {
              const dx = Math.abs(tx - p.x);
              const minD = r + p.d / 2 + 0.4;
              if (dx < minD) ty = Math.max(ty, p.y + Math.sqrt(minD * minD - dx * dx));
            }
            const score = ty * 100 + tx;
            if (score < bestScore) { bestScore = score; bestX = tx; bestY = ty; }
          }
          c.x = +(bestX.toFixed(1));
          c.y = +(bestY.toFixed(1));
          placed.push(c);
        }
      });
    }

    function recalculateAll() {
      const W = state.width, H = state.height;
      if (state.packing === "input") {
        state.cables.forEach(c => { c.x = -999; c.y = -999; });
        state.cables.forEach(c => {
          const pos = findFreePositionNear(c, c.origX, c.origY);
          c.x = pos.x; c.y = pos.y;
        });
      } else {
        const seps = getSeptumXList();
        const hasSpecialElv = state.cables.some(c => c.sys === "SPECIAL_ELV");
        const tHalf = (state.thk || 1.5) / 2;
        if (seps.length === 0) {
          packByGravity(state.cables, 0, W);
        } else if (hasSpecialElv) {
          if (seps.length === 1) {
            packByGravity(state.cables.filter(c => c.sys !== "SPECIAL_ELV"), 0, seps[0] - tHalf);
            packByGravity(state.cables.filter(c => c.sys === "SPECIAL_ELV"), seps[0] + tHalf, W);
          } else {
            packByGravity(state.cables.filter(c => c.sys === "BT_POWER"), 0, seps[0] - tHalf);
            packByGravity(state.cables.filter(c => c.sys === "BT_FIRE"), seps[0] + tHalf, seps[1] - tHalf);
            packByGravity(state.cables.filter(c => c.sys === "SPECIAL_ELV"), seps[1] + tHalf, W);
          }
        } else {
          // Presenza di setti con soli cavi BT: rispetta la segregazione fisica dei setti
          if (seps.length === 1) {
            const leftCables = state.cables.filter(c => c.x >= 0 && c.x < seps[0]);
            const rightCables = state.cables.filter(c => c.x >= seps[0]);
            if (leftCables.length === 0 && rightCables.length === 0) {
              packByGravity(state.cables, 0, seps[0] - tHalf);
            } else {
              packByGravity(leftCables, 0, seps[0] - tHalf);
              packByGravity(rightCables, seps[0] + tHalf, W);
            }
          } else {
            const c1 = state.cables.filter(c => c.x >= 0 && c.x < seps[0]);
            const c2 = state.cables.filter(c => c.x >= seps[0] && c.x < seps[1]);
            const c3 = state.cables.filter(c => c.x >= seps[1]);
            if (c1.length === 0 && c2.length === 0 && c3.length === 0) {
              packByGravity(state.cables, 0, seps[0] - tHalf);
            } else {
              packByGravity(c1, 0, seps[0] - tHalf);
              packByGravity(c2, seps[0] + tHalf, seps[1] - tHalf);
              packByGravity(c3, seps[1] + tHalf, W);
            }
          }
        }
      }

      const trayArea = W * H;
      let usedArea = 0, cablesKgM = 0, cuArea = 0, maxBendR = 0, critCode = "-", jouleWm = 0, maxDv = 0;

      // Rilevamento automatico degli strati verticali (CEI UNEL 35024/1)
      const yLayers = [];
      state.cables.forEach(c => {
        if (!yLayers.some(yl => Math.abs(yl - c.y) < c.d * 0.72)) yLayers.push(c.y);
      });
      const nLayers = Math.max(1, yLayers.length);
      const nCirc = state.cables.length;
      const kFascio = nCirc <= 1 ? 1.0 : nCirc <= 2 ? 0.85 : nCirc <= 3 ? 0.79 : nCirc <= 6 ? 0.75 : nCirc <= 9 ? 0.72 : 0.68;
      const kStrati = nLayers === 1 ? 1.0 : nLayers === 2 ? 0.80 : 0.73;
      const kPosa = (state.trayType === "solid" && state.cover !== "none") ? 0.85
                  : (state.cover === "snap" || state.cover === "clamped") ? 0.90
                  : (state.trayType === "mesh" || state.trayType === "ladder") ? 1.00 : 0.96;
      const kr = +(kFascio * kStrati * kPosa).toFixed(2);

      let deratingFailCode = null;
      state.cables.forEach(c => {
        usedArea += Math.PI * Math.pow(c.d / 2, 2);
        cablesKgM += c.w;
        cuArea += (c.sec || 2.5) * (c.cores || 2);
        const rMin = Math.round(c.d * (c.bendK || 10));
        if (rMin > maxBendR) { maxBendR = rMin; critCode = c.code; }
        if (state.pdfLoaded && c.ib > 0) {
          const pj = (c.cores || 2) * (0.0214 / Math.max(0.5, c.sec || 2.5)) * Math.pow(c.ib, 2);
          jouleWm += pj;
          const kP = c.cores === 3 ? 1.732 : 2.0;
          const vN = c.cores === 3 ? 400 : 230;
          const dv = ((kP * state.lengthM * c.ib * (0.0214 / Math.max(0.5, c.sec || 2.5)) * 0.9) / vN) * 100;
          if (dv > maxDv) maxDv = dv;
          if ((c.iz0 || 27) * kr < c.ib && !deratingFailCode) deratingFailCode = c.code;
        }
      });

      // Verifica Segregazione Normativa CEI 64-8 Art. 528.1 per ciascuno scomparto
      const sepBounds = [0, ...getSeptumXList(), W];
      let segConform = true;
      let segDetail = `Art. 528.1 OK (Kr=${kr} su ${nLayers} str.)`;
      const hasAnySignal = state.cables.some(c => c.sys === "SPECIAL_ELV");

      if (!hasAnySignal) {
        segConform = true;
        segDetail = `Solo Cavi BT Potenza (Kr=${kr} su ${nLayers} str.)`;
      } else {
        for (let sIdx = 0; sIdx < sepBounds.length - 1; sIdx++) {
          const x0 = sepBounds[sIdx], x1 = sepBounds[sIdx + 1];
          const compCables = state.cables.filter(c => c.x >= x0 - 0.5 && c.x <= x1 + 0.5);
          const hasPower = compCables.some(c => c.sys === "BT_POWER" || c.sys === "BT_FIRE");
          const unshieldedElv = compCables.filter(c => c.sys === "SPECIAL_ELV" && !/FTG18|FG16|0,6\/1|1kV|C-4|SCHERM|OH2/i.test(c.type));
          if (hasPower && unshieldedElv.length > 0) {
            segConform = false;
            segDetail = `Conflitto ${unshieldedElv[0].code}: inserire Setto!`;
            break;
          }
        }
      }

      const fillPct = trayArea > 0 ? +((usedArea / trayArea) * 100).toFixed(1) : 0;
      const sparePct = +(Math.max(0, 100 - fillPct)).toFixed(1);
      const unfolded = W + 2 * H + 16 + (state.cover !== "none" ? W + 20 : 0);
      const trayKgM = +(unfolded * state.thk * 0.00785 * (state.trayType === "perforated" ? 0.85 : 1.0)).toFixed(2);
      const totalKgM = +(cablesKgM + trayKgM).toFixed(2);

      const hasSupport = state.support && state.support !== "none";
      const supSpec = SUPPORT_SPECS[state.support] || SUPPORT_SPECS.none;
      const qMaxKgM = hasSupport ? calcAllowedLinearLoadKgM(state.support, state.spanM) : 999;
      const pointLoad = +(totalKgM * state.spanM).toFixed(1);
      const maxPoint = hasSupport ? Math.round(qMaxKgM * state.spanM) : 0;
      const loadPct = hasSupport && qMaxKgM > 0 ? +((totalKgM / qMaxKgM) * 100).toFixed(1) : 0;
      const maxDeflectionMm = +Math.min(10.0, (state.spanM * 1000) / 200).toFixed(1);
      const deflectionMm = hasSupport ? calcElasticDeflectionMm(totalKgM, state.support, state.spanM) : 0;

      const pullDaN = +(cablesKgM * state.lengthM * 0.35 * Math.exp(0.35 * state.bends90 * (Math.PI / 2))).toFixed(1);
      const maxPullDaN = Math.round(Math.max(15, cuArea * 5.0));
      const fitR = maxBendR <= 150 ? 150 : maxBendR <= 300 ? 300 : 600;

      const nVerghe = Math.ceil(state.lengthM / 3);
      const nStaffe = Math.ceil(state.lengthM / state.spanM) + 1;
      const serList = BRAND_SERIES[state.brand] || BRAND_SERIES.LEGRAND;
      const serObj = serList.find(s => s.id === state.seriesId) || serList[0];
      const pCode = serObj.code;

      const freeAreaCm2 = Math.max(0, Math.round((trayArea - usedArea) / 100));
      const nSacchettiRei = Math.max(2, Math.ceil(freeAreaCm2 / 35)) * state.reiCount;

      const bom = [
        { code: `${pCode}-${W}x${H}`, desc: `${serObj.name} L=${W}xH=${H}mm sp.${state.thk}mm`, qty: nVerghe * 3, um: "m", note: `${nVerghe} verghe da 3m` },
        ...(state.cover !== "none" ? [{ code: `${pCode}-COP-${W}`, desc: `Coperchio superiore (${state.cover}) L=${W}mm`, qty: nVerghe * 3, um: "m", note: "Inclusi fermacoperchi" }] : []),
        ...(state.septums > 0 ? [{ code: `${pCode}-SET-H${H}`, desc: `Setto separatore longitudinale H=${H}mm (${state.septums} file)`, qty: nVerghe * 3 * state.septums, um: "m", note: "Segregazione CEI 64-8" }] : []),
        { code: `${pCode}-GIU-M6`, desc: `Kit giunzione lineare rinforzata con bulloneria M6`, qty: nVerghe, um: "cad", note: "1 ogni 3m" },
        ...(hasSupport ? [{ code: `${pCode}-STF-${W}`, desc: `${supSpec.name} L=${W + 50}mm (Passo Ls=${state.spanM}m)`, qty: nStaffe, um: "cad", note: `Inclusi ${nStaffe * 2} tasselli M10` }] : []),
        ...(state.bends90 > 0 ? [{ code: `${pCode}-CRV90-${W}-R${fitR}`, desc: `Curva piana 90° L=${W}mm H=${H}mm (R_acc=${fitR}mm >= R_min=${maxBendR}mm)`, qty: state.bends90, um: "cad", note: `Cavo critico: ${critCode}` }] : []),
        ...(state.tees > 0 ? [{ code: `${pCode}-DEVT-${W}`, desc: `Deviazione piana a T L=${W}mm H=${H}mm completa di giunti`, qty: state.tees, um: "cad", note: "Raggio R=" + fitR + "mm" }] : []),
        ...(state.reducers > 0 ? [{ code: `${pCode}-RID-${W}`, desc: `Riduzione simmetrica/asimmetrica di larghezza L=${W}mm`, qty: state.reducers, um: "cad", note: "Acciaio zincato" }] : []),
        ...(state.seismic !== "none" ? [{ code: `${pCode}-SISM-${state.seismic.toUpperCase()}`, desc: `Kit controvento antisismico NTC 2018 (${state.seismic === "cable_9m" ? "Funi 45° ogni 9m" : "Strut rigido 45° ogni 6m"})`, qty: Math.max(1, Math.ceil(state.lengthM / (state.seismic === "cable_9m" ? 9 : 6))), um: "kit", note: "Rif. NTC 2018" }] : []),
        ...(state.reiCount > 0 ? [{ code: `FIRE-EI120-${W}x${H}`, desc: `Barriera tagliafuoco intumescente EI120 (cuscini + mastice endotermico per ${freeAreaCm2} cm² netti/varco)`, qty: state.reiCount, um: "varco", note: `${nSacchettiRei} cuscini intumescenti tot.` }] : []),
        ...(state.earth !== "none" ? [{ code: `${pCode}-PE-16`, desc: `Morsetto equipotenziale + capocorda M6 + conduttore PE (${state.earth.toUpperCase()})`, qty: Math.ceil(state.lengthM / 12) + 1, um: "cad", note: "1 ogni 12m" }] : [])
      ];

      metrics = {
        fillPct, sparePct, kr, nLayers, kFascio, kStrati, kPosa, segConform, segDetail,
        totalKgM, qMaxKgM, pointLoad, maxPoint, loadPct,
        deflectionMm, maxDeflectionMm,
        pullDaN, maxPullDaN, maxBendR, critCode, fitR,
        jouleWm: +jouleWm.toFixed(1), maxDv: +maxDv.toFixed(2), bom,
        deratingFailCode
      };
      state.metrics = metrics;
      if (typeof window !== "undefined") window.metrics = metrics;

      const safeSetText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      safeSetText("kpiAreaUsed", Math.round(usedArea));
      safeSetText("kpiAreaTot", Math.round(trayArea));
      safeSetText("kpiFill", `${fillPct}%`);
      safeSetText("kpiSpare", `Riserva +${sparePct}%`);
      safeSetText("kpiLoadPct", `${loadPct}%`);
      safeSetText("kpiSpan", `${state.spanM.toFixed(2)}m`);
      const kpiLoadEl = document.getElementById("kpiLoadTxt");
      if (kpiLoadEl) {
        if (!hasSupport) {
          kpiLoadEl.textContent = "No Staffaggio";
          kpiLoadEl.className = "text-[11px] text-slate-400";
          safeSetText("kpiLoadPct", "N/D");
        } else {
          kpiLoadEl.textContent = loadPct <= 100 ? `${pointLoad} kg / ${maxPoint} kg OK` : `SOVRACCARICO (${pointLoad}/${maxPoint} kg)!`;
          kpiLoadEl.className = loadPct <= 100 ? "text-[11px] text-emerald-400" : "text-[11px] text-red-400 font-bold";
        }
      }
      safeSetText("kpiPull", pullDaN);
      safeSetText("kpiBendR", maxBendR);
      const pullOk = pullDaN <= maxPullDaN;
      const pullTxtEl = document.getElementById("kpiPullTxt");
      if (pullTxtEl) {
        pullTxtEl.textContent = pullOk
          ? `Tiro OK (<= ${maxPullDaN} daN) | R_acc=${fitR}mm`
          : `TIRO ECCESSIVO (> ${maxPullDaN} daN)!`;
        pullTxtEl.className = pullOk ? "text-[11px] text-emerald-400" : "text-[11px] text-red-400 font-bold";
      }
      safeSetText("kpiReiTxt", state.reiCount > 0 ? `${state.reiCount} Varchi EI120 (${nSacchettiRei} cuscini)` : "0 Varchi EI120");
      const seisTxtEl = document.getElementById("kpiSeisTxt");
      if (seisTxtEl) {
        seisTxtEl.textContent = state.seismic === "none" ? "NTC 2018: Standard" : `NTC 2018: ${ Math.max(1, Math.ceil(state.lengthM / (state.seismic === "cable_9m" ? 9 : 6))) } Kit Sismici`;
        seisTxtEl.className = state.seismic === "none" ? "text-[11px] text-slate-500" : "text-[11px] text-amber-300 font-semibold";
      }

      if (state.pdfLoaded) {
        safeSetText("kpiJoule", metrics.jouleWm);
        safeSetText("kpiDv", `${metrics.maxDv}%`);
        const deratEl = document.getElementById("kpiDeratTxt");
        if (deratEl) {
          deratEl.textContent = deratingFailCode ? `ATTENZIONE: Iz' < Ib su ${deratingFailCode} (Kr=${kr})` : `Kr=${kr} (${nLayers} str.) • Iz'=Iz·Kr >= Ib OK`;
          deratEl.className = deratingFailCode ? "text-[11px] text-red-400 font-bold" : "text-[11px] text-emerald-400";
        }
      }

      const segCard = document.getElementById("kpiSegCard");
      const segTitle = document.getElementById("kpiSegTitle");
      if (segCard && segTitle) {
        const segSub = (typeof segCard.querySelector === "function") ? segCard.querySelector("div:last-child") : null;
        if (segConform) {
          segCard.className = "bg-slate-900 border border-emerald-500/40 rounded-xl p-2.5";
          segTitle.textContent = "CONFORME";
          segTitle.className = "text-xs font-bold text-emerald-400 mt-0.5";
          if (segSub) segSub.textContent = segDetail;
        } else {
          segCard.className = "bg-red-950/30 border border-red-500/60 rounded-xl p-2.5";
          segTitle.textContent = "NON CONFORME (528.1)";
          segTitle.className = "text-xs font-bold text-red-400 mt-0.5 animate-pulse";
          if (segSub) segSub.textContent = segDetail;
        }
      }

      // Tabella, grafico e scena vengono ridisegnati al prossimo frame (più chiamate ravvicinate = 1 solo render);
      // la copia nella scheda, il salvataggio automatico e la cronologia Annulla sono differiti.
      requestRender({ table: true, chart: true, scene: true });
      scheduleSectionSync();
    }

