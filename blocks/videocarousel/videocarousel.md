# Video Carousel Block

A carousel block designed specifically for displaying videos with navigation arrows and pagination dots.

## Features

- **Video Embedding**: Automatically converts Scene7 video URLs to iframe embeds
- **Navigation**: Left and right arrow buttons for manual navigation
- **Pagination**: Dot indicators showing current slide position
- **Auto-play**: Automatic slide transitions every 8 seconds
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: ARIA labels and keyboard navigation support

## Usage

### HTML Structure

```html
<div class="videocarousel">
  <div>
    <a href="https://s7g10.scene7.com/s7viewers/html5/SmartCropVideoViewer.html?asset=apoorvXYZ/IndigoDemoFinal-AVS&config=apoorvXYZ/SmartCropVideo&serverUrl=https://s7g10.scene7.com/is/image/&contenturl=https://s7g10.scene7.com/is/content/&videoserverurl=https://s7g10.scene7.com/is/content" title="Video Title 1">Video 1</a>
  </div>
  <div>
    <a href="https://s7g10.scene7.com/s7viewers/html5/SmartCropVideoViewer.html?asset=apoorvXYZ/IndigoDemoFinal-AVS&config=apoorvXYZ/SmartCropVideo&serverUrl=https://s7g10.scene7.com/is/image/&contenturl=https://s7g10.scene7.com/is/content/&videoserverurl=https://s7g10.scene7.com/is/content" title="Video Title 2">Video 2</a>
  </div>
</div>
```

### Key Features

1. **Scene7 Video URLs**: The block automatically detects and embeds Scene7 video URLs
2. **Multiple Videos per Slide**: Each slide can contain multiple videos side by side
3. **Responsive Design**: Videos scale appropriately on different devices
4. **Navigation Controls**: Red circular arrow buttons for easy navigation
5. **Pagination Dots**: Visual indicators for slide position

### Styling

- **Container**: Centered with max-width of 1200px
- **Videos**: Rounded corners with hover effects
- **Navigation**: Red circular buttons with white arrows
- **Pagination**: Small circular dots below the carousel

### Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- Focus management for interactive elements
- Semantic HTML structure

## Customization

The block can be customized by modifying the CSS variables and classes in `videocarousel.css`. 