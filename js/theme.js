/**
 * Theme toggle.
 *
 * The initial theme is applied by a small inline script in the document head,
 * not here — it has to run before first paint or the page flashes the wrong
 * theme. This file only handles the toggle button and OS preference changes
 * after load, so it is safe to defer.
 *
 * Because this build changes layout as well as colour, switching themes moves
 * content around. The toggle therefore measures a reference element before the
 * swap and corrects the scroll offset afterwards, so the reader stays exactly
 * where they were instead of being thrown up or down the page.
 */
(() => {
  'use strict';

  // Must match the key used by the inline script in the document head.
  const STORAGE_KEY = 'nlif-theme';
  const THEMES = ['light', 'dark'];

  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');

  /**
   * localStorage throws rather than returning null in Safari's private mode
   * and whenever a user has blocked site data, so every access is guarded.
   * A failure here is not worth breaking the toggle over — the theme simply
   * stops persisting between page loads.
   */
  const readStored = () => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(value) ? value : null;
    } catch {
      return null;
    }
  };

  const writeStored = (theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Preference will not survive a reload. Not fatal. */
    }
  };

  const currentTheme = () =>
    root.dataset.theme === 'dark' ? 'dark' : 'light';

  const describeToggle = (theme) => {
    if (!toggle) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    const label = `Switch to ${next} theme`;
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  };

  /**
   * Picks the element closest to the top of the viewport. After the layout
   * changes we scroll by the difference in that element's position, which
   * keeps the reader's place far more reliably than restoring a raw pixel
   * offset would.
   */
  const findScrollAnchor = () => {
    const candidates = document.querySelectorAll('[data-anchor]');
    let closest = null;
    let smallestDistance = Infinity;

    candidates.forEach((element) => {
      const distance = Math.abs(element.getBoundingClientRect().top);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closest = element;
      }
    });

    return closest;
  };

  const applyTheme = (theme, { persist }) => {
    // Nothing to preserve at the very top of the page, and measuring there
    // would fight the hero's own layout change.
    const anchor = window.scrollY > 4 ? findScrollAnchor() : null;
    const before = anchor ? anchor.getBoundingClientRect().top : 0;

    root.classList.add('is-theme-switching');
    root.dataset.theme = theme;
    describeToggle(theme);

    if (persist) writeStored(theme);

    if (anchor) {
      // Read the new position after the browser has recalculated layout.
      requestAnimationFrame(() => {
        const after = anchor.getBoundingClientRect().top;
        if (after !== before) window.scrollBy(0, after - before);
      });
    }

    window.setTimeout(() => {
      root.classList.remove('is-theme-switching');
    }, 400);

    // Lets other scripts react without importing anything from this file.
    // site.js uses it to re-check which regions are horizontally scrollable,
    // since that changes with the layout.
    document.dispatchEvent(
      new CustomEvent('themechange', { detail: { theme } })
    );
  };

  if (toggle) {
    describeToggle(currentTheme());

    toggle.addEventListener('click', () => {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', {
        persist: true,
      });
    });
  }

  // Follow the operating system while the visitor has not chosen for
  // themselves. Once they press the toggle, their choice wins permanently.
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (event) => {
      if (readStored()) return;
      applyTheme(event.matches ? 'dark' : 'light', { persist: false });
    });
})();
