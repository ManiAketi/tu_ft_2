// Trend chart module
window.CA = window.CA || {}

CA.trend = {
  async load() {
    try {
      const s = CA.state
      const res = await CA.api.trend(s.deviceId, 30, s.camera)

      console.log("[Trend] API response:", res)

      if (res && res.data && res.data.length > 0) {
        this.render(res.data)
      } else {
        console.warn("[Trend] No data available")
        this.showNoData()
      }
    } catch (error) {
      console.error("Error loading trend stats:", error)
      this.showNoData()
    }
  },

  showNoData() {
    const ctx = CA.utils.$("trendChart")
    if (CA.state.charts.trend) CA.state.charts.trend.destroy()

    const tempChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["No Data Available"],
        datasets: [
          {
            label: "No Data",
            data: [0],
            backgroundColor: "rgba(200,200,200,0.2)",
            borderColor: "rgba(200,200,200,0.5)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
      },
    })
    CA.state.charts.trend = tempChart
  },

  render(data) {
    const ctx = CA.utils.$("trendChart")
    if (CA.state.charts.trend) CA.state.charts.trend.destroy()
    if (CA.layout && CA.layout.attachResponsiveCanvas) {
      CA.layout.attachResponsiveCanvas("trendChart", "trend")
    }

    if (!data || data.length === 0) {
      this.showNoData()
      return
    }

    console.log("[Trend] Rendering", data.length, "days of data")

    // Use the new chart configuration
    const config = ChartConfig.createTrendChartConfig(data)
    
    CA.state.charts.trend = new Chart(ctx, config)
  },
}
