/* eslint-disable indent */
import {
  promoteFirstChildIfExists,
  createElementWithClasses,
  isRenderableElement,
  getTextContent,
  isFieldTrue,
} from '../../scripts/utils/dom.js';
import { attachTestId } from '../../scripts/utils/common-utils.js';
import decorateDynamicMediaImage from '../../scripts/utils/dam-open-apis.js';

// Smart crop presets for responsive images

const SMART_CROPS = {
  sm: { crop: 'generic-3x2' },
  md: { crop: 'generic-2x1' },
  lg: { crop: 'generic-16x5', layout: 'hero' },
};

export default function decorate(block) {
  const [
    heroImageEl,
    excludeHeroAltText,
    imgCaptionEl,
    heroTitleEl,
    introTextEl,
    logoImageEl,
    excludeLogoAltText,
  ] = [...block.children];

  const heroImage = decorateDynamicMediaImage(heroImageEl, {
    smartCrops: SMART_CROPS,
    excludeAltText: isFieldTrue(excludeHeroAltText),
  });
  const logoImage = decorateDynamicMediaImage(logoImageEl, {
    excludeAltText: isFieldTrue(excludeLogoAltText),
  });

  // Step 2: Promote child nodes and extract meaningful elements
  const title = promoteFirstChildIfExists(heroTitleEl)?.querySelector('h1');
  const caption = promoteFirstChildIfExists(imgCaptionEl);
  const withCaption = caption && caption.textContent.trim() !== '';
  const intro = promoteFirstChildIfExists(introTextEl);
  const withIntro = intro && intro.textContent.trim() !== '';

  // Step 3: Create figcaption element if caption exists
  let figCaption = null;
  if (withCaption) {
    figCaption = createElementWithClasses('figcaption', 'caption', 'hero-caption');
    figCaption.innerHTML = caption.innerHTML;
  }
  intro?.classList.add('intro');

  // testing requirement - set attribute 'data-testid' for elements
  const elementsToAttach = [
    { parentEl: heroImage, elementName: 'image' },
    { parentEl: logoImage, elementName: 'logo' },
    { parentEl: figCaption, elementName: 'caption' },
    { parentEl: title, elementName: 'heading' },
    { parentEl: intro, elementName: 'intro' },
  ];
  elementsToAttach.forEach(({ parentEl, elementName }) => {
    attachTestId({ block, parentEl, elementName });
  });

  // Step 5: Create layout wrappers
  const imageAndContentWrapper = createElementWithClasses(
    'div',
    'hero-image-and-content',
  );
  const imageWrapper = createElementWithClasses('div', 'image');
  const logoWrapper = createElementWithClasses('div', 'logo');
  const contentWrapper = createElementWithClasses('div', 'hero-content-container');
  const maxContentWrapper = createElementWithClasses('div', 'hero-content');

  // Create new figure element to wrap the image and content
  const figureWrapper = document.createElement('figure');

  // Step 6: Append renderable image/logo
  if (isRenderableElement(heroImage)) imageWrapper.append(heroImage);
  if (isRenderableElement(logoImage)) {
    logoWrapper.append(logoImage);
  }

  // Step 7: Compose content
  const heroImageSection = [imageWrapper].filter(isRenderableElement);
  const heroTextSection = [figCaption, intro].filter(isRenderableElement);

  block.classList.toggle('no-hero-image', heroImageSection.length === 0);

  if (heroTextSection.length > 0) {
    maxContentWrapper.append(...heroTextSection);
    contentWrapper.append(maxContentWrapper);
  }

  if (isRenderableElement(logoWrapper)) {
    contentWrapper.append(logoWrapper);
  }

  // Step 8: Append image and content wrappers
  block.textContent = '';
  if (title) block.append(title);

  block.append(imageAndContentWrapper);

  if (heroImageSection.length > 0) {
    if (withCaption) {
      figureWrapper.append(heroImageSection[0]);
      figureWrapper.append(figCaption);
      imageAndContentWrapper.append(figureWrapper);
      block.classList.add('with-caption');
    } else {
      imageAndContentWrapper.append(heroImageSection[0]);
    }
  }

  if (heroTextSection.length > 0 && withIntro) {
    block.classList.add('with-intro');
  }

  if (contentWrapper && getTextContent(contentWrapper)) {
    imageAndContentWrapper.append(contentWrapper);
  } else {
    block.classList.add('no-content');
  }
}
