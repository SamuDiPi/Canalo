# CanaloCAD — Cable Tray Studio

Progettazione e verifica di canaline portacavi nel browser: sezione 1:1, riempimento, carichi sulle mensole, segregazione, import DWG/DXF/PDF ed export DXF, AutoLISP, Word e CSV.

## Struttura

| Percorso | Contenuto |
|---|---|
| `src/index.html` | Scheletro della pagina con i punti di inclusione |
| `src/partials/` | Markup: icone, barra superiore, area di lavoro (rail, pannelli, foglio, distinta), finestre modali |
| `src/css/` | `md3.css` (tema scuro Material 3: colori e componenti), `app.css` (stili propri), `tailwind.css` |
| `src/js/` | Logica, un file per area, caricati in ordine numerico |
| `Canalo.html` | **File generato**: unico, autosufficiente, da distribuire |
| `sw.js`, `manifest.webmanifest`, `icon.svg` | Modalità offline (attiva solo via http/https) |
| `tools/make_dxf_template.py` | Rigenera lo scheletro DXF R2000 (`src/js/11-dxf-template.js`) con ezdxf, solo se cambiano layer o stili |

Moduli JavaScript:

| File | Area |
|---|---|
| `00-utils.js` | Versione, notifiche, download, storage sicuro |
| `00-dwg-engine.js` | Caricamento su richiesta di LibreDWG (WASM) e pdf.js |
| `01-data.js` | Catalogo cavi, serie, supporti, stato iniziale |
| `02-core.js` | Sincronizzazione UI ↔ stato, posa a gravità, ricalcolo verifiche |
| `03-loadcurve-cables.js` | Grafico curva di carico, distinta cavi |
| `04-import-cad.js`, `05-import-pdf.js` | Import DWG/DXF e schema unifilare PDF |
| `06-scene-iso.js`, `07-scene-2d.js` | Costruzione della tavola (assonometria e viste 2D) |
| `08-viewport.js` | Rendering, pan/zoom, trascinamento (Pointer Events) |
| `09-database-ui.js` | Vista mobile e catalogo |
| `10-sections.js` | Schede, salvataggio automatico, Annulla/Ripeti, progetto JSON |
| `11-export.js` | Export DXF, AutoLISP, Word, CSV |
| `12-ui-shell.js` | Interfaccia: pannelli della rail, controlli segmentati, verifiche a semaforo, dialogo Esporta |
| `12-app.js` | Menu, scorciatoie, cartiglio, PWA, avvio |

## Sviluppo

Requisiti: Node.js 18 o successivo.

```bash
npm install        # una sola volta (installa Tailwind)
npm run build      # rigenera Canalo.html da src/
npm run watch      # rigenera a ogni salvataggio in src/
```

Si modificano sempre i file in `src/`. `Canalo.html` viene sovrascritto a ogni build.

## Progetti

Un progetto si salva come file `.ccad` (JSON leggibile) con tutte le sezioni; si riaprono anche i vecchi `.json`. La guida completa si apre nell'app con F1.

## Uso offline

Aprendo `Canalo.html` con doppio clic l'app funziona e salva automaticamente il progetto nel browser. Servono però la connessione per i font e, al primo uso, per i motori DWG e PDF.

Pubblicata via http(s), per esempio su GitHub Pages, l'app si installa come PWA e funziona anche offline. I motori DWG e PDF restano in cache dopo il primo utilizzo.
