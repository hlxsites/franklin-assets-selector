import { createOptimizedPicture } from '../aem.js';
import { moveInstrumentation } from '../scripts.js';

/**
 * Optimizes images within a given element.
 * @param {HTMLElement} element - The element containing images to optimise.
 */
export default function optimizeImages(element) {
  element.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [
      { width: '750' },
    ]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
}
