# Retaining External Image URLs in Universal Editor (UE) Based Authoring

This guide explains how to configure and use external image URLs from AEM Assets (Dynamic Media with OpenAPI) in Universal Editor based authoring, ensuring images are retained as external URLs and properly decorated on the project code side.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Enable External Image URL Retention](#enable-external-image-url-retention)
4. [How Universal Editor Handles Images](#how-universal-editor-handles-images)
5. [Install AEM Assets Plugin](#install-aem-assets-plugin)
6. [Verify Implementation](#verify-implementation)
7. [Troubleshooting](#troubleshooting)
8. [Additional Resources](#additional-resources)

---

## Overview

In Universal Editor, when you insert images from AEM Assets with external URLs (Dynamic Media, Scene7, etc.), they are rendered OOTB as **anchor tags (`<a>`)** pointing to the image URL. For better page optimization and responsive image delivery, these can be converted to **`<img>` tags** with external URLs (instead of converting them to `/media_*` paths).

To leverage this optimization and responsive image delivery, you need to:

1. **Enable `externalImageUrlPrefixes` feature** (via Adobe support) to retain external URLs as `<img>` tags
2. **Configure component model** to use Standard Edge Delivery flow
3. **Decorate `<img>` tags** into `<picture>` elements using the [AEM Assets Plugin](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md)

> **🔑 Critical Configuration:** External image URL retention requires TWO configurations:
> 1. **Backend:** Enable `externalImageUrlPrefixes` feature flag (via Adobe support)
> 2. **Component Model:** Include `imageMimeType` field to use Standard Edge Delivery flow ([see details](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/#component-model-in-component-modelsjson-to-leverage-standard-edge-delivery))
>
> The `imageMimeType` field ensures the flow uses EDS (Edge Delivery Services) where `externalImageUrlPrefixes` handling logic resides, rendering images as native `<img>` tags.

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **AEM Assets as a Cloud Service** subscription
- ✅ Access to **[Dynamic Media Open API](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview)**
- ✅ **Universal Editor** configured with **[Custom Asset Picker](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/)**
- ✅ Your site's **organization name** and **site name** (e.g., `hlxsites/franklin-assets-selector`)

---

## Enable External Image URL Retention

### 🔐 Request Feature Enablement

External image URL retention is an **opt-in feature** that must be enabled by Adobe for your organization/site. This prevents the Universal Editor from converting external image URLs to `/media_*` paths during authoring.

### 📝 How to Request Enablement

**1. Gather the following information:**

- **Site name** (e.g., `franklin-assets-selector`)
- **Organization name** (e.g., `hlxsites`)
- **List of Image Delivery URL prefixes** to retain:
  - Your Dynamic Media OpenAPI delivery URLs
  - Scene7 URLs (if applicable)
  - Any other external image domains

**Example:**
```
https://delivery-p66302-e574366.adobeaemcloud.com/
https://s7ap1.scene7.com/is/image/varuncloudready/
```

**2. Submit a request** following the process outlined here:

📖 **[Opt-In Retention of External Image URLs - Adobe DAM Wiki](https://wiki.corp.adobe.com/display/AdobeDAM/Opt-In+Retention+of+External+Image+URLs)**

```

**4. Wait for confirmation** from Adobe that the feature has been enabled for your site.

### ⚙️ Configure Component Model

Ensure your `component-models.json` includes the `imageMimeType` field:

📖 **Reference:** [Adobe Developer - Component Model Structures](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/#component-model-in-component-modelsjson-to-leverage-standard-edge-delivery)

### ✅ What This Enables

Once enabled and configured, when you author content in Universal Editor:

- **Retained URLs:** Images with URLs matching your configured prefixes will be **retained as external URLs** in the HTML output
- **Frontend Ready:** The raw `<img>` tags with external URLs will be available for frontend decoration

**Example - What gets saved in your content:**
```html
<img src="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:9ead338d-4ac8-483a-a1cd-a3c7dfe9f437/as/article_01_hero.avif?assetname=article_01_hero.png" 
     alt="Hero Image">
```

---

## How Universal Editor Handles Images

### 📝 Authoring Phase

When you insert an AEM Asset image in Universal Editor using the Asset Picker:

1. You select an image from AEM Assets
2. The image is inserted into your page
3. With `externalImageUrlPrefixes` enabled and correct component model, it renders as an `<img>` tag:

```html
<!-- What gets saved in your content: -->
<img src="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero.avif" 
     alt="My Hero Image">
```

### 🌐 Rendering Phase (Frontend)

The AEM Assets Plugin automatically detects and decorates these external images:

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
       alt="My Hero Image" 
       loading="lazy">
</picture>
```

### 🔄 Complete Flow

1. Author inserts image in [Universal Editor](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/)
   
   ↓
   
2. Image URL from AEM Assets is inserted
   
   ↓
   
3. With `externalImageUrlPrefixes` + correct component model → Renders as `<img>` tag with external URL
   
   ↓
   
4. Page loads in browser
   
   ↓
   
5. `assetsInit()` initializes [plugin](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md) with URL prefix handlers
   
   ↓
   
6. [`decorateExternalImages()`](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/scripts/aem-assets.js#L531) runs during page decoration
   
   ↓
   
7. Scans for `<img>` tags with external URLs
   
   ↓
   
8. Checks if URL matches configured [external image prefixes](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/scripts/aem-assets.js#L116)
   
   ↓
   
9. Validates the URL has an image extension or is an [image path](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/scripts/aem-assets.js#L28)
   
   ↓
   
10. Handler creates responsive `<picture>` element
   
    ↓
    
11. Original `<img>` tag replaced with optimized `<picture>` in DOM
   
    ↓
    
12. Browser loads appropriate image based on viewport and format support

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

Visit this live example to see external images in Universal Editor in action:

**🌐 [External Images Example - UE Branch](https://ue--assets-blocks-ue--hlxsites.aem.live/external-images-example)**

On this page, you'll see:
- External images from AEM Assets (Dynamic Media URLs)
- `<img>` tags in source that are decorated to `<picture>` elements
- Responsive image delivery with multiple breakpoints
- AVIF/WebP format optimization
- Lazy loading implementation

**To inspect:**
1. **View Page Source** - You'll see `<img>` tags with external image URLs
2. **Inspect Element** - You'll see decorated `<picture>` elements in the DOM
3. **Network Tab** - Verify optimized images are being delivered

---

## Troubleshooting

> **⚠️ Most Common Issue:** If external image URLs are converting to `/media_*` paths even after enabling `externalImageUrlPrefixes`, check your component model structure. You MUST include the `imageMimeType` field to use the EDS flow where external URL retention works.

### ❌ Images Still Converting to `/media_*`

**Problem:** External URLs are being rewritten to `/media_*` paths during authoring.

**Symptoms:**
- Images in Universal Editor show external URLs
- Published pages show `/media_*` paths instead
- External URLs aren't retained in HTML

**Solutions:**

1. **⚠️ CRITICAL: Check Component Model Structure**
   
   This is the most common cause! Your `component-models.json` structure determines whether the EDS flow (where external URL retention works) is used.
   
   **❌ NO `imageMimeType` field = Uses Dynamic Media flow, renders as anchor tags, externalImageUrlPrefixes logic doesn't apply**
   

   **✅ HAS `imageMimeType` field = Uses EDS flow, renders native Image blocks as `<img>` tags, externalImageUrlPrefixes logic works here**
   
   📖 **Reference:** [Adobe Developer - Component Model Structures](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/#component-model-in-component-modelsjson-to-leverage-standard-edge-delivery)

2. **Confirm feature enablement**
   - Verify Adobe has enabled the feature for your org/site
   - Check confirmation email or ticket status
   - Contact Adobe support if not confirmed

3. **Verify URL prefix exact match**
   ```
   What you provided to Adobe:
   https://delivery-p66302-e574366.adobeaemcloud.com/
   
   What's in your image URL:
   https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/...
   
   ✅ These match (same prefix)
   ```

4. **Clear cache and test**
   - Clear browser cache
   - Hard refresh (Ctrl/Cmd + Shift + R)
   - Test in incognito/private window

---

### ❌ Images Not Being Decorated

**Problem:** Images remain as plain `<img>` tags, not wrapped in `<picture>` elements.

**Symptoms:**
- Images display correctly but aren't responsive
- No `<picture>` elements in DOM when inspected
- Only single `<img>` tags visible

**Solutions:**

1. **Verify initialization order**
   ```javascript
   // assetsInit() MUST be called before loadPage()
   await assetsInit();
   loadPage();
   ```

2. **Check decorateMain() implementation**
   ```javascript
   export function decorateMain(main) {
     // This MUST be called first
     if (window.hlx.aemassets?.decorateExternalImages) {
       window.hlx.aemassets.decorateExternalImages(main);
     }
     // ... other decorations
   }
   ```

3. **Verify URL prefix match**
   ```javascript
   // URL must match EXACTLY (including trailing slash)
   // ❌ Wrong:
   ['https://delivery-p66302-e574366.adobeaemcloud.com', handler]
   
   // ✅ Correct:
   ['https://delivery-p66302-e574366.adobeaemcloud.com/', handler]
   ```

4. **Check browser console for errors**
   - Open DevTools Console (F12)
   - Look for JavaScript errors during page load
   - Check if assetsInit() is being called

5. **Verify plugin is loaded**
   ```javascript
   // In browser console:
   console.log(window.hlx.aemassets);
   // Should output an object with decorateExternalImages, etc.
   ```

---

### ❌ Images Display as Broken

**Problem:** Images show as broken or don't display at all.

**Symptoms:**
- Browser shows broken image icon
- 404 errors in Network tab
- Images were working in Universal Editor preview

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
- **[Opt-In Retention of External Image URLs](https://wiki.corp.adobe.com/display/AdobeDAM/Opt-In+Retention+of+External+Image+URLs)** - Internal Adobe wiki for feature enablement
- **[Dynamic Media Open API Overview](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview)** - DMwOAPI documentation
- **[Universal Editor Custom Asset Picker](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/)** - Asset picker configuration

### 🌐 Live Examples

- **[External Images Example - UE Branch](https://ue--assets-blocks-ue--hlxsites.aem.live/external-images-example)** - See external image decoration in action
- **[Assets Blocks UE Site](https://ue--assets-blocks-ue--hlxsites.aem.live/)** - Full site with various asset examples

### 🎓 Learning Resources

- **[AEM Assets Plugin Blocks](https://github.com/adobe-rnd/aem-assets-plugin/tree/main/blocks)** - Example blocks (video, secure-assets)
- **[Plugin Tests](https://github.com/adobe-rnd/aem-assets-plugin/tree/main/tests)** - Unit tests

---
