const fs = require('fs');
const html = fs.readFileSync('Canalo.html', 'utf8');
console.log('headerTitle in HTML:', html.includes('id="headerTitle"'));
console.log('headerTitle occurrences in JS:', (html.match(/headerTitle/g) || []).length);

