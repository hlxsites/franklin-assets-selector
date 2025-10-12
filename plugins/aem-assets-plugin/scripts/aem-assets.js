/**
 * All supported image formats
 * @constant {string[]}
 */
const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];

/**
 * Vector/excluded formats that don't support smart cropping
 * @constant {string[]}
 * @note Can be extended with other vector formats like 'ai', 'eps', 'pdf'
 */
const SMART_CROP_EXCLUDED_FORMATS = ['svg'];

/**
 * Gets the extension of a URL.
 * @param {string} url The URL
 * @returns {string} The extension
 * @private
 * @example
 * get_url_extension('https://example.com/foo.jpg');
 * // returns 'jpg'
 * get_url_extension('https://example.com/foo.jpg?bar=baz');
 * // returns 'jpg'
 * get_url_extension('https://example.com/foo');
 * // returns ''
 * get_url_extension('https://example.com/foo.jpg#qux');
 * // returns 'jpg'
 * get_url_extension('https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:db6f951a-3865-42cf-ad38-13a33cff9e75/as/candy.avif?assetname=candy.jpg');
 * // returns 'avif'
 */
function getUrlExtension(url) {
  return url.split(/[#?]/)[0].split('.').pop().trim();
}

/**
 * Checks if a URL has a supported image extension
 * @param {string} url The URL to check
 * @returns {boolean} Whether the URL has a supported image extension
 * @private
 */
function isImageUrl(url) {
  if (!url) return false;
  const ext = getUrlExtension(url);

  if (ext && IMAGE_FORMATS.includes(ext.toLowerCase())) return true;

  // Check for '/is/image/' for handling DM image URLs
  if (url.includes('is/image/')) return true;

  return false;
}

/**
 * Determines if an image type supports smart cropping
 * @param {string} url The image URL
 * @returns {boolean} Whether the image type supports smart cropping
 * @private
 */
function supportsSmartCrop(url) {
  if (!url) return false;
  const ext = getUrlExtension(url).toLowerCase();
  
  // Smart crops work for raster images but not for excluded vector formats
  return !SMART_CROP_EXCLUDED_FORMATS.includes(ext) && IMAGE_FORMATS.includes(ext);
}

/**
 * Converts DM OpenAPI URLs from /original/ format to /as/ format with assetname parameter
 * @param {URL} url The URL to convert
 * @returns {URL} The converted URL or original URL if not a DM OpenAPI URL
 * @private
 * @example
 * createWebOptimizedDMOpenAPIUrl(new URL('https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:9ead338d-4ac8-483a-a1cd-a3c7dfe9f437/original/as/article_01_hero.png'));
 * // returns URL('https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:9ead338d-4ac8-483a-a1cd-a3c7dfe9f437/as/article_01_hero.avif?assetname=article_01_hero.png')
 */
function createWebOptimizedDMOpenAPIUrl(url) {
  const { pathname } = url;
  // Check if URL contains /original/as/ pattern
  if (pathname.includes('/original/as/')) {
    // Extract the filename from the path
    const filename = pathname.split('/').pop();
    // Replace /original/as/ with /as/ and change extension to .avif
    const newPathname = pathname
      .replace(/(?:\/renditions)?\/original\/as\//, '/as/')
      .replace(/\.[^.]+$/, '.avif');
    // Create new URL with modified pathname
    const newUrl = new URL(url.toString());
    newUrl.pathname = newPathname;
    // Add assetname parameter with original filename
    newUrl.searchParams.set('assetname', filename);
    return newUrl;
  }
  return url;
}

/**
 * Gets the source URL and alt text from an element.
 * Handles `<a>` tags and `<img>` tags.
 * For `<img>` tags inside `<picture>`, it attempts to parse the alt attribute
 * returns a JSON object with deliveryUrl and altText.
 * @param {Element} element The element (img or a)
 * @returns {{url: string|null, alt: string}}
 *   - url: The determined image URL.
 *   - alt: The alt text, defaulting to an empty string.
 * @private
 */
function getImageSrcUrlAndAlt(element) {
  if (element.tagName === 'A') {
    return { url: element.getAttribute('href'), alt: element.getAttribute('title') || '' };
  }

  if (element.tagName === 'IMG') {
    // For images inside a picture, try to get URL from alt attribute
    if (element.parentNode?.tagName === 'PICTURE') {
      const altAttr = element.getAttribute('alt');
      if (altAttr) {
        try {
          const deliveryObject = JSON.parse(decodeURIComponent(altAttr));
          const { deliveryUrl, altText } = deliveryObject;
          if (deliveryUrl) {
            return { url: deliveryUrl, alt: altText || '' };
          }
        } catch (e) {
          // Not a JSON alt, fall back to src
        }
      }
      return { url: null, alt: '' };
    }
    // For standalone images
    return { url: element.getAttribute('src'), alt: element.getAttribute('alt') || '' };
  }

  return { url: null, alt: '' };
}

/**
 * Checks if an element is an external image.
 * @param {Element} element The element
 * @returns {Object} Object containing isExternal (boolean) and
 * createOptimizedPictureHandler (function or null)
 * @private
 */
function isExternalImage(element) {
  // Allow both <img> and <a> tags
  if (element.tagName !== 'IMG' && element.tagName !== 'A') {
    return { isExternal: false, createOptimizedPictureHandler: null };
  }

  const { url } = getImageSrcUrlAndAlt(element);
  if (!url) return { isExternal: false, createOptimizedPictureHandler: null };

  // If it's an anchor tag and the URL doesn't have an image extension, return false
  if (element.tagName === 'A' && !isImageUrl(url)) {
    return { isExternal: false, createOptimizedPictureHandler: null };
  }

  let createOptimizedPictureHandlerFunction = null;
  let isExternalUrl = false;

  // Iterate through the prefixes to find a match
  if (window.hlx.aemassets?.externalImageUrlPrefixes) {
    window.hlx.aemassets.externalImageUrlPrefixes.some((prefixItem) => {
      // If prefixItem is a tuple [prefix, handlerFunction]
      if (Array.isArray(prefixItem) && prefixItem.length === 2) {
        const [prefix, handlerFunction] = prefixItem;
        // Check if the URL starts with the prefix
        if (url.startsWith(prefix)) {
          isExternalUrl = true;
          createOptimizedPictureHandlerFunction = handlerFunction;
          return true; // stops .some()
        }
      }
      return false;
    });
  }

  return {
    isExternal: isExternalUrl,
    createOptimizedPictureHandler: createOptimizedPictureHandlerFunction,
  };
}

/*
  * Appends query params to a URL.
  * @param {URL} url The URL object to append query params to
  * @param {URLSearchParams} params The query params to append
  * @returns {string} The URL string with query params appended
  * @private
  * @example
  * appendQueryParams('https://example.com', { foo: 'bar' });
  * // returns 'https://example.com?foo=bar'
*/
function appendQueryParams(url, params) {
  const { searchParams } = url;
  params.forEach((value, key) => {
    searchParams.set(key, value);
  });
  url.search = searchParams.toString();
  return url.toString();
}

/**
 * Loads a CSS file.
 * @param {string} href URL to the CSS file
 */
async function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    } else {
      resolve();
    }
  });
}

