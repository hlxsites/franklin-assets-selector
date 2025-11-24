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

In document-based authoring, when you insert images from AEM Assets with external URLs (Dynamic Media, Scene7, etc.), they are typically rendered OOTB as **anchor tags (`<a>`)** pointing to the image URL.

To leverage responsive image delivery and optimization, you need to:

1. **Detect anchor tags** that point to external image URLs
2. **Decorate them into `<picture>` elements** with responsive sources using the [AEM Assets Plugin](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md)
3. **Configure handlers** for different image source types (DMwOAPI, Scene7, etc.)

**Key Difference from Universal Editor:**
- ❌ No `externalImageUrlPrefixes` feature flag support in document-based authoring
---

## Prerequisites

Before you begin, ensure you have:

- ✅ **AEM Assets as a Cloud Service** subscription
- ✅ Access to **[Dynamic Media Open API](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview)**
- ✅ **Document-based authoring** configured (Google Docs or Microsoft Word)
- ✅ **[AEM Assets Sidekick Plugin](https://www.aem.live/docs/aem-assets-sidekick-plugin)** installed for inserting assets

---

## How Document-Based Authoring Handles Images

### 📝 Authoring Phase

#### Using AEM Assets Sidekick Plugin

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
1. Author inserts image in Google Doc/Word using [Sidekick](https://www.aem.live/docs/aem-assets-sidekick-plugin)
   ↓
2. Image URL from AEM Assets is added to document
   ↓
3. Document published → Renders as <a> tag with href to image URL
   ↓
4. Page loads in browser
   ↓
5. assetsInit() initializes [plugin](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md) with URL prefix handlers
   ↓
6. [decorateExternalImages()](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/scripts/aem-assets.js#L572) runs during page decoration
   ↓
7. Scans for <a> tags pointing to image URLs
   ↓
8. Checks if URL matches configured [external image prefixes](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/scripts/aem-assets.js#L143)
   ↓
9. Validates the URL has an image extension or is an [image path](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/scripts/aem-assets.js#L41)
   ↓
10. Handler creates responsive <picture> element
   ↓
11. Original <a> tag replaced with optimized <picture> in DOM
   ↓
12. Browser loads appropriate image based on viewport and format support
```

---

## Install AEM Assets Plugin

### 📦 Installation

For complete installation instructions, refer to the official plugin documentation:

**📖 [AEM Assets Plugin Installation Guide](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md#installation)**

**Key Configuration:**

- **Handler Functions**: Choose the appropriate handler for your image source
  - `createOptimizedPictureForDMOpenAPI` → Dynamic Media OpenAPI URLs (AVIF format)
  - `createOptimizedPictureForDM` → Scene7/Dynamic Media Classic URLs (JPEG format)
  - `createOptimizedPicture` → Standard external images (WebP + original format)

---


## Verify Implementation

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
---

## Additional Resources

### 📚 Documentation

- **[AEM Assets Plugin README](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md)** - Complete plugin documentation
- **[AEM Assets Sidekick Plugin](https://www.aem.live/docs/aem-assets-sidekick-plugin)** - Guide for inserting assets in documents
- **[Dynamic Media Open API Overview](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview)** - DMwOAPI documentation

### 🎓 Learning Resources

- **[AEM Assets Plugin Blocks](https://github.com/adobe-rnd/aem-assets-plugin/tree/main/blocks)** - Example blocks (video, secure-assets)
- **[Plugin Tests](https://github.com/adobe-rnd/aem-assets-plugin/tree/main/tests)** - Unit tests

---
