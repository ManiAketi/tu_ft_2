window.PersonAlerts = {
    alerts: [],
    unreadCount: 0,
    
    async init() {
      await this.loadAlerts();
      this.setupPolling(); // Poll for new alerts every 10 seconds
    },
    
    async loadAlerts() {
      try {
        const response = await fetch(
          `${CA.API_BASE}/person/alerts?device_id=${CA.state.deviceId}&unread_only=true&limit=50`
        );
        const data = await response.json();
        
        if (data.success) {
          this.alerts = data.alerts;
          this.unreadCount = data.unread_count;
          this.renderAlerts();
          this.updateBadge();
        }
      } catch (error) {
        console.error('[PERSON ALERTS] Load failed:', error);
      }
    },
    
    renderAlerts() {
      const container = document.getElementById('personAlertsContainer');
      
      if (!this.alerts || this.alerts.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No alerts yet.</p>';
        return;
      }
      
      let html = '<div class="list-group">';
      
      this.alerts.forEach(alert => {
        const bgClass = alert.is_read ? '' : 'bg-light border-primary';
        const time = new Date(alert.timestamp).toLocaleString();
        
        html += `
          <div class="list-group-item ${bgClass}" id="alert-${alert.id}">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="mb-1">
                  <i class="bi bi-person-badge text-primary me-2"></i>
                  ${alert.camera_name}
                </h6>
                <p class="mb-1">
                  <strong>${alert.person_count}</strong> person(s) detected
                  <small class="text-muted">(confidence: ${(alert.confidence * 100).toFixed(1)}%)</small>
                </p>
                <small class="text-muted">
                  <i class="bi bi-clock me-1"></i>${time}
                </small>
              </div>
              <button class="btn btn-sm btn-outline-primary" 
                      onclick="PersonAlerts.markRead(${alert.id})"
                      ${alert.is_read ? 'disabled' : ''}>
                <i class="bi bi-check"></i>
              </button>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;
    },
    
    updateBadge() {
      const badge = document.getElementById('personAlertBadge');
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    },
    
    async markRead(alertId) {
      try {
        const response = await fetch(`${CA.API_BASE}/person/alerts/mark_read`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            device_id: CA.state.deviceId,
            alert_ids: [alertId]
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update UI
          const alertEl = document.getElementById(`alert-${alertId}`);
          if (alertEl) {
            alertEl.classList.remove('bg-light', 'border-primary');
            alertEl.querySelector('button').disabled = true;
          }
          
          this.unreadCount--;
          this.updateBadge();
        }
      } catch (error) {
        console.error('[PERSON ALERTS] Mark read failed:', error);
      }
    },
    
    async markAllRead() {
      if (!confirm('Mark all alerts as read?')) return;
      
      try {
        const response = await fetch(`${CA.API_BASE}/person/alerts/mark_read`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            device_id: CA.state.deviceId,
            alert_ids: []  // Empty array = mark all
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          await this.loadAlerts();
        }
      } catch (error) {
        console.error('[PERSON ALERTS] Mark all read failed:', error);
      }
    },
    
    setupPolling() {
      // Poll for new alerts every 10 seconds
      setInterval(() => {
        this.loadAlerts();
      }, 10000);
    }
  };