// Mobile Gesture Support for FanToPark CRM
// Adds swipe gestures and touch interactions

window.MobileGestures = {
  // Initialize swipe detection
  initSwipeDetection: function(element, callbacks) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let startTime = 0;

    const minSwipeDistance = 50; // Minimum distance for a swipe
    const maxSwipeTime = 300; // Maximum time for a swipe in ms
    const verticalThreshold = 100; // Maximum vertical movement for horizontal swipe

    element.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      startTime = Date.now();
    }, { passive: true });

    element.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      
      const swipeTime = Date.now() - startTime;
      
      // Only process if it was a quick swipe
      if (swipeTime < maxSwipeTime) {
        handleSwipe();
      }
    }, { passive: true });

    function handleSwipe() {
      const horizontalDistance = touchEndX - touchStartX;
      const verticalDistance = Math.abs(touchEndY - touchStartY);

      // Check if it's a horizontal swipe (not too much vertical movement)
      if (verticalDistance < verticalThreshold) {
        if (horizontalDistance > minSwipeDistance) {
          // Swipe right
          if (callbacks.onSwipeRight) callbacks.onSwipeRight();
        } else if (horizontalDistance < -minSwipeDistance) {
          // Swipe left
          if (callbacks.onSwipeLeft) callbacks.onSwipeLeft();
        }
      }
    }
  },

  // Pull to refresh functionality
  initPullToRefresh: function(element, onRefresh) {
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    let threshold = 80;

    const pullIndicator = document.createElement('div');
    pullIndicator.className = 'pull-to-refresh';
    pullIndicator.innerHTML = '<div class="pull-to-refresh-spinner"></div>';
    element.parentNode.insertBefore(pullIndicator, element);

    element.addEventListener('touchstart', function(e) {
      if (element.scrollTop === 0) {
        startY = e.touches[0].pageY;
        pulling = true;
      }
    }, { passive: true });

    element.addEventListener('touchmove', function(e) {
      if (!pulling) return;
      
      currentY = e.touches[0].pageY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 0 && element.scrollTop === 0) {
        e.preventDefault();
        
        const opacity = Math.min(pullDistance / threshold, 1);
        pullIndicator.style.opacity = opacity;
        pullIndicator.style.transform = `translateY(${Math.min(pullDistance * 0.5, 50)}px)`;
        
        if (pullDistance > threshold) {
          pullIndicator.classList.add('active');
        } else {
          pullIndicator.classList.remove('active');
        }
      }
    }, { passive: false });

    element.addEventListener('touchend', function(e) {
      if (!pulling) return;
      
      const pullDistance = currentY - startY;
      
      if (pullDistance > threshold && element.scrollTop === 0) {
        // Trigger refresh
        pullIndicator.classList.add('refreshing');
        
        if (onRefresh) {
          Promise.resolve(onRefresh()).then(() => {
            pullIndicator.classList.remove('refreshing', 'active');
            pullIndicator.style.opacity = '0';
            pullIndicator.style.transform = 'translateY(0)';
          });
        }
      } else {
        pullIndicator.classList.remove('active');
        pullIndicator.style.opacity = '0';
        pullIndicator.style.transform = 'translateY(0)';
      }
      
      pulling = false;
      startY = 0;
      currentY = 0;
    }, { passive: true });
  },

  // Long press detection
  initLongPress: function(element, callback, duration = 500) {
    let pressTimer = null;
    let longPressActive = false;

    const startPress = (e) => {
      longPressActive = false;
      pressTimer = setTimeout(() => {
        longPressActive = true;
        if (callback) callback(e);
        
        // Add haptic feedback if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      }, duration);
    };

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    element.addEventListener('touchstart', startPress, { passive: true });
    element.addEventListener('touchend', cancelPress, { passive: true });
    element.addEventListener('touchmove', cancelPress, { passive: true });
    element.addEventListener('touchcancel', cancelPress, { passive: true });

    // Prevent context menu on long press
    element.addEventListener('contextmenu', (e) => {
      if (longPressActive) {
        e.preventDefault();
      }
    });
  },

  // Swipeable card actions
  initSwipeableCard: function(cardElement, actions) {
    let startX = 0;
    let currentX = 0;
    let cardWidth = 0;
    let isMoving = false;

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'swipe-actions';
    actionsContainer.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    // Add action buttons
    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = `swipe-action ${action.type}`;
      button.style.cssText = `
        padding: 0 20px;
        height: 100%;
        border: none;
        color: white;
        font-weight: 600;
        background: ${action.color || '#3b82f6'};
      `;
      button.textContent = action.label;
      button.onclick = (e) => {
        e.stopPropagation();
        resetCard();
        if (action.onClick) action.onClick();
      };
      actionsContainer.appendChild(button);
    });

    cardElement.style.position = 'relative';
    cardElement.style.overflow = 'visible';
    cardElement.appendChild(actionsContainer);

    const resetCard = () => {
      cardElement.style.transform = 'translateX(0)';
      actionsContainer.style.transform = 'translateX(100%)';
      isMoving = false;
    };

    cardElement.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      cardWidth = cardElement.offsetWidth;
      isMoving = true;
      cardElement.style.transition = 'none';
    }, { passive: true });

    cardElement.addEventListener('touchmove', (e) => {
      if (!isMoving) return;
      
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      
      // Only allow left swipe
      if (diffX < 0) {
        const translateX = Math.max(diffX, -150); // Limit swipe distance
        cardElement.style.transform = `translateX(${translateX}px)`;
        
        // Show actions
        const actionTranslate = Math.min(Math.abs(diffX), 150);
        actionsContainer.style.transform = `translateX(${100 - (actionTranslate / 150 * 100)}%)`;
      }
    }, { passive: true });

    cardElement.addEventListener('touchend', (e) => {
      if (!isMoving) return;
      
      cardElement.style.transition = 'transform 0.3s ease';
      const diffX = currentX - startX;
      
      if (diffX < -50) {
        // Show actions
        cardElement.style.transform = 'translateX(-150px)';
        actionsContainer.style.transform = 'translateX(0)';
      } else {
        resetCard();
      }
      
      isMoving = false;
    }, { passive: true });

    // Reset on click outside
    document.addEventListener('click', (e) => {
      if (!cardElement.contains(e.target)) {
        resetCard();
      }
    });
  },

  // Tab swipe navigation
  initTabSwipe: function(containerElement) {
    const state = window.appState;
    const tabs = ['dashboard', 'leads', 'inventory', 'orders'];
    
    this.initSwipeDetection(containerElement, {
      onSwipeLeft: () => {
        const currentIndex = tabs.indexOf(state.activeTab);
        if (currentIndex < tabs.length - 1) {
          state.setActiveTab(tabs[currentIndex + 1]);
        }
      },
      onSwipeRight: () => {
        const currentIndex = tabs.indexOf(state.activeTab);
        if (currentIndex > 0) {
          state.setActiveTab(tabs[currentIndex - 1]);
        }
      }
    });
  }
};

