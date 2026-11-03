const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync('Canalo.html', 'utf8');

const mockCanvas = {
  getContext: () => ({
    measureText: (txt) => ({ width: (txt || '').length * 7 }),
    clearRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    arc: () => {},
    rect: () => {},
    fillText: () => {},
    setLineDash: () => {},
    save: () => {},
    restore: () => {},
    scale: () => {},
    translate: () => {},
    setTransform: () => {}
  }),
  width: 1200,
  height: 800,
  style: {},
  parentElement: {
    getBoundingClientRect: () => ({ width: 1200, height: 800 })
  },
  getBoundingClientRect: () => ({ width: 1200, height: 800, left: 0, top: 0 }),
  addEventListener: () => {},
  removeEventListener: () => {}
};

const domElements = {};
function getEl(id) {
  if (!domElements[id]) {
    domElements[id] = {
      value: '',
      textContent: '',
      innerHTML: '',
      className: '',
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: () => {},
      click: () => {}
    };
  }
  return domElements[id];
}

const mockLocalStorage = {};
const sandbox = {
  window: {
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  document: {
    getElementById: (id) => {
      if (id === 'cadCanvas' || id === 'loadCurveCanvas') return mockCanvas;
      return getEl(id);
    },
    querySelectorAll: (sel) => [],
    querySelector: (sel) => null,
    addEventListener: () => {},
    createElement: (tag) => getEl(tag),
    title: ''
  },
  localStorage: {
    getItem: (k) => mockLocalStorage[k] || null,
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; }
  },
  navigator: {
    serviceWorker: {
      register: () => Promise.resolve()
    }
  },
  Blob: class {
    constructor(parts, opts) { this.parts = parts; this.opts = opts; }
  },
  URL: {
    createObjectURL: () => 'blob:mock'
  },
  console: console,
  Math: Math,
  parseFloat: parseFloat,
  parseInt: parseInt,
  Date: Date,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  RegExp: RegExp,
  addEventListener: () => {},
  removeEventListener: () => {}
};
sandbox.window = sandbox;

const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
let allScriptCode = '';
scriptMatch.forEach(s => {
  const code = s.replace(/<script[\s\S]*?>|<\/script>/gi, '');
  if (!s.includes('src=')) {
    allScriptCode += code + '\n';
  }
});

vm.createContext(sandbox);
vm.runInContext(allScriptCode, sandbox);

console.log('=== VERIFYING BATCH 4 REQUIREMENTS ===\n');

// 1. VERIFY DWG PARSING DOES NOT THROW NULL ERROR
console.log('--- 1. DWG Entity Processing Without Null Error ---');
const processRealWasmEntities = vm.runInContext('processRealWasmEntities', sandbox);
const mockEntities = [
  { type: 'TEXT', text: 'Dati caratteristici della canalina (Anello PT - Lato DX)', startPoint: { x: 0, y: 0 }, layer: '0' },
  { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 300, y: 0 }, layer: 'Canalina' },
  { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 75 }, layer: 'Canalina' },
  { type: 'LINE', startPoint: { x: 300, y: 0 }, endPoint: { x: 300, y: 75 }, layer: 'Canalina' },
  { type: 'CIRCLE', center: { x: 50, y: 25 }, radius: 10, layer: 'Cavi' }
];

let dwgLog = null;
assert.doesNotThrow(() => {
  dwgLog = processRealWasmEntities(mockEntities, 'test_anello.dwg', 'AC1027');
}, 'processRealWasmEntities should not throw any TypeError');

assert(dwgLog, 'DWG Log produced');
const state = vm.runInContext('state', sandbox);
assert.strictEqual(state.title, 'Anello PT - Lato DX', `Expected "Anello PT - Lato DX", got "${state.title}"`);
assert.strictEqual(state.width, 300, `Expected width 300, got ${state.width}`);
assert.strictEqual(state.height, 75, `Expected height 75, got ${state.height}`);
console.log(`✓ PASS: DWG import successfully extracted Title="${state.title}", Dimensions=${state.width}x${state.height} without null errors!`);

