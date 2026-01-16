// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Service Worker update found!');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              if (window.Jugendkompass) {
                window.Jugendkompass.showAlert(
                  'Neue Version verfügbar! Seite neu laden um zu aktualisieren.',
                  'info'
                );
              }
            }
          });
        });
      })
      .catch(function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
  });

  // Periodic Sync Registration (falls unterstützt)
  if ('periodicSync' in navigator.serviceWorker) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.periodicSync.register('daily-sync', {
        minInterval: 24 * 60 * 60 * 1000 // 24 Stunden
      }).then(() => {
        console.log('Periodic sync registered');
      }).catch(() => {
        console.log('Periodic sync could not be registered');
      });
    });
  }

  // Background Sync Registration
  if ('SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      // Register for prayers sync
      registration.sync.register('sync-prayers')
        .then(() => console.log('Prayers sync registered'))
        .catch(() => console.log('Prayers sync registration failed'));
      
      // Register for notes sync
      registration.sync.register('sync-notes')
        .then(() => console.log('Notes sync registered'))
        .catch(() => console.log('Notes sync registration failed'));
    });
  }

  // Push Notification Registration
  if ('PushManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      // Request Notification Permission
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
          
          // Subscribe to push notifications
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxjIxISertM01G1cZ-JHQUgXhdhP3UBXCXKydNkhcTfv25P7MB8LkRf7VAzEv22FdRo3lp4IjYqc')
          }).then((subscription) => {
            console.log('Push subscription successful:', subscription);
            localStorage.setItem('jk_push_subscription', JSON.stringify(subscription));
          }).catch((error) => {
            console.log('Push subscription failed:', error);
          });
        }
      });
    });
  }
} else {
  console.log('Service workers are not supported.');
}

// Helper function for VAPID key conversion
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Offline Status Monitoring
function updateOnlineStatus() {
  const status = navigator.onLine ? 'online' : 'offline';
  document.body.setAttribute('data-status', status);
  
  if (status === 'offline') {
    console.log('App is offline');
    if (window.Jugendkompass) {
      window.Jugendkompass.showAlert(
        'Du bist offline. Einige Funktionen sind eingeschränkt.',
        'warning'
      );
    }
  } else {
    console.log('App is online');
    if (window.Jugendkompass) {
      window.Jugendkompass.showAlert('Du bist wieder online!', 'success');
    }
  }
}

// Initial status
updateOnlineStatus();

// Listen for status changes
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Before Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button or banner
  showInstallPromotion();
});

function showInstallPromotion() {
  // You can show a custom install button here
  console.log('App can be installed to home screen');
  
  // Example: Show a custom install button
  const installBtn = document.createElement('button');
  installBtn.textContent = 'App installieren';
  installBtn.className = 'ios-button-primary';
  installBtn.style.position = 'fixed';
  installBtn.style.bottom = '100px';
  installBtn.style.left = '50%';
  installBtn.style.transform = 'translateX(-50%)';
  installBtn.style.zIndex = '10000';
  
  installBtn.addEventListener('click', () => {
    installBtn.style.display = 'none';
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    }
  });
  
  document.body.appendChild(installBtn);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (installBtn.parentNode) {
      installBtn.style.opacity = '0';
      setTimeout(() => {
        if (installBtn.parentNode) {
          installBtn.parentNode.removeChild(installBtn);
        }
      }, 300);
    }
  }, 10000);
}
