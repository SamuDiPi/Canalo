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
      // Tavola DXF della scheda attiva (la stessa di "Scarica DXF Scheda Attiva").
      sheetDxf() {
        const name = ((document.getElementById("exportName") || {}).value || computeExportFileName(state) || "Canalina_1_1")
          .trim().replace(/\.(dxf|dwg)$/i, "");
        return { nome: `${name}.dxf`, dxf: generateDXFStringForCurrentState(name) };
      },
    };

    // "Inserisci nel disegno": la tavola va a CartesioCAD, che la inserisce nel disegno da cui si è arrivati.
    function sendSheetToCartesio() {
      if (!cartesioHost) return;
      const { nome, dxf } = window.CanaloHost.sheetDxf();
      let latin1 = "";
      for (let i = 0; i < dxf.length; i++) {
        const c = dxf.charCodeAt(i);
        latin1 += c <= 0xff ? dxf[i] : "?";   // come dxfToBlob: il DXF è a un byte per carattere
      }
      window.chrome.webview.postMessage({ tipo: "tavola", nome, dxf: btoa(latin1) });
    }

    if (cartesioHost) {
      document.querySelectorAll("[data-cartesio-host]").forEach(el => el.classList.remove("hidden"));
      window.chrome.webview.postMessage({ tipo: "pronta" });
    }
