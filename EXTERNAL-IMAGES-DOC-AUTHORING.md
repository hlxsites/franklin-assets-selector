# Retaining External Image URLs in Document-Based Authoring

This guide explains how to retain and properly render external image URLs (such as Dynamic Media URLs) in document-based authoring for AEM Edge Delivery Services projects.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [How Document-Based Authoring Handles Images](#how-document-based-authoring-handles-images)
4. [Step 1: Install AEM Assets Plugin](#step-1-install-aem-assets-plugin)
5. [Step 2: Configure External Image Handlers](#step-2-configure-external-image-handlers)
6. [Step 3: Implement Image Decoration](#step-3-implement-image-decoration)
7. [Step 4: Verify Implementation](#step-4-verify-implementation)
8. [How It Works Under the Hood](#how-it-works-under-the-hood)
9. [Troubleshooting](#troubleshooting)
10. [Additional Resources](#additional-resources)

---

## Overview

In document-based authoring (using Google Docs or Microsoft Word), when you insert images from AEM Assets with external URLs (Dynamic Media, Scene7, etc.), they are typically rendered as **anchor tags (`<a>`)** pointing to the image URL.

To leverage responsive image delivery and optimization, you need to:

1. **Detect anchor tags** that point to external image URLs
2. **Decorate them into `<picture>` elements** with responsive sources using the AEM Assets Plugin
3. **Configure handlers** for different image source types (DMwOAPI, Scene7, etc.)

**Key Difference from Universal Editor:**
- ❌ No `externalImageUrlPrefixes` feature flag support in document-based authoring
- ✅ External URLs are naturally retained as anchor tags
- ✅ Frontend decoration handles everything automatically

**Key Benefits:**
- ✅ Responsive images with multiple breakpoints
- ✅ Modern format support (AVIF, WebP) with fallbacks
- ✅ Lazy loading for better performance
- ✅ Smart cropping capabilities (optional)
- ✅ Direct delivery from Dynamic Media CDN

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **AEM Assets as a Cloud Service** subscription
- ✅ Access to **[Dynamic Media Open API](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview)**
- ✅ **Document-based authoring** configured (Google Docs or Microsoft Word)
- ✅ **[AEM Assets Sidekick Plugin](https://www.aem.live/docs/aem-assets-sidekick-plugin)** installed for inserting assets

---

## How Document-Based Authoring Handles Images

### 📝 Authoring Phase (Google Docs / Word)

There are multiple ways to add external images in your documents:

#### Method 1: Using AEM Assets Sidekick Plugin (Recommended)

When you insert an AEM Asset image using the Sidekick plugin:

1. You select an image from AEM Assets
2. The image URL is inserted into your document
3. When published, it renders as an anchor tag:

```html
<!-- From Sidekick or URL paste: -->
<a href="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero.avif">
  Link text or image preview
</a>
```

### 🌐 Rendering Phase (Frontend)

The AEM Assets Plugin automatically detects and decorates these anchor tags:

```html
<!-- What gets rendered after JavaScript decoration: -->
<picture>
  <!-- AVIF source for desktop/large viewports -->
  <source media="(min-width: 600px)" 
          type="image/avif" 
          srcset="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero.avif?width=2000">
  
  <!-- AVIF source for mobile/default viewports -->
  <source type="image/avif" 
          srcset="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero.avif?width=750">
  
  <!-- Fallback source for first breakpoint (browsers without AVIF support) -->
  <source media="(min-width: 600px)" 
          srcset="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero.avif?width=2000">
  
  <!-- Final img element (fallback for all) -->
  <img src="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero.avif?width=750" 
       alt="" 
       loading="lazy">
</picture>
```

### 🔄 Complete Flow

```
1. Author inserts image in Google Doc/Word using Sidekick
   ↓
2. Image URL from AEM Assets is added to document
   ↓
3. Document published → Renders as <a> tag with href to image URL
   ↓
4. Page loads in browser
   ↓
5. assetsInit() initializes plugin with URL prefix handlers
   ↓
6. decorateExternalImages() runs during page decoration
   ↓
7. Scans for <a> tags pointing to image URLs
   ↓
8. Checks if URL matches configured external image prefixes
   ↓
9. Validates the URL has an image extension or is an image path
   ↓
10. Handler creates responsive <picture> element
   ↓
11. Original <a> tag replaced with optimized <picture> in DOM
   ↓
12. Browser loads appropriate image based on viewport and format support
```

---

## Step 1: Install AEM Assets Plugin

### 📦 Installation

For complete installation instructions, refer to the official plugin documentation:

**📖 [AEM Assets Plugin Installation Guide](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md#installation)**

**Quick Installation:**

```bash
git subtree add --squash --prefix plugins/aem-assets-plugin \
  git@github.com:adobe-rnd/aem-assets-plugin.git main
```

**To update the plugin later:**

```bash
git subtree pull --squash --prefix plugins/aem-assets-plugin \
  git@github.com:adobe-rnd/aem-assets-plugin.git main
```

---

## Step 2: Configure External Image Handlers

### Create `scripts/aem-assets-plugin-support.js`

This file initializes the plugin and configures which image URL prefixes should be handled:

```javascript
// The base path of the aem-assets-plugin code.
const codeBasePath = `${window.hlx?.codeBasePath}/plugins/aem-assets-plugin`;

// The blocks that are to be used from the aem-assets-plugin.
const blocks = ['video', 'secure-assets'];

// Initialize the aem-assets-plugin.
export default async function assetsInit() {
  const {
    loadBlock,
    createOptimizedPicture,
    createOptimizedPictureWithSmartcrop,
    createOptimizedPictureForDMOpenAPI,
    createOptimizedPictureForDM,
    decorateExternalImages,
  } = await import(`${codeBasePath}/scripts/aem-assets.js`);

  window.hlx = window.hlx || {};
  window.hlx.aemassets = {
    codeBasePath,
    blocks,
    loadBlock,
    createOptimizedPicture,
    createOptimizedPictureWithSmartcrop,
    createOptimizedPictureForDMOpenAPI,
    createOptimizedPictureForDM,
    decorateExternalImages,
    
    // Configure smart crop breakpoints (optional)
    smartCrops: {
      Small: { minWidth: 0, maxWidth: 767 },
      Medium: { minWidth: 768, maxWidth: 1023 },
      Large: { minWidth: 1024, maxWidth: 9999 },
    },
    
    // Configure external image URL handlers
    // Each tuple: [URL prefix, handler function]
    // The plugin checks <a> tags with these prefixes and converts to <picture>
    externalImageUrlPrefixes: [
      // Dynamic Media OpenAPI URLs
      ['https://delivery-p66302-e574366.adobeaemcloud.com/', createOptimizedPictureForDMOpenAPI],
      
      // Scene7 / Dynamic Media Classic URLs
      ['https://s7ap1.scene7.com/is/image/varuncloudready/', createOptimizedPictureForDM],
      
      // Add more prefixes as needed
    ],
  };

  console.log('✅ AEM Assets Plugin initialized for document-based authoring');
}
```

**Key Configuration:**

- **`externalImageUrlPrefixes`**: Array of `[prefix, handler]` tuples
  - Scans for **`<a>` tags** (not just `<img>` tags) with href matching these prefixes
  - Validates that the URL points to an image (has image extension or is image path)
  - First matching prefix determines which handler function is used
  - Make sure prefixes match your actual image delivery domains

- **Handler Functions**: Choose the appropriate handler for your image source
  - `createOptimizedPictureForDMOpenAPI` → Dynamic Media OpenAPI URLs (AVIF format)
  - `createOptimizedPictureForDM` → Scene7/Dynamic Media Classic URLs (JPEG format)
  - `createOptimizedPicture` → Standard external images (WebP + original format)

---

## Step 3: Implement Image Decoration

### Update `scripts/scripts.js`

For detailed integration steps, refer to the **[Project Instrumentation section](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md#project-instrumentation)** in the plugin README.

**Key integration points:**

```javascript
import assetsInit from './aem-assets-plugin-support.js';

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  // IMPORTANT: Decorate external images FIRST
  // This converts <a> tags pointing to images into <picture> elements
  if (window.hlx.aemassets?.decorateExternalImages) {
    window.hlx.aemassets.decorateExternalImages(main);
  }
  
  // Standard decorations
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads the page
 */
async function loadPage() {
  // Initialize assets plugin BEFORE loading page
  await assetsInit();
  
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
```

### Optional: Override Functions in `scripts/aem.js`

```javascript
async function loadBlock(block) {
  if (window.hlx?.aemassets?.loadBlock) {
    return window.hlx.aemassets.loadBlock(block);
  }
  // ... standard implementation
}

function createOptimizedPicture(src, alt, eager, breakpoints) {
  if (window.hlx?.aemassets?.createOptimizedPicture) {
    return window.hlx.aemassets.createOptimizedPicture(src, alt, eager, breakpoints);
  }
  // ... standard implementation
}
```

**📖 See the complete integration example:** [franklin-assets-selector commit](https://github.com/hlxsites/franklin-assets-selector/commit/f512e9b10d752971136fef476402826b61d07f45)

---

## Step 4: Verify Implementation

### 🔍 Live Example

Visit this live example to see external images in document-based authoring in action:

**🌐 [External Images Example - Main Branch](https://main--franklin-assets-selector--hlxsites.aem.live/ext-images/external-images-example)**

On this page, you'll see:
- External images from AEM Assets (Dynamic Media URLs)
- Anchor tags in source that are decorated to `<picture>` elements
- Responsive image delivery with multiple breakpoints
- AVIF/WebP format optimization
- Lazy loading implementation

**To inspect:**
1. **View Page Source** - You'll see anchor tags with external image URLs
2. **Inspect Element** - You'll see decorated `<picture>` elements in the DOM
3. **Network Tab** - Verify optimized images are being delivered

### 🔧 Local Testing

**Step-by-step verification:**

1. **Create a test document** in Google Docs or Word
2. **Insert an image** from AEM Assets using the Sidekick plugin
3. **Publish the document** to your Edge Delivery site
4. **View Page Source** (Ctrl/Cmd + U):
   ```html
   <!-- Should see anchor tag in source: -->
   <a href="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/image.avif">
   ```

5. **Inspect Element** (Right-click → Inspect):
   ```html
   <!-- Should see picture element in DOM: -->
   <picture>
     <source media="(min-width: 600px)" type="image/avif" srcset="...?width=2000">
     <source type="image/avif" srcset="...?width=750">
     <source media="(min-width: 600px)" srcset="...?width=2000">
     <img src="...?width=750" alt="" loading="lazy">
   </picture>
   ```

6. **Open DevTools Network tab**:
   - Filter by "Img"
   - Refresh page
   - Verify AVIF or WebP images are being loaded
   - Check different widths are requested based on viewport

### ✅ Verification Checklist

- [ ] **Anchor Tags in Source**: External image URLs appear as `<a>` tags in page source
- [ ] **Picture Wrapping**: Anchor tags are converted to `<picture>` elements in rendered DOM
- [ ] **Multiple Sources**: Multiple `<source>` elements with different breakpoints exist
- [ ] **Format Optimization**: AVIF or WebP format is being served (check Network tab)
- [ ] **Responsive Behavior**: Different image sizes load based on viewport width
- [ ] **Lazy Loading**: Images load lazily as you scroll
- [ ] **No Console Errors**: No JavaScript errors in browser console
- [ ] **Query Parameters**: Image URLs include query parameters like `?width=750`
- [ ] **No Broken Images**: All images display correctly

### 🔧 Browser DevTools Testing

**Check configuration:**
```javascript
// In browser console:
console.log(window.hlx.aemassets);
// Should show: externalImageUrlPrefixes, decorateExternalImages, etc.

// Test if a URL would match:
const testUrl = 'https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:123/as/test.avif';
const matches = window.hlx.aemassets.externalImageUrlPrefixes.some(([prefix]) => testUrl.startsWith(prefix));
console.log('URL matches:', matches);

// Count decorated pictures:
console.log('Pictures on page:', document.querySelectorAll('picture').length);

// Find remaining anchor tags to images (should be 0 if working):
const imageAnchors = Array.from(document.querySelectorAll('a')).filter(a => {
  const href = a.getAttribute('href');
  return href && /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(href);
});
console.log('Undecorated image anchors:', imageAnchors.length);
```

---

## How It Works Under the Hood

### 🔄 Decoration Process

The AEM Assets Plugin's `decorateExternalImages()` function works differently for document-based authoring:

```
1. decorateExternalImages(main) is called
   ↓
2. Scans for ALL <a> and <img> tags in container
   ↓
3. For each <a> tag:
   ↓
4. Extracts href attribute
   ↓
5. Checks if URL has image extension (.jpg, .png, .avif, etc.)
   ↓
6. OR checks if URL contains '/is/image/' (for Scene7/DM)
   ↓
7. If valid image URL:
   ↓
8. Checks against externalImageUrlPrefixes
   ↓
9. If prefix matches:
   ↓
10. Invokes corresponding handler function
    ↓
11. Handler creates <picture> element with:
    - Multiple <source> elements for breakpoints
    - Format optimization (AVIF/WebP)
    - Responsive srcset attributes
    - Width parameters
    ↓
12. Replaces <a> tag with <picture> in DOM
```

### 🎯 Image URL Detection

The plugin uses `isImageUrl()` function to validate image URLs:

```javascript
// Checks for:
// 1. Image extensions: jpg, jpeg, png, gif, webp, avif
// 2. Dynamic Media paths: contains '/is/image/'
// 3. Absolute URLs starting with https://
```

**Valid image URLs that get decorated:**
```
✅ https://delivery-p66302-e574366.adobeaemcloud.com/.../hero.avif
✅ https://s7ap1.scene7.com/is/image/mybrand/product
✅ https://example.com/images/photo.jpg
```

**URLs that are NOT decorated:**
```
❌ https://example.com/document.pdf (not an image)
❌ https://example.com/page.html (not an image)
❌ /relative/path/image.jpg (relative paths not supported)
```

### 📊 Handler Functions

| Handler | Input Format | Output Format | Use Case |
|---------|-------------|---------------|----------|
| `createOptimizedPictureForDMOpenAPI` | DMwOAPI URL | AVIF sources | AEM Assets with Dynamic Media OpenAPI |
| `createOptimizedPictureForDM` | Scene7 URL | JPEG sources | Scene7/Dynamic Media Classic |
| `createOptimizedPicture` | Any image URL | WebP + original | Standard external images |

---

## Troubleshooting

### ❌ Anchor Tags Not Being Decorated

**Problem:** Anchor tags with image URLs remain as links, not converted to pictures.

**Symptoms:**
- Clicking image links downloads the image instead of displaying it
- No `<picture>` elements in DOM
- Images appear as clickable links

**Solutions:**

1. **Verify URL has image extension**
   ```javascript
   // The URL must end with image extension or contain '/is/image/'
   // ✅ Valid:
   https://delivery-p66302-e574366.adobeaemcloud.com/.../image.avif
   https://s7ap1.scene7.com/is/image/mybrand/product
   
   // ❌ Invalid:
   https://delivery-p66302-e574366.adobeaemcloud.com/.../asset (no extension)
   ```

2. **Check URL prefix match**
   ```javascript
   // In aem-assets-plugin-support.js
   externalImageUrlPrefixes: [
     // Must match exactly (including trailing slash)
     ['https://delivery-p66302-e574366.adobeaemcloud.com/', handler],
   ]
   ```

3. **Verify initialization order**
   ```javascript
   // assetsInit() MUST complete before decorateMain() runs
   async function loadPage() {
     await assetsInit();  // Wait for this
     await loadEager(document);  // Then proceed
   }
   ```

4. **Check decorateExternalImages is called**
   ```javascript
   export function decorateMain(main) {
     // This MUST be called first
     if (window.hlx.aemassets?.decorateExternalImages) {
       window.hlx.aemassets.decorateExternalImages(main);
     }
     // ... other decorations
   }
   ```

5. **Verify plugin is loaded**
   ```javascript
   // In browser console:
   console.log(window.hlx.aemassets);
   // Should output object with decorateExternalImages function
   ```

---

### ❌ Images Display as Broken Links

**Problem:** Images show as broken or don't display at all.

**Symptoms:**
- Browser shows broken image icon
- 404 errors in Network tab
- Images were working in document preview

**Solutions:**

1. **Verify image URL is accessible**
   ```bash
   # Test in browser or curl
   curl -I https://delivery-p66302-e574366.adobeaemcloud.com/.../image.avif
   # Should return 200 OK
   ```

2. **Check CORS settings**
   - AEM Assets delivery must allow your domain
   - Check browser console for CORS errors

3. **Verify query parameters**
   ```javascript
   // Check Network tab - URLs should have width parameters
   // ✅ Good:
   https://delivery-p66302-e574366.adobeaemcloud.com/.../image.avif?width=750
   
   // ❌ Bad (might not render):
   https://delivery-p66302-e574366.adobeaemcloud.com/.../image.avif
   ```

4. **Check image format support**
   - AVIF may not be supported in older browsers
   - Verify fallback sources are present
   - Check if browser supports the format

---

### ❌ Wrong Handler Being Called

**Problem:** Images are decorated, but with wrong format or parameters.

**Symptoms:**
- JPEG instead of AVIF for DMwOAPI URLs
- Wrong query parameters (e.g., `wid=` instead of `width=`)
- Incorrect srcset URLs

**Solutions:**

1. **Check prefix order (first match wins)**
   ```javascript
   // ❌ Wrong - generic prefix comes first:
   externalImageUrlPrefixes: [
     ['https://delivery-p66302-e574366.adobeaemcloud.com/', createOptimizedPicture],
     ['https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/', createOptimizedPictureForDMOpenAPI],
   ]
   
   // ✅ Correct - most specific first:
   externalImageUrlPrefixes: [
     ['https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/', createOptimizedPictureForDMOpenAPI],
     ['https://delivery-p66302-e574366.adobeaemcloud.com/', createOptimizedPicture],
   ]
   ```

2. **Be specific with prefixes**
   ```javascript
   // Include as much of the path as possible
   ['https://s7ap1.scene7.com/is/image/mybrand/', createOptimizedPictureForDM],
   ```

3. **Verify handler function names**
   ```javascript
   // Check spelling - JavaScript is case-sensitive
   // ❌ Wrong:
   createOptimizedPictureForDMOpenApi  // lowercase 'a'
   // ✅ Correct:
   createOptimizedPictureForDMOpenAPI  // uppercase 'API'
   ```

---

### ❌ Smart Crop Not Working

**Problem:** Images aren't using smart crop even though configured.

**Symptoms:**
- No `smartcrop` parameter in image URLs
- Images not cropped differently at different breakpoints
- All breakpoints show same crop

**Solutions:**

1. **Enable smart crop** at page, section, or block level:

   **Option A - Page-level metadata:**
   ```html
   <meta name="smartcrop" content="true">
   ```

   **Option B - Section-level (in document):**
   ```
   | Section Metadata |
   | smartcrop |
   ```

   **Option C - Block-level:**
   ```html
   <div class="block smartcrop">
   ```

2. **Verify smartCrops configuration**
   ```javascript
   // In aem-assets-plugin-support.js
   smartCrops: {
     Small: { minWidth: 0, maxWidth: 767 },
     Medium: { minWidth: 768, maxWidth: 1023 },
     Large: { minWidth: 1024, maxWidth: 9999 },
   }
   ```

3. **Smart crop only works with DMwOAPI**
   - Verify URL uses `createOptimizedPictureForDMOpenAPI` handler
   - Scene7 URLs use different cropping mechanism

4. **Check AEM Assets has smart crops**
   - Named crops must exist in AEM Assets
   - Crop names must match configuration

---

### ❌ Console Errors

**Common errors and solutions:**

**Error:** `Cannot read property 'decorateExternalImages' of undefined`
```javascript
// Solution: Ensure assetsInit() completes before decorateMain()
await assetsInit();
loadPage();
```

**Error:** `Failed to load module: aem-assets.js`
```javascript
// Solution: Check plugin installation
// Verify path: plugins/aem-assets-plugin/scripts/aem-assets.js exists
// Check codeBasePath in aem-assets-plugin-support.js
```

**Error:** `URL is not a constructor`
```javascript
// Solution: Ensure anchor href is valid absolute URL
// URLs must start with https://
```

---

## Additional Resources

### 📚 Documentation

- **[AEM Assets Plugin README](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md)** - Complete plugin documentation
- **[AEM Assets Sidekick Plugin](https://www.aem.live/docs/aem-assets-sidekick-plugin)** - Guide for inserting assets in documents
- **[Dynamic Media Open API Overview](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview)** - DMwOAPI documentation

### 🌐 Live Examples

- **[External Images Example - Main Branch](https://main--franklin-assets-selector--hlxsites.aem.live/ext-images/external-images-example)** - See external image decoration in action
- **[Franklin Assets Selector (Main Branch)](https://main--franklin-assets-selector--hlxsites.aem.live/)** - Document-based authoring example site
- **[Source Page](https://main--franklin-assets-selector--hlxsites.aem.page/ext-images/external-images-example)** - View document source for external images example

### 🔧 Repository

- **[AEM Assets Plugin Repository](https://github.com/adobe-rnd/aem-assets-plugin)** - Source code and updates
- **[Franklin Assets Selector](https://github.com/hlxsites/franklin-assets-selector)** - Reference implementation

### 🎓 Learning Resources

- **[AEM Assets Plugin Blocks](https://github.com/adobe-rnd/aem-assets-plugin/tree/main/blocks)** - Example blocks (video, secure-assets)
- **[Plugin Tests](https://github.com/adobe-rnd/aem-assets-plugin/tree/main/tests)** - Unit tests

---

## Summary

By following this guide for document-based authoring, you have:

1. ✅ **Understood the difference** between document-based and UE authoring for external images
2. ✅ **Installed the AEM Assets Plugin** for image decoration
3. ✅ **Configured external image URL handlers** to detect and decorate anchor tags
4. ✅ **Implemented decoration logic** to convert `<a>` tags to `<picture>` elements
5. ✅ **Verified the implementation** with live testing and DevTools

### Key Takeaways

- **No Feature Flag Needed**: Document-based authoring naturally retains external URLs as anchor tags
- **Automatic Detection**: Plugin automatically detects `<a>` tags pointing to image URLs
- **Handler Configuration**: `externalImageUrlPrefixes` determines which handler decorates each image
- **Image Validation**: URLs must have image extensions or be recognized image paths
- **Format Optimization**: Handlers create responsive images with AVIF/WebP formats
- **Performance**: Lazy loading and responsive breakpoints optimize delivery

### Next Steps

1. **Test with your content** - Insert images from AEM Assets in your documents
2. **Monitor performance** - Use Lighthouse to verify optimization
3. **Customize breakpoints** - Adjust based on your design requirements
4. **Enable smart crop** - For art-directed responsive images (DMwOAPI only)
5. **Stay updated** - Pull latest plugin changes periodically

Your document-based authoring site now delivers optimized, responsive images from AEM Assets! 🎉

---

**Questions or issues?**

- Check the [Troubleshooting](#troubleshooting) section
- Review the [Live Examples](#live-examples)
- Report bugs at [github.com/adobe-rnd/aem-assets-plugin/issues](https://github.com/adobe-rnd/aem-assets-plugin/issues)

---

*Last updated: November 2025*

