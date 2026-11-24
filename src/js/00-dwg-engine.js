    // ============================================================================
    // MOTORI DI IMPORTAZIONE CARICATI SU RICHIESTA (LibreDWG WASM e pdf.js)
    // ============================================================================
    // pdf.js 6.5.438 (Mozilla, Apache-2.0, testo in src/vendor/pdfjs/LICENSE) è incorporato nella pagina: leggere
    // un PDF non usa la rete. Versione successiva alla correzione di CVE-2024-4367; in più i PDF si aprono con
    // isEvalSupported: false (nessun codice generato dai font del PDF). Anche LibreDWG-web 0.9.3 (GPL-3.0, contiene GNU
    // LibreDWG 0.14.8608; testo in src/vendor/libredwg-web/COPYING) è incorporato: modulo unico e WebAssembly compresso
    // (~2 MB), preparati da tools/vendor-libredwg-web.mjs. Nessun file si scarica dalla rete, nemmeno per i DWG.
    // Le versioni 0.1.x (LibreDWG del 2025) avevano vulnerabilità note dal 2026.
    const LIBREDWG_URL = "@embed:vendor/libredwg-web/libredwg-web.mjs";
    const LIBREDWG_WASM_GZ = "@embed:vendor/libredwg-web/libredwg-web.wasm.gz";
    const PDFJS_URL = "@embed:vendor/pdfjs/pdf.min.mjs";
    const PDFJS_WORKER_URL = "@embed:vendor/pdfjs/pdf.worker.min.mjs";

    // data URI -> URL di un Blob (il worker di pdf.js non parte da un data URI).
    function dataUriToBytes(uri) {
      const bin = atob(uri.slice(uri.indexOf(",") + 1));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    function dataUriToBlobUrl(uri, type) {
      return URL.createObjectURL(new Blob([dataUriToBytes(uri)], { type }));
    }

    let globalLibreDwgLib = null;
    let globalLibreDwgInstance = null;
    let libreDwgPromise = null;
    let pdfJsPromise = null;

    function setEngineBadge(text, tone) {
      const badge = document.getElementById("wasmStatusBadge");
      if (!badge) return;
      const tones = {
        idle: "bg-slate-800 text-slate-300 border-slate-700",
        busy: "bg-amber-500/15 text-amber-200 border-amber-500/40",
        ok: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
        error: "bg-red-500/15 text-red-200 border-red-500/40"
      };
      badge.textContent = text;
      badge.className = `text-xs mono px-2 py-0.5 rounded border font-semibold ${tones[tone] || tones.idle}`;
    }

    // WebAssembly incorporato: data URI gzip -> byte.
    async function libreDwgWasmBinary() {
      const stream = new Blob([dataUriToBytes(LIBREDWG_WASM_GZ)]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }

    // Restituisce (e memorizza) l'istanza LibreDWG; le chiamate concorrenti condividono lo stesso caricamento.
    function loadLibreDwgWasmInstance() {
      if (globalLibreDwgInstance) return Promise.resolve(globalLibreDwgInstance);
      if (!libreDwgPromise) {
        setEngineBadge("Caricamento motore DWG…", "busy");
        libreDwgPromise = Promise.all([import(dataUriToBlobUrl(LIBREDWG_URL, "text/javascript")), libreDwgWasmBinary()])
          .then(([lib, wasmBinary]) => {
            if (!lib || !lib.LibreDwg || !lib.createModule) throw new Error("Libreria @mlightcad/libredwg-web non valida.");
            globalLibreDwgLib = lib;
            // locateFile: senza, il caricatore costruisce l'indirizzo del .wasm da quello del modulo (un Blob: non
            // valido). Il file non viene letto: i byte sono già in wasmBinary.
            return lib.createModule({ wasmBinary, locateFile: name => name }).then(m => lib.LibreDwg.createByWasmInstance(m));
          })
          .then(instance => {
            globalLibreDwgInstance = instance;
            setEngineBadge("Motore DWG pronto", "ok");
            return instance;
          })
          .catch(err => {
            libreDwgPromise = null; // consente un nuovo tentativo al prossimo import
            setEngineBadge("Motore DWG non disponibile", "error");
            throw new Error(`Impossibile caricare il motore DWG:${err.message}`);
          });
      }
      return libreDwgPromise;
    }

    // pdf.js è un modulo ES: si importa da un Blob, e il worker (modulo anche lui) parte da un altro Blob.
    function loadPdfJs() {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      if (!pdfJsPromise) {
        pdfJsPromise = import(dataUriToBlobUrl(PDFJS_URL, "text/javascript"))
          .then(lib => {
            lib.GlobalWorkerOptions.workerSrc = dataUriToBlobUrl(PDFJS_WORKER_URL, "text/javascript");
            window.pdfjsLib = lib;
            return lib;
          })
          .catch(e => { pdfJsPromise = null; throw new Error("pdf.js non caricato: " + (e && e.message ? e.message : e)); });
      }
      return pdfJsPromise;
    }

    // Apertura di un PDF con le opzioni sicure (vedi sopra).
    function openPdfDocument(lib, data) {
      return lib.getDocument({ data, isEvalSupported: false, enableXfa: false }).promise;
    }

    function toggleDwgInspector() {
      document.getElementById("dwgInspectorModal").classList.toggle("hidden");
    }

