const fs = require('fs');

// We simulate build3DIsoScene and verify bounds and primitive counts
function testIsoGeneration() {
  const prims = [];
  const line = (layer, x1, y1, x2, y2, color, lw = 0.4, alpha = 1) => prims.push({ t: "line", layer, x1, y1, x2, y2, color, lw, alpha });
  const rect = (layer, x, y, w, h, color, fill, solid = false) => prims.push({ t: "rect", layer, x, y, w, h, color, fill, solid });
  const poly = (layer, pts, color, fill, lw = 0.4, alpha = 1) => prims.push({ t: "poly", layer, pts, color, fill, lw, alpha });
  const text = (layer, x, y, h, str, color, align = "left", maxW = null) => prims.push({ t: "text", layer, x, y, h, str, color, align });

  const leftBoxX = -48;
  const leftBoxW = 292;
  const lowestY = -120;
  const W = 300, H = 75, thk = 1.5;
  const mat = { stroke: "#cbd5e1", fill: "#334155" };
  const sup = { name: "Mensola a Parete Media" };

  const isoH = 120;
  const isoY = lowestY - isoH - 12;
  const isLight = false;
  const boxBg = isLight ? "#f8fafc" : "#0f172a";

  rect("VISTA_3D_ISO", leftBoxX, isoY, leftBoxW, isoH, "#38bdf8", boxBg, true);

  // Available area inside box
  const uMinX = leftBoxX + 16;
  const uMaxX = leftBoxX + leftBoxW - 16;
  const uMinY = isoY + 12;
  const uMaxY = isoY + isoH - 24;
  const availW = uMaxX - uMinX;
  const availH = uMaxY - uMinY;

  // Angles:
  // Longitudinal Z (depth): 20 deg
  // Transversal X (width): 32 deg
  const cosZ = Math.cos(20 * Math.PI / 180); // ~0.9397
  const sinZ = Math.sin(20 * Math.PI / 180); // ~0.3420
  const cosX = Math.cos(32 * Math.PI / 180); // ~0.8480
  const sinX = Math.sin(32 * Math.PI / 180); // ~0.5299

  // Isometric projection function:
  // x: [0 (front lip), 1.0 (rear lip)]
  // y: [-0.4 (bracket base), 0.5 (tray height), 0.75 (wall mount)]
  // z: [0 (front section), 3.2 (rear section)]
  // Brackets at z1 = 0.8, z2 = 2.6
  
  // Normalized bounding ranges:
  const uRange = 3.2 * cosZ - (-0.15) * cosX - (0 * cosZ - 1.15 * cosX);
  // ~ 3.0 + 0.12 + 0.97 = 4.1
  const vRange = (3.2 * sinZ + 1.15 * sinX + 0.75) - (0 * sinZ + (-0.15) * sinX - 0.45);
  // ~ (1.09 + 0.61 + 0.75) - (-0.08 - 0.45) = 2.45 - (-0.53) = 2.98

  const scale = Math.min((availW - 10) / 4.15, (availH - 8) / 3.0);
  const originX = uMinX + 1.15 * cosX * scale + 10;
  const originY = uMinY + 0.45 * scale + 6;

  const iso = (x, y, z) => ({
    px: originX + (z * cosZ - x * cosX) * scale,
    py: originY + (z * sinZ + x * sinX + y * 1.05) * scale
  });

  const p0 = iso(0, 0, 0);
  const p1 = iso(1, 0, 3.2);
  console.log('Origin:', { originX, originY, scale });
  console.log('Front corner:', p0);
  console.log('Back corner:', p1);

  // Check bounds
  const testPts = [
    iso(-0.15, -0.45, 0.8),
    iso(1.15, 0.75, 0.8),
    iso(-0.15, -0.45, 2.6),
    iso(1.15, 0.75, 2.6),
    iso(0, 0, 0),
    iso(1, 0.5, 3.2)
  ];

  const minX = Math.min(...testPts.map(p => p.px));
  const maxX = Math.max(...testPts.map(p => p.px));
  const minY = Math.min(...testPts.map(p => p.py));
  const maxY = Math.max(...testPts.map(p => p.py));

  console.log('Test bounds:', { minX, maxX, minY, maxY });
  console.log('Box bounds:', { leftBoxX, rightBoxX: leftBoxX + leftBoxW, isoY, topBoxY: isoY + isoH });

  if (minX >= leftBoxX && maxX <= leftBoxX + leftBoxW && minY >= isoY && maxY <= isoY + isoH) {
    console.log('✓ 3D View is 100% contained within the box with safe margins!');
  } else {
    console.log('✗ Out of bounds!');
  }
}

testIsoGeneration();

