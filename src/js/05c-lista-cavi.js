    // ============================================================================
    // CAVI DA UNA LISTA (EXCEL .XLSX O CSV) -> NUOVA CANALINA
    // Una tabella con una riga per linea: sigla, descrizione, tipo di cavo, formazione, quantità, lunghezza, Ib, quadro
    // (i nomi delle colonne si riconoscono da soli, in italiano o in inglese; tipo e formazione possono stare nella
    // stessa colonna, es. "FG16OM16 5G2,5"). Le linee vanno nella stessa finestra della lettura dello schema.
    // L'Excel si legge qui, senza librerie: solo il primo foglio, con limiti di dimensione contro i file costruiti
    // apposta. Tutto resta nel browser.
    // ============================================================================

    const CABLE_LIST_MAX_BYTES = 40 * 1024 * 1024;   // contenuto decompresso del foglio e dei testi
    const CABLE_LIST_MAX_ROWS = 20000;

    // --- ZIP minimo per l'xlsx: indice centrale, voci "store" o "deflate" (DecompressionStream).
    async function zipEntries(bytes) {
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let eocd = -1;
      for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--)
        if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      if (eocd < 0) throw new Error("file Excel non valido (non è un archivio .xlsx)");
      const count = dv.getUint16(eocd + 10, true);
      let p = dv.getUint32(eocd + 16, true);
      const entries = {};
      for (let n = 0; n < count && p + 46 <= bytes.length; n++) {
        if (dv.getUint32(p, true) !== 0x02014b50) break;
        const method = dv.getUint16(p + 10, true);
        const csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
        const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), commentLen = dv.getUint16(p + 32, true);
        const local = dv.getUint32(p + 42, true);
        const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
        entries[name] = { method, csize, usize, local };
        p += 46 + nameLen + extraLen + commentLen;
      }
      return {
        has: (name) => !!entries[name],
        async text(name) {
          const e = entries[name];
          if (!e) return null;
          if (e.usize > CABLE_LIST_MAX_BYTES) throw new Error("foglio Excel troppo grande");
          const lp = e.local;
          if (dv.getUint32(lp, true) !== 0x04034b50) throw new Error("file Excel danneggiato");
          const start = lp + 30 + dv.getUint16(lp + 26, true) + dv.getUint16(lp + 28, true);
          const data = bytes.subarray(start, start + e.csize);
          let raw;
          if (e.method === 0) raw = data;
          else if (e.method === 8) {
            // Si legge a pezzi e ci si ferma oltre il limite (un file piccolo che si gonfia troppo).
            const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
            const chunks = [];
            let total = 0;
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              total += value.length;
              if (total > CABLE_LIST_MAX_BYTES) { reader.cancel(); throw new Error("foglio Excel troppo grande"); }
              chunks.push(value);
            }
            raw = new Uint8Array(total);
            let o = 0;
            for (const c of chunks) { raw.set(c, o); o += c.length; }
          } else throw new Error("compressione dell'Excel non supportata");
          return new TextDecoder("utf-8").decode(raw);
        }
      };
    }

    function xmlDoc(text) {
      const doc = new DOMParser().parseFromString(text, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) throw new Error("file Excel non leggibile");
      return doc;
    }

    function columnIndex(ref) {
      const m = String(ref || "").match(/^([A-Z]+)/i);
      if (!m) return -1;
      let n = 0;
      for (const ch of m[1].toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
      return n - 1;
    }

    // Primo foglio dell'xlsx -> righe di testi.
    async function readXlsxRows(bytes) {
      const zip = await zipEntries(bytes);
      const shared = [];
      const sst = await zip.text("xl/sharedStrings.xml");
      if (sst) {
        for (const si of xmlDoc(sst).getElementsByTagName("si")) {
          let s = "";
          for (const t of si.getElementsByTagName("t")) s += t.textContent;
          shared.push(s);
        }
      }
      // Il primo foglio dell'elenco della cartella (workbook.xml + relazioni); se manca, sheet1.
      let sheetPath = "xl/worksheets/sheet1.xml";
      const wb = await zip.text("xl/workbook.xml"), rels = await zip.text("xl/_rels/workbook.xml.rels");
      if (wb && rels) {
        const first = xmlDoc(wb).getElementsByTagName("sheet")[0];
        const rid = first && (first.getAttribute("r:id") || first.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id"));
        for (const r of xmlDoc(rels).getElementsByTagName("Relationship"))
          if (r.getAttribute("Id") === rid) {
            const target = r.getAttribute("Target") || "";
            sheetPath = target.startsWith("/") ? target.slice(1) : "xl/" + target.replace(/^\.\//, "");
          }
      }
      const sheet = await zip.text(sheetPath);
      if (!sheet) throw new Error("foglio non trovato nel file Excel");
      const rows = [];
      for (const row of xmlDoc(sheet).getElementsByTagName("row")) {
        if (rows.length >= CABLE_LIST_MAX_ROWS) break;
        const cells = [];
        for (const c of row.getElementsByTagName("c")) {
          const col = columnIndex(c.getAttribute("r"));
          if (col < 0 || col > 200) continue;
          const t = c.getAttribute("t");
          const v = c.getElementsByTagName("v")[0];
          let s = "";
          if (t === "s") s = shared[parseInt(v && v.textContent, 10)] || "";
          else if (t === "inlineStr") { for (const x of c.getElementsByTagName("t")) s += x.textContent; }
          else s = v ? v.textContent : "";
          cells[col] = s;
        }
        rows.push(Array.from(cells, x => x || ""));
      }
      return rows;
    }

    // CSV o testo: separatore ; , o tabulazione (quello più frequente nella prima riga), campi tra virgolette.
    function readCsvRows(text) {
      const firstLine = text.split(/\r?\n/, 1)[0] || "";
      const sep = [";", "\t", ","].map(s => [s, firstLine.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
      const rows = [];
      let row = [], field = "", quoted = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
          if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
          else field += ch;
        } else if (ch === '"' && field === "") quoted = true;
        else if (ch === sep) { row.push(field); field = ""; }
        else if (ch === "\n" || ch === "\r") {
          if (ch === "\r" && text[i + 1] === "\n") i++;
          row.push(field); rows.push(row); row = []; field = "";
          if (rows.length >= CABLE_LIST_MAX_ROWS) return rows;
        } else field += ch;
      }
      if (field !== "" || row.length) { row.push(field); rows.push(row); }
      return rows;
    }

    // Colonne riconosciute dal nome (minuscolo, senza accenti e punteggiatura).
    const CABLE_LIST_COLUMNS = {
      code: /^(sigla( linea| circuito| utenza)?|linea|circuito|codice|id|tag|rif(erimento)?|line|circuit|cable ?(id|tag|no))$/,
      desc: /^(descrizione|utenza|denominazione|destinazione|carico|description|load)$/,
      type: /^(tipo( cavo)?|tipologia|designazione|cavo|cable( type)?|type)$/,
      form: /^(formazione|sezione|conduttori|formazione cavo|section|size|cores)$/,
      qty: /^(quantita|q ?ta|n|nr|numero|n cavi|qty|quantity)$/,
      length: /^(lunghezza( m)?|l( m)?|metri|length)$/,
      ib: /^(ib( a)?|corrente( d impiego)?|current)$/,
      quadro: /^(quadro|da quadro|partenza|board|panel)$/
    };

    function normHeader(s) {
      return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/\[.*?\]|\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    }

    // "FG16OM16 5G2,5" / "FG16OR16 0,6/1kV 3x1x95+1G50" -> { type, form }.
    function splitTypeForm(text) {
      const s = String(text || "").trim();
      const m = s.match(/(\d+\s*\(|\d+\s*[xXgG]\s*\d)/);
      if (!m) return { type: s, form: "" };
      return { type: s.slice(0, m.index).replace(/\s+0[,.]6\/1\s*kV\s*$/i, "").trim(), form: s.slice(m.index).trim() };
    }

    // Righe della tabella -> linee come quelle lette dagli schemi.
    function cableListRowsToLines(rows) {
      let headerRow = -1, cols = {};
      for (let r = 0; r < Math.min(rows.length, 30) && headerRow < 0; r++) {
        const found = {};
        rows[r].forEach((h, i) => {
          const n = normHeader(h);
          for (const [key, re] of Object.entries(CABLE_LIST_COLUMNS))
            if (found[key] === undefined && re.test(n)) found[key] = i;
        });
        if ((found.type !== undefined || found.form !== undefined) && Object.keys(found).length >= 2) { headerRow = r; cols = found; }
      }
      if (headerRow < 0)
        throw new Error("nelle prime righe non ho trovato le intestazioni (per esempio Sigla, Tipo, Formazione, Quantità)");
      const cell = (row, key) => cols[key] === undefined ? "" : String(row[cols[key]] || "").trim();
      const lines = [];
      for (let r = headerRow + 1; r < rows.length; r++) {
        const row = rows[r];
        let type = cell(row, "type"), form = cell(row, "form");
        if (!form || !/\d/.test(form)) {   // tipo e formazione nella stessa colonna
          const split = splitTypeForm(type);
          if (split.form) { type = split.type; form = split.form; }
        }
        if (!form || !/\d/.test(form) || !parseCableFormation(form)) continue;
        const code = cell(row, "code") || `R${r + 1}`;
        const qty = Math.max(1, Math.min(500, Math.round(pdfCaviNumber(cell(row, "qty")) || 1)));
        const base = {
          page: r + 1,
          code,
          quadro: cell(row, "quadro"),
          desc: cell(row, "desc").slice(0, 70),
          type: type.replace(/\s+/g, " "),
          form: form.replace(/\s+/g, ""),
          length: pdfCaviNumber(cell(row, "length")) || 0,
          ib: Math.abs(pdfCaviNumber(cell(row, "ib")) || 0),
          iz: 0
        };
        for (let k = 0; k < qty; k++) lines.push(qty > 1 ? { ...base, code: `${code} #${k + 1}` } : base);
        if (lines.length >= CABLE_LIST_MAX_ROWS) break;
      }
      return lines;
    }

    function isCableListFile(name, head) {
      return /\.(csv|tsv|txt|xlsx|xlsm)$/i.test(name) || head.startsWith("PK");
    }

    async function readCableListLines(buf, name) {
      const bytes = new Uint8Array(buf);
      if (/\.xls$/i.test(name)) throw new Error("il formato .xls (Excel 97-2003) non è supportato: salvarlo come .xlsx o .csv");
      let rows;
      if (/\.(xlsx|xlsm)$/i.test(name) || (bytes[0] === 0x50 && bytes[1] === 0x4b)) rows = await readXlsxRows(bytes);
      else {
        let text;
        try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
        catch (e) { text = new TextDecoder("windows-1252").decode(bytes); }
        rows = readCsvRows(text.replace(/^﻿/, ""));
      }
      return cableListRowsToLines(rows);
    }
