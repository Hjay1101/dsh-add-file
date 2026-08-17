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
      id: "file",
      label: "文件",
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 1.5A1.5 1.5 0 015.5 0h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V14.5A1.5 1.5 0 0110 16H5.5A1.5 1.5 0 014 14.5v-13z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 8l2.5-2.5M8 8H5.5M8 8V11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      section: "添加",
      description: "上传并引用本地文件",
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

/* ── Menu anchor (wraps the + button) ── */
.dsh-am-menu-anchor {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

/* ── Trigger button ── */
.dsh-am-trigger {
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, rgba(127,127,127,.65));
  cursor: pointer;
  border-radius: 6px;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  transition: color 0.15s, background 0.15s;
}
.dsh-am-trigger:hover {
  color: var(--dsw-alias-label-primary, rgba(127,127,127,.88));
  background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08));
}

/* ── Dropdown panel ── */
.dsh-am-dropdown {
  position: fixed;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 240px;
  max-width: 360px;
  background: var(--dsw-alias-surface-1, #fff);
  border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.08));
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
  padding: 6px;
  z-index: 9999;
  font-family: var(--ds-font-family-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: 14px;
  color: var(--dsw-alias-label-primary, #1a1a1a);
  animation: dsh-am-slide-up 0.15s ease-out;
}
@keyframes dsh-am-slide-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Section header */
.dsh-am-section {
  padding: 8px 10px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-tertiary, rgba(127,127,127,.55));
  letter-spacing: 0.02em;
  user-select: none;
}

/* Menu item */
.dsh-am-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 14px;
  color: inherit;
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
    if (document.getElementById("dsh-am-style")) return;
    const tag = document.createElement("style");
    tag.id = "dsh-am-style";
    tag.textContent = STYLE_CSS;
    document.head.appendChild(tag);
  }

  // ── Upload logic ──
  function getSessionId() {
    const m = location.pathname.match(/\/session\/([^/]+)/);
    return m ? m[1] : "anonymous";
  }

  async function uploadFile(file) {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "x-file-name": encodeURIComponent(file.name),
        "x-session-id": getSessionId(),
      },
      body: file,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `上传失败 (${res.status})`);
    }
    return res.json();
  }

  function injectText(text) {
    // Try execCommand first (works with React controlled textarea)
    const ta = document.querySelector(
      'textarea[data-phase], textarea[placeholder], textarea'
    );
    if (ta) {
      ta.focus();
      if (document.execCommand("insertText", false, text)) return;
      // Fallback: set value + dispatch events
      const nativeSet = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      if (nativeSet) {
        nativeSet.call(ta, ta.value + text);
      } else {
        ta.value += text;
      }
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // ── Menu state ──
  let menuOpen = false;
  let menuEl = null;

  function closeMenu() {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
    menuOpen = false;
  }

  function toggleMenu(anchor) {
    if (menuOpen) {
      closeMenu();
      return;
    }

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

    anchor.appendChild(dropdown);
    menuEl = dropdown;
    menuOpen = true;

    // Close on outside click
    setTimeout(() => {
      document.addEventListener("click", onOutsideClick, { once: true, capture: true });
    }, 0);
  }

  function onOutsideClick(e) {
    if (menuEl && !menuEl.contains(e.target)) {
      closeMenu();
    }
  }

  // ── Menu item actions ──
  function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.style.display = "none";
    document.body.appendChild(input);
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      input.remove();
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          if (result?.path) injectText(result.path);
        } catch (err) {
          console.error("[dsh-add-file] upload failed:", err);
        }
      }
    };
    input.click();
  }

  // ── React component: trigger button ──
  function MenuTrigger() {
    const anchorRef = React.useRef(null);

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

    // Register file actions (extensible: add more action handlers here)
    MENU_ITEMS.forEach((item) => {
      if (item.id === "file") {
        item.action = openFilePicker;
      }
      // Future: else if (item.id === "image") { item.action = openImagePicker; }
    });

    // Hide the original "+" button (DSH's built-in command menu trigger)
    // Uses MutationObserver since the button may not exist yet at apply time
    function hideOriginalPlus() {
      const tools = document.querySelector('[data-slot="conversation.input"] .dsh-am-tools, [data-slot="conversation.input"] [class*="tools"]');
      if (!tools) return;
      const btns = tools.querySelectorAll("button");
      for (const btn of btns) {
        // The original + has aria-haspopup="listbox" and contains IconPlusOutline16
        if (btn.getAttribute("aria-haspopup") === "listbox") {
          btn.style.display = "none";
          return;
        }
      }
    }
    // Try immediately, then observe for late additions
    hideOriginalPlus();
    const mo = new MutationObserver(hideOriginalPlus);
    mo.observe(document.body, { childList: true, subtree: true });
    // Stop observing after 10s (enough time for DSH to render)
    setTimeout(() => mo.disconnect(), 10000);

    // Replace the "+" button via conversation.input.left slot
    ctx.slots.inject(
      "conversation.input.left",
      () =>
        ctx.slots.register(
          {
            name: "conversation.input.left",
            id: "dsh-add-file-menu",
            order: -1, // render before other left items
          },
          MenuTrigger
        )
    );
  }

  // ── Exports ──
  if (typeof module !== "undefined" && module !== null) {
    module.exports = { apply, MENU_ITEMS };
  }
})();
