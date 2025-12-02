import { useEffect, useState } from 'preact/hooks';
import { getPathDetails, getTokenisedPlaceholders } from '../scripts.js';
import { replacePlaceholderTokens, formatUriName } from './common-utils.js';

/* eslint-disable */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function getMetadataValue(metaArray, key) {
  const entry = metaArray.find((m) => m.name === key);
  return entry?.value || '';
}

function getRecentAirports() {
  const data = localStorage.getItem('recentAirports');
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    const now = new Date().getTime();
    return parsed
      .filter((item) => now - item.timestamp < 86400000)
      .map((item) => item.code);
  } catch {
    return [];
  }
}

function updateRecentAirports(code) {
  const existing = getRecentAirports();
  const updated = [code, ...existing.filter((c) => c !== code)].slice(0, 3);
  const timestamp = Date.now();
  const stored = updated.map((c) => ({ code: c, timestamp }));
  localStorage.setItem('recentAirports', JSON.stringify(stored));
}

const USER_CONTEXT_COOKIE_NAME = 'usercontext';

function updateUserContextCookie(code) {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(USER_CONTEXT_COOKIE_NAME + '='));
  if (!cookie) return;

  const value = cookie.split('=')[1];
  const parts = value.split('|').map((part) => {
    return part.startsWith('dep#') ? `dep#${code}` : part;
  });

  const updated = parts.join('|');
  document.cookie = `${USER_CONTEXT_COOKIE_NAME}=${updated}; path=/`;
}

function getUserContextCookie() {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(USER_CONTEXT_COOKIE_NAME + '='));
  if (!cookie) return null;

  const value = cookie.split('=')[1];
  const parts = value.split('|');
  const depPart = parts.find((part) => part.startsWith('dep#'));
  if (!depPart) return null;

  return depPart.replace('dep#', '');
}

let cachedTokenData = null;

function isTokenValid(tokenData) {
  return tokenData?.access_token && tokenData?.expires_at > Date.now();
}

function findOnPremLangRegion() {
  const { region, lang, langRegion } = getPathDetails();

  let onPremLangRegion = `${region}/${lang}`;

  if (window.eds_config?.onPremLangRegionMapping?.[langRegion]) {
    onPremLangRegion = window.eds_config.onPremLangRegionMapping[langRegion];
  }

  return onPremLangRegion;
}

function getFlightDealsLink() {
  let onPremLangRegion = findOnPremLangRegion();

  return replacePlaceholderTokens(window.eds_config?.onPremFlightDealsUrl, {
    '{langRegion}': onPremLangRegion,
  });
}

function getOfferLink(fromAirport, toAirport, travelClass) {
  const { langRegion, lang } = getPathDetails();
  const languagesToTry = [langRegion, lang, 'en'].filter(Boolean);
  const linkTemplate =
    languagesToTry
      .map((language) => window.eds_config?.onPremCityPairsUrl?.[language])
      .find(Boolean) || null;

  return replacePlaceholderTokens(linkTemplate, {
    '{langRegion}': findOnPremLangRegion(),
    '{originName}': formatUriName(fromAirport?.originName)?.toLocaleLowerCase(),
    '{originAirport}': fromAirport?.originAirport?.toLocaleLowerCase(),
    '{destinationName}': formatUriName(toAirport?.destinationName)?.toLocaleLowerCase(),
    '{destinationAirport}': toAirport?.destinationAirport?.toLocaleLowerCase(),
    '{travelClass}': travelClass?.toLocaleLowerCase(),
  });
}

async function fetchMPToken(tokenEndpoint) {
  if (isTokenValid(cachedTokenData)) {
    return cachedTokenData.access_token;
  }

  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
  });
  const tokenData = await tokenResponse.json();

  if (!isTokenValid(tokenData)) {
    throw new Error('Invalid or missing token');
  }

  cachedTokenData = tokenData;
  return tokenData.access_token;
}

