# Grid Card Block

A flexible grid layout block that displays content in card format with images, titles, descriptions, and metadata.

## Features

- **Responsive Grid Layout**: Automatically adjusts columns based on screen size
- **Card Design**: Clean, modern card design with hover effects
- **Image Support**: Handles both `<picture>` and `<img>` elements
- **Metadata Display**: Shows categories, dates, and authors
- **Clickable Cards**: Cards can be made clickable if they contain links
- **Multiple Layouts**: Supports different grid configurations and overlay styles

## Usage

### Basic HTML Structure

```html
<div class="gridcard">
  <div>
    <picture>
      <source media="(min-width: 600px)" srcset="image-large.jpg">
      <img src="image-small.jpg" alt="Card Image">
    </picture>
    <h3>Card Title</h3>
    <p>Card description text goes here. This can be a longer description.</p>
    <span class="category">Category</span>
    <time>2024-01-15</time>
    <span class="author">Author Name</span>
  </div>
  
  <div>
    <img src="image2.jpg" alt="Second Card">
    <h3>Second Card Title</h3>
    <p>Another card description.</p>
  </div>
</div>
```

### Layout Variations

#### Auto Grid (Default)
```html
<div class="gridcard">
  <!-- Cards will auto-arrange based on content -->
</div>
```

#### Fixed Column Grid
```html
<div class="gridcard grid-2">  <!-- 2 columns -->
<div class="gridcard grid-3">  <!-- 3 columns -->
<div class="gridcard grid-4">  <!-- 4 columns -->
```

#### Masonry Layout
```html
<div class="gridcard masonry">
  <!-- Cards will arrange in masonry style -->
</div>
```

#### Overlay Layout
```html
<div class="gridcard overlay">
  <!-- Text will overlay on images -->
</div>
```

## Content Structure

Each card can contain:

1. **Image**: `<picture>` or `<img>` element
2. **Title**: Any heading element (`h1`, `h2`, `h3`, etc.)
3. **Description**: `<p>` element
4. **Category**: Element with class `.category` or `data-category`
5. **Date**: `<time>` element or element with `data-date`
6. **Author**: Element with class `.author` or `data-author`
7. **Link**: `<a>` element (makes entire card clickable)

## Styling Options

### Grid Layouts
- **Auto-fit**: Automatically adjusts columns based on content
- **Fixed columns**: 2, 3, or 4 columns
- **Masonry**: Pinterest-style layout
- **Overlay**: Text overlays on images

### Responsive Behavior
- **Desktop**: Multiple columns
- **Tablet**: 2 columns
- **Mobile**: Single column

### Hover Effects
- Cards lift slightly on hover
- Images scale slightly
- Shadow increases

## Accessibility

- ARIA labels for screen readers
- Proper heading hierarchy
- Keyboard navigation support
- Alt text for images

## Customization

The block can be customized by:
- Adding CSS classes to the main container
- Modifying the CSS variables
- Overriding styles in your theme
- Adding custom JavaScript interactions 