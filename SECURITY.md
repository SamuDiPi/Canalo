# Sicurezza

## Versioni seguite

Solo l'ultima versione pubblicata (la pagina su GitHub Pages e il ramo `main`).

## Segnalare una vulnerabilità

Non aprire una issue pubblica. Usa la segnalazione privata di GitHub: scheda **Security** del repository, **Report a vulnerability**. Indica come riprodurre il problema (per esempio il file DWG, DXF o PDF che lo provoca) e la versione usata.

CanaloCAD è un progetto personale e gratuito: le segnalazioni si esaminano appena possibile, di solito entro due settimane. Le correzioni vengono pubblicate nel ramo `main` e indicate nella storia dei commit.

## Cose da sapere

- I file importati (DWG, DXF, PDF) vengono letti nel browser. Importa solo file da fonti di cui ti fidi.
- La lettura dei DWG usa LibreDWG-web 0.9.3, incorporato nella pagina: le sue vulnerabilità vanno segnalate anche al suo progetto (https://github.com/mlightcad/libredwg-web) e a GNU LibreDWG.
- La lettura dei PDF usa pdf.js (Mozilla), incorporato nella pagina e aperto con `isEvalSupported: false`.
