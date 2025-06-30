// The based path of the aem-assets-plugin code.
const codeBasePath = `${window.hlx?.codeBasePath}/plugins/aem-assets-plugin`;

// The blocks that are to be used from the aem-assets-plugin.
const blocks = ['video'];

// Initialize the aem-assets-plugin.
export default async function assetsInit() {
  const {
    loadBlock,
    createOptimizedPicture,
    decorateExternalImages,
    decorateImagesFromAlt,
  } = await import(`${codeBasePath}/scripts/aem-assets.js`);
  window.hlx = window.hlx || {};
  window.hlx.aemassets = {
    codeBasePath,
    blocks,
    loadBlock,
    createOptimizedPicture,
    decorateExternalImages,
    decorateImagesFromAlt,
    smartCrops: {
      Small: { minWidth: 0, maxWidth: 767 },
      Medium: { minWidth: 768, maxWidth: 1023 },
      Large: { minWidth: 1024, maxWidth: 9999 },
    },
  };
}