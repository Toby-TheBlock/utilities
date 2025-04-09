/**
 * Communicates with the service worker to retrieve data from a database.
 * @param {string} portName - The name of the port to connect to.
 * @param {object} message - The message to send to the service worker.
 * @returns {Promise<object>} A promise that resolves to the data received from the database.
 */
function communicateWithBackground(portName, message) {
  return new Promise((resolve, reject) => {
    const extensionAPI = typeof browser !== 'undefined' ? browser : chrome;
    const port = extensionAPI.runtime.connect({ name: portName });

    const timeout = setTimeout(() => {
      console.error(`Timeout: No response for ${portName}`);
      reject(new Error(`Timeout: No response received for ${portName}`));
      port.disconnect();
    }, 3000);

    port.postMessage(message);

    port.onMessage.addListener((response) => {
      clearTimeout(timeout);
      resolve(response.data);
    });

    port.onDisconnect.addListener(() => {
      clearTimeout(timeout);
      reject(new Error(`Port disconnected before response: ${portName}`));
    });
  });
}

/**
 * Listens for messages from the background script.
 * @param {function} callback - The callback function to execute when a message is received.
 */
function listenForMessageFromBackground(callback) {
  const extensionAPI = typeof browser !== 'undefined' ? browser : chrome;
  extensionAPI.runtime.onMessage.addListener(callback);
}

/**
 * Creates an event handler based on a set of provided instructions.
 * The handlers created are either of type event, observer, or run-once.
 * @param {object} handler - The configuration object for the event handler.
 * @returns {void}
 */
function createEventHandler(handler) {
  try {
    if (
      handler.hasOwnProperty('method') &&
      (handler.method === 'executeOnce' ||
        (handler.method === 'mutation' && !handler.observer) ||
        (handler.method === 'event' && !handler.created) ||
        (handler.method === 'interval' && !handler.created)) &&
      (!handler.hasOwnProperty('createCondition') || handler.createCondition())
    ) {
      let node = document;
      switch (handler.method) {
        case 'mutation':
          setTimeout(
            () => {
              node = handler.index
                ? document.querySelectorAll(handler.accessor)[handler.index]
                : document.querySelector(handler.accessor);

              if (node) {
                handler.observer = createObserver(
                  node,
                  handler.callback,
                  handler.observeAttributes,
                  handler.observeChildList
                );
              } else {
                setTimeout(createEventHandler(handler), 3000);
              }
            },
            handler.hasOwnProperty('delay') ? handler.delay : 0
          );
          break;
        case 'event':
          if (handler.hasOwnProperty('accessor'))
            node = document.querySelector(handler.accessor);

          if (node) {
            node.addEventListener(handler.eventListener, handler.callback);
            if (handler.created !== undefined) handler.created = true;
          } else {
            setTimeout(createEventHandler(handler), 3000);
          }
          break;
        case 'executeOnce':
          setTimeout(
            async () => handler.callback(),
            handler.hasOwnProperty('delay') ? handler.delay : 0
          );
          break;
        case 'interval':
          setInterval(() => handler.callback(), handler.timeout);
          handler.created = true;
          break;
      }
    }
  } catch (e) {
    handleError(e, () => setTimeout(createEventHandler(handler), 5000));
  }
}

/**
 * Creates a DOM observer.
 * @param {HTMLElement} targetNode - The target DOM element to observe.
 * @param {function} action - The callback function to execute when mutations occur.
 * @param {boolean} observeAttributes - Flag to indicate whether to observe attribute changes.
 * @param {boolean} [observeChildList=true] - Flag to indicate whether to observe child list changes.
 * @returns {MutationObserver} The created MutationObserver.
 */
function createObserver(
  targetNode,
  action,
  observeAttributes,
  observeChildList = true
) {
  const callback = (mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        action();
      }
    }
  };

  const config = {
    attributes: observeAttributes,
    childList: observeChildList,
    subtree: true,
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);

  return observer;
}

var autoSaveTimeout = null;

/**
 * Debounces a function call to prevent it from being called too frequently.
 * @param {function} callbackFunction - The function to debounce.
 * @param {number} [delay=500] - The delay in milliseconds before the function is called.
 */
function handleChange(callbackFunction, delay = 500) {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    callbackFunction();
  }, delay);
}

