/* eslint-disable no-underscore-dangle */

import { useEffect, useState } from 'preact/hooks';
import { fetchFromGraphQLPersistedQuery } from './graphql-apis.js';
import { getPathDetails } from '../scripts.js';

/**
 * Get metadata value by name from metadata array
 * @param {Array} metadataArray - Array of metadata objects
 * @param {string} name - The metadata name to find
 * @returns {*} The metadata value or null if not found
 */
function getMetadataValue(metadataArray, name) {
  const item = metadataArray.find((meta) => meta.name === name);
  return item ? item.value : null;
}

/* Get Valid Airports that has destinations & from the same country */

/**
 * Get Valid Airports that has destinations & from the same country
 * @param {Array} airports - Array of airports to filter
 * @param {string} region - The region code
 * @returns {Array} The filtered array with the valid airports
 */
export function getValidAirportsForRegion(airports, region) {
  const countryCodeParam = (region || '').toUpperCase();
  return (airports || []).filter((a) => {
    const hasDestinations = Array.isArray(a.toAirports) && a.toAirports.length > 0;
    const sameCountry =
      !countryCodeParam || (a.countryCode || '').toUpperCase() === countryCodeParam;
    return hasDestinations && sameCountry;
  });
}

function getAdditionalAirportCodes(overridesMap, arrivalAirports) {
  const overrideValues =
    overridesMap && typeof overridesMap === 'object' ? Object.values(overridesMap) : [];

  const overrideDestinationCodes = overrideValues
    .flat()
    .map((d) => (d?.airportCode || '').trim().toUpperCase())
    .filter(Boolean);

  const arrivalAirportCodes = (arrivalAirports || '')
    .split(',')
    .map((entry) => {
      const [airportCode] = entry.trim().split(':');
      return airportCode ? airportCode.trim().toUpperCase() : null;
    })
    .filter(Boolean);

  return Array.from(new Set([...overrideDestinationCodes, ...arrivalAirportCodes]));
}

/**
 * Loads airports from AEM GraphQL API
 * @param {string} aemGraphQLOperationName - The GraphQL operation name
 * @param {object} [filters={}] - Filter object to pass to GraphQL query
 * @param {string} [lang] - Language code for localized names (e.g., 'zh-tw', 'en')
 * @returns {Promise<Array>} Array of airport objects with code, name, imageUrl,
 *   latitude, longitude, ranking
 */
export async function loadAirports(
  aemGraphQLOperationName,
  overridesMap,
  arrivalAirports,
) {
  try {
    // Get country code from current region
    const { region, lang, langRegion } = getPathDetails();

    const additionalAirportCodes = getAdditionalAirportCodes(
      overridesMap,
      arrivalAirports,
    );

    // Apply country filter based on current region
    const finalFilters = {
      countryCode: region?.toUpperCase(),
      airportCode: additionalAirportCodes,
    };

    const response = await fetchFromGraphQLPersistedQuery({
      operationName: aemGraphQLOperationName,
      stringFilters: finalFilters,
    });

    // Check if we got a valid response
    if (!response || !response.qantasAirportsList) {
      throw new Error(`Invalid GraphQL response: ${JSON.stringify(response)}`);
    }

    const items = response.qantasAirportsList.items || [];

    if (items.length === 0) {
      console.warn('GraphQL returned valid response but no airport items');
    }

    const parsed = items
      .map((item) => {
        const code = item?.airportCode;
        const name = item?.airportName;
        const latitude = item?.latitude;
        const longitude = item?.longitude;
        const ranking = item?.ranking;
        const imageUrl = item?.heroImage;
        const toAirports = item?.toAirports;
        const countryCode = item?.countryCode?.toUpperCase() || null;

        // Get localized name if language is provided
        let nameLocalised = null;
        const metadata = item?._metadata?.stringMetadata || [];

        // Try langRegion first, then fall back to lang
        const languagesToTry = [langRegion, lang].filter(Boolean);

        nameLocalised =
          languagesToTry
            .map((language) => getMetadataValue(metadata, `i18n.${language}.airportName`))
            .find(Boolean) || null;

        return {
          code,
          name,
          nameLocalised,
          imageUrl,
          latitude,
          longitude,
          ranking,
          toAirports,
          countryCode,
        };
      })
      .filter((a) => a.code && a.name);

    return parsed;
  } catch (e) {
    console.error('Failed to load airports:', e);
    throw e;
  }
}

export function parseAirportOverrides(overridesStr) {
  const overridesMap = {};
  overridesStr.split(',').forEach((entry) => {
    const [origin, destinationsStr] = entry.split('-');
    if (!origin || !destinationsStr) return;

    const destinations = destinationsStr.split('|').map((dest) => {
      const [airportCode, travelClass] = dest.split('::');
      return {
        airportCode: airportCode.trim(),
        travelClass: travelClass?.trim() || 'ECONOMY',
      };
    });

    overridesMap[origin.trim()] = destinations;
  });
  return overridesMap;
}

export function useFetchAirport({
  aemGraphQLOperationName,
  overridesMap,
  arrivalAirports,
  disabled = false,
} = {}) {
  const [airports, setAllAirports] = useState([]);
  const [isLoadingAirports, setIsLoadingAirports] = useState(!disabled);
  const [hasErrorAirports, setHasErrorAirports] = useState(false);

  useEffect(() => {
    if (disabled) {
      setAllAirports([]);
      setIsLoadingAirports(false);
      setHasErrorAirports(false);
      return;
    }

    async function loadAirportsData() {
      try {
        const airportData = await loadAirports(
          aemGraphQLOperationName,
          overridesMap,
          arrivalAirports,
        );

        setAllAirports(airportData || []);
      } catch (e) {
        console.error('Failed to load airports:', e);
        setAllAirports([]);
        setHasErrorAirports(true);
      } finally {
        setIsLoadingAirports(false);
      }
    }

    if (aemGraphQLOperationName) {
      setIsLoadingAirports(true);
      loadAirportsData();
    } else {
      console.warn('No aemGraphQLOperationName provided');
      setHasErrorAirports(true);
      setIsLoadingAirports(false);
    }
  }, [disabled]);

  return { airports, isLoadingAirports, hasErrorAirports };
}
