// Authentication module
window.Auth = {
    currentUser: null,
    
    /**
     * Check if user is authenticated
     * Redirects to login page if not authenticated
     */
    async checkAuth() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.success) {
          // Not authenticated - redirect to login
          window.location.href = '/login.html';
          return null;
        }
        
        this.currentUser = data.user;
        return data;
        
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
        return null;
      }
    },
    
    /**
     * Logout user
     */
    async logout() {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        
        window.location.href = '/login.html';
        
      } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = '/login.html';
      }
    },
    
    /**
     * Show device selector modal if user has multiple devices
     */
    showDeviceSelector(devices) {
      if (devices.length === 0) {
        alert('No devices assigned to your account. Please contact support.');
        this.logout();
        return;
      }
      
      // If only one device, auto-select it
      if (devices.length === 1) {
        CA.state.deviceId = devices[0].device_id;
        return devices[0].device_id;
      }
      
      // Show device selector modal
      const modalHTML = `
        <div class="modal fade" id="deviceSelectorModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="background: var(--bg-card); border: 1px solid var(--border-color);">
              <div class="modal-header" style="border-bottom: 1px solid var(--border-color);">
                <h5 class="modal-title" style="color: var(--text-primary);">
                  <i class="bi bi-hdd-network me-2"></i>
                  Select Your Device
                </h5>
              </div>
              <div class="modal-body">
                <p class="text-muted mb-3">You have multiple devices. Please select one to view:</p>
                <div class="list-group" id="deviceList">
                  ${devices.map(device => `
                    <button 
                      type="button" 
                      class="list-group-item list-group-item-action device-item"
                      data-device-id="${device.device_id}"
                      style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); margin-bottom: 8px; border-radius: 8px;"
                    >
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 class="mb-1" style="color: var(--accent-primary);">
                            <i class="bi bi-shop me-2"></i>
                            ${device.store_name}
                          </h6>
                          <small class="text-muted">
                            <i class="bi bi-cpu me-1"></i>
                            ${device.device_id}
                          </small>
                        </div>
                        <span class="badge bg-${device.status === 'online' ? 'success' : 'secondary'}">
                          <i class="bi bi-circle-fill me-1" style="font-size: 0.5rem;"></i>
                          ${device.status}
                        </span>
                      </div>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Remove existing modal if any
      const existing = document.getElementById('deviceSelectorModal');
      if (existing) existing.remove();
      
      // Add modal to DOM
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('deviceSelectorModal'));
      modal.show();
      
      // Add click handlers to device items
      document.querySelectorAll('.device-item').forEach(item => {
        item.addEventListener('click', () => {
          const deviceId = item.getAttribute('data-device-id');
          CA.state.deviceId = deviceId;
          modal.hide();
          
          // Store selected device in localStorage
          localStorage.setItem('selectedDeviceId', deviceId);
          
          // Reload page or trigger dashboard load
          location.reload();
        });
      });
    }
  };