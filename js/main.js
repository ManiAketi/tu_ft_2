// Main app bootstrap - COMPLETE FIXED VERSION
window.CA = window.CA || {};

document.addEventListener("DOMContentLoaded", async () => {
  // ===== STEP 1: Check Authentication =====
  console.log("🔐 Checking authentication...");
  const authData = await Auth.checkAuth();

  if (!authData) {
    // User will be redirected to login by Auth.checkAuth()
    return;
  }

  console.log("✅ User authenticated:", authData.user.email);

  // Show user info in navbar
  const userInfoEl = document.getElementById('userInfo');
  const userNameEl = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');

  if (userInfoEl && userNameEl) {
    userNameEl.textContent = authData.user.full_name || authData.user.email;
    userInfoEl.style.display = 'inline';
  }

  if (logoutBtn) {
    logoutBtn.style.display = 'inline-block';
  }

  // ===== STEP 2: Handle Device Selection - FIXED =====
// ===== STEP 2: Handle Device Selection - FIXED =====
const stores = authData.stores || [];

console.log("🏪 Stores from auth:", stores);

if (!stores || stores.length === 0) {
  alert('No stores assigned to your account. Please contact support.');
  Auth.logout();
  return;
}

// ✅ FIXED: Extract devices from all stores
const devices = [];
stores.forEach(store => {
  console.log(`🏪 Processing store: ${store.store_name || store.id}`, store);
  
  if (store.devices && Array.isArray(store.devices)) {
    console.log(`  📱 Found ${store.devices.length} device(s) in this store`);
    
    store.devices.forEach(device => {
      devices.push({
        device_id: device.device_id,        // ✅ Ensure device_id is included
        store_id: store.id,
        store_name: store.store_name,
        last_heartbeat: device.last_heartbeat,
        status: device.connection_status || device.status || 'offline',
        ...device  // Include all other device properties
      });
    });
  } else {
    console.warn(`  ⚠️ No devices array found in store ${store.store_name || store.id}`);
  }
});

console.log("📱 Total devices extracted:", devices.length);
console.log("📱 Devices array:", devices);

if (devices.length === 0) {
  alert('No devices found in your stores. Please contact support.');
  Auth.logout();
  return;
}

console.log(`📱 Found ${devices.length} device(s) across ${stores.length} store(s)`);

// ===== DEVICE SELECTION LOGIC (MISSING!) =====
// Check if device was previously selected
let selectedDeviceId = localStorage.getItem('selectedDeviceId');

// Verify user still owns this device
if (selectedDeviceId) {
  const deviceExists = devices.find(d => d.device_id === selectedDeviceId);
  if (!deviceExists) {
    console.warn(`⚠️ Previously selected device ${selectedDeviceId} not found. Clearing selection.`);
    selectedDeviceId = null;
    localStorage.removeItem('selectedDeviceId');
  }
}

// Handle device selection based on count
if (!selectedDeviceId) {
  if (devices.length === 1) {
    // Auto-select if only one device
    selectedDeviceId = devices[0].device_id;
    localStorage.setItem('selectedDeviceId', selectedDeviceId);
    console.log("📱 Auto-selected single device:", selectedDeviceId);
  } else {
    // Show device selector modal for multiple devices
    console.log("📱 Multiple devices found. Showing selector...");
    Auth.showDeviceSelector(devices);
    return; // Wait for user to select device - modal will reload page
  }
}

// ✅ Set device ID in state
CA.state.deviceId = selectedDeviceId;
console.log("📱 Selected device:", selectedDeviceId);

// ✅ Initialize store selector (CRITICAL!)
initializeStoreSelector(devices);

  // ===== STEP 3: Populate Config Section - ENHANCED =====
  
  // ✅ FIX 1: Populate device dropdown (instead of locked text input)
  const deviceSelect = CA.utils.$("deviceSelect");
  if (deviceSelect) {
    deviceSelect.innerHTML = '<option value="">Select Device...</option>';
    
    devices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.device_id;
      option.textContent = `${device.device_id} (${device.store_name})`;
      if (device.device_id === selectedDeviceId) {
        option.selected = true;
      }
      deviceSelect.appendChild(option);
    });
    
    // Handle device change
    deviceSelect.addEventListener('change', (e) => {
      const newDeviceId = e.target.value;
      if (newDeviceId) {
        localStorage.setItem('selectedDeviceId', newDeviceId);
        CA.state.deviceId = newDeviceId;
        console.log("📱 Device switched to:", newDeviceId);
        
        // Update navbar
        const deviceNameEl = document.getElementById('deviceName');
        if (deviceNameEl) {
          deviceNameEl.textContent = newDeviceId;
        }
        
        // Reload cameras and dashboard
        loadCamerasAndDashboard();
      }
    });
    
    console.log("✅ Device dropdown populated with", devices.length, "devices");
  } else {
    // Fallback: Update old text input if dropdown doesn't exist yet
    const deviceIdInput = CA.utils.$("deviceId");
    if (deviceIdInput) {
      deviceIdInput.value = selectedDeviceId;
      deviceIdInput.disabled = true;
    }
  }

  // ✅ FIX 2: Update navbar device name
  const deviceInfoEl = document.getElementById('deviceInfo');
  const deviceNameEl = document.getElementById('deviceName');
  if (deviceInfoEl && deviceNameEl) {
    deviceNameEl.textContent = selectedDeviceId;
    deviceInfoEl.style.display = 'inline';
  }

  // ✅ FIX 3: Set default date to Oct 28 (where data exists) instead of today
