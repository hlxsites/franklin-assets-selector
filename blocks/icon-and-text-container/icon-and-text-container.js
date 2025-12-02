/* eslint-disable no-unused-vars */
import { createElementWithClasses, getTextContent } from '../../scripts/utils/dom.js';
import {
  attachTestId,
  isStandaloneLink,
  getTitleStyleClass,
  isExternalLink,
} from '../../scripts/utils/common-utils.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

// Title classes for different layouts based on tags with or without offset section
const titleClasses = {
  'layout-1-col': {
    offset: { h2: 'display-03' },
  },
  'layout-2-col': {
    default: { h2: 'display-03' },
    offset: { h2: 'display-03' },
  },
  'layout-3-col': {
    default: { h2: 'display-03' },
  },
  'layout-4-col': {
    default: { h2: 'title-01', h3: 'title-01' },
  },
  'callout-border': {
    default: { h2: 'display-03', h4: 'display-03' },
  },
  'callout-no-border': {
    default: { h2: 'display-03', h4: 'display-03' },
  },
};

const LINK_CLICK_EVENT_NAME = 'block_card_click';

// DataLayer function to generate the data layer object
function generateDataLayer(link, linkText, blockTitle) {
  if (!link || !(link instanceof HTMLElement) || link.tagName !== 'A') {
    return;
  }

  // Get link URL
  const urlLink = link.getAttribute('href');

  // Create data layer object for tracking
  const dataLayerObject = {
    event: LINK_CLICK_EVENT_NAME,
    details: {
      block_type: 'icon-text',
      card_title: blockTitle,
      url: urlLink,
      cta_text: linkText,
    },
  };

  // Set data attributes for  tracking
  link.setAttribute('data-wae-event', LINK_CLICK_EVENT_NAME);
  link.setAttribute('data-wae-block-type', dataLayerObject.details.block_type);
  link.setAttribute('data-wae-card-title', dataLayerObject.details.card_title);

  // Add click event listener
  link.addEventListener('click', () => window.digitalDataLayer.push(dataLayerObject));
}

function decorateCalloutLayout(container, anchor, foundFirstLink) {
  if (foundFirstLink) {
    anchor.classList.add('caption');
  } else {
    anchor.classList.add('button', 'primary', 'arrow', 'hug-content', 'extra-large');
    container.classList.add('cta-link');
  }
  container.appendChild(anchor);
}

/**
 * Decorates a single icon-and-text item block.
 */
