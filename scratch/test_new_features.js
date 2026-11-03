const assert = require('assert');

// 1. TEST SHORTCUT MATCHING LOGIC
const DEFAULT_SHORTCUTS = {
  openDwg: { key: 'o', ctrl: true, shift: false, alt: false, label: 'Apri DWG / DXF' },
  openPdf: { key: 'u', ctrl: true, shift: false, alt: false, label: 'Importa PDF Unifilare' },
  exportDxf: { key: 'e', ctrl: true, shift: false, alt: false, label: 'Scarica DXF (1:1)' },
  fitAll: { key: 'Home', ctrl: false, shift: false, alt: false, label: 'Zoom Tutto (Centra)' },
  swapDims: { key: 'i', ctrl: true, shift: false, alt: false, label: 'Inverti Base L e H' },
  clearTray: { key: 'Delete', ctrl: false, shift: false, alt: false, label: 'Svuota Canalina' },
  recalculate: { key: 'F5', ctrl: false, shift: false, alt: false, label: 'Ricalcola Portate' },
  cartiglio: { key: 'F2', ctrl: false, shift: false, alt: false, label: 'Dati Cartiglio & Committente' },
  openDb: { key: 'F3', ctrl: false, shift: false, alt: false, label: 'Catalogo Tecnico Database' },
  help: { key: 'F1', ctrl: false, shift: false, alt: false, label: 'Guida Rapida' }
};

function formatShortcut(s) {
  const parts = [];
  if (s.ctrl) parts.push("Ctrl");
  if (s.alt) parts.push("Alt");
  if (s.shift) parts.push("Shift");
  let k = s.key;
  if (k.length === 1) k = k.toUpperCase();
  parts.push(k);
  return parts.join(" + ");
}

function matchShortcut(e, s) {
  const ctrlMatch = !!s.ctrl === !!(e.ctrlKey || e.metaKey);
  const altMatch = !!s.alt === !!e.altKey;
  const shiftMatch = !!s.shift === !!e.shiftKey;
  const keyMatch = s.key.toLowerCase() === (e.key || "").toLowerCase();
  return ctrlMatch && altMatch && shiftMatch && keyMatch;
}

assert.strictEqual(formatShortcut(DEFAULT_SHORTCUTS.openDwg), "Ctrl + O");
assert.strictEqual(formatShortcut(DEFAULT_SHORTCUTS.cartiglio), "F2");

const mockEvent = { key: 'o', ctrlKey: true, shiftKey: false, altKey: false };
assert(matchShortcut(mockEvent, DEFAULT_SHORTCUTS.openDwg));

const mockEventF2 = { key: 'F2', ctrlKey: false, shiftKey: false, altKey: false };
assert(matchShortcut(mockEventF2, DEFAULT_SHORTCUTS.cartiglio));

console.log("✓ PASS: Shortcut formatting and matching logic works!");
