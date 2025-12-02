export default function trapTabKey(e, firstFocusableElement, lastFocusableElement) {
  if (e.key !== 'Tab') return;

  if (e.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstFocusableElement) {
      e.preventDefault();
      lastFocusableElement.focus();
    }
  } else if (document.activeElement === lastFocusableElement) {
    // Tab
    e.preventDefault();
    firstFocusableElement.focus();
  }
}
