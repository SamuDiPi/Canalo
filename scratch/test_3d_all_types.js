const assert = require("assert");

function testAllVariants() {
  const leftBoxX = -48;
  const lowestY = -60;
  const W = 300, H = 75, thk = 1.5;
  const leftBoxW = Math.max(200, W + 92); // 392
  const isoH = 114;
  const isoY = lowestY - isoH - 12;

  const trayTypes = ["solid", "perforated", "mesh", "ladder"];
  const supports = ["wall_med", "wall_light", "wall_heavy", "ceiling_trap", "ceiling_single", "floor_omega"];

  trayTypes.forEach(trayType => {
    supports.forEach(supportKey => {
      const prims = [];
      const line = (layer, x1, y1, x2, y2, color, lw = 0.4, alpha = 1) => prims.push({ t: "line", layer, x1, y1, x2, y2, color, lw, alpha });
      const rect = (layer, x, y, w, h, color, fill, solid = false) => prims.push({ t: "rect", layer, x, y, w, h, color, fill, solid });
      const text = (layer, x, y, h, str, color, align = "left", maxW = null) => prims.push({ t: "text", layer, x, y, h, str, color, align });

      const boxBg = "#0f172a";
      rect("VISTA_3D_ISO", leftBoxX, isoY, leftBoxW, isoH, "#38bdf8", boxBg, true);

      const uMinX = leftBoxX + 18;
      const uMaxX = leftBoxX + leftBoxW - 18;
      const uMinY = isoY + 12;
      const uMaxY = isoY + isoH - 24;
      const uW = uMaxX - uMinX;
      const uH = uMaxY - uMinY;

      const iso = (nx, ny, nz) => ({
        px: uMinX + (0.36 + 0.52 * nz - 0.32 * nx) * uW,
        py: uMinY + (0.14 + 0.26 * nz + 0.14 * nx + 0.36 * ny) * uH
      });

      const iLine = (nx1, ny1, nz1, nx2, ny2, nz2, c = "#94a3b8", lw = 0.45, alpha = 1) => {
        const p1 = iso(nx1, ny1, nz1), p2 = iso(nx2, ny2, nz2);
        line("VISTA_3D_ISO", p1.px, p1.py, p2.px, p2.py, c, lw, alpha);
      };

      // Headers
      text("VISTA_3D_ISO", leftBoxX + 6, isoY + isoH - 7, 2.3, `ASSONOMETRIA 3D — ${trayType.toUpperCase()}`, "#38bdf8", "left", leftBoxW - 12);
      text("VISTA_3D_ISO", leftBoxX + 6, isoY + isoH - 12, 1.85, `Supporto: ${supportKey} | Ls = 1.50 m`, "#94a3b8", "left", leftBoxW - 12);

      // Supports at z1 = 0.20, z2 = 0.80
      const zSupports = [0.20, 0.80];
      zSupports.forEach(zs => {
        if (supportKey.startsWith("wall_")) {
          // Parete verticale posteriore
          iLine(1.05, -0.22, zs, 1.05, 0.65, zs, "#475569", 0.4);
          // Piastra mensola a parete
          iLine(1.03, -0.20, zs, 1.03, 0.45, zs, "#94a3b8", 0.7);
          // Braccio orizzontale mensola sotto la canalina
          iLine(1.03, -0.05, zs, -0.06, -0.05, zs, "#94a3b8", 0.85);
          iLine(1.03, -0.09, zs, -0.06, -0.09, zs, "#64748b", 0.5);
          iLine(-0.06, -0.05, zs, -0.06, -0.09, zs, "#94a3b8", 0.6);
          // Puntone se wall_med o wall_heavy
          if (supportKey !== "wall_light") {
            iLine(1.03, -0.18, zs, 0.35, -0.05, zs, "#94a3b8", 0.75);
          }
        } else if (supportKey === "ceiling_trap") {
          // Traversa inferiore a trapezio sotto la canalina
          iLine(-0.08, -0.06, zs, 1.08, -0.06, zs, "#94a3b8", 0.85);
          // Barre filettate verticali M8/M10 verso soffitto
          iLine(-0.06, -0.06, zs, -0.06, 0.68, zs, "#cbd5e1", 0.5);
          iLine(1.06, -0.06, zs, 1.06, 0.68, zs, "#cbd5e1", 0.5);
          // Piastre di ancoraggio a soffitto
          iLine(-0.09, 0.68, zs, -0.03, 0.68, zs, "#94a3b8", 0.7);
          iLine(1.03, 0.68, zs, 1.09, 0.68, zs, "#94a3b8", 0.7);
        } else if (supportKey === "ceiling_single") {
          // Pendino singolo centrale
          iLine(0.50, -0.06, zs, 0.50, 0.68, zs, "#cbd5e1", 0.75);
          iLine(-0.05, -0.06, zs, 1.05, -0.06, zs, "#94a3b8", 0.8);
          iLine(0.45, 0.68, zs, 0.55, 0.68, zs, "#94a3b8", 0.7);
        } else {
          // Supporto a pavimento omega
          iLine(-0.04, -0.05, zs, -0.04, -0.22, zs, "#94a3b8", 0.75);
          iLine(1.04, -0.05, zs, 1.04, -0.22, zs, "#94a3b8", 0.75);
          iLine(-0.08, -0.22, zs, 1.08, -0.22, zs, "#64748b", 0.5);
        }
      });

      // Canalina stilizzata
      if (trayType === "solid") {
        // Fondo
        iLine(0, 0, 0, 1, 0, 0, "#cbd5e1", 0.7);
        iLine(1, 0, 0, 1, 0, 1, "#cbd5e1", 0.7);
        iLine(1, 0, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(0, 0, 1, 0, 0, 0, "#cbd5e1", 0.7);
        // Sponda destra (frontale)
        iLine(0, 0, 0, 0, 0.40, 0, "#cbd5e1", 0.75);
        iLine(0, 0.40, 0, 0, 0.40, 1, "#cbd5e1", 0.75);
        iLine(0, 0.40, 1, 0, 0, 1, "#64748b", 0.45);
        // Sponda sinistra (posteriore)
        iLine(1, 0, 0, 1, 0.40, 0, "#cbd5e1", 0.75);
        iLine(1, 0.40, 0, 1, 0.40, 1, "#cbd5e1", 0.75);
        iLine(1, 0.40, 1, 1, 0, 1, "#64748b", 0.45);
        // Bordini di ritorno a C
        iLine(0, 0.40, 0, 0.05, 0.40, 0, "#94a3b8", 0.5);
        iLine(0.05, 0.40, 0, 0.05, 0.40, 1, "#94a3b8", 0.4);
        iLine(1, 0.40, 0, 0.95, 0.40, 0, "#94a3b8", 0.5);
        iLine(0.95, 0.40, 0, 0.95, 0.40, 1, "#94a3b8", 0.4);
      } else if (trayType === "perforated") {
        // Canale Asolato
        iLine(0, 0, 0, 1, 0, 0, "#cbd5e1", 0.7);
        iLine(1, 0, 0, 1, 0, 1, "#cbd5e1", 0.7);
        iLine(1, 0, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(0, 0, 1, 0, 0, 0, "#cbd5e1", 0.7);
        iLine(0, 0, 0, 0, 0.40, 0, "#cbd5e1", 0.75);
        iLine(0, 0.40, 0, 0, 0.40, 1, "#cbd5e1", 0.75);
        iLine(0, 0.40, 1, 0, 0, 1, "#64748b", 0.45);
        iLine(1, 0, 0, 1, 0.40, 0, "#cbd5e1", 0.75);
        iLine(1, 0.40, 0, 1, 0.40, 1, "#cbd5e1", 0.75);
        iLine(1, 0.40, 1, 1, 0, 1, "#64748b", 0.45);
        // Feritoie asolate longitudinali
        for (let z = 0.08; z <= 0.92; z += 0.12) {
          iLine(0.25, 0, z, 0.25, 0, z + 0.05, "#f59e0b", 0.4);
          iLine(0.75, 0, z, 0.75, 0, z + 0.05, "#f59e0b", 0.4);
          iLine(0, 0.20, z, 0, 0.20, z + 0.05, "#f59e0b", 0.4);
          iLine(1, 0.20, z, 1, 0.20, z + 0.05, "#f59e0b", 0.4);
        }
      } else if (trayType === "mesh") {
        // Rete Cablofil
        iLine(0, 0.40, 0, 0, 0.40, 1, "#38bdf8", 0.7);
        iLine(1, 0.40, 0, 1, 0.40, 1, "#38bdf8", 0.7);
        iLine(0, 0, 0, 0, 0, 1, "#38bdf8", 0.7);
        iLine(1, 0, 0, 1, 0, 1, "#38bdf8", 0.7);
        iLine(0.33, 0, 0, 0.33, 0, 1, "#0284c7", 0.45);
        iLine(0.66, 0, 0, 0.66, 0, 1, "#0284c7", 0.45);
        for (let z = 0.05; z <= 0.95; z += 0.10) {
          iLine(0, 0.40, z, 0, 0, z, "#0284c7", 0.5);
          iLine(0, 0, z, 1, 0, z, "#0284c7", 0.5);
          iLine(1, 0, z, 1, 0.40, z, "#0284c7", 0.5);
        }
      } else if (trayType === "ladder") {
        // Scaletta a pioli
        iLine(0, 0.40, 0, 0, 0.40, 1, "#f59e0b", 0.75);
        iLine(0, 0, 0, 0, 0, 1, "#f59e0b", 0.75);
        iLine(0, 0, 0, 0, 0.40, 0, "#f59e0b", 0.75);
        iLine(0, 0, 1, 0, 0.40, 1, "#b45309", 0.5);

        iLine(1, 0.40, 0, 1, 0.40, 1, "#f59e0b", 0.75);
        iLine(1, 0, 0, 1, 0, 1, "#f59e0b", 0.75);
        iLine(1, 0, 0, 1, 0.40, 0, "#f59e0b", 0.75);
        iLine(1, 0, 1, 1, 0.40, 1, "#b45309", 0.5);

        for (let z = 0.08; z <= 0.92; z += 0.16) {
          iLine(0, 0.02, z, 1, 0.02, z, "#f59e0b", 0.85);
          iLine(0, 0.02, z + 0.03, 1, 0.02, z + 0.03, "#f59e0b", 0.85);
          iLine(0, 0.04, z + 0.015, 1, 0.04, z + 0.015, "#fbbf24", 0.5);
        }
      }

      // Cavi interni 3D (3 linee pulite di fase / PE)
      [
        { nx: 0.22, ny: 0.05, col: "#38bdf8" },
        { nx: 0.48, ny: 0.05, col: "#fbbf24" },
        { nx: 0.76, ny: 0.05, col: "#4ade80" }
      ].forEach(c => {
        iLine(c.nx, c.ny, 0, c.nx, c.ny, 1, c.col, 0.75);
      });

      // Fascette di ancoraggio alle mensole
      zSupports.forEach(zs => {
        iLine(-0.02, 0.06, zs, 1.02, 0.06, zs, "#06b6d4", 0.65);
      });

      // Quota passo mensole
      const dimNy = -0.16;
      const pZ1 = iso(0.50, dimNy, zSupports[0]);
      const pZ2 = iso(0.50, dimNy, zSupports[1]);
      iLine(0.50, -0.06, zSupports[0], 0.50, dimNy - 0.03, zSupports[0], "#38bdf8", 0.35);
      iLine(0.50, -0.06, zSupports[1], 0.50, dimNy - 0.03, zSupports[1], "#38bdf8", 0.35);
      line("VISTA_3D_ISO", pZ1.px, pZ1.py, pZ2.px, pZ2.py, "#f59e0b", 0.55);
      line("VISTA_3D_ISO", pZ1.px - 1.5, pZ1.py - 1.5, pZ1.px + 1.5, pZ1.py + 1.5, "#f59e0b", 0.6);
      line("VISTA_3D_ISO", pZ2.px - 1.5, pZ2.py - 1.5, pZ2.px + 1.5, pZ2.py + 1.5, "#f59e0b", 0.6);
      const pMid = iso(0.50, dimNy, (zSupports[0] + zSupports[1]) / 2);
      text("VISTA_3D_ISO", pMid.px, pMid.py - 3.5, 2.2, "PASSO MENSOLE Ls = 1.50 m (SWL = 75 kg/m)", "#fbbf24", "center");

      // Check bounds
      prims.forEach((p, idx) => {
        if (p.t === "line") {
          [ {x: p.x1, y: p.y1}, {x: p.x2, y: p.y2} ].forEach(pt => {
            if (pt.x < leftBoxX || pt.x > leftBoxX + leftBoxW || pt.y < isoY || pt.y > isoY + isoH) {
              throw new Error(`Overflow in ${trayType}/${supportKey} line #${idx}: (${pt.x}, ${pt.y})`);
            }
          });
        }
      });
    });
  });

  console.log(`✓ ALL 24 combinations of [trayType x support] tested with ZERO overflows!`);
}

testAllVariants();

