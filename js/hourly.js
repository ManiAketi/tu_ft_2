// Hourly chart module - FIXED v2 - Handles zero-count bar clicks
window.CA = window.CA || {};
CA.hourly = {
  rawData: null,
  
  updateDateLabel(dateStr) {
    const labelEl = CA.utils.$("hourlyDateLabel");
    if (labelEl && dateStr) {
      const d = new Date(dateStr);
      labelEl.textContent = `(${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })})`;
    }
  },

  async load() {
    try {
      const s = CA.state;
      const res = await CA.api.hourly(s.deviceId, s.date, s.camera);
      
      console.log('📊 [Hourly] API Response:', res);
      
      if (res.data && res.data.length > 0) {
        console.log(`📊 [Hourly] Received ${res.data.length} data points`);
        // Update date label with the actual date being displayed
        this.updateDateLabel(s.date);
        this.render(res.data);
        this.updateStats(res.data);
        return;
      }
      
      console.warn('⚠️ [Hourly] No data for selected date, trying fallback...');
      
      // Fallback by trend
      const trend = await CA.api.trend(s.deviceId, 30, s.camera);
      if (trend.data && trend.data.length > 0) {
        const last = trend.data[trend.data.length - 1];
        console.log('📊 [Hourly] Fallback to last available date:', last.date);
        s.date = last.date;
        CA.utils.$("selectedDate").value = s.date;
        const retry = await CA.api.hourly(s.deviceId, s.date, s.camera);
        if (retry.data && retry.data.length > 0) {
          // Update date label with the fallback date
          this.updateDateLabel(s.date);
          this.render(retry.data);
          this.updateStats(retry.data);
          return;
        }
      }
      
      console.error('❌ [Hourly] No data available');
      if (CA.state.charts.hourly) CA.state.charts.hourly.destroy();
      this.clearStats();
      alert(`No data available for ${s.date}. Please select a different date.`);
      
    } catch (error) {
      console.error("❌ [Hourly] Error loading stats:", error);
      if (CA.state.charts.hourly) CA.state.charts.hourly.destroy();
      this.clearStats();
      alert('Error loading hourly data. Please check console for details.');
    }
  },
  
  render(data) {
    const ctx = CA.utils.$("hourlyChart");
    if (!ctx) {
      console.error('❌ [Hourly] Canvas element not found');
      return;
    }
    
    if (CA.state.charts.hourly) {
      CA.state.charts.hourly.destroy();
    }
    
    console.log("📊 [Hourly] Rendering data:", data);
    console.log("📊 [Hourly] Data length:", data.length);
    if (data.length > 0) {
      console.log("📊 [Hourly] Sample data point:", data[0]);
    }
    
    // Normalize to 24 buckets from 12 AM → 11 PM
    const byHour = new Map();
    const rawDataByHour = new Map();
    
    data.forEach((d, idx) => {
      // Validate data structure
      if (!d || !d.hour_slot) {
        console.warn(`⚠️ [Hourly] Invalid data at index ${idx}:`, d);
        return;
      }
      
      try {
        const h = new Date(d.hour_slot).getHours();
        
        // Validate hour
        if (isNaN(h) || h < 0 || h > 23) {
          console.warn(`⚠️ [Hourly] Invalid hour ${h} at index ${idx}:`, d);
          return;
        }
        
        console.log(`  Hour ${h}: count=${d.max_count || 0}, peak=${d.peak_timestamp || 'N/A'}`);
        
        byHour.set(h, d.max_count || 0);
        rawDataByHour.set(h, d);
      } catch (err) {
        console.error(`❌ [Hourly] Error processing index ${idx}:`, err, d);
      }
    });
    
    const dateStr = CA.state.date;
    const sorted = [];
    
    // ALWAYS show full 24 hours (0-23) regardless of data
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, "0");
      const rawData = rawDataByHour.get(h);
      
      // Create complete data object with fallbacks
      const dataPoint = {
        hour_slot: `${dateStr}T${hh}:00:00`,
        max_count: byHour.get(h) || 0,
        peak_timestamp: rawData?.peak_timestamp || `${dateStr}T${hh}:00:00`,
        avg_count: rawData?.avg_count || 0
      };
      
      sorted.push(dataPoint);
    }
    
    console.log("📊 [Hourly] Normalized to 24 hours. Summary:");
    console.log(sorted.map((s, i) => `  ${String(i).padStart(2, '0')}:00 = ${s.max_count}`).join('\n'));
    
    this.rawData = sorted;
    
    // Get top 5 indices
    const counts = sorted.map(d => d.max_count);
    const indexedCounts = counts.map((val, idx) => ({ val, idx }))
      .filter(item => item.val > 0)
      .sort((a, b) => b.val - a.val);
    
    const top5Indices = new Map();
    indexedCounts.slice(0, 5).forEach((item, rank) => {
      top5Indices.set(item.idx, rank + 1);
    });
    
    console.log("🏆 [Hourly] Top 5 hours:", Array.from(top5Indices.entries()).map(([idx, rank]) => `${idx}:00 (rank ${rank})`));
    
    // Label colors for top 5
    const labelColors = {
      1: '#EF4444',   // Red
      2: '#F59E0B',   // Amber
      3: '#10B981',   // Emerald
      4: '#3B82F6',   // Blue
      5: '#8B5CF6',   // Purple
      other: '#FFFFFF' // White
    };
    
    const config = {
      type: 'bar',
      data: {
        labels: sorted.map(d => {
          const dt = new Date(d.hour_slot);
          const hour = dt.getHours();
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${displayHour} ${ampm}`;
        }),
        datasets: [{
          label: 'Crowd Count',
          data: counts,
          backgroundColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            
            if (!chartArea) {
              return 'rgba(59, 130, 246, 0.7)';
            }
            
            // Create gradient from top to bottom
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
            gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.7)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.5)');
            
            return gradient;
          },
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          barThickness: 'flex',
          maxBarThickness: 40,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // 🔥 FIX: Use canvas click handler instead of Chart.js onClick
        // This allows clicking anywhere on the chart, not just on bars
        onClick: (evt, elements, chart) => {
          console.log('🖱️ [Hourly] Chart clicked');
          console.log('  Event:', evt);
          console.log('  Elements:', elements);
          console.log('  Elements length:', elements?.length);
          
          // 🔥 NEW: Calculate clicked bar index from mouse position
          let clickedIndex = -1;
          
          if (elements && elements.length > 0) {
            // Bar was clicked directly
            clickedIndex = elements[0].index;
            console.log('📍 [Hourly] Direct bar click, index:', clickedIndex);
          } else {
            // 🔥 Calculate index from x position for zero-height bars
            const canvasPosition = Chart.helpers.getRelativePosition(evt, chart);
            const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
            
            if (dataX !== undefined && dataX >= 0 && dataX < 24) {
              clickedIndex = Math.round(dataX);
              console.log('📍 [Hourly] Calculated index from position:', clickedIndex);
            } else {
              console.log('ℹ️ [Hourly] Click outside chart area');
              return;
            }
          }
          
          // Validate index
          if (clickedIndex < 0 || clickedIndex >= 24) {
            console.warn('⚠️ [Hourly] Invalid index:', clickedIndex);
            return;
          }
          
          const hourData = this.rawData[clickedIndex];
          console.log('📍 [Hourly] Hour data:', hourData);
          
          // Validate data
          if (!hourData) {
            console.error('❌ [Hourly] No data for clicked bar at index', clickedIndex);
            alert('No data available for this hour');
            return;
          }
          
          if (hourData.max_count === 0) {
            console.warn('⚠️ [Hourly] Clicked hour has zero count');
            alert('No crowd data recorded for this hour');
            return;
          }
          
          const timestamp = hourData.peak_timestamp || hourData.hour_slot;
          const count = hourData.max_count || 0;
          
          console.log('🎬 [Hourly] Opening video grid with:', { timestamp, count });
          
          // Check VideoPlayer availability
          if (typeof VideoPlayer === 'undefined') {
            console.error('❌ [Hourly] VideoPlayer not defined');
            alert('Video player not initialized. Please refresh the page.');
            return;
          }
          
          if (typeof VideoPlayer.showCameraGrid !== 'function') {
            console.error('❌ [Hourly] VideoPlayer.showCameraGrid not a function');
            alert('Video player not properly initialized. Please refresh the page.');
            return;
          }
          
          try {
            VideoPlayer.showCameraGrid(timestamp, count);
            console.log('✅ [Hourly] Video grid opened successfully');
          } catch (err) {
            console.error('❌ [Hourly] Error opening video grid:', err);
            alert('Error opening video player: ' + err.message);
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              generateLabels: () => {
                return [
                  { text: '1st', fillStyle: labelColors[1], strokeStyle: labelColors[1] },
                  { text: '2nd', fillStyle: labelColors[2], strokeStyle: labelColors[2] },
                  { text: '3rd', fillStyle: labelColors[3], strokeStyle: labelColors[3] },
                  { text: '4th', fillStyle: labelColors[4], strokeStyle: labelColors[4] },
                  { text: '5th', fillStyle: labelColors[5], strokeStyle: labelColors[5] },
                  { text: 'Others', fillStyle: labelColors.other, strokeStyle: labelColors.other }
                ];
              },
              boxWidth: 15,
              padding: 12,
              font: { size: 12 }
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            offset: 4,
            formatter: (value, context) => {
              if (value === 0) return '';
              return value;
            },
            font: { weight: 'bold', size: 11 },
            color: (context) => {
              const rank = top5Indices.get(context.dataIndex);
              return rank ? labelColors[rank] : labelColors.other;
            },
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 4,
            padding: { top: 2, bottom: 2, left: 6, right: 6 }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: '#0E1726',
            titleColor: '#7FC8FF',
            bodyColor: '#A0AEC0',
            borderColor: '#1F2937',
            borderWidth: 1,
            cornerRadius: 6,
            padding: 10,
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                const hourData = this.rawData[index];
                const label = context[0].label;
                
                if (!hourData) {
                  return label;
                }
                
                const dt = new Date(hourData.hour_slot);
                return `${label} (${dt.toLocaleDateString()})`;
              }.bind(this),
              label: function(context) {
                const value = context.parsed.y;
                return `Count: ${value}`;
              },
              afterLabel: function(context) {
                const index = context.dataIndex;
                const hourData = this.rawData[index];
                
                if (!hourData) {
                  return '';
                }
                
                const parts = [];
                
                // Show average if available
                if (hourData.avg_count && hourData.avg_count > 0) {
                  parts.push(`Average: ${Math.round(hourData.avg_count)}`);
                }
                
                // Show peak timestamp if different from hour_slot
                if (hourData.peak_timestamp && hourData.peak_timestamp !== hourData.hour_slot) {
                  try {
                    const peakTime = new Date(hourData.peak_timestamp);
                    if (!isNaN(peakTime.getTime())) {
                      parts.push(`Peak at: ${peakTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit'
                      })}`);
                    }
                  } catch (err) {
                    console.error('Error formatting peak time:', err);
                  }
                }
                
                // Add click hint for non-zero values
                if (hourData.max_count > 0) {
                  parts.push('');
                  parts.push('🎬 Click bar to view video');
                } else {
                  parts.push('');
                  parts.push('No data for this hour');
                }
                
                return parts.join('\n');
              }.bind(this)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Count' },
            ticks: {
              color: '#A0AEC0',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.08)'
            }
          },
          x: {
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
    
    try {
      CA.state.charts.hourly = new Chart(ctx, config);
      console.log('✅ [Hourly] Chart rendered successfully');
    } catch (err) {
      console.error('❌ [Hourly] Error creating chart:', err);
      alert('Error rendering chart. Please check console for details.');
    }
  },
  
  async updateStats(hourlyData) {
    console.log('📊 [Hourly] Updating stats...');
    
    // Fetch today's visitors from daily visits API
    try {
      const todayRes = await CA.api.dailyVisitsToday(CA.state.deviceId, CA.state.camera);
      const todayVisitors = todayRes?.today_total || 0;
      
      const todayVisitorsEl = CA.utils.$("todayVisitors");
      if (todayVisitorsEl) {
        todayVisitorsEl.textContent = todayVisitors;
        console.log(`  Today's visitors: ${todayVisitors}`);
      }
    } catch (error) {
      console.warn("⚠️ [Hourly] Could not fetch today's visitors:", error);
    }
    
    // Compute peak hour from analytics (hourlyData)
    try {
      if (Array.isArray(hourlyData) && hourlyData.length > 0) {
        const peakItem = hourlyData.reduce((maxItem, item) =>
          (item?.max_count || 0) > (maxItem?.max_count || 0) ? item : maxItem
        , hourlyData[0]);
        
        if (peakItem && peakItem.hour_slot) {
          const peakHourVal = new Date(peakItem.hour_slot).getHours();
          if (!isNaN(peakHourVal)) {
            const ampm = peakHourVal >= 12 ? 'PM' : 'AM';
            const displayHour = peakHourVal === 0 ? 12 : peakHourVal > 12 ? peakHourVal - 12 : peakHourVal;
            const peakHourEl = CA.utils.$("peakHour");
            if (peakHourEl) {
              peakHourEl.textContent = `${displayHour}:00 ${ampm}`;
              console.log(`  Peak hour (analytics): ${displayHour}:00 ${ampm}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ [Hourly] Could not compute peak hour from analytics:", error);
    }
    
    // Update crowd density stats (Peak Today, Average)
    const all = hourlyData.map(d => d.max_count || 0);
    const peak = Math.max(...all);
    const validCounts = all.filter(c => c > 0);
    const avg = validCounts.length > 0 
      ? Math.round(validCounts.reduce((a, b) => a + b, 0) / validCounts.length)
      : 0;
    
    const todayPeakEl = CA.utils.$("todayPeak");
    const hourAverageEl = CA.utils.$("hourAverage");
    
    if (todayPeakEl) {
      todayPeakEl.textContent = peak;
      console.log(`  Peak today: ${peak}`);
    }
    
    if (hourAverageEl) {
      hourAverageEl.textContent = avg;
      console.log(`  Average: ${avg}`);
    }
    
    console.log('✅ [Hourly] Stats updated');
  },
  
  clearStats() {
    console.log('🧹 [Hourly] Clearing stats...');
    const elements = ["todayVisitors", "peakHour", "todayPeak", "hourAverage"];
    elements.forEach(id => {
      const el = CA.utils.$(id);
      if (el) el.textContent = "-";
    });
  }
};