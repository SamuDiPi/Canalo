    // ============================================================================
    // COLLEGAMENTO CON CARTESIOCAD (pagina aperta nella scheda CanaloCAD del programma, WebView2)
    // ============================================================================
    // Fuori da CartesioCAD non fa nulla. Dentro: CartesioCAD chiama window.CanaloHost per aprire una sezione del
    // disegno (DXF in base64), e la pagina manda la tavola DXF al programma con chrome.webview.postMessage.
    const cartesioHost = !!(window.chrome && window.chrome.webview);

    function bytesFromBase64(b64) {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }

    window.CanaloHost = {
      // Sezione inviata da CartesioCAD: si importa come un DXF scelto con "Importa", in una scheda nuova se quella
      // attiva non è vuota. Risponde con il numero di schede e di cavi della scheda attiva.
      async importDxf(name, base64) {
        const file = new File([bytesFromBase64(base64)], name, { type: "application/dxf" });
        await importCADFile({ files: [file], value: "" });
        return { sezioni: projectSections.length, cavi: state.cables.length, titolo: state.title };
      },
      // Progetto intero (tutte le schede canalina, come un file .ccad): CartesioCAD lo salva nel disegno.
      project() {
        return buildProjectPayload();
      },
      // Il progetto salvato nel disegno da cui si arriva, oppure un progetto nuovo se il disegno non ne ha.
      loadProject(text) {
        hostProjectSending = false;
        if (text) loadProjectText(text, "progetto del disegno");
        else newProject();
        lastSentProject = buildProjectPayload();
        hostProjectSending = true;
        return { sezioni: projectSections.length };
      },
      // Stato della scheda canalina attiva (lo stesso dei progetti salvati): CartesioCAD lo ricalcola con il suo motore.
      state() {
        return JSON.parse(JSON.stringify(state));
      },
      // Tavola DXF della scheda attiva (la stessa di "Scarica DXF Scheda Attiva").
      sheetDxf() {
        const name = ((document.getElementById("exportName") || {}).value || computeExportFileName(state) || "Canalina_1_1")
          .trim().replace(/\.(dxf|dwg)$/i, "");
        return { nome: `${name}.dxf`, dxf: generateDXFStringForCurrentState(name) };
      },
    };

    // La tavola della scheda attiva a CartesioCAD (con le opzioni di esportazione scelte: caratteri, stili, scala).
    // "tavola" = Inserisci nel disegno da cui si è arrivati; "copia" = negli appunti di CartesioCAD come blocco, da
    // incollare con Ctrl+V in qualsiasi disegno aperto.
    function sendSheetToCartesio(kind = "tavola") {
      if (!cartesioHost) return;
      const { nome, dxf } = window.CanaloHost.sheetDxf();
      let latin1 = "";
      for (let i = 0; i < dxf.length; i++) {
        const c = dxf.charCodeAt(i);
        latin1 += c <= 0xff ? dxf[i] : "?";   // come dxfToBlob: il DXF è a un byte per carattere
      }
      window.chrome.webview.postMessage({ tipo: kind, nome, dxf: btoa(latin1) });
    }

    // Ogni salvataggio automatico del progetto va anche a CartesioCAD (che lo mette nel disegno), solo se è cambiato e
    // non più di una volta al secondo. Fino a loadProject (il progetto del disegno) non si manda nulla.
    let hostProjectSending = false;
    let lastSentProject = "";
    const sendProjectToHost = debounce(() => {
      if (!cartesioHost || !hostProjectSending) return;
      const json = buildProjectPayload();
      // savedAt cambia sempre: si confronta il resto.
      const strip = s => s.replace(/"savedAt": "[^"]*",/, "");
      if (strip(json) === strip(lastSentProject)) return;
      lastSentProject = json;
      window.chrome.webview.postMessage({ tipo: "progetto", progetto: json });
    }, 1000);
    if (cartesioHost) {
      const persistLocal = persistProject;
      persistProject = function () {
        persistLocal();
        sendProjectToHost();
      };
    }

    if (cartesioHost) {
      document.querySelectorAll("[data-cartesio-host]").forEach(el => el.classList.remove("hidden"));
      window.chrome.webview.postMessage({ tipo: "pronta" });
    }
