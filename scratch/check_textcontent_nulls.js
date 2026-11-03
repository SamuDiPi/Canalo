const fs = require('fs');

const lines = fs.readFileSync('c:/Users/dipinto/Documents/Canalo/Canalo.html', 'utf8').split('\n');

lines.forEach((line, idx) => {
  if (line.includes('.textContent =') || line.includes('.textContent=')) {
    // Check if it accesses document.getElementById or something else
    const m = line.match(/document\.getElementById\(["']([^"']+)["']\)\.textContent\s*=/);
    if (m) {
      console.log(`Line ${idx + 1}: direct getElementById("${m[1]}").textContent`);
    } else {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});