/**
 * Creates an optimized picture element for an image.
 * If the image is not an absolute URL, it will be passed to libCreateOptimizedPicture.
 * @param {string} src The image source URL
 * @param {string} alt The image alt text
 * @param {boolean} eager Whether to load the image eagerly
 * @param {object[]} breakpoints The breakpoints to use
 * @returns {Element} The picture element
 *
 */
export function createOptimizedPicture(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
) {
  const url = new URL(src);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    const searchParams = new URLSearchParams({ width: br.width, format: 'webply' });
    source.setAttribute('srcset', appendQueryParams(url, searchParams));
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    const searchParams = new URLSearchParams({ width: br.width, format: ext });

    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', appendQueryParams(url, searchParams));
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', appendQueryParams(url, searchParams));
    }
  });

  return picture;
}

/**
 * Creates an optimized picture element for an image
 * leveraging smartcrop config from 'window.hlx.aemassets.smartCrops'.
 * @param {string} src The image source URL
 * @param {string} alt The image alt text
 * @param {boolean} eager Whether to load the image eagerly
 * @param {object[]} breakpoints The breakpoints to use
 * @returns {Element} The picture element
 */
export function createOptimizedPictureWithSmartcrop(
  src,
  alt = '',
  eager = false,
  breakpoints = [],
) {
  const isAbsoluteUrl = /^https?:\/\//i.test(src);

  // initialise breakpoint to project level smartcrop config unless needed to customise
  const smartcropBreakpoints = breakpoints.length !== 0 ? breakpoints
    : Object.entries(window.hlx.aemassets?.smartCrops).map(
      ([name, { minWidth, maxWidth }]) => ({
        media: `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`,
        smartcrop: name,
      }),
    );

  const url = isAbsoluteUrl ? new URL(src) : new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  smartcropBreakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    const searchParams = new URLSearchParams({ smartcrop: br.smartcrop, format: 'webply' });
    source.setAttribute('srcset', appendQueryParams(url, searchParams));
    picture.appendChild(source);
  });

  // fallback for non-webp
  smartcropBreakpoints.forEach((br) => {
    const searchParams = new URLSearchParams({ smartcrop: br.smartcrop, format: ext });
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('srcset', appendQueryParams(url, searchParams));
    picture.appendChild(source);
  });

  // append the default image eliminating smartcrop query param if present
  const img = document.createElement('img');
  img.setAttribute('loading', eager ? 'eager' : 'lazy');
  img.setAttribute('alt', alt);
  picture.appendChild(img);
  url.searchParams.delete('smartcrop');
  img.setAttribute('src', url.toString());

  picture.classList.add('smartcrop');
  return picture;
}

