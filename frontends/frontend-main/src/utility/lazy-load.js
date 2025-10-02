// Lazy loading utility for heavy components in low memory mode
export const isLowMemoryMode = () => {
  return process.env.MEMORY_MODE === 'low' || process.env.MEMORY_MODE === 'minimal';
};

// Lazy load heavy chart components
export const loadApexChart = () => {
  if (isLowMemoryMode()) {
    return import('vue3-apexcharts');
  }
  // In standard mode, it's already imported
  return Promise.resolve(require('vue3-apexcharts'));
};

// Lazy load calendar components
export const loadFullCalendar = () => {
  if (isLowMemoryMode()) {
    return Promise.all([
      import('@fullcalendar/vue3'),
      import('@fullcalendar/core'),
      import('@fullcalendar/daygrid'),
      import('@fullcalendar/timegrid'),
      import('@fullcalendar/interaction'),
    ]);
  }
  // In standard mode, they're already imported
  return Promise.resolve([
    require('@fullcalendar/vue3'),
    require('@fullcalendar/core'),
    require('@fullcalendar/daygrid'),
    require('@fullcalendar/timegrid'),
    require('@fullcalendar/interaction'),
  ]);
};

// Lazy load Excel processing libraries
export const loadExcelLibs = () => {
  if (isLowMemoryMode()) {
    return Promise.all([
      import('xlsx'),
      import('xlsx-js-style'),
    ]);
  }
  return Promise.resolve([
    require('xlsx'),
    require('xlsx-js-style'),
  ]);
};

// Helper to wrap component lazy loading
export const lazyLoadComponent = (loader) => {
  if (isLowMemoryMode()) {
    return defineAsyncComponent(loader);
  }
  // In standard mode, load immediately
  return loader();
};