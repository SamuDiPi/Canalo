const fs = require('fs');
const content = fs.readFileSync('c:/Users/dipinto/Documents/Canalo/Canalo.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('"QUOTE"') || l.includes('layer === "QUOTE"')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});