// ✅ PHASE 4: Set default date in filter bar
const filterDate = document.getElementById('filterDate');
if (filterDate) {
  // Check if we have data for today by looking at device's last heartbeat
  const device = devices.find(d => d.device_id === selectedDeviceId);
  const lastHeartbeat = device?.last_heartbeat;
  
  let defaultDate;
  if (lastHeartbeat) {
    // Use last heartbeat date if recent (within 7 days)
    const lastDate = new Date(lastHeartbeat);
    const daysDiff = (new Date() - lastDate) / (1000 * 60 * 60 * 24);
    if (daysDiff < 7) {
      defaultDate = lastHeartbeat.split(' ')[0]; // Extract date part
    } else {
      defaultDate = "2025-10-28"; // Fall back to known data date
    }
  } else {
    defaultDate = "2025-10-28"; // Default to known data date
  }
  
  filterDate.value = defaultDate;
  CA.state.date = defaultDate;
  console.log("📅 Default date set to:", defaultDate);
}

  // Set today's date for heatmap filter
  const heatmapDate = document.getElementById('heatmapDate');
  
  if (heatmapDate && filterDate) {
    heatmapDate.value = filterDate.value;
  }

  // ✅ Add listener to keep them in sync
  if (filterDate && heatmapDate) {
    filterDate.addEventListener('change', () => {
      heatmapDate.value = filterDate.value;
      CA.state.date = filterDate.value;
      console.log("📅 Synced heatmap date:", filterDate.value);
    });
  }

  // Initialize VideoPlayer
  if (typeof VideoPlayer !== "undefined") {
    VideoPlayer.init();
    console.log("✅ VideoPlayer initialized");
  } else {
    console.warn("VideoPlayer not found - video grid functionality may not work");
  }

  // ===== STEP 4: Load Cameras =====
  await loadCamerasForDevice(selectedDeviceId);

  // ===== STEP 5: Tab Change Listeners =====
  const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
  tabButtons.forEach(button => {
    button.addEventListener('shown.bs.tab', (event) => {
      const tabId = event.target.getAttribute('data-bs-target');

      if (tabId === '#tab-heatmap') {
        console.log("🔥 Heatmap tab opened - initializing auto-refresh");
        CA.heatmap.init();  // Start auto-refresh
        CA.heatmap.load();  // Load initial data
      }
    });
    
    // Stop auto-refresh when leaving heatmap tab
    button.addEventListener('hidden.bs.tab', (event) => {
      const tabId = event.target.getAttribute('data-bs-target');
      
      if (tabId === '#tab-heatmap') {
        console.log("🔥 Heatmap tab closed - stopping auto-refresh");
        CA.heatmap.destroy();  // Stop auto-refresh to save resources
      }
    });
  });

  // ✅ FIX 4: KEEP CONFIG SECTION VISIBLE (don't hide it)
  // Users can change date/device/camera anytime
  console.log("📊 Auto-loading dashboard...");
  await loadDashboard();
  console.log("✅ Dashboard loaded successfully");
});

// ===== HELPER FUNCTIONS =====

/**
 * Load cameras for a specific device
 */
