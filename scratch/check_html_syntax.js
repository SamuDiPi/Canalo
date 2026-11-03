const fs = require('fs');
const html = fs.readFileSync('c:/Users/dipinto/Documents/Canalo/Canalo.html', 'utf8');

// Extract all content inside <script> tags
const scriptMatches = html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
let idx = 1;
for (const m of scriptMatches) {
  const code = m[1];
  console.log(`Checking script block ${idx}... (${code.length} chars)`);
  try {
    new Function(code);
    console.log(`✓ Script block ${idx} is valid JavaScript!`);
  } catch (err) {
    console.error(`✗ Error in script block ${idx}:`, err);
    process.exit(1);
  }
  idx++;
}
console.log("All script blocks parsed successfully!");

