import { getTextContent } from '../../scripts/utils/dom.js';

const decorate = (block) => {
  if (!block) return;

  // Account for imageMimeType field from custom-asset
  const [iconCol, mimeTypeCol, altTextCol, urlCol] = block.children ?? [];
  
  // If using custom-asset, iconCol has image, mimeTypeCol is mimetype, altTextCol is alt, urlCol is link
  // If using regular reference, iconCol has image, urlCol is link (no mimetype)
  
  // Try to find the URL column (has <a> tag)
  const urlColumn = [...block.children].find(col => col.querySelector('a'));
  if (!urlColumn) return;
  
  const anchor = urlColumn.querySelector('a');
  const targetHref = anchor?.href ?? '#';
  const logoAltText = getTextContent(anchor) ?? '';

  const imgEl = iconCol?.querySelector('img');
  let imgMarkup = '';

  if (imgEl != null) {
    imgMarkup = `<span class="visually-hidden">${logoAltText}</span>${imgEl?.outerHTML}`;
  }

  block.innerHTML = `<a href="${targetHref}">${imgMarkup}</a>`;
};
export default decorate;
