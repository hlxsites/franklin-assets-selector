/* eslint-disable no-unused-vars */
import { promoteFirstChildIfExists } from '../../scripts/utils/dom.js';
import {
  getContentService,
  isAuthorMode,
  removeInstrumentation,
} from '../../scripts/utils/common-utils.js';
import { moveInstrumentation, getEDSLink } from '../../scripts/scripts.js';
import {
  EVENT_NAME,
  triggerLinkClickEventFromElement,
} from '../../scripts/martech/datalayer.js';

const BLOCK_NAME = 'link list';

export function generateDataLayer(link, moduleName) {
  if (!link || !(link instanceof HTMLElement) || link.tagName !== 'A') {
    console.warn('generateDataLayer: Invalid link element provided');
    return;
  }

  // Get link text and URL
  const linkText = link.innerHTML.trim();
  const url = link.getAttribute('href');

  // Set data attributes for tracking
  link.setAttribute('data-wae-event', EVENT_NAME.LINK_LIST_CLICK);
  link.setAttribute('data-wae-link', linkText);
  link.setAttribute('data-wae-module', moduleName);

  // Add click event listener
  link.addEventListener('click', () => triggerLinkClickEventFromElement(link));

  // Remove title attribute and apply styling classes if needed
  link.removeAttribute('title');
}

const fetchChildPageData = async ({
  childPagesParentPage,
  orderBy = 'jcr:title',
  sortOrder = 'ascending',
  excludeUrl = '',
} = {}) => {
  try {
    const MAX_CHILD_PAGES = 24;

    // Get parent path from the anchor element if provided, otherwise use current page
    let parentPath = childPagesParentPage?.querySelector('a')?.getAttribute('href');
    parentPath = parentPath ? getEDSLink(parentPath) : '';

    const currentPath = getEDSLink(document.location.pathname);

    // If parent path is undefined or not present, use currentPath instead
    if (!parentPath) {
      parentPath = currentPath;
    }

    const PAGE_INFO_PATH = `${parentPath}.pageinfo.children.json`;
    const pageInfoApiURL = isAuthorMode()
      ? `/content/qcom${PAGE_INFO_PATH}`
      : `${window.hlx.codeBasePath}${getContentService()}${PAGE_INFO_PATH}`;

    const allPagesData = await fetch(pageInfoApiURL);

    if (allPagesData.ok) {
      const childPagesData = await allPagesData.json();

      const removeLinks = excludeUrl?.split(',').map((path) => {
        if (isAuthorMode()) {
          return path;
        }
        return path.trim().replace(/^\/content\/[^/]+/, '');
      });

      const depthOneLinks = childPagesData.children;

      let filteredLinks = depthOneLinks.filter(
        (item) =>
          !removeLinks?.some((excludedPath) => item?.pagePath === excludedPath) &&
          !item?.hideinnavigation === true,
      );

      // Sort the results
      if (filteredLinks) {
        const isDescending = sortOrder?.toLowerCase() === 'descending';

        if (orderBy === 'jcr:title') {
          // Sort by title with proper comparison
          filteredLinks = [...filteredLinks].sort((a, b) => {
            const valueA = a[orderBy];
            const valueB = b[orderBy];
            return isDescending
              ? valueB.localeCompare(valueA)
              : valueA.localeCompare(valueB);
          });
        } else if (isDescending) {
          // Just reverse for other sort types when descending
          filteredLinks = [...filteredLinks].reverse();
        }
      }

      // Limit to 24 items and return
      return filteredLinks.slice(0, MAX_CHILD_PAGES);
    }

    // If allPagesData is not OK, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching child pages data:', error);
    return [];
  }
};

const fetchPageTitle = async (parentPage = '') => {
  try {
    const pageInfoApiURL = `${getContentService()}${getEDSLink(parentPage)}.pageinfo.json`;

    const allPagesData = await fetch(pageInfoApiURL);

    if (allPagesData.ok) {
      const childPagesData = await allPagesData.json();
      return childPagesData.currentPage['jcr:title'];
    }

    // If allPagesData is not OK, return empty string
    return '';
  } catch (error) {
    console.error('Error fetching child pages data:', error);
    return '';
  }
};

