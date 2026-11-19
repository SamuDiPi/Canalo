    // ============================================================================
    // MOTORI DI IMPORTAZIONE CARICATI SU RICHIESTA (LibreDWG WASM e pdf.js)
    // ============================================================================
    // Entrambe le librerie vengono scaricate solo al primo import (LibreDWG pesa ~8 MB),
    // così l'avvio dell'app non dipende dalla rete né dal loro tempo di download.
    const LIBREDWG_ESM_URL = "https://cdn.jsdelivr.net/npm/@mlightcad/libredwg-web@0.1.3/+esm";
    const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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
          s.src = PDFJS_URL;
          s.onload = () => {
            if (!window.pdfjsLib) return reject(new Error("pdf.js non disponibile"));
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
            resolve(window.pdfjsLib);
          };
          s.onerror = () => { pdfJsPromise = null; reject(new Error("Impossibile scaricare pdf.js (serve la connessione al primo uso).")); };
          document.head.appendChild(s);
        });
      }
      return pdfJsPromise;
    }

    function toggleDwgInspector() {
      document.getElementById("dwgInspectorModal").classList.toggle("hidden");
    }

