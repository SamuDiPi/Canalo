const fs = require('fs');

let content = fs.readFileSync('Canalo.html', 'utf8');

// ============================================================================
// 1. NEW MENU BAR & SLIM TOOLBAR (Lines ~50 to 304)
// ============================================================================
const newNavAndToolbar = `  <!-- BARRA DEI MENU STILE WINDOWS / CAD DESKTOP -->
  <nav class="bg-slate-900 border-b border-slate-700/80 text-xs select-none sticky top-0 z-50">
    <div class="max-w-[1920px] mx-auto px-3 flex items-center justify-between">
      <div class="flex items-center">
        <!-- ICONA E TITOLO SOFTWARE -->
        <div class="flex items-center gap-1.5 px-2 py-1.5 mr-2 border-r border-slate-800">
          <span class="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center border border-emerald-500/40">C</span>
          <span class="font-bold text-slate-200 tracking-tight">CanaloCAD</span>
          <span class="text-[9px] mono text-slate-400">v16.4</span>
        </div>

        <!-- VOCI DI MENU A TENDINA (STILE WINDOWS CAD DESKTOP) -->
        <div class="flex items-center relative" id="winMenuBar">
          <!-- 1. FILE -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">File</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-60 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="resetProject(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between">
                <span>📄 Nuovo Progetto</span>
                <span class="text-[10px] text-slate-400 mono">Del</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="exportProjectJSON(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center justify-between">
                <span>💾 Salva Progetto (.JSON)...</span>
                <span class="text-[10px] text-slate-400 mono">Ctrl+S</span>
              </button>
              <button type="button" onclick="document.getElementById('jsonProjectInput').click(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center justify-between">
                <span>📂 Apri Progetto (.JSON)...</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="showPwaOfflineInfo(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-emerald-200 text-emerald-300 flex items-center justify-between">
                <span>⚡ Disponibilità Offline (PWA)</span>
                <span class="text-[9px] px-1.5 py-0.5 bg-emerald-500/30 rounded font-bold">Offline Ready</span>
              </button>
            </div>
          </div>

          <!-- 2. IMPORTA -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">Importa</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="document.getElementById('dwgInput').click(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 hover:text-cyan-200 flex items-center justify-between font-medium">
                <span>📐 Importa .DWG Reale (WASM)...</span>
                <span class="text-[10px] text-cyan-300 mono" id="badgeMenuDwg">Ctrl+O</span>
              </button>
              <button type="button" onclick="document.getElementById('dwgInput').click(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center justify-between">
                <span>📐 Importa File .DXF Reale...</span>
                <span class="text-[10px] text-slate-400 mono">DXF</span>
              </button>
              <button type="button" onclick="document.getElementById('pdfInput').click(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-purple-500/20 hover:text-purple-200 flex items-center justify-between font-medium">
                <span>📄 Importa Schema Unifilare PDF...</span>
                <span class="text-[10px] text-purple-300 mono" id="badgeMenuPdf">Ctrl+U</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="toggleDwgInspector(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-emerald-300 flex items-center justify-between">
                <span>🔍 Ispettore Entità DWG / WASM</span>
              </button>
            </div>
          </div>

          <!-- 3. ESPORTA -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">Esporta</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="exportAutoCADDXF(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 hover:text-amber-200 font-semibold flex items-center justify-between">
                <span>⚡ Scarica AutoCAD .DXF (1:1)...</span>
                <span class="text-[10px] text-amber-400 mono" id="badgeMenuDxf">Ctrl+E</span>
              </button>
              <button type="button" onclick="toggleExportOptionsModal(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>⚙️ Opzioni Esportazione DXF...</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="exportAutoLISPDWG(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-emerald-200 flex items-center justify-between">
                <span>📜 Genera Script AutoLISP (.SCR)</span>
                <span class="text-[10px] text-slate-400 mono">SCR</span>
              </button>
              <button type="button" onclick="exportWordReport(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-blue-500/20 hover:text-blue-200 flex items-center justify-between">
                <span>📄 Esporta Relazione Tecnica (.DOC)</span>
                <span class="text-[10px] text-slate-400 mono">DOC</span>
              </button>
              <button type="button" onclick="exportCSV(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center justify-between">
                <span>📊 Esporta Computo Metrico (.CSV)</span>
                <span class="text-[10px] text-slate-400 mono">CSV</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="window.print(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center justify-between">
                <span>🖨️ Stampa / Salva PDF Vettoriale</span>
                <span class="text-[10px] text-slate-400 mono">Ctrl+P</span>
              </button>
            </div>
          </div>

          <!-- 4. MODIFICA -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">Modifica</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-60 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="swapDimensions(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-amber-300 flex items-center justify-between">
                <span>🔄 Inverti Base L e Altezza H</span>
                <span class="text-[10px] text-slate-400 mono" id="badgeMenuSwap">Ctrl+I</span>
              </button>
              <button type="button" onclick="resetProject(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-300 flex items-center justify-between">
                <span>🗑️ Svuota Canalina (0 Cavi)</span>
                <span class="text-[10px] text-slate-400 mono">Del</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Modalità Posa Cavi:</div>
              <button type="button" onclick="state.packing='gravity'; document.getElementById('inpPacking').value='gravity'; recalculateAll(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200">
                <span>⬇️ Gravità &amp; Scomparti (CEI 64-8)</span>
              </button>
              <button type="button" onclick="state.packing='compact'; document.getElementById('inpPacking').value='compact'; recalculateAll(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200">
                <span>📦 Posa Compatta Ordinata</span>
              </button>
              <button type="button" onclick="state.packing='free'; document.getElementById('inpPacking').value='free'; recalculateAll(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200">
                <span>📐 Coordinate DWG Originali</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="recalculateAll(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center justify-between">
                <span>⚡ Ricalcola Derating &amp; Portate</span>
                <span class="text-[10px] text-slate-400 mono">F5</span>
              </button>
            </div>
          </div>

          <!-- 5. VISUALIZZA -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">Visualizza</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="toggleTheme(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-cyan-300 flex items-center justify-between">
                <span>🌓 Inverti Tema (Scuro / Chiaro)</span>
              </button>
              <button type="button" onclick="fitAll(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between">
                <span>🔍 Zoom Tutto (Centra Sezione)</span>
                <span class="text-[10px] text-slate-400 mono">Home</span>
              </button>
              <button type="button" onclick="zoomSection(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>📐 Zoom Solo Sezione</span>
              </button>
              <button type="button" onclick="zoomTables(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>📊 Zoom Solo Tabelle</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Sezioni Disegno Costruttivo:</div>
              <label class="px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer">
                <span>📦 Proiezione 3D Assonometrica</span>
                <input type="checkbox" id="menuChk3D" onchange="toggleSectionExport('iso3d', this.checked)" class="rounded text-cyan-500">
              </label>
              <label class="px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer">
                <span>📈 Curva di Carico &amp; Freccia</span>
                <input type="checkbox" id="menuChkChart" onchange="toggleSectionExport('chart', this.checked)" class="rounded text-cyan-500">
              </label>
              <label class="px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer">
                <span>📋 Distinta Cavi Posati (BOM)</span>
                <input type="checkbox" id="menuChkBOM" onchange="toggleSectionExport('bom', this.checked)" class="rounded text-cyan-500">
              </label>
              <label class="px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer">
                <span>📐 Cartiglio &amp; Committente</span>
                <input type="checkbox" id="menuChkCartiglio" onchange="toggleSectionExport('cartiglio', this.checked)" class="rounded text-cyan-500">
              </label>
            </div>
          </div>

          <!-- 6. DATABASE -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">Database</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="filterDbCategory('all'); toggleDatabaseModal(true); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 hover:text-cyan-200 font-bold text-cyan-400 flex items-center justify-between">
                <span>📖 Catalogo Tecnico Cavi &amp; Canaline</span>
                <span class="text-[10px] text-cyan-400 mono" id="badgeMenuDb">F3</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="filterDbCategory('bt_uni'); toggleDatabaseModal(true); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>⚡ Cavi BT Unipolari (FG16M16 / FS17)</span>
              </button>
              <button type="button" onclick="filterDbCategory('bt_multi'); toggleDatabaseModal(true); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>🔌 Cavi BT Multipolari (FG16OM16 / H07RN)</span>
              </button>
              <button type="button" onclick="filterDbCategory('signal'); toggleDatabaseModal(true); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>📡 Segnali &amp; Dati (LiYCY / KNX / Cat6)</span>
              </button>
              <button type="button" onclick="filterDbCategory('fire'); toggleDatabaseModal(true); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>🔥 Resistenti al Fuoco PH120 (FTG18)</span>
              </button>
              <button type="button" onclick="filterDbCategory('data'); toggleDatabaseModal(true); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>🌐 Reti Dati LAN &amp; Fibra Ottica</span>
              </button>
              <button type="button" onclick="filterDbCategory('trays_supports'); toggleDatabaseModal(true); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-amber-300">
                <span>🏗️ Canaline &amp; Mensole Normate</span>
              </button>
            </div>
          </div>

          <!-- 7. PROGETTO -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">Progetto</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="openCartiglioSettingsModal(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 text-amber-300 flex items-center justify-between font-bold">
                <span>📐 Dati Cartiglio, Progettista &amp; Committente...</span>
                <span class="text-[10px] text-amber-300 mono" id="badgeMenuCartiglio">F2</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="addNewSectionTab(false); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 text-emerald-300 flex items-center justify-between">
                <span>➕ Nuova Sezione Canalina</span>
              </button>
              <button type="button" onclick="addNewSectionTab(true); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 text-cyan-300 flex items-center justify-between">
                <span>📑 Duplica Sezione Corrente</span>
              </button>
              <button type="button" onclick="deleteCurrentSectionTab(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-300 flex items-center justify-between">
                <span>🗑️ Elimina Sezione Corrente</span>
              </button>
            </div>
          </div>

          <!-- 8. STRUMENTI -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">Strumenti</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="openShortcutsModal(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 text-cyan-300 flex items-center justify-between font-bold">
                <span>⌨️ Personalizza Scorciatoie da Tastiera...</span>
                <span class="text-[10px] text-cyan-300 mono" id="badgeMenuShortcuts">F4</span>
              </button>
              <button type="button" onclick="openCartiglioSettingsModal(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>🏷️ Etichetta Planimetria &amp; Sigla</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <button type="button" onclick="toggleRuler(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                <span>📏 Righello CAD Misura Distanze</span>
              </button>
              <button type="button" onclick="autoSizeTray(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-amber-300">
                <span>⚡ Dimensionamento Automatico (Auto-Size)</span>
              </button>
              <button type="button" onclick="toggleDwgInspector(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-emerald-300">
                <span>🔍 Ispettore Entità DWG / WASM</span>
              </button>
            </div>
          </div>

          <!-- 9. AIUTO -->
          <div class="win-menu-item relative">
            <button type="button" class="win-menu-btn px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded transition">Aiuto</button>
            <div class="win-dropdown hidden absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50">
              <button type="button" onclick="showQuickHelpModal(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center justify-between">
                <span>📖 Guida Rapida &amp; Comandi</span>
                <span class="text-[10px] text-slate-400 mono" id="badgeMenuHelp">F1</span>
              </button>
              <button type="button" onclick="showPwaOfflineInfo(); closeAllMenus();" class="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-emerald-300 flex items-center justify-between">
                <span>⚡ Informazioni PWA Offline</span>
              </button>
              <div class="border-t border-slate-800 my-1"></div>
              <div class="px-3 py-1.5 text-[10px] text-slate-400 leading-tight">
                Constructive Cable Tray Studio v16.4<br>Motore CAD 100% Client-Side &bull; LibreDWG C/WASM
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- BADGES DI STATO DESTRI -->
      <div class="flex items-center gap-2">
        <span id="pwaStatusBadge" class="text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold" title="Web App funzionante al 100% anche senza connessione internet">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> PWA Offline Ready
        </span>
        <span id="wasmStatusBadge" class="text-[10px] mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
          Motore DWG Attivo
        </span>
      </div>
    </div>
  </nav>

  <!-- BARRA DEGLI STRUMENTI RAPIDI (SLIM TOOLBAR ESSENZIALE & PULITA) -->
  <div class="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
    <div class="flex items-center gap-2 flex-wrap">
      <!-- TITOLO CANALINA IN TESTATA RAPIDA -->
      <div class="flex items-center bg-slate-950 border border-slate-700 rounded px-2 py-0.5">
        <span class="text-[10px] mono text-slate-400 mr-1.5 font-bold">Titolo:</span>
        <input id="inpTitleQuick" type="text" value="NUOVA CANALINA" onchange="document.getElementById('inpTitle').value = this.value; state.title = this.value; drawScene();" class="bg-transparent text-xs text-amber-300 font-semibold w-48 sm:w-64 focus:outline-none" title="Titolo della canalina (ereditato da parentesi)">
      </div>
      <!-- Elemento sicuro per compatibilità di lettura -->
      <span id="headerTitle" class="hidden"></span>

      <div class="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

      <!-- TABS SEZIONI MULTI-TRATTO -->
      <div class="flex items-center gap-1 overflow-x-auto py-0.5" id="multiSectionTabs"></div>
      <button type="button" onclick="addNewSectionTab(false)" class="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold transition" title="Aggiungi nuova tratta">
        +
      </button>

      <!-- PULSANTI RAPIDI APERTURA -->
      <div class="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>
      <button type="button" onclick="document.getElementById('dwgInput').click()" class="inline-flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-semibold text-[11px] transition" title="Apri DWG / DXF (Ctrl+O)">
        <span>📂 DWG/DXF</span>
      </button>
      <input id="dwgInput" type="file" accept=".dwg,.dxf" class="hidden" onchange="importCADFile(this)">

      <button type="button" onclick="document.getElementById('pdfInput').click()" class="inline-flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-semibold text-[11px] transition" title="Importa PDF Unifilare (Ctrl+U)">
        <span>📄 PDF</span>
      </button>
      <input id="pdfInput" type="file" accept=".pdf" class="hidden" onchange="importPDFFile(this)">
      <input id="jsonProjectInput" type="file" accept=".json" class="hidden" onchange="importProjectJSON(this)">

      <button type="button" onclick="openCartiglioSettingsModal()" class="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2 py-0.5 rounded font-medium text-[11px] transition" title="Dati Cartiglio, Progettista &amp; Committente (F2)">
        <span>📐 Cartiglio</span>
      </button>
    </div>

    <!-- AREA EXPORT RAPIDO A DESTRA -->
    <div class="flex items-center gap-1.5">
      <div class="hidden lg:flex items-center bg-slate-950 border border-slate-700 rounded px-2 py-0.5">
        <span class="text-[10px] mono text-slate-400 mr-1">File:</span>
        <input id="exportName" type="text" value="NUOVA_CANALINA" class="bg-transparent text-xs mono text-amber-300 font-semibold w-36 focus:outline-none">
      </div>
      <button type="button" onclick="exportAutoCADDXF()" class="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded shadow text-xs transition" title="Scarica il disegno CAD in formato .DXF 1:1 identico alla preview">
        <span>⚡ Scarica DXF</span>
      </button>
      <button type="button" onclick="toggleExportOptionsModal()" class="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2 py-1 rounded font-semibold transition" title="Opzioni di Stile, Font e Formato DXF">
        <span>⚙️</span>
      </button>
      <button type="button" onclick="toggleTheme()" id="btnTheme" class="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded font-semibold text-xs transition" title="Inverti Tema Scuro / Chiaro">
        🌓
      </button>
    </div>
  </div>`;

