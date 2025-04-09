/**
 * Mixes two colors based on a given weight.
 * @param {string} color1 - The first color in hex format (e.g., '#ffffff').
 * @param {string} color2 - The second color in hex format (e.g., '#b5b5b5').
 * @param {number} weight - The weight of the second color (0 to 1).
 * @returns {string} The mixed color in hex format.
 */
function mixColors(color1, color2, weight) {
  const d2h = (d) => d.toString(16).padStart(2, '0'); // Convert decimal to hex
  const h2d = (h) => parseInt(h, 16); // Convert hex to decimal

  color1 = color1.replace('#', '');
  color2 = color2.replace('#', '');

  let mixedColor = '#';
  for (let i = 0; i < 3; i++) {
    const c1 = h2d(color1.substring(i * 2, i * 2 + 2));
    const c2 = h2d(color2.substring(i * 2, i * 2 + 2));
    const mix = Math.round(c1 * (1 - weight) + c2 * weight);
    mixedColor += d2h(mix);
  }

  return mixedColor;
}

/**
 * Updates the CSS variables for toast colors.
 * @param {string} color - The base color for the toast notifications.
 */
function updateToastColors(color) {
  document.documentElement.style.setProperty('--toast-color', color);
  document.documentElement.style.setProperty(
    '--toast-color-lighter-40',
    mixColors(color, '#FFFFFF', 0.4)
  );
  document.documentElement.style.setProperty(
    '--toast-color-darker-60',
    mixColors(color, '#000000', 0.6)
  );
  document.documentElement.style.setProperty(
    '--toast-color-darker-20',
    mixColors(color, '#000000', 0.2)
  );
}

/**
 * Creates and displays a toast notification with fade-in and fade-out effects.
 * @param {HTMLElement} parentNode - The parent element where the toast will be appended.
 * @param {string} state - The state of the notification ('success', 'danger').
 * @param {string} heading - The heading of the notification.
 * @param {string} message - The message content of the notification.
 * @param {number} [duration=5000] - The duration (in ms) for which the toast is displayed.
 * @param {boolean} [hasCloseButton=true] - Whether to show a close button on the toast.
 * @param {string} [id="extension-toast"] - The ID of the toast element.
 */
function toast(
  parentNode,
  state,
  heading,
  message,
  duration = 5000,
  hasCloseButton = true,
  id = 'extension-toast'
) {
  if (!parentNode || document.querySelector(`#${id}`)) return;

  const stateConfig = {
    success: {
      color: '#537c37',
      icon: 'M3.75 12a8.25 8.25 0 1 1 16.5 0 8.25 8.25 0 0 1-16.5 0ZM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.573 7.234a.75.75 0 1 0-1.146-.968l-4.973 5.877L8.03 11.97a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.102-.046l5.5-6.5Z',
    },
    danger: {
      color: '#d52f2f',
      icon: 'M8.272 2.25a.75.75 0 0 0-.53.22L2.47 7.742a.75.75 0 0 0-.22.53v7.456c0 .199.079.39.22.53l5.272 5.272c.14.141.331.22.53.22h7.456a.75.75 0 0 0 .53-.22l5.272-5.272a.75.75 0 0 0 .22-.53V8.272a.75.75 0 0 0-.22-.53L16.258 2.47a.75.75 0 0 0-.53-.22zM3.75 8.583 8.583 3.75h6.834l4.833 4.833v6.834l-4.833 4.833H8.583L3.75 15.417zm5.28-.613a.75.75 0 0 0-1.06 1.06L10.94 12l-2.97 2.97a.75.75 0 1 0 1.06 1.06L12 13.06l2.97 2.97a.75.75 0 1 0 1.06-1.06L13.06 12l2.97-2.97a.75.75 0 0 0-1.06-1.06L12 10.94z',
    },
    info: {
      color: '#4f77b1',
      icon: 'M4 3.25a.75.75 0 0 0-.75.75v16c0 .414.336.75.75.75h16a.75.75 0 0 0 .75-.75V4a.75.75 0 0 0-.75-.75zm.75 16V4.75h14.5v14.5zM11 7.75a1 1 0 1 1 2 0 1 1 0 0 1-2 0M10.5 10a.75.75 0 0 0 0 1.5h.75v4h-.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-.75v-4.75A.75.75 0 0 0 12 10z',
    },
    warning: {
      color: '#ed9d19',
      icon: 'M12 2.25a.75.75 0 0 1 .656.387l9.527 17.25A.75.75 0 0 1 21.526 21H2.474a.75.75 0 0 1-.657-1.113l9.527-17.25A.75.75 0 0 1 12 2.25m8.255 17.25L12 4.551 3.745 19.5zM12 8.75a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 .75-.75m0 6.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2',
    },
  };

  const { color, icon } = stateConfig[state] || stateConfig.success;
  updateToastColors(color);

  const toast = document.createElement('div');
  toast.className = 'toast show-toast';

  const inlineContainer = document.createElement('div');
  inlineContainer.className = 'inline-container';

  const svgIcon = createSvgElement(icon);

  const toastHeading = document.createElement('h2');
  toastHeading.textContent = heading;

  inlineContainer.appendChild(svgIcon);
  inlineContainer.appendChild(toastHeading);

  if (hasCloseButton) {
    const buttonText = document.createElement('span');
    buttonText.innerHTML = 'X';

    const closeButton = document.createElement('button');
    closeButton.onclick = () => hideToast();
    closeButton.appendChild(buttonText);
    inlineContainer.appendChild(closeButton);
  }

  const toastMessage = document.createElement('p');
  toastMessage.textContent = message;

  toast.appendChild(inlineContainer);
  toast.appendChild(toastMessage);
  parentNode.appendChild(toast);

  setTimeout(hideToast, duration);

  function hideToast() {
    toast.classList.remove('show-toast');
    toast.classList.add('hide-toast');
    setTimeout(() => toast.remove(), 1000);
  }
}
