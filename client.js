window.__ModuleLoader__.load({
  id: "dsh-add-file",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");

// dsh-add-file — custom "+" menu with file upload
// Replaces the default command menu button with a unified launcher
// that supports file upload and is extensible for future items.

(function () {
  "use strict";

  // ── Module-level context (set during apply, used during inject) ──
  let _ctx = null;

  // ── Menu item registry (extensible) ──
  // Each item: { id, label, icon (SVG string), section, action, description? }
  const MENU_ITEMS = [
    {
      id: "command",
      label: "命令",
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5v-1a2 2 0 112 2h-5m3 2v1a2 2 0 11-2-2h5m3-2v-1a2 2 0 10-2 2h5m-3 2v1a2 2 0 102 2h-5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      section: "命令",
      description: "打开 DSH 命令面板",
    },
    {
      id: "file",
      label: "文件",
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 1.5A1.5 1.5 0 015.5 0h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V14.5A1.5 1.5 0 0110 16H5.5A1.5 1.5 0 014 14.5v-13z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 8l2.5-2.5M8 8H5.5M8 8V11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      section: "添加",
      description: "上传文件为附件",
    },
    // ── Future items go here ──
    // { id: "image", label: "图片", icon: '...', section: "添加" },
    // { id: "goal",  label: "目标", icon: '...', section: "添加" },
  ];

  // ── CSS ──
  const STYLE_CSS = `
/* Override any rule that sets text-align on the input area */
.dsh-am-menu-anchor,
.dsh-am-menu-anchor ~ textarea,
.dsh-am-menu-anchor ~ [contenteditable] {
  text-align: left !important;
}

/* Hide DSH's native command-menu "+" (指令) button and the native
   attachment (添加附件) button — both are replaced by our + menu; the
   dsh-files folder-picker button is redundant too. Survivors of React
   remounts; these are the only matching buttons inside the composer seat. */
[data-composer-seat] button[aria-haspopup="listbox"],
[data-composer-seat] button[aria-label="添加附件"],
[data-composer-seat] [data-slot="conversation.input.left"] .dsh-files-btn {
  display: none !important;
}

/* Pull the left-tools slot outlet (our + and dsh-files paperclip) to the
   far left of the tools row — where the native + used to sit */
[data-composer-seat] [data-slot="conversation.input.left"] {
  order: -1;
}

/* ── Menu anchor (wraps the + button) ── */
.dsh-am-menu-anchor {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

/* ── Trigger button ──
   Mirrors DSH's native composer "+" (uV2eYG_add) so it sits in the theme:
   filled circle on --dsw-specific-selector, 28px, hover-solid background. */
.dsh-am-trigger {
  corner-shape: round;
  border: none;
  background: var(--dsw-specific-selector, transparent);
  color: var(--dsw-alias-label-primary, currentColor);
  width: 28px;
  height: 28px;
  border-radius: 999px;
  padding: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex: none;
  line-height: 0;
  transition: background 0.15s, color 0.15s;
}
.dsh-am-trigger:hover {
  background: var(--dsw-alias-interactive-bg-hover-solid, var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)));
}

/* ── Dropdown panel ──
   position:fixed + body-level (portal): React re-renders of the composer
   would otherwise wipe a dropdown living inside the React-managed anchor.
   left/bottom are computed from the anchor's rect at open time.
   Surface/shadow/radius follow DSH's own menu recipe (slash menu). */
.dsh-am-dropdown {
  position: fixed;
  min-width: 240px;
  max-width: min(360px, calc(100vw - 32px));
  max-height: min(360px, calc(100vh - 96px));
  overflow-y: auto;
  background: var(--dsw-specific-menu, var(--dsw-alias-bg-layer-1, #fff));
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  border: 0;
  border-radius: 20px;
  box-shadow: var(--dsw-elevation-prominent, 0 8px 32px rgba(0,0,0,.24));
  padding: 4px;
  z-index: 9999;
  font-family: var(--dsw-font-family, inherit);
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary, #1a1a1a);
  animation: dsh-am-slide-up 0.15s ease-out;
}
@keyframes dsh-am-slide-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Section header — DSH slash-menu sectionTitle */
.dsh-am-section {
  min-height: 26px;
  padding: 6px 10px 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--dsw-alias-label-tertiary, rgba(127,127,127,.55));
  user-select: none;
}

/* Menu item — DSH slash-menu item */
.dsh-am-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary, inherit);
  font-family: inherit;
}
.dsh-am-item:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08));
}
.dsh-am-item-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-label-secondary, rgba(127,127,127,.65));
}
.dsh-am-item-label {
  flex: 1;
  min-width: 0;
}
.dsh-am-item-desc {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, rgba(127,127,127,.45));
  margin-top: 1px;
}
`;

  function injectStyle() {
    if (typeof document === "undefined") return;
    // data-plugin lets the HMR chain remove this tag on rebuild
    if (document.querySelector('style[data-plugin="dsh-add-file"]')) return;
    const tag = document.createElement("style");
    tag.id = "dsh-am-style";
    tag.dataset.plugin = "dsh-add-file";
    tag.textContent = STYLE_CSS;
    document.head.appendChild(tag);
  }

  // ── Attachment logic (dsh >= 0.1.3 native pipeline) ──
  // Active session id + input actions come from the conversation slot
  // injection (same pattern dsh-files 0.5.1 uses).
  let activeSessionId = null;
  let activeInputActions = null;

  // Attach files through the native attachment pipeline:
  // conversation.createDrafts() starts the real upload (session-isolated
  // storage, retries, upload status UI) and inputActions.addAttachments()
  // stages the drafts into the composer. Replaces the removed /api/upload.
  function attachFiles(files) {
    const sessionId = activeSessionId;
    if (!sessionId || sessionId === "anonymous") throw new Error("没有活动会话");
    const actx = _ctx.sessions.scope(sessionId);
    const conversation = actx.get("conversation");
    if (conversation === void 0 || typeof conversation.createDrafts !== "function") {
      throw new Error("原生附件管线不可用（需要 dsh >= 0.1.3）");
    }
    const drafts = conversation.createDrafts(sessionId, files);
    const ids = drafts.map((draft) => draft.id);
    if (ids.length > 0 && activeInputActions !== null) {
      const added = activeInputActions.addAttachments(ids);
      if (!added) throw new Error("输入区繁忙，请稍后重试");
    }
    return drafts;
  }

  // ── Menu state ──
  let menuOpen = false;
  let menuEl = null;
  let menuAnchor = null;

  function closeMenu() {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
    menuOpen = false;
    menuAnchor = null;
  }

  function toggleMenu(anchor) {
    if (menuOpen) {
      closeMenu();
      return;
    }
    menuAnchor = anchor;

    // Group items by section
    const sections = {};
    for (const item of MENU_ITEMS) {
      const sec = item.section || "添加";
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(item);
    }

    // Build dropdown
    const dropdown = document.createElement("div");
    dropdown.className = "dsh-am-dropdown";

    for (const [sectionName, items] of Object.entries(sections)) {
      const header = document.createElement("div");
      header.className = "dsh-am-section";
      header.textContent = sectionName;
      dropdown.appendChild(header);

      for (const item of items) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dsh-am-item";
        btn.innerHTML = `
          <span class="dsh-am-item-icon">${item.icon}</span>
          <span class="dsh-am-item-label">
            ${item.label}
            ${item.description ? `<div class="dsh-am-item-desc">${item.description}</div>` : ""}
          </span>
        `;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeMenu();
          item.action?.();
        });
        dropdown.appendChild(btn);
      }
    }

    // Portal to <body> with fixed coords from the anchor rect — React
    // reconciliation of the composer never touches body-level nodes, so
    // the menu survives any re-render while open.
    const r = anchor.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const estWidth = 260; // min-width
    dropdown.style.left = Math.min(Math.max(0, r.left), Math.max(0, vw - estWidth)) + "px";
    dropdown.style.bottom = Math.round(window.innerHeight - r.top + 8) + "px";
    document.body.appendChild(dropdown);
    menuEl = dropdown;
    menuOpen = true;

    // Close on outside click
    setTimeout(() => {
      document.addEventListener("click", onOutsideClick, { once: true, capture: true });
    }, 0);
  }

  function onOutsideClick(e) {
    // Ignore clicks inside the anchor (the trigger button): the trigger's
    // own onClick toggles the menu; only close for genuinely outside clicks.
    if (menuEl && menuAnchor && !menuEl.contains(e.target) && !menuAnchor.contains(e.target)) {
      closeMenu();
    }
  }

  // ── Menu item actions ──
  // Open DSH's native "/" command palette — same call the built-in + used
  // (inputTriggers.sessionOf(session ctx).toggleSource("command", hit)).
  // hit shape follows dsh >= 0.1.3 (adds `quoted`).
  function openCommandMenu() {
    const sessionId = activeSessionId;
    if (!sessionId || sessionId === "anonymous") return;
    try {
      const actx = _ctx.sessions.scope(sessionId);
      const controller = _ctx.inputTriggers.sessionOf(actx);
      const conversation = actx.get("conversation");
      const state = conversation?.input?.for(actx)?.state?.getSnapshot();
      const draft = state?.draft ?? "";
      const span = {
        start: draft.length,
        end: draft.length,
        draftRev: state?.draftRev,
      };
      controller.toggleSource("command", {
        trigger: "/",
        query: "",
        quoted: false,
        position: draft.trim() === "" ? "leading" : "inline",
        span,
      });
    } catch (err) {
      console.error("[dsh-add-file] open command menu failed:", err);
    }
  }

  function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.style.display = "none";
    document.body.appendChild(input);
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      input.remove();
      if (files.length === 0) return;
      try {
        const drafts = attachFiles(files);
        console.info(`[dsh-add-file] attached ${drafts.length} file(s)`);
      } catch (err) {
        console.error("[dsh-add-file] attach failed:", err);
      }
    };
    input.click();
  }

  // ── React component: trigger button ──
  function MenuTrigger(props) {
    const anchorRef = React.useRef(null);
    // The slot injection provides the active session id; the session
    // standard-kit provides inputActions (dsh-files 0.5.1 same pattern).
    if (props && props.sessionId) activeSessionId = props.sessionId;
    if (props && props.inputActions) activeInputActions = props.inputActions;

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (anchorRef.current) toggleMenu(anchorRef.current);
    };

    return React.createElement(
      "div",
      { className: "dsh-am-menu-anchor", ref: anchorRef },
      React.createElement(
        "button",
        {
          type: "button",
          className: "dsh-am-trigger",
          "aria-label": "添加",
          "aria-haspopup": "menu",
          onMouseDown: (e) => e.preventDefault(), // keep textarea focus
          onClick: handleClick,
        },
        React.createElement(
          "svg",
          { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none" },
          React.createElement("path", {
            d: "M8 3v10M3 8h10",
            stroke: "currentColor",
            "stroke-width": "1.8",
            "stroke-linecap": "round",
          })
        )
      )
    );
  }

  // ── Plugin lifecycle ──
  function apply(ctx) {
    _ctx = ctx;
    injectStyle();

    // Register item actions (extensible: add more action handlers here)
    MENU_ITEMS.forEach((item) => {
      if (item.id === "file") {
        item.action = openFilePicker;
      } else if (item.id === "command") {
        item.action = openCommandMenu;
      }
      // Future: else if (item.id === "image") { item.action = openImagePicker; }
    });

    // The native "+" button is hidden by the injected CSS rule
    // ([data-composer-seat] button[aria-haspopup="listbox"]),
    // and the left-tools outlet is pulled to the far left via flex order.

    // Replace the "+" button via conversation.input.left slot
    ctx.slots.inject(
      "conversation.input.left",
      () =>
        ctx.slots.register(
          {
            name: "conversation.input.left",
            id: "dsh-add-file-menu",
            order: -1, // render before other left items
            inject: (sessionId) => ({ sessionId }),
          },
          MenuTrigger
        )
    );
  }

  // ── Exports ──
  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      apply,
      MENU_ITEMS,
      inject: ["slots", "sessions", "inputTriggers"],
    };
  }
})();
    return module.exports;
  }
});
