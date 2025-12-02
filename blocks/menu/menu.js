import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  createElementWithClasses,
  getMaskedIconElement,
  getTextContent,
  isMobileOrTabletScreen,
} from '../../scripts/utils/dom.js';
import {
  isCurrentUrl,
  formatStringAsId,
  attachTestId,
} from '../../scripts/utils/common-utils.js';

const mobileAccordionToggleClass = 'submenu-accordion-toggle';

function attachTestIdToElements(block) {
  const elementsToAttach = [
    { selector: '.menu-list', elementName: 'list' },
    { selector: '.menu-link', elementName: 'link' },
    { selector: '.menu-heading', elementName: 'heading' },
    { selector: '.menu-heading-container', elementName: 'heading-container' },
    { selector: '.menu-heading-accordion', elementName: 'accordion' },
    { selector: '.submenu-accordion-toggle', elementName: 'accordion-toggle' },
    { selector: '.mobile-nav-button', elementName: 'mobile-nav-button' },
  ];

  elementsToAttach.forEach(({ selector, elementName }) => {
    attachTestId({ block, selector, elementName });
  });
}

function getMenuListId(headingText, firstLinkEl) {
  const firstLink = firstLinkEl ? getTextContent(firstLinkEl.firstElementChild) : '';
  const firstLinkId = firstLink ? `-with-${formatStringAsId(firstLink)}` : '';
  return `menu-list-${formatStringAsId(headingText)}${firstLinkId}`;
}

export default function decorate(block) {
  const isAccordionMenu =
    block.classList.contains('icon') || block.classList.contains('horizontal');
  const ul = createElementWithClasses('ul', 'menu-list');

  const headingContainer = createElementWithClasses('div', 'menu-heading-container');

  const divs = Array.from(block.children);
  const links = divs.slice(1);

  if (divs.length > 0) {
    const headingText = divs[0].querySelector('p')?.textContent?.trim() || '';

    const menuListId = getMenuListId(headingText, links ? links[0] : '');
    ul.id = menuListId;

    const heading = createElementWithClasses('h3', 'menu-heading', 'body-02');
    heading.textContent = headingText;

    const accordionHeading = createElementWithClasses('h3', 'menu-heading-accordion');
    accordionHeading.innerHTML = `
      <button class="${mobileAccordionToggleClass} body-02" aria-expanded="false" aria-controls="${menuListId}">
        <span class="menu-accordion-label">${headingText}</span>
        <div class="mobile-nav-button">${getMaskedIconElement().outerHTML}</div>        
      </button>`;

    if (isMobileOrTabletScreen()) {
      heading.setAttribute('aria-hidden', 'true');
      accordionHeading.removeAttribute('aria-hidden');
    } else {
      accordionHeading.setAttribute('aria-hidden', 'true');
      heading.removeAttribute('aria-hidden');
    }

    if (headingText) headingContainer.append(heading);
    if (!isAccordionMenu) headingContainer.append(accordionHeading);

    const expandedClass = 'expanded';

    const openSubMenu = (menu) => {
      menu.classList.add(expandedClass);
      menu.querySelector(`.${mobileAccordionToggleClass}`).ariaExpanded = true;
    };

    const closeSubMenu = (menu) => {
      menu.classList.remove(expandedClass);
      menu.querySelector(`.${mobileAccordionToggleClass}`).ariaExpanded = false;
    };

    const accordionToggle = accordionHeading.querySelector(
      `.${mobileAccordionToggleClass}`,
    );
    accordionToggle?.addEventListener('click', () => {
      const shouldExpand = !block.classList.contains(expandedClass);
      if (shouldExpand) {
        openSubMenu(block);
        // Close all other sibling menus
        const menuWrappers = block?.parentNode?.parentNode?.childNodes;
        menuWrappers?.forEach((menuWrapper) => {
          const menuBlock = menuWrapper?.firstElementChild;
          if (menuBlock && menuBlock !== block) {
            closeSubMenu(menuBlock);
          }
        });
      } else {
        closeSubMenu(block);
      }
    });

    links.forEach((div) => {
      if (div.classList.contains('section-metadata')) return;
      const li = document.createElement('li');
      moveInstrumentation(div, li);

      const [titleEl, linkEl, iconEl] = [...div.children];
      const title = titleEl?.textContent.trim() || '';

      const spanElement = document.createElement('span');
      spanElement.textContent = title;

      const linkElement = linkEl.querySelector('a') ?? document.createElement('a');
      linkElement.classList.add('menu-link', 'body-02');
      linkElement.removeAttribute('title');

      if (isCurrentUrl(linkElement?.href)) {
        linkElement.setAttribute('aria-current', 'page');
      }

      linkElement.textContent = '';
      linkElement.append(spanElement);

      const iconHref = iconEl?.querySelector('img')?.src;
      const fileName = iconHref?.split('/').pop();

      if (iconHref) {
        // Get filename from icon path
        const newIconElement = document.createElement('img');
        newIconElement.src = `${window.hlx.codeBasePath}/icons/${fileName}`;
        newIconElement.alt = '';
        linkElement.prepend(newIconElement);
      }
      linkElement.classList.remove('button');

      linkElement.setAttribute('data-wae-event', 'menu_click');
      linkElement.setAttribute('data-wae-menu-type', 'header');
      linkElement.setAttribute('data-wae-menu-level', '2');

      li.appendChild(linkElement);
      div.innerHTML = '';
      ul.appendChild(li);
    });

    block.innerHTML = '';
    if (headingContainer.innerHTML.trim() !== '') block.appendChild(headingContainer);
    block.appendChild(ul);

    // testing requirement - set attribute 'data-testid' for elements
    attachTestIdToElements(block);
  }
}
