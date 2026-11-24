// Prepara LibreDWG-web per l'incorporamento nella pagina (src/vendor/libredwg-web): scarica il pacchetto npm ufficiale
// della versione fissata, ne verifica l'impronta SHA-512 (quella pubblicata dal registro npm) e scrive:
// - libredwg-web.mjs: un solo modulo ES (caricatore Emscripten wasm/libredwg-web.js + dist/libredwg-web.js, non
//   modificati), perché da un Blob gli import relativi del pacchetto non si risolvono;
// - libredwg-web.wasm.gz: il WebAssembly compresso (la pagina lo decomprime con DecompressionStream).
// I due file sono generati e non stanno nel repository (.gitignore): si rifanno con  node tools/vendor-libredwg-web.mjs
// prima di  node build.mjs. Il testo della licenza (COPYING, GPL-3.0) è nel repository.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const VERSION = "0.9.3";
const TARBALL = `https://registry.npmjs.org/@mlightcad/libredwg-web/-/libredwg-web-${VERSION}.tgz`;
const INTEGRITY = "sha512-VpHcXjn3JzsH/xa2NplP7LW0f8nA+SOzH7mNBXwD8PndGUQkbR/TY8GZxBxrg2S1JRcFoqLx0JMosoisFkydCg==";

const work = fs.mkdtempSync(path.join(os.tmpdir(), "libredwg-web-"));
try {
  const res = await fetch(TARBALL);
  if (!res.ok) throw new Error(`download non riuscito: ${res.status} ${TARBALL}`);
  const tgz = Buffer.from(await res.arrayBuffer());
  const got = "sha512-" + crypto.createHash("sha512").update(tgz).digest("base64");
  if (got !== INTEGRITY) throw new Error(`impronta diversa da quella attesa: ${got}`);
  fs.writeFileSync(path.join(work, "p.tgz"), tgz);
  execFileSync("tar", ["-xzf", "p.tgz"], { cwd: work });
  const pkg = path.join(work, "package");

  const info = JSON.parse(fs.readFileSync(path.join(pkg, "package.json"), "utf8"));
  if (info.name !== "@mlightcad/libredwg-web" || info.version !== VERSION) throw new Error(`pacchetto inatteso: ${info.name} ${info.version}`);

  const loader = fs.readFileSync(path.join(pkg, "wasm", "libredwg-web.js"), "utf8").trimEnd();
  const loaderExport = "export default createModule;";
  if (!loader.startsWith("async function createModule(") || !loader.endsWith(loaderExport))
    throw new Error("caricatore Emscripten con una forma inattesa");

  const dist = fs.readFileSync(path.join(pkg, "dist", "libredwg-web.js"), "utf8");
  const imports = [
    'import createModule from "../wasm/libredwg-web.js";\n',
    'import { default as default2 } from "../wasm/libredwg-web.js";\n',
  ];
  for (const line of imports)
    if (dist.split(line).length !== 2) throw new Error(`import non trovato una sola volta: ${line.trim()}`);
  const body = imports.reduce((s, line) => s.replace(line, ""), dist);
  if (/^\s*import\s/m.test(body)) throw new Error("dist/libredwg-web.js ha altri import");

  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "vendor", "libredwg-web");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "libredwg-web.mjs"),
    `// @mlightcad/libredwg-web ${VERSION} (GPL-3.0): wasm/libredwg-web.js + dist/libredwg-web.js in un solo modulo,\n` +
    `// generato da tools/vendor-libredwg-web.mjs. Non modificare a mano.\n` +
    loader.slice(0, -loaderExport.length) + "\nconst default2 = createModule;\n" + body);
  const wasm = fs.readFileSync(path.join(pkg, "wasm", "libredwg-web.wasm"));
  fs.writeFileSync(path.join(out, "libredwg-web.wasm.gz"), zlib.gzipSync(wasm, { level: 9 }));
  console.log(`LibreDWG-web ${VERSION} (impronta verificata): modulo e WebAssembly compresso in ${out}`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
