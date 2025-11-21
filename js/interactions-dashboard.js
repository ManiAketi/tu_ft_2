window.InteractionsDashboard = {
    async loadToday() {
      try {
        const response = await fetch(
          `${CA.API_BASE}/interactions/today?device_id=${CA.state.deviceId}`
        );
        const data = await response.json();
        
        if (data.success) {
          this.updateSummaryCards(data.summary);
          this.renderInteractionsTable(data.interactions);
          this.renderCharts(data);
        }
      } catch (error) {
        console.error('[INTERACTIONS] Load failed:', error);
      }
    },
    
    updateSummaryCards(summary) {
      document.getElementById('todayTotalInteractions').textContent = summary.total_interactions;
      document.getElementById('todayTotalTime').textContent = this.formatHMS(summary.total_duration_sec);
      document.getElementById('todayActiveEmployees').textContent = summary.active_employees;
      document.getElementById('todayAvgDuration').textContent = this.formatTime(summary.avg_duration_sec);
    },
    
    renderInteractionsTable(interactions) {
      const container = document.getElementById('interactionsTableContainer');
      
      if (!interactions || interactions.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No interactions yet today.</p>';
        return;
      }
      
      let html = `
        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Camera</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      interactions.forEach(int => {
        html += `
          <tr>
            <td>${int.employee_name}</td>
            <td>${int.camera_name}</td>
            <td>${new Date(int.start).toLocaleTimeString()}</td>
            <td>${new Date(int.end).toLocaleTimeString()}</td>
            <td>${int.duration_hms}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table>';
      container.innerHTML = html;
    },
    
    renderCharts(data) {
      // Bar chart: Interactions by Employee
      const ctx1 = document.getElementById('employeeInteractionsChart');
      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: Object.keys(data.by_employee),
          datasets: [{
            label: 'Interactions',
            data: Object.values(data.by_employee).map(e => e.count),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
      
      // Line chart: Hourly Pattern
      const ctx2 = document.getElementById('hourlyPatternChart');
      new Chart(ctx2, {
        type: 'line',
        data: {
          labels: data.by_hour.map(h => `${h.hour}:00`),
          datasets: [{
            label: 'Interactions',
            data: data.by_hour.map(h => h.count),
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    },
    
    formatHMS(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
    },
    
    formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }
  };