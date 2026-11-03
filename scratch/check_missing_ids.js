const fs = require('fs');
const html = fs.readFileSync('Canalo.html', 'utf8');

// Find all document.getElementById("...") calls
const regex = /document\.getElementById\s*\(\s*["']([^"']+)["']\s*\)/g;
let match;
const missing = new Set();
const found = new Set();

while ((match = regex.exec(html)) !== null) {
  const id = match[1];
  const idInHtml = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  if (!idInHtml) {
    missing.add(id);
  } else {
    found.add(id);
  }
}

console.log('Missing IDs referenced by getElementById:');
console.log(Array.from(missing));

