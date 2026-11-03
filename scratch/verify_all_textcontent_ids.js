const fs = require('fs');
const html = fs.readFileSync('c:/Users/dipinto/Documents/Canalo/Canalo.html', 'utf8');

const regex = /document\.getElementById\(["']([^"']+)["']\)\.textContent/g;
let m;
const checked = [];
while ((m = regex.exec(html)) !== null) {
  const id = m[1];
  const exists = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  checked.push({ id, exists });
}
console.log('Checked elements:', checked);

