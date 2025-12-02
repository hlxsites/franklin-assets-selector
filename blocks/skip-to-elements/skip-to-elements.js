import { getMetadata } from '../../scripts/aem.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { createElementWithClasses } from '../../scripts/utils/dom.js';
import { getMainContentId } from '../../scripts/utils/common-utils.js';

async function getSkipToElements(template = '') {
  if (window.hlx?.skiptoelements === 'false') return null;

  const placeholder = await fetchLanguagePlaceholders();
  if (!placeholder || Object.keys(placeholder).length === 0) return null;

  const mainContentId = getMainContentId();
  const skipToData = [
    {
      anchorId: mainContentId,
      anchorText: placeholder.globalSkipToMainContent,
      anchorType: null,
    },
  ];

  const additionalSkipToElements = window.eds_config?.site?.skip_to_elements?.[template];
  if (Array.isArray(additionalSkipToElements)) {
    additionalSkipToElements.forEach(({ anchorId, placeholderId }) => {
      const anchorText = placeholder?.[placeholderId];
      const anchorTabExist =
        document.querySelector(`[data-tab-id='${anchorId}']`) !== null;
      const anchorSectionExist =
        document.querySelector(`[data-anchor-section-url='${anchorId}']`) !== null;
      if (anchorText && (anchorTabExist || anchorSectionExist)) {
        const anchorType = anchorSectionExist ? 'section' : null;
        skipToData.push({ anchorId, anchorText, anchorType });
      }
    });
  }

  return { skipToData, mainContentId };
}

function focusHeading(target) {
  target.scrollIntoView({ behavior: 'auto', block: 'start' });
  const heading = target.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return;
  setTimeout(() => {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    heading.addEventListener(
      'blur',
      () => {
        heading.removeAttribute('tabindex');
        document.documentElement.style.scrollBehavior = 'smooth';
      },
      { once: true },
    );
  }, 100);
}

export function buildSkipToElements(block, skipToData, mainContentId) {
  block.textContent = '';
  const container = createElementWithClasses('div', 'cta-link');

  if (mainContentId) {
    const main = document.querySelector('main');
    if (main) main.id = mainContentId;
  }

  skipToData.forEach(({ anchorId, anchorText, anchorType }) => {
    const skipToElementLink = createElementWithClasses(
      'a',
      'button',
      'tertiary',
      'skip-to-element',
    );
    skipToElementLink.href = `#${anchorId}`;
    skipToElementLink.textContent = anchorText;

    const target = document.querySelector(`[data-anchor-section-url='${anchorId}']`);
    if (anchorType === 'section' && target) {
      skipToElementLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.documentElement.style.scrollBehavior = 'auto';
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        focusHeading(target);
      });
    }

    container.appendChild(skipToElementLink);
  });

  block.appendChild(container);
}

export default async function decorate(block) {
  try {
    const result = await getSkipToElements(getMetadata('template'));
    if (!result) return;

    const { skipToData, mainContentId } = result;
    buildSkipToElements(block, skipToData, mainContentId);
  } catch (err) {
    console.error('Error building skip to elements:', err);
  }
}
