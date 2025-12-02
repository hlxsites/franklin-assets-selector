import { loadFragment } from '../fragment/fragment.js';
import { createElementWithClasses, getTextContent } from '../../scripts/utils/dom.js';
import { addClassToSelectors, isAuthorMode } from '../../scripts/utils/common-utils.js';
import { getPathDetails } from '../../scripts/scripts.js';
import {
  EVENT_NAME,
  LINK_TYPE,
  MENU_TYPE,
  triggerLinkClickEvent,
  triggerMenuClickEvent,
  triggerReturnHomeClickEvent,
} from '../../scripts/martech/datalayer.js';
import buildBackToTopLink from '../../scripts/components/build-back-to-top.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */

export default async function decorate(block) {
  // Simplified path - just use /footer directly
  let footerPath = '/footer';
  
  // For production sites with language folders, use:
  // let footerPath = `/${getPathDetails().langRegion}/fragments/footer`;
  // if (isAuthorMode() && footerPath.startsWith('/language-masters')) {
  //   footerPath = `/${getPathDetails().langRegion}/en/fragments/footer`;
  // }
  
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = createElementWithClasses('div', 'footer-container');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const classes = [
    'backtotop',
    'brand',
    'navigation',
    'social',
    'links',
    'copyright',
    'acknowledgement',
  ];

  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (!section) return;
    // Remove empty acknowledgement section
    if (c === 'acknowledgement' && getTextContent(section) === '') {
      section.remove();
      return;
    }
    // Add class if section exists
    section.classList.add(`footer-${c}`);
  });

  // Handle back to top functionality
  const footerBackToTop = footer.querySelector('[data-show-back-to-link="true"]');
  if (footerBackToTop) {
    const backToTopLink = await buildBackToTopLink();
    if (backToTopLink) {
      footerBackToTop.appendChild(backToTopLink);
    }
  }

  // create a variable for acknowledgement and move acknowledgement section out of footer
  const acknowledgement = footer.querySelector('.footer-acknowledgement');

  if (acknowledgement) {
    const acknowledgementContainer = createElementWithClasses(
      'div',
      'footer-acknowledgement-container',
    );
    acknowledgementContainer.append(acknowledgement);
    block.append(acknowledgementContainer);
  }

  block.prepend(footer);

  const footerAckWrapper = block.querySelector(
    '.footer-acknowledgement .default-content-wrapper',
  );
  footerAckWrapper?.classList.add('caption');

  // Process social elements
  const footerSocialElements = footer?.querySelectorAll('.footer-social li');
  footerSocialElements?.forEach((li) => {
    const span = li.querySelector('span');
    const img = li.querySelector('img');
    const anchor = li.querySelector('a');

    if (span && img && anchor) {
      img.setAttribute('alt', span.innerHTML.trim());

      const linkText = anchor.getAttribute('aria-label') || getTextContent(anchor);
      anchor.setAttribute('data-wae-event', EVENT_NAME.LINK_CLICK);
      anchor.setAttribute('data-wae-link', linkText);
      anchor.setAttribute('data-wae-module', MENU_TYPE.FOOTER);
      anchor.removeAttribute('data-wae-menu-type');
      anchor.removeAttribute('data-wae-menu-level');
      anchor.addEventListener('click', () =>
        triggerLinkClickEvent(
          linkText,
          anchor.href,
          LINK_TYPE.EXTERNAL,
          MENU_TYPE.FOOTER,
          '',
        ),
      );

      img.removeAttribute('aria-hidden');
      span.remove();
    }
  });

  // Process footer menu and link elements
  const footerMenuElements = footer?.querySelectorAll(
    '.footer-navigation li, .footer-links li',
  );
  footerMenuElements?.forEach((li) => {
    const anchor = li.querySelector('a');
    if (anchor) {
      anchor.setAttribute('data-wae-event', EVENT_NAME.MENU_CLICK);
      anchor.setAttribute('data-wae-menu-type', MENU_TYPE.FOOTER);
      anchor.setAttribute('data-wae-menu-level', '1');
      anchor.addEventListener('click', () =>
        triggerMenuClickEvent(
          anchor?.href,
          anchor?.querySelector('span')?.textContent,
          anchor?.getAttribute('data-wae-menu-type'),
          anchor?.getAttribute('data-wae-menu-level'),
        ),
      );
    }
  });

  // Process logo
  const brandLink = footer?.querySelector('.footer-brand a');
  if (brandLink) {
    brandLink.setAttribute('data-wae-event', EVENT_NAME.RETURN_HOME_CLICK);
    brandLink.addEventListener('click', () =>
      triggerReturnHomeClickEvent(brandLink.href),
    );
  }

  const footerNavigation = block.querySelector('.footer-navigation');

  if (footerNavigation) {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'footer');
    const wrappers = footerNavigation.querySelectorAll('.menu-wrapper');
    wrappers.forEach((wrapper) => {
      nav.appendChild(wrapper);
    });
    footerNavigation.appendChild(nav);
  }

  const footerSocialTitle = footer.querySelector(
    '.footer-social .menu-heading-container .menu-heading',
  );

  if (footerSocialTitle) footerSocialTitle.className = 'title-04';

  // Add caption class to footer elements
  addClassToSelectors(footer, ['.footer-links li a', '.footer-copyright div'], 'caption');
}
