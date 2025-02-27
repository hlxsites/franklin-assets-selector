// rating: number like 3.7
// max: highest possible rating
// color: hex color value
// spacing: in px
export function generateStarRating({rating, max, color, spacing}) {
  const size = 24;
  const starFull = `<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" fill="${color}"/>`;
  const starEmpty = `<path d="M12 2l2.588 5.346 5.907.815-4.27 4.167 1.007 5.79L12 15.9l-5.232 2.918 1.007-5.79-4.27-4.167 5.907-.815z" fill="none" stroke="${color}" stroke-width="1"/>`;
  
  let svg = `<svg class="star" width="${max * (size + spacing)}" height="${size}" viewBox="0 0 ${max * (size + spacing)} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  
  for (let i = 0; i < max; i++) {
      const xPos = i * (size + spacing);
      if (rating >= i + 1) {
          svg += `<g transform="translate(${xPos}, 0)">${starFull}</g>`; // Full star
      } else if (rating > i && rating < i + 1) {
          svg += `<g transform="translate(${xPos}, 0)">
                      <defs>
                          <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="${(rating - i) * 100}%" style="stop-color:${color};stop-opacity:1" />
                              <stop offset="${(rating - i) * 100}%" style="stop-color:white;stop-opacity:1" />
                          </linearGradient>
                      </defs>
                      <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" fill="url(#grad${i})" stroke="${color}" stroke-width="1"/>
                  </g>`;
      } else {
          svg += `<g transform="translate(${xPos}, 0)">${starEmpty}</g>`; // Empty star
      }
  }
  
  svg += `</svg>`;
  return svg;
} 