# CanaloCAD — Cable Tray Studio

Progettazione e verifica di canaline portacavi nel browser: sezione 1:1, riempimento, carichi sulle mensole, segregazione, import DWG/DXF/PDF ed export DXF, Lisp, Word e CSV.

Dentro [CartesioCAD](https://github.com/SamuDiPi/CartesioCAD) (Windows) la stessa pagina si apre in una scheda accanto ai disegni: CartesioCAD le manda le sezioni selezionate e *Esporta > Inserisci nel disegno* / *Copia come blocco* (visibili solo lì) riportano la tavola nel disegno o negli appunti del programma. Il collegamento è in `src/js/13-host.js` e fuori da CartesioCAD non fa nulla.

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
| `05b-pdf-cavi.js` | Canalina nuova dai cavi di uno schema unifilare (PDF, DWG o DXF): lettura delle tabelle dei circuiti, scelta delle linee, diametri dal database o stimati |
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
npm run vendor     # una sola volta: scarica LibreDWG-web da npm, ne verifica l'impronta e lo prepara in src/vendor
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

Componenti di terze parti: il CSS è generato con [Tailwind CSS](https://tailwindcss.com) (MIT); [pdf.js](https://mozilla.github.io/pdf.js/) (Apache-2.0) e [LibreDWG-web](https://github.com/mlightcad/libredwg-web) (GPL-3.0) sono incorporati nella pagina.

## Componenti di terze parti

- Font **Inter** (The Inter Project Authors) e **JetBrains Mono** (The JetBrains Mono Project Authors), incorporati nella pagina, sotto SIL Open Font License 1.1: testi in `src/fonts`.
- CSS generato con **Tailwind CSS** (MIT).
- **pdf.js** 6.5.438 (Mozilla Foundation, Apache-2.0, testo in `src/vendor/pdfjs/LICENSE`), incorporato nella pagina per leggere i PDF (aperti con `isEvalSupported: false`).
- **LibreDWG-web** 0.9.3 (@mlightcad/libredwg-web, GPL-3.0, che contiene GNU LibreDWG 0.14.8608, GPL-3.0-or-later), incorporato nella pagina per leggere i DWG: modulo JavaScript e WebAssembly del pacchetto npm ufficiale, non modificati, riuniti e compressi da `tools/vendor-libredwg-web.mjs` (`npm run vendor`) in `src/vendor/libredwg-web` (testo della licenza in `COPYING`). Sorgenti corrispondenti: tag v0.9.3 di https://github.com/mlightcad/libredwg-web, con una copia allegata a https://github.com/SamuDiPi/Canalo/releases/tag/sorgenti-libredwg-web-0.9.3.

CanaloCAD non riporta marche, serie o codici di produttori: i tipi di passerella sono generici e la distinta materiali usa sigle proprie.

## Privacy

CanaloCAD non raccoglie dati: niente account, cookie, statistiche o invio di informazioni all'autore. Tutta l'elaborazione avviene nel browser; progetti, preferenze e dati del cartiglio restano nella memoria locale del browser (localStorage) del computer che li usa.

- La pagina pubblicata è ospitata da GitHub Pages: GitHub registra gli indirizzi IP dei visitatori secondo la [sua informativa](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
- Font e motori di lettura di PDF e DWG sono incorporati nella pagina: non si scarica nulla da altri siti.

## Sicurezza

Vedi [SECURITY.md](SECURITY.md).
