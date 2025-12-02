import { fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';

import { toCamelCase } from '../../scripts/utils/common-utils.js';

const decorate = async (block) => {
  // Fail check
  if (!block) return;

  const anchor = block?.querySelector('a');
  if (!anchor) return;

  // Fetching placeholders.json data
  const placeholder = await fetchLanguagePlaceholders();

  const { lang, region, langRegion } = getPathDetails();

  const regionSelectorFlag =
    window.eds_config?.regional_selector?.flags[langRegion] || '';

  if (!placeholder || Object.keys(placeholder).length === 0) return;

  const langRegionSelectorTextKey = toCamelCase(`region-selector-full-${langRegion}`);

  const { screenReaderText } = placeholder;

  // Build final markup in one write → minimal reflow
  block.innerHTML = `
    <a href="${anchor.href}" class="region-selector-anchor body-02" aria-labelledby="regionSelector">
      <span id="regionSelector" class="visually-hidden">${screenReaderText} ${placeholder[langRegionSelectorTextKey]}</span>
      <span class="flag" aria-hidden="true">
        <img src="${window.hlx.codeBasePath}/icons/${regionSelectorFlag}.svg" alt="">
      </span>
      <span class="region-label" aria-hidden="true">${region.toUpperCase()}  |  ${lang.toUpperCase()}</span>
    </a>
  `;
};

export default decorate;
