/**
 * Photo lightbox built on the native <dialog> element.
 *
 * Replaces jQuery 3.5.1 + lightbox2 (~90KB and two CDN dependencies) with
 * roughly 80 lines and no dependencies. Using showModal() means the browser
 * handles the hard accessibility parts for free: focus is trapped inside the
 * dialog, Escape closes it, the rest of the page is marked inert, and focus
 * returns to the thumbnail that opened it.
 *
 * Markup contract is unchanged from lightbox2, so it is a drop-in swap:
 *   <a href="full-size.jpg" data-lightbox="photos" data-title="Caption">
 *
 * Progressive enhancement: with JavaScript unavailable the anchors still work,
 * they just navigate straight to the image file.
 */
(() => {
  'use strict';

  const triggers = Array.from(document.querySelectorAll('a[data-lightbox]'));

  if (!triggers.length || typeof HTMLDialogElement !== 'function') return;

  // Group triggers by their data-lightbox name so previous/next only cycles
  // within one gallery, matching lightbox2's behaviour.
  const galleries = new Map();
  triggers.forEach((trigger) => {
    const name = trigger.dataset.lightbox;
    if (!galleries.has(name)) galleries.set(name, []);
    galleries.get(name).push(trigger);
  });

  const dialog = document.createElement('dialog');
  dialog.className = 'lb';
  dialog.setAttribute('aria-label', 'Photo gallery');

  // Static, author-controlled markup; no interpolation, so nothing to inject.
  dialog.innerHTML = `
    <div class="lb__stage">
      <figure class="lb__figure">
        <img class="lb__img" alt="">
        <figcaption class="lb__meta">
          <span class="lb__caption"></span>
          <span class="lb__count"></span>
        </figcaption>
      </figure>
    </div>
    <button class="lb__nav lb__nav--prev" type="button" aria-label="Previous photo"></button>
    <button class="lb__nav lb__nav--next" type="button" aria-label="Next photo"></button>
    <button class="lb__close" type="button" aria-label="Close gallery"></button>
  `;

  document.body.append(dialog);

  const image = dialog.querySelector('.lb__img');
  const caption = dialog.querySelector('.lb__caption');
  const counter = dialog.querySelector('.lb__count');
  const prevButton = dialog.querySelector('.lb__nav--prev');
  const nextButton = dialog.querySelector('.lb__nav--next');
  const closeButton = dialog.querySelector('.lb__close');

  let group = [];
  let index = 0;

  const show = (next) => {
    index = (next + group.length) % group.length;

    const trigger = group[index];
    const title = trigger.dataset.title || '';

    image.src = trigger.getAttribute('href');
    image.alt = title;
    caption.textContent = title;
    counter.textContent = `${index + 1} / ${group.length}`;

    const hasSiblings = group.length > 1;
    prevButton.hidden = !hasSiblings;
    nextButton.hidden = !hasSiblings;
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      group = galleries.get(trigger.dataset.lightbox);
      show(group.indexOf(trigger));
      dialog.showModal();
    });
  });

  prevButton.addEventListener('click', () => show(index - 1));
  nextButton.addEventListener('click', () => show(index + 1));
  closeButton.addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(event.key === 'ArrowLeft' ? index - 1 : index + 1);
  });

  // A click that lands on the dialog itself is a click on the backdrop area,
  // because every visible child sits inside .lb__stage.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Drop the full-size image once closed so a long gallery session does not
  // keep every photo decoded in memory.
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
  });
})();
