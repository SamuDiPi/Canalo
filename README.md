# CanaloCAD — Cable Tray Studio

Progettazione e verifica di canaline portacavi nel browser: sezione 1:1, riempimento, carichi sulle mensole, segregazione, import DWG/DXF/PDF ed export DXF, Lisp, Word e CSV.

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
| `11-export.js` | Export DXF, Lisp, Word, CSV |
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

## Licenza

CanaloCAD è software libero distribuito secondo la [GNU General Public License v3.0](LICENSE), senza alcuna garanzia. I risultati dei calcoli (carichi degli staffaggi, coefficienti, tiro) sono indicativi e vanno verificati con le norme e con i dati dei costruttori; i codici articolo della distinta non sono quelli dei costruttori e i nomi delle serie sono marchi dei rispettivi proprietari.

Componenti di terze parti: il CSS è generato con [Tailwind CSS](https://tailwindcss.com) (MIT); alla prima importazione di un DWG o di un PDF la pagina scarica [LibreDWG-web](https://github.com/mlightcad/libredwg-web) (GPL-3.0-or-later) e [pdf.js](https://mozilla.github.io/pdf.js/) (Apache-2.0).

## Componenti di terze parti

- Font **Inter** (The Inter Project Authors) e **JetBrains Mono** (The JetBrains Mono Project Authors), incorporati nella pagina, sotto SIL Open Font License 1.1: testi in `src/fonts`.
- CSS generato con **Tailwind CSS** (MIT).
- **pdf.js** 3.11.174 (Mozilla Foundation, Apache-2.0, testo in `src/vendor/pdfjs/LICENSE`), incorporato nella pagina per leggere i PDF.
- Alla prima importazione di un DWG la pagina scarica da cdn.jsdelivr.net **LibreDWG-web** (@mlightcad/libredwg-web 0.1.3, che il pacchetto dichiara GPL-2.0-only e che contiene GNU LibreDWG, GPL-3.0-or-later). Non è incluso né distribuito con CanaloCAD.

CanaloCAD non riporta marche, serie o codici di produttori: i tipi di passerella sono generici e la distinta materiali usa sigle proprie.
