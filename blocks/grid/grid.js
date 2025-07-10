export default function decorate(block) {
  block.classList.add('grid-initialized');
  // Color tokens mapping
  const colorMap = {
    '{blue}': '#d9f3ff',
    '{indigo-blue}': '#000085',
    '{black}': '#000',
    '{white}': '#fff',
    // Add more as needed
  };

  // Wrap all rows in a grid container
  const grid = document.createElement('div');
  grid.className = 'grid-layout';

  const rows = [...block.children];
  const isTwoItems = rows.length === 2;

  rows.forEach((row, idx) => {
    const cells = [...row.children];
    const gridItem = document.createElement('div');
    gridItem.className = 'grid-item';

    // If only two items, place them in the bottom row
    if (isTwoItems) {
      // REMOVE these lines:
      // gridItem.style.gridRow = '2 / 3';
      // gridItem.style.minHeight = '490px';
      // gridItem.style.gridColumn = `${idx + 1} / ${idx + 2}`;
    }

    // First cell: color or image
    const firstCell = cells[0];
    let visual;
    if (firstCell.textContent.trim().startsWith('{') && firstCell.textContent.trim().endsWith('}')) {
      // Color token
      const colorToken = firstCell.textContent.trim();
      visual = document.createElement('div');
      visual.className = 'grid-color';
      visual.style.background = colorMap[colorToken] || '#eee';
    } else if (firstCell.querySelector('picture, img')) {
      // Image
      visual = firstCell.querySelector('picture, img').cloneNode(true);
      visual.classList.add('grid-image');
    } else {
      // Fallback: text
      visual = document.createElement('div');
      visual.textContent = firstCell.textContent;
      visual.className = 'grid-color';
      visual.style.background = '#eee';
    }

    // Second cell: text
    const secondCell = cells[1];
    const text = document.createElement('div');
    text.className = 'grid-text';
    text.innerHTML = secondCell ? secondCell.innerHTML : '';

    gridItem.appendChild(visual);
    gridItem.appendChild(text);
    grid.appendChild(gridItem);
  });

  if (isTwoItems) {
    grid.classList.add('only-two');
  }

  block.innerHTML = '';
  block.appendChild(grid);
} 