const targetNavRegex = /<!-- BARRA DEI MENU STILE WINDOWS \/ CAD DESKTOP -->[\s\S]*?<!-- PANNELLO ISPETTORE ENTITÀ DWG -->/;
content = content.replace(targetNavRegex, `${newNavAndToolbar}\n\n  <!-- PANNELLO ISPETTORE ENTITÀ DWG -->`);

// ============================================================================
// 2. INSERT CARTIGLIO & SHORTCUTS MODALS (Before <script>)
// ============================================================================
const newModalsHtml = `  <!-- MODALE DATI CARTIGLIO, PROGETTISTA & COMMITTENTE (F2) -->
  <div id="cartiglioSettingsModal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
    <div class="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs">
      <div class="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/30">📐</span>
          <h3 class="text-sm font-bold text-white uppercase tracking-wide">Dati Cartiglio, Progettista &amp; Committente</h3>
        </div>
        <button type="button" onclick="closeCartiglioSettingsModal()" class="text-slate-400 hover:text-white font-bold text-lg leading-none">&times;</button>
      </div>
      <div class="p-4 overflow-y-auto space-y-3.5 text-slate-300 text-xs">
        <p class="text-[11px] text-slate-400">Queste informazioni vengono impresse nel cartiglio unificato della tavola grafica CAD 1:1 e nel file .DXF esportato.</p>
        
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="block text-[10px] uppercase font-bold text-amber-300 mb-1">Committente / Cliente</label>
            <input id="cfgClient" type="text" value="PROGETTO ESECUTIVO" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs mono text-white focus:outline-none focus:border-amber-400">
          </div>
          <div class="col-span-2">
            <label class="block text-[10px] uppercase font-bold text-slate-300 mb-1">Titolo Opera / Progetto</label>
            <input id="cfgProject" type="text" value="IMPIANTI ELETTRICI E SPECIALI" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400">
          </div>
          <div>
            <label class="block text-[10px] uppercase font-bold text-slate-300 mb-1">Progettista / Disegnatore</label>
            <input id="cfgAuthor" type="text" value="STUDIO TECNICO" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs mono text-white focus:outline-none focus:border-cyan-400">
          </div>
          <div>
            <label class="block text-[10px] uppercase font-bold text-slate-300 mb-1">Responsabile / Approvatore</label>
            <input id="cfgChecker" type="text" value="RESPONSABILE TECNICO" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs mono text-white focus:outline-none focus:border-cyan-400">
          </div>
          <div>
            <label class="block text-[10px] uppercase font-bold text-slate-300 mb-1">Codice Tavola / Elaborato</label>
            <input id="cfgDocCode" type="text" value="PE-IMP-EL-PART-02" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs mono text-white focus:outline-none focus:border-cyan-400">
          </div>
          <div>
            <label class="block text-[10px] uppercase font-bold text-slate-300 mb-1">Revisione</label>
            <input id="cfgRev" type="text" value="Rev. 00" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs mono text-white focus:outline-none focus:border-cyan-400">
          </div>
          <div>
            <label class="block text-[10px] uppercase font-bold text-cyan-300 mb-1">Scala Rappresentazione CAD</label>
            <select id="cfgScale" class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white">
              <option value="1:1" selected>1:1 (Costruttivo Esecutivo)</option>
              <option value="1:2">1:2</option>
              <option value="1:5">1:5</option>
              <option value="1:10">1:10</option>
              <option value="1:20">1:20</option>
              <option value="1:50">1:50</option>
              <option value="1:100">1:100 (Layout Planimetrico)</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] uppercase font-bold text-emerald-300 mb-1">Etichetta Planimetria &amp; Quota</label>
            <input id="cfgPlanTag" type="text" value="SEZ. A-A | H=+3.20m" class="w-full bg-slate-950 border border-emerald-500/40 rounded px-2.5 py-1.5 text-xs mono text-emerald-300 focus:outline-none focus:border-emerald-400">
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800">
          <label class="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
            <input type="checkbox" id="cfgSaveDefaults" checked class="accent-amber-400 rounded">
            <span>Memorizza questi dati come predefiniti per tutti i nuovi progetti (LocalStorage)</span>
          </label>
        </div>
      </div>
      <div class="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
        <button type="button" onclick="closeCartiglioSettingsModal()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition">Annulla</button>
        <button type="button" onclick="saveCartiglioSettings()" class="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold transition">Applica al Disegno</button>
      </div>
    </div>
  </div>

  <!-- MODALE PERSONALIZZAZIONE SCORCIATOIE DA TASTIERA (F4) -->
  <div id="keyboardShortcutsModal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
    <div class="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs">
      <div class="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center border border-cyan-500/30">⌨</span>
          <h3 class="text-sm font-bold text-white uppercase tracking-wide">Personalizzazione Scorciatoie da Tastiera</h3>
        </div>
        <button type="button" onclick="closeShortcutsModal()" class="text-slate-400 hover:text-white font-bold text-lg leading-none">&times;</button>
      </div>
      <div class="p-4 overflow-y-auto space-y-3 text-slate-300 text-xs">
        <p class="text-[11px] text-slate-400">Clicca sul tasto a destra di qualsiasi comando per assegnare una nuova combinazione di tasti. Viene salvata automaticamente sul browser.</p>
        
        <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 divide-y divide-slate-800/80" id="shortcutsTableBody">
          <!-- Popolato dinamicamente -->
        </div>

        <div id="rebindBanner" class="hidden bg-amber-500/20 border border-amber-500/50 text-amber-200 p-2.5 rounded-lg text-center font-bold animate-pulse text-xs">
          Premi la nuova combinazione di tasti sulla tastiera... (o premi Esc per annullare)
        </div>
      </div>
      <div class="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
        <button type="button" onclick="resetDefaultShortcuts()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition text-[11px]">Ripristina Predefinite</button>
        <button type="button" onclick="closeShortcutsModal()" class="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded font-bold transition">Chiudi</button>
      </div>
    </div>
  </div>\n\n`;

