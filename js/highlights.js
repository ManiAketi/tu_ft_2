// highlights.js - Highlights landing page logic
window.CA = window.CA || {};

CA.highlights = {
  currentDate: null,
  deviceId: null,
  
  /**
   * Initialize highlights page
   */
  async init() {
    console.log('🎯 Initializing highlights module...');
    
    // Get device ID from state or localStorage
    this.deviceId = CA.state?.deviceId || localStorage.getItem('selectedDeviceId');
    
    if (!this.deviceId) {
      console.error('❌ No device ID found');
      alert('No device selected. Please log in again.');
      window.location.href = '/login.html';
      return;
    }
    
    console.log('✅ Device ID:', this.deviceId);
  },
  
  /**
   * Load all highlights data
   */
  async load() {
    try {
      console.log('📊 Loading highlights data...');
      
      // Step 1: Get last available date
      await this.determineDate();
      
      // Step 2: Load summary data for that date
      await this.loadSummary();
      
      // Step 3: Load heartbeat status
      await this.loadHeartbeat();
      
      // Step 4: Load trend chart
      await this.loadTrendChart();
      
      // Step 5: Load top heatmaps
      await this.loadTopHeatmaps();
      
      console.log('✅ Highlights loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading highlights:', error);
      this.showError('Failed to load highlights data. Please try again.');
    }
  },
  
  /**
   * Determine which date to show (yesterday or last available)
   */
  async determineDate() {
    try {
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log('📅 Checking for yesterday\'s data:', yesterdayStr);
      
      // Try to fetch yesterday's data
      const testRes = await CA.api.yesterdaySummary(this.deviceId, yesterdayStr);
      
      if (testRes.success && testRes.summary.peak_crowd > 0) {
        // Yesterday's data exists
        this.currentDate = yesterdayStr;
        console.log('✅ Using yesterday\'s data:', yesterdayStr);
        
        // Update UI
        document.getElementById('highlightsDate').textContent = this.formatDate(yesterdayStr);
        
      } else {
        // Fall back to last available date
        console.log('⚠️ No data for yesterday, fetching last available date...');
        
        const lastDataRes = await CA.api.lastAvailableDate(this.deviceId);
        
        if (lastDataRes.success && lastDataRes.last_analytics) {
          this.currentDate = lastDataRes.last_analytics;
          console.log('✅ Using last available data:', this.currentDate);
          
          // Update UI with fallback indicator
          document.getElementById('highlightsDate').textContent = this.formatDate(this.currentDate);
          
          // Show banner indicating fallback
          const banner = document.getElementById('dataAvailabilityBanner');
          const bannerText = document.getElementById('dataAvailabilityText');
          
          if (banner && bannerText) {
            bannerText.textContent = `Showing latest available data from ${this.formatDate(this.currentDate)}`;
            banner.style.display = 'block';
          }
          
        } else {
          throw new Error('No analytics data available for this device');
        }
      }
      
    } catch (error) {
      console.error('❌ Error determining date:', error);
      throw error;
    }
  },
  
  /**
   * Load summary statistics
   */
  async loadSummary() {
    try {
      console.log('📊 Loading summary for date:', this.currentDate);
      
      const res = await CA.api.yesterdaySummary(this.deviceId, this.currentDate);
      
      if (!res.success) {
        throw new Error('Failed to fetch summary data');
      }
      
      const summary = res.summary;
      
      // Update stat cards
      document.getElementById('peakCrowd').textContent = summary.peak_crowd || '--';
      document.getElementById('avgCrowd').textContent = summary.avg_crowd || '--';
      document.getElementById('busiestHour').textContent = this.formatHour(summary.busiest_hour) || '--';
      
      console.log('✅ Summary loaded:', summary);
      
    } catch (error) {
      console.error('❌ Error loading summary:', error);
      // Show fallback values
      document.getElementById('peakCrowd').textContent = '--';
      document.getElementById('avgCrowd').textContent = '--';
      document.getElementById('busiestHour').textContent = '--';
    }
  },
  
  /**
   * Load device heartbeat status
   */
  async loadHeartbeat() {
    try {
      // Show loading
      document.getElementById('deviceStatusContent').style.display = 'none';
      document.getElementById('deviceStatusLoading').style.display = 'block';
      
      console.log('💓 Loading heartbeat status...');
      
      const res = await CA.api.deviceHeartbeat(this.deviceId);
      
      if (!res.success) {
        throw new Error('Failed to fetch heartbeat');
      }
      
      // Hide loading
      document.getElementById('deviceStatusLoading').style.display = 'none';
      document.getElementById('deviceStatusContent').style.display = 'block';
      
      // Update status
      const isOnline = res.status === 'online';
      const statusPulse = document.getElementById('statusPulse');
      const statusText = document.getElementById('statusText');
      const heartbeatCard = document.querySelector('.heartbeat-card');
      
      if (isOnline) {
        statusPulse.className = 'status-pulse online';
        statusText.textContent = 'Online';
        statusText.className = 'text-success';
        heartbeatCard.classList.remove('offline');
      } else {
        statusPulse.className = 'status-pulse offline';
        statusText.textContent = 'Offline';
        statusText.className = 'text-danger';
        heartbeatCard.classList.add('offline');
      }
      
      // Update timestamps
      document.getElementById('lastHeartbeat').textContent = 
        res.last_heartbeat ? this.formatTimestamp(res.last_heartbeat) : 'Never';
      
      document.getElementById('lastDataTime').textContent = 
        this.currentDate ? this.formatDate(this.currentDate) : '--';
      
      document.getElementById('storeLocation').textContent = 
        res.store_name || this.deviceId;
      
      console.log('✅ Heartbeat loaded:', res.status);
      
    } catch (error) {
      console.error('❌ Error loading heartbeat:', error);
      
      // Show error state
      document.getElementById('deviceStatusLoading').style.display = 'none';
      document.getElementById('deviceStatusContent').style.display = 'block';
      
      const statusText = document.getElementById('statusText');
      statusText.textContent = 'Unknown';
      statusText.className = 'text-warning';
    }
  },
  
  /**
   * Load 7-day trend chart
   */
  async loadTrendChart() {
    try {
      console.log('📈 Loading trend chart...');
      
      const res = await CA.api.yesterdaySummary(this.deviceId, this.currentDate);
      
      if (!res.success || !res.trend_data || res.trend_data.length === 0) {
        console.warn('⚠️ No trend data available');
        this.showNoTrendData();
        return;
      }
      
      const trendData = res.trend_data;
      
      // Render chart
      this.renderTrendChart(trendData);
      
      console.log('✅ Trend chart loaded');
      
    } catch (error) {
      console.error('❌ Error loading trend chart:', error);
      this.showNoTrendData();
    }
  },
  
  /**
   * Render trend chart using Chart.js
   */
  renderTrendChart(data) {
    const ctx = document.getElementById('trendChart');
    
    if (!ctx) {
      console.error('❌ Trend chart canvas not found');
      return;
    }
    
    // Destroy existing chart if any
    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
    }
    
    const labels = data.map(d => this.formatDate(d.date));
    const values = data.map(d => d.max_count || 0);
    
    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Peak Crowd',
          data: values,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#0ea5e9',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            titleColor: '#fff',
            bodyColor: '#9ca3af',
            borderColor: '#2d3748',
            borderWidth: 1,
            padding: 12,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#9ca3af'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#9ca3af'
            }
          }
        }
      }
    });
  },
  
  /**
   * Show "no trend data" message
   */
  showNoTrendData() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
    }
    
    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data',
          data: [0],
          borderColor: '#6b7280',
          backgroundColor: 'rgba(107, 114, 128, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  },
  
  /**
   * Load top heatmap snapshots
   */
  async loadTopHeatmaps() {
    try {
      console.log('🔥 Loading top heatmaps...');
      
      const gallery = document.getElementById('heatmapGallery');
      const loading = document.getElementById('heatmapLoading');
      const empty = document.getElementById('heatmapEmpty');
      
      // Show loading
      if (loading) loading.style.display = 'block';
      if (empty) empty.style.display = 'none';
      if (gallery) gallery.innerHTML = '';
      
      const res = await CA.api.yesterdaySummary(this.deviceId, this.currentDate);
      
      if (!res.success || !res.top_heatmaps || res.top_heatmaps.length === 0) {
        console.warn('⚠️ No heatmaps available');
        if (loading) loading.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
      }
      
      // Hide loading
      if (loading) loading.style.display = 'none';
      
      // Render heatmaps
      res.top_heatmaps.forEach(heatmap => {
        this.renderHeatmapCard(heatmap, gallery);
      });
      
      console.log(`✅ Loaded ${res.top_heatmaps.length} heatmaps`);
      
    } catch (error) {
      console.error('❌ Error loading heatmaps:', error);
      
      const loading = document.getElementById('heatmapLoading');
      const empty = document.getElementById('heatmapEmpty');
      
      if (loading) loading.style.display = 'none';
      if (empty) empty.style.display = 'block';
    }
  },
  
  /**
   * Render a single heatmap card
   */
  renderHeatmapCard(heatmap, gallery) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    
    const card = document.createElement('div');
    card.className = 'card heatmap-card';
    card.style.cursor = 'pointer';
    
    // Image
    const img = document.createElement('img');
    img.src = `${CA.API_BASE}/heatmap/snapshot/${heatmap.id}`;
    img.className = 'card-img-top';
    img.alt = `${heatmap.camera_name} - ${heatmap.timestamp}`;
    img.style.height = '200px';
    img.style.objectFit = 'cover';
    img.loading = 'lazy';
    
    img.onerror = () => {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23374151" width="300" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%239CA3AF" text-anchor="middle" dy=".3em"%3EImage Not Available%3C/text%3E%3C/svg%3E';
    };
    
    // Body
    const body = document.createElement('div');
    body.className = 'card-body';
    
    const title = document.createElement('h6');
    title.className = 'card-title mb-2';
    title.innerHTML = `<i class="bi bi-camera-fill me-2"></i>${heatmap.camera_name}`;
    
    const time = document.createElement('small');
    time.className = 'text-muted';
    time.innerHTML = `<i class="bi bi-clock me-1"></i>${this.formatTimestamp(heatmap.timestamp)}`;
    
    body.appendChild(title);
    body.appendChild(time);
    
    card.appendChild(img);
    card.appendChild(body);
    
    // Click to view full size (reuse heatmap modal logic)
    card.onclick = () => {
      if (typeof CA.heatmap !== 'undefined' && CA.heatmap.viewFullSize) {
        CA.heatmap.viewFullSize(heatmap);
      }
    };
    
    col.appendChild(card);
    gallery.appendChild(col);
  },
  
  /**
   * Show error message
   */
  showError(message) {
    const banner = document.getElementById('dataAvailabilityBanner');
    const bannerText = document.getElementById('dataAvailabilityText');
    
    if (banner && bannerText) {
      banner.className = 'alert alert-danger';
      bannerText.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${message}`;
      banner.style.display = 'block';
    }
  },
  
  /**
   * Format date as "Oct 28, 2025"
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  },
  
  /**
   * Format hour as "2:00 PM"
   */
  formatHour(hourStr) {
    if (!hourStr) return '--';
    
    // Handle "HH:MM" or "HH:MM:SS"
    const [hour, minute] = hourStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute || 0), 0);
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  },
  
  /**
   * Format timestamp as "Oct 28, 2:30 PM"
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
};