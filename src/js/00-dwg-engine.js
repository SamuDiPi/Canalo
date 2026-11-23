    // ============================================================================
    // MOTORI DI IMPORTAZIONE CARICATI SU RICHIESTA (LibreDWG WASM e pdf.js)
    // ============================================================================
    // pdf.js 3.11.174 (Mozilla, Apache-2.0, testo in src/vendor/pdfjs/LICENSE) è incorporato nella pagina: leggere
    // un PDF non usa la rete. LibreDWG-web (~8 MB) invece si scarica da cdn.jsdelivr.net solo quando si importa un
    // DWG: non è incorporato perché il pacchetto si dichiara GPL-2.0-only, licenza non compatibile con la GPL v3
    // di CanaloCAD se distribuiti insieme. I DXF si leggono senza scaricare nulla.
    const LIBREDWG_ESM_URL = "https://cdn.jsdelivr.net/npm/@mlightcad/libredwg-web@0.1.3/+esm";
    const PDFJS_URL = "@embed:vendor/pdfjs/pdf.min.js";
    const PDFJS_WORKER_URL = "@embed:vendor/pdfjs/pdf.worker.min.js";

    // data URI -> URL di un Blob (il worker di pdf.js non parte da un data URI).
    function dataUriToBlobUrl(uri, type) {
      const b64 = uri.slice(uri.indexOf(",") + 1);
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type }));
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

    // Restituisce (e memorizza) l'istanza LibreDWG; le chiamate concorrenti condividono lo stesso download.
    function loadLibreDwgWasmInstance() {
      if (globalLibreDwgInstance) return Promise.resolve(globalLibreDwgInstance);
      if (!libreDwgPromise) {
        setEngineBadge("Caricamento motore DWG…", "busy");
        libreDwgPromise = import(LIBREDWG_ESM_URL)
          .then(lib => {
            if (!lib || !lib.LibreDwg) throw new Error("Libreria @mlightcad/libredwg-web non valida.");
            globalLibreDwgLib = lib;
            return lib.LibreDwg.create();
          })
          .then(instance => {
            globalLibreDwgInstance = instance;
            setEngineBadge("Motore DWG pronto", "ok");
            return instance;
          })
          .catch(err => {
            libreDwgPromise = null; // consente un nuovo tentativo al prossimo import
            setEngineBadge("Motore DWG non disponibile", "error");
            throw new Error(`Impossibile caricare il motore DWG (serve la connessione al primo uso): ${err.message}`);
          });
      }
      return libreDwgPromise;
    }

    function loadPdfJs() {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      if (!pdfJsPromise) {
        pdfJsPromise = new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = dataUriToBlobUrl(PDFJS_URL, "text/javascript");
          s.onload = () => {
            if (!window.pdfjsLib) return reject(new Error("pdf.js non disponibile"));
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = dataUriToBlobUrl(PDFJS_WORKER_URL, "text/javascript");
            resolve(window.pdfjsLib);
          };
          s.onerror = () => { pdfJsPromise = null; reject(new Error("pdf.js non caricato.")); };
          document.head.appendChild(s);
        });
      }
      return pdfJsPromise;
    }

    function toggleDwgInspector() {
      document.getElementById("dwgInspectorModal").classList.toggle("hidden");
    }