async function fetchHomepageFlightDealsOffers(
  tokenEndpoint,
  offersEndpoint,
  offersOperationName,
  airportCode,
  arrivalAirports,
  lang,
  region,
  saleName,
) {
  const token = await fetchMPToken(tokenEndpoint);

  // Replace underscores with hyphens to match API format for travel classes
  const formattedArrivalAirports = (arrivalAirports || [])
    .filter(({ airportCode, travelClass }) => airportCode && travelClass)
    .map(({ airportCode, travelClass }) => ({
      airportCode,
      travelClass: travelClass.replace(/_/g, '-'),
    }));

  const input = {
    departureAirports: [airportCode],
    bestOffer: true,
    ...(formattedArrivalAirports.length > 0 && {
      arrivalAirports: formattedArrivalAirports,
    }),
    ...(saleName && { saleName }),
  };

  const pricingPayload = {
    operationName: offersOperationName,
    variables: {
      input: input,
    },
    query: `query GetFlightDeals($input: FlightDealFilterInput!) {
    flightDeals(input: $input) {
      data {
        offer {
          aifFormatted
          travelStart
          travelEnd
          fareFamily
          symbol
          currency
          saleData {
            sale {
              name
              iconCode
              iconName
            }
            saleName
            saleStart
            saleEnd
          }
        }
        market {
          tripType
          tripType_i18n
          cityPairCabin {
            travelClass
            travelClass_i18n
            originAirport {
              originAirport
              originName
            }
            destinationAirport {
              destinationAirport
              destinationName
            }
          }
        }
      }
    }
  }`,
  };

  const pricingResponse = await fetch(offersEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept-language': `${lang}-${region.toUpperCase()}`,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pricingPayload),
  });

  const json = await pricingResponse.json();
  if (!json?.data?.flightDeals?.data) {
    return [];
  }

  const data = json.data.flightDeals.data;

  if (saleName) {
    return data;
  }

  const sortedData = [];
  formattedArrivalAirports.forEach(({ airportCode, travelClass }) => {
    const match = data.find(
      (item) =>
        item?.market?.cityPairCabin?.destinationAirport?.destinationAirport ===
          airportCode && item?.market?.cityPairCabin?.travelClass === travelClass,
    );
    if (match) {
      sortedData.push(match);
    }
  });

  return sortedData;
}

function useTouchSwipe(onSwipeLeft, onSwipeRight, threshold = 50) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.touches[0].clientX);
      setStartY(e.touches[0].clientY);
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && touchStart !== null && startY !== null) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      setTouchEnd(currentX);
      setIsDragging(true);

      const deltaX = Math.abs(currentX - touchStart);
      const deltaY = Math.abs(currentY - startY);

      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd || !isDragging) {
      setTouchStart(null);
      setTouchEnd(null);
      setStartY(null);
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe || isRightSwipe) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }

    setTouchStart(null);
    setTouchEnd(null);
    setStartY(null);
    setIsDragging(false);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Custom React hook to fetch flight deals based on user-selected parameters.
 *
 * @param {string} options.tokenEndpoint - (Required) URL to fetch the authentication token.
 * @param {string} options.offersEndpoint - (Required) URL to retrieve flight offers.
 * @param {string} options.offersOperationName - (Required) GraphQL operation name for the flight offers query.
 * @param {string} options.selectedCode - (Required) Selected airport or city code.
 * @param {string} options.lang - (Required) Language code for localization (e.g., 'en', 'fr').
 * @param {string} options.region - (Required) Region code for filtering or localization.
 * @param {string} options.arrivalAirports - (Required) List of arrival airport codes separate by comma, each airport code may also contain a travel class.
 * @param {Object} options.overridesMap - Optional overrides for city pairs.
 * @param {string} [options.travelClass] - Search for a particular travel class.
 * @param {string} [options.saleName] - Search for a particular sale.
 * @param {boolean} [options.disabled] - If disabled, no API calls will be made.
 * @param {Array} [options.airports] - Array of airport objects needed for filtering arrival airports.
 *
 * @returns {{
 *   offers: [],
 *   isLoadingOffers: boolean,
 *   hasErrorOffers: boolean
 * }}
 */