function decorateItem(parentBlock, block, classes = [], placeholder = {}) {
  const [icon, altText, hideAltText, container] = block.children;
  if (!icon || !container) return block;

  // Icon container
  const iconContainer = createElementWithClasses('div', 'icontext-icon-container');
  const imgEl = icon.querySelector('img');
  const iconText = getTextContent(icon).trim();
  
  // Check if there's an image or icon class text
  if (imgEl) {
    // If there's an image, use it
    if (getTextContent(hideAltText) !== 'true') {
      imgEl.alt = getTextContent(altText);
    }
    iconContainer.appendChild(imgEl);
  } else if (iconText) {
    // If it's text, create an img element pointing to the SVG file
    const iconImg = document.createElement('img');
    // Remove 'icon-' prefix if present and use as filename
    const iconName = iconText.replace(/^icon-/, '');
    iconImg.src = `/icons/${iconName}.svg`;
    iconImg.alt = '';
    iconImg.loading = 'lazy';
    iconContainer.appendChild(iconImg);
  }

  // Wrapper for content, and links
  const contentLinkWrapper = createElementWithClasses(
    'div',
    'icontext-contentlink-wrapper',
  );

  // Title element
  const title = container.querySelector('h2, h3, h4');
  if (title) {
    title.classList.add('icontext-heading');
    const titleClass = getTitleStyleClass(parentBlock, title.tagName, titleClasses);
    if (titleClass) title.classList.add(titleClass);
  }

  // Content container (holds title, description, bullets, links)
  const contentContainer = createElementWithClasses('div', 'icontext-content-container');
  if (title) contentContainer.appendChild(title);

  const isCallout =
    parentBlock.classList.contains('callout-border') ||
    parentBlock.classList.contains('callout-no-border');
  const linksOnlyContainer = isCallout
    ? createElementWithClasses('div', 'icontext-calloutlink-container')
    : null;
  const linksContainer = createElementWithClasses(
    'div',
    'icontext-links-container',
    'cta-link',
  );
  let foundFirstLink = false;

  [...container.children]
    .filter((el) => el !== title)
    .forEach((el) => {
      if (isStandaloneLink(el)) {
        const anchor = el.firstElementChild;
        anchor.classList.add('standalone', 'arrow');
        if (isCallout) {
          decorateCalloutLayout(
            foundFirstLink ? linksContainer : linksOnlyContainer,
            anchor,
            foundFirstLink,
          );
          foundFirstLink = true;
        } else {
          anchor.classList.add('body-01');
          linksContainer.appendChild(anchor);
        }
        // Check if link is external
        const isExternal = isExternalLink(anchor.href);
        if (isExternal) {
          anchor.classList.add('standalone--external');
          const spanEl = document.createElement('span');
          spanEl.classList.add('visually-hidden');
          spanEl.textContent = placeholder?.iconTextExternalLinkLabel;
          anchor.appendChild(spanEl);
        }
        generateDataLayer(anchor, anchor.textContent.trim(), title?.textContent?.trim());
      } else {
        el.classList.add('icontext-description');
        if (parentBlock.classList.contains('callout-border')) {
          el.classList.add('intro');
        }
        contentContainer.appendChild(el);
      }
    });

  if (linksContainer.children.length) {
    contentContainer.appendChild(linksContainer);
  }

  // Final assembly
  block.innerHTML = '';
  block.classList.add('icon-and-text', ...classes.filter(Boolean));
  if (iconContainer.hasChildNodes()) block.append(iconContainer);
  if (contentContainer.hasChildNodes()) contentLinkWrapper.append(contentContainer);
  if (linksOnlyContainer && linksOnlyContainer.hasChildNodes()) {
    contentLinkWrapper.append(linksOnlyContainer);
  }
  if (contentLinkWrapper.hasChildNodes()) block.append(contentLinkWrapper);

  return block;
}

function attachTestIdToElements(block) {
  const elementsToAttach = [
    { selector: '.icontext-item', elementName: 'item' },
    { selector: 'h2, h3, h4', elementName: 'heading' },
    { selector: '.icontext-icon-container', elementName: 'image-container' },
    { selector: '.icontext-icon-container img', elementName: 'image' },
    { selector: '.icontext-description', elementName: 'body-text' },
    { selector: '.icontext-links-container', elementName: 'links-container' },
    { selector: '.icontext-links-container a', elementName: 'link' },
  ];

  elementsToAttach.forEach(({ selector, elementName }) => {
    attachTestId({ block, selector, elementName });
  });
}

/**
 * Decorates the overall container and applies layout/alignment classes.
 */
export default async function decorateContainer(block) {
  const blockStyles = [];
  const iconTextItems = [];

  const placeholder = await fetchLanguagePlaceholders();
  if (!placeholder || Object.keys(placeholder).length === 0) {
    console.warn('unable to get placeholder');
  }

  [...block.children].forEach((child) => {
    const text = getTextContent(child).trim();
    if (child.children.length === 1 && text) {
      blockStyles.push(text.toLowerCase());
    } else {
      iconTextItems.push(child);
    }
  });

  block.innerHTML = '';
  block.classList.add('icon-and-text-container', ...blockStyles.filter(Boolean));

  iconTextItems.forEach((item) => {
    const wrapper = createElementWithClasses('div', 'icontext-item');
    wrapper.append(decorateItem(block, item, blockStyles, placeholder));
    block.append(wrapper);
  });

  // testing requirement - set attribute 'data-testid' for elements
  attachTestIdToElements(block);
}
