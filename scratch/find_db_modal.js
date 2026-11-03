const fs = require('fs');
const html = fs.readFileSync('Canalo.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('databaseCatalogModal')) {
    console.log(`Line ${idx+1}: ${l}`);
  }
});

