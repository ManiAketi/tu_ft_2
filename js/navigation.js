// navigation.js - Unified navbar with device dropdown
window.CA = window.CA || {};

CA.navigation = {
  devices: [],
  currentDeviceId: null,
  
  /**
   * Initialize navigation (call on every page)
   */
  async init(authData) {
    console.log('🧭 Initializing navigation...');
    
    if (!authData) {
      console.error('❌ No auth data provided');
      return;
    }
    
    // Extract devices from stores
    this.devices = [];
    if (authData.stores && Array.isArray(authData.stores)) {
      authData.stores.forEach(store => {
        if (store.devices && Array.isArray(store.devices)) {
          store.devices.forEach(device => {
            this.devices.push({
              ...device,
              store_id: store.id,
              store_name: store.store_name
            });
          });
        }
      });
    }
    
    // Get current device
    this.currentDeviceId = localStorage.getItem('selectedDeviceId') || CA.state?.deviceId;
    
    if (!this.currentDeviceId && this.devices.length > 0) {
      this.currentDeviceId = this.devices[0].device_id;
      localStorage.setItem('selectedDeviceId', this.currentDeviceId);
    }
    
    // Update navbar
    this.renderDeviceDropdown();
    
    console.log(`✅ Navigation initialized with ${this.devices.length} device(s)`);
  },
  
  /**
   * Render device dropdown in navbar
   */
  renderDeviceDropdown() {
    // Find the navbar user info section
    const userInfo = document.getElementById('userInfo');
    
    if (!userInfo) {
      console.warn('⚠️ User info section not found in navbar');
      return;
    }
    
    // Find current device
    const currentDevice = this.devices.find(d => d.device_id === this.currentDeviceId);
    
    if (!currentDevice) {
      console.warn('⚠️ Current device not found');
      return;
    }
    
    // Create device dropdown HTML
    const dropdownHTML = `
      <div class="navbar-device-selector me-3" style="display: inline-block;">
        <button class="device-dropdown-btn" id="deviceDropdownBtn">
          <i class="bi bi-shop"></i>
          <span id="currentDeviceName">${currentDevice.store_name || currentDevice.device_id}</span>
          <i class="bi bi-chevron-down ms-2"></i>
        </button>
        
        <div class="device-dropdown-menu" id="deviceDropdownMenu">
          ${this.devices.map(device => `
            <div class="device-dropdown-item ${device.device_id === this.currentDeviceId ? 'active' : ''}" 
                 data-device-id="${device.device_id}">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span class="device-name">${device.store_name || device.device_id}</span>
                  <span class="device-id d-block">${device.device_id}</span>
                </div>
                <span class="device-status ${device.status || 'offline'}">
                  ${device.status || 'offline'}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Insert before user info
    userInfo.insertAdjacentHTML('beforebegin', dropdownHTML);
    
    // Attach event listeners
    this.attachDropdownListeners();
  },
  
  /**
   * Attach dropdown event listeners
   */
  attachDropdownListeners() {
    const btn = document.getElementById('deviceDropdownBtn');
    const menu = document.getElementById('deviceDropdownMenu');
    
    if (!btn || !menu) return;
    
    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
      }
    });
    
    // Handle device selection
    const items = menu.querySelectorAll('.device-dropdown-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const deviceId = item.getAttribute('data-device-id');
        this.switchDevice(deviceId);
      });
    });
  },
  
  /**
   * Switch to a different device
   */
  switchDevice(deviceId) {
    console.log('🔄 Switching device to:', deviceId);
    
    // Update localStorage
    localStorage.setItem('selectedDeviceId', deviceId);
    
    // Update global state
    if (CA.state) {
      CA.state.deviceId = deviceId;
    }
    
    // Reload page to refresh data
    window.location.reload();
  }
};