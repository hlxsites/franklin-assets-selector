import { fetchPlaceholders } from '../../scripts/aem.js';

function createGridCard(element, cardIndex) {
  const card = document.createElement('div');
  card.classList.add('gridcard-item');
  card.dataset.cardIndex = cardIndex;

  if (cardIndex === 0) {
    // First card - text only with light beige background
    const title = document.createElement('h2');
    title.classList.add('gridcard-title');
    title.textContent = 'TALES OF SPICES';
    
    const description = document.createElement('p');
    description.classList.add('gridcard-description');
    description.textContent = 'Discover the rich heritage and stories behind our finest spices';
    
    const cta = document.createElement('a');
    cta.classList.add('gridcard-cta');
    cta.href = '#';
    cta.textContent = 'SWIPE TO LEARN →';
    
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(cta);
  } else if (cardIndex === 1) {
    // Second card - Dhaniya spice card
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('gridcard-image');
    
    // Process image
    const imageElement = element.querySelector('picture, img');
    if (imageElement) {
      if (imageElement.tagName === 'PICTURE') {
        imageContainer.appendChild(imageElement.cloneNode(true));
      } else {
        const img = document.createElement('img');
        img.src = imageElement.src || imageElement.getAttribute('data-src');
        img.alt = imageElement.alt || '';
        img.loading = 'lazy';
        imageContainer.appendChild(img);
      }
    }
    
    const title = document.createElement('h3');
    title.classList.add('gridcard-title');
    title.textContent = 'Dhaniya';
    
    const description = document.createElement('p');
    description.classList.add('gridcard-description');
    description.textContent = 'Dhaniya is one of the few spices used in every stage of Indian cooking, from tempering to garnish.';
    
    const cta = document.createElement('a');
    cta.classList.add('gridcard-cta');
    cta.href = '#';
    cta.textContent = 'VIEW NOW →';
    
    card.appendChild(imageContainer);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(cta);
  } else if (cardIndex === 2) {
    // Third card - Black Pepper spice card
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('gridcard-image');
    
    // Process image
    const imageElement = element.querySelector('picture, img');
    if (imageElement) {
      if (imageElement.tagName === 'PICTURE') {
        imageContainer.appendChild(imageElement.cloneNode(true));
      } else {
        const img = document.createElement('img');
        img.src = imageElement.src || imageElement.getAttribute('data-src');
        img.alt = imageElement.alt || '';
        img.loading = 'lazy';
        imageContainer.appendChild(img);
      }
    }
    
    const title = document.createElement('h3');
    title.classList.add('gridcard-title');
    title.textContent = 'Black Pepper';
    
    const description = document.createElement('p');
    description.classList.add('gridcard-description');
    description.textContent = 'Black pepper, known as the "King of Spices," was once so valuable in ancient India that it was used as currency and traded for gold.';
    
    const cta = document.createElement('a');
    cta.classList.add('gridcard-cta');
    cta.href = '#';
    cta.textContent = 'VIEW NOW →';
    
    card.appendChild(imageContainer);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(cta);
  } else if (cardIndex === 3) {
    // Fourth card - Turmeric spice card
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('gridcard-image');
    
    // Process image
    const imageElement = element.querySelector('picture, img');
    if (imageElement) {
      if (imageElement.tagName === 'PICTURE') {
        imageContainer.appendChild(imageElement.cloneNode(true));
      } else {
        const img = document.createElement('img');
        img.src = imageElement.src || imageElement.getAttribute('data-src');
        img.alt = imageElement.alt || '';
        img.loading = 'lazy';
        imageContainer.appendChild(img);
      }
    }
    
    const title = document.createElement('h3');
    title.classList.add('gridcard-title');
    title.textContent = 'Turmeric';
    
    const description = document.createElement('p');
    description.classList.add('gridcard-description');
    description.textContent = 'Turmeric, often called the "Golden Spice," has been used in Indian cooking for over 4,000 years.';
    
    const cta = document.createElement('a');
    cta.classList.add('gridcard-cta');
    cta.href = '#';
    cta.textContent = 'VIEW NOW →';
    
    card.appendChild(imageContainer);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(cta);
  }

  return card;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  
  // Create grid container
  const gridContainer = document.createElement('div');
  gridContainer.classList.add('gridcard-grid');
  
  // Process each card element (we need 4 cards total)
  const elements = block.querySelectorAll(':scope > div');
  
  // Create 4 cards regardless of how many elements are in the HTML
  for (let i = 0; i < 4; i++) {
    const element = elements[i] || document.createElement('div'); // Use existing element or create placeholder
    const card = createGridCard(element, i);
    gridContainer.appendChild(card);
    if (elements[i]) {
      elements[i].remove(); // Remove original element
    }
  }
  
  // Add grid to block
  block.appendChild(gridContainer);
  
  // Add accessibility attributes
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', placeholders.gridcard || 'Tales of Spices');
  
  // Add lazy loading for images
  const images = block.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
} 