async function loadCamerasForDevice(deviceId) {
  try {
    const cams = await CA.api.cameras(deviceId);
    if (cams.cameras) {
      CA.data = CA.data || {};
      CA.data.cameras = cams.cameras;

      // ✅ PHASE 4: Populate filter bar camera dropdown
      const filterCamera = document.getElementById('filterCamera');
      if (filterCamera) {
        filterCamera.innerHTML = "";
        cams.cameras.forEach((cam) => {
          const opt = document.createElement("option");
          opt.value = cam;
          opt.textContent = cam;
          filterCamera.appendChild(opt);
        });
      }

      // Populate heatmap camera select
      const heatmapSelect = document.getElementById('heatmapCameraSelect');
      if (heatmapSelect) {
        heatmapSelect.innerHTML = "";

        const allOpt = document.createElement("option");
        allOpt.value = 'all';
        allOpt.textContent = 'All Cameras';
        heatmapSelect.appendChild(allOpt);

        cams.cameras.filter(c => c !== 'Global').forEach((cam) => {
          const opt = document.createElement("option");
          opt.value = cam;
          opt.textContent = cam;
          heatmapSelect.appendChild(opt);
        });
      }

      console.log("✅ Loaded cameras:", cams.cameras);
    }
  } catch (error) {
    console.error("Error loading cameras:", error);
  }
}

/**
 * Reload cameras and dashboard when device changes
 */
async function loadCamerasAndDashboard() {
  const deviceId = CA.state.deviceId;
  
  // Reload cameras
  await loadCamerasForDevice(deviceId);
  
  // If dashboard is visible, reload it
  const dashboardSection = document.getElementById("dashboardSection");
  if (dashboardSection && dashboardSection.style.display !== "none") {
    console.log("🔄 Reloading dashboard for new device:", deviceId);
    await loadDashboard();
  }
}

// ===== GLOBAL FUNCTIONS =====

/**
 * Load Dashboard - Called when user clicks "Load Dashboard" button
 */
async function loadDashboard() {
  try {
    // ✅ PHASE 4: Get values from filter bar (not config section)
    const filterDate = document.getElementById('filterDate');
    const filterCamera = document.getElementById('filterCamera');
    
    if (filterDate) {
      CA.state.date = filterDate.value;
    }
    
    if (filterCamera) {
      CA.state.camera = filterCamera.value;
    }

    // Dashboard is always visible now
    document.getElementById("dashboardSection").style.display = "block";

    // Handle responsive layout
    if (CA.layout && CA.layout.observeDashboardVisibility) {
      CA.layout.observeDashboardVisibility();
      CA.layout.handleResize();
      requestAnimationFrame(() => CA.layout && CA.layout.handleResize && CA.layout.handleResize());
    }

    console.log("📊 Loading dashboard with:", CA.state);

    // Load all charts for Crowd Density tab (default active tab)
    await Promise.all([
      CA.hourly.load(),
      CA.calendar.load(),
      CA.weekday.load(),
      CA.trend.load()
    ]);

    console.log("✅ Dashboard loaded successfully");
  } catch (error) {
    console.error("❌ Error loading dashboard:", error);
    alert("Error loading dashboard. Please check the server connection and try again.");
  }
}

async function refreshDashboard() {
  console.log("🔄 Refreshing dashboard...");
  
  // Show loading indicator on button
  const refreshBtn = document.getElementById('refreshDashboardBtn');
  if (refreshBtn) {
    const originalHTML = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    refreshBtn.disabled = true;
    
    try {
      await loadDashboard();
    } finally {
      // Restore button
      refreshBtn.innerHTML = originalHTML;
      refreshBtn.disabled = false;
    }
  } else {
    await loadDashboard();
  }
}

/**
 * Show Settings - Called when user clicks "Settings" button in navbar
 */
