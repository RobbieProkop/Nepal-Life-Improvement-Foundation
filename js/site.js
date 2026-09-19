/**
 * Shared behaviour for all three redesign mockups.
 *
 * Every feature is opt-in via a data attribute and no-ops when the relevant
 * element is absent, so all three designs can load this one file even though
 * they use different subsets of it.
 *
 * Deliberately not here: smooth anchor scrolling. `scroll-behavior: smooth`
 * plus `scroll-padding-top` in reset.css does the same job natively, respects
 * reduced-motion for free, and does not break the back button the way
 * preventDefault-based scrolling does.
 */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ---------------------------------------------------------------- nav ---
     A real <button> with aria-expanded, rather than the hidden-checkbox
     trick the current site uses. Screen readers announce the state, and
     Escape closes the panel.
     ---------------------------------------------------------------------- */
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navPanel = document.querySelector('[data-nav-panel]');

  if (navToggle && navPanel) {
    const setNavOpen = (open) => {
      navToggle.setAttribute('aria-expanded', String(open));
      navPanel.toggleAttribute('data-open', open);
      document.documentElement.classList.toggle('is-nav-open', open);
    };

    navToggle.addEventListener('click', () => {
      setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a destination so the panel does not cover it.
    navPanel.addEventListener('click', (event) => {
      if (event.target.closest('a')) setNavOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setNavOpen(false);
    });

    // A panel left open while resizing to desktop would strand the page in a
    // locked-scroll state, since the overlay only exists on small screens.
    window.matchMedia('(min-width: 60rem)').addEventListener('change', (event) => {
      if (event.matches) setNavOpen(false);
    });
  }

  /* ------------------------------------------------------- scroll state ---
     Drives the masthead's condensed appearance and, where present, the
     reading-progress rail.
     ---------------------------------------------------------------------- */
  const masthead = document.querySelector('[data-masthead]');
  const progress = document.querySelector('[data-progress]');

  if (masthead || progress) {
    let queued = false;

    const readScroll = () => {
      queued = false;

      if (masthead) {
        masthead.classList.toggle('is-scrolled', window.scrollY > 24);
      }

      if (progress) {
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
        progress.style.setProperty('--progress', Math.min(ratio, 1).toFixed(4));
      }
    };

    // rAF-throttled: the listener itself only sets a flag, so fast scrolling
    // cannot queue up more layout reads than the browser can paint.
    window.addEventListener(
      'scroll',
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(readScroll);
      },
      { passive: true }
    );

    readScroll();
  }

  /* ------------------------------------------------------------ reveal ---
     reset.css hides [data-reveal] only under .js, so a JS failure leaves
     the content visible rather than blank.
     ---------------------------------------------------------------------- */
  const revealables = document.querySelectorAll('[data-reveal]');

  if (revealables.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealables.forEach((element) => element.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
      );

      revealables.forEach((element) => observer.observe(element));
    }
  }

  /* ----------------------------------------------------- scroll region ---
     A horizontally scrolling container needs to be focusable, or keyboard
     users cannot reach the content that is off to the side. But it should
     only be a tab stop while it actually overflows — in the light theme the
     project ledger is a plain list and an extra tab stop there is just noise.
     ---------------------------------------------------------------------- */
  const scrollRegions = document.querySelectorAll('[data-scroll-region]');

  if (scrollRegions.length) {
    const syncScrollRegions = () => {
      scrollRegions.forEach((element) => {
        // The one-pixel allowance absorbs sub-pixel rounding at fractional
        // zoom levels, which would otherwise report a false overflow.
        if (element.scrollWidth > element.clientWidth + 1) {
          element.setAttribute('tabindex', '0');
        } else {
          element.removeAttribute('tabindex');
        }
      });
    };

    syncScrollRegions();
    window.addEventListener('resize', syncScrollRegions, { passive: true });
    document.addEventListener('themechange', syncScrollRegions);
  }

  /* ----------------------------------------------------- section index ---
     Highlights the current section in a sticky rail. Purely decorative, so
     it is skipped entirely when the rail is not in the markup.
     ---------------------------------------------------------------------- */
  const indexLinks = Array.from(
    document.querySelectorAll('[data-section-index] a')
  );

  if (indexLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(
      indexLinks
        .map((link) => {
          const target = document.querySelector(link.getAttribute('href'));
          return target ? [target, link] : null;
        })
        .filter(Boolean)
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = byId.get(entry.target);
          if (!link) return;
          link.classList.toggle('is-current', entry.isIntersecting);
          if (entry.isIntersecting) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );

    byId.forEach((_link, target) => observer.observe(target));
  }
})();
