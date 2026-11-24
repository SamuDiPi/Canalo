    // ============================================================================
    // CAVI DA SCHEMA UNIFILARE PDF -> NUOVA CANALINA
    // Legge le tabelle dei quadri (una colonna per circuito, righe "Sigla utenza", "Sigla",
    // "Sezione", "Lunghezza", "Portata"...), mostra le linee trovate e, con quelle scelte, riempie
    // una canalina nuova. Tutto resta nel browser.
    // Diametri e pesi: dal database dei cavi quando c'è la stessa tipologia e formazione,
    // altrimenti STIMATI dalle tabelle qui sotto (valori tipici, da verificare sulle schede
    // del costruttore).
    // ============================================================================

    // Diametro esterno tipico [mm] per sezione [mm²].
    const PDFCAVI_D_UNI_1KV = { 1.5: 5.8, 2.5: 6.4, 4: 7.0, 6: 7.6, 10: 8.6, 16: 9.8, 25: 11.6, 35: 12.8, 50: 14.6, 70: 16.6, 95: 18.8, 120: 22.0, 150: 24.2, 185: 26.8, 240: 30.2, 300: 33.5, 400: 37.5 };
    const PDFCAVI_D_UNI_750V = { 1.5: 3.0, 2.5: 3.6, 4: 4.2, 6: 4.8, 10: 6.1, 16: 7.4, 25: 9.2, 35: 10.4, 50: 12.3, 70: 14.0, 95: 16.0, 120: 17.8, 150: 19.8, 185: 22.0, 240: 25.0 };
    const PDFCAVI_D_UNI_SOLARE = { 1.5: 4.8, 2.5: 5.3, 4: 5.8, 6: 6.4, 10: 7.5, 16: 8.8, 25: 10.6, 35: 11.9 };
    const PDFCAVI_D_UNI_MT = { 35: 29.0, 50: 30.5, 70: 32.0, 95: 34.0, 120: 35.5, 150: 37.0, 185: 39.0, 240: 42.0, 300: 44.5 };
    const PDFCAVI_D_MULTI = {
      2: { 1.5: 10.2, 2.5: 11.5, 4: 12.8, 6: 14.0, 10: 16.4, 16: 18.8, 25: 22.6, 35: 25.2 },
      3: { 1.5: 11.0, 2.5: 12.2, 4: 13.6, 6: 14.9, 10: 17.4, 16: 20.0, 25: 24.0, 35: 26.8, 50: 30.8 },
      4: { 1.5: 12.0, 2.5: 13.4, 4: 14.8, 6: 16.3, 10: 19.2, 16: 21.9, 25: 26.5, 35: 29.4, 50: 34.0, 70: 38.8, 95: 44.0 },
      5: { 1.5: 13.0, 2.5: 14.5, 4: 16.2, 6: 17.8, 10: 21.0, 16: 24.0, 25: 29.2, 35: 32.5, 50: 37.5 }
    };

    // "1.029" -> 1029, "0,95" -> 0.95, "---" -> null (numeri scritti all'italiana).
    function pdfCaviNumber(s) {
      const m = String(s || "").match(/-?\d[\d.]*(?:,\d+)?/);
      if (!m) return null;
      const v = parseFloat(m[0].replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
      return isFinite(v) ? v : null;
    }

    function pdfCaviSecText(sec) {
      return String(sec).replace(".", ",");
    }

    // Interpola nella tabella; fuori tabella scala con la radice della sezione.
    function pdfCaviLookup(table, sec) {
      const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
      if (table[sec] !== undefined) return table[sec];
      if (sec <= keys[0]) return +(table[keys[0]] * Math.sqrt(sec / keys[0])).toFixed(1);
      const last = keys[keys.length - 1];
      if (sec >= last) return +(table[last] * Math.sqrt(sec / last)).toFixed(1);
      for (let i = 1; i < keys.length; i++) {
        if (sec < keys[i]) {
          const a = keys[i - 1], b = keys[i];
          return +(table[a] + (table[b] - table[a]) * (sec - a) / (b - a)).toFixed(1);
        }
      }
      return table[last];
    }

    // Formazione -> parti. Esempi: "1(5G25)", "3(1x95)+(1x50)+(1PE25)", "3(3x1x240)+(2x240)+(1PE120)",
    // "2(1x1,5)+(1PE1,5)", "1(2x4)+(1PE4)". Ogni parte: { count, cores, sec, uni, pe, sep }.
    function parseCableFormation(form) {
      const txt = String(form || "").replace(/\s+/g, "").replace(/,/g, ".");
      if (!txt || !/\d/.test(txt)) return null;
      const parts = [];
      for (const raw of txt.split("+")) {
        const mm = raw.match(/^(\d+)?\((.+)\)$/);
        const mult = mm && mm[1] ? parseInt(mm[1], 10) : 1;
        const inner = mm ? mm[2] : raw;
        let m;
        if ((m = inner.match(/^(\d+)x1x(\d+(?:\.\d+)?)$/i))) {
          parts.push({ count: mult * parseInt(m[1], 10), cores: 1, sec: parseFloat(m[2]), uni: true, pe: false, sep: "x" });
        } else if ((m = inner.match(/^(\d+)PE(\d+(?:\.\d+)?)$/i))) {
          parts.push({ count: mult * parseInt(m[1], 10), cores: 1, sec: parseFloat(m[2]), uni: true, pe: true, sep: "x" });
        } else if ((m = inner.match(/^(\d+)G(\d+(?:\.\d+)?)$/i))) {
          parts.push({ count: mult, cores: parseInt(m[1], 10), sec: parseFloat(m[2]), uni: false, pe: false, sep: "G" });
        } else if ((m = inner.match(/^(\d+)x(\d+(?:\.\d+)?)$/i))) {
          const n = parseInt(m[1], 10);
          if (n === 1) parts.push({ count: mult, cores: 1, sec: parseFloat(m[2]), uni: true, pe: false, sep: "x" });
          else parts.push({ count: mult, cores: n, sec: parseFloat(m[2]), uni: false, pe: false, sep: "x", ambiguous: true });
        } else {
          return null;
        }
      }
      // "(2x240)" accanto a conduttori unipolari sono 2 unipolari (es. neutro doppio), non un bipolare.
      const hasUni = parts.some(p => p.uni && !p.pe);
      parts.forEach(p => {
        if (p.ambiguous && hasUni) { p.count = p.count * p.cores; p.cores = 1; p.uni = true; }
        delete p.ambiguous;
      });
      if (parts.some(p => !(p.count >= 1 && p.count <= 60 && p.sec > 0 && p.sec <= 1000 && p.cores >= 1 && p.cores <= 61))) return null;
      return parts.length ? parts : null;
    }

    // Diametro e peso di un cavo: { d, w, iz0, bendK, fromCatalog }.
    function pdfCaviSpecs(type, cores, sec, uni, sep) {
      const t = String(type || "").toUpperCase();
      const formKey = (uni ? `1(1x${pdfCaviSecText(sec)})` : `1(${cores}${sep || "G"}${pdfCaviSecText(sec)})`).toUpperCase();
      const catalog = (typeof CABLE_CATALOG !== "undefined" && Array.isArray(CABLE_CATALOG)) ? CABLE_CATALOG : [];
      const hit = catalog.find(it => String(it.type || "").toUpperCase() === t &&
        String(it.form || "").toUpperCase().replace(/\s*PE$/, "").replace(/\s+/g, "") === formKey);
      if (hit) return { d: hit.d, w: hit.w, iz0: hit.iz0, bendK: hit.bendK, fromCatalog: true };

      let d;
      if (uni) {
        if (/KV|RG\d+H|RG7H|ARG|ARE4H/.test(t)) d = pdfCaviLookup(PDFCAVI_D_UNI_MT, sec);
        else if (/H1Z2Z2|FG21|SOLAR/.test(t)) d = pdfCaviLookup(PDFCAVI_D_UNI_SOLARE, sec);
        else if (/FS17|FG17|H07|N07|FS18/.test(t)) d = pdfCaviLookup(PDFCAVI_D_UNI_750V, sec);
        else d = pdfCaviLookup(PDFCAVI_D_UNI_1KV, sec);
      } else {
        const n = Math.max(2, Math.min(5, cores));
        d = pdfCaviLookup(PDFCAVI_D_MULTI[n], sec);
        if (cores > 5) d = +(d * Math.sqrt(cores / 5)).toFixed(1);
      }
      if (/FTG/.test(t)) d = +(d + 0.6).toFixed(1);   // resistenti al fuoco: nastro in più
      // Peso: rame più isolanti e guaina (densità media 1,2 g/cm³ sulla parte non di rame).
      const cu = cores * sec;
      const w = +(cu * 0.0089 + Math.max(0, d * d * 0.785 - cu) * 0.0012).toFixed(2);
      return { d, w, iz0: 0, bendK: uni ? 12 : 8, fromCatalog: false };
    }

    function pdfCaviSys(type) {
      return /FTG|FE180|PH\d+/i.test(String(type || "")) ? "BT_FIRE" : "BT_POWER";
    }

    // Una linea dello schema -> i cavi da posare (uno per ogni cavo fisico: i tre unipolari di una
    // terna sono tre cavi). Ritorna oggetti senza id e senza posizione.
    function pdfLineToCables(line) {
      const parts = parseCableFormation(line.form);
      if (!parts) return [];
      const types = String(line.type || "").split("/").map(s => s.trim()).filter(Boolean);
      const mainType = (types[0] || "FG16OM16").replace(/\s+PE$/i, "");
      // Senza un tipo dichiarato per il PE si usa l'unipolare della stessa famiglia (FG16OR16 -> FG16R16).
      const peType = types[1] ? types[1].replace(/\s+PE$/i, "").trim() : mainType.replace(/^(FT?G\d+)\(?O\)?(?=[MR]\d)/i, "$1");
      const isDc = /H1Z2Z2|FG21/i.test(mainType);
      const mainIdx = parts.findIndex(p => !p.pe);
      const out = [];
      let nCount = 0, peCount = 0, extra = 0;
      const nTot = parts.reduce((a, p, i) => a + (p.uni && !p.pe && i !== mainIdx ? p.count : 0), 0);
      const peTot = parts.reduce((a, p) => a + (p.pe ? p.count : 0), 0);

      parts.forEach((p, i) => {
        const type = p.pe ? peType : mainType;
        const specs = pdfCaviSpecs(type, p.cores, p.sec, p.uni, p.sep);
        const form = p.uni ? `1(1x${pdfCaviSecText(p.sec)})${p.pe ? " PE" : ""}` : `1(${p.cores}${p.sep}${pdfCaviSecText(p.sec)})`;
        // Conduttori in parallelo per fase: la corrente della linea si divide.
        const parallel = (i === mainIdx && p.uni && p.count > 3 && p.count % 3 === 0) ? p.count / 3 : 1;
        for (let k = 0; k < p.count; k++) {
          let suffix = "";
          let loaded = false;
          if (p.pe) {
            peCount++; suffix = peTot > 1 ? `PE${peCount}` : "PE";
          } else if (i === mainIdx) {
            loaded = true;
            if (p.uni) {
              if (p.count === 2) suffix = isDc ? ["+", "-"][k] : ["L", "N"][k];
              else if (p.count === 3) suffix = `L${k + 1}`;
              else if (p.count === 4) { suffix = k < 3 ? `L${k + 1}` : "N"; loaded = k < 3; }
              else if (p.count % 3 === 0) suffix = `L${(k % 3) + 1}.${Math.floor(k / 3) + 1}`;
              else if (p.count > 1) suffix = `${k + 1}`;
            } else if (p.count > 1) suffix = `${k + 1}`;
          } else if (p.uni) {
            nCount++; suffix = nTot > 1 ? `N${nCount}` : "N";
          } else {
            extra++; suffix = `B${extra}`;
          }
          const iz = (loaded && line.iz) ? +(line.iz / parallel).toFixed(1) : 0;
          out.push({
            code: suffix ? `${line.code} ${suffix}` : line.code,
            desc: line.desc || `Linea ${line.code}`,
            type, form,
            d: specs.d, w: specs.w,
            sec: p.sec,
            cores: p.uni ? 1 : (p.cores >= 4 ? 3 : 2),   // conduttori caricati
            iz0: iz || specs.iz0 || (p.sec >= 50 ? 200 : p.sec >= 16 ? 100 : p.sec >= 6 ? 54 : p.sec >= 2.5 ? 32 : 18),
            ib: loaded && line.ib ? +(line.ib / parallel).toFixed(2) : 0,
            bendK: specs.bendK,
            sys: pdfCaviSys(type),
            lengthM: line.length || 0,
            estimated: !specs.fromCatalog
          });
        }
      });
      return out;
    }

    // Testi con posizione ({ str, x, y, w }) -> linee con cavo. Vale per una pagina PDF e per un
    // disegno DWG/DXF: le misure sono relative all'altezza della tabella (dalla riga "Sigla utenza"
    // alla riga "Sezione"), quindi scala e posizione non contano, e in uno stesso spazio possono
    // esserci più tavole affiancate.
    function extractCableLinesFromTexts(items, pageNo) {
      const its = (items || []).map(it => ({ str: String(it.str || "").trim(), x: +it.x || 0, y: +it.y || 0, w: +it.w || 0 })).filter(it => it.str);
      its.forEach(it => { it.cx = it.x + it.w / 2; });
      const siglaLabels = its.filter(it => /^Sigla\s+utenza$/i.test(it.str));
      const sezLabels = its.filter(it => /^Sezione(?:\s*\[mm.?\])?$/i.test(it.str));
      const lines = [];

      siglaLabels.forEach(lSigla => {
        // La riga "Sezione" della stessa tabella: sotto, poco più a destra.
        const lSez = sezLabels.filter(z => z.y < lSigla.y && Math.abs(z.x - lSigla.x) < (lSigla.y - z.y))
          .sort((p, q) => (lSigla.y - p.y) - (lSigla.y - q.y))[0];
        if (!lSez) return;
        const H = lSigla.y - lSez.y;
        if (!(H > 0)) return;
        const u = H / 227.4;                       // unità: punti della tavola di riferimento
        const nextTable = siglaLabels.filter(o => o !== lSigla && o.x > lSigla.x + H && Math.abs(o.y - lSigla.y) < 0.3 * H)
          .sort((p, q) => p.x - q.x)[0];
        const xMax = Math.min(lSigla.x + 3.75 * H, nextTable ? nextTable.x - 2 * u : Infinity);
        const box = its.filter(it => it.x >= lSigla.x - 2 * u && it.x <= xMax && it.y <= lSigla.y + 6 * u && it.y >= lSez.y - 16 * u);
        const label = (re) => box.filter(it => re.test(it.str) && it.x < lSigla.x + 0.6 * H).sort((p, q) => p.x - q.x)[0] || null;
        const lTipo = label(/^Sigla$/i);
        if (!lTipo) return;
        const lCorr = label(/^CORRENTE\s*\(Ib\)/i);
        const lPot = label(/^POTENZA\b/i);
        const lTipologia = label(/^Tipologia\b/i);
        const lLen = label(/^Lunghezza\b/i);
        const lIz = label(/^Portata\b/i);

        const headers = box.filter(it => it !== lSigla && Math.abs(it.y - lSigla.y) <= 3 * u && it.x > lSigla.x + Math.max(lSigla.w, 30 * u) + 5 * u)
          .sort((p, q) => p.cx - q.cx);
        if (!headers.length) return;
        let pitch = 87 * u;
        for (let i = 1; i < headers.length; i++) pitch = Math.min(pitch, Math.max(30 * u, headers[i].cx - headers[i - 1].cx));
        const xData = headers[0].cx - pitch / 2;
        const inCol = (it, h) => it.cx > xData && Math.abs(it.cx - h.cx) < 0.6 * pitch &&
          !headers.some(o => o !== h && Math.abs(it.cx - o.cx) < Math.abs(it.cx - h.cx));
        const cell = (lab, h) => lab ? box.filter(it => it !== lab && Math.abs(it.y - lab.y) <= 4 * u && inCol(it, h))
          .sort((p, q) => p.x - q.x).map(it => it.str).join(" ").trim() : "";

        headers.forEach(h => {
          const code = h.str.replace(/\s+/g, " ");
          if (!/\d/.test(code) || code.length > 40) return;
          const form = cell(lSez, h);
          const type = cell(lTipo, h);
          const tipologia = cell(lTipologia, h);
          if (lTipologia && tipologia && !/^Cavo\b/i.test(tipologia)) return;   // blindo, nessuna linea...
          if (!form || /^-+$/.test(form) || !type || /^-+$/.test(type)) return;
          if (!parseCableFormation(form)) return;
          const yBottom = lPot ? lPot.y + 4 * u : lSigla.y - 26 * u;
          const desc = box.filter(it => it.y < lSigla.y - 3 * u && it.y > yBottom && inCol(it, h))
            .sort((p, q) => (Math.abs(q.y - p.y) > 3 * u ? q.y - p.y : p.x - q.x)).map(it => it.str).join(" ").replace(/\s+/g, " ").trim();
          const m = code.match(/^(.*?)\s+C-?\d+/i);
          lines.push({
            page: pageNo,
            code,
            quadro: m ? m[1].trim() : "",
            desc: desc.length > 70 ? desc.slice(0, 68).trim() + ".." : desc,
            type: type.replace(/\s+/g, " "),
            form: form.replace(/\s+/g, ""),
            length: pdfCaviNumber(cell(lLen, h)) || 0,
            ib: Math.abs(pdfCaviNumber(cell(lCorr, h)) || 0),
            iz: pdfCaviNumber(cell(lIz, h)) || 0,
            sx: lSigla.x, sy: lSigla.y, hx: h.cx
          });
        });
      });
      // Ordine di lettura: tavole da sinistra a destra e dall'alto in basso, poi le colonne.
      lines.sort((p, q) => p.page - q.page || p.sx - q.sx || q.sy - p.sy || p.hx - q.hx);
      lines.forEach(l => { delete l.sx; delete l.sy; delete l.hx; });
      return lines;
    }

    // ---------------------------------------------------------------------------
    // Testi di un disegno DWG/DXF, con la stessa forma dei testi di una pagina PDF.
    // Un disegno è fatto di "contenitori" (spazio modello, spazi carta, blocchi): ognuno ha i suoi
    // testi e gli inserimenti di altri blocchi. I blocchi inseriti si sciolgono nel contenitore
    // che li usa; spazio modello e ogni spazio carta si leggono come pagine separate.
    // ---------------------------------------------------------------------------

    // Testo CAD -> { str, x, y, w } con x al bordo sinistro stimato. align: -1 sinistra, 0 centro, 1 destra.
    function cadTextItem(rawStr, ax, ay, height, align) {
      const str = cleanAcadMText(rawStr);
      if (!str) return null;
      const h = height > 0 ? height : 2.5;
      const w = str.length * h * 0.62;
      const x = align === 0 ? ax - w / 2 : align === 1 ? ax - w : ax;
      return { str, x, y: ay, w };
    }

    // contenitori: { nome: { texts: [], inserts: [{ name, x, y, sx, sy, rot }], base: { x, y }, page: bool } }
    // Tetto ai testi di un contenitore: blocchi inseriti molte volte uno dentro l'altro moltiplicano i testi
    // (un file costruito apposta potrebbe bloccare la pagina). Oltre il tetto la lettura si ferma e lo si dice.
    const CAD_TEXT_LIMIT = 500000;

    function cadContainersToPages(containers) {
      const memo = new Map();       // ogni blocco si scioglie una volta sola
      const visiting = new Set();   // blocchi che si inseriscono da soli (anche attraverso altri): si saltano
      let truncated = false;
      const expand = (name) => {
        if (memo.has(name)) return memo.get(name);
        const c = containers[name];
        if (!c || visiting.has(name)) return [];
        visiting.add(name);
        const out = c.texts.slice(0, CAD_TEXT_LIMIT);
        for (const ins of c.inserts) {
          if (out.length >= CAD_TEXT_LIMIT) { truncated = true; break; }
          const b = containers[ins.name];
          if (!b) continue;
          const base = b.base || { x: 0, y: 0 };
          const sx = ins.sx || 1, sy = ins.sy || 1;
          const cos = Math.cos((ins.rot || 0) * Math.PI / 180), sin = Math.sin((ins.rot || 0) * Math.PI / 180);
          for (const t of expand(ins.name)) {
            if (out.length >= CAD_TEXT_LIMIT) { truncated = true; break; }
            const dx = (t.x - base.x) * sx, dy = (t.y - base.y) * sy;
            out.push({ str: t.str, x: ins.x + dx * cos - dy * sin, y: ins.y + dx * sin + dy * cos, w: t.w * Math.abs(sx) });
          }
          for (const t of (ins.attribs || [])) {
            if (out.length >= CAD_TEXT_LIMIT) { truncated = true; break; }
            out.push(t);
          }
        }
        visiting.delete(name);
        memo.set(name, out);
        return out;
      };
      const pages = [];
      Object.keys(containers).filter(n => containers[n].page).forEach(n => {
        const items = expand(n);
        if (items.length) pages.push(items);
      });
      pages.truncated = truncated;
      return pages;
    }

    // DXF (testo) -> pagine di testi.
    function readDxfTextPages(rawText) {
      const rows = String(rawText || "").split(/\r?\n/);
      const containers = { "*MODEL": { texts: [], inserts: [], page: true }, "*PAPER": { texts: [], inserts: [], page: true } };
      let section = "", block = null, lastInsert = null;
      let i = 0;
      const pair = (k) => [rows[k].trim(), (rows[k + 1] || "").replace(/\s+$/, "")];
      while (i < rows.length - 1) {
        const [code, val] = pair(i);
        if (code !== "0") { i += 2; continue; }
        const type = val.trim();
        const g = {};
        let text3 = "";
        let j = i + 2;
        while (j < rows.length - 1) {
          const [c, v] = pair(j);
          if (c === "0") break;
          if (c === "3") text3 += v;
          else if (g[c] === undefined) g[c] = v;
          j += 2;
        }
        i = j;
        const num = (k, d = 0) => { const v = parseFloat(g[k]); return isFinite(v) ? v : d; };
        if (type === "SECTION") { section = String(g["2"] || "").trim(); continue; }
        if (type === "ENDSEC") { section = ""; block = null; continue; }
        if (type === "BLOCK") {
          const name = String(g["2"] || "").trim();
          block = name;
          containers[name] = { texts: [], inserts: [], base: { x: num("10"), y: num("20") }, page: /^\*PAPER_SPACE/i.test(name) };
          continue;
        }
        if (type === "ENDBLK") { block = null; continue; }
        if (section !== "ENTITIES" && section !== "BLOCKS") continue;
        const target = section === "BLOCKS" ? containers[block] : containers[g["67"] === "1" ? "*PAPER" : "*MODEL"];
        if (!target) continue;
        if (type === "TEXT" || type === "ATTRIB") {
          const hal = parseInt(g["72"] || "0", 10) || 0, val2 = parseInt(g[type === "ATTRIB" ? "74" : "73"] || "0", 10) || 0;
          const useAlign = (hal !== 0 || val2 !== 0) && g["11"] !== undefined;
          const item = cadTextItem(g["1"] || "", useAlign ? num("11") : num("10"), useAlign ? num("21") : num("20"), num("40"),
            (hal === 1 || hal === 4) ? 0 : hal === 2 ? 1 : -1);
          if (!item) continue;
          if (type === "ATTRIB" && lastInsert) lastInsert.attribs.push(item); else target.texts.push(item);
        } else if (type === "MTEXT") {
          const att = parseInt(g["71"] || "1", 10) || 1, h = num("40", 2.5);
          const row = Math.floor((att - 1) / 3);   // 0 alto, 1 mezzo, 2 basso
          const item = cadTextItem(text3 + (g["1"] || ""), num("10"), num("20") - (row === 0 ? h : row === 1 ? h / 2 : 0), h, ((att - 1) % 3) - 1);
          if (item) target.texts.push(item);
        } else if (type === "INSERT") {
          lastInsert = { name: String(g["2"] || "").trim(), x: num("10"), y: num("20"), sx: num("41", 1), sy: num("42", 1), rot: num("50"), attribs: [] };
          target.inserts.push(lastInsert);
        } else if (type !== "SEQEND" && type !== "VERTEX") {
          if (type !== "ATTRIB") lastInsert = null;
        }
      }
      return cadContainersToPages(containers);
    }

    // DWG letto da LibreDWG (oggetto "database" di libredwg-web) -> pagine di testi.
    function readDwgTextPages(db) {
      const containers = {};
      const pt = (ent, ...keys) => { for (const k of keys) { const p = ent[k]; if (p && typeof p.x === "number") return p; } return null; };
      const addEntities = (target, entities) => {
        (entities || []).forEach(ent => {
          const t = String(ent.type || "").toUpperCase();
          if (t === "TEXT" || t === "ATTRIB") {
            const src = (ent.text && typeof ent.text === "object") ? ent.text : ent;   // negli attributi il testo è annidato
            const hal = src.halign || 0, valn = src.valign || 0;
            const p0 = pt(src, "startPoint", "insertionPoint", "position"), p1 = pt(src, "endPoint", "alignmentPoint");
            const useAlign = (hal !== 0 || valn !== 0) && p1 && (p1.x !== 0 || p1.y !== 0);
            const p = useAlign ? p1 : (p0 || p1);
            if (!p) return;
            const item = cadTextItem(typeof src.text === "string" ? src.text : (src.value || src.string || ""), p.x, p.y, src.textHeight || src.height || 0,
              (hal === 1 || hal === 4) ? 0 : hal === 2 ? 1 : -1);
            if (item) target.texts.push(item);
          } else if (t === "MTEXT") {
            const p = pt(ent, "insertionPoint", "position", "startPoint");
            if (!p) return;
            const att = ent.attachmentPoint || 1, h = ent.textHeight || ent.height || 2.5;
            const row = Math.floor((att - 1) / 3);
            const item = cadTextItem(ent.text || ent.value || "", p.x, p.y - (row === 0 ? h : row === 1 ? h / 2 : 0), h, ((att - 1) % 3) - 1);
            if (item) target.texts.push(item);
          } else if (t === "INSERT") {
            const p = pt(ent, "insertionPoint", "position");
            if (!p) return;
            const ins = { name: String(ent.name || ent.blockName || ""), x: p.x, y: p.y, sx: ent.xScale || 1, sy: ent.yScale || 1,
              rot: (ent.rotation || 0) * 180 / Math.PI, attribs: [] };
            const holder = { texts: [] };
            addEntities(holder, ent.attribs || ent.attributes || []);
            ins.attribs = holder.texts;
            target.inserts.push(ins);
          }
        });
      };
      const records = (db && db.tables && db.tables.BLOCK_RECORD && Array.isArray(db.tables.BLOCK_RECORD.entries)) ? db.tables.BLOCK_RECORD.entries : [];
      records.forEach(br => {
        const name = String(br.name || "");
        const c = { texts: [], inserts: [], base: pt(br, "basePoint", "origin") || { x: 0, y: 0 }, page: /^\*(MODEL|PAPER)_SPACE/i.test(name) };
        addEntities(c, br.entities);
        containers[name] = c;
      });
      // Le entità dello spazio modello stanno in db.entities: se il blocco *Model_Space non le ha già, si aggiungono.
      const top = { texts: [], inserts: [], page: true };
      addEntities(top, db && db.entities);
      const modelName = Object.keys(containers).find(n => /^\*MODEL_SPACE$/i.test(n));
      if (!modelName || (containers[modelName].texts.length + containers[modelName].inserts.length) === 0) {
        if (modelName) delete containers[modelName];
        containers["*TOP"] = top;
      }
      return cadContainersToPages(containers);
    }

    // ---------------------------------------------------------------------------
    // Interfaccia
    // ---------------------------------------------------------------------------
    let pdfCaviLines = [];        // linee trovate nell'ultimo schema letto (PDF, DWG o DXF)
    let pdfCaviChecked = new Set();
    let pdfCaviFileName = "";

    async function importPdfCablesFile(inputEl) {
      const file = inputEl && inputEl.files && inputEl.files[0];
      if (!file) return;
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = `Lettura dei cavi da "${file.name}"...`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold";
      }
      try {
        const buf = await file.arrayBuffer();
        const head = new TextDecoder("latin1").decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 2048)));
        const lines = [];
        if (/\.pdf$/i.test(file.name) || head.startsWith("%PDF")) {
          const pdfjsLib = await loadPdfJs();
          const pdf = await openPdfDocument(pdfjsLib, buf);
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const tc = await page.getTextContent();
            const items = tc.items.map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0 }));
            lines.push(...extractCableLinesFromTexts(items, p));
          }
        } else {
          let pages;
          if (/\.dxf$/i.test(file.name) || (/SECTION/.test(head) && !/^AC10/.test(head))) {
            let text;
            try { text = new TextDecoder("utf-8", { fatal: true }).decode(buf); }
            catch (e) { text = new TextDecoder("windows-1252").decode(buf); }
            pages = readDxfTextPages(text);
          } else {
            if (!globalLibreDwgInstance) globalLibreDwgInstance = await loadLibreDwgWasmInstance();
            const fileType = (globalLibreDwgLib && globalLibreDwgLib.Dwg_File_Type) ? globalLibreDwgLib.Dwg_File_Type.DWG : 0;
            let ptr;
            try { ptr = globalLibreDwgInstance.dwg_read_data(buf, fileType); }
            catch (eRead) { ptr = globalLibreDwgInstance.dwg_read_data(new Uint8Array(buf), fileType); }
            if (!ptr) throw new Error("il DWG non è stato decodificato");
            pages = readDwgTextPages(globalLibreDwgInstance.convert(ptr));
          }
          pages.forEach((items, i) => { for (const l of extractCableLinesFromTexts(items, i + 1)) lines.push(l); });
          if (pages.truncated)
            toast(`Il disegno ha più di ${CAD_TEXT_LIMIT.toLocaleString("it-IT")} testi (blocchi inseriti uno dentro l'altro): ne ho letti solo una parte, alcune linee possono mancare.`, "warn", null, 10000);
        }
        if (!lines.length) {
          if (banner) banner.textContent = `Nessun cavo riconosciuto in "${file.name}"`;
          toast("Nel file non ho trovato tabelle con le righe \"Sigla utenza\", \"Sigla\" e \"Sezione\": leggo gli schemi unifilari con la tabella dei circuiti sotto lo schema, in PDF (con testo, non scansioni), DWG o DXF.", "warn", null, 10000);
          return;
        }
        lines.forEach((l, i) => { l.id = i; });
        pdfCaviLines = lines;
        pdfCaviChecked = new Set();
        pdfCaviFileName = file.name;
        if (banner) banner.textContent = `Schema letto: ${lines.length} linee con cavo`;
        openPdfCaviModal();
      } catch (err) {
        console.error("Errore lettura schema:", err);
        if (banner) {
          banner.textContent = `Errore lettura "${file.name}": ${err.message || err}`;
          banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold";
        }
      } finally {
        inputEl.value = "";
      }
    }

    function openPdfCaviModal() {
      const m = document.getElementById("pdfCaviModal");
      if (!m) return;
      document.getElementById("pdfCaviFile").textContent = pdfCaviFileName;
      const sel = document.getElementById("pdfCaviQuadro");
      const quadri = [...new Set(pdfCaviLines.map(l => l.quadro).filter(Boolean))];
      sel.innerHTML = `<option value="">Tutti i quadri (${pdfCaviLines.length})</option>` +
        quadri.map(q => `<option value="${escapeHtml(q)}">${escapeHtml(q)} (${pdfCaviLines.filter(l => l.quadro === q).length})</option>`).join("");
      document.getElementById("pdfCaviFilter").value = "";
      const base = pdfCaviFileName.replace(/\.(pdf|dwg|dxf)$/i, "").replace(/[^a-zA-Z0-9À-ÿ_ -]+/g, " ").trim();
      document.getElementById("pdfCaviName").value = `CANALINA ${String(projectSections.length + (state.cables.length ? 1 : 0)).padStart(2, "0")}${base ? " - " + base.slice(0, 40) : ""}`;
      renderPdfCaviList();
      m.classList.remove("hidden");
    }

    function closePdfCaviModal() {
      const m = document.getElementById("pdfCaviModal");
      if (m) m.classList.add("hidden");
    }

    function pdfCaviVisibleLines() {
      const q = document.getElementById("pdfCaviQuadro").value;
      const f = document.getElementById("pdfCaviFilter").value.trim().toLowerCase();
      return pdfCaviLines.filter(l => (!q || l.quadro === q) &&
        (!f || `${l.code} ${l.desc} ${l.type} ${l.form}`.toLowerCase().includes(f)));
    }

    function renderPdfCaviList() {
      const body = document.getElementById("pdfCaviBody");
      const rows = pdfCaviVisibleLines();
      body.innerHTML = rows.map(l => `
        <tr class="border-b border-slate-800/70 hover:bg-slate-800/40 cursor-pointer" onclick="togglePdfCaviLine(${l.id})">
          <td class="px-2 py-1"><input type="checkbox" class="pointer-events-none" ${pdfCaviChecked.has(l.id) ? "checked" : ""} aria-label="Scegli ${escapeHtml(l.code)}"></td>
          <td class="px-2 py-1 mono text-cyan-300 whitespace-nowrap">${escapeHtml(l.code)}</td>
          <td class="px-2 py-1 text-slate-300">${escapeHtml(l.desc)}</td>
          <td class="px-2 py-1 mono whitespace-nowrap">${escapeHtml(l.type)}</td>
          <td class="px-2 py-1 mono whitespace-nowrap text-amber-200">${escapeHtml(l.form)}</td>
          <td class="px-2 py-1 mono text-right">${l.length ? l.length + " m" : ""}</td>
          <td class="px-2 py-1 mono text-right">${l.ib ? String(l.ib).replace(".", ",") + " A" : ""}</td>
          <td class="px-2 py-1 mono text-right text-slate-500">${l.page}</td>
        </tr>`).join("") || `<tr><td colspan="8" class="px-2 py-6 text-center text-slate-500">Nessuna linea con questo filtro</td></tr>`;
      updatePdfCaviSummary();
    }

    function togglePdfCaviLine(id) {
      if (pdfCaviChecked.has(id)) pdfCaviChecked.delete(id); else pdfCaviChecked.add(id);
      renderPdfCaviList();
    }

    function setPdfCaviVisible(checked) {
      pdfCaviVisibleLines().forEach(l => { if (checked) pdfCaviChecked.add(l.id); else pdfCaviChecked.delete(l.id); });
      renderPdfCaviList();
    }

    function pdfCaviSelectedCables() {
      const cables = [];
      pdfCaviLines.filter(l => pdfCaviChecked.has(l.id)).forEach(l => cables.push(...pdfLineToCables(l)));
      return cables;
    }

    function updatePdfCaviSummary() {
      const cables = pdfCaviSelectedCables();
      const area = cables.reduce((a, c) => a + Math.PI * c.d * c.d / 4, 0);
      const weight = cables.reduce((a, c) => a + c.w, 0);
      const trayArea = (state.width || 0) * (state.height || 0);
      const el = document.getElementById("pdfCaviSummary");
      if (el) {
        el.textContent = cables.length
          ? `${pdfCaviChecked.size} linee = ${cables.length} cavi · sezione occupata ${Math.round(area).toLocaleString("it-IT")} mm²` +
            (trayArea ? ` (${Math.round(area / trayArea * 100)}% di una ${state.width}x${state.height})` : "") +
            ` · ${weight.toFixed(1).replace(".", ",")} kg/m`
          : "Scegli le linee che passano nella canalina";
      }
      const btn = document.getElementById("pdfCaviCreate");
      if (btn) btn.disabled = !cables.length;
    }

    function createTrayFromPdfCables() {
      const picked = pdfCaviSelectedCables();
      if (!picked.length) return;
      const name = document.getElementById("pdfCaviName").value.trim() || "CANALINA DA PDF";
      // Una canalina vuota appena creata si riusa; altrimenti se ne apre una nuova.
      if (state.cables.length > 0) addNewSectionTab(false);
      state.title = name;
      state.pdfLoaded = true;
      state.cables = picked.map((c, i) => ({
        id: i + 1,
        code: c.code,
        d: c.d, w: c.w, sec: c.sec, cores: c.cores, iz0: c.iz0, ib: c.ib, bendK: c.bendK,
        trefoil: false, trefoilGroupId: null,
        origX: 18 + (i % 6) * 16,
        origY: c.d / 2 + Math.floor(i / 6) * 16,
        x: 18, y: c.d / 2,
        desc: c.desc, type: c.type, form: c.form, sys: c.sys,
        lengthM: c.lengthM
      }));
      state.cables.forEach(c => registerCableInCatalog(c));
      const estimated = picked.filter(c => c.estimated).length;
      closePdfCaviModal();
      pushStateToUI();
      recalculateAll();
      updateTableUI();
      drawScene();
      fitAll();
      syncActiveSectionToMultiStore();
      renderMultiSectionTabs();
      const elElec = document.getElementById("kpiElectricalCard"); if (elElec) elElec.classList.remove("hidden");
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = `✓ Canalina "${name}": ${picked.length} cavi da ${pdfCaviFileName}`;
        banner.className = "mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
      }
      toast(`Canalina creata con ${picked.length} cavi.` + (estimated ? ` Per ${estimated} il diametro e il peso sono stimati dalla formazione: verificali sulle schede del costruttore.` : ""), estimated ? "warn" : "ok", null, 9000);
    }
