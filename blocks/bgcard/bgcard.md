# Background Card Block

A full-height card block with a split layout featuring a background color on the left and a background image on the right. Perfect for quiz/survey interfaces.

## Structure

The block expects the following HTML structure:

```html
<div class="section bgcard-container" 
     data-background="#712418" 
     data-bgimage="https://example.com/image.png">
  <div class="bgcard-wrapper">
    <div class="bgcard">
      <div>
        <h2>MAKE</h2>
        <h2>YOUR MASALEDAANI</h2>
      </div>
      <div>
        <h4>Question 1/3</h4>
        <h3>What's your favourite type of movie?</h3>
      </div>
      <div>
        <p>
          <a href="#" title="Action-Packed Thriller">Action-Packed Thriller</a>
          <a href="#" title="Romantic Comedy">Romantic Comedy</a>
          <a href="#" title="Mystery & Suspense">Mystery & Suspense</a>
        </p>
      </div>
    </div>
  </div>
</div>
```

## Data Attributes

- `data-background`: Background color for the left content area (default: #712418)
- `data-bgimage`: Background image URL for the right image area

## Features

- **Split Layout**: Content on left (70%), image on right (30%)
- **Responsive Design**: Stacks vertically on mobile
- **Interactive Buttons**: Three adjacent option buttons with hover/selection states
- **Navigation**: "Next" button for progression
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Styling

The block creates a modern quiz interface with:
- White text on colored background
- Rounded button styling
- Smooth transitions and hover effects
- Full viewport height layout
- Right-aligned background image 