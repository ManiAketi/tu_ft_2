/**
 * Third Umpire Dashboard - Chart Configuration Module
 * Cohesive dark-theme palette with professional styling
 * 
 * Brand Colors:
 * - Primary: #0073A4
 * - Accent: #16A6FD
 * - Background: #0E1726
 * - Text/Axis: #A0AEC0
 * - Grid: rgba(255,255,255,0.08)
 * - Average/Accent Line: #FFD166
 */

// Color palette constants
const COLORS = {
  primary: '#0073A4',
  accent: '#16A6FD',
  background: '#0E1726',
  text: '#A0AEC0',
  grid: 'rgba(255,255,255,0.08)',
  average: '#FFD166',
  hover: '#22C8F9',
  peak: '#1BD1FF',
  tooltipBg: '#0E1726',
  tooltipBorder: '#1F2937',
  tooltipTitle: '#7FC8FF',
  border: '#1F2937'
};

// Typography configuration
const TYPOGRAPHY = {
  fontFamily: '"Inter", "Poppins", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans"',
  titleColor: '#7FC8FF',
  titleWeight: 600,
  labelColor: '#A0AEC0'
};

/**
 * Creates a vertical gradient for bar charts
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} height - Chart height
 * @returns {CanvasGradient} Gradient object
 */
function createBarGradient(ctx, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.accent); // #16A6FD (top)
  gradient.addColorStop(1, COLORS.primary); // #0073A4 (bottom)
  return gradient;
}

/**
 * Creates a peak highlight gradient for specific bars
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} height - Chart height
 * @returns {CanvasGradient} Gradient object
 */
function createPeakGradient(ctx, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.peak); // #1BD1FF (top)
  gradient.addColorStop(1, COLORS.accent); // #16A6FD (bottom)
  return gradient;
}

/**
 * Creates area fill gradient for line charts
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} height - Chart height
 * @returns {CanvasGradient} Gradient object
 */
function createAreaGradient(ctx, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(22,166,253,0.22)'); // #16A6FD with opacity
  gradient.addColorStop(1, 'rgba(0,115,164,0.0)'); // #0073A4 transparent
  return gradient;
}

/**
 * Shared scales configuration for consistent styling
 * @returns {Object} Scales configuration
 */
function getSharedScales() {
  return {
    x: {
      ticks: {
        color: COLORS.text, // #A0AEC0
        font: {
          family: TYPOGRAPHY.fontFamily,
          size: 11
        }
      },
      grid: {
        color: COLORS.grid, // rgba(255,255,255,0.08)
        drawOnChartArea: true,
        drawBorder: false
      },
      border: {
        color: COLORS.border // #1F2937
      }
    },
    y: {
      ticks: {
        color: COLORS.text, // #A0AEC0
        font: {
          family: TYPOGRAPHY.fontFamily,
          size: 11
        }
      },
      grid: {
        color: COLORS.grid, // rgba(255,255,255,0.08)
        drawOnChartArea: true,
        drawBorder: false
      },
      border: {
        color: COLORS.border // #1F2937
      },
      beginAtZero: true
    }
  };
}

/**
 * Bar chart options with professional styling
 * @param {Object} overrides - Optional overrides for specific configurations
 * @returns {Object} Chart.js options object
 */
function barOptions(overrides = {}) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false, // Minimal legend - only show when multiple datasets
        labels: {
          color: COLORS.text, // #A0AEC0
          font: {
            family: TYPOGRAPHY.fontFamily,
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: COLORS.tooltipBg, // #0E1726
        titleColor: COLORS.tooltipTitle, // #7FC8FF
        bodyColor: COLORS.text, // #A0AEC0
        borderColor: COLORS.tooltipBorder, // #1F2937
        borderWidth: 1,
        cornerRadius: 6,
        padding: 8,
        titleFont: {
          family: TYPOGRAPHY.fontFamily,
          size: 12,
          weight: 600
        },
        bodyFont: {
          family: TYPOGRAPHY.fontFamily,
          size: 11
        },
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label || 'Count'}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: getSharedScales(),
    // Bar-specific spacing and sizing
    datasets: {
      bar: {
        barThickness: 28, // Consistent bar width
        categoryPercentage: 0.7, // Space between categories
        barPercentage: 0.6 // Space between bars in same category
      }
    },
    // Hover effects
    onHover: function(event, elements) {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    // Animation settings for better performance
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };

  return { ...baseOptions, ...overrides };
}

