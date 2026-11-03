const fs = require('fs');
const html = fs.readFileSync('Canalo.html', 'utf8');
const matches = html.match(/id="[^"]*Modal"/gi) || [];
console.log('Modals found:', matches);

