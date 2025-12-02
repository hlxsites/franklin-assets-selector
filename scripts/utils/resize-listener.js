let callbacks;

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const notifyListeners = () => {
  if (!callbacks) return;
  callbacks.forEach((callback) => callback());
};

const debounceNotifyListeners = debounce(notifyListeners, 200);

/** Setup Screen Resize Handlers */
function initScreenResizeHandlers() {
  callbacks = new Set();
  window.addEventListener('resize', debounceNotifyListeners);
}

/**
 * Subscribe to screen width change.
 * @param callback the callback function when screen width changes
 * @returns unsubscribe function
 */
export default function subscribeToResizeListener(callback) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  if (!callbacks) {
    initScreenResizeHandlers();
  }
  callbacks.add(callback);
  return {
    unsubscribe: () => {
      callbacks.delete(callback);

      if (callbacks.size === 0) {
        callbacks = null;
        window.removeEventListener('resize', debounceNotifyListeners);
      }
    },
  };
}
