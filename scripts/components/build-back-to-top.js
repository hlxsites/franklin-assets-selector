// eslint-disable-next-line import/no-cycle
import { fetchLanguagePlaceholders, getPathDetails, getEDSLink } from '../scripts.js';
import { createElementWithClasses } from '../utils/dom.js';
import { getMainContentId, toCamelCase } from '../utils/common-utils.js';
import { EVENT_NAME, triggerBackToTopClickEvent } from '../martech/datalayer.js';

function getLastWordFromURL(url) {
  const parts = url.split('-');
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function getLocalisedBackToTopLabel(placeholder) {
  const { langRegion } = getPathDetails();
  const lastWordFromURL = getLastWordFromURL(getEDSLink(document.location.pathname));
  const localisedBackToTop = toCamelCase(
    `global-back-to-top-${langRegion}-${lastWordFromURL}`,
  );
  return placeholder[localisedBackToTop];
}

export default async function buildBackToTopLink() {
  const placeholder = await fetchLanguagePlaceholders();
  if (!placeholder || Object.keys(placeholder).length === 0) return null;
  const { globalBackToTop } = placeholder;
  const localisedBackToTopLabel = getLocalisedBackToTopLabel(placeholder);
  let backToTopLabel = globalBackToTop;
  if (localisedBackToTopLabel) {
    backToTopLabel = localisedBackToTopLabel;
  }

  const anchorElement = createElementWithClasses('a', 'back-to-top-link');
  const mainContentId = getMainContentId();
  anchorElement.href = `#${mainContentId}`;
  anchorElement.classList.add('body-02');
  anchorElement.textContent = backToTopLabel;

  anchorElement.setAttribute('data-wae-event', EVENT_NAME.BACK_TO_TOP_CLICK);
  anchorElement.addEventListener('click', triggerBackToTopClickEvent);
  return anchorElement;
}
