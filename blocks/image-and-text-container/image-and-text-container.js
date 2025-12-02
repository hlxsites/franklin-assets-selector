/* eslint-disable brace-style */
import {
  getTextContent,
  createElementWithClasses,
  isFieldTrue,
} from '../../scripts/utils/dom.js';
import decorateDynamicMediaImage from '../../scripts/utils/dam-open-apis.js';
import { EVENT_NAME, triggerBlockCardClick } from '../../scripts/martech/datalayer.js';
import {
  attachTestId,
  getTitleStyleClass,
  isExternalLink,
} from '../../scripts/utils/common-utils.js';

// Title classes for different layouts based on tags with or without offset section
const titleClasses = {
  'layout-3-col': {
    default: { h2: 'display-03' },
  },
  'layout-4-col': {
    default: { h2: 'title-01', h3: 'title-01' },
  },
};

/*
 * Apply styles for the config option - Image Alignment
 */
function getImageAlignmentClasses(blockStyles, index) {
  const classes = [];

  // Option: All Left Aligned
  if (blockStyles.includes('all-left-aligned')) {
    classes.push('image-left');
  }

  // Option: All Right Aligned
  else if (blockStyles.includes('all-right-aligned')) {
    classes.push('image-right');
  }

  // Option: Alternate Left Aligned
  else if (blockStyles.includes('alternate-left-aligned')) {
    classes.push(index % 2 === 0 ? 'image-left' : 'image-right');
  }

  // Option: Alternate Right Aligned
  else {
    classes.push(index % 2 === 0 ? 'image-right' : 'image-left');
  }

  return classes;
}

/*
 * Apply extra classes to the items for styling
 */
function getExtraClassesForItem(numOfColumns, numOfItems, itemIndex, blockStyles) {
  const classes = [];

  // Layout - 1 Column
  if (numOfColumns === 1) {
    if (itemIndex === 0 && blockStyles.includes('first-article-highlighted')) {
      classes.push('highlighted');
    }
    classes.push(...getImageAlignmentClasses(blockStyles, itemIndex));
  }

  // Last Item
  if (itemIndex === numOfItems - 1) {
    classes.push('last-item');
  }
  return classes;
}

function attachTestIdToElements(block) {
  const elementsToAttach = [
    { selector: '.imagetext-title', elementName: 'heading' },
    { selector: '.imagetext-heading-container', elementName: 'heading-container' },
    { selector: '.imagetext-category', elementName: 'category' },
    { selector: '.imagetext-content-container', elementName: 'content-container' },
    { selector: '.imagetext-badge', elementName: 'badge' },
    { selector: '.imagetext-image-container', elementName: 'image-container' },
    { selector: '.imagetext-image-container picture', elementName: 'image' },
    { selector: '.imagetext-caption', elementName: 'caption' },
    { selector: '.imagetext-intro-text', elementName: 'intro' },
    { selector: '.imagetext-body-text', elementName: 'body' },
    { selector: '.imagetext-links-container', elementName: 'links-container' },
    { selector: '.imagetext-links-container a', elementName: 'link' },
  ];

  elementsToAttach.forEach(({ selector, elementName }) => {
    attachTestId({ block, selector, elementName });
  });
}

/*
 * Decorate Image and Text Item
 */
