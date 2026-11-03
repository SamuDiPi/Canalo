const fs = require('fs');

const html = fs.readFileSync('c:/Users/dipinto/Documents/Canalo/Canalo.html', 'utf8');

// Find all document.getElementById("...")
const regex = /document\.getElementById\(["']([^"']+)["']\)/g;
let m;
const usedIds = new Set();
while ((m = regex.exec(html)) !== null) {
  usedIds.add(m[1]);
}

// Find all id="..." in HTML
const domIds = new Set();
const domRegex = /\bid=["']([^"']+)["']/g;
while ((m = domRegex.exec(html)) !== null) {
  domIds.add(m[1]);
}

console.log('Total getElementById queries:', usedIds.size);
const missing = [];
for (const id of usedIds) {
  if (!domIds.has(id)) {
    missing.push(id);
  }
}
console.log('Missing IDs referenced in JS:', missing);