// Auto-initialize gestures when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize pull to refresh on main content
  const mainContent = document.querySelector('.mobile-main-content');
  if (mainContent && window.innerWidth <= 768) {
    window.MobileGestures.initPullToRefresh(mainContent, async () => {
      // Refresh current view data
      const state = window.appState;
      switch(state.activeTab) {
        case 'leads':
          await window.loadLeads();
          break;
        case 'inventory':
          await window.loadInventory();
          break;
        case 'orders':
          await window.loadOrders();
          break;
        case 'dashboard':
          await window.loadDashboardData();
          break;
      }
    });

    // Initialize tab swipe navigation
    window.MobileGestures.initTabSwipe(mainContent);
  }

  // Initialize swipeable cards
  if (window.innerWidth <= 768) {
    // Use MutationObserver to watch for new cards
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList && node.classList.contains('mobile-card') && node.classList.contains('swipeable')) {
            // Example swipe actions for lead cards
            if (node.dataset.leadId) {
              window.MobileGestures.initSwipeableCard(node, [
                {
                  label: 'Edit',
                  type: 'edit',
                  color: '#3b82f6',
                  onClick: () => {
                    const lead = window.appState.leads.find(l => l.id === node.dataset.leadId);
                    if (lead) {
                      window.appState.setCurrentLead(lead);
                      window.appState.setShowEditForm(true);
                      window.appState.setCurrentForm('lead');
                    }
                  }
                },
                {
                  label: 'Delete',
                  type: 'delete',
                  color: '#ef4444',
                  onClick: () => {
                    if (confirm('Are you sure you want to delete this lead?')) {
                      window.handleDelete('leads', node.dataset.leadId);
                    }
                  }
                }
              ]);
            }
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
});

// Helper function to add haptic feedback
window.addHapticFeedback = function(type = 'light') {
  if (window.navigator && window.navigator.vibrate) {
    switch(type) {
      case 'light':
        window.navigator.vibrate(10);
        break;
      case 'medium':
        window.navigator.vibrate(25);
        break;
      case 'heavy':
        window.navigator.vibrate(50);
        break;
      case 'success':
        window.navigator.vibrate([10, 50, 10]);
        break;
      case 'error':
        window.navigator.vibrate([50, 50, 50]);
        break;
    }
  }
};

console.log('✅ Mobile Gestures component loaded');