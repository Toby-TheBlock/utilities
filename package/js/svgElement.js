/**
 * Creates a SVG element.
 * @param {string} vectorData - The SVG path data for the icon.
 * @param {string} fillColor - The fill color for the icon.
 * @returns {SVGElement} The created SVG element.
 */
function createSvgElement(vectorData, fillColor = 'currentColor') {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('width', '24');
  icon.setAttribute('height', '24');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');

  const iconPath = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );
  iconPath.setAttribute('d', vectorData);
  iconPath.setAttribute('fill-rule', 'evenodd');
  iconPath.setAttribute('clip-rule', 'evenodd');
  iconPath.setAttribute('fill', fillColor);

  icon.appendChild(iconPath);
  return icon;
}
