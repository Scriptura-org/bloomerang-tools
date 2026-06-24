// ==UserScript==
// @name         Scriptura Bloomerang Tools
// @namespace    https://scriptura.org/
// @version      1.4.2
// @description  Adds help icon popups to Bloomerang field labels
// @match        https://*.bloomerang.co/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.user.js
// @downloadURL  https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.user.js
// ==/UserScript==

(function () {
  'use strict';

  // =========================================================================
  // SETTINGS
  // =========================================================================

  // The RAW GitHub URL of config/tooltips.json. If this file cannot be loaded,
  // the built-in fallback list below is used instead.
  const RAW_CONFIG_URL =
    'https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/config/tooltips.json';

  // Built-in help text used when the remote file cannot be loaded.
  // The keys must match the field label text exactly as it appears on screen
  // (capital letters and spacing do not matter, a trailing colon is ignored).
  const FALLBACK_TOOLTIPS = {
    'Relationship Stage':
      'Shows where this person is in the donor journey. Identify and Qualify are early stages. Cultivate, Solicit, and Steward are active stages. Paused means there is no current activity with this person.',
    'Outreach Approach':
      'Tells staff how to contact this person right now. This is a work instruction, not the same as Relationship Stage. Use Future Revisit when you plan to contact them later at a set time. Use On Hold when contact is paused with no set date.',
    'Affinity Interests':
      'The topics this person cares about. Use this to decide what content and stories to send them.',
    'Contribution Type':
      'How this person takes part. For example: money, time, talent, or prayer. Choosing Prayer here means the person prays for the ministry. To mark someone whose main role is prayer, use Constituency Role and choose Prayer Warrior.',
    'Constituency Role':
      'Who this person is in the ministry. For example: Lay Supporter, Prayer Warrior, or Business Leader / Strategist. This describes their identity, not what they give.'
  };

  // Elements that are likely to hold a field label. If icons do not appear,
  // run scripturaListLabels() in the browser console to see the real label
  // text, then adjust this list if needed.
  const LABEL_SELECTORS = 'label, .control-label, .field-label, .form-label, dt, th';

  // ----- Layout settings ---------------------------------------------------
  // The order sections appear in, by their heading text. Any section not
  // listed keeps its place after the listed ones.
  const PROFILE_COLUMN_ORDER = [
    'Donor Relationship',
    'Biographical Details'
  ];
  const EDIT_SECTION_ORDER = [
    'Edit Profile',
    'Donor Relationship',
    'Biographical Details',
    'Communication Preferences'
  ];
  // On the profile, every titled section starts collapsed EXCEPT these. Click
  // a collapsed heading to expand it. Any section added later collapses by
  // default, so this list is the only thing to maintain.
  const KEEP_EXPANDED = [
    'Donor Relationship',
    'Biographical Details',
    'Basic Info',
    'Addresses',
    'Emails',
    'Phone Numbers',
    'Communication Preferences',
    'Groups',
    'Giving Level'
  ];

  // =========================================================================
  // STYLES
  // =========================================================================

  const style = document.createElement('style');
  style.textContent = `
    /* The box is larger than the visible circle so it is an easy target to
       hover or tap. The circle inside the SVG stays small, so only the box
       grows, not the icon you see. */
    .scriptura-help-icon {
      display: inline-block;
      width: 1.4em;
      height: 1.4em;
      margin-left: 0.1em;
      vertical-align: middle;
      color: #298BAB;          /* Bloomerang link blue, resting */
      cursor: help;
      user-select: none;
      transition: color 0.12s ease;
    }
    .scriptura-help-icon svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .scriptura-help-icon:hover,
    .scriptura-help-icon:focus {
      color: #146078;          /* Bloomerang link blue, hover */
      outline: none;
    }
    .scriptura-help-popup {
      position: absolute;
      max-width: 320px;
      padding: 10px 12px;
      background: #3c4858;     /* dark slate, close to Bloomerang's heading color */
      color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.28);
      font-size: 13px;
      line-height: 1.45;
      z-index: 2147483647;
      display: none;
      pointer-events: none;
    }
    /* Small arrow joining the popup to its icon. */
    .scriptura-help-caret {
      position: absolute;
      width: 0;
      height: 0;
      margin-left: -7px;
    }
    .scriptura-help-popup.below .scriptura-help-caret {
      top: -7px;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-bottom: 7px solid #3c4858;
    }
    .scriptura-help-popup.above .scriptura-help-caret {
      bottom: -7px;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 7px solid #3c4858;
    }
    /* The field idea sits on top; the per-option lines sit below it. */
    .scriptura-help-idea {
      margin: 0;
    }
    .scriptura-help-options {
      margin-top: 9px;
      padding-top: 9px;
      border-top: 1px solid rgba(255, 255, 255, 0.18);
    }
    .scriptura-help-opt {
      margin-top: 7px;
      padding-left: 12px;
      text-indent: -12px;   /* bold name flush left, wrapped lines tuck under it */
    }
    .scriptura-help-opt:first-child {
      margin-top: 0;
    }
    .scriptura-help-opt b {
      font-weight: 700;
      color: #fff;
    }
    .scriptura-help-desc {
      color: #c7cdd4;        /* muted, so the bold option names scan easily */
    }
    /* Collapse chevron on a section heading. */
    .scriptura-chevron {
      display: inline-block;
      width: 0;
      height: 0;
      margin-left: 8px;
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 6px solid currentColor;
      vertical-align: middle;
      opacity: 0.6;
      transition: transform 0.15s ease;
    }
    .scriptura-card-expanded .scriptura-chevron {
      transform: rotate(90deg);
    }
  `;
  document.head.appendChild(style);

  // =========================================================================
  // POPUP (one shared element, reused for every icon)
  // =========================================================================

  const popup = document.createElement('div');
  popup.className = 'scriptura-help-popup';
  const caret = document.createElement('div');
  caret.className = 'scriptura-help-caret';
  const popupBody = document.createElement('div');
  popup.appendChild(caret);
  popup.appendChild(popupBody);
  document.body.appendChild(popup);

  let activeIcon = null;
  let showTimer = null;
  let hideTimer = null;

  function clearTimers() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  }

  // Wait a moment before opening so the popup does not flash while the mouse
  // is just passing over an icon.
  function scheduleShow(icon) {
    clearTimers();
    showTimer = setTimeout(function () { showPopup(icon); }, 180);
  }

  // Wait a moment before closing so a quick mouse wobble does not hide it.
  function scheduleHide() {
    clearTimers();
    hideTimer = setTimeout(hidePopup, 140);
  }

  // Builds the popup contents from a payload object. A payload is either
  // { plain: "..." } for simple text, or { idea: "...", options: [{name, desc}] }
  // for the structured field-and-options form.
  function renderPayload(payload) {
    while (popupBody.firstChild) popupBody.removeChild(popupBody.firstChild);

    if (payload.plain) {
      popupBody.appendChild(document.createTextNode(payload.plain));
      return;
    }

    if (payload.idea) {
      const idea = document.createElement('div');
      idea.className = 'scriptura-help-idea';
      idea.textContent = payload.idea;
      popupBody.appendChild(idea);
    }

    if (payload.options && payload.options.length) {
      const list = document.createElement('div');
      list.className = 'scriptura-help-options';
      payload.options.forEach(function (opt) {
        const row = document.createElement('div');
        row.className = 'scriptura-help-opt';
        const name = document.createElement('b');
        name.textContent = opt.name;
        const desc = document.createElement('span');
        desc.className = 'scriptura-help-desc';
        desc.textContent = ': ' + opt.desc;
        row.appendChild(name);
        row.appendChild(desc);
        list.appendChild(row);
      });
      popupBody.appendChild(list);
    }
  }

  function showPopup(icon) {
    clearTimers();
    var payload = {};
    try { payload = JSON.parse(icon.dataset.tipPayload || '{}'); } catch (e) {}
    renderPayload(payload);
    popup.style.display = 'block';
    activeIcon = icon;
    positionPopup(icon);
  }

  function hidePopup() {
    clearTimers();
    popup.style.display = 'none';
    activeIcon = null;
  }

  function positionPopup(icon) {
    const r = icon.getBoundingClientRect();
    const pr = popup.getBoundingClientRect();
    const iconCenterX = r.left + window.scrollX + (r.width / 2);

    // Default to showing below the icon, with the popup roughly centered on it.
    let below = true;
    let top = r.bottom + window.scrollY + 9;
    let left = iconCenterX - (pr.width / 2);

    // Flip above the icon if there is not enough room below.
    if (r.bottom + pr.height + 18 > window.innerHeight) {
      below = false;
      top = r.top + window.scrollY - pr.height - 9;
    }

    // Keep the popup inside the window horizontally.
    const maxLeft = window.scrollX + window.innerWidth - pr.width - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < window.scrollX + 8) left = window.scrollX + 8;

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
    popup.classList.toggle('below', below);
    popup.classList.toggle('above', !below);

    // Point the caret at the icon, but keep it inside the popup edges.
    let caretLeft = iconCenterX - left;
    caretLeft = Math.max(14, Math.min(pr.width - 14, caretLeft));
    caret.style.left = caretLeft + 'px';
  }

  // Close a click-opened popup when the page scrolls or the user clicks away.
  window.addEventListener('scroll', hidePopup, true);
  document.addEventListener('click', function (e) {
    if (activeIcon && !e.target.classList.contains('scriptura-help-icon')) {
      hidePopup();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hidePopup();
  });

  // =========================================================================
  // ICON INJECTION
  // =========================================================================

  // Builds a crisp circled "?" as an SVG. The circle is drawn small inside a
  // padded viewBox, so the visible icon stays compact while the surrounding
  // box (set in CSS) gives a generous area to hover or tap. It uses
  // currentColor so the color change applies to both the ring and the mark.
  function buildHelpSvg() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 28 28');

    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', '14');
    ring.setAttribute('cy', '14');
    ring.setAttribute('r', '9');
    ring.setAttribute('fill', '#fff');
    ring.setAttribute('stroke', 'currentColor');
    ring.setAttribute('stroke-width', '2');

    const mark = document.createElementNS(NS, 'text');
    mark.setAttribute('x', '14');
    mark.setAttribute('y', '14.5');
    mark.setAttribute('text-anchor', 'middle');
    mark.setAttribute('dominant-baseline', 'central');
    mark.setAttribute('font-size', '13');
    mark.setAttribute('font-weight', '700');
    mark.setAttribute('font-family', 'Arial, sans-serif');
    mark.setAttribute('fill', 'currentColor');
    mark.textContent = '?';

    svg.appendChild(ring);
    svg.appendChild(mark);
    return svg;
  }

  function makeIcon(payload) {
    const icon = document.createElement('span');
    icon.className = 'scriptura-help-icon';
    icon.appendChild(buildHelpSvg());
    icon.dataset.tipPayload = JSON.stringify(payload);
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    const label = payload.idea || payload.plain || 'Field help';
    icon.setAttribute('aria-label', 'Help: ' + label);

    icon.addEventListener('mouseenter', function () { scheduleShow(icon); });
    icon.addEventListener('mouseleave', scheduleHide);
    icon.addEventListener('focus', function () { showPopup(icon); });
    icon.addEventListener('blur', hidePopup);

    // Click toggle so the popup works on touch screens too.
    icon.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (activeIcon === icon && popup.style.display === 'block') {
        hidePopup();
      } else {
        showPopup(icon);
      }
    });
    icon.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showPopup(icon);
      }
    });

    return icon;
  }

  // =========================================================================
  // MATCHING
  // =========================================================================

  let tooltips = null;
  let lookup = {};

  function norm(s) {
    return (s || '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[:*]+$/, '')
      .toLowerCase();
  }

  function buildLookup(obj) {
    const map = {};
    Object.keys(obj).forEach(function (k) {
      // Keys beginning with "_" are notes/headers in the config, not fields.
      if (k.charAt(0) === '_') return;
      map[norm(k)] = obj[k];
    });
    return map;
  }

  // 'edit'    = the field edit screen   (path ends with /Profile/Edit)
  // 'profile' = the read-only profile   (path ends with /Profile)
  // 'other'   = any other tab           (Summary, Timeline, Relationships, ...)
  function getPageMode() {
    var path = location.pathname.replace(/\/+$/, '').toLowerCase();
    if (/\/profile\/edit$/.test(path)) return 'edit';
    if (/\/profile$/.test(path)) return 'profile';
    return 'other';
  }

  // On the profile, find the value(s) currently set for a field by reading the
  // field row's text and removing the label, then splitting into entries.
  function detectSelectedValues(labelNode) {
    const labelText = labelNode.textContent || '';
    let row = labelNode.parentElement;
    let valueText = '';
    for (var i = 0; i < 2 && row; i++) {
      var full = row.innerText || row.textContent || '';
      var stripped = full.replace(labelText, ' ').trim();
      if (stripped) { valueText = full; break; }
      row = row.parentElement;
    }
    return valueText
      .split(/[\n,]+/)
      .map(function (s) { return norm(s); })
      .filter(Boolean);
  }

  function optionsToArray(optionsObj) {
    return Object.keys(optionsObj).map(function (k) {
      return { name: k, desc: optionsObj[k] };
    });
  }

  // Turns a field's config into what the popup should show on this page.
  // Returns null when there is nothing to show.
  function resolvePayload(cfg, labelNode) {
    if (cfg == null) return null;

    // Plain string: same text everywhere.
    if (typeof cfg === 'string') {
      return cfg.trim() ? { plain: cfg } : null;
    }

    const mode = getPageMode();

    // Back-compatible: explicit per-mode strings.
    if (typeof cfg.view === 'string' || typeof cfg.edit === 'string') {
      const t = mode === 'edit' ? (cfg.edit || cfg.view) : (cfg.view || cfg.edit);
      return t ? { plain: t } : null;
    }

    // Structured: a field idea plus a set of options.
    const idea = cfg.idea || '';
    const allOptions = optionsToArray(cfg.options || {});
    let options;
    if (mode === 'edit') {
      // Editing: explain every option so staff can choose.
      options = allOptions;
    } else {
      // Viewing: explain only the value(s) actually set on this record.
      const selected = detectSelectedValues(labelNode);
      options = allOptions.filter(function (o) {
        return selected.indexOf(norm(o.name)) !== -1;
      });
    }

    if (!idea && options.length === 0) return null;
    return { idea: idea, options: options };
  }

  function scan() {
    if (!tooltips) return;
    const nodes = document.querySelectorAll(LABEL_SELECTORS);
    nodes.forEach(function (node) {
      if (node.dataset.scripturaTip) return;
      const cfg = lookup[norm(node.textContent)];
      if (!cfg) return;
      const payload = resolvePayload(cfg, node);
      if (!payload) return;
      node.dataset.scripturaTip = '1';
      node.appendChild(makeIcon(payload));
    });
  }

  // =========================================================================
  // CONSOLE HELPERS (run these in the browser console while on a Bloomerang page)
  // =========================================================================

  // Lists every label-like text on the current page so you know which keys to
  // put in tooltips.json.
  window.scripturaListLabels = function () {
    const seen = {};
    document.querySelectorAll(LABEL_SELECTORS).forEach(function (n) {
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (t && t.length < 80) seen[t] = true;
    });
    const list = Object.keys(seen).sort();
    console.log('[Scriptura] ' + list.length + ' label(s) found:');
    list.forEach(function (t) { console.log('  ' + t); });
    return list;
  };

  // Forces an immediate re-scan (useful after editing tooltips in console).
  window.scripturaRescan = scan;

  // Reports what the layout engine can find on this page. Run in the console
  // if sections are not moving or collapsing as expected.
  window.scripturaLayoutCheck = function () {
    console.log('[Scriptura] page mode:', getPageMode());
    var names = PROFILE_COLUMN_ORDER.concat(EDIT_SECTION_ORDER).concat(KEEP_EXPANDED);
    var seen = {};
    names.forEach(function (n) {
      if (seen[n]) return;
      seen[n] = 1;
      var h = findHeadingByText(n);
      console.log('  ' + n + ': ' + (h ? ('found <' + h.tagName.toLowerCase() + '>') : 'NOT FOUND'));
    });
    var col = findColumnFor(PROFILE_COLUMN_ORDER);
    console.log('  profile column: ' + (col
      ? ('<' + col.tagName.toLowerCase() + '> with ' + col.children.length + ' direct children')
      : 'NOT RESOLVED'));
  };

  // On a profile page, reports each select field: the value(s) detected and
  // whether they matched an option in the config. Anything under "NOT matched"
  // means the config label and the Bloomerang label differ and need aligning.
  window.scripturaCheck = function () {
    if (!tooltips) { console.log('[Scriptura] tooltips not loaded yet'); return; }
    console.log('[Scriptura] page mode:', getPageMode());
    document.querySelectorAll(LABEL_SELECTORS).forEach(function (node) {
      const cfg = lookup[norm(node.textContent)];
      if (!cfg || typeof cfg !== 'object' || !cfg.options) return;
      const selected = detectSelectedValues(node);
      const keys = Object.keys(cfg.options).map(norm);
      const matched = selected.filter(function (s) { return keys.indexOf(s) !== -1; });
      const missed = selected.filter(function (s) { return keys.indexOf(s) === -1; });
      console.log('Field:', (node.textContent || '').trim());
      console.log('  detected:', selected);
      console.log('  matched :', matched);
      if (missed.length) console.log('  NOT matched:', missed);
    });
  };

  // =========================================================================
  // LAYOUT (reorder sections, collapse low-traffic sections)
  // These operate on Bloomerang's own rendered page, so they are written to
  // fail safe: if a section cannot be found, they do nothing.
  // =========================================================================

  // Find a section heading by its text, whatever element it happens to be.
  // Picks the smallest matching element (fewest child elements) so we land on
  // the heading itself, not a wrapper that also contains the section body.
  function findHeadingByText(text) {
    const target = norm(text);
    const nodes = document.querySelectorAll('header,h1,h2,h3,h4,h5,h6,div,span,p,a,strong,b');
    var best = null;
    var bestKids = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var raw = el.textContent;
      if (!raw || raw.length > 80) continue;        // skip big containers fast
      if ((norm(raw) === target || norm(ownText(el)) === target) &&
          el.childElementCount < bestKids) {
        best = el;
        bestKids = el.childElementCount;
      }
    }
    return best;
  }

  function commonAncestor(a, b) {
    const seen = new Set();
    let x = a;
    while (x) { seen.add(x); x = x.parentElement; }
    let y = b;
    while (y) { if (seen.has(y)) return y; y = y.parentElement; }
    return null;
  }

  function directChildContaining(parent, node) {
    let el = node;
    while (el && el.parentElement !== parent) el = el.parentElement;
    return (el && el.parentElement === parent) ? el : null;
  }

  function findColumnFor(order) {
    const headings = order.map(findHeadingByText).filter(Boolean);
    if (headings.length < 2) return null;
    return commonAncestor(headings[0], headings[1]);
  }

  // Move the listed sections to the front of their shared container, in order.
  // Idempotent: if they are already in place it changes nothing, which keeps
  // it from reacting to its own DOM moves.
  function reorderInColumn(column, order) {
    const cards = order
      .map(findHeadingByText)
      .filter(Boolean)
      .map(function (h) { return directChildContaining(column, h); })
      .filter(Boolean);
    if (cards.length < 2) return;

    const kids = Array.prototype.slice.call(column.children);
    var already = true;
    for (var i = 0; i < cards.length; i++) {
      if (kids[i] !== cards[i]) { already = false; break; }
    }
    if (already) return;

    for (var j = cards.length - 1; j >= 0; j--) {
      column.insertBefore(cards[j], column.firstChild);
    }
  }

  function reorderSections(order) {
    const column = findColumnFor(order);
    if (column) reorderInColumn(column, order);
  }

  // Work out which elements make up a section's collapsible body. Prefer the
  // heading's following siblings; if the heading stands alone in a header
  // block, use that block's following siblings instead.
  // Returns only an element's own text, ignoring text inside child elements
  // (so a heading with an embedded button still yields just the title).
  function ownText(el) {
    var t = '';
    el.childNodes.forEach(function (n) { if (n.nodeType === 3) t += n.textContent; });
    return t.trim();
  }

  // Make a card collapsible, starting collapsed. headerEl stays visible and is
  // the click target; everything in bodyEls hides when collapsed.
  function setupCollapse(card, headerEl, bodyEls) {
    if (card.dataset.scripturaCollapsible) return;
    card.dataset.scripturaCollapsible = '1';

    headerEl.style.cursor = 'pointer';
    headerEl.setAttribute('role', 'button');
    headerEl.setAttribute('tabindex', '0');

    const chevron = document.createElement('span');
    chevron.className = 'scriptura-chevron';
    headerEl.appendChild(chevron);

    var collapsed = true;
    function render() {
      bodyEls.forEach(function (c) { c.style.display = collapsed ? 'none' : ''; });
      card.classList.toggle('scriptura-card-expanded', !collapsed);
      headerEl.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }
    function toggle() { collapsed = !collapsed; render(); }

    headerEl.addEventListener('click', toggle);
    headerEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    render();
  }

  // Collapse every titled profile section whose title is not in the keep list.
  function collapseAllExcept(keepList) {
    const keep = keepList.map(norm);
    document.querySelectorAll('.two-column section').forEach(function (sec) {
      if (sec.dataset.scripturaCollapsible) return;
      const header = Array.prototype.slice.call(sec.children).find(function (c) {
        return c.tagName === 'HEADER';
      });
      if (!header) return;
      const title = norm(ownText(header));
      if (!title || keep.indexOf(title) !== -1) return;
      const bodyEls = Array.prototype.slice.call(sec.children).filter(function (c) {
        return c !== header;
      });
      setupCollapse(sec, header, bodyEls);
    });
  }

  // The Giving Statements card has a different structure (its title is a <p>,
  // not a <header>), so it is collapsed on its own.
  function collapseTaxSummary() {
    const card = document.getElementById('tax-summary-card');
    if (!card || card.dataset.scripturaCollapsible) return;
    const content = card.querySelector('.card-content') || card;
    const title = content.querySelector('p');
    if (!title) return;
    const bodyEls = Array.prototype.slice.call(content.children).filter(function (c) {
      return c !== title;
    });
    setupCollapse(card, title, bodyEls);
  }

  function applyLayout() {
    const mode = getPageMode();
    if (mode === 'edit') {
      reorderSections(EDIT_SECTION_ORDER);
      return;
    }
    if (mode === 'profile') {
      reorderSections(PROFILE_COLUMN_ORDER);
      collapseAllExcept(KEEP_EXPANDED);
      collapseTaxSummary();
      return;
    }
    // Other tabs (Summary, Timeline, Relationships): leave the layout untouched.
  }

  // =========================================================================
  // STARTUP: load config, then watch the page for changes
  // =========================================================================

  function start(cfg) {
    tooltips = cfg;
    lookup = buildLookup(cfg);
    scan();
    applyLayout();

    let timer = null;
    const observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () { scan(); applyLayout(); }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  fetch(RAW_CONFIG_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (cfg) {
      console.log('[Scriptura] Loaded tooltips from GitHub.');
      start(cfg);
    })
    .catch(function (err) {
      console.warn('[Scriptura] Could not load remote tooltips, using fallback.', err);
      start(FALLBACK_TOOLTIPS);
    });
})();
