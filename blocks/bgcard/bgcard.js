import { fetchPlaceholders } from '../../scripts/aem.js';

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  
  // Get background color and image from data attributes
  const section = block.closest('.section');
  const bgColor = section?.dataset.background || '#712418';
  const bgImage = section?.dataset.bgimage || '';
  
  // Create the main structure
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('bgcard-content');
  
  const imageDiv = document.createElement('div');
  imageDiv.classList.add('bgcard-image');
  
  // Apply background color to the entire block
  block.style.backgroundColor = bgColor;
  
  // Apply background image to image area
  if (bgImage) {
    imageDiv.style.backgroundImage = `url(${bgImage})`;
  }
  
  // Find the content div that contains all the elements
  const contentContainer = block.querySelector(':scope > div > div');
  
  if (contentContainer) {
    // Process h2 elements (header)
    const h2Elements = contentContainer.querySelectorAll('h2');
    if (h2Elements.length > 0) {
      const headerDiv = document.createElement('div');
      headerDiv.classList.add('bgcard-header');
      
      h2Elements.forEach((h2, h2Index) => {
        if (h2Index === 0) {
          // First h2 is the title
          const titleDiv = document.createElement('div');
          titleDiv.classList.add('bgcard-title');
          titleDiv.textContent = h2.textContent;
          headerDiv.appendChild(titleDiv);
        } else {
          // Second h2 is the subtitle
          const subtitleDiv = document.createElement('div');
          subtitleDiv.classList.add('bgcard-subtitle');
          subtitleDiv.textContent = h2.textContent;
          headerDiv.appendChild(subtitleDiv);
        }
      });
      
      contentDiv.appendChild(headerDiv);
    }
    
    // Process h4 element (progress)
    const h4Element = contentContainer.querySelector('h4');
    if (h4Element) {
      const progressDiv = document.createElement('div');
      progressDiv.classList.add('bgcard-progress');
      progressDiv.textContent = h4Element.textContent;
      contentDiv.appendChild(progressDiv);
    }
    
    // Process h3 element (question)
    const h3Element = contentContainer.querySelector('h3');
    if (h3Element) {
      const questionDiv = document.createElement('div');
      questionDiv.classList.add('bgcard-question');
      questionDiv.textContent = h3Element.textContent;
      contentDiv.appendChild(questionDiv);
    }
    
    // Process p element (options)
    const pElement = contentContainer.querySelector('p');
    if (pElement) {
      const optionsDiv = document.createElement('div');
      optionsDiv.classList.add('bgcard-options');
      
      const links = pElement.querySelectorAll('a');
      links.forEach((link) => {
        const optionDiv = document.createElement('a');
        optionDiv.classList.add('bgcard-option');
        optionDiv.href = link.href;
        optionDiv.textContent = link.textContent;
        optionDiv.title = link.title;
        
        // Add click handler for selection
        optionDiv.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Remove selected class from all options
          optionsDiv.querySelectorAll('.bgcard-option').forEach(opt => {
            opt.classList.remove('selected');
          });
          
          // Add selected class to clicked option
          optionDiv.classList.add('selected');
        });
        
        optionsDiv.appendChild(optionDiv);
      });
      
      contentDiv.appendChild(optionsDiv);
    }
  }
  
  // Add navigation button
  const navigationDiv = document.createElement('div');
  navigationDiv.classList.add('bgcard-navigation');
  
  const nextButton = document.createElement('a');
  nextButton.classList.add('bgcard-next');
  nextButton.href = '#';
  nextButton.textContent = 'Next';
  nextButton.addEventListener('click', (e) => {
    e.preventDefault();
    // Handle next button click - you can add your logic here
    console.log('Next button clicked');
  });
  
  navigationDiv.appendChild(nextButton);
  contentDiv.appendChild(navigationDiv);
  
  // Clear the block and add new structure
  block.innerHTML = '';
  block.appendChild(contentDiv);
  block.appendChild(imageDiv);
  
  // Add accessibility attributes
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', placeholders.bgcard || 'Background Card');
} 