content = content.replace("  <script>\n    if (window.pdfjsLib) {", `${newModalsHtml}  <script>\n    if (window.pdfjsLib) {`);

// ============================================================================
// 3. SAFE headerTitle REFERENCES (Fix crash on DWG/PDF import)
// ============================================================================
content = content.replace(/document\.getElementById\("headerTitle"\)\.textContent\s*=\s*state\.title;/g, 
  `const hTitle = document.getElementById("headerTitle"); if (hTitle) hTitle.textContent = state.title;`);

// ============================================================================
// 4. SUPER-ROBUST extractTrayNameFromInput FUNCTION
// ============================================================================
const newExtractTrayFunction = `    function extractTrayNameFromInput(rawTexts, fileName, width = 200, height = 75) {
      let foundName = null;
      let isExplicit = false;

      if (Array.isArray(rawTexts) && rawTexts.length > 0) {
        const cleanedItems = rawTexts.map(t => ({
          str: cleanAcadMText(t.str || ""),
          x: t.x || 0,
          y: t.y || 0
        })).filter(t => t.str.length > 0);

        // REGOLA 1: Cerca nei singoli testi diciture con parentesi
        // Es. "Dati caratteristici della canalina (Anello PT - Lato DX)" o "Dati (Anello PT - Lato DX)"
        for (const t of cleanedItems) {
          const s = t.str;
          const mParen = s.match(/(?:Dati\\s+caratteristici|Dati\\s+tecnici|Dati|Canalina|Canale|Passerella|Condotto|Tratta|Tronco|Sezione|Particolare)[^(]*\\(([^)]+)\\)/i);
          if (mParen && mParen[1]) {
            const candidate = mParen[1].trim();
            if (!/^\\d+\\s*[xX]\\s*\\d+/i.test(candidate) && !/^C-\\d+$/i.test(candidate) && candidate.length >= 2) {
              foundName = candidate;
              isExplicit = true;
              break;
            }
          }
        }

        // REGOLA 2: Cerca nel testo unito se spezzato in più entità
        if (!foundName) {
          const allJoined = cleanedItems.map(t => t.str).join(" ");
          const mJoined = allJoined.match(/(?:Dati\\s+caratteristici|Dati\\s+tecnici|Dati|Canalina|Canale|Passerella|Condotto|Tratta|Tronco|Sezione|Particolare)[^(]*\\(([^)]+)\\)/i);
          if (mJoined && mJoined[1]) {
            const candidate = mJoined[1].trim();
            if (!/^\\d+\\s*[xX]\\s*\\d+/i.test(candidate) && !/^C-\\d+$/i.test(candidate) && candidate.length >= 2) {
              foundName = candidate;
              isExplicit = true;
            }
          }
        }

        // REGOLA 3: Cerca qualsiasi entità testuale con testo tra parentesi (...) non numerico
        // Es. l'utente ha inserito direttamente un'etichetta "(Anello PT - Lato DX)"
        if (!foundName) {
          for (const t of cleanedItems) {
            const s = t.str;
            if (/distinta|tabella|legenda|materiale|revisione/i.test(s)) continue;
            const mAnyParen = s.match(/\\(([^)]+)\\)/);
            if (mAnyParen && mAnyParen[1]) {
              const candidate = mAnyParen[1].trim();
              const isCableForm = /^\\d+\\s*[xX]\\s*\\d+/i.test(candidate) || /^[1-5][xXGg]\\d+/i.test(candidate) || /^C-\\d+$/i.test(candidate);
              const hasLetters = /[A-Za-z]{2,}/.test(candidate);
              if (!isCableForm && hasLetters && candidate.length >= 3) {
                foundName = candidate;
                isExplicit = true;
                break;
              }
            }
          }
        }

        // REGOLA 4: Diciture con due punti o trattino
        if (!foundName) {
          for (const t of cleanedItems) {
            const s = t.str;
            const mColon = s.match(/(?:Dati\\s+caratteristici(?:\\s+della)?\\s+(?:canalina|passerella|canale)|(?:canalina|passerella|canale))\\s*[:=-]\\s*([A-Za-z0-9_\\-./\\s]{3,50})/i);
            if (mColon && mColon[1]) {
              const candidate = mColon[1].trim();
              if (!/^\\d+\\s*[xX]\\s*\\d+/i.test(candidate)) {
                foundName = candidate;
                isExplicit = true;
                break;
              }
            }
          }
        }

        // REGOLA 5: Header convenzionali canalina/passerella
        if (!foundName) {
          const p1 = cleanedItems.find(t => /^(?:CANALINA|CANALE|PASSERELLA|CONDOTTO|TRONCO)\\s+([A-Za-z0-9_\\-./\\s]{2,40})/i.test(t.str));
          if (p1) {
            foundName = p1.str.trim();
            isExplicit = true;
          }
        }

        // REGOLA 6: Sezione o Oggetto cartiglio
        if (!foundName) {
          const p4 = cleanedItems.find(t => /^(?:OGGETTO|TITOLO|ELABORATO)\\s*[:=-]\\s*(.+)/i.test(t.str));
          if (p4) {
            const m = p4.str.match(/^(?:OGGETTO|TITOLO|ELABORATO)\\s*[:=-]\\s*(.+)/i);
            if (m && m[1]) {
              foundName = m[1].trim();
              isExplicit = true;
            }
          }
        }
      }

      let cleanBase = foundName ? foundName : (fileName || "CANALINA").replace(/\\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, " ").trim();
      cleanBase = cleanBase.replace(/^(?:Dati\\s+caratteristici\\s+(?:della\\s+)?(?:canalina|passerella|canale)\\s*[:=-]?\\s*)/i, "")
                          .replace(/\\s*-\\s*L=\\s*\\d+\\s*mm\\s*H=\\s*\\d+\\s*mm/i, "")
                          .replace(/\\b\\d+\\s*[xX]\\s*\\d+(?:\\s*mm)?\\b/gi, "")
                          .replace(/L=\\s*\\d+\\s*mm/i, "")
                          .replace(/H=\\s*\\d+\\s*mm/i, "")
                          .replace(/^[\\"'\\s]+|[\\"'\\s]+$/g, "")
                          .trim();
      if (!cleanBase) cleanBase = "CANALINA 01";

      const title = cleanBase;
      const exportFile = cleanBase.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      return { title, exportFile, cleanBase, isExplicit };
    }`;

