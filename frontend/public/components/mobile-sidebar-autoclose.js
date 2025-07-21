// Mobile Sidebar Auto-Close Functionality
(function() {
  'use strict';
  
  // Function to close mobile sidebar
  function closeMobileSidebar() {
    // Only run on mobile
    if (window.innerWidth > 768) return;
    
    // Find sidebar and overlay elements
    const sidebar = document.querySelector('.w-64.bg-white.mobile-open, .sidebar.mobile-open');
    const overlay = document.querySelector('.mobile-overlay.show');
    
    if (sidebar) {
      // Remove the mobile-open class
      sidebar.classList.remove('mobile-open');
      
      // If there's a specific sidebar class, handle it too
      const sidebarAlt = document.querySelector('.sidebar.open');
      if (sidebarAlt) {
        sidebarAlt.classList.remove('open');
      }
    }
    
    if (overlay) {
      // Remove the show class from overlay
      overlay.classList.remove('show');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Remove any close button that was added
    const closeBtn = document.querySelector('.mobile-close-btn');
    if (closeBtn && sidebar && sidebar.contains(closeBtn)) {
      closeBtn.remove();
    }
  }
  
  // Function to attach click handlers to navigation items
  function attachNavigationHandlers() {
    // Target all navigation buttons and links in the sidebar
    const navigationSelectors = [
      '.w-64 nav button',           // Navigation buttons
      '.sidebar nav button',         // Alternative sidebar selector
      '.w-64 button[onclick*="setActiveTab"]',  // Buttons that set active tab
      '.sidebar button[onclick*="setActiveTab"]',
      '.w-64 a[href]',              // Any links in sidebar
      '.sidebar a[href]',
      'nav button',                 // General nav buttons (be more specific if needed)
      '[role="navigation"] button', // Navigation role buttons
      '.mobile-open button[class*="rounded-md"]', // Styled navigation buttons
      '.mobile-open button[class*="px-4 py-2"]'   // Buttons with specific padding
    ];
    
    navigationSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Skip if it's the hamburger menu or close button
        if (element.classList.contains('mobile-menu-toggle') || 
            element.classList.contains('mobile-close-btn') ||
            element.closest('.mobile-header')) {
          return;
        }
        
        // Remove any existing listener to avoid duplicates
        element.removeEventListener('click', handleNavigationClick);
        // Add new listener
        element.addEventListener('click', handleNavigationClick);
      });
    });
  }
  
  // Handle navigation click
  function handleNavigationClick(event) {
    // Only close on mobile
    if (window.innerWidth <= 768) {
      // Small delay to allow navigation to complete
      setTimeout(closeMobileSidebar, 100);
    }
  }
  
  // Initialize when DOM is ready
  function initAutoClose() {
    // Attach handlers immediately
    attachNavigationHandlers();
    
    // Re-attach handlers when sidebar opens (in case content is dynamic)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' &&
            mutation.target.classList.contains('mobile-open')) {
          // Sidebar just opened, re-attach handlers after a brief delay
          setTimeout(attachNavigationHandlers, 200);
        }
      });
    });
    
    // Observe sidebar for class changes
    const sidebar = document.querySelector('.w-64.bg-white, .sidebar');
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
    
    // Also observe body for dynamically added navigation items
    const bodyObserver = new MutationObserver(() => {
      // Debounce to avoid too many calls
      clearTimeout(window.navHandlerTimeout);
      window.navHandlerTimeout = setTimeout(attachNavigationHandlers, 300);
    });
    
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoClose);
  } else {
    initAutoClose();
  }
  
  // Also reinitialize after a delay to catch any late-loading content
  setTimeout(initAutoClose, 1000);
  
  // Make function globally available for manual trigger if needed
  window.closeMobileSidebar = closeMobileSidebar;
  window.reinitMobileAutoClose = initAutoClose;
  
})();
