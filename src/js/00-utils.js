    // ============================================================================
    // 0. UTILITÀ CONDIVISE (VERSIONE, NOTIFICHE, DOWNLOAD, STORAGE SICURO)
    // ============================================================================
    // Unica fonte della versione mostrata in titolo, menu, guida e file di progetto.
    const APP_VERSION = "16.5";
    const APP_NAME = "CanaloCAD";

    function debounce(fn, ms) {
      let t = null;
      const d = (...args) => { clearTimeout(t); t = setTimeout(() => { t = null; fn(...args); }, ms); };
      d.flush = (...args) => { if (t) { clearTimeout(t); t = null; } fn(...args); };
      d.cancel = () => { if (t) { clearTimeout(t); t = null; } };
      d.pending = () => t !== null;
      return d;
    }

    // localStorage può lanciare eccezioni (navigazione privata, quota piena, file://)
    const safeStorage = {
      get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
      set(key, val) { try { localStorage.setItem(key, val); return true; } catch (e) { return false; } },
      remove(key) { try { localStorage.removeItem(key); } catch (e) {} }
    };

    // Scarica un Blob con il nome indicato e libera l'URL temporaneo
    function downloadBlob(blob, fileName) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(a.href); }, 1000);
    }

    // Campo CSV sicuro (separatore ";"): virgolette raddoppiate
    function csvField(v) {
      return `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    }

    // Notifica temporanea in basso a destra. tone: info | ok | warn | error.
    // action: { label, onClick } opzionale (es. "Annulla").
    function toast(message, tone = "info", action = null, ms = 4500) {
      let host = document.getElementById("toastHost");
      if (!host) {
        host = document.createElement("div");
        host.id = "toastHost";
        host.setAttribute("role", "status");
        host.setAttribute("aria-live", "polite");
        host.className = "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-2rem)]";
        document.body.appendChild(host);
      }
      const tones = {
        info: "border-slate-600 text-slate-100",
        ok: "border-emerald-500/60 text-emerald-100",
        warn: "border-amber-500/60 text-amber-100",
        error: "border-red-500/70 text-red-100"
      };
      const el = document.createElement("div");
      el.className = `pointer-events-auto bg-slate-900/95 backdrop-blur border ${tones[tone] || tones.info} rounded-lg shadow-2xl px-3.5 py-2.5 text-[13px] flex items-center gap-3 transition-opacity duration-300`;
      const txt = document.createElement("span");
      txt.textContent = message;
      el.appendChild(txt);
      let timer = null;
      const close = () => { clearTimeout(timer); el.style.opacity = "0"; setTimeout(() => el.remove(), 300); };
      if (action && action.label) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = action.label;
        b.className = "font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2";
        b.onclick = () => { close(); action.onClick && action.onClick(); };
        el.appendChild(b);
      }
      const x = document.createElement("button");
      x.type = "button";
      x.setAttribute("aria-label", "Chiudi notifica");
      x.textContent = "×";
      x.className = "text-slate-400 hover:text-white text-base leading-none";
      x.onclick = close;
      el.appendChild(x);
      host.appendChild(el);
      timer = setTimeout(close, ms);
      return close;
    }