/**
 * Line chart options with area fill support
 * @param {Object} overrides - Optional overrides for specific configurations
 * @returns {Object} Chart.js options object
 */
function lineOptions(overrides = {}) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false, // Minimal legend
        labels: {
          color: COLORS.text, // #A0AEC0
          font: {
            family: TYPOGRAPHY.fontFamily,
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: COLORS.tooltipBg, // #0E1726
        titleColor: COLORS.tooltipTitle, // #7FC8FF
        bodyColor: COLORS.text, // #A0AEC0
        borderColor: COLORS.tooltipBorder, // #1F2937
        borderWidth: 1,
        cornerRadius: 6,
        padding: 8,
        titleFont: {
          family: TYPOGRAPHY.fontFamily,
          size: 12,
          weight: 600
        },
        bodyFont: {
          family: TYPOGRAPHY.fontFamily,
          size: 11
        },
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label || 'Value'}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: getSharedScales(),
    elements: {
      line: {
        tension: 0.4, // Smooth curves
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.background // #0E1726
      }
    },
    // Animation settings for better performance
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };

  return { ...baseOptions, ...overrides };
}

/**
 * Creates average line annotation
 * @param {number} averageValue - Average value to display
 * @returns {Object} Annotation configuration
 */
function createAverageLine(averageValue) {
  return {
    type: 'line',
    mode: 'horizontal',
    scaleID: 'y',
    value: averageValue,
    borderColor: COLORS.average, // #FFD166
    borderWidth: 2,
    borderDash: [4, 4], // Dashed line
    label: {
      content: `Avg ${averageValue.toFixed(1)}`,
      enabled: true,
      position: 'end',
      backgroundColor: COLORS.background, // #0E1726
      color: COLORS.average, // #FFD166
      font: {
        family: TYPOGRAPHY.fontFamily,
        size: 10,
        weight: 600
      },
      padding: 4,
      cornerRadius: 4
    }
  };
}

/**
 * Chart title styling helper
 * @param {string} title - Chart title text
 * @returns {Object} Title configuration
 */
function createChartTitle(title) {
  return {
    display: true,
    text: title,
    color: TYPOGRAPHY.titleColor, // #7FC8FF
    font: {
      family: TYPOGRAPHY.fontFamily,
      size: 14,
      weight: TYPOGRAPHY.titleWeight // 600
    },
    padding: {
      top: 10,
      bottom: 20
    }
  };
}

// Example configurations for specific chart types

/**
 * Hourly Timeline Chart Configuration
 * @param {Array} data - Chart data
 * @param {number} peakIndex - Index of peak bar to highlight
 * @returns {Object} Complete chart configuration
 */
function createHourlyChartConfig(data, peakIndex = -1) {
  // Data is expected already sorted 12 AM → 11 PM
  const labels = data.map(d => CA.utils.fmtTime(d.hour_slot));
  const counts = data.map(d => d.max_count);
  const average = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Crowd Count',
        data: counts,
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return COLORS.accent;
          
          // Create gradient for normal bars
          const gradient = createBarGradient(ctx, chartArea.bottom - chartArea.top);
          
          // Highlight peak bar if specified
          if (peakIndex >= 0 && context.dataIndex === peakIndex) {
            return createPeakGradient(ctx, chartArea.bottom - chartArea.top);
          }
          
          return gradient;
        },
        borderColor: COLORS.primary, // #0073A4
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      ...barOptions(),
      plugins: {
        ...barOptions().plugins,
        legend: { display: false },
        annotation: {
          annotations: {
            averageLine: createAverageLine(average)
          }
        }
      },
      layout: { padding: { top: 8, bottom: 8, left: 8, right: 8 } },
      onClick: function(event, elements) {
        if (elements.length) {
          const idx = elements[0].index;
          const hourData = data[idx];
          const timestamp = hourData.hour_slot;
          const count = counts[idx];
          
          // Show camera grid
          if (typeof VideoPlayer !== 'undefined') {
            VideoPlayer.showCameraGrid(timestamp, count);
          }
        }
      }
    }
  };
}

