const codeBasePath = `${window.hlx?.codeBasePath}/plugins/aem-assets-plugin`;

// The blocks that are to be used from the aem-assets-plugin.
const blocks = ['video'];

// Initialize the aem-assets-plugin.
export default async function assetsInit() {
  console.log('🚀 assetsInit: Starting initialization...');
  const {
    loadBlock,
    createOptimizedPicture,
    createOptimizedPictureWithSmartcrop,
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
    // Configure external image URL prefixes with their handlers
    externalImageUrlPrefixes: [
      // Example: DM OpenAPI URLs with smartcrop
      ['https://delivery-p66302-e574366.adobeaemcloud.com', createOptimizedPictureWithSmartcrop],
    ],
  };
  console.log('✅ assetsInit: Configured externalImageUrlPrefixes:', window.hlx.aemassets.externalImageUrlPrefixes);
  console.log('✅ assetsInit: Handler function name:', createOptimizedPictureWithSmartcrop.name);
}
