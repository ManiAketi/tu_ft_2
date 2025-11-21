// Weekday stacked chart module - Simplified design
window.CA = window.CA || {}

CA.weekday = {
  async load() {
    try {
      const s = CA.state
      const weeksSel = CA.utils.$("weekCountSelect")
      const weeks = Number.parseInt((weeksSel && weeksSel.value) || "4")

      const res = await CA.api.weekdayComparison(s.deviceId, weeks, s.camera)

      console.log("Weekday API response:", res)

      if (res && res.data && res.weeks) {
        this.render(res)
      } else {
        console.warn("Invalid weekday data structure:", res)
        this.showNoData()
      }
    } catch (error) {
      console.error("Error loading weekday comparison:", error)
      this.showNoData()
    }
  },

  showNoData() {
    const ctx = CA.utils.$("weekdayChart")
    if (CA.state.charts.weekday) CA.state.charts.weekday.destroy()

    CA.state.charts.weekday = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["No Data Available"],
        datasets: [{
          label: "No Data",
          data: [0],
          backgroundColor: "rgba(200,200,200,0.3)",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    })
  },

  render(result) {
    const ctx = CA.utils.$("weekdayChart")
    if (CA.state.charts.weekday) CA.state.charts.weekday.destroy()
  
    const numWeeks = result.weeks ? result.weeks.length : 0
  
    if (numWeeks === 0) {
      console.warn("No weeks data available")
      this.showNoData()
      return
    }
  
    console.log("[Weekday Chart] Processing", numWeeks, "weeks")
  
    // Week colors with gradient support
    const weekColors = [
      { 
        top: 'rgba(59, 130, 246, 0.9)',    // Bright blue
        bottom: 'rgba(59, 130, 246, 0.6)', // Lighter blue
        border: '#3B82F6' 
      },
      { 
        top: 'rgba(245, 158, 11, 0.9)',    // Bright amber
        bottom: 'rgba(245, 158, 11, 0.6)', // Lighter amber
        border: '#F59E0B' 
      },
      { 
        top: 'rgba(16, 185, 129, 0.9)',    // Bright emerald
        bottom: 'rgba(16, 185, 129, 0.6)', // Lighter emerald
        border: '#10B981' 
      },
      { 
        top: 'rgba(107, 114, 128, 0.9)',   // Bright slate
        bottom: 'rgba(107, 114, 128, 0.6)', // Lighter slate
        border: '#6B7280' 
      }
    ];
  
    const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const datasets = [];
    for (let w = 0; w < numWeeks; w++) {
      const weekData = weekdayNames.map(day => result.data[day][w] || 0);
      const colorSet = weekColors[w] || weekColors[weekColors.length - 1];
      
      datasets.push({
        label: `Week ${w + 1}`,
        data: weekData,
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          
          if (!chartArea) {
            return colorSet.top;
          }
          
          // Create gradient for each week
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, colorSet.top);
          gradient.addColorStop(1, colorSet.bottom);
          
          return gradient;
        },
        borderColor: colorSet.border,
        borderWidth: 1,
        barThickness: 'flex',
        maxBarThickness: 60,
        borderRadius: 4,
        borderSkipped: false
      });
    }
  
    const config = {
      type: 'bar',
      data: {
        labels: weekdayNames,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 15,
              padding: 12,
              font: { size: 12 },
              color: '#A0AEC0'
            }
          },
          datalabels: {
            color: '#fff',
            font: { weight: 'bold', size: 10 },
            formatter: (value) => value > 10 ? value : '',
            anchor: 'center',
            align: 'center'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.y}`;
              },
              afterBody: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                return `Total: ${total}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { 
              display: false 
            },
            ticks: {
              color: '#A0AEC0',
              font: { size: 11 }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: { 
              display: true, 
              text: 'Crowd Count',
              color: '#A0AEC0'
            },
            ticks: {
              color: '#A0AEC0',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.08)'
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    };
  
    CA.state.charts.weekday = new Chart(ctx, config);
  },
}