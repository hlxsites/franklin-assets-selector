// Adding a utitlites example - not a final file
export default function addIcon(element, iconType, className = '') {
  if (iconType === 'arrow_chevron_right') {
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML =
      '<i class="icon-gt" aria-hidden="true" data-icon="arrow_chevron_right"></i>';
    iconSpan.classList = className;
    element.append(iconSpan);
  }
}
