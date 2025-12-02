import { loadFragment } from '../../blocks/fragment/fragment.js';

/**
 * Picks data from tempDoc using pickers and appends as attributes to main.
 * @param {HTMLElement} main The main element to set attributes on
 * @param {HTMLElement} tempDoc The root node to query
 * @param {Array<{selector: string, attribute?: string, name?: string}>} pickers
 */
export function applyFragmentPickers(main, tempDoc, pickers) {
  if (!Array.isArray(pickers) || pickers.length === 0) return;
  pickers.forEach((picker) => {
    const key = picker.name || picker.selector;
    const el = tempDoc.querySelector(picker.selector);
    let value = null;
    if (el) {
      if (picker.attribute && picker.attribute !== 'textContent') {
        value = el.getAttribute(picker.attribute);
      } else {
        value = el.textContent;
      }
      if (value !== null) {
        main.setAttribute(key, value);
      }
    }
  });
}

/**
 * Enhanced loadFragment that supports pickers
 * @param {string} url The path to the fragment
 * @param {Array} pickers Array of picker objects
 * @returns {Promise<HTMLElement>} The processed fragment
 */
export async function loadFragmentWithPickers(url, pickers = []) {
  let path = url;

  if (window.hlx?.isExternalSite && window.hlx?.codeBasePath) {
    path = `${window.hlx.codeBasePath}${path}`;
  }

  const fragment = await loadFragment(path);
  if (fragment && pickers.length > 0) {
    const tempDoc = document.createElement('div');
    tempDoc.appendChild(fragment);
    applyFragmentPickers(fragment, tempDoc, pickers);
  }

  return fragment;
}
