import { isAuthorMode, stringFormat } from './common-utils.js';
import { isSvg } from './dom.js';
import { getMetadata } from '../aem.js';

const BREAKPOINTS = {
  sm: '0',
  md: '36rem',
  lg: '64rem',
};

const IMAGE_WIDTH = {
  sm: { default: 575 },
  md: { default: 1024, 'layout-2-col': 500 },
  lg: {
    default: 1280,
    'layout-2-col': 624,
    'layout-3-col': 406,
    'layout-4-col': 296,
    hero: 1510,
  },
};

// Append Qantas Image Version if pressent
function appendQantasImageVersion(url) {
  const qiv = getMetadata('qiv');
  if (qiv) {
    url?.searchParams?.set('qiv', qiv);
  }
}

const MEDIA_FORMAT = '({widthType}-width: {width})';

function buildDamUrl(imgSrc) {
  if (!imgSrc) throw new TypeError('buildDamUrl: imgSrc is required');
  if (window.location.hostname === 'localhost') return imgSrc;

  // Parse input URL
  const urlObj = new URL(imgSrc, window.location.origin);
  let path = urlObj.pathname;
  let { origin } = urlObj;
  const { dam = {} } = window.eds_config ?? {};
  const {
    useAkamai = false,
    domain: akamaiDomain = '',
    url: akamaiPath = '/dynamic-assets/',
    adobePrefix = '/adobe/',
  } = dam;

  // Removing 'renditions' from URL due to recent Adobe update
  if (path.includes('/renditions/')) {
    path = path.replace('/renditions/', '/');
  }

  if (path.includes('/original/as/')) {
    path = path.replace('/original/as/', '/as/');
  } else if (!path.includes('/as/')) {
    path = `${path.replace(/\/$/, '')}/as/-image.avif`;
  }

  if (!isAuthorMode() && useAkamai) {
    path = path.replace(adobePrefix, dam.url ?? akamaiPath);
    origin = akamaiDomain ?? '';
  }
  // Delete the assetname parameter as the asset name is part of the image url
  urlObj.searchParams?.delete('assetname');
  // Set default format to AVIF to match the default .avif extension
  urlObj.searchParams?.set('format', 'avif');
  // Append Qantas Image Version if pressent
  appendQantasImageVersion(urlObj);

  const imgUrl = `${origin}${path}${urlObj.search}`;
  return imgUrl;
}

function getAspectRatioFromCropName(cropName) {
  // Match the pattern: -widthxheight
  const match = cropName.match(/-(\d+)x(\d+)$/);
  if (match) {
    const [, width, height] = match.map(Number);
    return width / height;
  }

  return null;
}

function getImageSize(breakpoint, layout, cropName) {
  const widths = IMAGE_WIDTH[breakpoint];
  const width = widths[layout] || widths.default;

  const aspectRatio = getAspectRatioFromCropName(cropName);
  const height = Math.ceil(width / aspectRatio);
  return [width, height];
}

function processSourceUrl(url, crop, width, height, extension = 'avif') {
  const newUrl = new URL(url, window.location.origin);
  newUrl.pathname = newUrl.pathname.replace(/\.[a-zA-Z0-9]+$/, `.${extension}`);
  newUrl.searchParams.delete('assetname');
  // Don't use crop parameter - just use width and height for DM OpenAPI
  // Smart crops need to be pre-configured in DM, so we'll rely on width/height only
  newUrl.searchParams.set('width', width);
  newUrl.searchParams.set('height', height);
  newUrl.searchParams.set('format', extension);
  // Append Qantas Image Version if present
  appendQantasImageVersion(newUrl);
  return newUrl.toString();
}

function addSourceTagToPicture(options, breakpoint, damUrl, picture) {
  const { crop, layout } = options;
  let widthType = 'min';
  let mediaWidth = BREAKPOINTS[breakpoint];

  if (breakpoint === 'sm') {
    widthType = 'max';
    mediaWidth = `${(parseFloat(BREAKPOINTS.md) - 0.001).toFixed(3)}rem`;
  }

  const [width, height] = getImageSize(breakpoint, layout, crop);

  // AVIF (optional best format) and WebP as fallback
  ['image/avif', 'image/webp'].forEach((type) => {
    const source = document.createElement('source');
    const srcset = processSourceUrl(damUrl, crop, width, height, type.split('/')[1]);
    source.setAttribute('srcset', srcset);
    source.setAttribute(
      'media',
      stringFormat(MEDIA_FORMAT, { widthType, width: mediaWidth }),
    );
    source.setAttribute('data-sm-key', `${crop}-${width}-${height}`);
    source.setAttribute('type', type);
    picture.append(source);
  });
}

