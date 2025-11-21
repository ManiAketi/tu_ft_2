// heatmap.js - FINAL VERSION

window.CA = window.CA || {};

CA.heatmap = {
  refreshInterval: null, // Store interval ID
  
  /**
   * Initialize with auto-refresh
   */
  init() {
    console.log('🔄 Heatmap module initialized with auto-refresh');
    
    // Clear existing interval if any
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Auto-refresh every 5 minutes to check for new snapshots
    this.refreshInterval = setInterval(() => {
      const now = new Date();
      console.log(`🔄 Auto-refresh check at ${now.toLocaleTimeString()}`);
      this.load();
    }, 5 * 60 * 1000); // 5 minutes
  },
  
  /**
   * Stop auto-refresh when leaving tab
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('🛑 Heatmap auto-refresh stopped');
    }
  },
  
  async load() {
    try {
      const s = CA.state;
      const dateInput = document.getElementById('heatmapDate');
      const cameraSelect = document.getElementById('heatmapCameraSelect');
      
      const date = dateInput ? dateInput.value : s.date;
      const camera = cameraSelect ? cameraSelect.value : 'all';
      
      console.log(`📸 Loading latest heatmap snapshots for date: ${date}, camera: ${camera}`);
      
      // Fetch snapshots for selected date
      const res = await CA.api.heatmapSnapshots(
        s.deviceId, 
        date,
        camera === 'all' ? null : camera
      );
      
      console.log("📸 Received snapshots:", res);
      
      if (res.snapshots && res.snapshots.length > 0) {
        // Get LATEST snapshot per camera (existing logic - CORRECT!)
        const latestByCamera = this.getLatestPerCamera(res.snapshots);
        console.log("📸 Latest per camera:", latestByCamera);
        this.render(latestByCamera);
      } else {
        console.warn("📸 No snapshots found for selected date");
        this.showEmpty();
      }
      
    } catch (error) {
      console.error("❌ Error loading heatmap snapshots:", error);
      this.showEmpty();
    }
  },
  
  /**
   * Get LATEST snapshot per camera (KEEP THIS - IT'S CORRECT!)
   */
  getLatestPerCamera(snapshots) {
    const grouped = {};
    
    snapshots.forEach(snap => {
      const cameraName = snap.camera_name;
      const snapTime = new Date(snap.timestamp);
      
      // Keep only the NEWEST snapshot per camera
      if (!grouped[cameraName] || snapTime > new Date(grouped[cameraName].timestamp)) {
        grouped[cameraName] = snap;
      }
    });
    
    return Object.values(grouped).sort((a, b) => 
      a.camera_name.localeCompare(b.camera_name)
    );
  },
  
  showEmpty() {
    const gallery = document.getElementById('heatmapGallery');
    const empty = document.getElementById('heatmapEmpty');
    
    if (gallery) gallery.innerHTML = '';
    if (empty) empty.style.display = 'block';
  },
  
  /**
   * Format timestamp to show hour clearly
   */
  formatDateTime(timestamp) {
    console.log('🕐 Formatting timestamp:', timestamp);
    
    if (!timestamp) {
      console.error('❌ No timestamp provided');
      return 'No timestamp';
    }
    
    let ts;
    try {
      // ✅ FIX: Treat SQLite timestamps as LOCAL time, not UTC
      if (timestamp.length === 19 && !timestamp.includes('T') && !timestamp.includes('Z')) {
        // Parse as local time by replacing space with 'T'
        ts = new Date(timestamp.replace(' ', 'T'));
        console.log('  Treated as local time:', ts);
      } else {
        ts = new Date(timestamp);
      }
    } catch (error) {
      console.error('❌ Error parsing timestamp:', error);
      return 'Invalid Date';
    }
    
    if (isNaN(ts.getTime())) {
      console.error('❌ Invalid timestamp:', timestamp);
      return 'Invalid Date';
    }
    
    try {
      const date = ts.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      const time = ts.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
      
      const formatted = `${date} at ${time}`;
      console.log('✅ Formatted timestamp:', formatted);
      return formatted;
    } catch (error) {
      console.error('❌ Error formatting timestamp:', error);
      return timestamp;
    }
  },
  
  /**
   * Render LATEST snapshots per camera
   */
/**
 * Render LATEST snapshots per camera
 */
render(snapshots) {
  const gallery = document.getElementById('heatmapGallery');
  const empty = document.getElementById('heatmapEmpty');
  
  if (!gallery) {
    console.error("❌ Heatmap gallery container not found");
    return;
  }
  
  gallery.innerHTML = '';
  if (empty) empty.style.display = 'none';
  
  // Add info banner showing snapshot time
  if (snapshots.length > 0) {
    const infoBanner = document.createElement('div');
    infoBanner.className = 'col-12 mb-3';
    
    // ✅ FIXED: Use snapshot.timestamp (when ML captured it)
    const latestTime = this.formatDateTime(snapshots[0].timestamp);
    
    infoBanner.innerHTML = `
      <div class="alert alert-info" style="background: var(--bg-card); border: 1px solid var(--accent-primary); color: var(--text-primary);">
        <i class="bi bi-fire me-2"></i>
        <strong>Last Heatmap Taken At:</strong> ${latestTime}
        <span class="badge bg-success ms-2">
          <i class="bi bi-arrow-clockwise me-1"></i>Auto-updates every 5 minutes
        </span>
      </div>
    `;
    
    gallery.appendChild(infoBanner);
  }
  
  // Render each camera's latest snapshot
  snapshots.forEach(snapshot => {
    console.log('📸 Rendering snapshot:', {
      camera: snapshot.camera_name,
      timestamp: snapshot.timestamp,
      formatted: this.formatDateTime(snapshot.timestamp)
    });
    
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6'; // 2 columns on desktop
    
    const card = document.createElement('div');
    card.className = 'card heatmap-card';
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.3s ease';
    
    // Snapshot image
    const img = document.createElement('img');
    img.src = `${CA.API_BASE}/heatmap/snapshot/${snapshot.id}`;
    img.className = 'card-img-top';
    img.alt = `${snapshot.camera_name} - ${snapshot.timestamp}`;
    img.style.height = '300px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px 8px 0 0';
    img.loading = 'lazy';
    
    img.onerror = () => {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23374151" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%239CA3AF" text-anchor="middle" dy=".3em"%3EImage Not Available%3C/text%3E%3C/svg%3E';
    };
    
    // Card body
    const body = document.createElement('div');
    body.className = 'card-body';
    body.style.padding = '1rem';
    
    // Camera name
    const title = document.createElement('h6');
    title.className = 'card-title mb-2';
    title.style.color = 'var(--accent-primary)';
    title.innerHTML = `<i class="bi bi-camera-fill me-2"></i>${snapshot.camera_name}`;
    
    // ✅ FIXED: Use timestamp (snapshot taken time)
    const timestampContainer = document.createElement('div');
    timestampContainer.className = 'mb-2';
    
    const timestampText = document.createElement('div');
    timestampText.className = 'text-muted d-flex align-items-center';
    timestampText.style.fontSize = '0.9rem';
    
    const icon = document.createElement('i');
    icon.className = 'bi bi-clock-fill me-2';
    icon.style.color = 'var(--accent-primary)';
    
    const dateTimeSpan = document.createElement('strong');
    dateTimeSpan.textContent = this.formatDateTime(snapshot.timestamp);
    dateTimeSpan.style.color = '#fff';
    
    timestampText.appendChild(icon);
    timestampText.appendChild(dateTimeSpan);
    timestampContainer.appendChild(timestampText);
    
    // Click to enlarge hint
    const hint = document.createElement('small');
    hint.className = 'text-muted';
    hint.style.fontSize = '0.85rem';
    hint.innerHTML = '<i class="bi bi-arrows-fullscreen me-1"></i>Click to enlarge';
    
    // Assemble card
    body.appendChild(title);
    body.appendChild(timestampContainer);
    body.appendChild(hint);
    
    card.appendChild(img);
    card.appendChild(body);
    
    // Click handler - view full size
    card.onclick = () => this.viewFullSize(snapshot);
    
    // Hover effect
    card.onmouseenter = () => {
      card.style.transform = 'translateY(-8px)';
      card.style.boxShadow = 'var(--shadow-xl)';
    };
    card.onmouseleave = () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'var(--shadow-md)';
    };
    
    col.appendChild(card);
    gallery.appendChild(col);
  });
  
  console.log(`✅ Rendered ${snapshots.length} latest heatmap snapshots`);
},
  
