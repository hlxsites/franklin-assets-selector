import { loadScript, readBlockConfig } from '../../scripts/aem.js';
import { fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';

const FREQUENT_FLYER_STATUS_URI =
  'https://www.qantas.com/travel/airlines/flight-search/global/en';
const BUSINESS_REWARDS_LOGIN_URI = 'https://www.qantasbusinessrewards.com/login';

const FREQUENT_FLYER_ACCOUNT_PATH = 'my-account';
const FREQUENT_FLYER_ACTIVITY_PATH = 'frequent-flyer/my-account/points-activity.html';
const FREQUENT_FLYER_BOOKINGS_PATH = 'frequent-flyer/my-account/bookings.html';
const FREQUENT_FLYER_PROFILE_PATH = 'frequent-flyer/my-account/profile.html';
const FREQUENT_FLYER_JOIN_PATH = 'frequent-flyer/discover-and-join/join.html';
const LOGIN_LOADING_DEFAULT_PATH = 'frequent-flyer/login-loading.html';
const BUSINESS_REWARDS_NEW_ACC_PATH = 'frequent-flyer/business-rewards-connect.html';

const withLangRegion = (region, lang, path) => `/${region}/${lang}/${path}`;

const getLoginWidgetConfig = () => {
  if (window.eds_config && window.eds_config.widgets && window.eds_config.widgets.login) {
    return window.eds_config.widgets.login;
  }
  return {
    oauthInitBundleUri: '',
    oauthBundleUri: '',
    oauthLoginRibbonBundleUri: '',
  };
};

async function fetchLoginLabels(langRegion) {
  const defaults = {
    ribbonLoginLabel: 'Log in',
    ribbonCloseLabel: 'Close',
    frequentFlyerLoginLabel: 'Frequent Flyer login',
    frequentFlyerHomeLabel: 'My account',
    frequentFlyerPointsLabel: 'My activity statement',
    frequentFlyerStatusLabel: 'Make a Reward booking',
    frequentFlyerBookingsLabel: 'My bookings',
    frequentFlyerProfileLabel: 'My profile',
    businessRewardsLoginLabel: 'Business Rewards login',
    businessRewardsLabel: 'Business Rewards',
    businessRewardsLinkNewAccountLabel: 'Connect your account',
  };

  try {
    const placeholders = await fetchLanguagePlaceholders(langRegion);
    return {
      ribbonLoginLabel:
        placeholders.blockLoginRibbonLoginLabel || defaults.ribbonLoginLabel,
      ribbonCloseLabel:
        placeholders.blockLoginRibbonCloseLabel || defaults.ribbonCloseLabel,
      frequentFlyerLoginLabel:
        placeholders.blockLoginFrequentFlyerLoginLabel ||
        defaults.frequentFlyerLoginLabel,
      frequentFlyerHomeLabel:
        placeholders.blockLoginFrequentFlyerHomeLabel || defaults.frequentFlyerHomeLabel,
      frequentFlyerPointsLabel:
        placeholders.blockLoginFrequentFlyerPointsLabel ||
        defaults.frequentFlyerPointsLabel,
      frequentFlyerStatusLabel:
        placeholders.blockLoginFrequentFlyerStatusLabel ||
        defaults.frequentFlyerStatusLabel,
      frequentFlyerBookingsLabel:
        placeholders.blockLoginFrequentFlyerBookingsLabel ||
        defaults.frequentFlyerBookingsLabel,
      frequentFlyerProfileLabel:
        placeholders.blockLoginFrequentFlyerProfileLabel ||
        defaults.frequentFlyerProfileLabel,
      businessRewardsLoginLabel:
        placeholders.blockLoginBusinessRewardsLoginLabel ||
        defaults.businessRewardsLoginLabel,
      businessRewardsLabel:
        placeholders.blockLoginBusinessRewardsLabel || defaults.businessRewardsLabel,
      businessRewardsLinkNewAccountLabel:
        placeholders.blockLoginBusinessRewardsLinkNewAccountLabel ||
        defaults.businessRewardsLinkNewAccountLabel,
    };
  } catch (error) {
    console.error('Error fetching i18n labels:', error);
    return defaults;
  }
}

export async function constructLoginDialogJson(config) {
  const { lang, region, langRegion } = getPathDetails();
  const i18nLabels = await fetchLoginLabels(langRegion);

  const loginConfig = getLoginWidgetConfig();

  window.loginDialog = {
    ui: { ...i18nLabels },
    model: {
      businessRewardsLoginUri: BUSINESS_REWARDS_LOGIN_URI,
      oauthInitBundleUri: loginConfig.oauthInitBundleUri,
      oauthBundleUri: loginConfig.oauthBundleUri,
      oauthLoginRibbonBundleUri: loginConfig.oauthLoginRibbonBundleUri,
      frequentFlyerStatusUri: FREQUENT_FLYER_STATUS_URI,
      frequentFlyerLoginUri: withLangRegion(region, lang, FREQUENT_FLYER_ACCOUNT_PATH),
      frequentFlyerHomeUri: withLangRegion(region, lang, FREQUENT_FLYER_ACCOUNT_PATH),
      dologinUri: withLangRegion(region, lang, FREQUENT_FLYER_ACCOUNT_PATH),
      frequentFlyerPointsUri: withLangRegion(region, lang, FREQUENT_FLYER_ACTIVITY_PATH),
      frequentFlyerBookingUri: withLangRegion(region, lang, FREQUENT_FLYER_BOOKINGS_PATH),
      frequentFlyerProfileUri: withLangRegion(region, lang, FREQUENT_FLYER_PROFILE_PATH),
      frequentFlyerJoinUri: withLangRegion(region, lang, FREQUENT_FLYER_JOIN_PATH),
      includeLoginRibbon: true,
      includeBusinessRewardsLogin: config.includeBusinessRewardsLogin === 'true',
      loginLoadingPageUrl: config.loginLoadingPageUrl,
      businessRewardsLinkNewAccountUrl: config.businessRewardsLinkNewAccountUrl,
    },
  };
}

export async function loadLoginScripts() {
  const loginConfig = getLoginWidgetConfig();

  if (loginConfig.oauthInitBundleUri) {
    await loadScript(loginConfig.oauthInitBundleUri, { async: '' });
  }
  if (loginConfig.oauthBundleUri) {
    await loadScript(loginConfig.oauthBundleUri, { defer: '' });
  }
  if (loginConfig.oauthLoginRibbonBundleUri) {
    await loadScript(loginConfig.oauthLoginRibbonBundleUri, { defer: '' });
  }
}

export function getDetaiultConfig() {
  const { lang, region } = getPathDetails();
  return {
    includeBusinessRewardsLogin: 'true',
    loginLoadingPageUrl: withLangRegion(region, lang, LOGIN_LOADING_DEFAULT_PATH),
    businessRewardsLinkNewAccountUrl: withLangRegion(
      region,
      lang,
      BUSINESS_REWARDS_NEW_ACC_PATH,
    ),
  };
}

export default async function decorate(block) {
  if (block.classList.contains('widget-is-loaded')) return;

  const blockConfig = readBlockConfig(block);
  const config = {
    includeBusinessRewardsLogin: blockConfig.includebusinessrewardslogin || 'false',
    loginLoadingPageUrl: blockConfig.loginloadingpageurl || '',
    businessRewardsLinkNewAccountUrl: blockConfig.businessrewardslinknewaccounturl || '',
  };

  block.classList.add('widget');
  block.innerHTML =
    '<div class="qdd-login-ribbon-host" data-widget-host="qdd-login-ribbon"></div>';

  await constructLoginDialogJson(config);

  block.classList.add('widget-is-loaded');
}
