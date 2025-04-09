/**
 * Creates a tooltip that appears when hovering over an element.
 * @param {HTMLElement} anchorElement - The element that triggers the tooltip.
 * @param {string} text - The text to display in the tooltip.
 * @param {string} backgroundColor - The background color of the tooltip (e.g., '#ffffff').
 * @param {string} borderColor - The border color of the tooltip (e.g., '#ffffff').
 * @param {string} textColor - The text color of the tooltip (e.g., '#ffffff').
 * @returns {HTMLElement} The created tooltip element.
 */
function createTooltip(
  anchorElement,
  text,
  backgroundColor,
  borderColor,
  textColor
) {
  const tooltip = document.createElement('div');
  tooltip.textContent = text;
  tooltip.style.cssText = `
    position: absolute;
    background-color: ${backgroundColor};
    border-radius: 4px;
    border: 1px solid ${borderColor};
    color: ${textColor};
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s;
  `;
  document.body.appendChild(tooltip);

  anchorElement.addEventListener('mouseenter', (e) => {
    tooltip.style.left = `${e.pageX + 8}px`;
    tooltip.style.top = `${e.pageY + 16}px`;
    tooltip.style.opacity = '1';
  });

  anchorElement.addEventListener('mousemove', (e) => {
    tooltip.style.left = `${e.pageX + 8}px`;
    tooltip.style.top = `${e.pageY + 16}px`;
  });

  anchorElement.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
  });
}