async function decorateItem(parentBlock, block, layoutClass, classes = []) {
  const [
    image,
    hideAltText,
    caption,
    badge,
    category,
    title,
    introText,
    bodyText,
    ctas,
    campaignCode,
  ] = block.children;

  const smartCrops = classes.includes('highlighted')
    ? { all: { crop: 'generic-4x5', layout: layoutClass } }
    : { all: { crop: 'generic-3x2', layout: layoutClass } };

  const pictureEl = decorateDynamicMediaImage(image, {
    smartCrops,
    excludeAltText: isFieldTrue(hideAltText),
  });

  // Apply extra classes to text elements
  const titleEle = title?.querySelector('h2, h3, h4');
  if (titleEle) {
    const titleClass = getTitleStyleClass(parentBlock, titleEle.tagName, titleClasses);
    titleEle.classList.add('imagetext-title');
    if (titleClass) titleEle.classList.add(titleClass);
  }

  introText?.classList.add('imagetext-intro-text', 'intro');
  bodyText?.classList.add('imagetext-body-text', 'body-01');

  // Reset DOM
  block.classList.add('image-and-text', ...(classes || []));

  // Build DOM
  const getHeadingContainerHTML = () => {
    const categoryContent = getTextContent(category);
    const titleContent = getTextContent(title);

    if (!categoryContent && !titleContent) return '';
    return `<div class="imagetext-heading-container">
        ${categoryContent ? ` <span class="imagetext-category caption">${categoryContent}</span>` : ''}
        ${titleContent ? title.innerHTML : ''}
      </div>`;
  };

  // Links
  const buildLinkElements = () => {
    const anchors = ctas.querySelectorAll('a');
    const linksContainer = createElementWithClasses(
      'div',
      'imagetext-links-container',
      'body-01',
    );

    anchors.forEach((anchor) => {
      // Get link text and URL
      anchor.classList.add('standalone');

      // Check if link is external
      const isExternal = isExternalLink(anchor.href);

      if (isExternal) {
        anchor.classList.add('standalone--external');
      }
      anchor.setAttribute('data-wae-event', EVENT_NAME.BLOCK_CARD_CLICK);
      anchor.setAttribute('data-wae-block-type', 'image_and_text');
      anchor.setAttribute('data-wae-card-title', getTextContent(title));
      anchor.setAttribute('data-wae-internal-campaign-id', getTextContent(campaignCode));

      anchor.addEventListener('click', () =>
        triggerBlockCardClick(
          'image_and_text',
          getTextContent(title),
          anchor.href,
          anchor.textContent || anchor.innerText,
          getTextContent(campaignCode),
        ),
      );
      linksContainer.appendChild(anchor);
    });
    return linksContainer.outerHTML;
  };

  const hasCaption = getTextContent(caption);
  const hasBadge = getTextContent(badge);
  const headingContainerHTML = getHeadingContainerHTML();
  const introHTML = getTextContent(introText) ? introText.outerHTML : '';
  const bodyHTML = getTextContent(bodyText) ? bodyText.outerHTML : '';
  const badgeHTML = hasBadge
    ? `<div class="imagetext-badge"><span>${hasBadge}</span></div>`
    : '';
  const captionHTML = hasCaption
    ? `<figcaption class="imagetext-caption caption">${hasCaption}</figcaption>`
    : '';

  const linksHTML = getTextContent(ctas) ? buildLinkElements(ctas) : '';

  const contentContainer = `
    <div class="imagetext-content-container${hasCaption ? ' with-caption' : ''}">
      ${headingContainerHTML}
      ${introHTML}
      ${bodyHTML}
      ${linksHTML}
    </div>
  `;

  const imageContainer = pictureEl ? `
    <figure class="imagetext-image-container">
      ${badgeHTML}
      ${pictureEl.outerHTML}
      ${captionHTML}
    </figure>
  ` : '';

  block.innerHTML = classes.includes('image-right')
    ? `${contentContainer}${imageContainer}`
    : `${imageContainer}${contentContainer}`;

  return block;
}

/*
 * Main function to decorate the Image and Text Container
 */
export default async function decorateContainer(block) {
  const blockStyles = [];

  const imageAndTextItems = [];
  let numOfColumns = 1;
  let layoutClass = null;

  // Get styles from single row items
  [...block.children].forEach((containerItem) => {
    if (containerItem.children.length === 1) {
      const textContent = containerItem.textContent.trim();
      if (textContent) {
        // Add the column/layout class to block
        block.classList.add(textContent);
        blockStyles.push(textContent);

        // Get the selected column option to check if it's stacked
        const layoutStyleMatch = textContent.match(/^layout-([0-9])-col$/);
        if (layoutStyleMatch) {
          layoutClass = textContent;
          numOfColumns = parseInt(layoutStyleMatch[1], 10);
        }
      }
      return;
    }
    // If not a single row item, it's an Image and Text Block
    imageAndTextItems.push(containerItem);
  });

  // If more items > columns, apply the stacked class
  if (imageAndTextItems.length > numOfColumns) {
    blockStyles.push('stacked');
  }

  // Decorate Image and Text Blocks
  const imageTextWrapper = createElementWithClasses('div', 'image-text-wrapper');

  const listItems = await Promise.all(
    imageAndTextItems.map(async (imageAndTextItem, index) => {
      const classes = getExtraClassesForItem(
        numOfColumns,
        imageAndTextItems.length,
        index,
        blockStyles,
      );

      return decorateItem(block, imageAndTextItem, layoutClass, classes);
    }),
  );

  imageTextWrapper.append(...listItems);
  // Clearing the block's content
  block.innerHTML = '';
  // Append the generated content to the block
  block.append(imageTextWrapper);
  // Add extra style and layout classes as needed
  block.classList.add(...blockStyles);

  // testing requirement - set attribute 'data-testid' for elements
  attachTestIdToElements(block);
}
