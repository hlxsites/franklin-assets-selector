/* eslint-disable no-underscore-dangle */
import { fetchFromGraphQLPersistedQuery } from './graphql-apis.js';
import { getPathDetails } from '../scripts.js';
import { resolveFolderName } from './common-utils.js';

/**
 * Fetch Marketing Offers from AEM GraphQL API
 * @param {string} aemGraphQLOperationName - The GraphQL operation name
 * @returns {Promise<Array>} Array of marketing offer objects
 */
export default async function fetchMarketingOffers(aemGraphQLOperationName) {
  const { region, langRegion } = getPathDetails();
  const cfmFolderName = resolveFolderName(langRegion);

  try {
    const pathFilter = {
      values: [
        `/content/dam/qcom/content-fragments/${cfmFolderName}/marketing-offers/${region}`,
        `/content/dam/qcom/content-fragments/${cfmFolderName}/marketing-offers/global`,
      ],
      operator: 'STARTS_WITH',
    };
    const tagsFilter = {
      values: [`sites:${cfmFolderName}/all`, `sites:${cfmFolderName}/${region}`],
      operator: 'EQUALS',
    };
    const response = await fetchFromGraphQLPersistedQuery({
      operationName: aemGraphQLOperationName,
      stringFilters: {
        _path: pathFilter,
        _tags: tagsFilter,
        _logOp: 'AND',
      },
    });

    // Check if we got a valid response
    if (!response || !response.marketingOffersList) {
      throw new Error(`Invalid GraphQL response: ${JSON.stringify(response)}`);
    }

    // make sure to remove archived offers from the results
    const items = (response.marketingOffersList.items || []).filter(
      (marketingOffer) => !marketingOffer._path.includes('/archive/'),
    );

    if (items.length === 0) {
      console.warn('GraphQL returned valid response but no marketing offer items');
    }

    // Sort so that global offers go to the bottom, preserving relative order
    const sortedItems = items.sort((a, b) => {
      const globalTag = '/marketing-offers/global';
      const aIsGlobal = a._path.includes(globalTag);
      const bIsGlobal = b._path.includes(globalTag);
      if (aIsGlobal && !bIsGlobal) return 1; // a goes after b
      if (!aIsGlobal && bIsGlobal) return -1; // a goes before b
      return 0; // keep original order if both are same type
    });

    return sortedItems;
  } catch (e) {
    console.error('Failed to load marketing offers:', e);
    throw e;
  }
}
