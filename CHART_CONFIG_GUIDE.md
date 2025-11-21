# Third Umpire Dashboard - Chart Configuration Usage Guide

## Overview
The new chart configuration system provides cohesive dark-theme styling across all charts with professional gradients, consistent spacing, and accessibility-compliant contrast ratios.

## Quick Start

### 1. Include the Chart Configuration Module
```html
<script src="js/chart-config.js"></script>
```

### 2. Use Pre-configured Chart Types

#### Hourly Timeline Chart
```javascript
// Automatically handles peak highlighting and click events
const config = ChartConfig.createHourlyChartConfig(data, peakIndex);
const chart = new Chart(ctx, config);
```

#### Weekday History Chart
```javascript
// Handles stacked bars with week comparisons
const config = ChartConfig.createWeekdayChartConfig(result);
const chart = new Chart(ctx, config);
```

#### Trend Chart (30 Days)
```javascript
// Line chart with area fill and peak highlighting
const config = ChartConfig.createTrendChartConfig(data);
const chart = new Chart(ctx, config);
```

### 3. Custom Chart Options

#### Bar Charts
```javascript
const options = ChartConfig.barOptions({
  plugins: {
    title: ChartConfig.createChartTitle('Custom Title')
  }
});
```

#### Line Charts
```javascript
const options = ChartConfig.lineOptions({
  plugins: {
    title: ChartConfig.createChartTitle('Custom Line Chart')
  }
});
```

## Color Palette

- **Primary**: #0073A4 (dark blue)
- **Accent**: #16A6FD (bright blue)
- **Background**: #0E1726 (dark navy)
- **Text/Axis**: #A0AEC0 (light gray)
- **Grid**: rgba(255,255,255,0.08) (subtle white)
- **Average Line**: #FFD166 (golden yellow)
- **Peak Highlight**: #1BD1FF (cyan)

## Features

### ✅ Professional Gradients
- Vertical gradients from accent to primary color
- Peak bar highlighting with cyan gradient
- Area fill gradients for line charts

### ✅ Consistent Spacing
- Bar thickness: 28px
- Category percentage: 0.7
- Bar percentage: 0.6
- Consistent padding and margins

### ✅ Accessibility
- WCAG AA compliant contrast ratios (≥4.5:1)
- High contrast text and grid lines
- Keyboard navigation support

### ✅ Interactive Features
- Hover effects with glow
- Click handlers for video grid
- Tooltip with monospace numbers
- Average line annotations

### ✅ Typography
- Inter/Poppins font family
- Consistent font weights and sizes
- Small caps chart titles
- Professional color hierarchy

## Migration Notes

The existing chart modules (hourly.js, weekday.js, trend.js) have been updated to use the new configuration system. No changes are needed to existing functionality - the charts will automatically use the new styling.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

All modern browsers with Canvas and ES6 support.
