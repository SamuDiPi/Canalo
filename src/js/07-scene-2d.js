    // ============================================================================
    // 6. COSTRUZIONE SCENA VETTORIALE 1:1 (CON UNIPOLARI 1X & MORSETTO PE REALISTICO)
    // ============================================================================
    // ============================================================================
    // MISURA E "A CAPO" DEI TESTI DELLA TAVOLA
    // Altezza CAD = altezza delle maiuscole (cap height): per Arial 0,716 em.
    // La larghezza è misurata sul font reale, così le celle delle tabelle bastano anche in AutoCAD.
    // ============================================================================
    const CAD_CAP_HEIGHT_EM = 0.716;
    const cadMeasureCtx = document.createElement("canvas").getContext("2d");
    const cadWidthCache = new Map();
    function cadTextWidth(str, capH) {
      const s = String(str == null ? "" : str).replace(/%%[cdp]/gi, "Ø");
      let w100 = cadWidthCache.get(s);
      if (w100 === undefined) {
        cadMeasureCtx.font = "100px Arial, 'Liberation Sans', Helvetica, sans-serif";
        w100 = cadMeasureCtx.measureText(s).width;
        if (cadWidthCache.size > 5000) cadWidthCache.clear();
        cadWidthCache.set(s, w100);
      }
      return (w100 / 100) * (capH / CAD_CAP_HEIGHT_EM);
    }

    // Divide il testo in righe larghe al massimo maxW (a parole; una parola troppo lunga va spezzata)
    function wrapCadText(str, maxW, capH) {
      const words = String(str).trim().split(/\s+/).filter(Boolean);
      if (!words.length) return [""];
      const lines = [];
      let cur = "";
      const pushWord = (w) => {
        const test = cur ? `${cur} ${w}` : w;
        if (cadTextWidth(test, capH) <= maxW) { cur = test; return; }
        if (cur) { lines.push(cur); cur = ""; }
        if (cadTextWidth(w, capH) <= maxW) { cur = w; return; }
        // parola più larga della cella: spezza preferendo / - ( dopo il carattere
        let part = "";
        for (const ch of w) {
          if (part && cadTextWidth(part + ch, capH) > maxW) { lines.push(part); part = ""; }
          part += ch;
        }
        cur = part;
      };
      words.forEach(pushWord);
      if (cur) lines.push(cur);
      return lines;
    }

    function buildCADScene() {
      const prims = [];
      const W = state.width, H = state.height, thk = state.thk;
      const isLight = state.theme === "light";
      const mat = MAT_SPECS[state.material] || MAT_SPECS.sendzimir;
      const sup = SUPPORT_SPECS[state.support] || SUPPORT_SPECS.wall_med;
      const txtCol = isLight ? "#0f172a" : "#f8fafc";
      const boxBg = isLight ? "#f1f5f9" : "#0f172a";
      const boxAlt = isLight ? "#e2e8f0" : "#1e293b";

      const line = (layer, x1, y1, x2, y2, color, lw = 0.4, alpha = 1) => prims.push({ t: "line", layer, x1, y1, x2, y2, color, lw, alpha });
      const rect = (layer, x, y, w, h, color, fill, solid = false) => prims.push({ t: "rect", layer, x, y, w, h, color, fill, solid });
      const circle = (layer, cx, cy, r, color, fill, solid = false) => prims.push({ t: "circle", layer, cx, cy, r, color, fill, solid });
      const txtMul = (typeof state.textScale === "number" && state.textScale > 0) ? state.textScale : 1.0;
      // Standardizzazione altezza testi: nominale 2.5mm moltiplicata per txtMul
      const text = (layer, x, y, h = 2.5, str, color, align = "left", maxW = null) => {
        let s = String(str || "");
        const nominalH = (typeof h === "number" && h > 0) ? h : 2.5;
        if (maxW) {
          const maxCh = Math.max(4, Math.floor((maxW - 2) / (nominalH * txtMul * 0.56)));
          if (s.length > maxCh) s = s.substring(0, maxCh - 2) + "..";
        }
        const effectiveH = +(nominalH * txtMul).toFixed(3);
        prims.push({ t: "text", layer, x, y, h: effectiveH, str: s, color: isLight && color === "#f8fafc" ? txtCol : color, align });
      };

      const ceilY = H + (state.clearance > 0 ? 42 : 18);
      if (state.clearance > 0) {
        line("STAFFAGGI", -25, ceilY, W + 25, ceilY, "#64748b", 0.6);
        for (let hx = -22; hx <= W + 20; hx += 8) line("STAFFAGGI", hx, ceilY, hx + 5, ceilY + 5, "#475569", 0.3);
        line("QUOTE", -15, H, -15, ceilY, "#38bdf8", 0.4);
        text("QUOTE", -18, (H + ceilY) / 2 - 1, 2.5, `Rispetto >= ${state.clearance}mm`, "#38bdf8", "right");
      }

      // Profilo Canalina
      rect("Canalina", -thk, -thk, thk, H + thk, mat.stroke, mat.fill, true);
      rect("Canalina", W, -thk, thk, H + thk, mat.stroke, mat.fill, true);
      rect("Canalina", 0, -thk, W, thk, mat.stroke, mat.fill, true);
      if (state.trayType === "perforated") {
        for (let x = 10; x < W - 10; x += 16) rect("Canalina", x, -thk, 7, thk, "#f59e0b", isLight ? "#ffffff" : "#04070d", true);
      }
      if (state.edgeGuard) {
        circle("Canalina", 1.3, H - 1.3, 1.4, mat.stroke, mat.fill, true);
        circle("Canalina", W - 1.3, H - 1.3, 1.4, mat.stroke, mat.fill, true);
      }
      if (state.cover !== "none") {
        const cy = H + (state.cover === "ventilated" ? 8 : 0.8);
        rect("Canalina", -thk - 2, cy, W + 2 * thk + 4, thk, mat.stroke, mat.fill, true);
        line("Canalina", -thk - 2, cy - 4, -thk - 2, cy, mat.stroke, 0.6);
        line("Canalina", W + thk + 2, cy - 4, W + thk + 2, cy, mat.stroke, 0.6);
      }
      // Setti Separatori con maniglia di presa ergonomica salvacavi
      getSeptumXList().forEach((sx, sIdx) => {
        // Piede di fissaggio inferiore al fondo canalina
        rect("Canalina", sx - 6, 0, 12, thk, "#38bdf8", "#0e7490", true);
        circle("Canalina", sx, thk * 0.5, 0.8, "#38bdf8", "#38bdf8", true);

        // Lama verticale del setto
        rect("Canalina", sx - thk / 2, 0, thk, H - 3, "#38bdf8", "#0e7490", true);

        // Maniglia/Bordino superiore arrotondato salvacavi (CEI 64-8) e grip di trascinamento
        rect("Canalina", sx - 3.5, H - 3, 7, 3.5, "#38bdf8", "#0284c7", true);
        circle("Canalina", sx - 3.5, H - 1.25, 1.75, "#38bdf8", "#0284c7", true);
        circle("Canalina", sx + 3.5, H - 1.25, 1.75, "#38bdf8", "#0284c7", true);

        // Frecce interattive trascinamento / maniglia visibile '◄ ►'
        text("Canalina", sx, H + 2.8, 2.0, "◄ ►", "#38bdf8", "center");
        text("Canalina", sx, H + 5.5, 1.7, `SETTO #${sIdx + 1} (${Math.round(sx)}mm)`, "#06b6d4", "center");
      });

      // Quotatura larghezze scomparti generati dai setti
      if (state.septums > 0) {
        const sepXList = [0, ...getSeptumXList(), W];
        for (let sIdx = 0; sIdx < sepXList.length - 1; sIdx++) {
          const x0 = sepXList[sIdx], x1 = sepXList[sIdx + 1];
          const cMid = (x0 + x1) / 2;
          const dimY = -thk - 10;
          line("Quote", x0 + 1, dimY, x1 - 1, dimY, "#0284c7", 0.35);
          line("Quote", x0, dimY - 1.5, x0, dimY + 1.5, "#0284c7", 0.4);
          line("Quote", x1, dimY - 1.5, x1, dimY + 1.5, "#0284c7", 0.4);
          line("Quote", x0 - 1, dimY - 1, x0 + 1, dimY + 1, "#0284c7", 0.4);
          line("Quote", x1 - 1, dimY - 1, x1 + 1, dimY + 1, "#0284c7", 0.4);
          text("Quote", cMid, dimY - 2.5, 2.0, `L${sIdx + 1} = ${Math.round(x1 - x0)} mm`, "#38bdf8", "center");
        }
      }

      // Staffaggi (Disegnati sul layer STAFFAGGI solo se configurato un supporto)
      let lowestY = -thk - 18;
      if (state.support && state.support !== "none") {
        if (state.support.startsWith("wall_")) {
          const wallX = -25, armH = sup.armH;
          line("STAFFAGGI", wallX, -50, wallX, H + 15, "#64748b", 0.6);
          rect("STAFFAGGI", wallX, -38, 4, 44, "#94a3b8", "#475569", true);
          rect("STAFFAGGI", wallX + 4, -thk - armH, W + 38, armH, "#94a3b8", "#334155", true);
          if (sup.strut) line("STAFFAGGI", wallX + 4, -34, W * 0.7, -thk - armH, "#94a3b8", 0.65);
          lowestY = -52;
        } else if (state.support === "ceiling_trap") {
          rect("STAFFAGGI", -22, -thk - 12, W + 44, 12, "#94a3b8", "#334155", true);
          [-14, W + 14].forEach(rx => line("STAFFAGGI", rx, -thk - 12, rx, ceilY, "#cbd5e1", 0.5));
          lowestY = -32;
        } else if (state.support === "ceiling_single") {
          line("STAFFAGGI", W / 2, -thk - 10, W / 2, ceilY, "#cbd5e1", 0.5);
          rect("STAFFAGGI", -15, -thk - 10, W + 30, 10, "#94a3b8", "#334155", true);
          lowestY = -28;
        } else if (state.support === "floor_omega") {
          rect("STAFFAGGI", -10, -thk - 18, 12, 18, "#94a3b8", "#334155", true);
          rect("STAFFAGGI", W - 2, -thk - 18, 12, 18, "#94a3b8", "#334155", true);
          lowestY = -36;
        }
      }

      // ==========================================================================
      // PUNTO 5: PARTICOLARE COSTRUTTIVO REALISTICO MORSETTO PE / TRECCIA DI RAME
      // Posizionato sul fianco esterno destro della sponda (oppure sinistro) con
      // bullone M6 esagonale, rondella dentellata, capocorda a occhiello e treccia
      // ==========================================================================
      if (state.earth !== "none") {
        const isGV = state.earth.startsWith("gv");
        const secPE = state.earth.replace(/\D+/g, "") || "16";
        // Posizioniamo il morsetto sulla sponda sinistra a metà altezza (Y = H * 0.52)
        const baseX = -thk;
        const baseY = H * 0.52;

        // 1. Piastrina / Morsetto equipotenziale in acciaio inox/ottone ancorato alla sponda
        rect("STAFFAGGI", baseX - 3.2, baseY - 5.5, 3.2, 11.0, "#cbd5e1", "#475569", true);
        // Rondella zigrinata antisvitamento
        rect("STAFFAGGI", baseX - 4.0, baseY - 3.8, 0.8, 7.6, "#94a3b8", "#64748b", true);
        // Bullone di serraggio M6x16 (testa esagonale + asse filettato passante nella sponda)
        rect("STAFFAGGI", baseX - 6.2, baseY - 2.6, 2.2, 5.2, "#e2e8f0", "#94a3b8", true);
        line("STAFFAGGI", baseX - 6.2, baseY - 1.2, baseX - 4.0, baseY - 1.2, "#475569", 0.35);
        line("STAFFAGGI", baseX - 6.2, baseY + 1.2, baseX - 4.0, baseY + 1.2, "#475569", 0.35);
        // Dado interno M6 sulla sponda
        rect("STAFFAGGI", 0, baseY - 2.2, 1.4, 4.4, "#cbd5e1", "#64748b", true);
        // Asse vite M6 (linea tratteggiata rossa/ambra)
        line("STAFFAGGI", baseX - 7.5, baseY, 2.5, baseY, "#f59e0b", 0.3, 0.8);

        // 2. Capocorda a occhiello / tubolare pressato verso il basso
        rect("STAFFAGGI", baseX - 4.8, baseY - 9.0, 2.4, 4.2, "#fbbf24", "#b45309", true);

        // 3. Conduttore PE: Treccia piatta in rame stagnato/nudo oppure Cavo Giallo/Verde bicolore
        const braidTopY = baseY - 9.0;
        const braidBotY = baseY - 23.0;
        const braidX = baseX - 3.6;

        if (isGV) {
          // Cavo unipolare Giallo/Verde con fasciatura elicoidale bicolore realistica
          const segments = 6;
          const segH = (braidTopY - braidBotY) / segments;
          for (let s = 0; s < segments; s++) {
            const sy = braidBotY + s * segH;
            const colFill = s % 2 === 0 ? "#16a34a" : "#eab308";
            const colStroke = s % 2 === 0 ? "#4ade80" : "#fde047";
            rect("STAFFAGGI", braidX - 1.3, sy, 2.6, segH, colStroke, colFill, true);
          }
          // Sezione terminale del cavo PE in vista (anima in rame + isolamento G/V)
          circle("STAFFAGGI", braidX, braidBotY - 2.2, 2.6, "#fde047", "#16a34a", true);
          circle("STAFFAGGI", braidX, braidBotY - 2.2, 1.4, "#fb923c", "#ea580c", true);
        } else {
          // Treccia piatta flessibile in rame con trama incrociata a losanghe
          rect("STAFFAGGI", braidX - 1.8, braidBotY, 3.6, braidTopY - braidBotY, "#fb923c", "#9a3412", true);
          for (let ty = braidBotY + 1; ty < braidTopY - 1.5; ty += 2.2) {
            line("STAFFAGGI", braidX - 1.6, ty, braidX + 1.6, ty + 1.8, "#fdba74", 0.35);
            line("STAFFAGGI", braidX + 1.6, ty, braidX - 1.6, ty + 1.8, "#fdba74", 0.35);
          }
        }

        // 4. Cartellino tecnico di richiamo del nodo equipotenziale PE
        const tagX = baseX - 11.5;
        const tagY = baseY - 11.0;
        line("Bandierine", baseX - 6.2, baseY, tagX + 2, tagY + 4.5, isGV ? "#4ade80" : "#fb923c", 0.35);
        line("Bandierine", tagX + 2, tagY + 4.5, tagX - 36, tagY + 4.5, isGV ? "#4ade80" : "#fb923c", 0.35);
        text("Testi", tagX - 2, tagY + 6.0, 1.95, `NODO PE M6 (${isGV ? `FS17 G/V ${secPE}mmq` : `Treccia Cu ${secPE}mmq`})`, isGV ? "#4ade80" : "#fb923c", "right");
        text("Testi", tagX - 2, tagY + 1.8, 1.65, `Continuità CEI 64-8 Art.543`, "#94a3b8", "right");
      }

      // ==========================================================================
      // PUNTO 2: DISEGNO DIFFERENZIATO CAVI UNIPOLARI (1X) VS MULTIPOLARI
      // ==========================================================================
      const leftC = [], rightC = [];
      state.cables.forEach((c, idx) => {
        const r = c.d / 2;
        const isUni = isUnipolarCable(c);
        const col = c.sys === "SPECIAL_ELV" ? "#38bdf8" : c.sys === "BT_FIRE" ? "#f87171" : isUni ? "#fbbf24" : "#f59e0b";
        const fill = c.sys === "SPECIAL_ELV" ? "#0e7490" : c.sys === "BT_FIRE" ? "#991b1b" : isUni ? "#451a03" : "#78350f";

        // Guaina esterna
        circle("Cavi", c.x, c.y, r, col, fill, true);
        // Isolamento interno (anello elastomerico HEPR/G16)
        circle("Cavi", c.x, c.y, r * 0.78, col, isUni ? "#1e293b" : null, isUni);

        if (isUni) {
          // STILIZZAZIONE CAVO UNIPOLARE (1X): Unica anima centrale in rame cordato con corona di trefoli!
          const rCu = r * 0.50;
          circle("Anime_Cavi", c.x, c.y, rCu, "#fdba74", "#ea580c", true);
          // Corona di 6 trefoli elementari attorno al trefolo centrale per rendere evidente la cordatura 1X
          if (r >= 4.0) {
            circle("Anime_Cavi", c.x, c.y, rCu * 0.34, "#fed7aa", null, false);
            for (let s = 0; s < 6; s++) {
              const ang = (s * Math.PI) / 3;
              circle("Anime_Cavi", c.x + Math.cos(ang) * rCu * 0.64, c.y + Math.sin(ang) * rCu * 0.64, rCu * 0.28, "#fed7aa", null, false);
            }
          }
          // Croce assiale sottile da vero simbolo unipolare CAD
          line("Anime_Cavi", c.x - r * 0.68, c.y, c.x + r * 0.68, c.y, "#fde047", 0.22, 0.65);
          line("Anime_Cavi", c.x, c.y - r * 0.68, c.x, c.y + r * 0.68, "#fde047", 0.22, 0.65);
        } else {
          // STILIZZAZIONE CAVO MULTIPOLARE (2x, 3G, 4G, 5G): Anime multiple distribuite a stella
          const formStr = String(c.form || "");
          const nCores = formStr.includes("5G") ? 5 : formStr.includes("4G") || formStr.includes("4x") ? 4 : formStr.includes("2x") ? 2 : 3;
          const ringR = nCores === 2 ? r * 0.36 : r * 0.42;
          const coreR = nCores === 5 ? r * 0.18 : r * 0.21;
          for (let k = 0; k < nCores; k++) {
            const a = (k * 2 * Math.PI) / nCores + Math.PI / 6;
            // Se c'è il conduttore G/V (formazione con 'G') coloriamo l'ultima anima in verde/giallo
            const isPECore = /G/i.test(c.form) && k === nCores - 1;
            circle(
              "Anime_Cavi",
              c.x + Math.cos(a) * ringR,
              c.y + Math.sin(a) * ringR,
              coreR,
              isPECore ? "#fde047" : "#fb923c",
              isPECore ? "#16a34a" : "#ea580c",
              true
            );
          }
        }

        // Numero identificativo posizione cavo: standard 2.5mm (scalato proporzionalmente solo se il cavo è molto piccolo)
        const numH = Math.max(1.8, Math.min(2.5, r * 0.45));
        text("Testi", c.x, c.y - 0.7, numH, String(idx + 1), "#ffffff", "center");
        if (c.x <= W / 2) leftC.push({ c, idx }); else rightC.push({ c, idx });
      });

      // ========================================================================
      // FASCETTE DI ANCORAGGIO CAVI (CEI EN 61537) SU LAYER DEDICATO "FASCETTE_ANCORAGGIO"
      // ========================================================================
      if (state.clamps && state.cables.length > 0) {
        // A. Fascette amagnetiche per terne a trifoglio
        const trfGroups = {};
        state.cables.forEach(c => {
          if (c.trefoil && c.trefoilGroupId) {
            if (!trfGroups[c.trefoilGroupId]) trfGroups[c.trefoilGroupId] = [];
            trfGroups[c.trefoilGroupId].push(c);
          }
        });
        Object.values(trfGroups).forEach(grp => {
          if (grp.length === 3) {
            const gcx = (grp[0].x + grp[1].x + grp[2].x) / 3;
            const gcy = (grp[0].y + grp[1].y + grp[2].y) / 3;
            const gr = grp[0].d * 1.08;
            circle("FASCETTE_ANCORAGGIO", gcx, gcy, gr, "#06b6d4", null, false);
            circle("FASCETTE_ANCORAGGIO", gcx, gcy, gr + 0.6, "#0891b2", null, false);
            rect("FASCETTE_ANCORAGGIO", gcx - 2.5, gcy + gr - 1.2, 5, 2.8, "#22d3ee", "#0e7490", true);
          }
        });

        // B. Fascetta di ancoraggio e serraggio a pettine / nastro per scomparti
        const sepXList = [0, ...getSeptumXList(), W];
        for (let sIdx = 0; sIdx < sepXList.length - 1; sIdx++) {
          const x0 = sepXList[sIdx], x1 = sepXList[sIdx + 1];
          const compCables = state.cables.filter(c => c.x >= x0 && c.x <= x1 && !c.trefoil);
          if (compCables.length > 0) {
            const minX = Math.max(x0 + 1.5, Math.min(...compCables.map(c => c.x - c.d / 2)) - 1.5);
            const maxX = Math.min(x1 - 1.5, Math.max(...compCables.map(c => c.x + c.d / 2)) + 1.5);
            const maxY = Math.max(...compCables.map(c => c.y + c.d / 2));

            // Clip di ancoraggio alla base della canalina
            rect("FASCETTE_ANCORAGGIO", minX - 2.5, -thk, 2.5, 4.0, "#06b6d4", "#0891b2", true);
            rect("FASCETTE_ANCORAGGIO", maxX, -thk, 2.5, 4.0, "#06b6d4", "#0891b2", true);

            // Nastro fascetta serrato sopra i cavi
            line("FASCETTE_ANCORAGGIO", minX, 0, minX + 1.5, maxY + 0.5, "#06b6d4", 0.5);
            line("FASCETTE_ANCORAGGIO", minX + 1.5, maxY + 0.5, maxX - 1.5, maxY + 0.5, "#06b6d4", 0.55);
            line("FASCETTE_ANCORAGGIO", maxX - 1.5, maxY + 0.5, maxX, 0, "#06b6d4", 0.5);
            rect("FASCETTE_ANCORAGGIO", (minX + maxX) / 2 - 2, maxY + 0.5, 4, 2.0, "#22d3ee", "#0e7490", true);

            // Bandierina descrittiva sulla prima fascetta
            if (sIdx === 0) {
              const bX = (minX + maxX) / 2;
              const bY = maxY + 1.5;
              line("Bandierine", bX, bY, bX - 10, bY + 12, "#06b6d4", 0.25);
              line("Bandierine", bX - 10, bY + 12, bX - 18, bY + 12, "#06b6d4", 0.25);
              text("Testi", bX - 20, bY + 11.4, 1.9, "Fascette ancoraggio amagnetiche (passo 600mm)", "#38bdf8", "right");
            }
          }
        }
      }

      const calloutBaseY = ceilY + 8, stepY = 7.5;
      let maxLW = 0, maxRW = 0;
      const showCallouts = state.showCableCallouts !== false;

      if (showCallouts) {
        maxLW = 75; maxRW = 75;
        leftC.forEach((it, i) => {
          const ty = calloutBaseY + i * stepY;
          const lbl = `#${it.idx + 1} ${it.c.code} (${it.c.form} Ø${it.c.d})`;
          maxLW = Math.max(maxLW, lbl.length * 1.55);
          line("Bandierine", it.c.x, it.c.y + it.c.d / 2, -16, ty, "#fbbf24", 0.22, 0.6);
          line("Bandierine", -16, ty, -24, ty, "#fbbf24", 0.22, 0.6);
          text("Testi", -26, ty - 0.6, 2.5, lbl, "#cbd5e1", "right");
        });
        rightC.forEach((it, i) => {
          const ty = calloutBaseY + i * stepY;
          const lbl = `#${it.idx + 1} ${it.c.code} (${it.c.form} Ø${it.c.d})`;
          maxRW = Math.max(maxRW, lbl.length * 1.55);
          line("Bandierine", it.c.x, it.c.y + it.c.d / 2, W + 16, ty, "#fbbf24", 0.22, 0.6);
          line("Bandierine", W + 16, ty, W + 24, ty, "#fbbf24", 0.22, 0.6);
          text("Testi", W + 26, ty - 0.6, 2.5, lbl, "#cbd5e1", "left");
        });
      }

      const qY = -thk - 22;
      line("QUOTE", 0, qY, W, qY, "#f59e0b", 0.45);
      text("QUOTE", W / 2, qY + 2.5, 2.5, `Base L = ${W} mm`, "#fbbf24", "center");
      line("QUOTE", W + 10, 0, W + 10, H, "#f59e0b", 0.45);
      text("QUOTE", W + 12, H / 2 - 1, 2.5, `H=${H}mm`, "#fbbf24", "left");

      const isMinimal = state.layoutMode === "minimal";
      const leftBoxX = -48, leftBoxW = Math.max(200, W + 92);

      if (!isMinimal && state.showPlanTag) {
        const ptY = lowestY - 38;
        rect("ETICHETTA_PIANTA", leftBoxX, ptY, leftBoxW, 24, "#4ade80", boxBg, true);
        text("ETICHETTA_PIANTA", leftBoxX + 5, ptY + 16, 2.5, `ETICHETTA PLANIMETRIA: ${state.title} (${state.planTag})`, "#4ade80", "left", leftBoxW - 10);
        text("ETICHETTA_PIANTA", leftBoxX + 5, ptY + 6, 2.5, `Riempimento: ${metrics.fillPct}% (Riserva +${metrics.sparePct}%) | Carico: ${metrics.totalKgM} kg/m`, "#f8fafc", "left", leftBoxW - 10);
        lowestY = ptY;
      }

      if (!isMinimal && state.showIso3D) {
        lowestY = build3DIsoScene(prims, leftBoxX, lowestY, leftBoxW, W, H, thk, mat, sup);
      }

      // ------------------------------------------------------------------------
      // TABELLE DELLA COLONNA DESTRA: larghezza massima 200 mm (20 cm sulla tavola 1:1),
      // colonne dimensionate sul contenuto, testi a capo invece che troncati.
      // Le larghezze sono misurate con le metriche Arial e la convenzione CAD
      // (altezza testo = altezza delle maiuscole), così valgono anche in AutoCAD.
      // ------------------------------------------------------------------------
      const TAB_MAX_W = 200;
      const T_BODY = 2.5, T_HEAD = 2.5, T_TITLE = 2.5, T_BOM = 1.95; // testi della distinta: 2,5 mm (standard di tavola)
      const PAD_X = 1.4, PAD_Y = 1.8, LINE_K = 1.45;
      const effH = h => h * txtMul;
      const tw = (s, h) => cadTextWidth(s, effH(h));
      const wrap = (s, maxW, h) => wrapCadText(String(s == null ? "" : s), maxW, effH(h));
      const blockH = (nLines, h) => Math.max(6.5, 2 * PAD_Y + effH(h) + (nLines - 1) * effH(h) * LINE_K);
      // testo su più righe in una cella; rowTop = bordo superiore della cella
      const textLines = (layer, x, rowTop, h, lines, color) => {
        lines.forEach((ln, k) => {
          const y = rowTop - PAD_Y - effH(h) - k * effH(h) * LINE_K;
          prims.push({ t: "text", layer, x, y, h: +effH(h).toFixed(3), str: ln, color: isLight && color === "#f8fafc" ? txtCol : color, align: "left" });
        });
      };

      const showDesc = state.showTableDesc !== false && !state.hideTableDesc;
      const colDefs = [
        { key: "pos", header: "POS", col: "#cbd5e1", wrap: false },
        { key: "code", header: "SIGLA LINEA", col: "#38bdf8", wrap: true, prio: 2 },
        ...(showDesc ? [{ key: "desc", header: "DESCRIZIONE UTENZA", col: "#f8fafc", wrap: true, prio: 1, grow: true, minW: 30 }] : []),
        { key: "type", header: "TIPO CAVO", col: "#f8fafc", wrap: true, prio: 3 },
        { key: "form", header: "FORMAZIONE", col: "#f8fafc", wrap: true, prio: 4 },
        { key: "diam", header: "Ø mm", col: "#f8fafc", wrap: false },
        { key: "rmin", header: "R min", col: "#f8fafc", wrap: false },
        { key: "posa", header: "POSA", col: "#f8fafc", wrap: false }
      ];

      const rowsData = state.cables.map((c, idx) => {
        const isUni = isUnipolarCable(c);
        return {
          isUni,
          pos: `#${idx + 1}`,
          code: c.code,
          desc: cleanUtenzaDescription(c.desc, c.code) || c.desc || "-",
          type: getDisplayCableType(c, state.cables),
          form: c.form,
          diam: String(c.d),
          rmin: `${Math.round(c.d * (c.bendK || 10))}mm`,
          posa: isUni ? "1X UNI" : (c.sys === "SPECIAL_ELV" ? "ELV" : "MULTI")
        };
      });

      // Larghezze: naturale (tutto su una riga) e minima (parola più lunga)
      const longestWord = (s, h) => Math.max(0, ...String(s || "").split(/\s+/).map(w => tw(w, h)));
      colDefs.forEach(cd => {
        const vals = rowsData.map(r => r[cd.key]);
        const nat = Math.max(tw(cd.header, T_HEAD), ...vals.map(v => tw(v, T_BODY)));
        const minHead = longestWord(cd.header, T_HEAD);
        const minVal = cd.wrap ? Math.max(0, ...vals.map(v => longestWord(v, T_BODY))) : Math.max(0, ...vals.map(v => tw(v, T_BODY)));
        cd.nat = Math.ceil(nat + 2 * PAD_X);
        cd.min = Math.ceil(Math.max(minHead, minVal, cd.minW ? cd.minW - 2 * PAD_X : 0) + 2 * PAD_X);
        cd.w = cd.nat;
      });
      let tabSum = colDefs.reduce((a, c) => a + c.w, 0);
      if (tabSum > TAB_MAX_W) {
        let excess = tabSum - TAB_MAX_W;
        colDefs.filter(c => c.wrap).sort((a, b) => a.prio - b.prio).forEach(c => {
          if (excess <= 0) return;
          const r = Math.min(excess, c.w - c.min);
          if (r > 0) { c.w -= r; excess -= r; }
        });
      } else {
        const grow = colDefs.find(c => c.grow) || colDefs.find(c => c.key === "code");
        grow.w += TAB_MAX_W - tabSum;
      }
      colDefs.forEach(c => { c.w = +c.w.toFixed(1); });
      const colW = colDefs.map(c => c.w);
      const tabW = +colW.reduce((a, b) => a + b, 0).toFixed(1);

      const cellLines = (txt, cd, h) => cd.wrap || tw(txt, h) > cd.w - 2 * PAD_X ? wrap(txt, cd.w - 2 * PAD_X, h) : [String(txt)];
      const titleLines = wrap(`1. DISTINTA CAVI POSATI NELLA SEZIONE - ${state.title}`, tabW - 8, T_TITLE);
      const titleH = Math.max(10, blockH(titleLines.length, T_TITLE));
      const headCells = colDefs.map(cd => wrap(cd.header, cd.w - 2 * PAD_X, T_HEAD));
      const headerH = blockH(Math.max(...headCells.map(l => l.length)), T_HEAD);
      const bodyRows = rowsData.map(r => {
        const cells = colDefs.map(cd => cellLines(r[cd.key], cd, T_BODY));
        return { r, cells, h: blockH(Math.max(...cells.map(l => l.length)), T_BODY) };
      });
      const emptyLines = wrap("Canalina vuota (0 cavi posati) - Importa un DWG/DXF reale", tabW - 12, T_BODY);
      const bodyH = bodyRows.length ? bodyRows.reduce((a, b) => a + b.h, 0) : blockH(emptyLines.length, T_BODY);
      const tableInnerH = titleH + headerH + bodyH;

      let rightX, topY;
      if (isMinimal) {
        // LAYOUT MINIMAL: Tabella posizionata SOPRA la vista 2D, centrata sull'asse della canalina
        const xCenter = W / 2;
        rightX = xCenter - tabW / 2;
        const topOf2D = showCallouts && (leftC.length > 0 || rightC.length > 0)
          ? calloutBaseY + Math.max(leftC.length, rightC.length) * stepY
          : ceilY;
        const spacingAbove2D = 28;
        topY = topOf2D + spacingAbove2D + tableInnerH;
      } else {
        // LAYOUT STANDARD: Tabella sulla colonna destra
        rightX = Math.max(W + 35 + maxRW, leftBoxX + leftBoxW) + 24;
        topY = Math.max(H + 38, calloutBaseY + (showCallouts ? Math.max(leftC.length, rightC.length) * stepY : 0)) + titleH;
      }

      // Titolo
      rect("TABELLA", rightX, topY - titleH, tabW, titleH, "#38bdf8", boxBg, true);
      textLines("TABELLA", rightX + 4, topY, T_TITLE, titleLines, "#38bdf8");
      // Intestazioni
      let cursorY = topY - titleH;
      rect("TABELLA", rightX, cursorY - headerH, tabW, headerH, "#64748b", boxAlt, true);
      let cx = rightX;
      colDefs.forEach((cd, i) => {
        textLines("TABELLA", cx + PAD_X, cursorY, T_HEAD, headCells[i], "#cbd5e1");
        cx += cd.w;
      });
      cursorY -= headerH;
      // Righe
      if (!bodyRows.length) {
        const h = blockH(emptyLines.length, T_BODY);
        rect("TABELLA", rightX, cursorY - h, tabW, h, "#475569", boxBg, true);
        textLines("TABELLA", rightX + 6, cursorY, T_BODY, emptyLines, "#94a3b8");
        cursorY -= h;
      } else {
        bodyRows.forEach((row, idx) => {
          rect("TABELLA", rightX, cursorY - row.h, tabW, row.h, "#475569", idx % 2 === 0 ? boxBg : boxAlt, true);
          let rx = rightX;
          colDefs.forEach((cd, i) => {
            const color = cd.key === "code" ? "#38bdf8" : (cd.key === "posa" && row.r.isUni ? "#fbbf24" : cd.col);
            textLines("TABELLA", rx + PAD_X, cursorY, T_BODY, row.cells[i], color);
            rx += cd.w;
          });
          cursorY -= row.h;
        });
      }

      let currentRightY = cursorY;

      // 2. DIAGRAMMA CURVA DI CARICO IN TAVOLA CAD (Opzionale - escluso in Stampa Minimal)
      if (!isMinimal && state.showLoadChart !== false) {
        const chartH = 54, chartY = currentRightY - chartH - 22;
        currentRightY = chartY - 6;
        rect("CURVA_CARICO", rightX, chartY, tabW, chartH + 16, "#38bdf8", boxBg, true);
        line("CURVA_CARICO", rightX, chartY + chartH + 1, rightX + tabW, chartY + chartH + 1, "#334155", 0.4);
        if (state.support === "none") {
          text("CURVA_CARICO", rightX + 4, chartY + chartH + 9.5, 2.5, `2. DIAGRAMMA CURVA DI CARICO E FRECCIA - RIF. CEI EN 61537 (SWL)`, "#38bdf8", "left", tabW - 8);
          text("CURVA_CARICO", rightX + 4, chartY + chartH + 3.8, 2.0, `Configurazione: Nessun supporto previsto (No Staffaggio)`, "#cbd5e1", "left", tabW - 8);
          text("CURVA_CARICO", rightX + tabW / 2, chartY + chartH / 2 + 2, 2.6, `STAFFAGGIO NON PREVISTO (NO STAFFAGGIO)`, "#64748b", "center");
          text("CURVA_CARICO", rightX + tabW / 2, chartY + chartH / 2 - 5, 1.85, `Canalizzazione autoportante / staffata a cura dell'installatore`, "#475569", "center");
        } else {
        text("CURVA_CARICO", rightX + 4, chartY + chartH + 9.5, 2.5, `2. DIAGRAMMA CURVA DI CARICO E FRECCIA - RIF. CEI EN 61537 (SWL)`, "#38bdf8", "left", tabW - 8);
        text("CURVA_CARICO", rightX + 4, chartY + chartH + 3.8, 2.0, `Supporto: ${sup.name} | Passo Ls = ${state.spanM.toFixed(2)} m | Freccia f = ${metrics.deflectionMm} mm (Lim. ${metrics.maxDeflectionMm} mm)`, "#cbd5e1", "left", tabW - 8);

        const gx0 = rightX + 26, gy0 = chartY + 11, gw = tabW - 42, gh = chartH - 14;
        line("CURVA_CARICO", gx0, gy0, gx0 + gw, gy0, "#94a3b8", 0.55);
        line("CURVA_CARICO", gx0, gy0, gx0, gy0 + gh, "#94a3b8", 0.55);

        const qAt1m = calcAllowedLinearLoadKgM(state.support, 1.0);
        const maxScaleKgM = Math.max(25, Math.ceil(Math.max(qAt1m, metrics.totalKgM * 1.3) / 10) * 10);
        for (let frac = 0; frac <= 1.0; frac += 0.25) {
          const gy = gy0 + frac * gh;
          line("CURVA_CARICO", gx0, gy, gx0 + gw, gy, "#334155", 0.28);
          text("CURVA_CARICO", gx0 - 2.5, gy - 0.8, 1.85, `${Math.round(frac * maxScaleKgM)}`, "#94a3b8", "right");
        }
        text("CURVA_CARICO", gx0 - 3, gy0 + gh + 1.8, 1.85, "kg/m", "#38bdf8", "right");

        const spans = [1.0, 1.1, 1.25, 1.4, 1.5, 1.65, 1.75, 1.9, 2.0, 2.25, 2.5, 2.75, 3.0];
        let prevPt = null;
        spans.forEach(s => {
          const gx = gx0 + ((s - 1.0) / 2.0) * gw;
          if (Math.abs(s * 2 - Math.round(s * 2)) < 0.01) {
            line("CURVA_CARICO", gx, gy0 - 1.5, gx, gy0 + gh, "#334155", 0.28);
            text("CURVA_CARICO", gx, gy0 - 4.8, 1.85, `Ls=${s.toFixed(1)}m`, "#94a3b8", "center");
          }
          const qVal = Math.min(maxScaleKgM, calcAllowedLinearLoadKgM(state.support, s));
          const gy = gy0 + (qVal / maxScaleKgM) * gh;
          if (prevPt) line("CURVA_CARICO", prevPt.x, prevPt.y, gx, gy, "#22c55e", 0.85);
          prevPt = { x: gx, y: gy };
        });

        const wpX = gx0 + ((state.spanM - 1.0) / 2.0) * gw;
        const wpY = gy0 + Math.min(1.0, metrics.totalKgM / maxScaleKgM) * gh;
        const limY = gy0 + Math.min(1.0, metrics.qMaxKgM / maxScaleKgM) * gh;

        line("CURVA_CARICO", wpX, gy0, wpX, limY, "#f59e0b", 0.5, 0.85);
        line("CURVA_CARICO", gx0, wpY, wpX, wpY, "#f59e0b", 0.5, 0.85);
        circle("CURVA_CARICO", wpX, limY, 1.6, "#22c55e", "#22c55e", true);
        circle("CURVA_CARICO", wpX, wpY, 2.4, metrics.totalKgM <= metrics.qMaxKgM ? "#f59e0b" : "#ef4444", metrics.totalKgM <= metrics.qMaxKgM ? "#fbbf24" : "#ef4444", true);

        const wpAlign = wpX > gx0 + gw * 0.55 ? "right" : "left";
        const wpTextX = wpAlign === "right" ? wpX - 4 : wpX + 4;
        text("CURVA_CARICO", wpTextX, wpY + 1.5, 2.0, `Lavoro: ${metrics.totalKgM} kg/m @ ${state.spanM}m (Max ${metrics.qMaxKgM} kg/m)`, "#fbbf24", wpAlign);
        }
      }

      // 3. COMPUTO METRICO BOM (Opzionale - escluso in Stampa Minimal)
      if (!isMinimal && state.showBOM !== false) {
        const bomTop = currentRightY - 2;
        const bTitle = wrap(`3. COMPUTO METRICO E DISTINTA MATERIALI (BOM ${state.brand} - Tratto ${state.lengthM}m)`, tabW - 8, 2.5);
        const bTitleH = Math.max(9, blockH(bTitle.length, 2.5));
        rect("TABELLA", rightX, bomTop - bTitleH, tabW, bTitleH, "#4ade80", boxBg, true);
        textLines("TABELLA", rightX + 4, bomTop, 2.5, bTitle, "#4ade80");
        let by = bomTop - bTitleH;
        currentRightY = by;
        const qtyW = 64, descW = tabW - qtyW;
        metrics.bom.forEach((b, i) => {
          const l1 = wrap(`${b.code} | ${b.desc}`, descW - 6, T_BOM);
          const l2 = wrap(`Q.ta: ${b.qty} ${b.um} (${b.note})`, qtyW - 4, T_BOM);
          const h = Math.max(7, blockH(Math.max(l1.length, l2.length), T_BOM));
          rect("TABELLA", rightX, by - h, tabW, h, "#334155", i % 2 === 0 ? boxBg : boxAlt, true);
          textLines("TABELLA", rightX + 3, by, T_BOM, l1, "#f8fafc");
          textLines("TABELLA", rightX + descW + 1, by, T_BOM, l2, "#4ade80");
          by -= h;
          currentRightY = by;
        });
      }

      // 4. CARTIGLIO PROGETTO E COMMITTENTE (Opzionale - escluso in Stampa Minimal)
      if (!isMinimal && state.showCartiglio !== false) {
        const c1 = wrap(`COMMITTENTE: ${state.tb.client} | CODICE: ${state.tb.docCode}`, tabW - 8, 2.3);
        const c2 = wrap(`PROGETTISTA: ${state.tb.author} | SCALA: ${state.scale || "1:1"} (${state.tb.scaleRev})`, tabW - 8, 2.2);
        const h1 = blockH(c1.length, 2.3), h2 = blockH(c2.length, 2.2);
        const tbH = Math.max(20, h1 + h2 - PAD_Y);
        const tbY = currentRightY - 4 - tbH;
        currentRightY = tbY;
        rect("CORNICE", rightX, tbY, tabW, tbH, "#38bdf8", boxBg, true);
        textLines("CORNICE", rightX + 4, tbY + tbH, 2.3, c1, "#f8fafc");
        textLines("CORNICE", rightX + 4, tbY + tbH - h1 + PAD_Y, 2.2, c2, "#fbbf24");
      }

      let minX, maxX, minY, maxY;
      if (isMinimal) {
        minX = Math.min(-24, rightX - 12);
        maxX = Math.max(W + 24, rightX + tabW + 12);
        minY = Math.min(-thk - 28, lowestY - 10);
        maxY = topY + 18;
      } else {
        minX = Math.min(-48 - maxLW - 10, leftBoxX - 10);
        maxX = rightX + tabW + 12;
        minY = Math.min(lowestY - 12, currentRightY - 10);
        maxY = topY + 12; // topY = bordo superiore del titolo della distinta
      }
      rect("CORNICE", minX, minY, maxX - minX, maxY - minY, "#475569", null, false);
      text("CORNICE", minX + 6, maxY - 8, 3.5, `PARTICOLARE COSTRUTTIVO ESECUTIVO: ${state.title} (SCALA ${state.scale || "1:1"})`, "#f8fafc", "left", (maxX - minX) * 0.65);

      return { prims, bounds: { minX, maxX, minY, maxY }, rightBounds: { minX: rightX - 8, maxX, minY: currentRightY - 8, maxY: topY + (isMinimal ? 12 : 2) } };
    }