/**
 * Creates an optimized picture element for Scene7 images.
 * @param {string} src The image source URL
 * @param {string} alt The image alt text
 * @param {boolean} eager Whether to load the image eagerly
 * @param {object[]} breakpoints The breakpoints to use
 * @returns {Element} The picture element
 *
 */
export function createOptimizedPictureForDM(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
) {
  const picture = document.createElement('picture');
  const isAbsoluteUrl = /^https?:\/\//i.test(src);
  const url = isAbsoluteUrl ? new URL(src) : new URL(src, window.location.href);

  // jpeg sources
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/jpeg');
    const searchParams = new URLSearchParams({ wid: br.width, fmt: 'jpeg' });
    source.setAttribute('srcset', appendQueryParams(url, searchParams));
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    const searchParams = new URLSearchParams({ wid: br.width });

    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', appendQueryParams(url, searchParams));
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', appendQueryParams(url, searchParams));
    }
  });

  return picture;
}

/**
 * Creates an optimized picture element for DM OpenAPI images.
 * @param {string} src The image source URL
 * @param {string} alt The image alt text
 * @param {boolean} useSmartcrop Whether to use smartcrop
 * @param {boolean} eager Whether to load the image eagerly
 * @param {object[]} breakpoints The breakpoints to use
 * @returns {Element} The picture element
 */
