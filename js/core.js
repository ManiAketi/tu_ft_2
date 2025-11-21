// Core shared state and utilities
window.CA = window.CA || {}
CA.API_BASE = "http://localhost:5000/api" // VPS Backend API
CA.VIDEO_BASE = "http://localhost:15000" // FRP Tunnel for Video
function getTodayLocalISODate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}` // local date, not UTC
}

CA.state = {
  charts: {},
  deviceId: "null",
  date: getTodayLocalISODate(),
  camera: "Global",
}

CA.data = {
  cameras: null,
}

CA.utils = {
  $(id) {
    return document.getElementById(id)
  },
  fmtDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  },
  fmtTime(ts) {
    const d = new Date(ts)
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  },
}
