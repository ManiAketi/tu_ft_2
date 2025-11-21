// Toast Notification System - Quick Win #4
// Elegant, accessible toast notifications replacing alert()

class ToastManager {
  constructor() {
    this.container = null;
    this.activeToasts = new Map();
    this.init();
  }

  /**
   * Initialize toast container
   */
  init() {
    // Create container if it doesn't exist
    if (!document.getElementById('toastContainer')) {
      const container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.getElementById('toastContainer');
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type: 'success', 'error', 'warning', 'info', 'loading'
   * @param {number} duration - Duration in ms (0 = don't auto-hide)
   * @param {Object} options - Additional options
   * @returns {string} Toast ID
   */
  show(message, type = 'info', duration = 3000, options = {}) {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const toast = this.createToast(toastId, message, type, options);
    this.container.appendChild(toast);
    
    // Store reference
    this.activeToasts.set(toastId, { element: toast, type, duration });
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-hide after duration (if not loading type)
    if (duration > 0 && type !== 'loading') {
      setTimeout(() => {
        this.hide(toastId);
      }, duration);
    }

    // Announce to screen readers
    this.announce(message, type);

    return toastId;
  }

  /**
   * Create toast HTML element
   */
  createToast(toastId, message, type, options) {
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    
    const icons = {
      success: 'check-circle-fill',
      error: 'exclamation-triangle-fill',
      warning: 'exclamation-circle-fill',
      info: 'info-circle-fill',
      loading: 'arrow-clockwise'
    };

    const icon = icons[type] || icons.info;
    const spinClass = type === 'loading' ? 'spinning' : '';

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="bi bi-${icon} ${spinClass}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
        ${options.subtitle ? `<div class="toast-subtitle">${options.subtitle}</div>` : ''}
      </div>
      ${type !== 'loading' ? `
        <button 
          type="button" 
          class="toast-close" 
          onclick="Toast.hide('${toastId}')"
          aria-label="Close notification">
          <i class="bi bi-x"></i>
        </button>
      ` : ''}
    `;

    return toast;
  }

  /**
   * Hide and remove a toast
   * @param {string} toastId - Toast ID to hide
   */
  hide(toastId) {
    if (!toastId) {
      // Hide the last shown toast
      const lastToast = Array.from(this.activeToasts.keys()).pop();
      if (lastToast) toastId = lastToast;
      else return;
    }

    const toastData = this.activeToasts.get(toastId);
    if (!toastData) return;

    const { element } = toastData;
    
    // Remove show class to trigger exit animation
    element.classList.remove('show');
    element.classList.add('hide');

    // Remove from DOM after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.activeToasts.delete(toastId);
    }, 300);
  }

  /**
   * Update an existing toast (useful for loading states)
   * @param {string} toastId - Toast ID to update
   * @param {string} message - New message
   * @param {string} type - New type
   */
  update(toastId, message, type = 'info') {
    const toastData = this.activeToasts.get(toastId);
    if (!toastData) return;

    const { element } = toastData;
    
    // Update content
    const messageEl = element.querySelector('.toast-message');
    const iconEl = element.querySelector('.toast-icon i');
    
    if (messageEl) messageEl.textContent = message;
    
    // Update icon
    const icons = {
      success: 'check-circle-fill',
      error: 'exclamation-triangle-fill',
      warning: 'exclamation-circle-fill',
      info: 'info-circle-fill',
      loading: 'arrow-clockwise'
    };
    
    if (iconEl) {
      iconEl.className = `bi bi-${icons[type] || icons.info}`;
      if (type === 'loading') {
        iconEl.classList.add('spinning');
      } else {
        iconEl.classList.remove('spinning');
      }
    }

    // Update class
    element.className = `toast toast-${type} show`;

    // Update stored data
    toastData.type = type;
    
    // Add close button if not loading and doesn't have one
    if (type !== 'loading' && !element.querySelector('.toast-close')) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', 'Close notification');
      closeBtn.innerHTML = '<i class="bi bi-x"></i>';
      closeBtn.onclick = () => this.hide(toastId);
      element.appendChild(closeBtn);
    }

    // Auto-hide if success/error
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        this.hide(toastId);
      }, 3000);
    }

    this.announce(message, type);
  }

  /**
   * Show success toast
   */
  success(message, options = {}) {
    return this.show(message, 'success', options.duration || 3000, options);
  }

  /**
   * Show error toast
   */
  error(message, options = {}) {
    return this.show(message, 'error', options.duration || 4000, options);
  }

  /**
   * Show warning toast
   */
  warning(message, options = {}) {
    return this.show(message, 'warning', options.duration || 3500, options);
  }

  /**
   * Show info toast
   */
  info(message, options = {}) {
    return this.show(message, 'info', options.duration || 3000, options);
  }

  /**
   * Show loading toast (doesn't auto-hide)
   */
  loading(message, options = {}) {
    return this.show(message, 'loading', 0, options);
  }

  /**
   * Hide all toasts
   */
  hideAll() {
    this.activeToasts.forEach((data, id) => {
      this.hide(id);
    });
  }

  /**
   * Announce to screen readers
   */
  announce(message, type) {
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('role', type === 'error' ? 'alert' : 'status');
    announcement.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Chain-able helper for loading → success/error pattern
   */
  async promise(promise, messages = {}) {
    const loadingMsg = messages.loading || 'Loading...';
    const successMsg = messages.success || 'Success!';
    const errorMsg = messages.error || 'Failed!';

    const toastId = this.loading(loadingMsg);

    try {
      const result = await promise;
      this.update(toastId, successMsg, 'success');
      return result;
    } catch (error) {
      this.update(toastId, errorMsg, 'error');
      throw error;
    }
  }
}

// Create global singleton instance
window.Toast = new ToastManager();

// Example usage:
// Toast.success('Account created successfully!');
// Toast.error('Failed to load data');
// Toast.loading('Processing...');
// Toast.promise(fetchData(), {
//   loading: 'Fetching data...',
//   success: 'Data loaded!',
//   error: 'Failed to fetch data'
// });
