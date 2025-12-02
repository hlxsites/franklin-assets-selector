import { getContentService } from '../utils/common-utils.js';

/**
 * Retrieves the ECID for the current visitor.
 *
 * @param {*} cookieNameToSet
 * @returns string ECID
 */
export async function getECID(cookieNameToSet) {
  try {
    const {
      identity: { ECID },
    } = await window.alloy('getIdentity');
    if (cookieNameToSet) {
      sessionStorage.setItem(cookieNameToSet, ECID);
    }
    return ECID;
  } catch (error) {
    console.error('Failed to retrieve ECID:', error);
    return '';
  }
}

/* -- FROM Scripts.js --------------------------------------------- */

/**
 * Helper function that converts an AEM path into an EDS path.
 */
const CONTENT_ROOT_PATH = '/content/qcom';
export function getEDSLink(aemPath) {
  let aemRoot = CONTENT_ROOT_PATH;

  if (window.hlx && window.hlx.aemRoot) {
    aemRoot = window.hlx.aemRoot;
  }

  return aemPath.replace(aemRoot, '').replace('.html', '');
}

/**
 * Process current pathname and return details for use in language switching
 * Considers pathnames like /en/path/to/content and /content/qcom/global/en/path/to/content.html
 * for both EDS and AEM
 */
export function getPathDetails() {
  const { pathname } = window.location;
  const extParts = pathname.split('.');
  const ext = extParts.length > 1 ? extParts[extParts.length - 1] : '';
  const isContentPath = pathname.startsWith('/content');
  const parts = pathname.split('/');
  const safeLangGet = (index) => (parts.length > index ? parts[index] : 'en');
  // 4 is the index of the language in the path for AEM content paths like
  // /content/qcom/global/en/path/to/content.html
  // 1 is the index of the language in the path for EDS paths like /en/path/to/content
  let lang = isContentPath ? safeLangGet(3) : safeLangGet(1);
  // remove suffix from lang if any
  if (lang.indexOf('.') > -1) {
    lang = lang.substring(0, lang.indexOf('.'));
  }
  if (!lang) lang = 'en'; // default to en
  // substring before lang
  const prefix = pathname.substring(0, pathname.indexOf(`/${lang}`)) || '';
  const suffix = pathname.substring(pathname.indexOf(`/${lang}`) + lang.length + 1) || '';
  return {
    ext,
    prefix,
    suffix,
    lang,
    isContentPath,
  };
}

/* -- FROM Breadcrumbs --------------------------------------------- */

let contentTree;
export async function getContentTree(documentPath) {
  if (contentTree) {
    return contentTree;
  }

  function getTitle(node) {
    return node?.['jcr:title'] || '';
  }

  contentTree = [];
  try {
    const pageInfoApiURL = `${getContentService()}${documentPath}.pageinfo.parent.json`;
    const res = await fetch(pageInfoApiURL);
    if (!res.ok) throw new Error('Failed to fetch content tree data');

    const data = await res.json();

    const pushNode = (node) => {
      const title = getTitle(node);
      const path = node.pagePath;
      const hidden = node.hidebreadcrumb;

      // Stop if no valid title/path or explicitly hidden
      if (!title || !path || hidden === true) return;

      contentTree.unshift({ title, path });
    };

    // Add current page
    pushNode(data?.currentPage);

    // Traverse up the parent chain
    let current = data.parent;

    while (current && current.pageDepth !== 2) {
      pushNode(current);
      current = current.parent;
    }

    return contentTree;
  } catch (err) {
    console.error('Content Tree fetch error:', err);
    return [];
  }
}