function showSettings() {
  // Scroll to config section (which is always visible now)
  const configSection = document.getElementById("configSection");
  if (configSection) {
    configSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Close Video - Called when video modal is closed
 */
function closeVideo() {
  if (typeof CA !== 'undefined' && typeof CA.video !== 'undefined') {
    CA.video.close();
  }
}

/**
 * Load Weekday Chart - Called from weekday comparison UI
 */
function loadWeekdayChart() {
  if (typeof CA !== 'undefined' && typeof CA.weekday !== 'undefined') {
    CA.weekday.load();
  }
}

/**
 * Initialize store selector in navbar
 */
function initializeStoreSelector(devices) {
  if (!devices || devices.length === 0) {
    console.warn('⚠️ No devices available for store selector');
    return;
  }
  
  const currentDeviceId = localStorage.getItem('selectedDeviceId') || devices[0].device_id;
  const currentDevice = devices.find(d => d.device_id === currentDeviceId);
  
  console.log("🏪 Initializing store selector with device:", currentDevice);
  
  // Update current store name in navbar
  const currentStoreName = document.getElementById('currentStoreName');
  if (currentStoreName && currentDevice) {
    currentStoreName.textContent = currentDevice.store_name || currentDevice.device_id;
  }
  
  // Update user name in dropdown
  const userNameDropdown = document.getElementById('userNameDropdown');
  if (userNameDropdown && window.Auth && window.Auth.currentUser) {
    userNameDropdown.textContent = window.Auth.currentUser.full_name || window.Auth.currentUser.email;
  }
  
  // Update device status
  updateDeviceStatus(currentDevice);
  
  // Populate store dropdown
  const storeDropdown = document.getElementById('storeDropdown');
  if (storeDropdown) {
    storeDropdown.innerHTML = devices.map(device => `
      <div class="store-dropdown-item ${device.device_id === currentDeviceId ? 'active' : ''}" 
           onclick="switchStore('${device.device_id}')">
        <span class="store-name">${device.store_name || device.device_id}</span>
        <span class="store-device-id">${device.device_id}</span>
      </div>
    `).join('');
  }
  
  console.log("✅ Store selector initialized");
}

/**
 * Update device status indicator in navbar
 */
function updateDeviceStatus(device) {
  const statusNav = document.getElementById('deviceStatusNav');
  const statusText = document.getElementById('deviceStatusText');
  
  if (!statusNav || !statusText || !device) return;
  
  // Check if device is online (based on last_heartbeat)
  let isOnline = false;
  if (device.last_heartbeat) {
    try {
      const lastHeartbeat = new Date(device.last_heartbeat);
      const now = new Date();
      const minutesAgo = (now - lastHeartbeat) / (1000 * 60);
      isOnline = minutesAgo < 5; // Online if heartbeat within 5 minutes
    } catch (e) {
      console.error('Error parsing heartbeat:', e);
    }
  }
  
  // Update UI
  if (isOnline) {
    statusNav.classList.remove('offline');
    statusText.textContent = 'Online';
  } else {
    statusNav.classList.add('offline');
    statusText.textContent = 'Offline';
  }
}

/**
 * Switch to a different store/device
 */
function switchStore(deviceId) {
  console.log('🔄 Switching to store:', deviceId);
  localStorage.setItem('selectedDeviceId', deviceId);
  if (window.CA && window.CA.state) {
    window.CA.state.deviceId = deviceId;
  }
  window.location.reload();
}

/**
 * Toggle store dropdown
 */
function toggleStoreDropdown() {
  const dropdown = document.getElementById('storeDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

/**
 * Toggle user menu
 */
function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav) {
    mobileNav.style.display = mobileNav.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Show notifications
 */
function showNotifications() {
  alert('Notifications feature coming soon!\n\nYou will be notified when:\n- Crowd density exceeds threshold\n- Device goes offline\n- New heatmap data available');
  
  // Hide notification badge
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    badge.style.display = 'none';
  }
}

/**
 * Toggle bookmark
 */
function toggleBookmark() {
  const icon = event.currentTarget.querySelector('i');
  if (icon.classList.contains('bi-bookmark-fill')) {
    icon.classList.remove('bi-bookmark-fill');
    icon.classList.add('bi-bookmark');
    console.log('Bookmark removed');
  } else {
    icon.classList.remove('bi-bookmark');
    icon.classList.add('bi-bookmark-fill');
    console.log('Bookmarked!');
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
  const storeDropdown = document.getElementById('storeDropdown');
  const storeSelectorBtn = document.getElementById('storeSelectorBtn');
  const userDropdown = document.getElementById('userDropdown');
  const userMenu = document.querySelector('.user-menu');
  
  // Close store dropdown
  if (storeDropdown && storeSelectorBtn) {
    if (!storeSelectorBtn.contains(event.target) && !storeDropdown.contains(event.target)) {
      storeDropdown.classList.remove('active');
    }
  }
  
  // Close user dropdown
  if (userDropdown && userMenu) {
    if (!userMenu.contains(event.target)) {
      userDropdown.classList.remove('active');
    }
  }
});