// ==UserScript==
// @name         Scriptura Bloomerang Tools
// @namespace    https://scriptura.org/
// @version      2.0.0
// @description  Loads the current Scriptura Bloomerang Tools logic fresh on every page. This file itself should rarely need to change or be reinstalled; see bloomerang-tools.core.js for the actual behavior.
// @match        https://*.bloomerang.co/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.meta.js
// @downloadURL  https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.user.js
// ==/UserScript==

(function () {
  'use strict';

  // The RAW GitHub URL of the actual tool logic. Fetched fresh (cache-busted)
  // on every page load and run here, the same way tooltips.json is already
  // fetched fresh. This is what lets every future fix or feature update
  // instantly for everyone, on every browser, with nothing to reinstall:
  // this loader is the only thing that is ever actually "installed," and it
  // should rarely if ever need to change itself.
  const CORE_URL =
    'https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.core.js';

  fetch(CORE_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (code) {
      // Indirect eval runs the fetched code in the global scope of this
      // page, inside the same isolated userscript context this loader
      // itself already runs in. It is not injected as a <script> tag into
      // the page's own DOM, so the page's Content Security Policy governing
      // its own inline scripts does not apply here, the same reason a
      // normal @grant none userscript already runs fine on CSP-locked pages.
      (0, eval)(code);
    })
    .catch(function (err) {
      // Fail quietly rather than break the page. Nothing will run on this
      // page until this is fixed, but Bloomerang itself is unaffected.
      console.error('[Scriptura] Could not load Bloomerang Tools from GitHub.', err);
    });
})();