viewFullSize(snapshot) {
  // ✅ FIXED: Use timestamp (snapshot taken time)
  const formattedTime = this.formatDateTime(snapshot.timestamp);
  
  const modalHTML = `
    <div class="modal fade" id="snapshotModal" tabindex="-1" aria-labelledby="snapshotModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content" style="background: var(--bg-card); border: 1px solid var(--border-color);">
          <div class="modal-header" style="border-bottom: 1px solid var(--border-color);">
            <h5 class="modal-title" id="snapshotModalLabel" style="color: var(--text-primary);">
              <i class="bi bi-camera-fill me-2" style="color: var(--accent-primary);"></i>
              ${snapshot.camera_name}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center p-0" style="background: #000;">
            <img src="${CA.API_BASE}/heatmap/snapshot/${snapshot.id}" 
                 class="img-fluid" 
                 alt="Heatmap Snapshot - ${snapshot.camera_name}"
                 style="max-height: 80vh; width: auto; object-fit: contain;">
          </div>
          <div class="modal-footer" style="border-top: 1px solid var(--border-color); background: var(--bg-card);">
            <div class="me-auto">
              <span class="badge" style="font-size: 0.95rem; padding: 0.5rem 0.75rem; background: linear-gradient(135deg, var(--accent-primary), #0284c7);">
                <i class="bi bi-fire me-1"></i>Heatmap Taken: ${formattedTime}
              </span>
            </div>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="bi bi-x-circle me-1"></i>Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const existing = document.getElementById('snapshotModal');
  if (existing) {
    const existingModal = bootstrap.Modal.getInstance(existing);
    if (existingModal) {
      existingModal.dispose();
    }
    existing.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modalElement = document.getElementById('snapshotModal');
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
  
  modalElement.addEventListener('hidden.bs.modal', () => {
    modalElement.remove();
  });
  
  console.log(`🖼️ Viewing full size: ${snapshot.camera_name} - Heatmap taken at ${formattedTime}`);
}
};