
    function build3DIsoScene(prims, leftBoxX, lowestY, leftBoxW, W, H, thk, mat, sup) {
      const isoH = 126;
      const isoY = lowestY - isoH - 12;
      const isLight = state.theme === "light";
      const boxBg = isLight ? "#f8fafc" : "#0f172a";
      const boxBorder = isLight ? "#cbd5e1" : "#38bdf8";

      const line = (layer, x1, y1, x2, y2, color, lw = 0.4, alpha = 1) => prims.push({ t: "line", layer, x1, y1, x2, y2, color, lw, alpha });
      const rect = (layer, x, y, w, h, color, fill, solid = false) => prims.push({ t: "rect", layer, x, y, w, h, color, fill, solid });
      const poly = (layer, pts, color, fill = null, lw = 0.4, alpha = 1) => prims.push({ t: "poly", layer, pts, color, fill, lw, alpha });
      const txtMul = (typeof state.textScale === "number" && state.textScale > 0) ? state.textScale : 1.0;
      const text = (layer, x, y, h, str, color, align = "left", maxW = null) => {
        let s = String(str || "");
        if (maxW) {
          const maxCh = Math.max(4, Math.floor((maxW - 2) / (h * txtMul * 0.56)));
          if (s.length > maxCh) s = s.substring(0, maxCh - 2) + "..";
        }
        const effectiveH = +(h * txtMul).toFixed(3);
        prims.push({ t: "text", layer, x, y, h: effectiveH, str: s, color, align });
      };

      // Riquadro contenitore
      rect("VISTA_3D_ISO", leftBoxX, isoY, leftBoxW, isoH, boxBorder, boxBg, true);

      const trayLabels = {
        solid: "Canale Chiuso Cieco",
        perforated: "Passerella Asolata / Forata",
        mesh: "Passerella a Filo / Rete (Cablofil)",
        ladder: "Passerella a Pioli / Scaletta"
      };
      const trayTypeStr = trayLabels[state.trayType] || "Passerella Portacavi";

      const hasSupport = Boolean(state.support && state.support !== "none");

      if (hasSupport) {
        text("VISTA_3D_ISO", leftBoxX + 6, isoY + isoH - 7, 2.3,
          `ASSONOMETRIA 3D COSTRUTTIVA — ${trayTypeStr.toUpperCase()} (PASSO MENSOLE Ls = ${state.spanM.toFixed(2)} m)`,
          "#38bdf8", "left", leftBoxW - 12);
        text("VISTA_3D_ISO", leftBoxX + 6, isoY + isoH - 12, 1.85,
          `Supporto: ${sup.name} | Portata Limite SWL: ${metrics.qMaxKgM} kg/m | Freccia f = ${metrics.deflectionMm} mm (Amm. ${metrics.maxDeflectionMm} mm)`,
          isLight ? "#475569" : "#94a3b8", "left", leftBoxW - 12);
      } else {
        text("VISTA_3D_ISO", leftBoxX + 6, isoY + isoH - 7, 2.3,
          `ASSONOMETRIA 3D COSTRUTTIVA — ${trayTypeStr.toUpperCase()}`,
          "#38bdf8", "left", leftBoxW - 12);
        text("VISTA_3D_ISO", leftBoxX + 6, isoY + isoH - 12, 1.85,
          `Canale L=${W}mm H=${H}mm | Peso Cavi: ${metrics.totalKgM} kg/m | Riempimento: ${metrics.fillPct}%`,
          isLight ? "#475569" : "#94a3b8", "left", leftBoxW - 12);
      }

      // Area interna utile per proiezione 3D
      const padX = 14, padY = 10;
      const uMinX = leftBoxX + padX;
      const uMaxX = leftBoxX + leftBoxW - padX;
      const uMinY = isoY + padY;
      const uMaxY = isoY + isoH - padY - 14;
      const availW = uMaxX - uMinX;
      const availH = uMaxY - uMinY;

      // Geometria assonometrica calibrata
      const angZ = 18 * Math.PI / 180;
      const angX = 34 * Math.PI / 180;
      const cosZ = Math.cos(angZ), sinZ = Math.sin(angZ);
      const cosX = Math.cos(angX), sinX = Math.sin(angX);

      const zMax = 6.4;
      const z1 = 1.4, z2 = 5.0;

      const keyPts = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0.45, z: 0 },
        { x: 1, y: 0.45, z: 0 },
        { x: 0, y: 0, z: zMax },
        { x: 1, y: 0, z: zMax },
        { x: 0, y: 0.45, z: zMax },
        { x: 1, y: 0.45, z: zMax }
      ];

      if (hasSupport) {
        keyPts.push(
          { x: 1.25, y: -0.42, z: z1 },
          { x: -0.20, y: -0.42, z: z1 },
          { x: 1.25, y: 0.65, z: z2 },
          { x: -0.20, y: 0.65, z: z2 },
          { x: 0.5, y: -0.32, z: z1 },
          { x: 0.5, y: -0.32, z: z2 }
        );
      }

      const rawProj = keyPts.map(p => ({
        u: p.z * cosZ - p.x * cosX,
        v: p.z * sinZ + p.x * sinX + p.y * 1.05
      }));

      const minU = Math.min(...rawProj.map(p => p.u));
      const maxU = Math.max(...rawProj.map(p => p.u));
      const minV = Math.min(...rawProj.map(p => p.v));
      const maxV = Math.max(...rawProj.map(p => p.v));
      const uSpan = maxU - minU;
      const vSpan = maxV - minV;

      const scale = Math.min((availW - 6) / uSpan, (availH - 4) / vSpan);
      const fittedW = uSpan * scale;
      const fittedH = vSpan * scale;
      const offsetX = uMinX + (availW - fittedW) / 2 - minU * scale;
      const offsetY = uMinY + (availH - fittedH) / 2 - minV * scale;

      const iso = (x, y, z) => ({
        x: +(offsetX + (z * cosZ - x * cosX) * scale).toFixed(2),
        y: +(offsetY + (z * sinZ + x * sinX + y * 1.05) * scale).toFixed(2)
      });

      const iLine = (x1, y1, z1, x2, y2, z2, c, lw = 0.4, alpha = 1) => {
        const p1 = iso(x1, y1, z1), p2 = iso(x2, y2, z2);
        line("VISTA_3D_ISO", p1.x, p1.y, p2.x, p2.y, c, lw, alpha);
      };

      const iPoly = (pts3d, cStroke, cFill, lw = 0.4, alpha = 1) => {
        const pts2d = pts3d.map(p => iso(p.x, p.y, p.z));
        poly("VISTA_3D_ISO", pts2d, cStroke, cFill, lw, alpha);
      };

      // Palette cromatica materiali e finiture
      const colSteelStroke = isLight ? "#64748b" : "#94a3b8";
      const colWallPlateFill = isLight ? "#e2e8f0" : "#1e293b";
      const colArmTop = isLight ? "#f1f5f9" : "#475569";
      const colArmSide = isLight ? "#cbd5e1" : "#334155";
      const colTrayRear = isLight ? "#cbd5e1" : "#1e293b";
      const colTrayFloor = isLight ? "#e2e8f0" : "#223147";
      const colTrayFront = isLight ? "#f1f5f9" : "#2a3b52";

      // Testate frontali dei cavi (sezione a z = 0 con guaina e anima in rame)
      const iCableCap = (cx, cy, r, cSheathStroke, cSheathFill, cCoreFill = "#f59e0b") => {
        const ptsOuter = [];
        const nSteps = 14;
        for (let i = 0; i < nSteps; i++) {
          const ang = (i * 2 * Math.PI) / nSteps;
          ptsOuter.push({ x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), z: 0 });
        }
        iPoly(ptsOuter, cSheathStroke, cSheathFill, 0.6);

        const ptsInner = [];
        const rCore = r * 0.65;
        for (let i = 0; i < nSteps; i++) {
          const ang = (i * 2 * Math.PI) / nSteps;
          ptsInner.push({ x: cx + rCore * Math.cos(ang), y: cy + rCore * Math.sin(ang), z: 0 });
        }
        iPoly(ptsInner, "#d97706", cCoreFill, 0.5);
      };

      // 1. PARETE DI FONDO (Linea guida e retino - disegnata solo con staffe a parete)
      if (hasSupport && state.support.startsWith("wall_")) {
        iLine(1.18, -0.42, 0.3, 1.18, -0.42, zMax - 0.1, isLight ? "#cbd5e1" : "#334155", 0.35);
        iLine(1.18, 0.60, 0.3, 1.18, 0.60, zMax - 0.1, isLight ? "#cbd5e1" : "#334155", 0.35);
      }

      // 2. SUPPORTI E MENSOLE A SBALZO (disegnati solo se presente staffaggio)
      if (hasSupport) {
        [z1, z2].forEach(zs => {
          if (state.support.startsWith("wall_")) {
          // Piastra profilata di ancoraggio a parete
          iPoly([
            { x: 1.18, y: -0.40, z: zs - 0.07 },
            { x: 1.18, y: 0.50, z: zs - 0.07 },
            { x: 1.18, y: 0.50, z: zs + 0.07 },
            { x: 1.18, y: -0.40, z: zs + 0.07 }
          ], colSteelStroke, colWallPlateFill, 0.6);
          // Tasselli M10 / Asola piastra
          iLine(1.18, 0.38, zs - 0.03, 1.18, 0.38, zs + 0.03, "#38bdf8", 0.8);
          iLine(1.18, -0.32, zs - 0.03, 1.18, -0.32, zs + 0.03, "#38bdf8", 0.8);

          // Braccio mensola a sbalzo (profilato sagomato a C con spessore e sbalzo)
          iPoly([
            { x: 1.18, y: -0.05, z: zs - 0.05 },
            { x: -0.12, y: -0.05, z: zs - 0.05 },
            { x: -0.12, y: -0.12, z: zs - 0.05 },
            { x: 1.18, y: -0.12, z: zs - 0.05 }
          ], colSteelStroke, colArmSide, 0.65);
          iPoly([
            { x: 1.18, y: -0.05, z: zs - 0.05 },
            { x: -0.12, y: -0.05, z: zs - 0.05 },
            { x: -0.12, y: -0.05, z: zs + 0.05 },
            { x: 1.18, y: -0.05, z: zs + 0.05 }
          ], "#cbd5e1", colArmTop, 0.5);

          // Puntone diagonale di scarico a 45°
          if (state.support !== "wall_light") {
            iPoly([
              { x: 1.18, y: -0.35, z: zs },
              { x: 0.35, y: -0.12, z: zs },
              { x: 0.42, y: -0.12, z: zs },
              { x: 1.18, y: -0.29, z: zs }
            ], colSteelStroke, colArmSide, 0.6);
          }
        } else if (state.support === "ceiling_trap") {
          // Traversa orizzontale a trapezio sotto canalina
          iPoly([
            { x: -0.14, y: -0.06, z: zs - 0.04 },
            { x: 1.14, y: -0.06, z: zs - 0.04 },
            { x: 1.14, y: -0.12, z: zs - 0.04 },
            { x: -0.14, y: -0.12, z: zs - 0.04 }
          ], colSteelStroke, colArmSide, 0.65);
          // Tiranti verticali M8/M10 verso soffitto
          iLine(-0.10, -0.06, zs, -0.10, 0.68, zs, "#cbd5e1", 0.7);
          iLine(1.10, -0.06, zs, 1.10, 0.68, zs, "#cbd5e1", 0.7);
          // Morsetti di ancoraggio a soffitto
          iPoly([
            { x: -0.14, y: 0.68, z: zs - 0.05 },
            { x: -0.06, y: 0.68, z: zs - 0.05 },
            { x: -0.06, y: 0.68, z: zs + 0.05 },
            { x: -0.14, y: 0.68, z: zs + 0.05 }
          ], "#38bdf8", colArmSide, 0.6);
          iPoly([
            { x: 1.06, y: 0.68, z: zs - 0.05 },
            { x: 1.14, y: 0.68, z: zs - 0.05 },
            { x: 1.14, y: 0.68, z: zs + 0.05 },
            { x: 1.06, y: 0.68, z: zs + 0.05 }
          ], "#38bdf8", colArmSide, 0.6);
        } else if (state.support === "ceiling_single") {
          // Pendino singolo centrale
          iLine(0.50, -0.06, zs, 0.50, 0.68, zs, "#cbd5e1", 0.85);
          iPoly([
            { x: -0.08, y: -0.06, z: zs - 0.04 },
            { x: 1.08, y: -0.06, z: zs - 0.04 },
            { x: 1.08, y: -0.12, z: zs - 0.04 },
            { x: -0.08, y: -0.12, z: zs - 0.04 }
          ], colSteelStroke, colArmSide, 0.65);
        } else if (state.support === "floor_omega") {
          // Supporto a pavimento omega
          iPoly([
            { x: -0.06, y: -0.05, z: zs },
            { x: -0.06, y: -0.32, z: zs },
            { x: 0.02, y: -0.32, z: zs },
            { x: 0.02, y: -0.05, z: zs }
          ], colSteelStroke, colArmSide, 0.65);
          iPoly([
            { x: 0.98, y: -0.05, z: zs },
            { x: 0.98, y: -0.32, z: zs },
            { x: 1.06, y: -0.32, z: zs },
            { x: 1.06, y: -0.05, z: zs }
          ], colSteelStroke, colArmSide, 0.65);
          iLine(-0.10, -0.32, zs, 1.10, -0.32, "#64748b", 0.5);
        }
      });
      }

      // 3. CANALINA — PARETE POSTERIORE E FONDO IN 3D
      // Parete posteriore solida (x = 1.0)
      iPoly([
        { x: 1.0, y: 0, z: 0 },
        { x: 1.0, y: 0.45, z: 0 },
        { x: 1.0, y: 0.45, z: zMax },
        { x: 1.0, y: 0, z: zMax }
      ], colSteelStroke, colTrayRear, 0.65);
      // Bordino superiore posteriore a C
      iLine(1.0, 0.45, 0, 0.95, 0.45, 0, "#94a3b8", 0.5);
      iLine(0.95, 0.45, 0, 0.95, 0.45, zMax, "#94a3b8", 0.45);
      iLine(0.95, 0.45, zMax, 1.0, 0.45, zMax, "#94a3b8", 0.5);

      // Piano del fondo canalina solido (y = 0, da x=0 a x=1)
      iPoly([
        { x: 0, y: 0, z: 0 },
        { x: 1.0, y: 0, z: 0 },
        { x: 1.0, y: 0, z: zMax },
        { x: 0, y: 0, z: zMax }
      ], colSteelStroke, colTrayFloor, 0.65);

      // 4. STILIZZAZIONE CARATTERISTICA DELLA TIPOLOGIA DI PASSERELLA
      if (state.trayType === "perforated") {
        // Canale asolato con file di forature regolari
        for (let z = 0.45; z <= zMax - 0.45; z += 0.55) {
          iLine(0.25, 0.005, z, 0.25, 0.005, z + 0.28, "#f59e0b", 0.5);
          iLine(0.50, 0.005, z, 0.50, 0.005, z + 0.28, "#f59e0b", 0.5);
          iLine(0.75, 0.005, z, 0.75, 0.005, z + 0.28, "#f59e0b", 0.5);
          iLine(1.0, 0.22, z, 1.0, 0.22, z + 0.25, "#f59e0b", 0.45);
        }
      } else if (state.trayType === "ladder") {
        // Passerella a pioli (traversine sagomate a C con spessore ogni passo)
        for (let z = 0.35; z <= zMax - 0.35; z += 0.65) {
          iPoly([
            { x: 0, y: 0.03, z: z },
            { x: 1.0, y: 0.03, z: z },
            { x: 1.0, y: 0.03, z: z + 0.12 },
            { x: 0, y: 0.03, z: z + 0.12 }
          ], "#f59e0b", isLight ? "#fef3c7" : "#78350f", 0.65);
          iLine(0, 0.035, z + 0.06, 1.0, 0.035, z + 0.06, "#fbbf24", 0.5);
        }
      } else if (state.trayType === "mesh") {
        // Passerella a filo / rete (Cablofil)
        [0.25, 0.50, 0.75].forEach(rx => {
          iLine(rx, 0.01, 0, rx, 0.01, zMax, "#0284c7", 0.55);
        });
        for (let z = 0.25; z <= zMax - 0.25; z += 0.45) {
          iLine(0, 0.40, z, 0, 0, z, "#38bdf8", 0.6);
          iLine(0, 0, z, 1.0, 0, z, "#38bdf8", 0.6);
          iLine(1.0, 0, z, 1.0, 0.40, z, "#38bdf8", 0.6);
        }
      } else if (state.trayType === "solid") {
        // Canale cieco liscio con pieghe di irrigidimento
        iLine(0.33, 0.005, 0, 0.33, 0.005, zMax, isLight ? "#cbd5e1" : "#334155", 0.45);
        iLine(0.67, 0.005, 0, 0.67, 0.005, zMax, isLight ? "#cbd5e1" : "#334155", 0.45);
      }

      // Coperchio superiore 3D a scatto se abilitato
      if (state.cover !== "none") {
        iPoly([
          { x: -0.04, y: 0.48, z: 0 },
          { x: 1.04, y: 0.48, z: 0 },
          { x: 1.04, y: 0.48, z: zMax },
          { x: -0.04, y: 0.48, z: zMax }
        ], "#38bdf8", isLight ? "#e0f2fe" : "#0c4a6e", 0.65, 0.85);
      }

      // 5. FASCI CAVI 3D REALI CORRISPONDENTI ESATTAMENTE ALLA SEZIONE 1:1
      if (state.cables && state.cables.length > 0) {
        // Ordina i cavi per profondità isometrica decrescente (Painter's algorithm):
        // Cavi con X maggiore (vicini alla parete posteriore x=1.0) e Y minore disegnati per primi,
        // cavi in primo piano (X minore verso il bordo anteriore x=0) disegnati sopra.
        const sortedCables = [...state.cables].sort((a, b) => {
          const depthA = a.x * 10 - a.y * 3;
          const depthB = b.x * 10 - b.y * 3;
          return depthB - depthA;
        });

        sortedCables.forEach((c) => {
          const isUni = isUnipolarCable(c);
          const isPE = /PE|TERRA/i.test(c.code) || c.sys === "PE" || /PE/i.test(c.form || "");
          const isSignal = c.sys === "SPECIAL_ELV" || /IRAI|EVAC|KNX|BUS|FIBRA|CAT|UTP|FTP/i.test(c.type || "");
          const isFire = c.sys === "BT_FIRE" || /FTG|REI|INCEND/i.test(c.type || "");

          let cSheathStroke, cSheathFill, cCrest, cCoreFill;
          if (isPE) {
            cSheathStroke = "#15803d"; cSheathFill = "#22c55e"; cCrest = "#86efac"; cCoreFill = "#f59e0b";
          } else if (isSignal) {
            cSheathStroke = "#0369a1"; cSheathFill = "#0284c7"; cCrest = "#7dd3fc"; cCoreFill = "#38bdf8";
          } else if (isFire) {
            cSheathStroke = "#991b1b"; cSheathFill = "#dc2626"; cCrest = "#fca5a5"; cCoreFill = "#fbbf24";
          } else if (isUni) {
            cSheathStroke = "#b45309"; cSheathFill = "#d97706"; cCrest = "#fde68a"; cCoreFill = "#ea580c";
          } else {
            cSheathStroke = isLight ? "#475569" : "#1e293b";
            cSheathFill   = isLight ? "#64748b" : "#334155";
            cCrest        = isLight ? "#94a3b8" : "#64748b";
            cCoreFill     = "#f59e0b";
          }

          const normCx = Math.max(0.04, Math.min(0.96, c.x / W));
          const normCy = Math.max(0.02, Math.min(0.40, (c.y / H) * 0.38));
          const normR  = Math.max(0.010, Math.min(0.065, ((c.d / 2) / W) * 0.92));

          const xLeft  = Math.max(0.01, normCx - normR);
          const xRight = Math.min(0.99, normCx + normR);
          const yTop   = normCy + normR;

          // Corpo cilindrico estruso lungo l'asse Z da z=0 a z=zMax
          iPoly([
            { x: xLeft,  y: normCy, z: 0 },
            { x: xRight, y: normCy, z: 0 },
            { x: xRight, y: normCy, z: zMax },
            { x: xLeft,  y: normCy, z: zMax }
          ], cSheathStroke, cSheathFill, 0.55);

          // Linea di cresta longitudinale / riflesso luce
          iLine(normCx, yTop, 0, normCx, yTop, zMax, cCrest, 0.45);

          // Calotta frontale circolare della sezione a z = 0
          iCableCap(normCx, normCy, normR, cSheathStroke, cSheathFill, cCoreFill);
        });
      }

      // 6. FASCETTE DI ANCORAGGIO CAVI IN 3D ALLE MENSOLE (avvolgenti il fascio reale)
      if (hasSupport && state.clamps && state.cables && state.cables.length > 0) {
        const minX = Math.max(0.04, Math.min(...state.cables.map(c => Math.max(0.04, (c.x - c.d / 2) / W))));
        const maxX = Math.min(0.96, Math.max(...state.cables.map(c => Math.min(0.96, (c.x + c.d / 2) / W))));
        const maxY = Math.min(0.42, Math.max(...state.cables.map(c => ((c.y + c.d / 2) / H) * 0.38)) + 0.02);
        [z1, z2].forEach(zs => {
          iPoly([
            { x: Math.max(0.02, minX - 0.02), y: maxY, z: zs - 0.04 },
            { x: Math.min(0.98, maxX + 0.02), y: maxY, z: zs - 0.04 },
            { x: Math.min(0.98, maxX + 0.02), y: maxY, z: zs + 0.04 },
            { x: Math.max(0.02, minX - 0.02), y: maxY, z: zs + 0.04 }
          ], "#0891b2", "#06b6d4", 0.75);
        });
      }

      // 7. SETTI SEPARATORI METALLICI LONGITUDINALI (Se presenti)
      if (state.septums > 0) {
        getSeptumXList().forEach((sx, sIdx) => {
          const normX = +(sx / state.width).toFixed(3);
          iPoly([
            { x: normX, y: 0, z: 0 },
            { x: normX, y: 0.42, z: 0 },
            { x: normX, y: 0.42, z: zMax },
            { x: normX, y: 0, z: zMax }
          ], colSteelStroke, isLight ? "#cbd5e1" : "#475569", 0.6, 0.85);
          iLine(normX, 0.42, 0, normX, 0.42, zMax, "#38bdf8", 0.75);
          const pSep = iso(normX, 0.45, 0);
          text("VISTA_3D_ISO", pSep.x, pSep.y - 1.5, 1.6, `SETTO #${sIdx + 1}`, "#38bdf8", "center");
        });
      }

      // 8. BARRIERA TAGLIAFUOCO EI120 (Se reiCount > 0)
      if (state.reiCount > 0) {
        const midZ = (z1 + z2) / 2;
        iPoly([
          { x: -0.06, y: -0.06, z: midZ },
          { x: 1.06, y: -0.06, z: midZ },
          { x: 1.06, y: 0.50, z: midZ },
          { x: -0.06, y: 0.50, z: midZ }
        ], "#b91c1c", "#ef4444", 0.8, 0.75);
        const pRei = iso(1.08, 0.25, midZ);
        text("VISTA_3D_ISO", pRei.x + 2, pRei.y, 1.85, `SETTO EI120 (${state.reiCount}x)`, "#f87171", "left");
      }

      // 9. PARETE ANTERIORE DELLA CANALINA (Visibilità trasparente dei cavi interni)
      iPoly([
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0.35, z: 0 },
        { x: 0, y: 0.35, z: zMax },
        { x: 0, y: 0, z: zMax }
      ], colSteelStroke, colTrayFront, 0.65, 0.55);
      iLine(0, 0.35, 0, 0, 0.35, zMax, "#38bdf8", 0.8);
      iLine(0.04, 0.35, 0, 0.04, 0.35, zMax, "#0284c7", 0.45);

      // 10. TESTATA SEZIONE FRONTALE A Z = 0 (Sagoma a C in evidenza con spessore)
      iPoly([
        { x: -0.02, y: 0.36, z: 0 },
        { x: -0.02, y: -0.02, z: 0 },
        { x: 1.02, y: -0.02, z: 0 },
        { x: 1.02, y: 0.46, z: 0 },
        { x: 0.96, y: 0.46, z: 0 },
        { x: 0.96, y: 0.02, z: 0 },
        { x: 0.04, y: 0.02, z: 0 },
        { x: 0.04, y: 0.36, z: 0 }
      ], "#38bdf8", isLight ? "#e0f2fe" : "#0c4a6e", 0.85);

      // 11. QUOTA ASSONOMETRICA DEL PASSO TRA LE MENSOLE Ls (solo se presente staffaggio)
      if (hasSupport) {
        const dimY = -0.28;
        const pZ1 = iso(0.50, dimY, z1);
        const pZ2 = iso(0.50, dimY, z2);
        // Linee di testimone
        iLine(0.50, -0.10, z1, 0.50, dimY - 0.02, z1, "#38bdf8", 0.35);
        iLine(0.50, -0.10, z2, 0.50, dimY - 0.02, z2, "#38bdf8", 0.35);
        // Linea di quota
        line("VISTA_3D_ISO", pZ1.x, pZ1.y, pZ2.x, pZ2.y, "#f59e0b", 0.6);
        // Ticks a 45°
        line("VISTA_3D_ISO", pZ1.x - 1.5, pZ1.y - 1.5, pZ1.x + 1.5, pZ1.y + 1.5, "#f59e0b", 0.65);
        line("VISTA_3D_ISO", pZ2.x - 1.5, pZ2.y - 1.5, pZ2.x + 1.5, pZ2.y + 1.5, "#f59e0b", 0.65);

        const midPt = iso(0.50, dimY, (z1 + z2) / 2);
        text("VISTA_3D_ISO", midPt.x, midPt.y - 3.5, 2.15,
          `PASSO MENSOLE Ls = ${state.spanM.toFixed(2)} m (SWL = ${metrics.qMaxKgM} kg/m)`,
          "#fbbf24", "center");
      }

      return isoY;
    }