const oldExtractRegex = /function extractTrayNameFromInput\(rawTexts, fileName, width = 200, height = 75\) \{[\s\S]*?return \{ title, exportFile, cleanBase, isExplicit \};\s*\}/;
content = content.replace(oldExtractRegex, newExtractTrayFunction);

// ============================================================================
// 5. UPDATE CARTIGLIO DRAWING IN buildCADScene
// ============================================================================
const oldCartiglioDraw = `      if (state.showCartiglio) {
        const tbH = 16;
        const tbY = lowestY - tbH;
        rect("CORNICE", rightX, tbY, tabW, tbH, "#cbd5e1", boxBg, true);
        rect("CORNICE", rightX, tbY, tabW, 5.5, "#38bdf8", boxAlt, true);
        text("CORNICE", rightX + 4, tbY + 12, 2.3, \`COMMITTENTE: \${state.tb.client} | CODICE: \${state.tb.docCode}\`, "#f8fafc", "left", tabW - 8);
        text("CORNICE", rightX + 4, tbY + 4, 2.2, \`PROGETTISTA: \${state.tb.author} | SCALA: \${state.scale || "1:1"} (\${state.tb.scaleRev})\`, "#fbbf24", "left", tabW - 8);
      }`;

const newCartiglioDraw = `      if (state.showCartiglio) {
        const tbH = 18;
        const tbY = lowestY - tbH;
        rect("CORNICE", rightX, tbY, tabW, tbH, "#cbd5e1", boxBg, true);
        rect("CORNICE", rightX, tbY, tabW, 6, "#38bdf8", boxAlt, true);
        text("CORNICE", rightX + 4, tbY + 13.5, 2.3, \`COMMITTENTE: \${state.tb.client} | OPERA: \${state.tb.project || "IMPIANTI"}\`, "#f8fafc", "left", tabW - 8);
        text("CORNICE", rightX + 4, tbY + 7.5, 2.1, \`CODICE: \${state.tb.docCode} (\${state.tb.rev || "Rev.00"}) | DATA: \${state.tb.date || new Date().toLocaleDateString("it-IT")}\`, "#94a3b8", "left", tabW - 8);
        text("CORNICE", rightX + 4, tbY + 2.0, 2.0, \`PROGETTISTA: \${state.tb.author}\${state.tb.checker ? \` | VERIFICA: \${state.tb.checker}\` : ""} | SCALA: \${state.scale || "1:1"}\`, "#fbbf24", "left", tabW - 8);
      }`;
