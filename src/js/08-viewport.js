    // ============================================================================
    // 7. MOTORE GRAFICO INTERATTIVO (PAN, ZOOM, DRAG CAVI, RIGHELLO)
    // ============================================================================
    const canvas = document.getElementById("cadCanvas");
    const ctx = canvas.getContext("2d");
    let camScale = 1.4, camX = 260, camY = 260;
    let draggedCable = null, panning = false, panOrigin = { x: 0, y: 0 };
    let draggedSeptumIdx = null;
    let rulerActive = false, rulerP1 = null, rulerP2 = null;

    function screenToWorld(sx, sy) { return { x: (sx - camX) / camScale, y: (camY - sy) / camScale }; }

    function toggleRuler() {
      rulerActive = !rulerActive;
      rulerP1 = null; rulerP2 = null;
      document.querySelectorAll("[data-ruler-label]").forEach(el => { el.textContent = rulerActive ? "Righello: attivo" : "Righello: spento"; });
      const bTool = document.getElementById("btnRulerTool");
      if (bTool) { bTool.setAttribute("aria-pressed", String(rulerActive)); bTool.style.background = rulerActive ? "var(--md-secondary-container)" : ""; }
      canvas.style.cursor = rulerActive ? "crosshair" : "default";
      drawScene();
    }

    // ---------------------------------------------------------------------------
    // Scena memorizzata: buildCADScene() (2D + assonometria) è costosa e dipende solo dallo stato.
    // Pan, zoom, righello e cursore ridisegnano la scena già costruita senza ricalcolarla.
    // ---------------------------------------------------------------------------
    let sceneCache = null, sceneCacheKey = "";
    function getCachedScene() {
      const key = JSON.stringify(state);
      if (!sceneCache || key !== sceneCacheKey) {
        sceneCache = buildCADScene();
        sceneCacheKey = key;
      }
      return sceneCache;
    }

    // Render differito al prossimo frame: N richieste nello stesso frame producono 1 solo ridisegno
    const pendingRender = { table: false, chart: false, scene: false };
    let renderFrame = 0;
    function requestRender(parts) {
      Object.assign(pendingRender, parts);
      if (!renderFrame) renderFrame = requestAnimationFrame(flushRender);
    }
    function flushRender() {
      renderFrame = 0;
      const p = { ...pendingRender };
      pendingRender.table = pendingRender.chart = pendingRender.scene = false;
      if (p.table) updateTableUI();
      if (p.chart) { drawInteractiveLoadCurveWidget(); renderChecks(); refreshSegmented(); }
      if (p.scene) drawSceneNow();
    }
    function drawScene() { requestRender({ scene: true }); }

    function drawSceneNow() {
      if (!canvas || !ctx) return;
      const rect = (canvas.parentElement && typeof canvas.parentElement.getBoundingClientRect === "function")
        ? canvas.parentElement.getBoundingClientRect()
        : { width: 1200, height: 800 };
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(200, Math.floor(rect.width || 1200)), h = Math.max(200, Math.floor(rect.height || 600));
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        if (canvas.style) { canvas.style.width = `${w}px`; canvas.style.height = `${h}px`; }
      }
      const lblZ = document.getElementById("lblZoom");
      if (lblZ) lblZ.textContent = `${Math.round(camScale * 75)}%`;

      const { prims } = getCachedScene();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(camX, camY);
      ctx.scale(camScale, camScale);

      // Pass 1: Riempimenti per viste ortogonali 2D (escludendo VISTA_3D_ISO per algoritmo del pittore 3D)
      prims.forEach(p => {
        if (p.layer === "VISTA_3D_ISO") return;
        if (p.t === "rect" && p.fill) {
          ctx.fillStyle = p.fill; ctx.fillRect(p.x, -(p.y + p.h), p.w, p.h);
        } else if (p.t === "circle" && p.fill) {
          ctx.beginPath(); ctx.arc(p.cx, -p.cy, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.fill; ctx.fill();
        } else if (p.t === "poly" && p.fill && p.pts && p.pts.length >= 3) {
          ctx.save();
          if (p.alpha) ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          p.pts.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, -pt.y);
            else ctx.lineTo(pt.x, -pt.y);
          });
          ctx.closePath();
          ctx.fillStyle = p.fill;
          ctx.fill();
          ctx.restore();
        }
      });

      // Pass 2: Contorni vettoriali e testi per viste ortogonali 2D (escludendo VISTA_3D_ISO)
      prims.forEach(p => {
        if (p.layer === "VISTA_3D_ISO") return;
        if (p.t === "line") {
          ctx.save();
          if (p.alpha) ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = p.color; ctx.lineWidth = p.lw || 0.4;
          ctx.beginPath(); ctx.moveTo(p.x1, -p.y1); ctx.lineTo(p.x2, -p.y2); ctx.stroke();
          ctx.restore();
        } else if (p.t === "rect") {
          ctx.strokeStyle = p.color; ctx.lineWidth = 0.4;
          ctx.strokeRect(p.x, -(p.y + p.h), p.w, p.h);
        } else if (p.t === "circle") {
          ctx.beginPath(); ctx.arc(p.cx, -p.cy, p.r, 0, Math.PI * 2);
          ctx.strokeStyle = p.color; ctx.lineWidth = 0.45; ctx.stroke();
        } else if (p.t === "poly" && p.color && p.pts && p.pts.length >= 2) {
          ctx.save();
          if (p.alpha) ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = p.color; ctx.lineWidth = p.lw || 0.4;
          ctx.beginPath();
          p.pts.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, -pt.y);
            else ctx.lineTo(pt.x, -pt.y);
          });
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        } else if (p.t === "text") {
          ctx.font = `${(p.h || 2.5) * 1.0}px Arial, sans-serif`;
          ctx.fillStyle = p.color; ctx.textAlign = p.align || "left";
          ctx.fillText(p.str, p.x, -p.y);
        }
      });

      // Pass 3: VISTA_3D_ISO con profondità rigorosa (fill + contorno accoppiati in ordine di profondità)
      prims.forEach(p => {
        if (p.layer !== "VISTA_3D_ISO") return;
        if (p.t === "rect") {
          if (p.fill) {
            ctx.fillStyle = p.fill;
            ctx.fillRect(p.x, -(p.y + p.h), p.w, p.h);
          }
          if (p.color) {
            ctx.strokeStyle = p.color; ctx.lineWidth = 0.4;
            ctx.strokeRect(p.x, -(p.y + p.h), p.w, p.h);
          }
        } else if (p.t === "circle") {
          ctx.beginPath(); ctx.arc(p.cx, -p.cy, p.r, 0, Math.PI * 2);
          if (p.fill) { ctx.fillStyle = p.fill; ctx.fill(); }
          if (p.color) { ctx.strokeStyle = p.color; ctx.lineWidth = 0.45; ctx.stroke(); }
        } else if (p.t === "poly" && p.pts && p.pts.length >= 2) {
          ctx.save();
          if (p.alpha) ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          p.pts.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, -pt.y);
            else ctx.lineTo(pt.x, -pt.y);
          });
          ctx.closePath();
          if (p.fill && p.pts.length >= 3) {
            ctx.fillStyle = p.fill;
            ctx.fill();
          }
          if (p.color) {
            ctx.strokeStyle = p.color; ctx.lineWidth = p.lw || 0.4;
            ctx.stroke();
          }
          ctx.restore();
        } else if (p.t === "line") {
          ctx.save();
          if (p.alpha) ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = p.color; ctx.lineWidth = p.lw || 0.4;
          ctx.beginPath(); ctx.moveTo(p.x1, -p.y1); ctx.lineTo(p.x2, -p.y2); ctx.stroke();
          ctx.restore();
        } else if (p.t === "text") {
          ctx.font = `${(p.h || 2.5) * 1.0}px Arial, sans-serif`;
          ctx.fillStyle = p.color; ctx.textAlign = p.align || "left";
          ctx.fillText(p.str, p.x, -p.y);
        }
      });

      // Evidenziazione del cavo selezionato nella distinta (solo a video, non entra in tavola né negli export)
      drawSelectionOverlay(ctx);

      if (rulerActive && rulerP1 && rulerP2) {
        const dist = Math.hypot(rulerP2.x - rulerP1.x, rulerP2.y - rulerP1.y);
        ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(rulerP1.x, -rulerP1.y); ctx.lineTo(rulerP2.x, -rulerP2.y); ctx.stroke();
        ctx.fillStyle = "#67e8f9"; ctx.font = "bold 3px 'JetBrains Mono'";
        ctx.fillText(`${dist.toFixed(1)} mm`, (rulerP1.x + rulerP2.x) / 2, -(rulerP1.y + rulerP2.y) / 2 - 2);
      }

      // Guida visiva dinamica durante il trascinamento del setto
      if (draggedSeptumIdx !== null && state.septums > 0) {
        const sx = (state.septumPositions || [])[draggedSeptumIdx];
        if (typeof sx === "number") {
          ctx.save();
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(sx, 40);
          ctx.lineTo(sx, -(state.height + 30));
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "#0284c7";
          ctx.fillRect(sx - 20, -(state.height + 25), 40, 8);
          ctx.strokeStyle = "#38bdf8";
          ctx.strokeRect(sx - 20, -(state.height + 25), 40, 8);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 3.2px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText(`X = ${Math.round(sx)} mm`, sx, -(state.height + 19.5));
          ctx.restore();
        }
      }

      ctx.restore();
    }

    function getCanvasParentRect() {
      if (canvas && canvas.parentElement && typeof canvas.parentElement.getBoundingClientRect === "function") {
        return canvas.parentElement.getBoundingClientRect();
      }
      return { width: 1200, height: 800 };
    }

    function fitAll() {
      const rect = getCanvasParentRect();
      const w = Math.max(200, Math.floor(rect.width || 1200)), h = Math.max(200, Math.floor(rect.height || 600));
      const { bounds } = getCachedScene();
      const bw = bounds.maxX - bounds.minX, bh = bounds.maxY - bounds.minY;
      camScale = Math.min((w - 60) / bw, (h - 60) / bh);
      camX = (w - bw * camScale) / 2 - bounds.minX * camScale;
      camY = h - (h - bh * camScale) / 2 + bounds.minY * camScale;
      drawScene();
    }

    function zoomSection() {
      const rect = getCanvasParentRect();
      camScale = 3.2;
      camX = (rect.width || 1200) * 0.38 - (state.width * camScale) / 2;
      camY = Math.max(200, rect.height || 600) * 0.55;
      drawScene();
    }

    function zoomTables() {
      const rect = getCanvasParentRect();
      const w = Math.max(200, Math.floor(rect.width || 1200)), h = Math.max(200, Math.floor(rect.height || 600));
      const { rightBounds } = getCachedScene();
      const bw = rightBounds.maxX - rightBounds.minX, bh = rightBounds.maxY - rightBounds.minY;
      camScale = Math.min((w - 50) / bw, (h - 50) / bh);
      camX = 25 - rightBounds.minX * camScale;
      camY = h - 25 + rightBounds.minY * camScale;
      drawScene();
    }

    function zoomBy(factor, px = null, py = null) {
      const rect = getCanvasParentRect();
      const sx = px !== null ? px : rect.width / 2;
      const sy = py !== null ? py : Math.max(200, rect.height || 600) / 2;
      const wPt = screenToWorld(sx, sy);
      camScale = Math.max(0.2, Math.min(25, camScale * factor));
      camX = sx - wPt.x * camScale;
      camY = sy + wPt.y * camScale;
      drawScene();
    }

    // ============================================================================
    // INPUT UNIFICATO (POINTER EVENTS): MOUSE, PENNA E TOUCH
    // 1 puntatore: righello / trascina setto / trascina cavo / pan — 2 dita: pinch-zoom
    // ============================================================================
    const activePointers = new Map(); // pointerId -> { x, y } in coordinate canvas
    let pinchStart = null;            // { dist, scale, mid }
    let lastTapTime = 0;
    let pendingPointerMove = null, pointerMoveFrame = 0;

    function canvasPoint(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    // Tolleranze più ampie per il dito rispetto al mouse
    function hitTestSeptum(pt, isTouch) {
      const seps = getSeptumXList();
      const H = state.height;
      const hw = isTouch ? 10 : 8, sw = isTouch ? 6 : 4.5, pad = isTouch ? 2 : 0;
      for (let i = 0; i < seps.length; i++) {
        const dx = Math.abs(pt.x - seps[i]);
        const inHandle = dx <= hw && pt.y >= H - 6 - pad && pt.y <= H + 10 + pad;
        const inStem = dx <= sw && pt.y >= -3 - pad && pt.y <= H;
        if (inHandle || inStem) return i;
      }
      return -1;
    }

    function hitTestCable(pt, isTouch) {
      const tol = isTouch ? 3 : 1;
      for (let i = state.cables.length - 1; i >= 0; i--) {
        const c = state.cables[i];
        if (Math.hypot(pt.x - c.x, pt.y - c.y) <= c.d / 2 + tol) return c;
      }
      return null;
    }

    function dragCableTo(cable, pt) {
      const oldX = cable.x, oldY = cable.y;
      const pos = resolveNonOverlappingPosition(cable, pt.x, pt.y);
      const dx = pos.x - oldX, dy = pos.y - oldY;
      cable.x = pos.x; cable.y = pos.y;
      cable.origX = pos.x; cable.origY = pos.y;
      if (cable.trefoil && cable.trefoilGroupId) {
        state.cables.forEach(other => {
          if (other !== cable && other.trefoilGroupId === cable.trefoilGroupId) {
            other.x = +(other.x + dx).toFixed(1);
            other.y = +(other.y + dy).toFixed(1);
            other.origX = other.x;
            other.origY = other.y;
          }
        });
      }
      drawScene();
    }

    function updateHoverCursor(pt) {
      if (hitTestSeptum(pt, false) >= 0) canvas.style.cursor = "ew-resize";
      else if (hitTestCable(pt, false)) canvas.style.cursor = "grab";
      else canvas.style.cursor = rulerActive ? "crosshair" : "default";
    }

    function startPinch() {
      const [a, b] = [...activePointers.values()];
      pinchStart = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        scale: camScale,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      };
    }

    canvas.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const sp = canvasPoint(e);
      activePointers.set(e.pointerId, sp);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();

      // Secondo dito: annulla eventuali trascinamenti e passa al pinch-zoom
      if (activePointers.size === 2) {
        draggedCable = null; draggedSeptumIdx = null; panning = false;
        startPinch();
        return;
      }
      if (activePointers.size > 2) return;

      const isTouch = e.pointerType !== "mouse";
      if (isTouch) {
        const now = Date.now();
        if (now - lastTapTime < 300) { lastTapTime = 0; fitAll(); return; } // doppio tocco
        lastTapTime = now;
      }

      const pt = screenToWorld(sp.x, sp.y);
      if (rulerActive) {
        if (!rulerP1 || rulerP2) { rulerP1 = pt; rulerP2 = pt; } else { rulerP2 = pt; }
        drawScene();
        return;
      }

      const hitSeptum = hitTestSeptum(pt, isTouch);
      const hitCable = hitTestCable(pt, isTouch);
      // Priorità al setto sulla maniglia superiore o vicino alla lama, altrimenti al cavo
      if (hitSeptum >= 0 && (!hitCable || pt.y >= state.height * 0.45 || Math.abs(pt.x - getSeptumXList()[hitSeptum]) < 3.0)) {
        draggedSeptumIdx = hitSeptum;
        canvas.style.cursor = "ew-resize";
        return;
      }
      if (hitCable) {
        selectCable(state.cables.indexOf(hitCable), true);
        draggedCable = hitCable;
        canvas.style.cursor = "grabbing";
        return;
      }
      panning = true;
      panOrigin = { x: e.clientX - camX, y: e.clientY - camY };
      canvas.style.cursor = "grabbing";
    });

    // Gli spostamenti vengono elaborati al massimo una volta per frame
    canvas.addEventListener("pointermove", e => {
      if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, canvasPoint(e));
      pendingPointerMove = e;
      if (!pointerMoveFrame) pointerMoveFrame = requestAnimationFrame(processPointerMove);
    });

    function processPointerMove() {
      pointerMoveFrame = 0;
      const e = pendingPointerMove;
      if (!e) return;
      pendingPointerMove = null;

      if (activePointers.size === 2 && pinchStart) {
        const [a, b] = [...activePointers.values()];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (pinchStart.dist > 5) {
          const wPt = screenToWorld(pinchStart.mid.x, pinchStart.mid.y);
          camScale = Math.max(0.2, Math.min(25, pinchStart.scale * (dist / pinchStart.dist)));
          camX = pinchStart.mid.x - wPt.x * camScale;
          camY = pinchStart.mid.y + wPt.y * camScale;
          drawScene();
        }
        return;
      }

      const sp = canvasPoint(e);
      const pt = screenToWorld(sp.x, sp.y);
      if (rulerActive && rulerP1 && (activePointers.size > 0 || e.pointerType === "mouse")) {
        rulerP2 = pt;
        drawScene();
        return;
      }
      if (draggedSeptumIdx !== null) {
        moveSeptum(draggedSeptumIdx, pt.x);
      } else if (draggedCable) {
        dragCableTo(draggedCable, pt);
      } else if (panning) {
        camX = e.clientX - panOrigin.x;
        camY = e.clientY - panOrigin.y;
        drawScene();
      } else if (e.pointerType === "mouse") {
        updateHoverCursor(pt);
      }
    }

    function endPointer(e) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchStart = null;

      if (draggedSeptumIdx !== null) {
        draggedSeptumIdx = null;
        recalculateAll();
        updateSeptumUI();
      }
      if (draggedCable) {
        draggedCable = null;
        requestRender({ table: true });
        scheduleSectionSync();
      }
      // Da 2 dita a 1: prosegue con il pan dal dito rimasto
      if (activePointers.size === 1) {
        const rest = [...activePointers.values()][0];
        const r = canvas.getBoundingClientRect();
        panning = true;
        panOrigin = { x: rest.x + r.left - camX, y: rest.y + r.top - camY };
      } else {
        panning = false;
      }
      canvas.style.cursor = rulerActive ? "crosshair" : "default";
    }
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("dblclick", () => fitAll());

    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      const sp = canvasPoint(e);
      zoomBy(e.deltaY < 0 ? 1.15 : 0.87, sp.x, sp.y);
    }, { passive: false });
