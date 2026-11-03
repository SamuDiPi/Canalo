const assert = require("assert");

function test3DComplete() {
  const prims = [];
  const line = (layer, x1, y1, x2, y2, color, lw = 0.4, alpha = 1) => prims.push({ t: "line", layer, x1, y1, x2, y2, color, lw, alpha });
  const rect = (layer, x, y, w, h, color, fill, solid = false) => prims.push({ t: "rect", layer, x, y, w, h, color, fill, solid });
  const text = (layer, x, y, h, str, color, align = "left", maxW = null) => prims.push({ t: "text", layer, x, y, h, str, color, align });

  const leftBoxX = -48;
  const lowestY = -60;
  const W = 300, H = 75, thk = 1.5;
  const leftBoxW = Math.max(200, W + 92); // 392
  const isoH = 114;
  const isoY = lowestY - isoH - 12;

  const uMinX = leftBoxX + 18;
  const uMaxX = leftBoxX + leftBoxW - 18;
  const uMinY = isoY + 12;
  const uMaxY = isoY + isoH - 24;
  const uW = uMaxX - uMinX;
  const uH = uMaxY - uMinY;

  // Normalized isometric projection:
  // nx in [0, 1] represents tray width
  // ny in [-0.25, 1.1] represents vertical height
  // nz in [0, 1] represents longitudinal length
  const iso = (nx, ny, nz) => ({
    px: uMinX + (0.36 + 0.52 * nz - 0.32 * nx) * uW,
    py: uMinY + (0.14 + 0.26 * nz + 0.14 * nx + 0.36 * ny) * uH
  });

  const iLine = (nx1, ny1, nz1, nx2, ny2, nz2, c = "#38bdf8", lw = 0.45, a = 1) => {
    const p1 = iso(nx1, ny1, nz1), p2 = iso(nx2, ny2, nz2);
    line("VISTA_3D_ISO", p1.px, p1.py, p2.px, p2.py, c, lw, a);
  };

  // 1. Frame
  rect("VISTA_3D_ISO", leftBoxX, isoY, leftBoxW, isoH, "#38bdf8", "#0f172a", true);

  // 2. Supports at z1 = 0.22, z2 = 0.82
  const zSupports = [0.22, 0.82];
  zSupports.forEach(zs => {
    // Wall bracket
    // Wall line at nx = 1.05
    iLine(1.05, -0.22, zs, 1.05, 0.65, zs, "#475569", 0.4);
    // Wall plate
    iLine(1.03, -0.20, zs, 1.03, 0.45, zs, "#94a3b8", 0.7);
    // Horizontal cantilever arm under tray (ny = -0.05)
    iLine(1.03, -0.05, zs, -0.06, -0.05, zs, "#94a3b8", 0.85);
    iLine(1.03, -0.09, zs, -0.06, -0.09, zs, "#64748b", 0.5);
    iLine(-0.06, -0.05, zs, -0.06, -0.09, zs, "#94a3b8", 0.6);
    // Strut (puntone)
    iLine(1.03, -0.18, zs, 0.35, -0.05, zs, "#94a3b8", 0.75);
  });

  // 3. Dimension line for span between supports
  const dimNy = -0.16;
  const pZ1 = iso(0.48, dimNy, zSupports[0]);
  const pZ2 = iso(0.48, dimNy, zSupports[1]);
  // Witness lines
  iLine(0.48, -0.08, zSupports[0], 0.48, dimNy - 0.04, zSupports[0], "#38bdf8", 0.35);
  iLine(0.48, -0.08, zSupports[1], 0.48, dimNy - 0.04, zSupports[1], "#38bdf8", 0.35);
  // Dim line
  line("VISTA_3D_ISO", pZ1.px, pZ1.py, pZ2.px, pZ2.py, "#f59e0b", 0.55);
  // Dim tick marks
  line("VISTA_3D_ISO", pZ1.px - 1.5, pZ1.py - 1.5, pZ1.px + 1.5, pZ1.py + 1.5, "#f59e0b", 0.6);
  line("VISTA_3D_ISO", pZ2.px - 1.5, pZ2.py - 1.5, pZ2.px + 1.5, pZ2.py + 1.5, "#f59e0b", 0.6);
  // Dim text
  const pMid = iso(0.48, dimNy, (zSupports[0] + zSupports[1]) / 2);
  text("VISTA_3D_ISO", pMid.px, pMid.py - 3.5, 2.2, "PASSO MENSOLE Ls = 1.50 m (SWL = 75 kg/m)", "#fbbf24", "center");

  // 4. Tray body (Solid, Perforated, Mesh, Ladder)
  // Let's test tray body bounds
  const trayProfiles = ["solid", "perforated", "mesh", "ladder"];
  trayProfiles.forEach(type => {
    // Front face (nz = 0)
    iLine(0, 0, 0, 1, 0, 0, "#94a3b8", 0.7);
    iLine(1, 0, 0, 1, 0.4, 0, "#94a3b8", 0.7);
    iLine(0, 0, 0, 0, 0.4, 0, "#94a3b8", 0.7);
    // Back face (nz = 1)
    iLine(0, 0, 1, 1, 0, 1, "#475569", 0.4);
    iLine(1, 0, 1, 1, 0.4, 1, "#475569", 0.4);
    iLine(0, 0, 1, 0, 0.4, 1, "#475569", 0.4);
    // Longitudinal edges
    iLine(0, 0, 0, 0, 0, 1, "#94a3b8", 0.7);
    iLine(1, 0, 0, 1, 0, 1, "#94a3b8", 0.7);
    iLine(0, 0.4, 0, 0, 0.4, 1, "#94a3b8", 0.7);
    iLine(1, 0.4, 0, 1, 0.4, 1, "#94a3b8", 0.7);
  });

  // Verify that EVERY point in prims is within [leftBoxX, leftBoxX + leftBoxW] and [isoY, isoY + isoH]
  let overflowCount = 0;
  prims.forEach((p, idx) => {
    if (p.t === "line") {
      [ {x: p.x1, y: p.y1}, {x: p.x2, y: p.y2} ].forEach(pt => {
        if (pt.x < leftBoxX || pt.x > leftBoxX + leftBoxW || pt.y < isoY || pt.y > isoY + isoH) {
          console.error(`Overflow in line #${idx}: (${pt.x}, ${pt.y}) outside box [${leftBoxX}, ${leftBoxX + leftBoxW}] x [${isoY}, ${isoY + isoH}]`);
          overflowCount++;
        }
      });
    } else if (p.t === "text") {
      if (p.x < leftBoxX || p.x > leftBoxX + leftBoxW || p.y < isoY || p.y > isoY + isoH) {
        console.error(`Overflow in text "${p.str}": (${p.x}, ${p.y}) outside box`);
        overflowCount++;
      }
    }
  });

  assert.strictEqual(overflowCount, 0, "No overflow occurred!");
  console.log(`✓ PASS: 3D complete scene verified with 0 overflows across ${prims.length} primitives!`);
}

test3DComplete();

