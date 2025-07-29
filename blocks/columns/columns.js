export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns and optimize LCP
  let isFirstImage = true;
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
          
          // Optimize LCP for the first image
          if (isFirstImage) {
            const img = pic.querySelector('img');
            if (img) {
              // Remove lazy loading for LCP image
              img.removeAttribute('loading');
              // Add fetchpriority for faster loading
              img.setAttribute('fetchpriority', 'high');
              // Add preload hint for critical image
              const preloadLink = document.createElement('link');
              preloadLink.rel = 'preload';
              preloadLink.as = 'image';
              preloadLink.href = img.src;
              document.head.appendChild(preloadLink);
            }
            isFirstImage = false;
          }
        }
      }
    });
  });
}
