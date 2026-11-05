    // ============================================================================
    // 8. ESPORTATORI CERTIFICATI FEDELI 1:1 (.DXF TRUECOLOR, .SCR, .DOC, .CSV) + MULTI-SEZIONE
    // ============================================================================
    let exportDxfOptions = {
      format: "AC1015", // "AC1015" = DXF R2000 completo (predefinito) · "AC1009" = R12 minimo
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

      if (selFmt) exportDxfOptions.format = selFmt.value === "AC1009" ? "AC1009" : "AC1015";
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

    // ---------------------------------------------------------------------------
    // WRITER DXF
    // R2000 (AC1015, predefinito): scheletro generato da ezdxf (DXF_R2000_TEMPLATE) + entità con
    //   handle, owner, marcatori di sottoclasse, TrueColor e retini HATCH SOLID (regioni piene in Revit).
    // R12 (AC1009): formato minimo senza handle, riempimenti come SOLID. Massima compatibilità.
    // Ogni entità con coordinate non numeriche viene scartata invece di corrompere il file.
    // ---------------------------------------------------------------------------
    function dxfText(str) {
      // Il file è in Windows-1252 ($DWGCODEPAGE = ANSI_1252): i caratteri Latin-1 (à è ° ² ±...) restano
      // tali, quelli fuori codepage (≥ ≤ Δ...) diventano \U+XXXX, come li scrive AutoCAD stesso.
      return String(str == null ? "" : str)
        .replace(/\\U\+00([A-F0-9]{2})/gi, (m, hx) => parseInt(hx, 16) >= 0xA0 ? String.fromCharCode(parseInt(hx, 16)) : m)
        .replace(/[\r\n\t]+/g, " ")
        .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
        .replace(/[^\x00-\xff]/g, ch => "\\U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"))
        .slice(0, 250);
    }

    function createDxfWriter(r2000, scale) {
      const out = [];
      const T = DXF_R2000_TEMPLATE;
      let handle = T.firstHandle;
      const owner = T.modelSpaceOwner;
      const g = (code, val) => { out.push(String(code).padStart(3, " "), String(val)); };
      const f = v => (+v).toFixed(3);
      const ok = (...vals) => vals.every(v => Number.isFinite(+v));
      const S = v => v * scale;

      function head(type, lay, aci, tc) {
        g(0, type);
        if (r2000) { g(5, (handle++).toString(16).toUpperCase()); g(330, owner); g(100, "AcDbEntity"); }
        g(8, lay);
        g(62, aci);
        if (r2000 && Number.isInteger(tc)) g(420, tc);
      }

      return {
        line(lay, x1, y1, x2, y2, aci, tc) {
          if (!ok(x1, y1, x2, y2)) return;
          head("LINE", lay, aci, tc);
          if (r2000) g(100, "AcDbLine");
          g(10, f(S(x1))); g(20, f(S(y1))); g(30, "0.0");
          g(11, f(S(x2))); g(21, f(S(y2))); g(31, "0.0");
        },
        circle(lay, cx, cy, r, aci, tc) {
          if (!ok(cx, cy, r) || r <= 0) return;
          head("CIRCLE", lay, aci, tc);
          if (r2000) g(100, "AcDbCircle");
          g(10, f(S(cx))); g(20, f(S(cy))); g(30, "0.0");
          g(40, f(S(r)));
        },
        text(lay, x, y, h, str, style, hAlign, aci, tc) {
          const txt = dxfText(str);
          if (!txt.trim() || !ok(x, y, h)) return;
          head("TEXT", lay, aci, tc);
          if (r2000) g(100, "AcDbText");
          g(10, f(S(x))); g(20, f(S(y))); g(30, "0.0");
          g(40, Math.max(0.0001, S(h)).toFixed(5));
          g(1, txt);
          g(41, "1.0");
          g(7, style);
          if (hAlign) {
            g(72, hAlign);
            g(11, f(S(x))); g(21, f(S(y))); g(31, "0.0");
          }
          if (r2000) g(100, "AcDbText");
        },
        // Quadrilatero pieno (p1..p4 in ordine di contorno)
        fillQuad(lay, x1, y1, x2, y2, x3, y3, x4, y4, aci, tc) {
          if (!ok(x1, y1, x2, y2, x3, y3, x4, y4)) return;
          if (r2000) {
            this._hatch(lay, [[x1, y1], [x2, y2], [x3, y3], [x4, y4]], false, aci, tc);
            return;
          }
          head("SOLID", lay, aci, tc);
          // SOLID usa l'ordine "a zig-zag": 1, 2, 4, 3
          g(10, f(S(x1))); g(20, f(S(y1))); g(30, "0.0");
          g(11, f(S(x2))); g(21, f(S(y2))); g(31, "0.0");
          g(12, f(S(x4))); g(22, f(S(y4))); g(32, "0.0");
          g(13, f(S(x3))); g(23, f(S(y3))); g(33, "0.0");
        },
        fillDisk(lay, cx, cy, r, aci, tc) {
          if (!ok(cx, cy, r) || r <= 0) return;
          if (r2000) {
            // Due semicerchi con bulge 1 (180°)
            this._hatch(lay, [[cx - r, cy, 1], [cx + r, cy, 1]], true, aci, tc);
            return;
          }
          const steps = r > 10 ? 24 : r > 4 ? 16 : 12;
          for (let i = 0; i < steps; i += 2) {
            const a = k => ((i + k) * 2 * Math.PI) / steps;
            this.fillQuad(lay, cx, cy,
              cx + Math.cos(a(0)) * r, cy + Math.sin(a(0)) * r,
              cx + Math.cos(a(1)) * r, cy + Math.sin(a(1)) * r,
              cx + Math.cos(a(2)) * r, cy + Math.sin(a(2)) * r, aci, tc);
          }
        },
        _hatch(lay, verts, withBulge, aci, tc) {
          head("HATCH", lay, aci, tc);
          g(100, "AcDbHatch");
          g(10, "0.0"); g(20, "0.0"); g(30, "0.0");
          g(210, "0.0"); g(220, "0.0"); g(230, "1.0");
          g(2, "SOLID");
          g(70, 1);            // riempimento pieno
          g(71, 0);            // non associativo
          g(91, 1);            // un contorno
          g(92, 3);            // contorno esterno + polilinea
          g(72, withBulge ? 1 : 0);
          g(73, 1);            // chiuso
          g(93, verts.length);
          verts.forEach(v => {
            g(10, f(S(v[0]))); g(20, f(S(v[1])));
            if (withBulge) g(42, (v[2] || 0).toFixed(6));
          });
          g(97, 0);            // nessun oggetto di contorno associato
          g(75, 1);            // stile: solo esterno
          g(76, 1);            // motivo predefinito
          g(98, 0);            // nessun punto seme
        },
        finish(bounds, title) {
          const body = out.join("\n") + "\n";
          let doc;
          if (r2000) {
            doc = T.head
              .replace("@@HANDSEED@@", (handle + 1).toString(16).toUpperCase())
              .replace("@@EXTMINX@@", f(S(bounds.minX))).replace("@@EXTMINY@@", f(S(bounds.minY)))
              .replace("@@EXTMAXX@@", f(S(bounds.maxX))).replace("@@EXTMAXY@@", f(S(bounds.maxY)))
              + body + T.tail;
          } else {
            doc = r12Header(bounds, scale) + body + "  0\nENDSEC\n  0\nEOF\n";
          }
          return doc.replace(/\r?\n/g, "\r\n");
        }
      };
    }

    // Intestazione e tabelle R12 (AC1009): nessun handle, solo ciò che R12 prevede
    function r12Header(bounds, scale) {
      const L = [];
      const g = (c, v) => L.push(String(c).padStart(3, " "), String(v));
      g(0, "SECTION"); g(2, "HEADER");
      g(9, "$ACADVER"); g(1, "AC1009");
      g(9, "$DWGCODEPAGE"); g(3, "ANSI_1252");
      g(9, "$INSBASE"); g(10, "0.0"); g(20, "0.0"); g(30, "0.0");
      g(9, "$EXTMIN"); g(10, (bounds.minX * scale).toFixed(3)); g(20, (bounds.minY * scale).toFixed(3)); g(30, "0.0");
      g(9, "$EXTMAX"); g(10, (bounds.maxX * scale).toFixed(3)); g(20, (bounds.maxY * scale).toFixed(3)); g(30, "0.0");
      g(0, "ENDSEC");
      g(0, "SECTION"); g(2, "TABLES");
      g(0, "TABLE"); g(2, "LTYPE"); g(70, 1);
      g(0, "LTYPE"); g(2, "CONTINUOUS"); g(70, 0); g(3, "Solid line"); g(72, 65); g(73, 0); g(40, "0.0");
      g(0, "ENDTAB");
      const layers = Object.entries(CAD_LAYERS_SPEC);
      g(0, "TABLE"); g(2, "LAYER"); g(70, layers.length);
      layers.forEach(([name, cfg]) => { g(0, "LAYER"); g(2, name); g(70, 0); g(62, cfg.aci || 7); g(6, "CONTINUOUS"); });
      g(0, "ENDTAB");
      const styles = [["STANDARD", "txt"], ["ARIAL", "arial.ttf"], ["MONO_CAD", "isocp.shx"], ["TITLE_CAD", "arial.ttf"]];
      g(0, "TABLE"); g(2, "STYLE"); g(70, styles.length);
      styles.forEach(([name, font]) => { g(0, "STYLE"); g(2, name); g(70, 0); g(40, "0.0"); g(41, "1.0"); g(50, "0.0"); g(71, 0); g(42, "2.5"); g(3, font); g(4, ""); });
      g(0, "ENDTAB");
      g(0, "ENDSEC");
      g(0, "SECTION"); g(2, "BLOCKS"); g(0, "ENDSEC");
      g(0, "SECTION"); g(2, "ENTITIES");
      return L.join("\n") + "\n";
    }

    // Converte il testo DXF (solo caratteri <= U+00FF, garantito da dxfText) in byte Windows-1252 / Latin-1
    function dxfToBlob(text) {
      const bytes = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        bytes[i] = c <= 0xff ? c : 0x3f;
      }
      return new Blob([bytes], { type: "application/dxf" });
    }

    function hexToTrueColorOrNull(hex) {
      return (hex && /^#[0-9a-f]{6}$/i.test(hex)) ? parseInt(hex.slice(1), 16) : null;
    }

    function generateDXFStringForCurrentState(fileTitle) {
      const { prims, bounds } = buildCADScene();
      const s = getScaleFactor(state.scale);
      const r2000 = exportDxfOptions.format !== "AC1009";
      const W = createDxfWriter(r2000, s);

      // 1) Riempimenti (sotto i contorni)
      prims.forEach(p => {
        if (!p.fill) return;
        const isContainerBoxBg = p.t === "rect" &&
          (p.fill === "#0f172a" || p.fill === "#04070d" || p.fill === "#1e293b") &&
          (p.layer === "TABELLA" || p.layer === "VISTA_3D_ISO" || p.layer === "CURVA_CARICO" || p.layer === "CORNICE");
        if (isContainerBoxBg) return;

        const aci = hexToClosestACI(p.fill);
        const tc = hexToTrueColorOrNull(p.fill);
        const lay = (p.layer === "Cavi" || p.layer === "Anime_Cavi" || p.layer === "Canalina" || p.layer === "VISTA_3D_ISO") ? p.layer : "SFONDI_RIEMPIMENTI";

        if (p.t === "rect") {
          W.fillQuad(lay, p.x, p.y, p.x + p.w, p.y, p.x + p.w, p.y + p.h, p.x, p.y + p.h, aci, tc);
        } else if (p.t === "circle") {
          W.fillDisk(lay, p.cx, p.cy, p.r, aci, tc);
        } else if (p.t === "poly" && p.pts && p.pts.length >= 3) {
          const P = p.pts;
          if (P.length === 3) {
            W.fillQuad(lay, P[0].x, P[0].y, P[1].x, P[1].y, P[2].x, P[2].y, P[2].x, P[2].y, aci, tc);
          } else if (P.length === 4) {
            W.fillQuad(lay, P[0].x, P[0].y, P[1].x, P[1].y, P[2].x, P[2].y, P[3].x, P[3].y, aci, tc);
          } else {
            for (let i = 1; i < P.length - 1; i++) {
              W.fillQuad(lay, P[0].x, P[0].y, P[i].x, P[i].y, P[i + 1].x, P[i + 1].y, P[i + 1].x, P[i + 1].y, aci, tc);
            }
          }
        }
      });

      // 2) Contorni e testi
      prims.forEach(p => {
        const lay = CAD_LAYERS_SPEC[p.layer] ? p.layer : "0";
        const aci = hexToClosestACI(p.color);
        const tc = hexToTrueColorOrNull(p.color);

        if (p.t === "line") {
          W.line(lay, p.x1, p.y1, p.x2, p.y2, aci, tc);
        } else if (p.t === "rect") {
          const x1 = p.x, y1 = p.y, x2 = p.x + p.w, y2 = p.y + p.h;
          W.line(lay, x1, y1, x2, y1, aci, tc);
          W.line(lay, x2, y1, x2, y2, aci, tc);
          W.line(lay, x2, y2, x1, y2, aci, tc);
          W.line(lay, x1, y2, x1, y1, aci, tc);
        } else if (p.t === "circle") {
          W.circle(lay, p.cx, p.cy, p.r, aci, tc);
        } else if (p.t === "poly" && p.pts && p.pts.length >= 2) {
          for (let i = 0; i < p.pts.length; i++) {
            const a = p.pts[i], b = p.pts[(i + 1) % p.pts.length];
            W.line(lay, a.x, a.y, b.x, b.y, aci, tc);
          }
        } else if (p.t === "text") {
          const str = formatCADText(p.str);
          const isTitle = (p.layer === "CORNICE" && p.h >= 2.3) ||
                          p.layer === "ETICHETTA_PIANTA" ||
                          (p.layer === "TABELLA" && /^[0-9]\./.test(p.str)) ||
                          (p.layer === "CURVA_CARICO" && /^[0-9]\./.test(p.str)) ||
                          (p.layer === "VISTA_3D_ISO" && p.h >= 2.2);
          const hAlign = p.align === "center" ? 1 : p.align === "right" ? 2 : 0;
          W.text(lay, p.x, p.y, p.h || 2.2, str, isTitle ? "TITLE_CAD" : "ARIAL", hAlign, aci, tc);
        }
      });

      return W.finish(bounds, fileTitle || state.title);
    }

    function exportAutoCADDXF() {
      const name = (document.getElementById("exportName").value || computeExportFileName(state) || "Canalina_1_1").trim().replace(/\.(dxf|dwg)$/i, "");
      const dxfContent = generateDXFStringForCurrentState(name);
      const blob = dxfToBlob(dxfContent);
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
        
        const blob = dxfToBlob(dxfContent);
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
      let scr = `;; CanaloCAD ${APP_VERSION_LABEL} - sezione canalina 1:1. Trascina il file nel disegno o usa il comando SCRIPT.\n`;
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
        <p style="font-size:9pt;color:#555">Generato con ${APP_NAME} ${APP_VERSION_LABEL}. Portate, frecce e coefficienti sono stime di calcolo: verificarle con i dati del costruttore.</p>
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