export function useFetchFlightDeals({
  tokenEndpoint,
  offersEndpoint,
  offersOperationName,
  selectedCode,
  lang,
  region,
  arrivalAirports,
  overridesMap,
  travelClass,
  saleName,
  disabled = false,
  airports = [],
  isLoadingAirports, //this is required to prevent flashes during the loading phase
} = {}) {
  const [offers, setOffers] = useState([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [hasErrorOffers, setHasErrorOffers] = useState(false);

  useEffect(() => {
    let isStale = false;

    const loadFlightDeals = async () => {
      if (isLoadingAirports) return;

      setHasErrorOffers(false);
      setOffers([]); // Clear previous offers immediately

      if (disabled || !selectedCode || !airports || airports.length === 0) {
        setIsLoadingOffers(false);
        return;
      }

      // Set loading state immediately when selectedCode changes
      setIsLoadingOffers(true);

      try {
        const overrideDestinations = overridesMap[selectedCode];
        let destinations;
        if (overrideDestinations) {
          destinations = overrideDestinations;
        } else {
          destinations = arrivalAirports.split(',').map((entry) => {
            const [entryCode, entryClass] = entry.trim().split(':');
            return {
              airportCode: entryCode.trim(),
              travelClass: entryClass ? entryClass.trim() : travelClass,
            };
          });
        }

        const offersData = await fetchHomepageFlightDealsOffers(
          tokenEndpoint,
          offersEndpoint,
          offersOperationName,
          selectedCode,
          destinations,
          lang,
          region,
          saleName,
        );

        if (!isStale) {
          setOffers(offersData);
        }
      } catch (err) {
        if (!isStale) {
          console.error('Error fetching flight offers:', err);
          setHasErrorOffers(true);
          setOffers([]);
        }
      } finally {
        if (!isStale) {
          setIsLoadingOffers(false);
        }
      }
    };

    loadFlightDeals();

    return () => {
      isStale = true; // Mark the effect as stale when dependencies change
    };
  }, [selectedCode, disabled, airports]);

  return { offers, isLoadingOffers, hasErrorOffers };
}

function getPriceDescriptionText(travelClass, tripType, placeholders) {
  if (!placeholders) return '';

  const tokenisedPlaceholders = getTokenisedPlaceholders();
  const template = tokenisedPlaceholders.flightDealsPriceDescription;

  if (!template) return '';

  return template
    .replace('{travel-class}', travelClass || '')
    .replace('{trip-type}', tripType?.toLowerCase() || '')
    .replace('{price-from}', placeholders.flightDealsPriceFrom || '');
}

function formatPrice(symbol, price, placeholders) {
  const tokenisedPlaceholders = getTokenisedPlaceholders();
  const template = tokenisedPlaceholders.flightDealsPriceFormat;

  // Adds a space if it's a currency name (AUD) instead of a symbol ($)
  const isCurrencyName = /^[a-zA-Z]+$/.test(symbol);
  if (isCurrencyName) {
    symbol += ' '; // This is the only case when a space can be added in all languages.
  }

  return template
    .replace('{price-symbol}', symbol || '')
    .replace('{price}', price || '')
    .replace('{price-from}', placeholders.flightDealsPriceFrom || '')
    .trim();
}

function getClosestAirport(airports) {
  let closest = null;

  // Get from Geo Data
  if (airports.length > 0 && window.geoData?.getLat && window.geoData?.getLong) {
    const userLat = window.geoData.getLat();
    const userLon = window.geoData.getLong();

    let minDistance = Infinity;

    for (const airport of airports) {
      const airportRanking = Number(airport?.ranking);
      const airportLat = parseFloat(airport?.latitude);
      const airportLong = parseFloat(airport?.longitude);
      if (
        Number.isFinite(airportRanking) &&
        airportRanking > 0 &&
        airportRanking <= 10 &&
        !isNaN(airportLat) &&
        !isNaN(airportLong)
      ) {
        const dist = getDistanceFromLatLonInKm(userLat, userLon, airportLat, airportLong);
        if (dist < minDistance) {
          minDistance = dist;
          closest = airport.code;
        }
      }
    }
  }

  // Get from Cookies
  if (!closest) {
    closest = getUserContextCookie();
  }

  return closest;
}

function getFlightDealsAnnouncement({
  selectedCode,
  lastDirectSelection,
  isLoadingOffers,
  offers = [],
  selectedAirportName,
  hasError,
  errorMessage,
  noDealsMessage,
  placeholders = {},
  isFlightDealsMode = true,
  selectedCodeStable = true,
  maxOfferCount,
}) {
  // Determine announcement message for flight deals
  let announcementMessage = '';

  // Only announce if the current selectedCode matches the last direct selection
  const shouldAnnounce = selectedCode === lastDirectSelection;

  if (shouldAnnounce && isFlightDealsMode) {
    if (isLoadingOffers) {
      announcementMessage = placeholders.flightDealsLoading;
    } else if (hasError) {
      announcementMessage = errorMessage;
    } else if (offers.length > 0) {
      // Check if offers match the selected airport
      const offerDepartureCode =
        offers[0]?.market?.cityPairCabin?.originAirport?.originAirport;

      // Only announce if the offers are for the currently selected airport
      if (offerDepartureCode === selectedCode) {
        const totalOffers = offers.length;
        const offerCount =
          typeof maxOfferCount === 'number'
            ? Math.min(totalOffers, maxOfferCount)
            : totalOffers;
        announcementMessage = selectedAirportName
          ? `${replacePlaceholderTokens(placeholders?.flightDealsLoadedCity, {
              '%s1': offerCount,
              '%s2': selectedAirportName,
            })}`
          : placeholders.flightDealsLoaded;
      }
    } else if (
      selectedCode &&
      offers.length === 0 &&
      !isLoadingOffers &&
      selectedCodeStable
    ) {
      // Only announce "no deals" if we're not currently loading and have finished searching
      announcementMessage = noDealsMessage;
    } else if (!selectedCode) {
      // When selectedCode is empty (cleared), show the select city message
      announcementMessage = placeholders.flightDealsSelectCity;
    }
  }

  return announcementMessage;
}

/**
 * Filters arrival airports based on the available destinations from the selected departure airport.
 *
 * @param {string} arrivalAirports - Comma-separated list of arrival airport codes or codes with travel classes (e.g., "SYD,MEL" or "SYD:ECONOMY,MEL:BUSINESS")
 * @param {Array} airports - Array of airport objects with code and toAirports properties
 * @param {string} selectedCode - Selected departure airport code
 * @returns {string} Filtered comma-separated list of arrival airport codes (without travel classes)
 */
function getFilteredArrivalAirports(arrivalAirports, airports, selectedCode) {
  if (!arrivalAirports) return '';

  const toAirports = (
    airports?.find((a) => a.code === selectedCode)?.toAirports || []
  ).map((code) => code.trim());

  const arrivalAirportsArray = arrivalAirports.split(',');

  // Filter entries where the airport code (before ':') is in toAirports
  const filteredEntries = arrivalAirportsArray.filter((item) => {
    const airportCode = item.split(':')[0];
    return toAirports.includes(airportCode);
  });

  return filteredEntries.join(',');
}

export {
  getMetadataValue,
  getRecentAirports,
  getClosestAirport,
  updateRecentAirports,
  updateUserContextCookie,
  fetchHomepageFlightDealsOffers,
  getPriceDescriptionText,
  formatPrice,
  getFlightDealsAnnouncement,
  useTouchSwipe,
  getOfferLink,
  getFlightDealsLink,
  getFilteredArrivalAirports,
};