content = content.replace(oldCartiglioDraw, newCartiglioDraw);

// ============================================================================
// 6. UPDATE state.tb INITIAL VALUES
// ============================================================================
content = content.replace(
  `tb: { client: "PROGETTO ESECUTIVO", docCode: "PE-IMP-EL-PART-02", author: "STUDIO TECNICO", scaleRev: "Scala 1:1 - Rev.00" },`,
  `tb: { client: "PROGETTO ESECUTIVO", project: "IMPIANTI ELETTRICI E SPECIALI", docCode: "PE-IMP-EL-PART-02", author: "STUDIO TECNICO", checker: "RESPONSABILE TECNICO", rev: "Rev. 00", date: new Date().toLocaleDateString("it-IT"), scaleRev: "Scala 1:1 - Rev.00" },`
);

// ============================================================================
// 7. KEYBOARD SHORTCUTS ENGINE & CARTIGLIO MODAL JS LOGIC
// ============================================================================
const shortcutEngineJs = `    // ============================================================================
    // GESTIONE SCORCIATOIE PERSONALIZZABILI & IMPOSTAZIONI CARTIGLIO
    // ============================================================================
    const DEFAULT_KEY_SHORTCUTS = {
      openDwg: { key: 'o', ctrl: true, shift: false, alt: false, label: 'Apri / Importa DWG' },
      openPdf: { key: 'u', ctrl: true, shift: false, alt: false, label: 'Importa PDF Unifilare' },
      exportDxf: { key: 'e', ctrl: true, shift: false, alt: false, label: 'Scarica DXF 1:1' },
      fitAll: { key: 'Home', ctrl: false, shift: false, alt: false, label: 'Zoom Tutto (Centra)' },
      swapDims: { key: 'i', ctrl: true, shift: false, alt: false, label: 'Inverti Base L e H' },
      clearTray: { key: 'Delete', ctrl: false, shift: false, alt: false, label: 'Svuota Canalina' },
      recalculate: { key: 'F5', ctrl: false, shift: false, alt: false, label: 'Ricalcola Portate' },
      cartiglio: { key: 'F2', ctrl: false, shift: false, alt: false, label: 'Dati Cartiglio & Committente' },
      openDb: { key: 'F3', ctrl: false, shift: false, alt: false, label: 'Catalogo Tecnico Database' },
      shortcuts: { key: 'F4', ctrl: false, shift: false, alt: false, label: 'Personalizza Scorciatoie' },
      help: { key: 'F1', ctrl: false, shift: false, alt: false, label: 'Guida Rapida' },
      saveJson: { key: 's', ctrl: true, shift: false, alt: false, label: 'Salva Progetto JSON' }
    };

    let userShortcuts = Object.assign({}, DEFAULT_KEY_SHORTCUTS);
    let rebindingAction = null;

    function loadUserShortcuts() {
      try {
        const saved = localStorage.getItem("canaloCAD_userShortcuts");
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach(k => {
            if (userShortcuts[k]) userShortcuts[k] = parsed[k];
          });
        }
      } catch (e) {}
      updateMenuBadges();
    }

    function saveUserShortcuts() {
      try {
        localStorage.setItem("canaloCAD_userShortcuts", JSON.stringify(userShortcuts));
      } catch (e) {}
      updateMenuBadges();
    }

    function formatShortcutLabel(s) {
      if (!s || !s.key) return "-";
      const parts = [];
      if (s.ctrl) parts.push("Ctrl");
      if (s.alt) parts.push("Alt");
      if (s.shift) parts.push("Shift");
      let k = s.key;
      if (k === " ") k = "Spazio";
      else if (k.length === 1) k = k.toUpperCase();
      parts.push(k);
      return parts.join("+");
    }

    function matchShortcutEvent(e, s) {
      if (!s || !s.key) return false;
      const ctrlMatch = !!s.ctrl === !!(e.ctrlKey || e.metaKey);
      const altMatch = !!s.alt === !!e.altKey;
      const shiftMatch = !!s.shift === !!e.shiftKey;
      const keyMatch = s.key.toLowerCase() === (e.key || "").toLowerCase();
      return ctrlMatch && altMatch && shiftMatch && keyMatch;
    }

    function updateMenuBadges() {
      const bDwg = document.getElementById("badgeMenuDwg"); if (bDwg) bDwg.textContent = formatShortcutLabel(userShortcuts.openDwg);
      const bPdf = document.getElementById("badgeMenuPdf"); if (bPdf) bPdf.textContent = formatShortcutLabel(userShortcuts.openPdf);
      const bDxf = document.getElementById("badgeMenuDxf"); if (bDxf) bDxf.textContent = formatShortcutLabel(userShortcuts.exportDxf);
      const bSwap = document.getElementById("badgeMenuSwap"); if (bSwap) bSwap.textContent = formatShortcutLabel(userShortcuts.swapDims);
      const bDb = document.getElementById("badgeMenuDb"); if (bDb) bDb.textContent = formatShortcutLabel(userShortcuts.openDb);
      const bCart = document.getElementById("badgeMenuCartiglio"); if (bCart) bCart.textContent = formatShortcutLabel(userShortcuts.cartiglio);
      const bSc = document.getElementById("badgeMenuShortcuts"); if (bSc) bSc.textContent = formatShortcutLabel(userShortcuts.shortcuts);
      const bHelp = document.getElementById("badgeMenuHelp"); if (bHelp) bHelp.textContent = formatShortcutLabel(userShortcuts.help);
    }

    function renderShortcutsTable() {
      const container = document.getElementById("shortcutsTableBody");
      if (!container) return;
      container.innerHTML = "";
      Object.entries(userShortcuts).forEach(([actionId, sc]) => {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between p-2.5 hover:bg-slate-900 transition";
        row.innerHTML = \`
          <div>
            <div class="font-bold text-white text-[11px]">\${sc.label}</div>
            <div class="text-[10px] text-slate-400 mono">Azione: \${actionId}</div>
          </div>
          <button type="button" onclick="startRebinding('\${actionId}')" id="scBtn_\${actionId}" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 rounded text-amber-300 mono text-xs font-bold transition flex items-center gap-1.5" title="Clicca per riassegnare">
            <span>\${formatShortcutLabel(sc)}</span>
            <span class="text-[9px] text-slate-400">✏️</span>
          </button>
        \`;
        container.appendChild(row);
      });
    }

    function startRebinding(actionId) {
      rebindingAction = actionId;
      const banner = document.getElementById("rebindBanner");
      if (banner) {
        banner.classList.remove("hidden");
        banner.textContent = \`In ascolto per "\${userShortcuts[actionId].label}"... Premi la nuova combinazione di tasti sulla tastiera (o Esc per annullare)\`;
      }
      const btn = document.getElementById(\`scBtn_\${actionId}\`);
      if (btn) btn.className = "px-2.5 py-1 bg-amber-500 text-slate-950 font-bold border border-amber-400 rounded text-xs animate-pulse";
    }

    function resetDefaultShortcuts() {
      userShortcuts = JSON.parse(JSON.stringify(DEFAULT_KEY_SHORTCUTS));
      saveUserShortcuts();
      renderShortcutsTable();
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = "✓ Scorciatoie ripristinate ai valori predefiniti!";
        banner.className = "mono text-[11px] px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
      }
    }

    function openShortcutsModal() {
      closeAllMenus();
      rebindingAction = null;
      renderShortcutsTable();
      const m = document.getElementById("keyboardShortcutsModal");
      if (m) m.classList.remove("hidden");
    }

    function closeShortcutsModal() {
      rebindingAction = null;
      const b = document.getElementById("rebindBanner");
      if (b) b.classList.add("hidden");
      const m = document.getElementById("keyboardShortcutsModal");
      if (m) m.classList.add("hidden");
    }

    function openCartiglioSettingsModal() {
      closeAllMenus();
      const elClient = document.getElementById("cfgClient"); if (elClient) elClient.value = state.tb.client || "PROGETTO ESECUTIVO";
      const elProj = document.getElementById("cfgProject"); if (elProj) elProj.value = state.tb.project || "IMPIANTI ELETTRICI E SPECIALI";
      const elAuth = document.getElementById("cfgAuthor"); if (elAuth) elAuth.value = state.tb.author || "STUDIO TECNICO";
      const elCheck = document.getElementById("cfgChecker"); if (elCheck) elCheck.value = state.tb.checker || "RESPONSABILE TECNICO";
      const elDoc = document.getElementById("cfgDocCode"); if (elDoc) elDoc.value = state.tb.docCode || "PE-IMP-EL-PART-02";
      const elRev = document.getElementById("cfgRev"); if (elRev) elRev.value = state.tb.rev || "Rev. 00";
      const elScale = document.getElementById("cfgScale"); if (elScale) elScale.value = state.scale || "1:1";
      const elPlan = document.getElementById("cfgPlanTag"); if (elPlan) elPlan.value = state.planTag || "SEZ. A-A | H=+3.20m";
      const m = document.getElementById("cartiglioSettingsModal");
      if (m) m.classList.remove("hidden");
    }

    function closeCartiglioSettingsModal() {
      const m = document.getElementById("cartiglioSettingsModal");
      if (m) m.classList.add("hidden");
    }

    function saveCartiglioSettings() {
      state.tb.client = (document.getElementById("cfgClient").value || "PROGETTO ESECUTIVO").trim();
      state.tb.project = (document.getElementById("cfgProject").value || "IMPIANTI ELETTRICI").trim();
      state.tb.author = (document.getElementById("cfgAuthor").value || "STUDIO TECNICO").trim();
      state.tb.checker = (document.getElementById("cfgChecker").value || "").trim();
      state.tb.docCode = (document.getElementById("cfgDocCode").value || "PE-IMP-EL-PART-02").trim();
      state.tb.rev = (document.getElementById("cfgRev").value || "Rev. 00").trim();
      state.tb.scaleRev = \`Scala \${document.getElementById("cfgScale").value || state.scale || "1:1"} - \${state.tb.rev}\`;
      state.scale = document.getElementById("cfgScale").value || state.scale || "1:1";
      state.planTag = (document.getElementById("cfgPlanTag").value || "SEZ. A-A | H=+3.20m").trim();

      const elClient = document.getElementById("inpClient"); if (elClient) elClient.value = state.tb.client;
      const elDoc = document.getElementById("inpDocCode"); if (elDoc) elDoc.value = state.tb.docCode;
      const elAuth = document.getElementById("inpAuthor"); if (elAuth) elAuth.value = state.tb.author;
      const elRev = document.getElementById("inpScaleRev"); if (elRev) elRev.value = state.tb.scaleRev;
      const elScale = document.getElementById("inpScale"); if (elScale) elScale.value = state.scale;
      const elDxfScale = document.getElementById("selDxfScale"); if (elDxfScale) elDxfScale.value = state.scale;
      const elPlan = document.getElementById("inpPlanTag"); if (elPlan) elPlan.value = state.planTag;

      const saveDef = document.getElementById("cfgSaveDefaults")?.checked;
      if (saveDef) {
        try {
          localStorage.setItem("canaloCAD_cartiglioDefaults", JSON.stringify({
            client: state.tb.client,
            project: state.tb.project,
            author: state.tb.author,
            checker: state.tb.checker,
            docCode: state.tb.docCode,
            rev: state.tb.rev,
            planTag: state.planTag,
            scale: state.scale
          }));
        } catch (e) {}
      }

      closeCartiglioSettingsModal();
      drawScene();
      const banner = document.getElementById("statusBanner");
      if (banner) {
        banner.textContent = \`✓ Dati cartiglio e committente aggiornati: \${state.tb.client} | \${state.tb.author}\`;
        banner.className = "mono text-[11px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold";
      }
    }

    function loadCartiglioDefaults() {
      try {
        const saved = localStorage.getItem("canaloCAD_cartiglioDefaults");
        if (saved) {
          const data = JSON.parse(saved);
          if (data.client) state.tb.client = data.client;
          if (data.project) state.tb.project = data.project;
          if (data.author) state.tb.author = data.author;
          if (data.checker) state.tb.checker = data.checker;
          if (data.docCode) state.tb.docCode = data.docCode;
          if (data.rev) state.tb.rev = data.rev;
          if (data.planTag) state.planTag = data.planTag;
          if (data.scale) state.scale = data.scale;
        }
      } catch (e) {}
    }\n\n`;

