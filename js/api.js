// API module
const CA = window.CA || {} // Declare the CA variable
CA.api = {
  async cameras(deviceId) {
    const res = await fetch(`${CA.API_BASE}/cameras?device_id=${deviceId}`)
    return res.json()
  },
  async hourly(deviceId, date, camera) {
    const res = await fetch(`${CA.API_BASE}/stats/hourly?device_id=${deviceId}&date=${date}&camera=${camera}`)
    return res.json()
  },
  async daily(deviceId, year, month, camera) {
    const res = await fetch(`${CA.API_BASE}/stats/daily?device_id=${deviceId}&year=${year}&month=${month}&camera=${camera}`)
    return res.json()
  },
  async weekdayComparison(deviceId, weeks, camera) {
    const res = await fetch(`${CA.API_BASE}/stats/weekday_comparison?device_id=${deviceId}&weeks=${weeks}&camera=${camera}`)
    return res.json()
  },
  async trend(deviceId, days, camera) {
    const res = await fetch(`${CA.API_BASE}/stats/trend?device_id=${deviceId}&days=${days}&camera=${camera}`)
    return res.json()
  },
  // NEW: Heatmap API calls
  async heatmapLatest(deviceId, camera) {
    let url = `${CA.API_BASE}/heatmap/latest?device_id=${deviceId}`;
    if (camera) url += `&camera=${camera}`;
    const res = await fetch(url);
    return res.json();
  },
  // NEW: Heatmap API calls
  async heatmapSnapshots(deviceId, date, camera) {
    let url = `${CA.API_BASE}/heatmap/snapshots?device_id=${deviceId}`;
    if (date) url += `&date=${date}`;
    if (camera) url += `&camera=${camera}`;
    const res = await fetch(url);
    return res.json();
  },

  // NEW: Daily Visits API calls
  async dailyVisitsToday(deviceId, camera) {
    let url = `${CA.API_BASE}/daily_visits/today?device_id=${deviceId}`;
    if (camera && camera !== 'Global') url += `&camera=${camera}`;
    const res = await fetch(url);
    return res.json();
  },

  async dailyVisitsHourly(deviceId, date, camera) {
    let url = `${CA.API_BASE}/daily_visits/hourly?device_id=${deviceId}&date=${date}`;
    if (camera && camera !== 'Global') url += `&camera=${camera}`;
    const res = await fetch(url);
    return res.json();
  },

  async lastAvailableDate(deviceId) {
    const res = await fetch(`${CA.API_BASE}/device/last_data?device_id=${deviceId}`);
    return res.json();
  },
  
  // Get yesterday's summary
  async yesterdaySummary(deviceId, date) {
    const res = await fetch(`${CA.API_BASE}/stats/yesterday_summary?device_id=${deviceId}&date=${date}`);
    return res.json();
  },
  
  // Get device heartbeat status
  async deviceHeartbeat(deviceId) {
    const res = await fetch(`${CA.API_BASE}/device/heartbeat?device_id=${deviceId}`);
    return res.json();
  }
}