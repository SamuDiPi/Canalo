    // ============================================================================
    // 8. ESPORTATORI CERTIFICATI FEDELI 1:1 (.DXF TRUECOLOR, .SCR, .DOC, .CSV) + MULTI-SEZIONE
    // ============================================================================
    let exportDxfOptions = {
      format: "AC1018", // Default: "AC1018" (AutoCAD & Revit Compatibile con Retini HATCH e TrueColor)
      fontFamily: "arial", // Default: "arial" (Arial standardizzato a 2.5mm)
      includeBackgrounds: true,
      includeLineweights: true,
      includeUnicode: true
    };

    function toggleExportOptionsModal() {
      const modal = document.getElementById("exportOptionsModal");
      if (!modal) return;
      const isOpening = modal.classList.contains("hidden");
      if (isOpening) {
        const selFmt = document.getElementById("selDxfFormat");
        const selFnt = document.getElementById("selDxfFont");
        const chkBg = document.getElementById("chkDxfBg");
        const chkLw = document.getElementById("chkDxfLw");
        const chkUni = document.getElementById("chkDxfUnicode");
        const selSc = document.getElementById("selDxfScale");
        const chkChart = document.getElementById("chkExportChart");
        const chkBOM = document.getElementById("chkExportBOM");
        const chkIso = document.getElementById("chkExportIso3D");
        const chkCart = document.getElementById("chkExportCartiglio");
        if (selFmt) selFmt.value = exportDxfOptions.format;
        if (selFnt) selFnt.value = exportDxfOptions.fontFamily;
        if (chkBg) chkBg.checked = exportDxfOptions.includeBackgrounds;
        if (chkLw) chkLw.checked = exportDxfOptions.includeLineweights;
        if (chkUni) chkUni.checked = exportDxfOptions.includeUnicode;
        if (selSc) selSc.value = state.scale || "1:1";
        if (chkChart) chkChart.checked = state.showLoadChart !== false;
        if (chkBOM) chkBOM.checked = state.showBOM !== false;
        if (chkIso) chkIso.checked = state.showIso3D !== false;
        if (chkCart) chkCart.checked = state.showCartiglio !== false;
        const chkTableDesc = document.getElementById("chkExportTableDesc");
        if (chkTableDesc) chkTableDesc.checked = state.showTableDesc !== false && !state.hideTableDesc;
      }
      modal.classList.toggle("hidden");
    }

    function syncExportOptionsFromUI() {
      const selFmt = document.getElementById("selDxfFormat");
      const selFnt = document.getElementById("selDxfFont");
      const chkBg = document.getElementById("chkDxfBg");
      const chkLw = document.getElementById("chkDxfLw");
      const chkUni = document.getElementById("chkDxfUnicode");
      const selSc = document.getElementById("selDxfScale");
      const optTxtSc = document.getElementById("optDxfTextScale");
      const chkChart = document.getElementById("chkExportChart");
      const chkBOM = document.getElementById("chkExportBOM");
      const chkIso = document.getElementById("chkExportIso3D");
      const chkCart = document.getElementById("chkExportCartiglio");
      const chkTableDesc = document.getElementById("chkExportTableDesc");

      if (selFmt) exportDxfOptions.format = selFmt.value;
      if (selFnt) exportDxfOptions.fontFamily = selFnt.value;
      if (chkBg) exportDxfOptions.includeBackgrounds = chkBg.checked;
      if (chkLw) exportDxfOptions.includeLineweights = chkLw.checked;
      if (chkUni) exportDxfOptions.includeUnicode = chkUni.checked;
      if (selSc) onScaleChange(selSc.value);
      if (optTxtSc) onTextScaleChange(optTxtSc.value);
      if (chkChart) state.showLoadChart = chkChart.checked;
      if (chkBOM) state.showBOM = chkBOM.checked;
      if (chkIso) state.showIso3D = chkIso.checked;
      if (chkCart) state.showCartiglio = chkCart.checked;
      if (chkTableDesc) {
        state.showTableDesc = chkTableDesc.checked;
        state.hideTableDesc = !chkTableDesc.checked;
      }
    }

    // Tabella palette standard ACI AutoCAD (1-255) per calcolo distanza euclidea RGB esatta
    const ACI_PALETTE = {
      1: [255, 0, 0], 2: [255, 255, 0], 3: [0, 255, 0], 4: [0, 255, 255],
      5: [0, 0, 255], 6: [255, 0, 255], 7: [255, 255, 255], 8: [128, 128, 128],
      9: [192, 192, 192], 10: [255, 0, 0], 11: [255, 127, 127], 12: [204, 0, 0],
      14: [153, 27, 27], 20: [234, 88, 12], 22: [154, 52, 18], 30: [245, 158, 11],
      31: [253, 186, 116], 32: [180, 83, 9], 34: [120, 53, 15], 36: [69, 26, 3],
      40: [251, 191, 36], 50: [234, 179, 8], 80: [74, 222, 128], 90: [34, 197, 94],
      92: [22, 163, 74], 130: [34, 211, 238], 131: [103, 232, 249], 140: [56, 189, 248],
      144: [14, 116, 144], 146: [22, 78, 99], 154: [12, 74, 110], 250: [30, 41, 59],
      251: [71, 85, 105], 252: [100, 116, 139], 253: [148, 163, 184], 254: [203, 213, 225], 255: [255, 255, 255]
    };

    function hexToRgb(hex) {
      if (!hex || !String(hex).startsWith("#") || hex.length < 7) return [255, 255, 255];
      return [
        parseInt(hex.slice(1, 3), 16) || 0,
        parseInt(hex.slice(3, 5), 16) || 0,
        parseInt(hex.slice(5, 7), 16) || 0
      ];
    }

    // Variante a oggetto {r,g,b} usata dall'export AutoLISP (TrueColor 420); null se il colore non è #RRGGBB
    function hexToRGB(hex) {
      if (!hex || !/^#[0-9a-f]{6}/i.test(String(hex))) return null;
      const [r, g, b] = hexToRgb(hex);
      return { r, g, b };
    }

    function hexToClosestACI(hex) {
      if (!hex) return 7;
      const [r, g, b] = hexToRgb(hex);
      let bestDist = Infinity;
      let bestAci = 7;
      for (const [aci, rgb] of Object.entries(ACI_PALETTE)) {
        const dr = r - rgb[0], dg = g - rgb[1], db = b - rgb[2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestAci = parseInt(aci, 10);
        }
      }
      return bestAci;
    }

    function hexToTrueColorInt(hex) {
      if (!hex || !String(hex).startsWith("#") || hex.length < 7) return null;
      const [r, g, b] = hexToRgb(hex);
      return (r << 16) | (g << 8) | b;
    }

    // Codifica standard AutoCAD Unicode (\U+XXXX) e codici speciali (%%c, %%d, %%p) per simboli e caratteri
    function formatCADText(s, useUnicode = true) {
      if (!s) return "";
      if (!useUnicode) return cleanCADStr(s);
      return String(s)
        .replace(/Ø/g, "%%c")
        .replace(/ø/g, "%%c")
        .replace(/°/g, "%%d")
        .replace(/±/g, "%%p")
        .replace(/²/g, "\\U+00B2")
        .replace(/³/g, "\\U+00B3")
        .replace(/≥/g, "\\U+2265")
        .replace(/≤/g, "\\U+2264")
        .replace(/Δ/g, "\\U+0394")
        .replace(/\u2014/g, " - ")
        .replace(/\u2013/g, " - ")
        .replace(/\u2012/g, "-")
        .replace(/\u2010/g, "-")
        .replace(/\u2011/g, "-")
        .replace(/•/g, "-")
        .replace(/à/g, "\\U+00E0")
        .replace(/á/g, "\\U+00E1")
        .replace(/è/g, "\\U+00E8")
        .replace(/é/g, "\\U+00E9")
        .replace(/ì/g, "\\U+00EC")
        .replace(/í/g, "\\U+00ED")
        .replace(/ò/g, "\\U+00F2")
        .replace(/ó/g, "\\U+00F3")
        .replace(/ù/g, "\\U+00F9")
        .replace(/ú/g, "\\U+00FA")
        .replace(/À/g, "\\U+00C0")
        .replace(/Á/g, "\\U+00C1")
        .replace(/È/g, "\\U+00C8")
        .replace(/É/g, "\\U+00C9")
        .replace(/Ì/g, "\\U+00CC")
        .replace(/Í/g, "\\U+00CD")
        .replace(/Ò/g, "\\U+00D2")
        .replace(/Ó/g, "\\U+00D3")
        .replace(/Ù/g, "\\U+00D9")
        .replace(/Ú/g, "\\U+00DA")
        // Qualsiasi altro carattere esteso o simbolo viene preservato tramite sequenza AutoCAD standard \U+XXXX
        .replace(/[^\x00-\x7F]/g, ch => "\\U+" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"));
    }

    function cleanCADStr(s) {
      return String(s || "")
        .replace(/\u2014/g, " - ")   // Em-dash
        .replace(/\u2013/g, " - ")   // En-dash
        .replace(/•/g, "-")
        .replace(/Ø/g, "%%c")
        .replace(/±/g, "%%p")
        .replace(/°/g, "%%d")
        .replace(/²/g, "^2")
        .replace(/≥/g, ">=")
        .replace(/≤/g, "<=")
        .replace(/Δ/g, "Delta ")
        .replace(/[àáâãä]/g, "a'")
        .replace(/[èéêë]/g, "e'")
        .replace(/[ìíîï]/g, "i'")
        .replace(/[òóôõö]/g, "o'")
        .replace(/[ùúûü]/g, "u'")
        .replace(/[ÀÁÂÃÄ]/g, "A'")
        .replace(/[ÈÉÊË]/g, "E'")
        .replace(/[^\x20-\x7E]/g, "");
    }

    const CAD_LAYERS_SPEC = {
      "0":                  { aci: 7,   tc: 0xffffff, lw: 25, desc: "Default" },
      "Canalina":           { aci: 140, tc: 0x38bdf8, lw: 50, desc: "Profilo e accessori canalina" },
      "Cavi":               { aci: 30,  tc: 0xf59e0b, lw: 35, desc: "Guaine esterne cavi" },
      "Anime_Cavi":         { aci: 40,  tc: 0xfbbf24, lw: 25, desc: "Conduttori e trefoli cordati" },
      "STAFFAGGI":          { aci: 252, tc: 0x94a3b8, lw: 35, desc: "Supporti, mensole, tiranti, PE" },
      "FASCETTE_ANCORAGGIO":{ aci: 4,   tc: 0x06b6d4, lw: 35, desc: "Fascette e bloccacavi amagnetici" },
      "Bandierine":         { aci: 40,  tc: 0xfbbf24, lw: 20, desc: "Linee richiamo e direttrici" },
      "Testi":              { aci: 7,   tc: 0xf8fafc, lw: 25, desc: "Testi tecnici e sigle" },
      "QUOTE":              { aci: 40,  tc: 0xfbbf24, lw: 25, desc: "Linee di quota e valori" },
      "TABELLA":            { aci: 140, tc: 0x38bdf8, lw: 30, desc: "Tabelle distinta cavi e BOM" },
      "CURVA_CARICO":       { aci: 90,  tc: 0x22c55e, lw: 35, desc: "Diagramma di carico EN 61537" },
      "ETICHETTA_PIANTA":   { aci: 80,  tc: 0x4ade80, lw: 35, desc: "Cartellino planimetrico" },
      "VISTA_3D_ISO":       { aci: 251, tc: 0x475569, lw: 30, desc: "Assonometria 3D passo staffe" },
      "CORNICE":            { aci: 251, tc: 0x475569, lw: 60, desc: "Riquadro tavola e cartiglio" },
      "SFONDI_RIEMPIMENTI": { aci: 250, tc: 0x1e293b, lw: 0,  desc: "Sfondi colorati e retini" }
    };

    function getScaleFactor(scaleStr) {
      if (!scaleStr) return 1.0;
      const parts = String(scaleStr).split(":");
      if (parts.length === 2) {
        const num = parseFloat(parts[0]) || 1;
        const den = parseFloat(parts[1]) || 1;
        if (den > 0) return num / den;
      }
      return 1.0;
    }

    function computeExportFileName(st) {
      if (!st) st = state;
      const rawTitle = String(st.title || "").trim();
      const mParen = rawTitle.match(/\(([^)]+)\)/);
      let name = mParen ? mParen[1].trim() : rawTitle;
      name = name.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
      return name || "Canalina";
    }

    function generateDXFStringForCurrentState(fileTitle) {
      const { prims, bounds } = buildCADScene();
      const s = getScaleFactor(state.scale);

      const dxf = [];
      const add = (c, v) => dxf.push(String(c), String(v));

      add(0, "SECTION");
      add(2, "HEADER");
      add(9, "$ACADVER");
      add(1, exportDxfOptions.format === "AC1018" ? "AC1018" : "AC1009");
      add(9, "$DWGCODEPAGE");
      add(3, "ANSI_1252");
      add(9, "$PROJECTNAME");
      add(1, formatCADText(fileTitle || state.title));
      add(9, "$INSUNITS");
      add(70, 4);
      add(9, "$MEASUREMENT");
      add(70, 1);
      add(9, "$EXTMIN");
      add(10, (bounds.minX * s).toFixed(3));
      add(20, (bounds.minY * s).toFixed(3));
      add(30, "0.0");
      add(9, "$EXTMAX");
      add(10, (bounds.maxX * s).toFixed(3));
      add(20, (bounds.maxY * s).toFixed(3));
      add(30, "0.0");
      add(0, "ENDSEC");

      add(0, "SECTION");
      add(2, "TABLES");

      add(0, "TABLE");
      add(2, "LTYPE");
      add(70, 1);
      add(0, "LTYPE");
      add(2, "CONTINUOUS");
      add(70, 64);
      add(3, "Solid line");
      add(72, 65);
      add(73, 0);
      add(40, "0.0");
      add(0, "ENDTAB");

      add(0, "TABLE");
      add(2, "STYLE");
      add(70, 4);
      add(0, "STYLE");
      add(2, "STANDARD");
      add(70, 0);
      add(40, "0.0");
      add(41, "1.0");
      add(50, "0.0");
      add(71, 0);
      add(42, "2.5");
      add(3, "arial.ttf");
      add(4, "");

      add(0, "STYLE");
      add(2, "ARIAL");
      add(70, 0);
      add(40, "0.0");
      add(41, "1.0");
      add(50, "0.0");
      add(71, 0);
      add(42, "2.5");
      add(3, "arial.ttf");
      add(4, "");

      add(0, "STYLE");
      add(2, "MONO_CAD");
      add(70, 0);
      add(40, "0.0");
      add(41, "1.0");
      add(50, "0.0");
      add(71, 0);
      add(42, "2.5");
      add(3, "arial.ttf");
      add(4, "");

      add(0, "STYLE");
      add(2, "TITLE_CAD");
      add(70, 0);
      add(40, "0.0");
      add(41, "1.0");
      add(50, "0.0");
      add(71, 0);
      add(42, "3.5");
      add(3, "arial.ttf");
      add(4, "");
      add(0, "ENDTAB");

      const layerList = Object.entries(CAD_LAYERS_SPEC);
      add(0, "TABLE");
      add(2, "LAYER");
      add(70, layerList.length);
      layerList.forEach(([layName, cfg]) => {
        add(0, "LAYER");
        add(2, layName);
        add(70, 64);
        add(62, cfg.aci || 7);
        add(6, "CONTINUOUS");
      });
      add(0, "ENDTAB");

      add(0, "ENDSEC");

      add(0, "SECTION");
      add(2, "BLOCKS");
      add(0, "ENDSEC");

      add(0, "SECTION");
      add(2, "ENTITIES");

      const addLine = (lay, x1, y1, x2, y2, aci = 7) => {
        add(0, "LINE");
        add(8, lay);
        add(62, aci);
        add(10, (x1 * s).toFixed(3)); add(20, (y1 * s).toFixed(3)); add(30, "0.0");
        add(11, (x2 * s).toFixed(3)); add(21, (y2 * s).toFixed(3)); add(31, "0.0");
      };

      const isRevitHatch = exportDxfOptions.format !== "AC1009";

      // Retino HATCH Standard DXF nativo compatibile con Autodesk Revit (crea Filled Regions 1:1)
      const addHatchQuad = (lay, x1, y1, x2, y2, x3, y3, x4, y4, aci = 7) => {
        add(0, "HATCH");
        add(8, lay);
        add(62, aci);
        add(10, "0.0"); add(20, "0.0"); add(30, "0.0");
        add(210, "0.0"); add(220, "0.0"); add(230, "1.0");
        add(2, "SOLID"); // Pattern SOLID standard Revit
        add(70, 1);      // Solid fill
        add(71, 0);      // Associativity = 0
        add(91, 1);      // 1 boundary loop
        add(92, 2);      // Polyline path
        add(72, 0);      // No bulge
        add(73, 1);      // Closed loop
        add(93, 4);      // 4 vertices
        add(10, (x1 * s).toFixed(3)); add(20, (y1 * s).toFixed(3));
        add(10, (x2 * s).toFixed(3)); add(20, (y2 * s).toFixed(3));
        add(10, (x3 * s).toFixed(3)); add(20, (y3 * s).toFixed(3));
        add(10, (x4 * s).toFixed(3)); add(20, (y4 * s).toFixed(3));
        add(97, 0);
      };

      const addHatchDisk = (lay, cx, cy, r, aci = 7) => {
        add(0, "HATCH");
        add(8, lay);
        add(62, aci);
        add(10, "0.0"); add(20, "0.0"); add(30, "0.0");
        add(210, "0.0"); add(220, "0.0"); add(230, "1.0");
        add(2, "SOLID");
        add(70, 1);
        add(71, 0);
        add(91, 1);
        add(92, 2);      // Polilinea con archi bulge (compatibile Revit senza errore "line too short")
        add(72, 1);      // Presenza bulge
        add(73, 1);      // Closed
        add(93, 2);      // 2 vertici semicircolari
        add(10, ((cx - r) * s).toFixed(3)); add(20, (cy * s).toFixed(3));
        add(42, "1.0");  // Bulge 180°
        add(10, ((cx + r) * s).toFixed(3)); add(20, (cy * s).toFixed(3));
        add(42, "1.0");  // Bulge 180°
        add(97, 0);
      };

      const addSolidQuad = (lay, x1, y1, x2, y2, x3, y3, x4, y4, aci = 7) => {
        if (isRevitHatch) {
          addHatchQuad(lay, x1, y1, x2, y2, x3, y3, x4, y4, aci);
          return;
        }
        add(0, "SOLID");
        add(8, lay);
        add(62, aci);
        add(10, (x1 * s).toFixed(3)); add(20, (y1 * s).toFixed(3)); add(30, "0.0");
        add(11, (x2 * s).toFixed(3)); add(21, (y2 * s).toFixed(3)); add(31, "0.0");
        add(12, (x4 * s).toFixed(3)); add(22, (y4 * s).toFixed(3)); add(32, "0.0");
        add(13, (x3 * s).toFixed(3)); add(23, (y3 * s).toFixed(3)); add(33, "0.0");
      };

      const addSolidDisk = (lay, cx, cy, r, aci = 7) => {
        if (isRevitHatch) {
          addHatchDisk(lay, cx, cy, r, aci);
          return;
        }
        const steps = r > 10 ? 24 : r > 4 ? 16 : 12;
        for (let i = 0; i < steps; i += 2) {
          const a1 = (i * 2 * Math.PI) / steps;
          const a2 = ((i + 1) * 2 * Math.PI) / steps;
          const a3 = ((i + 2) * 2 * Math.PI) / steps;
          addSolidQuad(
            lay,
            cx, cy,
            cx + Math.cos(a1) * r, cy + Math.sin(a1) * r,
            cx + Math.cos(a2) * r, cy + Math.sin(a2) * r,
            cx + Math.cos(a3) * r, cy + Math.sin(a3) * r,
            aci
          );
        }
      };

      const addCircle = (lay, cx, cy, r, aci = 7) => {
        add(0, "CIRCLE");
        add(8, lay);
        add(62, aci);
        add(10, (cx * s).toFixed(3)); add(20, (cy * s).toFixed(3)); add(30, "0.0");
        add(40, (r * s).toFixed(3));
      };

      prims.forEach(p => {
        if (!p.fill) return;
        const isContainerBoxBg = p.t === "rect" &&
          (p.fill === "#0f172a" || p.fill === "#04070d" || p.fill === "#1e293b") &&
          (p.layer === "TABELLA" || p.layer === "VISTA_3D_ISO" || p.layer === "CURVA_CARICO" || p.layer === "CORNICE");
        if (isContainerBoxBg) return;

        const fillAci = hexToClosestACI(p.fill);
        const fillLay = (p.layer === "Cavi" || p.layer === "Anime_Cavi" || p.layer === "Canalina" || p.layer === "VISTA_3D_ISO") ? p.layer : "SFONDI_RIEMPIMENTI";

        if (p.t === "rect") {
          addSolidQuad(fillLay, p.x, p.y, p.x + p.w, p.y, p.x + p.w, p.y + p.h, p.x, p.y + p.h, fillAci);
        } else if (p.t === "circle") {
          addSolidDisk(fillLay, p.cx, p.cy, p.r, fillAci);
        } else if (p.t === "poly" && p.pts && p.pts.length >= 3) {
          if (p.pts.length === 3) {
            addSolidQuad(fillLay, p.pts[0].x, p.pts[0].y, p.pts[1].x, p.pts[1].y, p.pts[2].x, p.pts[2].y, p.pts[2].x, p.pts[2].y, fillAci);
          } else if (p.pts.length === 4) {
            addSolidQuad(fillLay, p.pts[0].x, p.pts[0].y, p.pts[1].x, p.pts[1].y, p.pts[2].x, p.pts[2].y, p.pts[3].x, p.pts[3].y, fillAci);
          } else {
            for (let i = 1; i < p.pts.length - 1; i++) {
              addSolidQuad(fillLay, p.pts[0].x, p.pts[0].y, p.pts[i].x, p.pts[i].y, p.pts[i + 1].x, p.pts[i + 1].y, p.pts[i + 1].x, p.pts[i + 1].y, fillAci);
            }
          }
        }
      });

      prims.forEach(p => {
        const lay = CAD_LAYERS_SPEC[p.layer] ? p.layer : "0";
        const aci = hexToClosestACI(p.color);

        if (p.t === "line") {
          addLine(lay, p.x1, p.y1, p.x2, p.y2, aci);
        } else if (p.t === "rect") {
          const x1 = p.x, y1 = p.y, x2 = p.x + p.w, y2 = p.y + p.h;
          addLine(lay, x1, y1, x2, y1, aci);
          addLine(lay, x2, y1, x2, y2, aci);
          addLine(lay, x2, y2, x1, y2, aci);
          addLine(lay, x1, y2, x1, y1, aci);
        } else if (p.t === "circle") {
          addCircle(lay, p.cx, p.cy, p.r, aci);
        } else if (p.t === "poly" && p.pts && p.pts.length >= 2) {
          for (let i = 0; i < p.pts.length; i++) {
            const pt1 = p.pts[i];
            const pt2 = p.pts[(i + 1) % p.pts.length];
            addLine(lay, pt1.x, pt1.y, pt2.x, pt2.y, aci);
          }
        } else if (p.t === "text") {
          const sText = formatCADText(p.str);
          if (!sText) return;
          const th = Math.max(0.0001, +(((p.h || 2.2) * s)).toFixed(5));
          const isTitle = (p.layer === "CORNICE" && p.h >= 2.3) ||
                          p.layer === "ETICHETTA_PIANTA" ||
                          (p.layer === "TABELLA" && /^[0-9]\./.test(p.str)) ||
                          (p.layer === "CURVA_CARICO" && /^[0-9]\./.test(p.str)) ||
                          (p.layer === "VISTA_3D_ISO" && p.h >= 2.2);
          const styleName = isTitle ? "TITLE_CAD" : "ARIAL";
          const hAlign = p.align === "center" ? 1 : p.align === "right" ? 2 : 0;

          add(0, "TEXT");
          add(8, lay);
          add(62, aci);
          add(10, (p.x * s).toFixed(3)); add(20, (p.y * s).toFixed(3)); add(30, "0.0");
          add(40, th.toFixed(5));
          add(41, "1.0");
          add(1, sText);
          add(7, styleName);
          if (hAlign !== 0) {
            add(72, hAlign);
            add(11, (p.x * s).toFixed(3)); add(21, (p.y * s).toFixed(3)); add(31, "0.0");
          }
        }
      });

      add(0, "ENDSEC");
      add(0, "EOF");

      return dxf.join("\r\n") + "\r\n";
    }

    function exportAutoCADDXF() {
      const name = (document.getElementById("exportName").value || computeExportFileName(state) || "Canalina_1_1").trim().replace(/\.(dxf|dwg)$/i, "");
      const dxfContent = generateDXFStringForCurrentState(name);
      const blob = new Blob([dxfContent], { type: "application/dxf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.dxf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 150);
    }

    async function exportAllSectionsDXF() {
      syncActiveSectionToMultiStore();
      if (!projectSections || projectSections.length === 0) {
        exportAutoCADDXF();
        return;
      }
      syncExportOptionsFromUI();
      const exportOptsToApply = {
        showLoadChart: state.showLoadChart !== false,
        showBOM: state.showBOM !== false,
        showIso3D: state.showIso3D !== false,
        showCartiglio: state.showCartiglio !== false,
        showTableDesc: state.showTableDesc !== false && !state.hideTableDesc,
        hideTableDesc: Boolean(state.hideTableDesc),
        layoutMode: state.layoutMode || "standard",
        showCableCallouts: state.showCableCallouts !== false,
        textScale: typeof state.textScale === "number" && state.textScale > 0 ? state.textScale : 1.0,
        scale: state.scale || "1:1"
      };

      const originalIdx = currentSectionIdx;
      const originalState = cloneStateSnapshot(state);
      const count = projectSections.length;
      
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = `Esportazione batch di ${count} canaline (.DXF) in corso...`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold";
      }

      for (let i = 0; i < projectSections.length; i++) {
        currentSectionIdx = i;
        state = cloneStateSnapshot(projectSections[i]);
        Object.assign(state, exportOptsToApply);
        recalculateAll();
        const fileBase = computeExportFileName(state) || `Canalina_${i + 1}`;
        const dxfContent = generateDXFStringForCurrentState(fileBase);
        
        const blob = new Blob([dxfContent], { type: "application/dxf" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${fileBase}.dxf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        }, 150);

        if (i < projectSections.length - 1) {
          await new Promise(r => setTimeout(r, 350));
        }
      }

      currentSectionIdx = originalIdx;
      state = cloneStateSnapshot(originalState);
      pushStateToUI();
      recalculateAll();
      fitAll();

      if (banner) {
        banner.textContent = `✓ Esportate con successo tutte le ${count} canaline in file .DXF separati!`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
      }
    }

    function generateAutoLISPStringForCurrentState(fileTitle) {
      const { prims } = buildCADScene();
      const s = getScaleFactor(state.scale);

      // Uno script .SCR viene letto da AutoCAD come tasti premuti, riga per riga. Per questo:
      // - nessuna riga vuota (equivale a INVIO e ripeterebbe l'ultimo comando dell'utente);
      // - nessun comando interattivo (STYLE/LAYER fanno domande che variano per font e versione
      //   e lasciavano AutoCAD in attesa): stili e layer sono creati con entmake;
      // - ogni riga è un'espressione AutoLISP completa, così un errore non blocca le righe seguenti.
      let scr = `;; CanaloCAD v${APP_VERSION} - sezione canalina 1:1. Trascina il file nel disegno o usa il comando SCRIPT.\n`;
      scr += `(setq ccad:oldecho (getvar "CMDECHO") ccad:oldos (getvar "OSMODE"))\n`;
      scr += `(setvar "CMDECHO" 0)\n`;
      scr += `(setvar "OSMODE" 0)\n`;
      // ccad:e crea un'entità senza stampare la lista restituita (molto più veloce su disegni grandi)
      scr += `(defun ccad:e (l) (entmake l) (princ))\n`;

      const styleRec = (name, font) =>
        `(if (not (tblsearch "STYLE" "${name}")) (entmake '((0 . "STYLE") (100 . "AcDbSymbolTableRecord") (100 . "AcDbTextStyleTableRecord") (2 . "${name}") (70 . 0) (40 . 0.0) (41 . 1.0) (50 . 0.0) (71 . 0) (42 . 2.5) (3 . "${font}") (4 . ""))))\n`;
      scr += styleRec("MONO_CAD", "isocp.shx");
      scr += styleRec("TITLE_CAD", "arial.ttf");

      Object.entries(CAD_LAYERS_SPEC).forEach(([lay, cfg]) => {
        if (lay === "0") return; // il layer 0 esiste sempre
        scr += `(if (not (tblsearch "LAYER" "${lay}")) (entmake '((0 . "LAYER") (100 . "AcDbSymbolTableRecord") (100 . "AcDbLayerTableRecord") (2 . "${lay}") (70 . 0) (62 . ${cfg.aci || 7}) (6 . "Continuous") (370 . ${cfg.lw != null ? cfg.lw : 25}))))\n`;
      });

      const emitSolidTri = (lay, x1, y1, x2, y2, x3, y3, hex) => {
        const aci = hexToClosestACI(hex);
        const rgb = hexToRGB(hex);
        const tcStr = rgb ? ` '(420 . ${(rgb.r << 16) + (rgb.g << 8) + rgb.b})` : "";
        scr += `(ccad:e (list '(0 . "SOLID") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(10 ${(x1 * s).toFixed(3)} ${(y1 * s).toFixed(3)} 0.0) '(11 ${(x2 * s).toFixed(3)} ${(y2 * s).toFixed(3)} 0.0) '(12 ${(x3 * s).toFixed(3)} ${(y3 * s).toFixed(3)} 0.0) '(13 ${(x3 * s).toFixed(3)} ${(y3 * s).toFixed(3)} 0.0)))\n`;
      };

      const emitSolidQuad = (lay, x1, y1, x2, y2, x3, y3, x4, y4, hex) => {
        const aci = hexToClosestACI(hex);
        const rgb = hexToRGB(hex);
        const tcStr = rgb ? ` '(420 . ${(rgb.r << 16) + (rgb.g << 8) + rgb.b})` : "";
        scr += `(ccad:e (list '(0 . "SOLID") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(10 ${(x1 * s).toFixed(3)} ${(y1 * s).toFixed(3)} 0.0) '(11 ${(x2 * s).toFixed(3)} ${(y2 * s).toFixed(3)} 0.0) '(12 ${(x4 * s).toFixed(3)} ${(y4 * s).toFixed(3)} 0.0) '(13 ${(x3 * s).toFixed(3)} ${(y3 * s).toFixed(3)} 0.0)))\n`;
      };

      prims.forEach(p => {
        if (!p.fill) return;
        const isContainerBoxBg = p.t === "rect" && (p.fill === "#0f172a" || p.fill === "#04070d" || p.fill === "#1e293b") && (p.layer === "TABELLA" || p.layer === "VISTA_3D_ISO" || p.layer === "CURVA_CARICO" || p.layer === "CORNICE");
        if (!exportDxfOptions.includeBackgrounds && isContainerBoxBg) return;
        const fillLay = (p.layer === "Cavi" || p.layer === "Anime_Cavi" || p.layer === "Canalina" || p.layer === "VISTA_3D_ISO") ? p.layer : "SFONDI_RIEMPIMENTI";
        if (p.t === "rect") {
          emitSolidQuad(fillLay, p.x, p.y, p.x + p.w, p.y, p.x + p.w, p.y + p.h, p.x, p.y + p.h, p.fill);
        } else if (p.t === "circle") {
          const steps = p.r > 10 ? 20 : p.r > 4 ? 14 : 10;
          for (let i = 0; i < steps; i++) {
            const a1 = (i * 2 * Math.PI) / steps;
            const a2 = ((i + 1) * 2 * Math.PI) / steps;
            emitSolidTri(
              fillLay,
              p.cx, p.cy,
              p.cx + Math.cos(a1) * p.r, p.cy + Math.sin(a1) * p.r,
              p.cx + Math.cos(a2) * p.r, p.cy + Math.sin(a2) * p.r,
              p.fill
            );
          }
        } else if (p.t === "poly" && p.fill && p.pts && p.pts.length >= 3) {
          if (p.pts.length === 3) {
            emitSolidTri(fillLay, p.pts[0].x, p.pts[0].y, p.pts[1].x, p.pts[1].y, p.pts[2].x, p.pts[2].y, p.fill);
          } else if (p.pts.length === 4) {
            emitSolidQuad(fillLay, p.pts[0].x, p.pts[0].y, p.pts[1].x, p.pts[1].y, p.pts[2].x, p.pts[2].y, p.pts[3].x, p.pts[3].y, p.fill);
          } else {
            for (let i = 1; i < p.pts.length - 1; i++) {
              emitSolidTri(fillLay, p.pts[0].x, p.pts[0].y, p.pts[i].x, p.pts[i].y, p.pts[i + 1].x, p.pts[i + 1].y, p.fill);
            }
          }
        }
      });

      prims.forEach(p => {
        const lay = CAD_LAYERS_SPEC[p.layer] ? p.layer : "0";
        const aci = hexToClosestACI(p.color);
        const rgb = hexToRGB(p.color);
        const tcStr = rgb ? ` '(420 . ${(rgb.r << 16) + (rgb.g << 8) + rgb.b})` : "";

        if (p.t === "line") {
          scr += `(ccad:e (list '(0 . "LINE") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(370 . 25) '(10 ${(p.x1 * s).toFixed(3)} ${(p.y1 * s).toFixed(3)} 0.0) '(11 ${(p.x2 * s).toFixed(3)} ${(p.y2 * s).toFixed(3)} 0.0)))\n`;
        } else if (p.t === "rect") {
          const x1 = p.x, y1 = p.y, x2 = p.x + p.w, y2 = p.y + p.h;
          scr += `(ccad:e (list '(0 . "LINE") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(370 . 25) '(10 ${(x1 * s).toFixed(3)} ${(y1 * s).toFixed(3)} 0.0) '(11 ${(x2 * s).toFixed(3)} ${(y1 * s).toFixed(3)} 0.0)))\n`;
          scr += `(ccad:e (list '(0 . "LINE") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(370 . 25) '(10 ${(x2 * s).toFixed(3)} ${(y1 * s).toFixed(3)} 0.0) '(11 ${(x2 * s).toFixed(3)} ${(y2 * s).toFixed(3)} 0.0)))\n`;
          scr += `(ccad:e (list '(0 . "LINE") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(370 . 25) '(10 ${(x2 * s).toFixed(3)} ${(y2 * s).toFixed(3)} 0.0) '(11 ${(x1 * s).toFixed(3)} ${(y2 * s).toFixed(3)} 0.0)))\n`;
          scr += `(ccad:e (list '(0 . "LINE") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(370 . 25) '(10 ${(x1 * s).toFixed(3)} ${(y2 * s).toFixed(3)} 0.0) '(11 ${(x1 * s).toFixed(3)} ${(y1 * s).toFixed(3)} 0.0)))\n`;
        } else if (p.t === "circle") {
          scr += `(ccad:e (list '(0 . "CIRCLE") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(370 . 25) '(10 ${(p.cx * s).toFixed(3)} ${(p.cy * s).toFixed(3)} 0.0) '(40 . ${(p.r * s).toFixed(3)})))\n`;
        } else if (p.t === "poly" && p.pts && p.pts.length >= 2) {
          for (let i = 0; i < p.pts.length; i++) {
            const pt1 = p.pts[i];
            const pt2 = p.pts[(i + 1) % p.pts.length];
            scr += `(ccad:e (list '(0 . "LINE") '(8 . "${lay}") '(62 . ${aci})${tcStr} '(370 . 25) '(10 ${(pt1.x * s).toFixed(3)} ${(pt1.y * s).toFixed(3)} 0.0) '(11 ${(pt2.x * s).toFixed(3)} ${(pt2.y * s).toFixed(3)} 0.0)))\n`;
          }
        } else if (p.t === "text") {
          // Un a-capo dentro il testo spezzerebbe la riga dello script: lo sostituisco con uno spazio
          const sText = formatCADText(String(p.str || "").replace(/[\r\n\t]+/g, " "), exportDxfOptions.includeUnicode).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
          if (!sText) return;
          const th = Math.max(0.0001, +(((p.h || 2.2) * 0.88 * s)).toFixed(5));
          const isTitle = (p.layer === "CORNICE" && p.h >= 2.3) ||
                          p.layer === "ETICHETTA_PIANTA" ||
                          (p.layer === "TABELLA" && /^[0-9]\./.test(p.str)) ||
                          (p.layer === "CURVA_CARICO" && /^[0-9]\./.test(p.str)) ||
                          (p.layer === "VISTA_3D_ISO" && p.h >= 2.2);
          const styleName = isTitle ? "TITLE_CAD" : "MONO_CAD";
          const hAlign = p.align === "center" ? 1 : p.align === "right" ? 2 : 0;
          const alignStr = hAlign !== 0 ? ` '(72 . ${hAlign}) '(11 ${(p.x * s).toFixed(3)} ${(p.y * s).toFixed(3)} 0.0) '(73 . 0)` : "";
          scr += `(ccad:e (list '(0 . "TEXT") '(8 . "${lay}") '(7 . "${styleName}") '(62 . ${aci})${tcStr} '(370 . 25) '(10 ${(p.x * s).toFixed(3)} ${(p.y * s).toFixed(3)} 0.0) '(40 . ${th.toFixed(5)}) '(41 . 1.0) '(1 . "${sText}")${alignStr}))\n`;
        }
      });
      scr += `(setvar "OSMODE" ccad:oldos)\n`;
      scr += `(setvar "CMDECHO" ccad:oldecho)\n`;
      scr += `(command "_.ZOOM" "_E")\n`;
      scr += `(princ "\\nCanaloCAD: sezione disegnata.")\n`;
      return scr;
    }

    function exportAutoLISPDWG() {
      const name = (document.getElementById("exportName").value || computeExportFileName(state) || "Canalina_1_1").trim().replace(/\.(dxf|dwg|scr)$/i, "");
      const scr = generateAutoLISPStringForCurrentState(name);
      const blob = new Blob([scr], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}_TrascinaInAutoCAD.scr`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 150);
    }

    async function exportAllSectionsAutoLISP() {
      syncActiveSectionToMultiStore();
      if (!projectSections || projectSections.length === 0) {
        exportAutoLISPDWG();
        return;
      }
      syncExportOptionsFromUI();
      const exportOptsToApply = {
        showLoadChart: state.showLoadChart !== false,
        showBOM: state.showBOM !== false,
        showIso3D: state.showIso3D !== false,
        showCartiglio: state.showCartiglio !== false,
        showTableDesc: state.showTableDesc !== false && !state.hideTableDesc,
        hideTableDesc: Boolean(state.hideTableDesc),
        layoutMode: state.layoutMode || "standard",
        showCableCallouts: state.showCableCallouts !== false,
        textScale: typeof state.textScale === "number" && state.textScale > 0 ? state.textScale : 1.0,
        scale: state.scale || "1:1"
      };

      const originalIdx = currentSectionIdx;
      const originalState = cloneStateSnapshot(state);
      const count = projectSections.length;
      
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = `Esportazione batch di ${count} canaline (.SCR) in corso...`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold";
      }

      for (let i = 0; i < projectSections.length; i++) {
        currentSectionIdx = i;
        state = cloneStateSnapshot(projectSections[i]);
        Object.assign(state, exportOptsToApply);
        recalculateAll();
        const fileBase = computeExportFileName(state) || `Canalina_${i + 1}`;
        const scrContent = generateAutoLISPStringForCurrentState(fileBase);
        
        const blob = new Blob([scrContent], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${fileBase}_TrascinaInAutoCAD.scr`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        }, 150);

        if (i < projectSections.length - 1) {
          await new Promise(r => setTimeout(r, 350));
        }
      }

      currentSectionIdx = originalIdx;
      state = cloneStateSnapshot(originalState);
      pushStateToUI();
      recalculateAll();
      fitAll();

      if (banner) {
        banner.textContent = `✓ Esportate con successo tutte le ${count} canaline in file .SCR separati!`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
      }
    }

    function exportWordReport() {
      syncActiveSectionToMultiStore();
      const name = (document.getElementById("exportName").value || "Relazione").trim();
      const e = escapeHtml;
      const html = `<html><head><meta charset="utf-8"></head><body style="font-family:Arial">
        <h2>RELAZIONE TECNICA DI POSA: ${e(state.title)}</h2>
        <p>Dimensioni: L=${state.width}mm x H=${state.height}mm | Riempimento: ${metrics.fillPct}% (Riserva +${metrics.sparePct}%) | Derating CEI 35024 Kr=${metrics.kr} | Segregazione 64-8: ${metrics.segConform ? "CONFORME" : "NON CONFORME"}</p>
        <table border="1" cellpadding="5" style="border-collapse:collapse;width:100%">
          <tr><th>Pos</th><th>Sigla</th><th>Descrizione</th><th>Tipo</th><th>Formazione</th><th>Ø (mm)</th></tr>
          ${state.cables.map((c, i) => `<tr><td>#${i + 1}</td><td>${e(c.code)}</td><td>${e(c.desc)}</td><td>${e(c.type)}</td><td>${e(c.form)}</td><td>${e(c.d)}</td></tr>`).join("")}
        </table>
        <p style="font-size:9pt;color:#555">Generato con ${APP_NAME} v${APP_VERSION}. Portate, frecce e coefficienti sono stime di calcolo: verificarle con i dati del costruttore.</p>
        </body></html>`;
      downloadBlob(new Blob(["\ufeff", html], { type: "application/msword" }), `${name}.doc`);
    }

    function exportCSV() {
      const name = (document.getElementById("exportName").value || "Computo_BOM").trim();
      const rows = [["CODICE", "DESCRIZIONE", "QUANTITA", "UM", "NOTE"]];
      metrics.bom.forEach(b => rows.push([b.code, b.desc, String(b.qty).replace(".", ","), b.um, b.note]));
      const csv = rows.map(r => r.map(csvField).join(";")).join("\r\n") + "\r\n";
      downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
    }