const targetInitMenuBar = `    function initWindowsMenuBar() {
      const menuBar = document.getElementById("winMenuBar");
      if (!menuBar) return;
      const items = menuBar.querySelectorAll(".win-menu-item");
      items.forEach(item => {
        const btn = item.querySelector(".win-menu-btn");
        const dd = item.querySelector(".win-dropdown");
        if (!btn || !dd) return;

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isClosed = dd.classList.contains("hidden");
          closeAllMenus();
          if (isClosed) {
            dd.classList.remove("hidden");
            btn.classList.add("bg-slate-800", "text-white");
          }
        });

        btn.addEventListener("mouseenter", () => {
          const anyOpen = Array.from(document.querySelectorAll(".win-dropdown")).some(d => !d.classList.contains("hidden"));
          if (anyOpen) {
            closeAllMenus();
            dd.classList.remove("hidden");
            btn.classList.add("bg-slate-800", "text-white");
          }
        });
      });

      document.addEventListener("click", (e) => {
        if (!e.target.closest("#winMenuBar")) {
          closeAllMenus();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeAllMenus();
          closeQuickHelpModal();
          closePwaOfflineModal();
          const dbM = document.getElementById("databaseCatalogModal");
          if (dbM && !dbM.classList.contains("hidden")) toggleDatabaseModal();
          const expM = document.getElementById("exportOptionsModal");
          if (expM && !expM.classList.contains("hidden")) toggleExportOptionsModal();
        } else if (e.key === "F1") {
          e.preventDefault();
          showQuickHelpModal();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "o" || e.key === "O")) {
          e.preventDefault();
          const dwgInp = document.getElementById("dwgInput");
          if (dwgInp) dwgInp.click();
        }
      });
    }`;

