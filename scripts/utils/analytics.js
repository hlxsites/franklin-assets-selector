// Event name constants
export const EVENT_NAMES = {
  LINK_CLICK: 'link_click',
  MENU_CLICK: 'menu_click',
  HOME_CLICK: 'return_home_click',
  BACK_CLICK: 'back_to_top_click',
};

// Item type constants
export const ITEM_TYPES = {
  MENU: 'MENU',
  SOCIAL: 'SOCIAL',
  LOGO: 'LOGO',
};

// Link type constants
export const LINK_TYPES = {
  EXTERNAL: 'External',
  INTERNAL: 'Internal',
};

export const generateDataLayer = (
  link,
  moduleName,
  eventName,
  item = '',
  linkType = '',
  options = {},
) => {
  // Validation
  if (!(link instanceof HTMLElement) || link.tagName !== 'A') {
    return null;
  }

  if (!moduleName || !eventName) {
    return null;
  }

  const { menuLevel = 1 } = options;
  let linkText = '';
  const url = link.getAttribute('href');

  // Extract link text based on item type
  switch (item) {
    case ITEM_TYPES.MENU:
      linkText = link.querySelector('span')?.innerHTML || '';
      break;
    case ITEM_TYPES.SOCIAL:
      linkText = link.getAttribute('aria-label') || '';
      break;
    default:
      linkText = '';
      break;
  }

  const dataLayerObject = { event: eventName };

  // Build data layer object based on item type
  switch (item) {
    case ITEM_TYPES.MENU:
      dataLayerObject.details = {
        url,
        text: linkText,
        menu_type: moduleName,
        menu_level: menuLevel,
      };
      break;

    case ITEM_TYPES.SOCIAL:
      dataLayerObject.details = {
        link_text: linkText,
        link_url: url,
        link_type: linkType,
        module: moduleName,
      };
      break;

    case ITEM_TYPES.LOGO:
      dataLayerObject.url = url;
      break;

    default:
      if (item) {
        console.warn(`generateDataLayer: Unexpected item type "${item}"`);
      }
      break;
  }

  return dataLayerObject;
};
