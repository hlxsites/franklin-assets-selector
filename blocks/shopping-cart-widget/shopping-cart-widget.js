import { loadScript } from '../../scripts/aem.js';
import { getPathDetails } from '../../scripts/scripts.js';

const WIDGET_TYPE = 'shoppingcart';

const createWidget = (type) => {
  const { lang, region } = getPathDetails();
  const propsJson = {
    environment: window.eds_config?.widgets?.env || 'production',
    languageCode: lang,
    countryCode: region,
  };

  const widgetHTML = `
    <div data-widget-type="${type}" id="${type}" class="clearfix">
      <script type="qantas/widget">${JSON.stringify(propsJson)}</script>
    </div>
  `;

  return widgetHTML;
};

const loadWidget = (block) => {
  if (
    block.classList.contains('widget-is-loaded') ||
    block.classList.contains('hide-shopping-cart')
  ) {
    return;
  }

  block.innerHTML = createWidget(WIDGET_TYPE);
  block.classList.add('widget-is-loaded');
};

export async function loadShoppingCartScripts() {
  const scriptUrl = window.eds_config?.widgets?.shopping_cart?.scriptPath;

  if (!scriptUrl) {
    console.error('Shopping cart widget script path not found in eds_config.');
    return;
  }

  await loadScript(scriptUrl);
}

export default function decorate(block) {
  loadWidget(block);
}
