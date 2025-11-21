// settings.js - Settings Page Logic
window.Settings = {
    currentUser: null,
    stores: [],
    devices: [],
    
    /**
     * Initialize settings page
     */
    async init() {
        console.log('⚙️ Initializing settings page...');
        
        // Check authentication
        const authData = await Auth.checkAuth();
        if (!authData) {
            return;
        }
        
        this.currentUser = authData.user;
        console.log('✅ User authenticated:', this.currentUser.email);
        
        // Load profile data
        await this.loadProfile();
        
        // Set up tab listeners
        this.setupTabListeners();
        
        console.log('✅ Settings page initialized');
    },
    
    /**
     * Setup tab change listeners
     */
    setupTabListeners() {
        const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
        
        tabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (event) => {
                const tabId = event.target.getAttribute('data-bs-target');
                
                if (tabId === '#tab-stores') {
                    this.loadStores();
                } else if (tabId === '#tab-devices') {
                    this.loadDevices();
                } else if (tabId === '#tab-system') {
                    this.loadSystemInfo();
                }
            });
        });
    },
    
    // ============================================================
    // PROFILE MANAGEMENT
    // ============================================================
    
    /**
     * Load user profile
     */
    async loadProfile() {
        try {
            const response = await fetch('/api/user/profile', {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Populate profile form
                document.getElementById('fullName').value = data.user.full_name || '';
                document.getElementById('email').value = data.user.email || '';
                document.getElementById('phone').value = data.user.phone || '';
                
                // Populate stats
                if (data.stats) {
                    const memberSince = new Date(data.stats.member_since);
                    document.getElementById('statMemberSince').textContent = 
                        memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    document.getElementById('statTotalStores').textContent = data.stats.total_stores;
                    document.getElementById('statTotalDevices').textContent = data.stats.total_devices;
                    document.getElementById('statTotalCameras').textContent = data.stats.total_cameras;
                }
                
                console.log('✅ Profile loaded');
            } else {
                this.showAlert('profileAlertContainer', data.error, 'danger');
            }
            
        } catch (error) {
            console.error('❌ Load profile failed:', error);
            this.showAlert('profileAlertContainer', 'Failed to load profile', 'danger');
        }
    },
    
    /**
     * Update user profile
     */
    async updateProfile(event) {
        event.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ full_name: fullName, phone: phone })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('profileAlertContainer', 'Profile updated successfully!', 'success');
                
                // Update navbar
                const userNameEl = document.getElementById('userNameDropdown');
                if (userNameEl) {
                    userNameEl.textContent = fullName || this.currentUser.email;
                }
            } else {
                this.showAlert('profileAlertContainer', data.error, 'danger');
            }
            
        } catch (error) {
            console.error('❌ Update profile failed:', error);
            this.showAlert('profileAlertContainer', 'Failed to update profile', 'danger');
        }
    },
    
    /**
     * Change password
     */
    async changePassword(event) {
        event.preventDefault();
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            this.showAlert('profileAlertContainer', 'Please fill in all password fields', 'danger');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showAlert('profileAlertContainer', 'New passwords do not match', 'danger');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showAlert('profileAlertContainer', 'New password must be at least 6 characters', 'danger');
            return;
        }
        
        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    old_password: oldPassword, 
                    new_password: newPassword 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('profileAlertContainer', 'Password changed successfully!', 'success');
                
                // Clear form
                document.getElementById('passwordForm').reset();
            } else {
                this.showAlert('profileAlertContainer', data.error, 'danger');
            }
            
        } catch (error) {
            console.error('❌ Change password failed:', error);
            this.showAlert('profileAlertContainer', 'Failed to change password', 'danger');
        }
    },
    
    // ============================================================
    // STORE MANAGEMENT
    // ============================================================
    
    /**
     * Load stores list
     */
    async loadStores() {
        try {
            const response = await fetch('/api/user/stores', {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.stores = data.stores;
                this.renderStores();
                console.log('✅ Stores loaded:', this.stores.length);
            } else {
                this.showAlert('storesAlertContainer', data.error, 'danger');
            }
            
        } catch (error) {
            console.error('❌ Load stores failed:', error);
            this.showAlert('storesAlertContainer', 'Failed to load stores', 'danger');
        }
    },
    
    /**
     * Render stores list
     */
    renderStores() {
        const container = document.getElementById('storesList');
        const emptyState = document.getElementById('storesEmptyState');
        
        if (!this.stores || this.stores.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        container.innerHTML = this.stores.map(store => `
            <div class="col-md-6 mb-3">
                <div class="store-card">
                    <h5>
                        <i class="bi bi-shop me-2" style="color: var(--accent-primary);"></i>
                        ${store.store_name}
                    </h5>
                    
                    <div class="store-info">
                        ${store.address ? `
                            <div class="info-item">
                                <i class="bi bi-geo-alt"></i>
                                <span>${store.address}${store.city ? ', ' + store.city : ''}</span>
                            </div>
                        ` : ''}
                        
                        <div class="info-item">
                            <i class="bi bi-clock"></i>
                            <span>${store.timezone || 'Asia/Kolkata'}</span>
                        </div>
                        
                        <div class="info-item">
                            <i class="bi bi-cpu"></i>
                            <span>${store.device_count || 0} device(s)</span>
                        </div>
                    </div>
                    
                    <div class="store-actions">
                        <button class="btn-settings-secondary btn-sm-custom" 
                                onclick="Settings.showEditStoreModal(${store.id})">
                            <i class="bi bi-pencil me-1"></i>
                            Edit
                        </button>
                        <button class="btn-danger-custom btn-sm-custom" 
                                onclick="Settings.showDeleteModal('store', ${store.id}, '${store.store_name}')">
                            <i class="bi bi-trash me-1"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Show add store modal
     */
    showAddStoreModal() {
        // Clear form
        document.getElementById('addStoreForm').reset();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addStoreModal'));
        modal.show();
    },
    
    /**
     * Create new store
     */
    async createStore() {
        const storeName = document.getElementById('addStoreName').value.trim();
        const address = document.getElementById('addStoreAddress').value.trim();
        const city = document.getElementById('addStoreCity').value.trim();
        const state = document.getElementById('addStoreState').value.trim();
        const timezone = document.getElementById('addStoreTimezone').value;
        
        if (!storeName) {
            alert('Please enter a store name');
            return;
        }
        
        try {
            const response = await fetch('/api/store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    store_name: storeName,
                    address: address,
                    city: city,
                    state: state,
                    timezone: timezone
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('storesAlertContainer', 'Store created successfully!', 'success');
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('addStoreModal')).hide();
                
                // Reload stores
                await this.loadStores();
                await this.loadProfile(); // Update stats
            } else {
                alert(data.error);
            }
            
        } catch (error) {
            console.error('❌ Create store failed:', error);
            alert('Failed to create store');
        }
    },
    
    /**
     * Show edit store modal
     */
    async showEditStoreModal(storeId) {
        const store = this.stores.find(s => s.id === storeId);
        
        if (!store) {
            alert('Store not found');
            return;
        }
        
        // Populate form
        document.getElementById('editStoreId').value = store.id;
        document.getElementById('editStoreName').value = store.store_name;
        document.getElementById('editStoreAddress').value = store.address || '';
        document.getElementById('editStoreCity').value = store.city || '';
        document.getElementById('editStoreState').value = store.state || '';
        document.getElementById('editStoreTimezone').value = store.timezone || 'Asia/Kolkata';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editStoreModal'));
        modal.show();
    },
    
    /**
     * Update store
     */
    async updateStore() {
        const storeId = document.getElementById('editStoreId').value;
        const storeName = document.getElementById('editStoreName').value.trim();
        const address = document.getElementById('editStoreAddress').value.trim();
        const city = document.getElementById('editStoreCity').value.trim();
        const state = document.getElementById('editStoreState').value.trim();
        const timezone = document.getElementById('editStoreTimezone').value;
        
        if (!storeName) {
            alert('Please enter a store name');
            return;
        }
        
        try {
            const response = await fetch(`/api/store/${storeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    store_name: storeName,
                    address: address,
                    city: city,
                    state: state,
                    timezone: timezone
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('storesAlertContainer', 'Store updated successfully!', 'success');
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('editStoreModal')).hide();
                
                // Reload stores
                await this.loadStores();
            } else {
                alert(data.error);
            }
            
        } catch (error) {
            console.error('❌ Update store failed:', error);
            alert('Failed to update store');
        }
    }
};

