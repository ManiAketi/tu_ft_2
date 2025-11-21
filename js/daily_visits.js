// Daily Visits module
window.CA = window.CA || {};

CA.dailyVisits = {
  async load() {
    try {
      const s = CA.state;
      
      // Load today's total
      const todayRes = await CA.api.dailyVisitsToday(s.deviceId, s.camera);
      
      // Load hourly breakdown
      const hourlyRes = await CA.api.dailyVisitsHourly(s.deviceId, s.date, s.camera);
      
      if (todayRes && hourlyRes) {
        this.updateStats(todayRes.today_total, hourlyRes.data);
        this.renderChart(hourlyRes.data);
      }
      
    } catch (error) {
      console.error("Error loading daily visits:", error);
      this.showNoData();
    }
  },
  
  updateStats(todayTotal, hourlyData) {
    // Update stat cards
    document.getElementById('dailyVisitsToday').textContent = todayTotal;
    
    if (hourlyData && hourlyData.length > 0) {
      // Find peak hour
      const peak = hourlyData.reduce((max, item) => 
        item.visitor_count > max.visitor_count ? item : max
      );
      const peakHour = new Date(peak.hour_slot).getHours();
      document.getElementById('dailyVisitsPeak').textContent = `${peakHour}:00`;
      
      // Calculate average
      const avg = Math.round(
        hourlyData.reduce((sum, item) => sum + item.visitor_count, 0) / hourlyData.length
      );
      document.getElementById('dailyVisitsAvg').textContent = avg;
    } else {
      document.getElementById('dailyVisitsPeak').textContent = '-';
      document.getElementById('dailyVisitsAvg').textContent = '-';
    }
  },
  
  renderChart(data) {
    const ctx = document.getElementById('dailyVisitsChart');
    
    if (CA.state.charts.dailyVisits) {
      CA.state.charts.dailyVisits.destroy();
    }
    
    if (!data || data.length === 0) {
      this.showNoData();
      return;
    }
    
    const labels = data.map(d => {
      const dt = new Date(d.hour_slot);
      return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    });
    
    const values = data.map(d => d.visitor_count);
    
    CA.state.charts.dailyVisits = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Visitors',
          data: values,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Visitor Count' }
          }
        }
      }
    });
  },
  
  showNoData() {
    const ctx = document.getElementById('dailyVisitsChart');
    if (CA.state.charts.dailyVisits) {
      CA.state.charts.dailyVisits.destroy();
    }
    
    CA.state.charts.dailyVisits = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data',
          data: [0],
          backgroundColor: 'rgba(200, 200, 200, 0.3)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
};