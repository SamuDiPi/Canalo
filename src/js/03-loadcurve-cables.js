    // ============================================================================
    // 4. WIDGET INTERATTIVO DEDICATO CURVA DI CARICO & FRECCIA (CEI EN 61537)
    // ============================================================================
    const lcCanvas = document.getElementById("loadCurveCanvas");
    const lcCtx = lcCanvas.getContext("2d");
    let isDraggingSpanOnChart = false;
    // Coordinate logiche del grafico (380x175): il buffer reale viene scalato su larghezza CSS x devicePixelRatio
    const LC_W = 380, LC_H = 175;

    function drawInteractiveLoadCurveWidget() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = lcCanvas.clientWidth || LC_W;
      const bw = Math.round(cssW * dpr), bh = Math.round(cssW * dpr * LC_H / LC_W);
      if (lcCanvas.width !== bw || lcCanvas.height !== bh) { lcCanvas.width = bw; lcCanvas.height = bh; }
      lcCtx.setTransform(bw / LC_W, 0, 0, bh / LC_H, 0, 0);
      // Il grafico funziona anche da slider: valore corrente per tastiera e screen reader
      lcCanvas.setAttribute("aria-valuemin", "1");
      lcCanvas.setAttribute("aria-valuemax", "3");
      lcCanvas.setAttribute("aria-valuenow", String(state.spanM));
      lcCanvas.setAttribute("aria-valuetext", `${String(state.spanM.toFixed(2)).replace(".", ",")} metri`);
      const w = LC_W, h = LC_H;
      lcCtx.clearRect(0, 0, w, h);

      if (state.support === "none") {
        lcCtx.fillStyle = "#64748b";
        lcCtx.font = "11px 'JetBrains Mono', monospace";
        lcCtx.textAlign = "center";
        lcCtx.fillText("Staffaggio escluso (No Staffaggio)", w / 2, h / 2 - 6);
        lcCtx.font = "10px 'JetBrains Mono', monospace";
        lcCtx.fillStyle = "#475569";
        lcCtx.fillText("Seleziona una mensola o pendino per calcolare la curva SWL", w / 2, h / 2 + 10);
        return;
      }

      const padL = 38, padR = 36, padT = 18, padB = 26;
      const gw = w - padL - padR, gh = h - padT - padB;

      const qAt1m = calcAllowedLinearLoadKgM(state.support, 1.0);
      const maxScaleY = Math.max(25, Math.ceil(Math.max(qAt1m, metrics.totalKgM * 1.3) / 10) * 10);

      lcCtx.lineWidth = 1;
      lcCtx.font = "10px 'JetBrains Mono', monospace";
      for (let i = 0; i <= 4; i++) {
        const frac = i / 4;
        const y = padT + gh - frac * gh;
        lcCtx.strokeStyle = "#1e293b";
        lcCtx.beginPath(); lcCtx.moveTo(padL, y); lcCtx.lineTo(padL + gw, y); lcCtx.stroke();
        lcCtx.fillStyle = "#94a3b8";
        lcCtx.textAlign = "right";
        lcCtx.fillText(`${Math.round(frac * maxScaleY)}`, padL - 5, y + 3);
      }

      const spans = [1.0, 1.5, 2.0, 2.5, 3.0];
      spans.forEach(s => {
        const x = padL + ((s - 1.0) / 2.0) * gw;
        lcCtx.strokeStyle = "#1e293b";
        lcCtx.beginPath(); lcCtx.moveTo(x, padT); lcCtx.lineTo(x, padT + gh); lcCtx.stroke();
        lcCtx.fillStyle = "#94a3b8";
        lcCtx.textAlign = "center";
        lcCtx.fillText(`${s.toFixed(1)}m`, x, padT + gh + 14);
      });

      lcCtx.beginPath();
      lcCtx.moveTo(padL, padT + gh);
      for (let s = 1.0; s <= 3.001; s += 0.05) {
        const x = padL + ((s - 1.0) / 2.0) * gw;
        const q = Math.min(maxScaleY, calcAllowedLinearLoadKgM(state.support, s));
        const y = padT + gh - (q / maxScaleY) * gh;
        lcCtx.lineTo(x, y);
      }
      lcCtx.lineTo(padL + gw, padT + gh);
      lcCtx.closePath();
      lcCtx.fillStyle = "rgba(34, 197, 94, 0.12)";
      lcCtx.fill();

      lcCtx.beginPath();
      for (let s = 1.0; s <= 3.001; s += 0.05) {
        const x = padL + ((s - 1.0) / 2.0) * gw;
        const q = Math.min(maxScaleY, calcAllowedLinearLoadKgM(state.support, s));
        const y = padT + gh - (q / maxScaleY) * gh;
        if (s === 1.0) lcCtx.moveTo(x, y); else lcCtx.lineTo(x, y);
      }
      lcCtx.strokeStyle = "#22c55e";
      lcCtx.lineWidth = 2.2;
      lcCtx.stroke();

      lcCtx.beginPath();
      lcCtx.setLineDash([4, 3]);
      for (let s = 1.0; s <= 3.001; s += 0.05) {
        const x = padL + ((s - 1.0) / 2.0) * gw;
        const defl = calcElasticDeflectionMm(metrics.totalKgM, state.support, s);
        const y = padT + gh - Math.min(1.0, defl / 10.0) * gh;
        if (s === 1.0) lcCtx.moveTo(x, y); else lcCtx.lineTo(x, y);
      }
      lcCtx.strokeStyle = "#38bdf8";
      lcCtx.lineWidth = 1.5;
      lcCtx.stroke();
      lcCtx.setLineDash([]);

      lcCtx.fillStyle = "#38bdf8";
      lcCtx.textAlign = "left";
      lcCtx.fillText("10mm", padL + gw + 4, padT + 4);
      lcCtx.fillText("5mm", padL + gw + 4, padT + gh * 0.5 + 3);
      lcCtx.fillText("0mm", padL + gw + 4, padT + gh + 3);

      const yWork = padT + gh - Math.min(1.0, metrics.totalKgM / maxScaleY) * gh;
      lcCtx.strokeStyle = "rgba(251, 191, 36, 0.45)";
      lcCtx.lineWidth = 1.2;
      lcCtx.beginPath(); lcCtx.moveTo(padL, yWork); lcCtx.lineTo(padL + gw, yWork); lcCtx.stroke();

      const xWork = padL + ((state.spanM - 1.0) / 2.0) * gw;
      const yLim = padT + gh - Math.min(1.0, metrics.qMaxKgM / maxScaleY) * gh;
      const isOk = metrics.totalKgM <= metrics.qMaxKgM;

      lcCtx.strokeStyle = "#f59e0b";
      lcCtx.lineWidth = 1.4;
      lcCtx.beginPath(); lcCtx.moveTo(xWork, padT); lcCtx.lineTo(xWork, padT + gh); lcCtx.stroke();

      lcCtx.beginPath(); lcCtx.arc(xWork, yLim, 4, 0, Math.PI * 2);
      lcCtx.fillStyle = "#22c55e"; lcCtx.fill();

      lcCtx.beginPath(); lcCtx.arc(xWork, yWork, 5.5, 0, Math.PI * 2);
      lcCtx.fillStyle = isOk ? "#fbbf24" : "#ef4444";
      lcCtx.fill();
      lcCtx.strokeStyle = "#0f172a"; lcCtx.lineWidth = 1.5; lcCtx.stroke();

      const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setEl("lblChartQtot", `${metrics.totalKgM} kg/m`);
      setEl("lblChartQamm", `${metrics.qMaxKgM} kg/m`);
      setEl("lblChartDefl", `${metrics.deflectionMm} / ${metrics.maxDeflectionMm} mm`);

      const badge = document.getElementById("curveStatusBadge");
      if (badge) {
        if (isOk) {
          badge.textContent = `OK (${metrics.loadPct}%)`;
          badge.className = "text-[11px] mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold";
        } else {
          badge.textContent = `SOVRACCARICO (${metrics.loadPct}%)`;
          badge.className = "text-[11px] mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold";
        }
      }
    }

    function setSpanM(v) {
      state.spanM = Math.round(Math.max(1, Math.min(3, v)) * 20) / 20; // passo 0.05 m, come lo slider
      const inpSpanEl = document.getElementById("inpSpan"); if (inpSpanEl) inpSpanEl.value = state.spanM;
      const lblSpanEl = document.getElementById("lblSpan"); if (lblSpanEl) lblSpanEl.textContent = `${state.spanM.toFixed(2)} m (${Math.round(state.spanM * 1000)} mm)`;
      recalculateAll();
    }

    function updateSpanFromChartMouse(e) {
      const rect = lcCanvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * LC_W;
      const padL = 38, padR = 36;
      const gw = LC_W - padL - padR;
      const frac = Math.max(0, Math.min(1, (mx - padL) / gw));
      setSpanM(1.0 + frac * 2.0);
    }

    // Pointer Events: stesso codice per mouse, penna e touch
    lcCanvas.style.touchAction = "none";
    lcCanvas.addEventListener("pointerdown", (e) => {
      isDraggingSpanOnChart = true;
      try { lcCanvas.setPointerCapture(e.pointerId); } catch (err) {}
      updateSpanFromChartMouse(e);
    });
    lcCanvas.addEventListener("pointermove", (e) => { if (isDraggingSpanOnChart) updateSpanFromChartMouse(e); });
    const endChartDrag = () => { isDraggingSpanOnChart = false; };
    lcCanvas.addEventListener("pointerup", endChartDrag);
    lcCanvas.addEventListener("pointercancel", endChartDrag);
    // Tastiera: frecce per variare il passo quando il grafico ha il focus
    lcCanvas.tabIndex = 0;
    lcCanvas.setAttribute("role", "slider");
    lcCanvas.setAttribute("aria-label", "Passo staffaggio Ls (metri)");
    lcCanvas.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setSpanM(state.spanM + 0.05); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setSpanM(state.spanM - 0.05); }
    });

    function addCableFromPortfolio() {
      const id = document.getElementById("selCableCatalog").value;
      const qty = Math.max(1, Math.min(30, parseInt(document.getElementById("inpCableQty").value, 10) || 1));
      const customCode = document.getElementById("inpCableCode").value.trim();
      const trefoil = document.getElementById("chkTrefoil").checked;
      const item = CABLE_CATALOG.find(c => c.id === id) || CABLE_CATALOG[0];
      const effectiveQty = (trefoil && qty === 1 && isUnipolarCable(item)) ? 3 : qty;
      const batchId = Date.now();

      for (let q = 0; q < effectiveQty; q++) {
        const idx = state.cables.length + 1;
        const baseCode = customCode ? customCode : item.code;
        const phaseLabels = ["L1", "L2", "L3"];
        const suffix = trefoil ? phaseLabels[q % 3] : `${q + 1}`;
        const code = (customCode && effectiveQty > 1) || trefoil ? `${baseCode}-${suffix}` : baseCode;
        const trefoilGroupId = trefoil ? `TRF_${batchId}_${Math.floor(q / 3)}` : null;
        
        const uInfo = findInUnifilareDict(code) || findInUnifilareDict(baseCode);
        // Una descrizione è utile solo se contiene almeno una parola vera (es. non solo "mm²")
        const isMeaningful = (s) => !!s && /[A-Za-zÀ-ÿ]{3,}/.test(String(s).replace(/mm²|mm2/gi, ""));
        let finalDesc = (uInfo && uInfo.desc) || "";
        if (!isMeaningful(finalDesc) && item.desc) {
          const cd = cleanUtenzaDescription(item.desc, baseCode);
          finalDesc = isMeaningful(cd) ? cd : (code.startsWith("CAVO-") ? `Utenza ${code.replace("CAVO-", "")}` : `Alimentazione ${baseCode}`);
        }
        if (!isMeaningful(finalDesc)) finalDesc = `Alimentazione ${baseCode}`;
        const cleaned = cleanUtenzaDescription(finalDesc, baseCode);
        if (isMeaningful(cleaned)) finalDesc = cleaned;
        
        if (isUnipolarCable(item)) {
          const match = state.cables.find(c => c.code.startsWith(baseCode) || baseCode.startsWith(c.code));
          if (match && match.desc) finalDesc = match.desc;
        }

        state.cables.push({
          id: idx,
          code,
          d: item.d,
          w: item.w,
          sec: item.sec,
          cores: item.cores,
          iz0: item.iz0,
          ib: (state.pdfLoaded && uInfo) ? uInfo.ib : (state.pdfLoaded ? 12 : 0),
          bendK: item.bendK,
          trefoil,
          trefoilGroupId,
          origX: 18 + ((idx - 1) % 5) * 15,
          origY: item.d / 2 + Math.floor((idx - 1) / 5) * 15,
          x: 18,
          y: item.d / 2,
          desc: finalDesc,
          type: (uInfo && uInfo.cable) || item.type,
          form: (uInfo && uInfo.form) || item.form,
          sys: item.sys
        });
      }
      document.getElementById("inpCableCode").value = "";
      recalculateAll();
    }

    function addCustomCableToDB() {
      const form = document.getElementById("newCbForm").value || "1(1x1.5)";
      const desc = document.getElementById("newCbDesc").value || "Cavo Custom Inserito";
      const d = parseFloat(document.getElementById("newCbD").value) || 10.0;
      const w = +(Math.pow(d / 10, 2) * 0.145).toFixed(2);
      
      CABLE_CATALOG.push({
        id: "CUSTOM_" + Date.now(),
        code: "CST-00",
        desc: desc,
        type: "CUSTOM",
        form: form,
        d: d,
        w: w,
        sec: parseSectionFromForm(form),
        cores: /1[xX]|1\s*\(/.test(form) ? 1 : 3,
        iz0: 20,
        bendK: 10,
        sys: "BT_POWER"
      });
      
      initCatalogDropdown();
      document.getElementById("selCableCatalog").selectedIndex = CABLE_CATALOG.length - 1;
    }

    function autoSizeTray() {
      if (!state.cables.length) return;
      const reservePct = parseFloat(document.getElementById("inpSpareReserve").value) || 30;
      const targetFillFactor = (100 - reservePct) / 100;
      
      const used = state.cables.reduce((s, c) => s + Math.PI * Math.pow(c.d / 2, 2), 0);
      const widths = [50, 100, 150, 200, 300, 400, 500, 600, 800, 1000];
      
      state.width = widths.find(w => w * state.height >= used / targetFillFactor) || widths[widths.length - 1];
      state.title = state.title.replace(/L=\s*\d+\s*mm/i, `L=${state.width}mm`);
      
      pushStateToUI();
      recalculateAll();
      fitAll();
    }

    function escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function updateTableUI() {
      const head = document.getElementById("tblHead");
      const body = document.getElementById("tblBody");
      // Conserva il focus (e il cursore) se l'utente sta modificando una cella della tabella
      const act = document.activeElement;
      const keep = (act && body.contains(act) && act.dataset.row != null)
        ? { row: act.dataset.row, field: act.dataset.field, s: act.selectionStart, e: act.selectionEnd } : null;

      head.innerHTML = `
        <tr class="border-b border-slate-800 text-xs uppercase text-slate-400 mono bg-slate-950/60 whitespace-nowrap">
          <th scope="col" class="py-1.5 px-2">Pos</th>
          <th scope="col" class="py-1.5 px-2">Sigla utenza / linea</th>
          <th scope="col" class="py-1.5 px-2">Ø (mm)</th>
          <th scope="col" class="py-1.5 px-2">Peso (kg/m)</th>
          <th scope="col" class="py-1.5 px-2">R min</th>
          <th scope="col" class="py-1.5 px-2">Coord (X, Y)</th>
          <th scope="col" class="py-1.5 px-2">Descrizione utenza</th>
          <th scope="col" class="py-1.5 px-2">Tipo cavo</th>
          <th scope="col" class="py-1.5 px-2">Formazione</th>
          <th scope="col" class="py-1.5 px-2 text-right"><span class="sr-only">Azioni</span></th>
        </tr>`;
      if (!state.cables.length) {
        body.innerHTML = `<tr><td colspan="10" class="py-6 text-center text-slate-400 font-sans text-[13px]">Nessun cavo nella sezione. Importa un file DWG/DXF oppure aggiungi cavi dalla scheda <strong class="text-slate-200">4. Cavi</strong>.</td></tr>`;
        return;
      }
      const num = (v, def) => (v != null && !isNaN(v)) ? v : def;
      if (selectedCableIdx >= state.cables.length) selectedCableIdx = -1;
      body.innerHTML = state.cables.map((c, i) => {
        const isUni = isUnipolarCable(c);
        const n = i + 1;
        const sel = i === selectedCableIdx;
        return `<tr class="hover:bg-slate-800/50 whitespace-nowrap${sel ? " row-sel" : ""}" data-idx="${i}" aria-selected="${sel}">
          <td class="py-1 px-2 text-amber-400 font-bold">#${n}</td>
          <td class="py-1 px-2"><input type="text" id="codeInp_${i}" data-row="${i}" data-field="code" aria-label="Sigla cavo ${n}" value="${escapeHtml(c.code)}" oninput="onCableCodeInput(${i}, this.value)" onchange="updateCableField(${i}, 'code', this.value)" class="cell-input w-36 font-semibold"></td>
          <td class="py-1 px-2"><input type="number" data-row="${i}" data-field="d" aria-label="Diametro cavo ${n} in mm" value="${c.d}" step="0.5" min="4" max="90" onchange="updateCableField(${i}, 'd', this.value)" class="cell-input w-16 text-center"></td>
          <td class="py-1 px-2 text-slate-300">${num(c.w, Math.pow((c.d || 10) / 10, 2) * 0.145).toFixed(2)}</td>
          <td class="py-1 px-2 text-slate-300">${Math.round((c.d || 10) * (c.bendK || 10))} mm</td>
          <td class="py-1 px-2 text-slate-400">(${num(c.x, 0).toFixed(1)}, ${num(c.y, 0).toFixed(1)})</td>
          <td class="py-1 px-2"><input type="text" id="descInp_${i}" data-row="${i}" data-field="desc" aria-label="Descrizione utenza cavo ${n}" value="${escapeHtml(c.desc)}" oninput="onCableDescInput(${i}, this.value)" onchange="updateCableField(${i}, 'desc', this.value)" class="cell-input w-64 font-sans"></td>
          <td class="py-1 px-2"><input type="text" data-row="${i}" data-field="type" aria-label="Tipo cavo ${n}" value="${escapeHtml(getDisplayCableType(c, state.cables))}" onchange="updateCableField(${i}, 'type', this.value)" class="cell-input w-32"></td>
          <td class="py-1 px-2">
            <div class="flex items-center gap-1">
              <input type="text" data-row="${i}" data-field="form" aria-label="Formazione cavo ${n}" value="${escapeHtml(c.form)}" onchange="updateCableField(${i}, 'form', this.value)" class="cell-input w-28">
              ${isUni ? `<span class="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/40 px-1 rounded font-bold" title="Cavo unipolare">1X</span>` : ""}
              ${c.trefoil ? `<span class="text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 px-1 rounded font-bold" title="Posa a trifoglio">3F</span>` : ""}
            </div>
          </td>
          <td class="py-1 px-2 text-right"><button type="button" onclick="deleteCable(${i})" aria-label="Elimina cavo ${n}" title="Elimina cavo" class="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded px-2 py-0.5 text-base leading-none">&times;</button></td>
        </tr>`;
      }).join("");

      if (keep) {
        const el = body.querySelector(`[data-row="${keep.row}"][data-field="${keep.field}"]`);
        if (el) {
          el.focus({ preventScroll: true });
          try { if (keep.s != null) el.setSelectionRange(keep.s, keep.e); } catch (err) {}
        }
      }
    }

    function onCableDescInput(idx, val) {
      const c = state.cables[idx];
      if (!c) return;
      c.desc = val;
      const base = getBaseCircuitCode(c.code);
      if (base && !base.startsWith("CAVO-")) {
        state.cables.forEach((other, oIdx) => {
          if (other !== c && getBaseCircuitCode(other.code) === base) {
            other.desc = val;
            const oEl = document.getElementById(`descInp_${oIdx}`);
            if (oEl && oEl.value !== val) oEl.value = val;
          }
        });
      }
      drawScene();
    }

    function onCableCodeInput(idx, val) {
      const c = state.cables[idx];
      if (!c) return;
      const parsed = parseCalloutLabelString(val);
      const cleanCode = parsed.cleanCode || val.trim();
      c.code = cleanCode;
      if (parsed.inlineDesc && (!c.desc || c.desc.startsWith("Alimentazione") || c.desc.startsWith("Utenza"))) {
        c.desc = parsed.inlineDesc;
        const inpDesc = document.getElementById(`descInp_${idx}`);
        if (inpDesc && inpDesc.value !== c.desc) inpDesc.value = c.desc;
      }
      const u = findInUnifilareDict(c.code) || findInUnifilareDict(getBaseCircuitCode(c.code));
      if (u) {
        if (u.desc) {
          c.desc = u.desc;
          const descEl = document.getElementById(`descInp_${idx}`);
          if (descEl && descEl.value !== u.desc) descEl.value = u.desc;
        }
        if (u.cable) c.type = u.cable;
        if (u.form) {
          c.form = u.form;
          c.sec = parseSectionFromForm(u.form, c.sec);
          c.cores = isUnipolarCable(c) ? 1 : (u.form.includes("5G") || u.form.includes("4G") ? 3 : 2);
        }
        const base = getBaseCircuitCode(c.code);
        if (base && !base.startsWith("CAVO-")) {
          state.cables.forEach((other, oIdx) => {
            if (other !== c && getBaseCircuitCode(other.code) === base) {
              if (u.desc) {
                other.desc = u.desc;
                const oEl = document.getElementById(`descInp_${oIdx}`);
                if (oEl && oEl.value !== u.desc) oEl.value = u.desc;
              }
            }
          });
        }
      }
      drawScene();
    }

    function updateCableField(idx, field, val) {
      const c = state.cables[idx];
      if (!c) return;
      if (field === "d") {
        c.d = parseFloat(val) || 10;
        c.w = +(Math.pow(c.d / 10, 2) * 0.145).toFixed(2);
      } else if (field === "desc") {
        c.desc = cleanUtenzaDescription(val, c.code);
        const inpEl = document.getElementById(`descInp_${idx}`);
        if (inpEl && inpEl.value !== c.desc) inpEl.value = c.desc;
        const base = getBaseCircuitCode(c.code);
        if (base && !base.startsWith("CAVO-")) {
          state.cables.forEach((other, oIdx) => {
            if (other !== c && getBaseCircuitCode(other.code) === base) {
              other.desc = c.desc;
              const oEl = document.getElementById(`descInp_${oIdx}`);
              if (oEl && oEl.value !== c.desc) oEl.value = c.desc;
            }
          });
        }
      } else if (field === "code") {
        const parsed = parseCalloutLabelString(val);
        c.code = parsed.cleanCode || val.trim();
        const inpCode = document.getElementById(`codeInp_${idx}`);
        if (inpCode && inpCode.value !== c.code) inpCode.value = c.code;
        if (parsed.inlineDesc && (!c.desc || c.desc.startsWith("Alimentazione") || c.desc.startsWith("Utenza"))) {
          c.desc = parsed.inlineDesc;
          const inpDesc = document.getElementById(`descInp_${idx}`);
          if (inpDesc && inpDesc.value !== c.desc) inpDesc.value = c.desc;
        }
      } else {
        c[field] = val;
      }
      recalculateAll();
      updateTableUI();
    }

    function deleteCable(idx) {
      const c = state.cables[idx];
      if (!c) return;
      state.cables.splice(idx, 1);
      recalculateAll();
      toast(`Cavo ${c.code} eliminato`, "info", { label: "Annulla", onClick: undoLastChange });
    }

    function clearCables() {
      if (!state.cables.length) return;
      const n = state.cables.length;
      state.cables = [];
      recalculateAll();
      toast(`Rimossi ${n} cavi dalla sezione`, "warn", { label: "Annulla", onClick: undoLastChange }, 7000);
    }

