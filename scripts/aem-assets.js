// Define the prod domain
const PROD_DOMAIN = 'assets-addon.adobeaemcloud.com';

// Define the flag
const REWRITE_DELIVERY_URLS = true; // Set this to true or false based on your needs

// Function to replace domain in URL if it matches the specified pattern
function replaceDomainInUrl(url) {
  const regex = /^https:\/\/delivery-p\d+-e\d+\.adobeaemcloud\.com\/adobe\/assets\/urn:aaid:aem/i;
  if (regex.test(url)) {
    return url.replace(/^https:\/\/[^/]+/, `https://${PROD_DOMAIN}`);
  }
  return url;
}

// Check if the flag is set to true
if (REWRITE_DELIVERY_URLS) {
  // Find and replace URLs in anchor tags
  document.querySelectorAll('a[href]').forEach((anchor) => {
    anchor.href = replaceDomainInUrl(anchor.href);
  });

  // Find and replace URLs in img src attributes
  document.querySelectorAll('img[src]').forEach((img) => {
    img.src = replaceDomainInUrl(img.src);
  });

  // Find and replace URLs in video src attributes
  document.querySelectorAll('video[src]').forEach((video) => {
    video.src = replaceDomainInUrl(video.src);
  });

  // Find and replace URLs in source tags within picture tags
  document.querySelectorAll('picture source[srcset]').forEach((source) => {
    source.srcset = replaceDomainInUrl(source.srcset);
  });

  // Find and replace URLs in source tags within video tags
  document.querySelectorAll('video source[src]').forEach((source) => {
    source.src = replaceDomainInUrl(source.src);
  });

  // Find and process alt attributes if they contain JSON objects
  document.querySelectorAll('[alt]').forEach((element) => {
    try {
      // Attempt to parse the alt attribute as JSON
      const altContent = JSON.parse(element.alt);

      // Check if the parsed content is an object and contains the "deliveryUrl" property
      if (altContent && typeof altContent === 'object' && altContent.deliveryUrl) {
        // Replace the deliveryUrl in the JSON object
        altContent.deliveryUrl = replaceDomainInUrl(altContent.deliveryUrl);

        // Update the alt attribute with the modified JSON string
        element.alt = JSON.stringify(altContent);
      }
    } catch (e) {
      // If parsing fails, it means the alt attribute is not JSON, so do nothing
    }
  });
}