export function createOptimizedPictureForDMOpenAPI(
  src,
  alt = '',
  useSmartcrop = false,
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
) {
  const picture = document.createElement('picture');
  const isAbsoluteUrl = /^https?:\/\//i.test(src);
  const originalUrl = isAbsoluteUrl ? new URL(src) : new URL(src, window.location.href);
  const url = createWebOptimizedDMOpenAPIUrl(originalUrl);

  // Determine which breakpoints to use
  let finalBreakpoints = breakpoints;
  if (useSmartcrop && window.hlx?.aemassets?.smartCrops) {
    finalBreakpoints = Object.entries(window.hlx.aemassets.smartCrops).map(
      ([name, { minWidth, maxWidth }]) => ({
        media: `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`,
        smartcrop: name,
        width: maxWidth || '2000',
      }),
    );
  }

  // Create sources
  finalBreakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/avif');

    const searchParams = new URLSearchParams({ width: br.width });
    if (useSmartcrop && br.smartcrop) {
      searchParams.set('smartcrop', br.smartcrop);
    }

    source.setAttribute('srcset', appendQueryParams(url, searchParams));
    picture.appendChild(source);
  });

  // Create fallback sources (for non-last breakpoints)
  finalBreakpoints.forEach((br, i) => {
    if (i < finalBreakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);

      const searchParams = new URLSearchParams({ width: br.width });
      if (useSmartcrop && br.smartcrop) {
        searchParams.set('smartcrop', br.smartcrop);
      }

      source.setAttribute('srcset', appendQueryParams(url, searchParams));
      picture.appendChild(source);
    }
  });

  // Create default img element (from last breakpoint or without smartcrop)
  const img = document.createElement('img');
  img.setAttribute('loading', eager ? 'eager' : 'lazy');
  img.setAttribute('alt', alt || '');
  picture.appendChild(img);

  // For the image src, either use the last breakpoint or a clean URL
  if (finalBreakpoints.length > 0) {
    const lastBreakpoint = finalBreakpoints[finalBreakpoints.length - 1];
    const searchParams = new URLSearchParams({ width: lastBreakpoint.width });
    img.setAttribute('src', appendQueryParams(url, searchParams));
  } else {
    img.setAttribute('src', url.toString());
  }

  // Add smartcrop class if using smartcrop
  if (useSmartcrop) {
    picture.classList.add('smartcrop');
    picture.setAttribute('data-smartcrop-status', 'loaded');
  }

  return picture;
}

/**
 * to check if given src is a DM OpenAPI URL
 * @param {string} src The URL to check
 * @returns {boolean} True if the URL is a DM OpenAPI URL, false otherwise.
 * @private
 */
function isDMOpenAPIUrl(src) {
  return /^(https?:\/\/(.*)\/adobe\/assets\/urn:aaid:aem:(.*))/gm.test(src);
}

/**
 * to check if the page contains meta tag for smartcrop rendering
 * @returns {boolean} True if meta tag for smartcrop is present and true, false otherwise.
 * @private
 */
function hasImageSmartcropMeta() {
  const metaTags = document.getElementsByTagName('meta');
  const matchingMeta = Array.from(metaTags).find((meta) => meta.name === 'smartcrop' && meta.content === 'true');
  return !!matchingMeta;
}

/**
 * to mark all the external images with smart crop on the page and set data-smartcrop-status=loading
 * if the image is a DM OpenAPI URL
 * @param {Element} ele The element to search within. Defaults to document.
 * @private
 */
