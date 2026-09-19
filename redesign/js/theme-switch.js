/**
 * Theme switch for the two standalone mockups.
 *
 * Field Journal and Ascent are separate documents, so switching theme here
 * means loading the other file rather than restyling this one. That keeps both
 * mockups exactly as they were designed, at the cost of a page load per
 * switch. unified.html is the version that swaps themes in place.
 *
 * Each page tells the script what it is via data attributes on the script tag:
 *
 *   <script src="js/theme-switch.js" data-theme="light" data-alternate="ascent.html"></script>
 *
 * Loaded without `defer` on purpose. The redirect below has to run before the
 * browser paints, or a visitor who prefers dark sees a flash of the light
 * document on the way to the dark one.
 */
(() => {
  'use strict';

  // Shared with js/theme.js and the inline head script in unified.html, so a
  // preference set on any build carries across all of them.
  const STORAGE_KEY = 'nlif-theme';
  const THEMES = ['light', 'dark'];

  const { theme, alternate } = document.currentScript.dataset;

  // A missing or misspelled attribute should do nothing rather than send the
  // reader somewhere arbitrary.
  if (!THEMES.includes(theme) || !alternate) return;

  const otherTheme = theme === 'light' ? 'dark' : 'light';

  /**
   * localStorage throws rather than returning null in Safari's private mode
   * and whenever a user has blocked site data, so every access is guarded.
   * A failure only costs persistence — the switch itself still works.
   */
  const readStored = () => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(value) ? value : null;
    } catch {
      return null;
    }
  };

  const writeStored = (value) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* Preference will not survive this navigation. Not fatal. */
    }
  };

  const goToAlternate = () => location.replace(alternate + location.hash);

  /* ------------------------------------------------- honour the preference ---
     `?pick` marks a deliberate request for this specific mockup — the
     comparison page links that way — so a saved preference must not drag the
     reader off to the other file. With no preference stored at all, nothing
     happens and the page renders as designed.
     -------------------------------------------------------------------------- */
  const isExplicitPick = new URLSearchParams(location.search).has('pick');

  if (!isExplicitPick && readStored() === otherTheme) {
    goToAlternate();
    return;
  }

  /* --------------------------------------------------------- the switch -----
     The button does not exist yet, since this script runs before the body is
     parsed, so the listener is delegated from the document rather than bound
     to the element.
     -------------------------------------------------------------------------- */
  document.addEventListener('click', (event) => {
    // Optional call guards against targets that are not elements.
    if (!event.target.closest?.('[data-theme-switch]')) return;

    writeStored(otherTheme);
    // replace() rather than assign(): the two files are one page as far as the
    // reader is concerned, so Back should leave the mockup entirely instead of
    // undoing the switch.
    goToAlternate();
  });
})();
