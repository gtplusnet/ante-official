// New Relic Browser Agent for Frontend Monitoring
export default ({ app, router }) => {
  // Only load New Relic in staging and production
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    // IMPORTANT: Browser monitoring requires creating a browser application in New Relic UI
    // Go to New Relic One > Browser > Add more data > Copy/paste JavaScript code
    // This will give you the proper browser-specific configuration
    
    // For now, we'll set up basic error tracking and prepare for proper browser agent
    // TODO: Replace with actual browser snippet from New Relic UI
    
    console.log('New Relic Browser monitoring is ready to be configured.')
    console.log('Please create a browser application at: https://one.newrelic.com/browser')
    console.log('Then replace this boot file with the provided JavaScript snippet.')
    
    // Track Vue Router navigation
    if (router) {
      router.afterEach((to) => {
        if (window.newrelic) {
          window.newrelic.setPageViewName(to.path)
          window.newrelic.setCustomAttribute('routeName', to.name || 'unknown')
          window.newrelic.setCustomAttribute('routePath', to.path)
        }
      })
    }
    
    // Set up Vue error handler
    if (app && app.config) {
      const originalErrorHandler = app.config.errorHandler
      app.config.errorHandler = (err, vm, info) => {
        // Call original handler if it exists
        if (originalErrorHandler) {
          originalErrorHandler(err, vm, info)
        }
        
        // Report to New Relic
        if (window.newrelic) {
          window.newrelic.noticeError(err, {
            component: vm?.$options?.name || 'Unknown',
            info: info,
            route: router?.currentRoute?.value?.path || 'unknown'
          })
        }
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Vue Error:', err, '\nComponent:', vm, '\nInfo:', info)
        }
      }
    }
    
    // Add custom user interaction tracking
    if (window.newrelic) {
      // Track user authentication status
      const trackUserSession = () => {
        const token = localStorage.getItem('token')
        const accountId = localStorage.getItem('accountId')
        const username = localStorage.getItem('username')
        
        if (token && accountId) {
          window.newrelic.setCustomAttribute('authenticated', true)
          window.newrelic.setCustomAttribute('accountId', accountId)
          if (username) {
            window.newrelic.setUserId(username)
          }
        } else {
          window.newrelic.setCustomAttribute('authenticated', false)
        }
      }
      
      // Track on initial load
      trackUserSession()
      
      // Track on storage changes (login/logout)
      window.addEventListener('storage', (e) => {
        if (e.key === 'token' || e.key === 'accountId') {
          trackUserSession()
        }
      })
      
      // Track important user actions
      document.addEventListener('click', (e) => {
        const target = e.target
        const actionButton = target.closest('[data-action]')
        if (actionButton) {
          const action = actionButton.getAttribute('data-action')
          window.newrelic.addPageAction('user_action', {
            action: action,
            label: actionButton.textContent || 'unknown',
            route: router?.currentRoute?.value?.path || 'unknown'
          })
        }
      })
    }
  }
}