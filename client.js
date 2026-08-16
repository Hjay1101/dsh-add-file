// dsh-files-css-fix — client-side CSS injection
// Provides fallback values for dsh-files dock CSS variables that may be
// missing when the composer is rendered outside the official root scope
// (e.g. with dsh-better-sidebar).
//
// This plugin does NOT modify dsh-files itself — it only adds a <style>
// tag that overrides dock layout when the variables are undefined.

(function () {
  "use strict";

  const STYLE_ID = "dsh-files-css-fix";
  const STYLE_CSS = `/* dsh-files-css-fix: fallback for missing composer variables */
.dsh-files-dock {
  width: 100% !important;
  max-width: 780px !important;
  margin: 0 auto 6px !important;
  padding: 0 8px !important;
  box-sizing: border-box !important;
}

/* Ensure the dock does not force text-align on parent textarea.
   The textarea (or its content wrapper) may inherit text-align from
   the dock's flex context — override to left. */
.dsh-files-dock ~ textarea,
.dsh-files-dock ~ [contenteditable],
.dsh-files-dock + textarea,
.dsh-files-dock + [contenteditable] {
  text-align: left !important;
}

/* Prevent the file card dock from pushing the textarea content area
   or causing text centering via width collapse. */
[data-slot="conversation.input.dock"] {
  width: 100% !important;
  max-width: 780px !important;
  margin: 0 auto 6px !important;
  padding: 0 8px !important;
  box-sizing: border-box !important;
}`;

  function injectStyle() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;

    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.dataset.plugin = "dsh-files-css-fix";
    tag.textContent = STYLE_CSS;
    document.head.appendChild(tag);
  }

  /**
   * DSH client plugin entry point.
   * Called by the DSH client runtime when this bundle is loaded.
   */
  function apply(_ctx) {
    injectStyle();
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = { apply };
  }
})();