/**
 * Weekday History Chart Configuration
 * @param {Object} result - Weekday comparison data
 * @returns {Object} Complete chart configuration
 */
function createWeekdayChartConfig(result) {
  const weekdayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const numWeeks = result.weeks ? result.weeks.length : 0;
  const weeksReversed = [...result.weeks].reverse();
  
  const baseColor = [22, 166, 253]; // #16A6FD RGB
  const datasets = weeksReversed.map((ws, idx) => {
    const light = (idx + 1) / numWeeks;
    const alpha = 0.25 + 0.55 * light;
    const bg = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${alpha.toFixed(2)})`;
    const border = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},1)`;
    
    const backendIdx = numWeeks - 1 - idx;
    const data = weekdayLabels.map(day => {
      if (result.data && result.data[day] && Array.isArray(result.data[day])) {
        if (backendIdx < result.data[day].length) {
          return result.data[day][backendIdx] || 0;
        }
      }
      return 0;
    });
    
    const weekDate = new Date(ws);
    const weekLabel = `Week of ${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    return {
      label: weekLabel,
      data,
      backgroundColor: bg,
      borderColor: border,
      borderWidth: 1,
      borderRadius: 4,
      stack: 'week'
    };
  });

  // Calculate averages for annotation
  const averages = weekdayLabels.map((day, dayIdx) => {
    const dayTotal = datasets.reduce((sum, ds) => sum + ds.data[dayIdx], 0);
    return dayTotal > 0 ? (dayTotal / numWeeks) : 0;
  });
  const overallAverage = averages.reduce((a, b) => a + b, 0) / averages.length;

  return {
    type: 'bar',
    data: {
      labels: weekdayLabels,
      datasets
    },
    options: {
      ...barOptions({
        scales: {
          ...getSharedScales(),
          x: { ...getSharedScales().x, stacked: true },
          y: { ...getSharedScales().y, stacked: true }
        },
        plugins: {
          ...barOptions().plugins,
          legend: { display: false },
          annotation: {
            annotations: {
              averageLine: createAverageLine(overallAverage)
            }
          }
        },
        layout: { padding: { top: 8, bottom: 8, left: 8, right: 8 } }
      })
    }
  };
}

/**
 * Last 30 Days Trend Chart Configuration
 * @param {Array} data - Trend data
 * @returns {Object} Complete chart configuration
 */
function createTrendChartConfig(data) {
  const labels = data.map(d => CA.utils.fmtDate(d.date));
  const values = data.map(d => d.max_count || 0);
  const maxValue = Math.max(...values);
  const maxIndex = values.indexOf(maxValue);
  const average = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Daily Peak Count',
        data: values,
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(22,166,253,0.22)';
          return createAreaGradient(ctx, chartArea.bottom - chartArea.top);
        },
        borderColor: COLORS.accent, // #16A6FD
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: values.map((v, i) => i === maxIndex ? 6 : 4),
        pointHoverRadius: values.map((v, i) => i === maxIndex ? 8 : 6),
        pointBackgroundColor: values.map((v, i) => i === maxIndex ? '#EF4444' : COLORS.accent),
        pointBorderColor: COLORS.background, // #0E1726
        pointBorderWidth: 2
      }]
    },
    options: {
      ...lineOptions(),
      plugins: {
        ...lineOptions().plugins,
        legend: { display: false },
        annotation: {
          annotations: {
            averageLine: createAverageLine(average)
          }
        }
      },
      layout: { padding: { top: 8, bottom: 8, left: 8, right: 8 } }
    }
  };
}

// Export all functions for use in other modules
window.ChartConfig = {
  COLORS,
  TYPOGRAPHY,
  createBarGradient,
  createPeakGradient,
  createAreaGradient,
  getSharedScales,
  barOptions,
  lineOptions,
  createAverageLine,
  createChartTitle,
  createHourlyChartConfig,
  createWeekdayChartConfig,
  createTrendChartConfig
};
