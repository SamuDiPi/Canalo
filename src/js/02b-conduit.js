    // ============================================================================
    // 2b. TUBAZIONI: UNO O PIÙ TUBI (BANCO) AL POSTO DELLA CANALINA
    // La sezione è un banco di tubi uguali (righe e colonne). Ogni cavo ha il suo tubo (c.tube); i cavi di un tubo
    // formano un fascio appoggiato sul fondo. Verifica: diametro interno almeno 1,3 volte quello del fascio (o 1,5,
    // state.conduitRatio)
    // (CEI 64-8), un circuito tutto nello stesso tubo, segnali non schermati separati dall'energia (CEI 64-8
    // art. 528.1). Il fascio e i coefficienti di raggruppamento sono gli stessi del modulo Impianto di CartesioCAD
    // (core/Plant.cpp: bundleDiameter, groupingFactor), così i due calcoli danno gli stessi numeri.
    // Niente async/await né ?. : questo file gira anche nel motore JavaScript di CartesioCAD.
    // ============================================================================

    // Tipi di tubo. Diametri: esterno nominale e interno minimo INDICATIVI (i dati del costruttore si scrivono nel
    // campo "Diametro interno"). kPosa: rapporto indicativo tra la portata del cavo in tubo e quella in aria
    // libera del catalogo (metodi di posa della CEI 64-8 Cap. 52 / CEI-UNEL 35024/1 e 35026).
    const CONDUIT_TYPES = {
      rigido: {
        name: "Tubo rigido a vista", long: "Tubo rigido in PVC o senza alogeni, posa a vista su parete o soffitto",
        comfortDn: 50, code: "TRG", laying: "vista", kPosa: 0.80, pitchM: 1.0, bar: 3, stroke: "#cbd5e1", fill: "#475569",
        sizes: [[16, 13.0], [20, 16.9], [25, 21.4], [32, 27.8], [40, 35.4], [50, 44.3], [63, 56.5]]
      },
      corrugato: {
        name: "Tubo corrugato flessibile", long: "Tubo corrugato flessibile in PVC o senza alogeni, posa sottotraccia",
        comfortDn: 40, code: "TCF", laying: "incassato", kPosa: 0.70, pitchM: 0, bar: 0, stroke: "#a8a29e", fill: "#57534e",
        sizes: [[16, 10.7], [20, 14.1], [25, 18.3], [32, 24.3], [40, 31.2], [50, 39.6], [63, 52.6]]
      },
      cavidotto: {
        name: "Cavidotto interrato", long: "Cavidotto corrugato a doppia parete per posa interrata",
        comfortDn: 160, code: "CAV", laying: "interrato", kPosa: 0.80, pitchM: 25, bar: 0, stroke: "#f87171", fill: "#7f1d1d",
        sizes: [[40, 32], [50, 41], [63, 51], [75, 61], [90, 76], [110, 94], [125, 107], [140, 120], [160, 137], [200, 172]]
      },
      metallico: {
        name: "Tubo metallico a vista", long: "Tubo in acciaio zincato, posa a vista",
        comfortDn: 50, code: "TAZ", laying: "vista", kPosa: 0.80, pitchM: 1.0, bar: 3, stroke: "#e2e8f0", fill: "#64748b",
        sizes: [[16, 12.6], [20, 16.4], [25, 21.4], [32, 28.4], [40, 35.6], [50, 45.6]]
      }
    };
    const CONDUIT_MAX_COUNT = 24;

    // Rapporto minimo tra diametro interno del tubo e diametro del fascio: 1,3 (CEI 64-8, default) o 1,5.
    const CONDUIT_RATIOS = [1.3, 1.5];
    function conduitRatio(st) {
      const r = +(st || state).conduitRatio;
      return CONDUIT_RATIOS.indexOf(r) >= 0 ? r : 1.3;
    }
    function fmtConduitRatio(st) {
      return conduitRatio(st).toFixed(1).replace(".", ",");
    }

    function conduitType(st) {
      return CONDUIT_TYPES[(st || state).conduitType] || CONDUIT_TYPES.rigido;
    }
    function isConduitSystem(st) {
      return (st || state).system === "conduit";
    }

    // Diametro interno: quello scritto dall'utente, altrimenti dalla tabella del tipo (fuori tabella: stesso
    // rapporto del diametro più vicino), come tubeInnerDiameter del modulo Impianto.
    function conduitInnerDiameter(st) {
      st = st || state;
      if (+st.conduitInner > 0) return +st.conduitInner;
      const sizes = conduitType(st).sizes;
      const dn = +st.conduitDn || sizes[0][0];
      let best = sizes[0];
      for (const s of sizes) {
        if (Math.abs(s[0] - dn) < 0.01) return s[1];
        if (Math.abs(s[0] - dn) < Math.abs(best[0] - dn)) best = s;
      }
      return +(dn * best[1] / best[0]).toFixed(1);
    }

    // Tubi per fila: quelli scelti, altrimenti tutti in fila fino a 4, poi su due o più file.
    function conduitColumns(st) {
      st = st || state;
      const n = Math.max(1, Math.min(CONDUIT_MAX_COUNT, Math.round(+st.conduitCount || 1)));
      const cols = Math.round(+st.conduitCols || 0);
      if (cols > 0) return Math.min(cols, n);
      if (n <= 4) return n;
      if (n <= 8) return Math.ceil(n / 2);
      return Math.ceil(Math.sqrt(n));
    }

    // Geometria del banco: centri dei tubi (T1 in basso a sinistra, poi verso destra e verso l'alto), ingombro.
    function conduitGeometry(st) {
      st = st || state;
      const n = Math.max(1, Math.min(CONDUIT_MAX_COUNT, Math.round(+st.conduitCount || 1)));
      const D = +st.conduitDn || conduitType(st).sizes[0][0];
      const Di = Math.min(D, conduitInnerDiameter(st));
      const gap = Math.max(0, +st.conduitGap || 0);
      const cols = conduitColumns(st);
      const rows = Math.ceil(n / cols);
      const tubes = [];
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / cols), col = i % cols;
        tubes.push({ i, cx: D / 2 + col * (D + gap), cy: D / 2 + row * (D + gap), D, Di });
      }
      return { tubes, D, Di, gap, cols, rows, W: cols * D + (cols - 1) * gap, H: rows * D + (rows - 1) * gap };
    }

    // --- Fascio di cavi (traduzione di bundleDiameter/bundleLayout di core/Plant.cpp) ----------------------------
    // Mette i cerchi (già dal più grande) in un contenitore di raggio R, ciascuno il più esterno possibile.
    function conduitFits(radii, R, result) {
      const eps = 1e-9;
      const placed = [];
      const ok = (x, y, r) => {
        if (Math.hypot(x, y) + r > R + 1e-7) return false;
        for (const p of placed) if (Math.hypot(x - p.x, y - p.y) < p.r + r - 1e-7) return false;
        return true;
      };
      for (const r of radii) {
        if (r > R + eps) return false;
        if (!placed.length) { placed.push({ x: 0, y: -(R - r), r }); continue; }
        let bestX = 0, bestY = 0, bestDist = -1, bestAngle = 0, found = false;
        const consider = (x, y) => {
          if (!ok(x, y, r)) return;
          const dist = Math.hypot(x, y);
          const angle = Math.atan2(x, -y);
          if (!found || dist > bestDist + 1e-9 || (Math.abs(dist - bestDist) <= 1e-9 && angle < bestAngle)) {
            found = true; bestX = x; bestY = y; bestDist = dist; bestAngle = angle;
          }
        };
        const intersect = (x1, y1, a, x2, y2, b) => {
          const dx = x2 - x1, dy = y2 - y1;
          const d = Math.hypot(dx, dy);
          if (d < eps || d > a + b + 1e-9 || d < Math.abs(a - b) - 1e-9) return;
          const l = (a * a - b * b + d * d) / (2 * d);
          const h = Math.sqrt(Math.max(0, a * a - l * l));
          const mx = x1 + l * dx / d, my = y1 + l * dy / d;
          consider(mx + h * dy / d, my - h * dx / d);
          consider(mx - h * dy / d, my + h * dx / d);
        };
        for (const p of placed) intersect(0, 0, R - r, p.x, p.y, p.r + r);
        for (let i = 0; i < placed.length; i++)
          for (let j = i + 1; j < placed.length; j++)
            intersect(placed[i].x, placed[i].y, placed[i].r + r, placed[j].x, placed[j].y, placed[j].r + r);
        if (!found && ok(0, 0, r)) consider(0, 0);
        if (!found) return false;
        placed.push({ x: bestX, y: bestY, r });
      }
      if (result) result.push.apply(result, placed);
      return true;
    }

    // Diametro del cerchio più piccolo che contiene cerchi dei diametri dati (ricordato: lo stesso fascio si
    // chiede più volte tra ripartizione, verifica e disegno).
    const conduitBundleCache = new Map();
    function conduitBundleDiameter(diameters) {
      const ds = diameters.filter(d => d > 0).sort((a, b) => b - a);
      const key = ds.join(",");
      if (conduitBundleCache.has(key)) return conduitBundleCache.get(key);
      const D = conduitBundleDiameterOf(ds);
      if (conduitBundleCache.size > 400) conduitBundleCache.clear();
      conduitBundleCache.set(key, D);
      return D;
    }
    function conduitBundleDiameterOf(ds) {
      if (!ds.length) return 0;
      if (ds.length === 1) return ds[0];
      if (ds.length === 2) return ds[0] + ds[1];
      const radii = ds.map(d => d / 2);
      let area = 0, sum = 0;
      ds.forEach(d => { area += d * d; sum += d; });
      let lo = Math.max(ds[0], Math.sqrt(area)) / 2;
      let hi = sum / 2 + ds[0];
      while (!conduitFits(radii, hi)) hi *= 1.5;
      for (let i = 0; i < 50 && hi - lo > 1e-4; i++) {
        const mid = (lo + hi) / 2;
        if (conduitFits(radii, mid)) hi = mid; else lo = mid;
      }
      return hi * 2;
    }

    // Centri dei cerchi del fascio rispetto al centro del fascio, nell'ordine dato.
    function conduitBundleLayout(diameters) {
      const out = diameters.map(() => ({ x: 0, y: 0 }));
      const D = conduitBundleDiameter(diameters);
      if (diameters.length <= 1) return { D, pos: out };
      const order = diameters.map((d, i) => i).sort((a, b) => diameters[b] - diameters[a] || a - b);
      const radii = order.map(i => diameters[i] / 2);
      let placed = [];
      if (diameters.length === 2) {
        placed = [{ x: 0, y: -(D / 2 - radii[0]) }, { x: 0, y: D / 2 - radii[1] }];
      } else if (!conduitFits(radii, D / 2 + 1e-6, placed)) {
        return { D, pos: out };
      }
      order.forEach((idx, k) => { if (placed[k]) out[idx] = { x: placed[k].x, y: placed[k].y }; });
      return { D, pos: out };
    }

    // Coefficiente di riduzione per più circuiti raggruppati in tubo (IEC 60364-5-52:2009 tab. B.52.17, riga 1;
    // CEI 64-8:2024 Cap. 52; CEI-UNEL 35024/1), come groupingFactor del modulo Impianto.
    function conduitGroupingFactor(circuits) {
      const table = [[1, 1.00], [2, 0.80], [3, 0.70], [4, 0.65], [5, 0.60], [6, 0.57], [7, 0.54], [8, 0.52], [9, 0.50], [12, 0.45], [16, 0.41], [20, 0.38]];
      let k = 1.0;
      for (const [n, v] of table) if (circuits >= n) k = v;
      return k;
    }
    // Cavidotti interrati affiancati: un circuito per tubo, tubi a contatto (IEC 60364-5-52:2009 tab. B.52.19,
    // cavi multipolari, distanza nulla) o distanziati di almeno 250 mm.
    function conduitDuctFactor(ducts, gapMm) {
      if (ducts <= 1) return 1.0;
      const touching = [[2, 0.85], [3, 0.75], [4, 0.70], [5, 0.65], [6, 0.60]];
      const spaced = [[2, 0.90], [3, 0.85], [4, 0.80], [5, 0.80], [6, 0.80]];
      const table = gapMm >= 250 ? spaced : touching;
      let k = 1.0;
      for (const [n, v] of table) if (ducts >= n) k = v;
      return k;
    }

    // Classe di un cavo per la segregazione: segnali non schermati da separare, sicurezza, energia.
    function conduitCableClass(c) {
      if (c.sys === "SPECIAL_ELV" && !/FTG18|FG16|0,6\/1|1kV|C-4|SCHERM|OH2/i.test(c.type || "")) return "elv";
      if (c.sys === "BT_FIRE") return "fire";
      return "power";
    }

    // Chiave del circuito di un cavo: i conduttori unipolari dello stesso circuito (fasi, neutro, PE) e le terne
    // restano nello stesso tubo (CEI 64-8 art. 521.6). Un cavo multipolare è un circuito da solo (la pagina numera
    // L1, L2... anche più cavi multipolari uguali aggiunti insieme). `idx`: posizione del cavo nella sezione.
    function conduitCircuitKey(c, idx) {
      if (c.trefoil && c.trefoilGroupId) return "TRF:" + c.trefoilGroupId;
      if (typeof isUnipolarCable === "function" && !isUnipolarCable(c)) return "M:" + (idx === undefined ? String(c.code || "") : idx);
      const base = typeof getBaseCircuitCode === "function" ? getBaseCircuitCode(c.code) : String(c.code || "");
      return "C:" + String(base || c.code || "").toUpperCase();
    }

    // Unità da ripartire: un circuito (con tutti i suoi cavi).
    function conduitUnits(cables) {
      const map = new Map();
      cables.forEach((c, idx) => {
        const key = conduitCircuitKey(c, idx);
        if (!map.has(key)) map.set(key, { key, idx: [], area: 0, cls: "power", ds: [] });
        const u = map.get(key);
        u.idx.push(idx);
        u.ds.push(c.d);
        u.area += Math.PI * c.d * c.d / 4;
        const cls = conduitCableClass(c);
        if (cls === "elv" || (cls === "fire" && u.cls === "power")) u.cls = cls;
      });
      return Array.from(map.values());
    }

    // Ripartizione automatica dei cavi sui tubi: tubi distinti per segnali non schermati (obbligatorio) e, se i tubi
    // bastano, per i circuiti di sicurezza; poi i circuiti dal più grande nel tubo della stessa classe con meno area
    // occupata (il fascio esatto si calcola dopo, una volta per tubo).
    // Restituisce l'indice del tubo di ogni cavo (stesso ordine di cables).
    function conduitAutoAssign(cables, count) {
      const out = cables.map(() => 0);
      if (!cables.length) return out;
      const units = conduitUnits(cables).sort((a, b) => b.area - a.area);
      const area = { power: 0, fire: 0, elv: 0 };
      units.forEach(u => { area[u.cls] += u.area; });
      let classes = ["power", "fire", "elv"].filter(k => area[k] > 0);
      // Pochi tubi: la sicurezza va con l'energia (con avviso nelle verifiche); i segnali restano separati se possibile.
      if (classes.length > count && area.fire > 0 && area.power > 0) {
        units.forEach(u => { if (u.cls === "fire") u.cls = "power"; });
        area.power += area.fire; area.fire = 0;
        classes = classes.filter(k => k !== "fire");
      }
      if (classes.length > count) {
        units.forEach(u => { u.cls = "power"; });
        classes = ["power"];
        area.power = units.reduce((s, u) => s + u.area, 0);
      }
      // Tubi per classe in proporzione all'area (almeno uno ciascuna).
      const share = {};
      let left = count - classes.length;
      classes.forEach(k => { share[k] = 1; });
      const total = classes.reduce((s, k) => s + area[k], 0) || 1;
      while (left > 0) {
        let best = classes[0], bestGap = -Infinity;
        classes.forEach(k => {
          const gap = area[k] / total * count - share[k];
          if (gap > bestGap) { bestGap = gap; best = k; }
        });
        share[best]++;
        left--;
      }
      // Tubi assegnati alle classi in ordine (energia, sicurezza, segnali).
      const tubesOf = {};
      let next = 0;
      classes.forEach(k => {
        tubesOf[k] = [];
        for (let i = 0; i < share[k]; i++) tubesOf[k].push(next++);
      });
      const used = new Array(count).fill(0);
      units.forEach(u => {
        const list = tubesOf[u.cls] || tubesOf[classes[0]];
        let best = list[0];
        list.forEach(t => { if (used[t] < used[best] - 1e-9) best = t; });
        used[best] += u.area;
        u.idx.forEach(i => { out[i] = best; });
      });
      return out;
    }

    // Verifica di ogni tubo: fascio, 1,3 volte il fascio, riempimento, circuiti, coefficiente di riduzione, classi.
    function conduitAnalyze(st) {
      st = st || state;
      const g = conduitGeometry(st);
      const type = conduitType(st);
      const n = g.tubes.length;
      const perTube = g.tubes.map(t => ({ n: t.i + 1, cables: [], ds: [], area: 0, classes: {}, circuits: {} }));
      st.cables.forEach((c, idx) => {
        const t = Math.max(0, Math.min(n - 1, Math.round(+c.tube || 0)));
        const p = perTube[t];
        p.cables.push(idx);
        p.ds.push(c.d);
        p.area += Math.PI * c.d * c.d / 4;
        p.classes[conduitCableClass(c)] = true;
        p.circuits[conduitCircuitKey(c, idx)] = true;
      });
      const innerArea = Math.PI * g.Di * g.Di / 4;
      const occupied = perTube.filter(p => p.cables.length).length;
      const ductK = type.laying === "interrato" ? conduitDuctFactor(occupied, g.gap) : 1.0;
      const tubes = perTube.map(p => {
        const bundle = conduitBundleDiameter(p.ds);
        const need = conduitRatio(st) * bundle;
        const circuits = Object.keys(p.circuits).length;
        const kGroup = conduitGroupingFactor(circuits);
        const kr = +(kGroup * type.kPosa * ductK).toFixed(2);
        const conflict = !!(p.classes.elv && (p.classes.power || p.classes.fire));
        return {
          n: p.n, cables: p.cables, count: p.cables.length, circuits,
          bundle: +bundle.toFixed(1), need: +need.toFixed(1),
          ok: !p.cables.length || g.Di + 1e-9 >= need,
          fillPct: innerArea > 0 ? +(p.area / innerArea * 100).toFixed(1) : 0,
          kGroup, kr, conflict, mixedFire: !!(p.classes.fire && p.classes.power),
          classes: Object.keys(p.classes)
        };
      });
      return { geometry: g, type, tubes, ductK, kPosa: type.kPosa };
    }

    // Cavi nella posizione del disegno: fascio di ogni tubo appoggiato sul fondo del tubo.
    function conduitPlaceCables(st) {
      st = st || state;
      const g = conduitGeometry(st);
      const n = g.tubes.length;
      const groups = g.tubes.map(() => []);
      st.cables.forEach(c => {
        let t = Math.round(+c.tube || 0);
        if (!(t >= 0 && t < n)) t = Math.max(0, Math.min(n - 1, t || 0));
        c.tube = t;
        groups[t].push(c);
      });
      groups.forEach((list, t) => {
        if (!list.length) return;
        const tube = g.tubes[t];
        const lay = conduitBundleLayout(list.map(c => c.d));
        // Il fascio tocca il fondo del tubo (se è più grande del tubo resta centrato: la verifica lo segnala).
        const dy = lay.D <= tube.Di ? -(tube.Di / 2 - lay.D / 2) : 0;
        list.forEach((c, k) => {
          c.x = +(tube.cx + lay.pos[k].x).toFixed(1);
          c.y = +(tube.cy + dy + lay.pos[k].y).toFixed(1);
        });
      });
      return g;
    }

    // Diametro e numero di tubi proposti per i cavi della sezione. Un tubo per ogni classe di circuiti presente
    // (energia, sicurezza, segnali non schermati), poi il numero più piccolo e il diametro più piccolo del tipo, con
    // la ripartizione automatica; prima entro il diametro "comodo" del tipo (comfortDn: oltre, tubi difficili da
    // posare e curvare), poi con tutti i diametri. `keepCount`: numero di tubi fisso (si cerca solo il diametro; se
    // nessuno basta si aggiungono tubi). Null se nemmeno CONDUIT_MAX_COUNT tubi del diametro massimo bastano.
    function proposeConduit(st, keepCount) {
      st = st || state;
      const type = conduitType(st);
      if (!st.cables.length) return { dn: type.sizes[0][0], count: Math.max(1, Math.round(+st.conduitCount || 1)) };
      const units = conduitUnits(st.cables);
      const classes = {};
      units.forEach(u => { classes[u.cls] = true; });
      const minCount = Math.max(Object.keys(classes).length, keepCount ? Math.max(1, Math.round(+st.conduitCount || 1)) : 1);
      const trial = count => {
        const assign = conduitAutoAssign(st.cables, count);
        const groups = [];
        for (let i = 0; i < count; i++) groups.push([]);
        assign.forEach((t, i) => groups[t].push(st.cables[i].d));
        // Segnali non schermati con l'energia: non va bene.
        let conflict = false;
        groups.forEach((ds, t) => {
          const cls = {};
          assign.forEach((a, i) => { if (a === t) cls[conduitCableClass(st.cables[i])] = true; });
          if (cls.elv && (cls.power || cls.fire)) conflict = true;
        });
        return conflict ? null : { assign, need: Math.max.apply(null, groups.map(ds => ds.length ? conduitRatio(st) * conduitBundleDiameter(ds) : 0)) };
      };
      const cache = {};
      for (const limit of [type.comfortDn || Infinity, Infinity]) {
        for (let count = minCount; count <= CONDUIT_MAX_COUNT; count++) {
          if (!(count in cache)) cache[count] = trial(count);
          const t = cache[count];
          if (!t) continue;
          for (const sz of type.sizes) {
            if (sz[0] > limit) break;
            if (sz[1] + 1e-9 >= t.need) return { dn: sz[0], count, inner: sz[1], assign: t.assign };
          }
        }
      }
      return null;
    }

    // Distinta materiali della tubazione.
    function conduitBom(st, a) {
      const type = conduitType(st);
      const g = a.geometry;
      const n = g.tubes.length;
      const L = +st.lengthM || 0;
      const dn = Math.round(g.D);
      const pitch = +st.conduitPitchM > 0 ? +st.conduitPitchM : type.pitchM;
      const bom = [
        { code: `${type.code}-D${dn}`, desc: `${type.long} Ø${dn} mm (interno ${fmtConduitMm(g.Di)} mm)`, qty: +(n * L).toFixed(1), um: "m",
          note: type.bar ? `${n} × ${L} m (${n * Math.ceil(L / type.bar)} barre da ${type.bar} m)` : `${n} × ${L} m` }
      ];
      if (type.bar && L > type.bar) {
        bom.push({ code: `${type.code}-MAN-${dn}`, desc: `Manicotto di giunzione Ø${dn} mm`, qty: n * (Math.ceil(L / type.bar) - 1), um: "cad", note: `1 ogni ${type.bar} m` });
      }
      if (st.bends90 > 0) {
        bom.push({ code: `${type.code}-CRV90-${dn}`, desc: `Curva 90° Ø${dn} mm`, qty: st.bends90 * n, um: "cad", note: `${st.bends90} per tubo` });
      }
      if (type.laying === "vista" && pitch > 0) {
        bom.push({ code: `${type.code}-COL-${dn}`, desc: `Collare di fissaggio Ø${dn} mm con tassello`, qty: n * (Math.ceil(L / pitch) + 1), um: "cad", note: `passo ${pitch} m` });
      }
      if (st.tees > 0) {
        bom.push({ code: `${type.code}-CAS`, desc: type.laying === "interrato" ? "Pozzetto di derivazione" : "Cassetta di derivazione con raccordi", qty: st.tees, um: "cad", note: "derivazioni del tratto" });
      }
      if (type.laying === "interrato") {
        const nPoz = pitch > 0 ? Math.ceil(L / pitch) + 1 : 2;
        bom.push({ code: `${type.code}-POZ`, desc: "Pozzetto ispezionabile con chiusino", qty: nPoz, um: "cad", note: pitch > 0 ? `ogni ${pitch} m e alle estremità` : "alle estremità" });
        bom.push({ code: `${type.code}-NAS`, desc: "Nastro di segnalazione cavi interrati", qty: +L.toFixed(1), um: "m", note: "sopra il cavidotto" });
        bom.push({ code: `${type.code}-TAP`, desc: `Tappo di chiusura Ø${dn} mm per tubi di riserva`, qty: 2 * a.tubes.filter(t => !t.count).length, um: "cad", note: "tubi vuoti" });
      }
      if (st.reiCount > 0) {
        bom.push({ code: `FIRE-EI120-TUBI-${dn}`, desc: `Sigillatura tagliafuoco EI120 per ${n} tubi Ø${dn} mm (collare intumescente)`, qty: st.reiCount, um: "varco", note: `${n} collari per varco` });
      }
      return bom.filter(b => b.qty > 0);
    }

    function fmtConduitMm(v) {
      const r = Math.round(v * 10) / 10;
      return String(r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)).replace(".", ",");
    }

    // Etichetta corta della tubazione: "2 × Ø32 rigido".
    function conduitLabel(st) {
      st = st || state;
      const n = Math.max(1, Math.round(+st.conduitCount || 1));
      const t = st.conduitType || "rigido";
      return `${n > 1 ? n + " × " : ""}Ø${Math.round(+st.conduitDn || 0)} ${t}`;
    }

    // Passaggio tra canalina e tubazione: le dimensioni della canalina si conservano per il ritorno.
    function setSectionSystem(sys) {
      if (sys !== "conduit") sys = "tray";
      if ((state.system || "tray") === sys) return;
      if (sys === "conduit") {
        state.trayW = state.width;
        state.trayH = state.height;
        state.system = "conduit";
        if (!(+state.conduitDn > 0)) state.conduitDn = 25;
        state.conduitAssign = "auto";
        const p = proposeConduit(state, false);
        if (p) { state.conduitDn = p.dn; state.conduitCount = p.count; }
        state.title = String(state.title || "").replace(/CANALINA/i, "TUBAZIONE").replace(/\s*-\s*L=\s*\d+\s*mm\s*H=\s*\d+\s*mm/i, "");
      } else {
        state.system = "tray";
        if (+state.trayW > 0) state.width = +state.trayW;
        if (+state.trayH > 0) state.height = +state.trayH;
        state.title = String(state.title || "").replace(/TUBAZIONE/i, "CANALINA");
      }
    }

    // Ricalcolo della sezione a tubi (al posto di quello della canalina in recalculateAll): ripartizione, posizioni,
    // verifiche, distinta e risultati negli stessi campi di metrics (più metrics.conduit).
    function recalculateConduit() {
      const type = conduitType();
      state.conduitCount = Math.max(1, Math.min(CONDUIT_MAX_COUNT, Math.round(+state.conduitCount || 1)));
      if (!(+state.conduitDn > 0)) state.conduitDn = type.sizes[0][0];
      if (state.conduitAssign !== "manual") {
        // I tubi che servono (dal numero di classi di circuiti in su), gli altri restano di riserva; se nemmeno tutti
        // bastano, i cavi si dividono su tutti (la verifica lo segnala).
        const Di = conduitInnerDiameter(state);
        const ratio = conduitRatio(state);
        const classes = {};
        state.cables.forEach(c => { classes[conduitCableClass(c)] = true; });
        const fitsWith = (assign, k) => {
          for (let t = 0; t < k; t++) {
            const ds = [], cls = {};
            assign.forEach((a, i) => { if (a === t) { ds.push(state.cables[i].d); cls[conduitCableClass(state.cables[i])] = true; } });
            if (cls.elv && (cls.power || cls.fire)) return false;
            // Limite inferiore del fascio (area dei cavi) prima del calcolo esatto.
            if (ds.length && ratio * Math.sqrt(ds.reduce((q, d) => q + d * d, 0)) > Di + 1e-9) return false;
            if (ds.length && ratio * conduitBundleDiameter(ds) > Di + 1e-9) return false;
          }
          return true;
        };
        let assign = null;
        for (let k = Math.min(state.conduitCount, Math.max(1, Object.keys(classes).length)); k <= state.conduitCount && !assign; k++) {
          const a = conduitAutoAssign(state.cables, k);
          if (fitsWith(a, k)) assign = a;
        }
        if (!assign) assign = conduitAutoAssign(state.cables, state.conduitCount);
        state.cables.forEach((c, i) => { c.tube = assign[i]; });
      }
      const g = conduitPlaceCables(state);
      state.width = +g.W.toFixed(1);
      state.height = +g.H.toFixed(1);
      state.support = "none";
      state.septums = 0;
      state.septumPositions = [];
      const a = conduitAnalyze(state);

      let cablesKgM = 0, cuArea = 0, maxBendR = 0, critCode = "-", jouleWm = 0, maxDv = 0, deratingFailCode = null;
      state.cables.forEach(c => {
        cablesKgM += c.w || 0;
        cuArea += (c.sec || 2.5) * (c.cores || 2);
        const rMin = Math.round(c.d * (c.bendK || 10));
        if (rMin > maxBendR) { maxBendR = rMin; critCode = c.code; }
        if (state.pdfLoaded && c.ib > 0) {
          const kr = a.tubes[c.tube] ? a.tubes[c.tube].kr : 1;
          jouleWm += (c.cores || 2) * (0.0214 / Math.max(0.5, c.sec || 2.5)) * Math.pow(c.ib, 2);
          const kP = c.cores === 3 ? 1.732 : 2.0;
          const vN = c.cores === 3 ? 400 : 230;
          const dv = ((kP * state.lengthM * c.ib * (0.0214 / Math.max(0.5, c.sec || 2.5)) * 0.9) / vN) * 100;
          if (dv > maxDv) maxDv = dv;
          if ((c.iz0 || 27) * kr < c.ib && !deratingFailCode) deratingFailCode = c.code;
        }
      });

      const used = a.tubes.filter(t => t.count);
      const fillPct = used.length ? Math.max.apply(null, used.map(t => t.fillPct)) : 0;
      const kr = used.length ? Math.min.apply(null, used.map(t => t.kr)) : 1;
      const conflict = a.tubes.find(t => t.conflict);
      const segConform = !conflict;
      const segDetail = conflict
        ? `Segnali non schermati con l'energia nel tubo T${conflict.n}: separarli`
        : (a.tubes.some(t => t.classes.indexOf("elv") >= 0) ? "Segnali in tubi separati dall'energia" : "Solo cavi di energia");
      const allOk = a.tubes.every(t => t.ok);
      const worst = a.tubes.filter(t => !t.ok).sort((x, y) => (y.need - g.Di) - (x.need - g.Di))[0] || null;
      const pullDaN = +(cablesKgM * state.lengthM * 0.35 * Math.exp(0.35 * state.bends90 * (Math.PI / 2))).toFixed(1);
      const maxPullDaN = Math.round(Math.max(15, cuArea * 5.0));
      const fitR = maxBendR <= 150 ? 150 : maxBendR <= 300 ? 300 : 600;
      // Peso indicativo dei tubi: parete media (esterno - interno) / 2, PVC 1,4 kg/dm³, acciaio 7,85.
      const wall = Math.max(0.5, (g.D - g.Di) / 2);
      const density = state.conduitType === "metallico" ? 7.85 : 1.4;
      const tubeKgM = +(g.tubes.length * Math.PI * (g.D - wall) * wall * density / 1000).toFixed(2);

      metrics = {
        fillPct, sparePct: +(Math.max(0, 100 - fillPct)).toFixed(1), kr, nLayers: 1,
        kFascio: used.length ? Math.min.apply(null, used.map(t => t.kGroup)) : 1, kStrati: 1, kPosa: type.kPosa,
        segConform, segDetail,
        totalKgM: +(cablesKgM + tubeKgM).toFixed(2), qMaxKgM: 999, pointLoad: 0, maxPoint: 0, loadPct: 0,
        deflectionMm: 0, maxDeflectionMm: 0,
        pullDaN, maxPullDaN, maxBendR, critCode, fitR,
        jouleWm: +jouleWm.toFixed(1), maxDv: +maxDv.toFixed(2),
        bom: conduitBom(state, a),
        deratingFailCode,
        conduit: {
          type: state.conduitType || "rigido", typeName: type.name, laying: type.laying,
          dn: g.D, di: g.Di, ratio: conduitRatio(), count: g.tubes.length, cols: g.cols, rows: g.rows, gap: g.gap,
          allOk, worstTube: worst ? worst.n : 0, ductK: a.ductK,
          tubes: a.tubes.map(t => ({ n: t.n, cavi: t.count, circuiti: t.circuits, fascio: t.bundle, minimo: t.need, ok: t.ok,
            riempimento: t.fillPct, kr: t.kr, segregazione: !t.conflict, sicurezzaConEnergia: t.mixedFire }))
        }
      };
      state.metrics = metrics;
      if (typeof window !== "undefined") window.metrics = metrics;

      const safeSetText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      safeSetText("kpiAreaUsed", Math.round(state.cables.reduce((s, c) => s + Math.PI * c.d * c.d / 4, 0)));
      safeSetText("kpiAreaTot", Math.round(g.tubes.length * Math.PI * g.Di * g.Di / 4));
      safeSetText("kpiFill", `${fillPct}%`);
      safeSetText("kpiSpare", `Riserva +${metrics.sparePct}%`);
      safeSetText("kpiPull", pullDaN);
      safeSetText("kpiBendR", maxBendR);
      if (state.pdfLoaded) {
        safeSetText("kpiJoule", metrics.jouleWm);
        safeSetText("kpiDv", `${metrics.maxDv}%`);
      }
      if (typeof updateConduitUI === "function") updateConduitUI();
      requestRender({ table: true, chart: true, scene: true });
      scheduleSectionSync();
    }
