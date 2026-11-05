// Build di CanaloCAD: ricompone src/ in un unico file autosufficiente (Canalo.html).
//
//   npm run build     → genera Canalo.html
//   npm run watch     → rigenera a ogni modifica in src/
//
// In src/index.html ogni riga `<!-- @include percorso -->` viene sostituita
// dal contenuto di src/percorso. I file inclusi possono a loro volta contenere include.
// Il marcatore speciale `<!-- @tailwind -->` viene sostituito dal CSS Tailwind compilato
// (generato con la CLI di Tailwind a partire dalle classi usate in src/).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "Canalo.html");
const INCLUDE = /^[ \t]*<!-- @include (\S+) -->\r?$/;
const TAILWIND = /^[ \t]*<!-- @tailwind -->\r?$/;

function compileTailwind() {
  const bin = path.join(ROOT, "node_modules", "tailwindcss", "lib", "cli.js");
  if (!fs.existsSync(bin)) {
    throw new Error("Tailwind non installato: esegui prima `npm install`.");
  }
  return execFileSync(process.execPath, [
    bin, "-c", path.join(ROOT, "tailwind.config.js"),
    "-i", path.join(SRC, "css", "tailwind.css"), "--minify",
  ], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function expand(file, seen = new Set()) {
  if (seen.has(file)) throw new Error(`Include circolare: ${file}`);
  seen.add(file);
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = line.match(INCLUDE))) {
      const inc = path.join(SRC, m[1]);
      let body = expand(inc, new Set(seen));
      if (body.endsWith("\n")) body = body.slice(0, -1);
      out.push(body);
    } else if (TAILWIND.test(line)) {
      const eol = line.endsWith("\r") ? "\r" : "";
      out.push(`  <style>${compileTailwind()}</style>${eol}`);
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}

function build() {
  const t0 = Date.now();
  const html = expand(path.join(SRC, "index.html"));
  fs.writeFileSync(OUT, html);
  console.log(`✓ Canalo.html generato (${(html.length / 1024).toFixed(0)} KB) in ${Date.now() - t0} ms`);
}

build();

if (process.argv.includes("--watch")) {
  let timer = null;
  fs.watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { try { build(); } catch (e) { console.error(e.message); } }, 150);
  });
  console.log("In ascolto su src/ ...");
}
