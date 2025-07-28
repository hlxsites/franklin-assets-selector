import { fetchPlaceholders } from '../../scripts/aem.js';

const INTERVAL_TIME = 8000; // 8 seconds for video carousel

function stopAutoSlide(block) {
  clearInterval(block.autoSlideInterval);
}

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;

  const slidesWrapper = block.querySelector('.videocarousel-slides');
  const isMobile = window.innerWidth <= 600;
  const slideWidth = isMobile ? slidesWrapper.offsetWidth : slidesWrapper.offsetWidth / 2; // One video on mobile, two on desktop
  const scrollPosition = slideIndex * slideWidth;
  
  slidesWrapper.scrollTo({
    left: scrollPosition,
    behavior: 'smooth'
  });

  const indicators = block.querySelectorAll('.videocarousel-slide-indicator button');
  indicators.forEach((indicatorButton, idx) => {
    indicatorButton.classList.remove('filling');
    indicatorButton.offsetWidth; // Trigger reflow to restart the CSS animation
    if (idx === slideIndex) {
      indicatorButton.classList.add('filling');
      indicatorButton.setAttribute('aria-current', 'true');
    } else {
      indicatorButton.removeAttribute('aria-current');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.videocarousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;

  // Update active slide and indicators
  updateActiveSlide(block, realSlideIndex);
}

function startAutoSlide(block) {
  const intervalTime = INTERVAL_TIME;
  block.autoSlideInterval = setInterval(() => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  }, intervalTime);
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.videocarousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
      stopAutoSlide(block);
      startAutoSlide(block);
    });
  });

  const prevButton = block.querySelector('.slide-prev');
  const nextButton = block.querySelector('.slide-next');
  
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
      stopAutoSlide(block);
      startAutoSlide(block);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
      stopAutoSlide(block);
      startAutoSlide(block);
    });
  }

  // Handle scroll events to update indicators
  const slidesWrapper = block.querySelector('.videocarousel-slides');
  slidesWrapper.addEventListener('scroll', () => {
    const isMobile = window.innerWidth <= 600;
    const slideWidth = isMobile ? slidesWrapper.offsetWidth : slidesWrapper.offsetWidth / 2;
    const currentIndex = Math.round(slidesWrapper.scrollLeft / slideWidth);
    const indicators = block.querySelectorAll('.videocarousel-slide-indicator button');
    
    indicators.forEach((indicatorButton, idx) => {
      if (idx === currentIndex) {
        indicatorButton.setAttribute('aria-current', 'true');
      } else {
        indicatorButton.removeAttribute('aria-current');
      }
    });
  });
}

function createVideoSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `videocarousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('videocarousel-slide');

  // Process video links in the row
  const videoLinks = row.querySelectorAll('a[href*="scene7.com"]');
  videoLinks.forEach((link) => {
    const videoUrl = link.getAttribute('href');
    const videoTitle = link.getAttribute('title') || 'Video';
    
    // Create iframe for video embedding
    const iframe = document.createElement('iframe');
    iframe.src = videoUrl;
    iframe.title = videoTitle;
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allowfullscreen', 'true');
    
    // Replace the link content with iframe
    link.innerHTML = '';
    link.appendChild(iframe);
  });

  // Move all content from row to slide
  while (row.firstChild) {
    slide.appendChild(row.firstChild);
  }

  return slide;
}

let videocarouselId = 0;

export default async function decorate(block) {
  videocarouselId += 1;
  block.setAttribute('id', `videocarousel-${videocarouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.videocarousel || 'Video Carousel');

  const container = document.createElement('div');
  container.classList.add('videocarousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('videocarousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.videocarouselSlideControls || 'Video Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('videocarousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('videocarousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${placeholders.previousVideo || 'Previous Video'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextVideo || 'Next Video'}"></button>
    `;

    container.append(slideNavButtons);
  }

  // Calculate how many pagination dots we need
  // For desktop: 2 videos per view, so dots = Math.ceil(total videos / 2)
  // For mobile: 1 video per view, so dots = total videos
  const totalVideos = rows.length;
  const isMobile = window.innerWidth <= 600;
  const dotsNeeded = isMobile ? totalVideos : Math.ceil(totalVideos / 2);

  rows.forEach((row, idx) => {
    const slide = createVideoSlide(row, idx, videocarouselId);
    slidesWrapper.append(slide);
    row.remove();
  });

  // Create pagination dots based on calculated number
  if (slideIndicators) {
    for (let i = 0; i < dotsNeeded; i++) {
      const indicator = document.createElement('li');
      indicator.classList.add('videocarousel-slide-indicator');
      indicator.dataset.targetSlide = i;
      indicator.innerHTML = `<button type="button"><span>${placeholders.showVideo || 'Show Video'} ${i + 1} ${placeholders.of || 'of'} ${dotsNeeded}</span></button>`;
      slideIndicators.append(indicator);
    }
  }

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
    startAutoSlide(block);
    
    // Update pagination dots on window resize
    window.addEventListener('resize', () => {
      const isMobile = window.innerWidth <= 600;
      const dotsNeeded = isMobile ? totalVideos : Math.ceil(totalVideos / 2);
      const currentIndicators = block.querySelectorAll('.videocarousel-slide-indicator');
      
      // Remove existing indicators
      currentIndicators.forEach(indicator => indicator.remove());
      
      // Create new indicators based on current screen size
      if (slideIndicators) {
        for (let i = 0; i < dotsNeeded; i++) {
          const indicator = document.createElement('li');
          indicator.classList.add('videocarousel-slide-indicator');
          indicator.dataset.targetSlide = i;
          indicator.innerHTML = `<button type="button"><span>${placeholders.showVideo || 'Show Video'} ${i + 1} ${placeholders.of || 'of'} ${dotsNeeded}</span></button>`;
          slideIndicators.append(indicator);
        }
      }
    });
  }
} 