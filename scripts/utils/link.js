export default function textLink(props) {
  if (!props.href || !props.title) {
    throw new Error('href and title are required parameters');
  }

  const attributes = [
    `href='${props.href}'`,
    `title='${props.title}'`,
    props.className ? `class='${props.className}'` : '',
    props.target ? `target='${props.target}'` : '',
    `aria-label='${props.ariaLabel || props.title}'`,
    'tabindex="0"',
  ]
    .filter(Boolean)
    .join(' ');

  const content = props.cover ? props.markup : props.title;

  return `<a ${attributes}>${content}</a>`;
}