// settings.js - Part 2: Device Management & Utilities

// Add these methods to the Settings object (continuation from part 1)

// ============================================================
// DEVICE MANAGEMENT
// ============================================================

Settings.loadDevices = async function() {
    try {
        const response = await fetch('/api/user/devices', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.devices = data.devices;
            this.renderDevices();
            console.log('✅ Devices loaded:', this.devices.length);
        } else {
            this.showAlert('devicesAlertContainer', data.error, 'danger');
        }
        
    } catch (error) {
        console.error('❌ Load devices failed:', error);
        this.showAlert('devicesAlertContainer', 'Failed to load devices', 'danger');
    }
};

Settings.renderDevices = function() {
    const container = document.getElementById('devicesList');
    const emptyState = document.getElementById('devicesEmptyState');
    
    if (!this.devices || this.devices.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = this.devices.map(device => {
        const statusClass = device.connection_status === 'online' ? 'status-online' : 
                           device.connection_status === 'delayed' ? 'status-delayed' : 'status-offline';
        
        const lastSeen = device.last_heartbeat ? 
            new Date(device.last_heartbeat).toLocaleString('en-US', { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            }) : 'Never';
        
        return `
            <div class="col-md-6 mb-3">
                <div class="device-card">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5>
                            <i class="bi bi-cpu me-2" style="color: var(--accent-primary);"></i>
                            ${device.device_id}
                        </h5>
                        <span class="status-badge ${statusClass}">
                            <i class="bi bi-circle-fill me-1" style="font-size: 0.5rem;"></i>
                            ${device.connection_status || 'offline'}
                        </span>
                    </div>
                    
                    <div class="device-info">
                        <div class="info-item">
                            <i class="bi bi-shop"></i>
                            <span>${device.store_name}</span>
                        </div>
                        
                        ${device.ip_address ? `
                            <div class="info-item">
                                <i class="bi bi-diagram-3"></i>
                                <span>${device.ip_address}</span>
                            </div>
                        ` : ''}
                        
                        <div class="info-item">
                            <i class="bi bi-clock"></i>
                            <span>Last seen: ${lastSeen}</span>
                        </div>
                        
                        <div class="info-item">
                            <i class="bi bi-camera"></i>
                            <span>${device.camera_count || 0} camera(s)</span>
                        </div>
                    </div>
                    
                    <div class="device-actions">
                        <button class="btn-settings-secondary btn-sm-custom" 
                                onclick="Settings.showMoveDeviceModal('${device.device_id}', '${device.store_name}', ${device.store_id})">
                            <i class="bi bi-arrow-left-right me-1"></i>
                            Move
                        </button>
                        <button class="btn-danger-custom btn-sm-custom" 
                                onclick="Settings.showDeleteModal('device', '${device.device_id}', '${device.device_id}')">
                            <i class="bi bi-trash me-1"></i>
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

Settings.showAddDeviceModal = async function() {
    // Load stores for dropdown
    if (!this.stores || this.stores.length === 0) {
        await this.loadStores();
    }
    
    if (this.stores.length === 0) {
        alert('Please create a store first before adding devices');
        return;
    }
    
    // Populate store dropdown
    const storeSelect = document.getElementById('addDeviceStore');
    storeSelect.innerHTML = '<option value="">Select a store...</option>' + 
        this.stores.map(store => 
            `<option value="${store.id}">${store.store_name}</option>`
        ).join('');
    
    // Clear form
    document.getElementById('addDeviceForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addDeviceModal'));
    modal.show();
};

Settings.addDevice = async function() {
    const deviceId = document.getElementById('addDeviceId').value.trim();
    const storeId = document.getElementById('addDeviceStore').value;
    const hardwareType = document.getElementById('addDeviceHardware').value;
    
    if (!deviceId) {
        alert('Please enter a device ID');
        return;
    }
    
    if (!storeId) {
        alert('Please select a store');
        return;
    }
    
    try {
        const response = await fetch('/api/device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                device_id: deviceId,
                store_id: parseInt(storeId),
                hardware_type: hardwareType
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.showAlert('devicesAlertContainer', 'Device added successfully!', 'success');
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
            
            // Reload devices
            await this.loadDevices();
            await this.loadProfile(); // Update stats
        } else {
            alert(data.error);
        }
        
    } catch (error) {
        console.error('❌ Add device failed:', error);
        alert('Failed to add device');
    }
};

Settings.showMoveDeviceModal = async function(deviceId, currentStoreName, currentStoreId) {
    // Load stores for dropdown
    if (!this.stores || this.stores.length === 0) {
        await this.loadStores();
    }
    
    // Populate form
    document.getElementById('moveDeviceId').value = deviceId;
    document.getElementById('moveDeviceName').textContent = deviceId;
    document.getElementById('moveDeviceCurrentStore').value = currentStoreName;
    
    // Populate store dropdown (exclude current store)
    const storeSelect = document.getElementById('moveDeviceNewStore');
    storeSelect.innerHTML = '<option value="">Select destination store...</option>' + 
        this.stores
            .filter(store => store.id !== currentStoreId)
            .map(store => `<option value="${store.id}">${store.store_name}</option>`)
            .join('');
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('moveDeviceModal'));
    modal.show();
};

Settings.moveDevice = async function() {
    const deviceId = document.getElementById('moveDeviceId').value;
    const newStoreId = document.getElementById('moveDeviceNewStore').value;
    
    if (!newStoreId) {
        alert('Please select a destination store');
        return;
    }
    
    try {
        const response = await fetch(`/api/device/${deviceId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ store_id: parseInt(newStoreId) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.showAlert('devicesAlertContainer', 'Device moved successfully!', 'success');
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('moveDeviceModal')).hide();
            
            // Reload devices
            await this.loadDevices();
        } else {
            alert(data.error);
        }
        
    } catch (error) {
        console.error('❌ Move device failed:', error);
        alert('Failed to move device');
    }
};

// ============================================================
// DELETE OPERATIONS
// ============================================================

Settings.showDeleteModal = function(type, id, name) {
    document.getElementById('deleteType').value = type;
    document.getElementById('deleteId').value = id;
    document.getElementById('deleteName').textContent = name;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
};

Settings.confirmDelete = async function() {
    const type = document.getElementById('deleteType').value;
    const id = document.getElementById('deleteId').value;
    
    if (type === 'store') {
        await this.deleteStore(id);
    } else if (type === 'device') {
        await this.deleteDevice(id);
    }
};

Settings.deleteStore = async function(storeId) {
    try {
        const response = await fetch(`/api/store/${storeId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.showAlert('storesAlertContainer', data.message, 'success');
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            
            // Reload stores
            await this.loadStores();
            await this.loadProfile(); // Update stats
        } else {
            // Close modal first
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            
            // Show error
            this.showAlert('storesAlertContainer', data.error, 'danger');
        }
        
    } catch (error) {
        console.error('❌ Delete store failed:', error);
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        this.showAlert('storesAlertContainer', 'Failed to delete store', 'danger');
    }
};

Settings.deleteDevice = async function(deviceId) {
    try {
        const response = await fetch(`/api/device/${deviceId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.showAlert('devicesAlertContainer', data.message, 'success');
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            
            // Reload devices
            await this.loadDevices();
            await this.loadProfile(); // Update stats
        } else {
            // Close modal first
            bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            
            // Show error
            this.showAlert('devicesAlertContainer', data.error, 'danger');
        }
        
    } catch (error) {
        console.error('❌ Delete device failed:', error);
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        this.showAlert('devicesAlertContainer', 'Failed to delete device', 'danger');
    }
};

// ============================================================
// SYSTEM TAB
// ============================================================

Settings.loadSystemInfo = function() {
    if (this.currentUser) {
        document.getElementById('systemUserId').textContent = this.currentUser.id;
        document.getElementById('systemEmail').textContent = this.currentUser.email;
        
        // Get member since from profile
        const memberSinceEl = document.getElementById('statMemberSince');
        if (memberSinceEl) {
            document.getElementById('systemMemberSince').textContent = memberSinceEl.textContent;
        }
    }
};

Settings.showDeleteAccountModal = function() {
    // Clear form
    document.getElementById('deleteAccountForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
    modal.show();
};

Settings.deleteAccount = async function() {
    const password = document.getElementById('deleteAccountPassword').value;
    
    if (!password) {
        alert('Please enter your password to confirm');
        return;
    }
    
    if (!confirm('Are you absolutely sure? This action is PERMANENT and cannot be undone!')) {
        return;
    }
    
    try {
        const response = await fetch('/api/user/account', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ password: password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Your account has been deleted. You will now be logged out.');
            window.location.href = '/login.html';
        } else {
            alert(data.error);
        }
        
    } catch (error) {
        console.error('❌ Delete account failed:', error);
        alert('Failed to delete account');
    }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

Settings.showAlert = function(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn('Alert container not found:', containerId);
        return;
    }
    
    const iconMap = {
        success: 'check-circle',
        danger: 'exclamation-triangle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const icon = iconMap[type] || 'info-circle';
    
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = container.querySelector('.alert');
        if (alert) {
            bootstrap.Alert.getOrCreateInstance(alert).close();
        }
    }, 5000);
};

Settings.formatDate = function(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

Settings.formatStatus = function(status) {
    const statusMap = {
        online: { class: 'status-online', text: 'Online' },
        offline: { class: 'status-offline', text: 'Offline' },
        delayed: { class: 'status-delayed', text: 'Delayed' }
    };
    
    return statusMap[status] || statusMap.offline;
};

// Helper functions for store selector
function toggleStoreDropdown() {
    const dropdown = document.getElementById('storeDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const storeDropdown = document.getElementById('storeDropdown');
    const storeSelectorBtn = document.getElementById('storeSelectorBtn');
    const userDropdown = document.getElementById('userDropdown');
    const userMenu = document.querySelector('.user-menu');
    
    if (storeDropdown && storeSelectorBtn) {
        if (!storeSelectorBtn.contains(event.target) && !storeDropdown.contains(event.target)) {
            storeDropdown.classList.remove('active');
        }
    }
    
    if (userDropdown && userMenu) {
        if (!userMenu.contains(event.target)) {
            userDropdown.classList.remove('active');
        }
    }
});

console.log('✅ Settings module loaded');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Settings.init();
    
    // Setup form handlers
    document.getElementById('profileForm').addEventListener('submit', (e) => Settings.updateProfile(e));
    document.getElementById('passwordForm').addEventListener('submit', (e) => Settings.changePassword(e));
});