/**
 * Decorate a Dynamic Media image field into a \<picture\> tag.
 *
 * @param {HTMLElement} image - The image field to convert into a \<picture\> tag.
 *
 * @param {Object} [options] - Optional configuration for rendering.
 *
 * @param {Object} [options.smartCrops] -
 * Defines which smart crop to use per breakpoint (`sm`, `md`, `lg`, or `all`).
 *   - Use the `all` key to apply the same crop configuration to all breakpoints.
 *   - Each value supports the following properties:
 *   - `crop`: e.g. `'generic-3x2'`, `'generic-2x1'`, `'generic-16x5'`
 *   - `layout`: e.g. `'layout-2-col'`, `'layout-3-col'`, `'layout-4-col'`, `'hero'`.
 * By default it'll be set to `'default'`, which fills the container width.
 *
 * Image size will be automatically calculated based on the provided smart crop configurations.
 *
 * @param {boolean} [options.excludeAltText] - If true, exclude alt text from the image.
 * @param {boolean} [options.eager] - If true, loads the image eagerly.
 *
 * @returns {HTMLPictureElement} A \<picture\> element with the applied configurations.
 */

export const createDMImageUrl = (repositoryId, assetId) => {
  if (repositoryId && assetId) {
    return `https://${repositoryId}/adobe/assets/${assetId}`;
  }
  return '';
};

export default function decorateDynamicMediaImage(image, options = {}) {
  const img = image ? image.querySelector('img')?.cloneNode(true) : null;
  if (!img || !img.src) return '';

  const { smartCrops, excludeAltText, eager } = options;
  const picture = document.createElement('picture');

  // Replace default dynamic media URL with DAM URL
  const damUrl = buildDamUrl(img.src);
  img.src = damUrl;

  // Clear alt text if image is decorative

  if (excludeAltText) {
    img.setAttribute('alt', '');
  }

  if (!eager) {
    img.setAttribute('loading', 'lazy');
  }

  // If the image is an SVG and Img alt is empty, set aria-hidden to true
  if (isSvg(img)) {
    const imgAlt = img.getAttribute('alt');

    // if empty alt, set aria-hidden to true
    if (!imgAlt || imgAlt.trim() === '') {
      img.setAttribute('aria-hidden', 'true');
    }
  }

  if (smartCrops) {
    ['lg', 'md', 'sm'].forEach((breakpoint) => {
      // Breakpoint specific aspect ratio
      let smartCropOption = smartCrops[breakpoint];

      // Use the same aspect ratio for all breakpoints
      if (smartCrops.all) {
        smartCropOption = smartCrops.all;
      }

      // Add the largest image size to the <img> tag as fallback
      if (breakpoint === 'lg') {
        const [width, height] = getImageSize(
          breakpoint,
          smartCropOption.layout,
          smartCropOption.crop,
        );

        img.setAttribute('width', width);
        img.setAttribute('height', height);
      }

      addSourceTagToPicture(smartCropOption, breakpoint, damUrl, picture);
    });
  }

  picture.append(img);
  return picture;
}

export function createDynamicMediaImageFromUrl(imageSrc, options = {}) {
  if (!imageSrc) return null;
  const { alt = '', smartCrops, excludeAltText = false } = options;

  const src = buildDamUrl(imageSrc) ?? imageSrc;
  const imgEl = new Image();
  imgEl.loading = 'lazy';
  imgEl.src = src;
  imgEl.alt = alt?.trim() || '';

  const imageContainer = document.createElement('div');
  imageContainer.appendChild(imgEl);

  const decorationOptions = { excludeAltText, ...(smartCrops && { smartCrops }) };

  return decorateDynamicMediaImage(imageContainer, decorationOptions);
}
