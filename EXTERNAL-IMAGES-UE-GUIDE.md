# Retaining External Image URLs in Universal Editor (UE) Based Authoring

This comprehensive guide explains how to configure and use external image URLs from AEM Assets (Dynamic Media with OpenAPI) in Universal Editor based authoring, ensuring images are retained as external URLs and properly decorated on the frontend for optimal performance.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Enable External Image URL Retention](#step-1-enable-external-image-url-retention)
4. [Step 2: Understanding the Image Flow](#step-2-understanding-the-image-flow)
5. [Step 3: Configure Frontend with AEM Assets Plugin](#step-3-configure-frontend-with-aem-assets-plugin)
6. [Step 4: Implement Image Decoration](#step-4-implement-image-decoration)
7. [Step 5: Verify Implementation](#step-5-verify-implementation)
8. [How It Works Under the Hood](#how-it-works-under-the-hood)
9. [Troubleshooting](#troubleshooting)
10. [Additional Resources](#additional-resources)

---

## Overview

When using Universal Editor with AEM Assets delivered through Dynamic Media with OpenAPI (DMwOAPI), you need to:

1. **Retain external image URLs** in your content (instead of converting them to `/media_*` paths)
2. **Decorate `<img>` tags** on the frontend by wrapping them in responsive `<picture>` elements
3. **Leverage DMwOAPI features** like smart cropping, format optimization (AVIF/WebP), and responsive breakpoints

This approach ensures you get the full benefits of Dynamic Media delivery while maintaining clean, performant markup that works seamlessly with Universal Editor.

> **🔑 Critical Configuration:** External image URL retention requires TWO configurations:
> 1. **Backend:** Enable `externalImageUrlPrefixes` feature (via Adobe support)
> 2. **Component Model:** Ensure `component-models.json` INCLUDES `imageMimeType` field to use Standard Edge Delivery flow ([see details](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/#component-model-in-component-modelsjson-to-leverage-standard-edge-delivery))
>
> The `imageMimeType` field ensures the flow uses EDS (Edge Delivery Services) where `externalImageUrlPrefixes` handling logic resides, rendering images as native `<img>` tags.

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
- ✅ **Universal Editor** configured with **[Custom Asset Picker](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/)**
- ✅ **[AEM Assets Plugin](https://github.com/adobe-rnd/aem-assets-plugin)** installed in your project
- ✅ Your site's **organization name** and **site name** (e.g., `hlxsites/franklin-assets-selector`)

---

## Step 1: Enable External Image URL Retention

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

**3. Example Request Format:**

```
Site name: franklin-assets-selector
Organization name: hlxsites

Image Delivery URL prefixes: 
  - https://delivery-p66302-e574366.adobeaemcloud.com/
  - https://s7ap1.scene7.com/is/image/varuncloudready/
```

**4. Wait for confirmation** from Adobe that the feature has been enabled for your site.

### ✅ What This Enables

Once enabled, when you author content in Universal Editor:

- **Retained URLs:** Images with URLs matching your configured prefixes will be **retained as external URLs** in the HTML output
- **Normal Processing:** Other images will be processed normally (converted to `/media_*` paths)
- **Frontend Ready:** The raw `<img>` tags with external URLs will be available for frontend decoration

**Example - What gets saved in your content:**
```html
<img src="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:9ead338d-4ac8-483a-a1cd-a3c7dfe9f437/as/article_01_hero.avif?assetname=article_01_hero.png" 
     alt="Hero Image">
```

> **⚠️ Important:** Even with the feature enabled, your `component-models.json` structure determines if URLs are retained. Make sure you **INCLUDE** the `imageMimeType` field in your component model to use the Standard Edge Delivery flow where external URL retention works. See the [Adobe Developer documentation](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/#component-model-in-component-modelsjson-to-leverage-standard-edge-delivery) for details on the two different structures.
>
> **Why `imageMimeType` is needed:** This field triggers the EDS (Edge Delivery Services) flow which renders native Image blocks as `<img>` tags. The `externalImageUrlPrefixes` handling logic resides in the EDS flow, so without this field, your images will be rendered differently and external URLs won't be retained.

---

## Step 2: Understanding the Image Flow

### 📝 Authoring Phase (Universal Editor)

When you insert an AEM Asset image in Universal Editor using the Asset Picker:

```html
<!-- What gets saved in your content repository: -->
<img src="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero-image.avif" 
     alt="My Hero Image">
```

Because the URL matches your configured prefix, it's **retained as-is** (not converted to `/media_*`).

### 🌐 Rendering Phase (Frontend)

When the page loads in the browser, the AEM Assets Plugin automatically decorates these external images:

```html
<!-- What gets rendered in the browser DOM: -->
<picture>
  <!-- AVIF source for desktop/large viewports -->
  <source media="(min-width: 600px)" 
          type="image/avif" 
          srcset="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero-image.avif?width=2000">
  
  <!-- AVIF source for mobile/default viewports -->
  <source type="image/avif" 
          srcset="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero-image.avif?width=750">
  
  <!-- Fallback source for first breakpoint (browsers without AVIF support) -->
  <source media="(min-width: 600px)" 
          srcset="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero-image.avif?width=2000">
  
  <!-- Final img element (fallback for all) -->
  <img src="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/hero-image.avif?width=750" 
       alt="My Hero Image" 
       loading="lazy">
</picture>
```

### 🔄 Complete Implementation Flow

```
1. Author inserts image in Universal Editor
   ↓
2. externalImageUrlPrefixes enabled → Image URL retained as <img> tag
   ↓
3. Page loads in browser
   ↓
4. assetsInit() initializes plugin with URL prefix handlers
   ↓
5. decorateExternalImages() runs during page decoration
   ↓
6. Scans for <img> and <a> tags with image URLs
   ↓
7. Checks URL against externalImageUrlPrefixes configuration
   ↓
8. URL matches prefix → Invokes corresponding handler function
   ↓
9. Handler creates responsive <picture> element with:
   - Multiple <source> elements for breakpoints
   - AVIF/WebP format with fallbacks
   - Responsive srcset and sizes attributes
   - Query parameters for width, format, smartcrop
   ↓
10. Original <img> replaced with optimized <picture> in DOM
   ↓
11. Browser loads appropriate image based on viewport and format support
```

---

## Step 3: Configure Frontend with AEM Assets Plugin

### 📦 Installation and Setup

For complete installation instructions and setup details, please refer to the official plugin documentation:

**📖 [AEM Assets Plugin Installation Guide](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md#installation)**

**Quick Summary:**
1. Add the plugin as a git subtree to your project
2. Create `scripts/aem-assets-plugin-support.js` configuration file
3. Update `scripts/scripts.js` to import and initialize the plugin
4. (Optional) Override functions in `scripts/aem.js` for deeper integration

The sections below focus specifically on configuring external image URL handling.

### ⚙️ Configuration for External Images

#### 1. Create `scripts/aem-assets-plugin-support.js`

This file initializes the plugin and configures which image URL prefixes should be handled and how:

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
    // These are used when smartcrop is enabled at page or block level
    smartCrops: {
      Small: { minWidth: 0, maxWidth: 767 },
      Medium: { minWidth: 768, maxWidth: 1023 },
      Large: { minWidth: 1024, maxWidth: 9999 },
    },
    
    // Configure external image URL handlers
    // Each tuple: [URL prefix, handler function]
    // First match wins, so order matters!
    externalImageUrlPrefixes: [
      // Dynamic Media OpenAPI URLs
      ['https://delivery-p66302-e574366.adobeaemcloud.com/', createOptimizedPictureForDMOpenAPI],
      
      // Scene7 / Dynamic Media Classic URLs
      ['https://s7ap1.scene7.com/is/image/varuncloudready/', createOptimizedPictureForDM],
      
      // Add more prefixes as needed
    ],
  };

  console.log('✅ AEM Assets Plugin initialized with external image handlers');
}
```

**Key Configuration Details:**

- **`externalImageUrlPrefixes`**: Array of `[prefix, handler]` tuples
  - Each image URL is checked against these prefixes in order
  - First matching prefix determines which handler function is used
  - Make sure your URL prefixes match exactly what was enabled in Step 1

- **Handler Functions**: Choose the appropriate handler for your image source
  - `createOptimizedPictureForDMOpenAPI` → Dynamic Media OpenAPI URLs
  - `createOptimizedPictureForDM` → Scene7/Dynamic Media Classic URLs
  - `createOptimizedPicture` → Standard external images
  - `createOptimizedPictureWithSmartcrop` → Custom smartcrop configurations

- **`smartCrops`**: Define responsive breakpoints for smart cropping
  - Each breakpoint has a name, minWidth, and maxWidth
  - Used by handlers that support smartcrop
  - Optional - only needed if using smartcrop features

---

## Step 4: Implement Image Decoration

### Integrate Plugin in Your Scripts

For detailed integration steps (updating `scripts.js`, `aem.js`, etc.), refer to the **[Project Instrumentation section](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md#project-instrumentation)** in the plugin README.

**Key integration points:**

1. **In `scripts/scripts.js`** - Call decoration during page load:
   ```javascript
   import assetsInit from './aem-assets-plugin-support.js';
   
   export function decorateMain(main) {
     // IMPORTANT: Decorate external images FIRST
     if (window.hlx.aemassets?.decorateExternalImages) {
       window.hlx.aemassets.decorateExternalImages(main);
     }
     
     // ... other decorations
     decorateButtons(main);
     decorateIcons(main);
     decorateSections(main);
     decorateBlocks(main);
   }
   
   async function loadPage() {
     await assetsInit();  // Initialize BEFORE loading page
     await loadEager(document);
     await loadLazy(document);
     loadDelayed();
   }
   
   loadPage();
   ```

2. **In `scripts/aem.js`** (Optional) - Override functions to use plugin versions:
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

## Step 5: Verify Implementation

### 🔍 Live Example

Visit this live example to see external images in action:

**🌐 [External Images Example Page](https://ue--assets-blocks-ue--hlxsites.aem.live/external-images-example)**

This page demonstrates:
- Images rendered with Dynamic Media OpenAPI URLs
- Responsive `<picture>` elements with multiple breakpoints
- AVIF/WebP format optimization
- Lazy loading implementation
- Smart cropping (if enabled)

### 🛠️ Inspect the Implementation

**Step-by-step inspection:**

1. **Open the example page** in your browser
2. **View Page Source** (Ctrl/Cmd + U) to see the original HTML:
   ```html
   <!-- Original content (before JavaScript decoration): -->
   <img src="https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:12345/as/image.avif" 
        alt="My Image">
   ```

3. **Right-click on an image** and select "Inspect Element" to see the decorated DOM:
   ```html
   <!-- Decorated content (after JavaScript runs): -->
   <picture>
     <source media="(min-width: 600px)" 
             type="image/avif" 
             srcset="https://delivery-p66302-e574366.adobeaemcloud.com/...?width=2000">
     <source type="image/avif" 
             srcset="https://delivery-p66302-e574366.adobeaemcloud.com/...?width=750">
     <img src="https://delivery-p66302-e574366.adobeaemcloud.com/...?width=750" 
          alt="My Image" 
          loading="lazy">
   </picture>
   ```

4. **Open DevTools Network tab** and refresh the page:
   - Filter by "Img" to see image requests
   - Notice AVIF images being served (if browser supports)
   - See different image widths loaded based on viewport size
   - Observe lazy loading as you scroll

5. **Resize your browser window** and observe:
   - Different image sources being loaded for different viewport sizes
   - Network tab showing new requests for appropriate breakpoints

### ✅ Verification Checklist

Use this checklist to ensure everything is working correctly:

- [ ] **Source Retention**: External image URLs are retained in page source (not converted to `/media_*`)
- [ ] **Picture Wrapping**: Images are wrapped in `<picture>` tags in the rendered DOM
- [ ] **Multiple Sources**: Multiple `<source>` elements with different breakpoints exist
- [ ] **Format Optimization**: AVIF or WebP format is being served (check Network tab)
- [ ] **Responsive Behavior**: Different image sizes load based on viewport width
- [ ] **Lazy Loading**: Images load lazily as you scroll (not all at once)
- [ ] **No Console Errors**: No JavaScript errors related to image loading in console
- [ ] **Query Parameters**: Image URLs include query parameters like `?width=750`
- [ ] **Alt Text Preserved**: Alt text from original `<img>` is preserved in decorated version

### 🔧 Testing in Your Own Project

1. **Author a test page** in Universal Editor with images from AEM Assets
2. **Publish the page** and view it on your site
3. **Follow the inspection steps** above to verify decoration
4. **Test on different devices** and viewport sizes
5. **Check Network tab** to confirm optimal images are being delivered

---

## How It Works Under the Hood

### 🔄 The Decoration Flow

Understanding the technical implementation helps with debugging and customization:

```
1. Page Loads
   ↓
2. loadPage() is called
   ↓
3. assetsInit() executes
   - Imports plugin functions
   - Sets up window.hlx.aemassets configuration
   - Registers externalImageUrlPrefixes with handlers
   ↓
4. loadEager() runs
   ↓
5. decorateMain(main) is called
   ↓
6. decorateExternalImages(main) executes
   - Scans for all <img> and <a> tags
   - For each element:
     ↓
7. isExternalImage(element) checks
   - Extracts image URL from src or href
   - Iterates through externalImageUrlPrefixes
   - Finds first matching prefix
   - Returns matched handler function
   ↓
8. Handler function invoked (e.g., createOptimizedPictureForDMOpenAPI)
   - Creates <picture> element
   - Generates <source> elements for each breakpoint
   - Adds format variations (AVIF/WebP)
   - Appends query parameters (width, format, smartcrop)
   - Copies alt text and other attributes
   ↓
9. DOM Replacement
   - Original <img> element replaced with new <picture>
   - Attributes and instrumentation preserved
   ↓
10. Browser Rendering
    - Browser selects appropriate <source> based on:
      - Viewport size (media queries)
      - Format support (type attribute)
    - Lazy loading triggered as images enter viewport
```

### 🎯 Handler Functions Reference

The plugin provides specialized handlers for different image sources:

| Handler | Use Case | Format Support | Features |
|---------|----------|----------------|----------|
| `createOptimizedPictureForDMOpenAPI` | AEM Assets with Dynamic Media OpenAPI | AVIF (primary) | Smart crops, responsive breakpoints, format optimization, width parameters |
| `createOptimizedPictureForDM` | Scene7/Dynamic Media Classic | JPEG | Dynamic Media transformations, responsive breakpoints, Scene7 parameters |
| `createOptimizedPictureWithSmartcrop` | Custom smart crop configurations | WebP + fallback | Named smart crops (Small, Medium, Large), responsive |
| `createOptimizedPicture` | Standard external images | WebP + original format | Basic responsive optimization |

### 📊 Configuration Deep Dive

**Default Breakpoints:**

```javascript
// Used by createOptimizedPicture and createOptimizedPictureForDMOpenAPI
const defaultBreakpoints = [
  { media: '(min-width: 600px)', width: '2000' },  // Desktop/tablet landscape
  { width: '750' }                                  // Mobile/default
];
```

**Smart Crop Breakpoints:**

```javascript
// Used by createOptimizedPictureWithSmartcrop and smartcrop-enabled images
smartCrops: {
  Small: { minWidth: 0, maxWidth: 767 },      // Mobile devices
  Medium: { minWidth: 768, maxWidth: 1023 },  // Tablets
  Large: { minWidth: 1024, maxWidth: 9999 },  // Desktop
}
```

**Custom Configuration Example:**

```javascript
// In aem-assets-plugin-support.js
window.hlx.aemassets = {
  // ... other config ...
  
  // Custom smart crops with more granular breakpoints
  smartCrops: {
    Mobile: { minWidth: 0, maxWidth: 479 },
    MobileLarge: { minWidth: 480, maxWidth: 767 },
    Tablet: { minWidth: 768, maxWidth: 1023 },
    Desktop: { minWidth: 1024, maxWidth: 1439 },
    DesktopLarge: { minWidth: 1440, maxWidth: 9999 },
  },
  
  // Multiple image sources with different handlers
  externalImageUrlPrefixes: [
    // Primary Dynamic Media OpenAPI
    ['https://delivery-p66302-e574366.adobeaemcloud.com/', createOptimizedPictureForDMOpenAPI],
    
    // Backup Dynamic Media OpenAPI instance
    ['https://delivery-p12345-e987654.adobeaemcloud.com/', createOptimizedPictureForDMOpenAPI],
    
    // Scene7 URLs
    ['https://s7ap1.scene7.com/is/image/mybrand/', createOptimizedPictureForDM],
    
    // Other external CDN
    ['https://cdn.example.com/images/', createOptimizedPicture],
  ],
};
```

### 🐛 Debug Mode

To debug the decoration process, add console logs or use browser DevTools:

```javascript
// Add to aem-assets-plugin-support.js
export default async function assetsInit() {
  // ... imports ...
  
  window.hlx.aemassets = {
    // ... config ...
  };

  // Debug logging
  console.log('✅ AEM Assets Plugin initialized');
  console.log('📋 External URL Prefixes:', window.hlx.aemassets.externalImageUrlPrefixes);
  console.log('🎨 Smart Crops:', window.hlx.aemassets.smartCrops);
}
```

**In browser console, you can inspect:**

```javascript
// Check if plugin is loaded
console.log(window.hlx.aemassets);

// See configured prefixes
console.log(window.hlx.aemassets.externalImageUrlPrefixes);

// Test if a URL would match
const testUrl = 'https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/urn:aaid:aem:123/as/test.avif';
const matches = window.hlx.aemassets.externalImageUrlPrefixes.some(([prefix]) => testUrl.startsWith(prefix));
console.log('URL matches:', matches);

// Find all decorated pictures
console.log('Pictures on page:', document.querySelectorAll('picture').length);
```

---

## Troubleshooting

> **⚠️ Most Common Issue:** If external image URLs are converting to `/media_*` paths even after enabling `externalImageUrlPrefixes`, check your component model structure. You MUST include the `imageMimeType` field to use the EDS flow where external URL retention works. See [Images Still Converting to /media_*](#-images-still-converting-to-media_) below for details.

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

### ❌ Images Still Converting to `/media_*`

**Problem:** External URLs are being rewritten to `/media_*` paths during authoring.

**Symptoms:**
- Images in Universal Editor show external URLs
- Published pages show `/media_*` paths instead
- External URLs aren't retained in HTML

**Solutions:**

1. **⚠️ CRITICAL: Check Component Model Structure**
   
   This is the most common cause! Your `component-models.json` structure determines whether the EDS flow (where external URL retention works) is used.
   
   **❌ WRONG - Dynamic Media Delivery (External URLs NOT retained as img tags):**
   ```json
   {
     "id": "custom-image",
     "fields": [
       {
         "component": "reference",
         "name": "image",
         "label": "Image",
         "valueType": "string"
       },
       {
         "component": "text",
         "name": "imageAlt",
         "label": "Alt Text",
         "valueType": "string"
       }
     ]
   }
   ```
   **❌ NO `imageMimeType` field = Uses Dynamic Media flow, renders as anchor tags, externalImageUrlPrefixes logic doesn't apply**
   
   **✅ CORRECT - Standard Edge Delivery (External URLs retained as img tags):**
   ```json
   {
     "id": "custom-image",
     "fields": [
       {
         "component": "reference",
         "name": "image",
         "label": "Image",
         "valueType": "string"
       },
       {
         "component": "text",
         "name": "imageMimeType",
         "valueType": "string"
       },
       {
         "component": "text",
         "name": "imageAlt",
         "label": "Alt Text",
         "valueType": "string"
       }
     ]
   }
   ```
   **✅ HAS `imageMimeType` field = Uses EDS flow, renders native Image blocks as `<img>` tags, externalImageUrlPrefixes logic works here**
   
   **Why this matters:**
   - The `imageMimeType` field triggers the **Standard Edge Delivery Services (EDS) flow**
   - EDS flow renders images as native **`<img>` tags** (not anchor tags)
   - The **`externalImageUrlPrefixes` handling logic resides in the EDS flow**
   - Without `imageMimeType`, images go through Dynamic Media flow which bypasses external URL retention
   
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

### ❌ Wrong Handler Being Called

**Problem:** Images are decorated, but not with the expected handler (e.g., DM handler instead of DMwOAPI handler).

**Symptoms:**
- Wrong query parameters on images (e.g., `wid=750` instead of `width=750`)
- Wrong format (JPEG instead of AVIF)
- Wrong URL structure in `<source>` elements

**Solutions:**

1. **Check prefix order** (first match wins)
   ```javascript
   // ❌ Wrong - more specific comes after generic:
   externalImageUrlPrefixes: [
     ['https://delivery-p66302-e574366.adobeaemcloud.com/', createOptimizedPicture],
     ['https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/', createOptimizedPictureForDMOpenAPI],
   ]
   // First prefix matches everything, second never runs
   
   // ✅ Correct - most specific first:
   externalImageUrlPrefixes: [
     ['https://delivery-p66302-e574366.adobeaemcloud.com/adobe/assets/', createOptimizedPictureForDMOpenAPI],
     ['https://delivery-p66302-e574366.adobeaemcloud.com/', createOptimizedPicture],
   ]
   ```

2. **Ensure URL prefixes don't overlap**
   ```javascript
   // Be as specific as possible
   ['https://s7ap1.scene7.com/is/image/mybrand/', createOptimizedPictureForDM],
   // Not just:
   ['https://s7ap1.scene7.com/', createOptimizedPictureForDM],
   ```

3. **Add debug logging**
   ```javascript
   // Temporarily modify decorateExternalImages in the plugin:
   const { url } = getImageSrcUrlAndAlt(extImage);
   const { isExternal, createOptimizedPictureHandler } = isExternalImage(extImage);
   if (isExternal) {
     console.log('🖼️ Decorating:', url);
     console.log('📝 Handler:', createOptimizedPictureHandler.name);
   }
   ```

---

### ❌ Smart Crop Not Working

**Problem:** Images aren't using smart crop even though configured.

**Symptoms:**
- No `data-smartcrop-status` attribute on images
- Smart crop parameters not in URL query strings
- Images not cropped differently at different breakpoints

**Solutions:**

1. **Verify smart crop is enabled** in one of three ways:

   **Option A - Page-level metadata:**
   ```html
   <meta name="smartcrop" content="true">
   ```

   **Option B - Section-level metadata:**
   ```
   | Section Metadata |
   | smartcrop |
   ```

   **Option C - Block-level class:**
   ```html
   <div class="block smartcrop" data-block-name="hero">
   ```

2. **Check smartCrops configuration**
   ```javascript
   // In aem-assets-plugin-support.js
   window.hlx.aemassets = {
     smartCrops: {
       Small: { minWidth: 0, maxWidth: 767 },
       Medium: { minWidth: 768, maxWidth: 1023 },
       Large: { minWidth: 1024, maxWidth: 9999 },
     },
     // ...
   };
   ```

3. **Verify image is DMwOAPI URL**
   - Smart crop only works with `createOptimizedPictureForDMOpenAPI`
   - Check that correct handler is being used

4. **Check AEM Assets**
   - Verify smart crop renditions exist in AEM Assets
   - Named crops must match configuration (Small, Medium, Large)

---

### ❌ Images Not Lazy Loading

**Problem:** All images load immediately, causing slow page load.

**Symptoms:**
- Network tab shows all images loading at once
- No lazy loading behavior when scrolling
- High initial page load time

**Solutions:**

1. **Check `loading` attribute**
   ```javascript
   // Handler should set this for non-eager images:
   img.setAttribute('loading', eager ? 'eager' : 'lazy');
   ```

2. **Verify `eager` parameter**
   ```javascript
   // In your code, don't set eager=true unless needed
   // ❌ Wrong:
   createOptimizedPictureForDMOpenAPI(src, alt, false, true);  // true = eager
   
   // ✅ Correct:
   createOptimizedPictureForDMOpenAPI(src, alt, false, false); // false = lazy
   ```

3. **Check hero/LCP image**
   - First visible image SHOULD be eager for LCP performance
   - Other images should be lazy

4. **Browser support**
   - Native lazy loading requires modern browser
   - Check browser compatibility
   - Consider polyfill for older browsers

---


## Additional Resources

### 📚 Documentation

- **[AEM Assets Plugin README](https://github.com/adobe-rnd/aem-assets-plugin/blob/main/README.md)** - Complete plugin documentation, installation guide, and API reference
- **[Opt-In Retention of External Image URLs](https://wiki.corp.adobe.com/display/AdobeDAM/Opt-In+Retention+of+External+Image+URLs)** - Internal Adobe wiki for feature enablement process
- **[Dynamic Media Open API Overview](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/assets/dynamicmedia/dynamic-media-open-apis/dynamic-media-open-apis-overview)** - DMwOAPI documentation and capabilities
- **[Universal Editor Custom Asset Picker](https://developer.adobe.com/uix/docs/extension-manager/extension-developed-by-adobe/configurable-asset-picker/)** - Asset picker configuration for Universal Editor


### 🌐 Live Examples

- **[External Images Example](https://ue--assets-blocks-ue--hlxsites.aem.live/external-images-example)** - Demonstrates external image decoration with DMwOAPI URLs
- **[Assets Blocks UE Site](https://ue--assets-blocks-ue--hlxsites.aem.live/)** - Full reference site with various asset examples and blocks
- **[Source Page](https://ue--assets-blocks-ue--hlxsites.aem.page/external-images-example)** - View the source HTML before JavaScript decoration

### 🔧 Code Repository

- **[AEM Assets Plugin Repository](https://github.com/adobe-rnd/aem-assets-plugin)** - Source code, latest updates, and issue tracking

### 🎓 Learning Resources

- **[AEM Assets Plugin Blocks](https://github.com/adobe-rnd/aem-assets-plugin/tree/main/blocks)** - Example blocks using the plugin (video, secure-assets)
- **[Plugin Tests](https://github.com/adobe-rnd/aem-assets-plugin/tree/main/tests)** - Unit tests showing usage patterns

---

## Summary

By following this comprehensive guide, you have:

1. ✅ **Enabled external image URL retention** for your UE-based site through Adobe
2. ✅ **Configured component model structure** (WITH `imageMimeType` field to use EDS flow)
3. ✅ **Installed and configured the AEM Assets Plugin** with URL prefix handlers
4. ✅ **Implemented frontend decoration** in your scripts to wrap images in `<picture>` elements
5. ✅ **Configured responsive breakpoints** for optimal image delivery across devices
6. ✅ **Verified the implementation** using live examples and browser DevTools
7. ✅ **Understood the underlying architecture** for debugging and customization

### Key Takeaways

- **⚠️ Component Model Structure is Critical**: `imageMimeType` field MUST be present to use EDS flow where external URL retention works
- **EDS Flow**: The `imageMimeType` field triggers Standard Edge Delivery flow that renders native `<img>` tags
- **Server-side retention** (Step 1) and **client-side decoration** (Steps 3-4) work together
- **URL prefix configuration** determines which handler processes each image
- **Handler functions** create optimized `<picture>` elements with responsive sources
- **Smart crop** provides art-directed responsive images for better visual presentation
- **Format optimization** (AVIF/WebP) significantly reduces bandwidth and improves performance

### Next Steps

1. **Test thoroughly** across different devices and browsers
2. **Monitor performance** using Lighthouse and Core Web Vitals
3. **Customize breakpoints** based on your design requirements
4. **Enable smart crop** for content images that benefit from art direction
5. **Stay updated** by pulling latest plugin changes periodically

Your images are now optimized for performance while leveraging the full power of AEM Assets and Dynamic Media! 🎉

---

**Questions or issues?** 

- Check the [Troubleshooting](#troubleshooting) section
- Review the [Live Examples](#live-examples)
- Reach out to your AEM Engineering team in your dedicated Slack channel
- Report bugs at [github.com/adobe-rnd/aem-assets-plugin/issues](https://github.com/adobe-rnd/aem-assets-plugin/issues)

---

*Last updated: November 2025*
