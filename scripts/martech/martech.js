import {
  initMartech,
  martechEager,
  martechLazy,
  martechDelayed,
  updateUserConsent,
} from './index.js';
import {
  initDataLayerManager,
  initialiseUnifiedDataLayer,
  triggerPageViewEvent,
  triggerConsentUpdateEvent,
  triggerECIDUserUpdateEvent,
} from './datalayer.js';

/* -- Library Loading --------------------------------------- */

/**
 * Loads the OneTrust snippet
 *
 * @param {*} onetrustConfig
 */
export function loadOneTrust(onetrustConfig) {
  const script = document.createElement('script');
  script.src = onetrustConfig.scriptUrl;
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('charset', 'UTF-8');
  script.setAttribute('data-document-language', onetrustConfig.documentLanguage);
  script.setAttribute('data-domain-script', onetrustConfig.domainScript);
  document.head.appendChild(script);
}

/**
 * Loads the DataDog snippet
 *
 * @param {*} dataDogConfig
 */
export function loadDataDog(dataDogConfig) {
  window.RUM_CONFIG = dataDogConfig;
  delete window.RUM_CONFIG.scriptUrl;
  import('./libraries/datadog.min.js');
}

/**
 * Loads the Optimizely snippet
 *
 * @param {*} optimizelyConfig
 */
export function loadOptimizely(optimizelyConfig) {
  const script = document.createElement('script');
  script.src = optimizelyConfig.scriptUrl;
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('id', 'optimizely-jssdk');
  document.head.appendChild(script);
}

/* -- Library Functions --------------------------------------- */

/**
 * Transforms the OneTrust consent, into the data layer consent object.
 *
 * @param {*} oneTrustConsent Consent details from OneTrust Event
 * @returns ConsentObject
 */
function mapOneTrustToConsent(oneTrustConsent) {
  const consentGroups = oneTrustConsent.detail;

  const necessary = consentGroups.includes('C0001');
  const performance = consentGroups.includes('C0002');
  const functional = consentGroups.includes('C0003');
  const targeting = consentGroups.includes('C0004');
  const socialmedia = consentGroups.includes('C0005');

  return { necessary, performance, functional, targeting, socialmedia };
}

/**
 * Transforms the data layer consent object, to WebSDK consent object.
 *
 * Consent Mapping - OneTrust to Adobe
 * ------------------------------------------
 * |  OneTrust                |  Adobe      |
 * ------------------------------------------
 * | performance              | collect     |
 * | functional               | personalise |
 * | targeting or socialmedia | share       |
 * ------------------------------------------
 *
 * @param {*} consent Data layer consent
 * @returns WebSDKConsentObject
 */
function mapConsentToWebSDK(consent) {
  console.assert(consent, 'mapConsentToWebSDK requires completed consent object,');
  return {
    collect: consent.performance,
    personalize: consent.personalise,
    share: consent.targeting || consent.socialmedia,
  };
}

/**
 * Injects an event listener, that captures any update to OneTrust consent.
 *
 * @param {*} consentEventHandler
 */
function addOneTrustListener(consentEventHandler) {
  window.addEventListener('consent.onetrust', consentEventHandler);
}

function addAlloyListener() {
  // eslint-disable-next-line no-underscore-dangle
  window.__alloyMonitors = window.__alloyMonitors || [];
  // eslint-disable-next-line no-underscore-dangle
  window.__alloyMonitors.push({
    async onInstanceConfigured() {
      triggerECIDUserUpdateEvent();
    },
  });
}

/* -- Exported Functions --------------------------------------- */

let martechConfig;

/**
 * Initialises the EDS Martech library and the data layer.
 * Retrieves the configuration, and initialises both using the config.
 *
 * @returns Promise
 */
export async function initialiseMartech() {
  martechConfig = window.eds_config.martech;

  return Promise.all([
    initMartech(martechConfig.websdk, martechConfig.martech),
    initialiseUnifiedDataLayer(martechConfig.datalayer.instanceName),
  ]).then((values) => {
    const dataLayer = values[1];
    initDataLayerManager(dataLayer);
    dataLayer.addEventListener('onDatalayerEvent', 'Adobe Data Layer', (event) => {
      window.adobeDataLayer.push(event);
    });
  });
}

/**
 * Executes all martech functionality required immediately.
 *
 * @returns Promise
 */
export async function loadMartechEager() {
  addOneTrustListener((oneTrustConsent) => {
    const consent = mapOneTrustToConsent(oneTrustConsent);
    triggerConsentUpdateEvent(consent);

    const webSDKConsent = mapConsentToWebSDK(consent);
    updateUserConsent(webSDKConsent);
  });

  loadOneTrust(martechConfig.martech.libraries.onetrust);

  triggerPageViewEvent();

  return martechEager();
}

/**
 * Executes all martech functionality that can wait, 3 secs.
 *
 * @returns Promise
 */
export function loadMartechLazy() {
  addAlloyListener();
  loadOptimizely(martechConfig.martech.libraries.optimizely);
  loadDataDog(martechConfig.martech.libraries.datadog);
  return martechLazy();
}

/**
 * Executes all martech functionality required soon after first load.
 *
 * @returns Promise
 */
export async function loadMartechDelayed() {
  return martechDelayed();
}
