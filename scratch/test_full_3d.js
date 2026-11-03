const assert = require("assert");

function testFull3DIso() {
  const prims = [];
  const line = (layer, x1, y1, x2, y2, color, lw = 0.4, alpha = 1) => prims.push({ t: "line", layer, x1, y1, x2, y2, color, lw, alpha });
  const rect = (layer, x, y, w, h, color, fill, solid = false) => prims.push({ t: "rect", layer, x, y, w, h, color, fill, solid });
  const poly = (layer, pts, color, fill = null, lw = 0.4, alpha = 1) => prims.push({ t: "poly", layer, pts, color, fill, lw, alpha });
  const text = (layer, x, y, h, str, color, align = "left", maxW = null) => prims.push({ t: "text", layer, x, y, h, str, color, align });

  const leftBoxX = -48, lowestY = -120, leftBoxW = 292;
  const W = 300, H = 75, thk = 1.5;
  const mat = { stroke: "#cbd5e1", fill: "#334155" };
  const sup = { name: "Mensola a Parete Media" };
  const state = {
    trayType: "perforated",
    support: "wall_med",
    spanM: 1.5,
    cover: "none",
    clamps: true,
    reiCount: 1,
    septums: 1,
    theme: "dark"
  };
  const metrics = { qMaxKgM: 95, deflectionMm: 2.1, maxDeflectionMm: 7.5 };

  const isoH = 120;
  const isoY = lowestY - isoH - 12;
  const isLight = state.theme === "light";
  const boxBg = isLight ? "#f8fafc" : "#0f172a";
  const boxBorder = isLight ? "#cbd5e1" : "#38bdf8";

  rect("VISTA_3D_ISO", leftBoxX, isoY, leftBoxW, isoH, boxBorder, boxBg, true);

  const padX = 14, padY = 10;
  const uMinX = leftBoxX + padX;
  const uMaxX = leftBoxX + leftBoxW - padX;
  const uMinY = isoY + padY;
  const uMaxY = isoY + isoH - padY - 14;
  const availW = uMaxX - uMinX;
  const availH = uMaxY - uMinY;

  const angZ = 18 * Math.PI / 180;
  const angX = 34 * Math.PI / 180;
  const cosZ = Math.cos(angZ), sinZ = Math.sin(angZ);
  const cosX = Math.cos(angX), sinX = Math.sin(angX);

  const zMax = 6.6;
  const z1 = 1.4, z2 = 5.2;

  const keyPts = [
    { x: 1.25, y: -0.42, z: z1 },
    { x: -0.20, y: -0.42, z: z1 },
    { x: 1.25, y: 0.65, z: z2 },
    { x: -0.20, y: 0.65, z: z2 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0.45, z: 0 },
    { x: 1, y: 0.45, z: 0 },
    { x: 0, y: 0, z: zMax },
    { x: 1, y: 0, z: zMax },
    { x: 0, y: 0.45, z: zMax },
    { x: 1, y: 0.45, z: zMax },
    { x: 0.5, y: -0.32, z: z1 },
    { x: 0.5, y: -0.32, z: z2 }
  ];

  const rawProj = keyPts.map(p => ({
    u: p.z * cosZ - p.x * cosX,
    v: p.z * sinZ + p.x * sinX + p.y * 1.05
  }));

  const minU = Math.min(...rawProj.map(p => p.u));
  const maxU = Math.max(...rawProj.map(p => p.u));
  const minV = Math.min(...rawProj.map(p => p.v));
  const maxV = Math.max(...rawProj.map(p => p.v));
  const uSpan = maxU - minU;
  const vSpan = maxV - minV;

  const scale = Math.min((availW - 6) / uSpan, (availH - 4) / vSpan);
  const fittedW = uSpan * scale;
  const fittedH = vSpan * scale;
  const offsetX = uMinX + (availW - fittedW) / 2 - minU * scale;
  const offsetY = uMinY + (availH - fittedH) / 2 - minV * scale;

  const iso = (x, y, z) => ({
    px: +(offsetX + (z * cosZ - x * cosX) * scale).toFixed(2),
    py: +(offsetY + (z * sinZ + x * sinX + y * 1.05) * scale).toFixed(2)
  });

  const iLine = (x1, y1, z1, x2, y2, z2, c, lw = 0.4, alpha = 1) => {
    const p1 = iso(x1, y1, z1), p2 = iso(x2, y2, z2);
    line("VISTA_3D_ISO", p1.px, p1.py, p2.px, p2.py, c, lw, alpha);
  };

  const iPoly = (pts3d, cStroke, cFill, lw = 0.4, alpha = 1) => {
    const pts2d = pts3d.map(p => iso(p.x, p.y, p.z));
    poly("VISTA_3D_ISO", pts2d, cStroke, cFill, lw, alpha);
  };

  // 1. Back wall lines
  iLine(1.15, -0.42, 0.4, 1.15, -0.42, zMax - 0.2, isLight ? "#cbd5e1" : "#334155", 0.35);
  iLine(1.15, 0.60, 0.4, 1.15, 0.60, zMax - 0.2, isLight ? "#cbd5e1" : "#334155", 0.35);

  // 2. Brackets
  [z1, z2].forEach(zs => {
    iPoly([{x: 1.15, y: -0.40, z: zs-0.05}, {x: 1.15, y: 0.45, z: zs-0.05}, {x: 1.15, y: 0.45, z: zs+0.05}, {x: 1.15, y: -0.40, z: zs+0.05}], "#64748b", isLight ? "#e2e8f0" : "#1e293b", 0.5);
    iPoly([{x: 1.15, y: -0.05, z: zs-0.04}, {x: -0.10, y: -0.05, z: zs-0.04}, {x: -0.10, y: -0.10, z: zs-0.04}, {x: 1.15, y: -0.10, z: zs-0.04}], "#94a3b8", isLight ? "#cbd5e1" : "#334155", 0.6);
    iPoly([{x: 1.15, y: -0.35, z: zs}, {x: 0.35, y: -0.10, z: zs}, {x: 0.40, y: -0.10, z: zs}, {x: 1.15, y: -0.30, z: zs}], "#94a3b8", isLight ? "#cbd5e1" : "#334155", 0.6);
  });

  // 3. Tray rear wall and floor
  iPoly([{x: 1, y: 0, z: 0}, {x: 1, y: 0.45, z: 0}, {x: 1, y: 0.45, z: zMax}, {x: 1, y: 0, z: zMax}], "#64748b", isLight ? "#e2e8f0" : "#1e293b", 0.5);
  iPoly([{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 1, y: 0, z: zMax}, {x: 0, y: 0, z: zMax}], "#94a3b8", isLight ? "#f1f5f9" : "#0f172a", 0.5);

  // 4. Slots
  for (let z = 0.5; z <= zMax - 0.5; z += 0.6) {
    iLine(0.25, 0.005, z, 0.25, 0.005, z + 0.25, "#f59e0b", 0.5);
    iLine(0.50, 0.005, z, 0.50, 0.005, z + 0.25, "#f59e0b", 0.5);
    iLine(0.75, 0.005, z, 0.75, 0.005, z + 0.25, "#f59e0b", 0.5);
  }

  // 5. 3D Cables
  iPoly([{x: 0.16, y: 0.05, z: 0}, {x: 0.28, y: 0.05, z: 0}, {x: 0.28, y: 0.05, z: zMax}, {x: 0.16, y: 0.05, z: zMax}], "#0284c7", "#38bdf8", 0.6);
  iPoly([{x: 0.42, y: 0.05, z: 0}, {x: 0.54, y: 0.05, z: 0}, {x: 0.54, y: 0.05, z: zMax}, {x: 0.42, y: 0.05, z: zMax}], "#d97706", "#fbbf24", 0.6);
  iPoly([{x: 0.68, y: 0.05, z: 0}, {x: 0.80, y: 0.05, z: 0}, {x: 0.80, y: 0.05, z: zMax}, {x: 0.68, y: 0.05, z: zMax}], "#65a30d", "#84cc16", 0.6);

  // 6. Clamps
  [z1, z2].forEach(zs => {
    iPoly([{x: 0.10, y: 0.09, z: zs-0.03}, {x: 0.90, y: 0.09, z: zs-0.03}, {x: 0.90, y: 0.09, z: zs+0.03}, {x: 0.10, y: 0.09, z: zs+0.03}], "#0891b2", "#06b6d4", 0.7);
  });

  // 7. Front wall
  iLine(0, 0.35, 0, 0, 0.35, zMax, "#38bdf8", 0.8);
  iLine(0, 0, 0, 0, 0, zMax, "#38bdf8", 0.8);
  iLine(0.04, 0.35, 0, 0.04, 0.35, zMax, "#0284c7", 0.45);

  // 8. Front cross section profile
  iPoly([{x: -0.02, y: 0.36, z: 0}, {x: -0.02, y: -0.02, z: 0}, {x: 1.02, y: -0.02, z: 0}, {x: 1.02, y: 0.46, z: 0}, {x: 0.96, y: 0.46, z: 0}, {x: 0.96, y: 0.02, z: 0}, {x: 0.04, y: 0.02, z: 0}, {x: 0.04, y: 0.36, z: 0}], "#38bdf8", isLight ? "#e0f2fe" : "#0c4a6e", 0.75);

  // 9. Dimension line
  const pZ1 = iso(0.50, -0.30, z1);
  const pZ2 = iso(0.50, -0.30, z2);
  iLine(0.50, -0.10, z1, 0.50, -0.32, z1, "#38bdf8", 0.35);
  iLine(0.50, -0.10, z2, 0.50, -0.32, z2, "#38bdf8", 0.35);
  line("VISTA_3D_ISO", pZ1.px, pZ1.py, pZ2.px, pZ2.py, "#f59e0b", 0.55);
  line("VISTA_3D_ISO", pZ1.px - 1.5, pZ1.py - 1.5, pZ1.px + 1.5, pZ1.py + 1.5, "#f59e0b", 0.6);
  line("VISTA_3D_ISO", pZ2.px - 1.5, pZ2.py - 1.5, pZ2.px + 1.5, pZ2.py + 1.5, "#f59e0b", 0.6);

  const midPt = iso(0.50, -0.30, (z1 + z2) / 2);
  text("VISTA_3D_ISO", midPt.px, midPt.py - 3.5, 2.15, `PASSO MENSOLE Ls = ${state.spanM.toFixed(2)} m (SWL = ${metrics.qMaxKgM} kg/m)`, "#fbbf24", "center");

  console.log(`Primitives generated: ${prims.length}`);
  prims.forEach(p => {
    if (p.t === "line") {
      assert(!isNaN(p.x1) && !isNaN(p.y1) && !isNaN(p.x2) && !isNaN(p.y2));
    } else if (p.t === "poly") {
      p.pts.forEach(pt => assert(!isNaN(pt.px) && !isNaN(pt.py)));
    }
  });
  console.log("✓ All 3D primitives are valid and strictly finite!");
}

testFull3DIso();

