// Calendar module with month navigation, video indicators, and future date blocking
window.CA = window.CA || {}
CA.calendar = {
  currentYear: null,
  currentMonth: null,

  async load() {
    try {
      const s = CA.state
      const d = new Date(s.date)

      // Initialize current year/month if not set
      if (!this.currentYear) this.currentYear = d.getFullYear()
      if (!this.currentMonth) this.currentMonth = d.getMonth() + 1

      const res = await CA.api.daily(s.deviceId, this.currentYear, this.currentMonth, s.camera)
      if (res.data) this.render(res.data, this.currentYear, this.currentMonth)
    } catch (error) {
      console.error("Error loading daily stats:", error)
    }
  },

  prevMonth() {
    this.currentMonth--
    if (this.currentMonth < 1) {
      this.currentMonth = 12
      this.currentYear--
    }
    this.load()
  },

  nextMonth() {
    this.currentMonth++
    if (this.currentMonth > 12) {
      this.currentMonth = 1
      this.currentYear++
    }
    this.load()
  },

  goToToday() {
    const today = new Date()
    this.currentYear = today.getFullYear()
    this.currentMonth = today.getMonth() + 1
    this.load()
  },

  async loadHourlyForDate(dateStr) {
    try {
      console.log(`📅 Loading hourly data for date: ${dateStr}`)
      
      // Update the state with the selected date
      CA.state.date = dateStr
      
      // Update the date input field
      const dateInput = CA.utils.$("selectedDate")
      if (dateInput) {
        dateInput.value = dateStr
      }
      
      // Load hourly data for the selected date
      if (CA.hourly && CA.hourly.load) {
        await CA.hourly.load()
        console.log(`✅ Hourly data loaded for ${dateStr}`)
      } else {
        console.error("CA.hourly.load not available")
      }
    } catch (error) {
      console.error("Error loading hourly data for date:", error)
    }
  },

  render(data, year, month) {
    const container = CA.utils.$("calendarContainer")
    if (!container) {
      console.warn("Calendar container not found - element ID should be 'calendarContainer'")
      return
    }
    container.innerHTML = ""

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ]
    
    // Navigation header
    const navHeader = document.createElement("div")
    navHeader.className = "calendar-nav-header"
    navHeader.innerHTML = `
      <button class="calendar-nav-btn" onclick="CA.calendar.prevMonth()">
        <i class="bi bi-chevron-left"></i>
      </button>
      <div class="calendar-month-title">${monthNames[month - 1]} ${year}</div>
      <button class="calendar-nav-btn" onclick="CA.calendar.nextMonth()">
        <i class="bi bi-chevron-right"></i>
      </button>
      <button class="calendar-today-btn" onclick="CA.calendar.goToToday()">Today</button>
    `
    container.appendChild(navHeader)

    // Weekday header (starting with Sunday)
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const header = document.createElement("div")
    header.className = "calendar-header"
    weekdayNames.forEach((n) => {
      const c = document.createElement("div")
      c.className = "calendar-header-cell"
      c.textContent = n
      header.appendChild(c)
    })
    container.appendChild(header)

    // Calendar grid
    const grid = document.createElement("div")
    grid.className = "calendar-grid"
    const first = new Date(year, month - 1, 1)
    const startDay = first.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = new Date(year, month, 0).getDate()
    const total = Math.ceil((startDay + daysInMonth) / 7) * 7

    // Get today's date for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time for accurate comparison
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1
    const todayDate = today.getDate()

    for (let slot = 0; slot < total; slot++) {
      const cell = document.createElement("div")
      cell.className = "calendar-cell"
      const dayNum = slot - startDay + 1

      if (dayNum >= 1 && dayNum <= daysInMonth) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
        const cellDate = new Date(year, month - 1, dayNum)
        cellDate.setHours(0, 0, 0, 0)
        
        const value = data[dateStr] || 0
        const isFuture = cellDate > today
        const isToday = isCurrentMonth && dayNum === todayDate

        // Format date as "1 Oct"
        const monthAbbr = monthNames[month - 1].substring(0, 3)
        const dateFormatted = `${dayNum} ${monthAbbr}`

        // Styling for today
        if (isToday) {
          cell.classList.add("is-today")
        }

        // Disable future dates
        if (isFuture) {
          cell.classList.add("is-future")
          cell.style.opacity = "0.3"
          cell.style.cursor = "not-allowed"
        } else if (value > 0) {
          // Clickable past dates with data
          cell.classList.add("clickable")
          cell.title = `Click to view hourly data for ${dateStr} (Peak: ${value})`
          cell.addEventListener("click", () => {
            this.loadHourlyForDate(dateStr)
          })
        }

        // Two-part cell structure: white top section and colored bottom section
        const dayEl = document.createElement("div")
        dayEl.className = "calendar-day"
        dayEl.textContent = dateFormatted

        const valueEl = document.createElement("div")
        valueEl.className = "calendar-value"
        valueEl.textContent = value ? String(value) : ""
        
        // Apply color gradient to the value section based on value ranges
        if (value > 0 && !isFuture) {
          let bgColor = ""
          if (value <= 65) {
            bgColor = "#fef9c3" // Greenish-Yellow
          } else if (value <= 101) {
            bgColor = "#fde047" // Yellow
          } else if (value <= 111) {
            bgColor = "#fbbf24" // Amber/Light Orange
          } else {
            bgColor = "#f97316" // Orange/Darker Orange
          }
          valueEl.style.backgroundColor = bgColor
        } else if (value === 0 && !isFuture) {
          // Empty cells with no data should have a light gray background
          valueEl.style.backgroundColor = "#f3f4f6"
        }

        // Add green dot indicator for video availability
        if (value > 0 && !isFuture) {
          const videoDot = document.createElement("div")
          videoDot.className = "video-indicator"
          videoDot.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            width: 6px;
            height: 6px;
            background-color: #10B981;
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(16, 185, 129, 0.8);
          `
          videoDot.title = "Video available"
          cell.appendChild(videoDot)
        }

        cell.appendChild(dayEl)
        cell.appendChild(valueEl)
      } else {
        cell.classList.add("is-empty")
      }
      grid.appendChild(cell)
    }
    container.appendChild(grid)
  },
}