const replInitMenuBar = `${shortcutEngineJs}    function initWindowsMenuBar() {
      const menuBar = document.getElementById("winMenuBar");
      if (!menuBar) return;
      const items = menuBar.querySelectorAll(".win-menu-item");
      items.forEach(item => {
        const btn = item.querySelector(".win-menu-btn");
        const dd = item.querySelector(".win-dropdown");
        if (!btn || !dd) return;

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isClosed = dd.classList.contains("hidden");
          closeAllMenus();
          if (isClosed) {
            dd.classList.remove("hidden");
            btn.classList.add("bg-slate-800", "text-white");
          }
        });

        btn.addEventListener("mouseenter", () => {
          const anyOpen = Array.from(document.querySelectorAll(".win-dropdown")).some(d => !d.classList.contains("hidden"));
          if (anyOpen) {
            closeAllMenus();
            dd.classList.remove("hidden");
            btn.classList.add("bg-slate-800", "text-white");
          }
        });
      });

      document.addEventListener("click", (e) => {
        if (!e.target.closest("#winMenuBar")) {
          closeAllMenus();
        }
      });

      document.addEventListener("keydown", (e) => {
        // Se stiamo riassegnando una scorciatoia nella modale
        if (rebindingAction) {
          e.preventDefault();
          e.stopPropagation();
          if (e.key === "Escape") {
            rebindingAction = null;
            const b = document.getElementById("rebindBanner");
            if (b) b.classList.add("hidden");
            renderShortcutsTable();
            return;
          }
          if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
          userShortcuts[rebindingAction] = {
            key: e.key,
            ctrl: !!(e.ctrlKey || e.metaKey),
            shift: !!e.shiftKey,
            alt: !!e.altKey,
            label: userShortcuts[rebindingAction].label
          };
          saveUserShortcuts();
          rebindingAction = null;
          const b = document.getElementById("rebindBanner");
          if (b) b.classList.add("hidden");
          renderShortcutsTable();
          return;
        }

        // Se l'utente sta digitando in un campo di testo, non intercettare lettere/numeri
        const activeTag = (document.activeElement && document.activeElement.tagName) || "";
        const isInput = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
        if (isInput && !e.key.startsWith("F") && e.key !== "Escape") return;

        if (e.key === "Escape") {
          closeAllMenus();
          closeQuickHelpModal();
          closePwaOfflineModal();
          closeCartiglioSettingsModal();
          closeShortcutsModal();
          const dbM = document.getElementById("databaseCatalogModal");
          if (dbM && !dbM.classList.contains("hidden")) toggleDatabaseModal();
          const expM = document.getElementById("exportOptionsModal");
          if (expM && !expM.classList.contains("hidden")) toggleExportOptionsModal();
          return;
        }

        // Valutazione scorciatoie personalizzate
        if (matchShortcutEvent(e, userShortcuts.openDwg)) {
          e.preventDefault();
          const dwgInp = document.getElementById("dwgInput");
          if (dwgInp) dwgInp.click();
        } else if (matchShortcutEvent(e, userShortcuts.openPdf)) {
          e.preventDefault();
          const pdfInp = document.getElementById("pdfInput");
          if (pdfInp) pdfInp.click();
        } else if (matchShortcutEvent(e, userShortcuts.exportDxf)) {
          e.preventDefault();
          exportAutoCADDXF();
        } else if (matchShortcutEvent(e, userShortcuts.fitAll)) {
          e.preventDefault();
          fitAll();
        } else if (matchShortcutEvent(e, userShortcuts.swapDims)) {
          e.preventDefault();
          swapDimensions();
        } else if (matchShortcutEvent(e, userShortcuts.clearTray)) {
          e.preventDefault();
          resetProject();
        } else if (matchShortcutEvent(e, userShortcuts.recalculate)) {
          e.preventDefault();
          recalculateAll();
        } else if (matchShortcutEvent(e, userShortcuts.cartiglio)) {
          e.preventDefault();
          openCartiglioSettingsModal();
        } else if (matchShortcutEvent(e, userShortcuts.openDb)) {
          e.preventDefault();
          toggleDatabaseModal(true);
        } else if (matchShortcutEvent(e, userShortcuts.shortcuts)) {
          e.preventDefault();
          openShortcutsModal();
        } else if (matchShortcutEvent(e, userShortcuts.help)) {
          e.preventDefault();
          showQuickHelpModal();
        } else if (matchShortcutEvent(e, userShortcuts.saveJson)) {
          e.preventDefault();
          exportProjectJSON();
        }
      });
    }`;