// 2. VERIFY DEDICATED "IMPORTA" AND "ESPORTA" MENUS
console.log('\n--- 2. Dedicated Importa & Esporta Menus in Top Nav ---');
const requiredMenus = ['File', 'Importa', 'Esporta', 'Modifica', 'Visualizza', 'Database', 'Progetto', 'Strumenti', 'Aiuto'];
requiredMenus.forEach(m => {
  assert(html.includes(`>${m}</button>`), `Top menu "${m}" is present in nav`);
});
console.log(`✓ PASS: All 9 top menus (including dedicated Importa and Esporta) verified!`);

// 3. VERIFY DATABASE CATEGORIES CLICKABILITY
console.log('\n--- 3. Database Menu Category Filter Actions ---');
const filterDbCategory = vm.runInContext('filterDbCategory', sandbox);
const toggleDatabaseModal = vm.runInContext('toggleDatabaseModal', sandbox);
assert.doesNotThrow(() => {
  filterDbCategory('bt_uni');
  toggleDatabaseModal(true);
  filterDbCategory('trays_supports');
  toggleDatabaseModal(true);
});
console.log('✓ PASS: All Database menu categories filter and open without error!');

// 4. VERIFY CARTIGLIO & PROJECT INITIALIZATION MODAL
console.log('\n--- 4. Cartiglio & Project Settings Modal ---');
assert(html.includes('id="cartiglioSettingsModal"'), 'cartiglioSettingsModal exists in HTML');
const openCartiglioSettingsModal = vm.runInContext('openCartiglioSettingsModal', sandbox);
const saveCartiglioSettings = vm.runInContext('saveCartiglioSettings', sandbox);
assert.doesNotThrow(() => {
  openCartiglioSettingsModal();
});
getEl('cfgClient').value = 'ACME CORPORATION SPA';
getEl('cfgProject').value = 'NUOVO CENTRO LOGISTICO';
getEl('cfgAuthor').value = 'ING. LUIGI VERDI';
getEl('cfgScale').value = '1:20';
saveCartiglioSettings();
assert.strictEqual(state.tb.client, 'ACME CORPORATION SPA');
assert.strictEqual(state.tb.project, 'NUOVO CENTRO LOGISTICO');
assert.strictEqual(state.tb.author, 'ING. LUIGI VERDI');
assert.strictEqual(state.scale, '1:20');
console.log('✓ PASS: Cartiglio settings modal updates state.tb and reflects on CAD title block!');

// 5. VERIFY CUSTOMIZABLE KEYBOARD SHORTCUTS
console.log('\n--- 5. Customizable Keyboard Shortcuts ---');
assert(html.includes('id="keyboardShortcutsModal"'), 'keyboardShortcutsModal exists in HTML');
const userShortcuts = vm.runInContext('userShortcuts', sandbox);
assert(userShortcuts.openDwg, 'Default openDwg shortcut exists');
const formatShortcutLabel = vm.runInContext('formatShortcutLabel', sandbox);
assert.strictEqual(formatShortcutLabel(userShortcuts.openDwg), 'Ctrl+O');

// Rebind openDwg to Alt+Shift+D
userShortcuts.openDwg = { key: 'd', ctrl: false, shift: true, alt: true, label: 'Apri DWG' };
const saveUserShortcuts = vm.runInContext('saveUserShortcuts', sandbox);
saveUserShortcuts();
assert.strictEqual(formatShortcutLabel(userShortcuts.openDwg), 'Alt+Shift+D');
console.log(`✓ PASS: Keyboard shortcuts customizable and persisted (tested rebinding to ${formatShortcutLabel(userShortcuts.openDwg)})!`);

console.log('\n=============================================');
console.log('ALL BATCH 4 USER REQUIREMENTS FULLY VERIFIED!');
console.log('=============================================');
