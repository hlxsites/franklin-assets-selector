import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

const CONTENT_ROOT_PATH = '/content/Gazal-ue-site';

/**
 * Helper function that converts an AEM path into an EDS path.
 */
export function getEDSLink(aemPath) {
  if (!aemPath) {
    return '';
  }

  let aemRoot = CONTENT_ROOT_PATH;

  if (window.hlx && window.hlx.aemRoot) {
    aemRoot = window.hlx.aemRoot;
  }

  return aemPath.replace(aemRoot, '').replace('.html', '');
}

/**
 * Gets path details from the current URL
 * @returns {object} Object containing path details
 */
export function getPathDetails() {
  const { pathname } = window.location;
  const extParts = pathname.split('.');
  const ext = extParts.length > 1 ? extParts[extParts.length - 1] : '';
  const isContentPath = pathname.startsWith('/content');
  const parts = pathname.split('/').filter(Boolean);

  const safeLangGet = (index) => {
    const val = parts[index];
    return val ? val.split('.')[0].toLowerCase() : '';
  };

  let langRegion = 'en-au';

  if (window.hlx && window.hlx.isExternalSite === true) {
    const hlxLangRegion = window.hlx.langregion?.toLowerCase();
    if (hlxLangRegion) {
      langRegion = hlxLangRegion;
    } else if (parts.length >= 2) {
      const ISO_2_LETTER = /^[a-z]{2}$/;
      const region = isContentPath ? safeLangGet(2) : safeLangGet(0);
      let language = isContentPath ? safeLangGet(3) : safeLangGet(1);
      [language] = language.split('_');
      if (ISO_2_LETTER.test(language) && ISO_2_LETTER.test(region)) {
        langRegion = `${language}-${region}`;
      }
    }
  } else {
    langRegion = isContentPath ? safeLangGet(2) : safeLangGet(0);
  }

  let [lang, region] = langRegion.split('-');
  const isLanguageMasters = langRegion === 'language-masters';

  if (region === 'masters') region = 'au';
  if (lang === 'language') lang = 'en';
  if (isLanguageMasters) langRegion = 'en-au';

  const prefix = pathname.substring(0, pathname.indexOf(`/${langRegion}`)) || '';
  const suffix = pathname.substring(pathname.indexOf(`/${langRegion}`) + langRegion.length + 1) || '';

  return {
    ext,
    prefix,
    suffix,
    langRegion,
    lang,
    region,
    isContentPath,
    isLanguageMasters,
  };
}

/**
 * Fetches language placeholders
 * @param {string} langRegion - Language region code
 * @returns {object} Placeholders object
 */
export async function fetchLanguagePlaceholders(langRegion) {
  const langCode = langRegion || getPathDetails()?.langRegion || 'en-au';
  try {
    const resp = await fetch(`/${langCode}/placeholders.json`);
    if (resp.ok) {
      const json = await resp.json();
      return json.data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {}) || {};
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching placeholders for lang: ${langCode}`, error);
    try {
      const resp = await fetch('/en-au/placeholders.json');
      if (resp.ok) {
        const json = await resp.json();
        return json.data?.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {}) || {};
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
  }
  return {};
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

function isDMOpenAPIUrl(src) {
  return /^(https?:\/\/(.*)\/adobe\/assets\/urn:aaid:aem:(.*))/gm.test(src);
}

export function decorateExternalImages(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    // Check if it's a DM Open API URL
    if (isDMOpenAPIUrl(a.href)) {
      const baseUrl = new URL(a.href);

      // Check if URL contains 'test-page-v3-nocache' to toggle cache=off
      const noCache = window.location.href.includes('test-page-v3-nocache');

      const pic = document.createElement('picture');

      // Check if there's a rotation value in the next sibling div
      let rotation = null;
      const parentDiv = a.closest('div');
      if (parentDiv && parentDiv.parentElement) {
        const nextDiv = parentDiv.parentElement.nextElementSibling;
        if (nextDiv) {
          const rotationDiv = nextDiv.querySelector('div');
          if (rotationDiv && rotationDiv.textContent.trim()) {
            rotation = rotationDiv.textContent.trim();
            // Remove the rotation div from markup
            nextDiv.remove();
          }
        }
      }

      // Source 1: WebP for mobile (750px width)
      const source1 = document.createElement('source');
      source1.type = 'image/webp';
      const url1 = new URL(baseUrl);
      url1.searchParams.set('width', '750');
      url1.searchParams.set('format', 'webply');
      if (noCache) {
        url1.searchParams.set('cache', 'off');
      }
      if (rotation) {
        url1.searchParams.set('rotate', rotation);
      }
      source1.srcset = url1.toString();

      // Source 3: JPEG for desktop (2000px width)
      const source3 = document.createElement('source');
      source3.type = 'image/jpeg';
      source3.media = '(min-width: 600px)';
      const url3 = new URL(baseUrl);
      url3.searchParams.set('width', '2000');
      url3.searchParams.set('format', 'jpg');
      if (noCache) {
        url3.searchParams.set('cache', 'off');
      }
      if (rotation) {
        url3.searchParams.set('rotate', rotation);
      }
      source3.srcset = url3.toString();

      // Source 2: WebP for desktop (2000px width)
      const source2 = document.createElement('source');
      source2.type = 'image/webp';
      source2.media = '(min-width: 600px)';
      const url2 = new URL(baseUrl);
      url2.searchParams.set('width', '2000');
      url2.searchParams.set('format', 'webply');
      if (noCache) {
        url2.searchParams.set('cache', 'off');
      }
      if (rotation) {
        url2.searchParams.set('rotate', rotation);
      }
      source2.srcset = url2.toString();

      // Fallback image: JPEG for mobile (750px width)
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.width = '1620';
      img.height = '1080'; // You can adjust this based on your aspect ratio needs
      const imgUrl = new URL(baseUrl);
      imgUrl.searchParams.set('width', '750');
      imgUrl.searchParams.set('format', 'jpg');
      if (noCache) {
        imgUrl.searchParams.set('cache', 'off');
      }
      if (rotation) {
        imgUrl.searchParams.set('rotate', rotation);
      }
      img.src = imgUrl.toString();
      if (a.href !== a.innerText) {
        img.setAttribute('alt', a.innerText);
      }

      pic.appendChild(source3);
      pic.appendChild(source2);
      pic.appendChild(img);
      pic.appendChild(source1);
      a.replaceWith(pic);
    }
  });
}

export function decorateImages(main) {
  main.querySelectorAll('p img').forEach((img) => {
    const p = img.closest('p');
    p.className = 'img-wrapper';
  });
}

// export function decorateImagesWithWidthHeight(main) {
//   const urlSpec = window.location.href.endsWith('test-page');
//   if (urlSpec) {
//     main.querySelectorAll('img').forEach((img) => {
//       img.width = '1620';
//       img.height = '1080';
//     });
//   }
// }

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  // decorateButtons(main); // Commented out - blocks handle their own button styling
  decorateIcons(main);
  decorateExternalImages(main);
  // decorateImagesWithWidthHeight(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  // decorateExternalImages(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