content = content.replace(targetInitMenuBar, replInitMenuBar);

// ============================================================================
// 8. UPDATE toggleDatabaseModal to support forceOpen
// ============================================================================
const oldToggleDb = `    function toggleDatabaseModal() {
      const modal = document.getElementById("databaseCatalogModal");
      if (!modal) return;
      const isHidden = modal.classList.contains("hidden");
      if (isHidden) {
        modal.classList.remove("hidden");
        renderDatabaseItems();
      } else {
        modal.classList.add("hidden");
      }
    }`;

const newToggleDb = `    function toggleDatabaseModal(forceOpen) {
      const modal = document.getElementById("databaseCatalogModal");
      if (!modal) return;
      if (forceOpen === true) {
        modal.classList.remove("hidden");
        renderDatabaseItems();
        return;
      }
      const isHidden = modal.classList.contains("hidden");
      if (isHidden) {
        modal.classList.remove("hidden");
        renderDatabaseItems();
      } else {
        modal.classList.add("hidden");
      }
    }`;
content = content.replace(oldToggleDb, newToggleDb);

// ============================================================================
// 9. UPDATE DOMContentLoaded to load defaults and shortcuts
// ============================================================================
content = content.replace(
  `    window.addEventListener("DOMContentLoaded", () => {
      initWindowsMenuBar();
      initPwaOffline();
      initCatalogDropdown();`,
  `    window.addEventListener("DOMContentLoaded", () => {
      loadCartiglioDefaults();
      loadUserShortcuts();
      initWindowsMenuBar();
      initPwaOffline();
      initCatalogDropdown();`
);

fs.writeFileSync('Canalo.html', content, 'utf8');
console.log('Successfully updated Canalo.html with batch 4 features!');