function markSmartCropImages(ele = document) {
  // Early return if smartcrop config is missing
  if (window.hlx?.aemassets?.smartCrops === undefined) {
    return;
  }

  // Collect all external images into an array
  const extImages = [];

  if (hasImageSmartcropMeta()) {
    // If smartcrop is enabled at page level, collect all <a> tags and standalone <img> tags
    extImages.push(...ele.querySelectorAll('a'));
    // Add img tags that are not inside picture elements
    ele.querySelectorAll('img').forEach((img) => {
      if (img.parentNode?.tagName !== 'PICTURE') {
        extImages.push(img);
      }
    });
  } else {
    // if not enabled at page level, collect all <a> tags and standalone <img> tags
    // within block and section elements
    extImages.push(...ele.querySelectorAll('.smartcrop a'));
    // Add img tags that are not inside picture elements
    ele.querySelectorAll('.smartcrop img').forEach((img) => {
      if (img.parentNode?.tagName !== 'PICTURE') {
        extImages.push(img);
      }
    });
    ele.querySelectorAll('.section-metadata > div > div').forEach((sectionMeta) => {
      if (sectionMeta.innerText === 'smartcrop') {
        const parentSection = sectionMeta.closest('.section-metadata').parentElement;
        extImages.push(...parentSection.querySelectorAll('a'));
        // Add img tags that are not inside picture elements
        parentSection.querySelectorAll('img').forEach((img) => {
          if (img.parentNode?.tagName !== 'PICTURE') {
            extImages.push(img);
          }
        });
      }
    });
  }

  // Apply the data-smartcrop-status attribute to all collected images if a DM OpenAPI URL
  extImages.forEach((extImage) => {
    const { url } = getImageSrcUrlAndAlt(extImage);
    if (url && isDMOpenAPIUrl(url)) {
      extImage.setAttribute('data-smartcrop-status', 'loading');
    }
  });
}

/*
  * Decorates external images with a picture element
  * @param {Element} ele The element
  * @private
  * @example
  * decorateExternalImages(main);
  */
export function decorateExternalImages(ele) {
  // apply data-smartcrop-status=loading to all potential <a> ,<img> tags
  markSmartCropImages(ele);

  const extImages = ele.querySelectorAll('a,img');
  extImages.forEach((extImage) => {
    const { isExternal, createOptimizedPictureHandler } = isExternalImage(extImage);
    if (isExternal) {
      // check if needs to render smartcrop
      const renderSmartCrop = extImage.getAttribute('data-smartcrop-status');
      const { url: extImageSrc, alt } = getImageSrcUrlAndAlt(extImage);

      if (!extImageSrc) return; // Skip if no source found

      // Use the provided picture creator function to create the picture element
      // Only enable smart crop if marked AND format supports it
      const useSmartcrop = renderSmartCrop === 'loading' && supportsSmartCrop(extImageSrc);
      const extPicture = createOptimizedPictureHandler(extImageSrc, alt, useSmartcrop);

      /* copy query params from link to img */
      const extImageUrl = new URL(extImageSrc);
      const { searchParams } = extImageUrl;
      extPicture.querySelectorAll('source, img').forEach((child) => {
        if (child.tagName === 'SOURCE') {
          const srcset = child.getAttribute('srcset');
          if (srcset) {
            child.setAttribute('srcset', appendQueryParams(new URL(srcset, extImageSrc), searchParams));
          }
        } else if (child.tagName === 'IMG') {
          const src = child.getAttribute('src');
          if (src) {
            child.setAttribute('src', appendQueryParams(new URL(src, extImageSrc), searchParams));
          }
        }
      });
      extImage.parentNode.replaceChild(extPicture, extImage);
    }
  });
}

export async function loadBlock(block) {
  const status = block.dataset.blockStatus;
  if (status !== 'loading' && status !== 'loaded') {
    block.dataset.blockStatus = 'loading';
    const { blockName } = block.dataset;
    try {
      let basePath = window.hlx.codeBasePath;
      if (window.hlx.aemassets.codeBasePath
        && window.hlx.aemassets.blocks.indexOf(blockName) !== -1) {
        basePath = `${window.hlx.codeBasePath}${window.hlx.aemassets.codeBasePath}`;
      }
      decorateExternalImages(block);
      const cssLoaded = loadCSS(`${basePath}/blocks/${blockName}/${blockName}.css`);
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          try {
            const mod = await import(
              `${basePath}/blocks/${blockName}/${blockName}.js`
            );
            if (mod.default) {
              await mod.default(block);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(`failed to load module for ${blockName}`, error);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`failed to load block ${blockName}`, error);
    }
    block.dataset.blockStatus = 'loaded';
  }
  return block;
}

// Create an object with the test functions
const testFunctions = {
  appendQueryParams,
};

// Export the object
export { testFunctions };
