// Loading State Manager - Quick Win #2
// Provides consistent loading indicators across the app

class LoadingStateManager {
  constructor() {
    this.activeLoaders = new Map();
    this.overlayId = 'appLoadingOverlay';
  }

  /**
   * Show loading state on a specific element
   * @param {string|HTMLElement} target - Element ID or element itself
   * @param {Object} options - Loading options
   */
  show(target, options = {}) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) {
      console.warn('Loading target not found:', target);
      return null;
    }

    const loaderId = `loader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Default options
    const config = {
      type: 'spinner', // 'spinner', 'skeleton', 'bar', 'overlay'
      message: 'Loading...',
      size: 'md', // 'sm', 'md', 'lg'
      overlay: false,
      ...options
    };

    let loader;

    switch (config.type) {
      case 'spinner':
        loader = this.createSpinner(element, config);
        break;
      case 'skeleton':
        loader = this.createSkeleton(element, config);
        break;
      case 'bar':
        loader = this.createProgressBar(element, config);
        break;
      case 'overlay':
        loader = this.createOverlay(element, config);
        break;
      default:
        loader = this.createSpinner(element, config);
    }

    // Store reference
    this.activeLoaders.set(loaderId, {
      element,
      loader,
      config,
      originalContent: config.type === 'skeleton' ? element.innerHTML : null
    });

    return loaderId;
  }

  /**
   * Hide loading state
   * @param {string} loaderId - Loader ID returned from show()
   */
  hide(loaderId) {
    if (!loaderId) {
      // Hide the last loader
      const lastLoader = Array.from(this.activeLoaders.keys()).pop();
      if (lastLoader) loaderId = lastLoader;
      else return;
    }

    const loaderData = this.activeLoaders.get(loaderId);
    if (!loaderData) return;

    const { element, loader, config, originalContent } = loaderData;

    // Remove loader with animation
    if (loader && loader.parentNode) {
      loader.classList.add('fade-out');
      
      setTimeout(() => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }

        // Restore original content for skeleton
        if (config.type === 'skeleton' && originalContent) {
          element.innerHTML = originalContent;
        }

        // Remove disabled state
        element.classList.remove('loading-state');
        element.removeAttribute('aria-busy');
      }, 300);
    }

    this.activeLoaders.delete(loaderId);
  }

  /**
   * Create spinner loader
   */
  createSpinner(element, config) {
    const spinner = document.createElement('div');
    spinner.className = `loading-spinner loading-${config.size}`;
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-live', 'polite');
    
    const sizeMap = { sm: 16, md: 32, lg: 48 };
    const size = sizeMap[config.size] || 32;

    spinner.innerHTML = `
      <div class="spinner-wrapper">
        <svg class="spinner-icon" width="${size}" height="${size}" viewBox="0 0 50 50">
          <circle class="spinner-track" cx="25" cy="25" r="20"></circle>
          <circle class="spinner-path" cx="25" cy="25" r="20"></circle>
        </svg>
        ${config.message ? `<div class="spinner-message">${config.message}</div>` : ''}
      </div>
    `;

    // Add to element
    if (config.overlay) {
      spinner.classList.add('spinner-overlay');
      element.style.position = 'relative';
    }

    element.classList.add('loading-state');
    element.setAttribute('aria-busy', 'true');
    element.appendChild(spinner);

    return spinner;
  }

  /**
   * Create skeleton loader
   */
  createSkeleton(element, config) {
    const skeletonHTML = config.template || this.getDefaultSkeleton(config);
    
    // Store original content
    const originalContent = element.innerHTML;
    
    // Replace with skeleton
    element.innerHTML = skeletonHTML;
    element.classList.add('loading-state', 'skeleton-loading');
    element.setAttribute('aria-busy', 'true');

    return element; // Return element itself as it contains the skeleton
  }

  /**
   * Get default skeleton template
   */
  getDefaultSkeleton(config) {
    if (config.skeletonType === 'chart') {
      return `
        <div class="skeleton-chart">
          <div class="skeleton-bar" style="height: 80%;"></div>
          <div class="skeleton-bar" style="height: 60%;"></div>
          <div class="skeleton-bar" style="height: 90%;"></div>
          <div class="skeleton-bar" style="height: 70%;"></div>
          <div class="skeleton-bar" style="height: 85%;"></div>
          <div class="skeleton-bar" style="height: 65%;"></div>
          <div class="skeleton-bar" style="height: 75%;"></div>
        </div>
      `;
    } else if (config.skeletonType === 'card') {
      return `
        <div class="skeleton-card">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text" style="width: 80%;"></div>
          <div class="skeleton-text" style="width: 60%;"></div>
        </div>
      `;
    } else {
      // Default text skeleton
      return `
        <div class="skeleton-text"></div>
        <div class="skeleton-text" style="width: 90%;"></div>
        <div class="skeleton-text" style="width: 70%;"></div>
      `;
    }
  }

  /**
   * Create progress bar loader
   */
  createProgressBar(element, config) {
    const progressBar = document.createElement('div');
    progressBar.className = 'loading-progress-bar';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');
    progressBar.setAttribute('aria-valuenow', config.progress || 0);

    progressBar.innerHTML = `
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: ${config.progress || 0}%"></div>
      </div>
      ${config.message ? `<div class="progress-bar-message">${config.message}</div>` : ''}
    `;

    element.classList.add('loading-state');
    element.setAttribute('aria-busy', 'true');
    element.appendChild(progressBar);

    return progressBar;
  }

  /**
   * Create full overlay loader
   */
  createOverlay(element, config) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    overlay.innerHTML = `
      <div class="loading-overlay-content">
        <svg class="spinner-icon" width="48" height="48" viewBox="0 0 50 50">
          <circle class="spinner-track" cx="25" cy="25" r="20"></circle>
          <circle class="spinner-path" cx="25" cy="25" r="20"></circle>
        </svg>
        <div class="loading-overlay-message">${config.message}</div>
      </div>
    `;

    element.style.position = 'relative';
    element.classList.add('loading-state');
    element.setAttribute('aria-busy', 'true');
    element.appendChild(overlay);

    return overlay;
  }

  /**
   * Update progress bar
   * @param {string} loaderId - Loader ID
   * @param {number} progress - Progress percentage (0-100)
   */
  updateProgress(loaderId, progress) {
    const loaderData = this.activeLoaders.get(loaderId);
    if (!loaderData || loaderData.config.type !== 'bar') return;

    const fill = loaderData.loader.querySelector('.progress-bar-fill');
    if (fill) {
      fill.style.width = `${progress}%`;
      loaderData.loader.setAttribute('aria-valuenow', progress);
    }
  }

  /**
   * Show full-page loading overlay
   */
  showGlobal(message = 'Loading...') {
    // Remove existing overlay
    this.hideGlobal();

    const overlay = document.createElement('div');
    overlay.id = this.overlayId;
    overlay.className = 'loading-global-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    overlay.innerHTML = `
      <div class="loading-global-content">
        <svg class="spinner-icon" width="64" height="64" viewBox="0 0 50 50">
          <circle class="spinner-track" cx="25" cy="25" r="20"></circle>
          <circle class="spinner-path" cx="25" cy="25" r="20"></circle>
        </svg>
        <div class="loading-global-message">${message}</div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });
  }

  /**
   * Hide full-page loading overlay
   */
  hideGlobal() {
    const overlay = document.getElementById(this.overlayId);
    if (!overlay) return;

    overlay.classList.remove('show');
    overlay.classList.add('fade-out');

    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      document.body.style.overflow = '';
    }, 300);
  }

  /**
   * Hide all active loaders
   */
  hideAll() {
    this.activeLoaders.forEach((data, id) => {
      this.hide(id);
    });
    this.hideGlobal();
  }

  /**
   * Wrap async function with loading state
   * @param {Function} asyncFn - Async function to wrap
   * @param {string|HTMLElement} target - Loading target
   * @param {Object} options - Loading options
   */
  async wrap(asyncFn, target, options = {}) {
    const loaderId = this.show(target, options);
    
    try {
      const result = await asyncFn();
      this.hide(loaderId);
      return result;
    } catch (error) {
      this.hide(loaderId);
      throw error;
    }
  }
}

// Create global singleton instance
window.LoadingState = new LoadingStateManager();

// Convenience methods for common patterns
LoadingState.button = (buttonElement, loading = true) => {
  if (loading) {
    buttonElement.disabled = true;
    buttonElement.dataset.originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Loading...
    `;
  } else {
    buttonElement.disabled = false;
    buttonElement.innerHTML = buttonElement.dataset.originalText || buttonElement.innerHTML;
  }
};

// Example usage:
// const loaderId = LoadingState.show('chartContainer', { type: 'skeleton', skeletonType: 'chart' });
// await fetchData();
// LoadingState.hide(loaderId);
//
// Or with wrap:
// await LoadingState.wrap(fetchData, 'chartContainer', { type: 'spinner', message: 'Loading chart...' });
