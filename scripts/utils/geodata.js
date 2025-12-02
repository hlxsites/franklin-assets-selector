/* eslint-disable */
/**
 *  Geo data
 *
 *  @returns {object} containing user geo location
 */

const geoData = (function () {
  let lat;
  let long;
  let regionCode;
  let countryCode;
  let source;

  function initialize(
    latValue,
    longValue,
    regionCodeValue,
    countryCodeValue,
    sourceValue,
  ) {
    lat = isNaN(latValue) ? 0 : Number(latValue);
    long = isNaN(longValue) ? 0 : Number(longValue);
    regionCode = regionCodeValue;
    countryCode = countryCodeValue;
    source = sourceValue;
  }

  function getLat() {
    return lat;
  }

  function getLong() {
    return long;
  }

  function getCountryCode() {
    return countryCode;
  }

  function getRegionCode() {
    return regionCode;
  }

  function getSource() {
    return source;
  }

  return {
    initialize,
    getCountryCode,
    getLat,
    getLong,
    getRegionCode,
    getSource,
  };
})();

window.geoData = geoData;

// <esi:assign name="source" value="CDN"/>
// <esi:try>
//   <esi:attempt>
window.geoData.initialize(
  "$(GEO{'lat'})",
  "$(GEO{'long'})",
  "$(GEO{'region_code'})",
  "$(GEO{'country_code'})",
  '$(source)',
);
//   </esi:attempt>
// </esi:try>