/**
 * Helper function for making API GET requests.
 * @param {string} path - The URL to fetch.
 * @param {function} [onError=handleError] - Optional error handler function.
 * @returns {Promise<Response|undefined>} The response object or undefined if an error occurred.
 */
async function getRequest(path, onError = handleError) {
  try {
    const requestInit = { headers: {} };
    const response = await fetch(path, requestInit);

    return response.ok ? response : undefined;
  } catch (err) {
    if (err instanceof Error && onError) onError(err);
  }
}

/**
 * Helper function for making API POST requests.
 * @param {string} path - The URL to fetch.
 * @param {string} body - The request body to send.
 * @param {function} [onError=handleError] - Optional error handler function.
 * @returns {Promise<Response|undefined>} The response object or undefined if an error occurred.
 */
async function postRequest(path, body, onError = handleError) {
  try {
    const url = getApiUrl(path);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...(typeof body === 'string' ? { body } : { body: JSON.stringify(body) }),
    });

    return response;
  } catch (err) {
    if (err instanceof Error && onError) onError(err);
  }
}

function handleError(err) {
  console.error('API request failed', err);
}

/**
 * Checks if the HTML content at the specified path includes the given text.
 * @param {string} path - The URL to fetch.
 * @param {string} text - The text to search for in the HTML content.
 * @returns {Promise<boolean>} A promise that resolves to true if the text is found, false otherwise.
 */
async function doesHTMLIncludeText(path, text) {
  const res = await getRequest(path);

  if (!res) return false;

  const html = await res.text();
  return html.includes(text);
}

/**
 * Checks if the given date string represents today's date.
 * @param {string} dateString - The date string to check.
 * @returns {boolean} True if the date string is today, false otherwise.
 */
function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Retrieves data from a data store based on the provided store name and source paths.
 * @param {string} storeName - The name of the data store.
 * @param {string|string[]} sourcePaths - The paths to retrieve data from.
 * @returns {Promise<any>} A promise that resolves to the retrieved data.
 */
async function getDataFromDataStore(storeName, sourcePaths) {
  const response = await fetch(
    `https://toby-theblock.github.io/utilities/data-store/${storeName}.json`
  );

  if (!response.ok) return undefined;
  const storeData = await response.json();

  return getValuesFromObjectByPath(storeData, sourcePaths);
}

/**
 * Searches for a specific value in an object based on the provided paths.
 * @param {object} obj - The object to search in.
 * @param {string|string[]} paths - The paths to search for the value.
 * @returns {any|any[]} The found value(s) or an empty array if none were found.
 */
function getValuesFromObjectByPath(obj, paths) {
  const allPaths = Array.isArray(paths)
    ? paths.map((p) => p.split('/'))
    : [paths.split('/')];
  const results = [];

  for (const pathKeys of allPaths) {
    if (pathKeys.length === 0) continue;

    // Extract the last key as the accessor
    const accessor = pathKeys.pop();
    const valueAtPath = traverseBasedOnPath(obj, pathKeys);

    if (valueAtPath !== undefined) {
      const finalValue = Array.isArray(valueAtPath)
        ? valueAtPath.map((item) => item?.[accessor]).filter(Boolean)
        : valueAtPath?.[accessor];

      if (finalValue !== undefined) {
        results.push(finalValue);
      }
    }
  }

  return results.length > 1 ? results : results[0];
}

/**
 * Traverses an object based on the given path keys, handling `[n]` notation for arrays.
 * @param {object} obj - The object to traverse.
 * @param {string[]} pathKeys - The keys to traverse the object.
 * @returns {any} The value at the end of the traversal or undefined if not found.
 */
function traverseBasedOnPath(obj, pathKeys) {
  let current = obj;

  for (const key of pathKeys) {
    if (current === undefined || current === null) break;

    if (key === '[n]') {
      // If the key is [n], ensure we're dealing with an array
      if (!Array.isArray(current)) return undefined;
      // Flatten results by mapping over each item in the array and continuing traversal
      current = current
        .map((item) => item)
        .filter(Boolean)
        .flat();
    } else {
      // Normal property access
      if (Array.isArray(current)) {
        // If current is an array, map over each item to get the next property
        current = current
          .map((item) => item?.[key])
          .filter(Boolean)
          .flat();
      } else {
        current = current?.[key];
      }
    }
  }

  return current;
}
