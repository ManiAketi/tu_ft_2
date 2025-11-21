(function () {
  window.CA = window.CA || {};

  const BREAKPOINTS = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  };

  const HEIGHTS = {
    xs: 280,
    sm: 280,
    md: 320,
    lg: 360,
    xl: 400
  };

  function getBreakpoint() {
    const w = window.innerWidth;
    if (w >= BREAKPOINTS.xl) return "xl";
    if (w >= BREAKPOINTS.lg) return "lg";
    if (w >= BREAKPOINTS.md) return "md";
    if (w >= BREAKPOINTS.sm) return "sm";
    return "xs";
  }

  function getCurrentHeight() {
    return HEIGHTS[getBreakpoint()];
  }

  function setRootChartHeight(px) {
    document.documentElement.style.setProperty("--chart-h", `${px}px`);
  }

  function attachResponsiveCanvas(canvasId, chartKey) {
    const el = document.getElementById(canvasId);
    if (!el) return;

    const h = getCurrentHeight();
    setRootChartHeight(h);
    el.height = h;
    el.style.height = `${h}px`;
    if (el.parentElement) {
      el.parentElement.style.minHeight = `${h}px`;
    }

    const ro = new ResizeObserver(() => {
      // Defer to next frame so CSS layout finishes before resizing Chart.js
      requestAnimationFrame(() => {
        const hNow = getCurrentHeight();
        setRootChartHeight(hNow);
        el.height = hNow;
        el.style.height = `${hNow}px`;
        if (el.parentElement) {
          el.parentElement.style.minHeight = `${hNow}px`;
        }
        try {
          const inst = CA.state && CA.state.charts && CA.state.charts[chartKey];
          if (inst && typeof inst.resize === "function") inst.resize();
        } catch {}
      });
    });

    ro.observe(el.parentElement || el);
  }

  function handleResize() {
    const hNow = getCurrentHeight();
    setRootChartHeight(hNow);
    ["hourly", "weekday", "trend"].forEach((key) => {
      const inst = CA.state && CA.state.charts && CA.state.charts[key];
      if (inst && typeof inst.resize === "function") {
        inst.resize();
        // Force a layout update pass in Chart.js without animation
        if (typeof inst.update === "function") inst.update("none");
      }
    });
  }

  function observeDashboardVisibility() {
    const dash = document.getElementById("dashboardSection");
    if (!dash) return;
    const mo = new MutationObserver(() => {
      if (getComputedStyle(dash).display !== "none") handleResize();
    });
    mo.observe(dash, { attributes: true, attributeFilter: ["style", "class"] });
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) handleResize();
  });

  CA.layout = {
    attachResponsiveCanvas,
    handleResize,
    currentHeight: getCurrentHeight,
    observeDashboardVisibility
  };
})();