export function createChildPageListItem(childPage) {
  // Fail Check
  if (!childPage) return;

  // Critical info missing
  if (!(childPage.pagePath && childPage['jcr:title'])) return;

  // Build final markup
  const linkHTML = `
    <a href="${childPage.pagePath}">
      ${childPage['jcr:title']}
    </a>
  `;
  // eslint-disable-next-line consistent-return
  return linkHTML;
}

export default async function decorate(block) {
  const [
    heading,
    buildListUsingTypeRow,
    childPagesParentPageRow,
    childPagesOrderByRow,
    childPagesSortOrderRow,
    childPagesExcludeUrlRow,
    ...linkListItems
  ] = [...block.children];

  const isSimpleLinks = block.classList.contains('simple-links');

  const buildListUsingType =
    promoteFirstChildIfExists(buildListUsingTypeRow)?.textContent?.trim().toLowerCase() ||
    'fixedlist';
  const childPagesParentPage = childPagesParentPageRow;
  const childPagesOrderBy =
    promoteFirstChildIfExists(childPagesOrderByRow)?.textContent?.trim() || 'jcr:title';
  const childPagesSortOrder =
    promoteFirstChildIfExists(childPagesSortOrderRow)?.textContent?.trim() || 'ascending';
  const childPagesExcludeUrl =
    promoteFirstChildIfExists(childPagesExcludeUrlRow)?.textContent?.trim() || '';

  const mainTitle = promoteFirstChildIfExists(heading)?.querySelector('h2, h3, h4');
  if (isSimpleLinks && mainTitle) {
    mainTitle.classList.add('title-02');
  }

  const ul = document.createElement('ul');

  // check list type
  if (buildListUsingType === 'fixedlist') {
    [...linkListItems].forEach(async (row) => {
      const li = document.createElement('li');
      moveInstrumentation(row, li);
      
      // Unwrap nested divs to get to the content
      let contentRow = promoteFirstChildIfExists(row) || row;
      
      while (contentRow.querySelector('a')) {
        const link = contentRow.querySelector('a');
        if (link) {
          link.removeAttribute('title');
          link.classList.add(isSimpleLinks ? 'body-02' : 'body-01');
          link.classList.remove('button');

          // QRB-8933: Remove instrumentation from the link to avoid confusion
          removeInstrumentation(link);

          // Get the link's current text content
          const linkText = link.textContent.trim();
          // Check if the text content is an AEM path or URL
          if (linkText.startsWith('/content')) {
            fetchPageTitle(link.getAttribute('href'))
              .then((pageTitle) => {
                // Direct assignment to link.textContent
                if (pageTitle) {
                  link.textContent = pageTitle;
                }
                generateDataLayer(link, BLOCK_NAME);
              })
              .catch((error) => {
                console.error('Error fetching page title for:', linkText, error);
              });
          } else {
            generateDataLayer(link, BLOCK_NAME);
          }

          li.append(link);
        }
      }

      if (isAuthorMode() || li.querySelector('a')) {
        ul.append(li);
      }
    });
  } else if (buildListUsingType === 'childpages') {
    // Fetch and process child pages

    const childPages = await fetchChildPageData({
      childPagesParentPage,
      orderBy: childPagesOrderBy,
      sortOrder: childPagesSortOrder,
      excludeUrl: childPagesExcludeUrl,
    });

    // Iterate through child pages
    childPages?.forEach?.((childPage) => {
      const li = document.createElement('li');
      li.innerHTML = createChildPageListItem(childPage);

      const link = li.querySelector('a');
      link.classList.add(isSimpleLinks ? 'body-02' : 'body-01');
      if (link) {
        generateDataLayer(link, BLOCK_NAME);
      }

      ul.append(li);
    });
  }

  // Replace original content with final structure
  block.textContent = '';
  block.append(mainTitle);
  block.append(ul);
}
