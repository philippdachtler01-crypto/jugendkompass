// Offline Manager für PWA-Funktionalität
class OfflineManager {
    constructor() {
        this.cacheName = 'jugendkompass-v1';
        this.offlineContent = new Map();
        this.init();
    }

    async init() {
        this.setupStorageMonitoring();
        await this.checkStorageUsage();
        this.setupOfflineDetection();
        this.loadOfflineContent();
    }

    setupStorageMonitoring() {
        // Überwache Storage Changes
        window.addEventListener('storage', (e) => {
            console.log('Storage changed:', e.key);
            this.updateStorageDisplay();
        });
    }

    async checkStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const usage = (estimate.usage / 1024 / 1024).toFixed(2);
                const quota = (estimate.quota / 1024 / 1024).toFixed(2);
                
                console.log(`Storage usage: ${usage} MB / ${quota} MB`);
                
                // Update UI
                const display = document.getElementById('offline-storage');
                if (display) {
                    display.textContent = `${usage} MB`;
                }
            } catch (error) {
                console.warn('Storage estimation failed:', error);
            }
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showOnlineStatus();
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.showOfflineStatus();
        });
        
        // Initialer Status
        if (!navigator.onLine) {
            this.showOfflineStatus();
        }
    }

    showOnlineStatus() {
        if (window.Jugendkompass) {
            window.Jugendkompass.showAlert('Du bist wieder online!', 'success');
        }
        
        // Update UI Elemente
        document.querySelectorAll('.offline-indicator').forEach(el => {
            el.style.display = 'none';
        });
    }

    showOfflineStatus() {
        if (window.Jugendkompass) {
            window.Jugendkompass.showAlert('Du bist offline. Einige Funktionen sind eingeschränkt.', 'warning');
        }
        
        // Zeige Offline-Indikatoren
        document.querySelectorAll('.offline-indicator').forEach(el => {
            el.style.display = 'inline';
        });
    }

    async syncOfflineData() {
        // Hier würde die Synchronisierung mit einem Server stattfinden
        console.log('Syncing offline data...');
        
        // Simuliere Synchronisierung
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Sync complete');
                resolve();
            }, 1000);
        });
    }

    loadOfflineContent() {
        // Lade gespeicherte Offline-Inhalte
        try {
            const savedContent = localStorage.getItem('jk_offline_content');
            if (savedContent) {
                this.offlineContent = new Map(JSON.parse(savedContent));
            }
        } catch (error) {
            console.error('Failed to load offline content:', error);
        }
    }

    saveOfflineContent() {
        try {
            const contentArray = Array.from(this.offlineContent.entries());
            localStorage.setItem('jk_offline_content', JSON.stringify(contentArray));
        } catch (error) {
            console.error('Failed to save offline content:', error);
        }
    }

    async cacheAsset(url) {
        try {
            const cache = await caches.open(this.cacheName);
            const response = await fetch(url);
            await cache.put(url, response);
            console.log('Cached:', url);
            return true;
        } catch (error) {
            console.error('Failed to cache asset:', error);
            return false;
        }
    }

    async getCachedAsset(url) {
        try {
            const cache = await caches.open(this.cacheName);
            const response = await cache.match(url);
            return response;
        } catch (error) {
            console.error('Failed to get cached asset:', error);
            return null;
        }
    }

    async cacheAppShell() {
        const assetsToCache = [
            '/',
            '/index.html',
            '/manifest.json',
            '/css/liquid-glass.css',
            '/css/ios26.css',
            '/css/main.css',
            '/js/app.js',
            '/js/feed-manager.js',
            '/js/audio-player.js',
            '/js/nav-controller.js',
            '/js/offline-manager.js',
            '/assets/icons/icon-192.png',
            '/assets/icons/icon-512.png'
        ];
        
        console.log('Caching app shell...');
        
        try {
            const cache = await caches.open(this.cacheName);
            await cache.addAll(assetsToCache);
            console.log('App shell cached successfully');
        } catch (error) {
            console.error('Failed to cache app shell:', error);
        }
    }

    async clearCache() {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
            console.log('Cache cleared');
            
            // Auch localStorage leeren
            localStorage.removeItem('jk_offline_content');
            this.offlineContent.clear();
            
            await this.updateStorageDisplay();
            
            if (window.Jugendkompass) {
                window.Jugendkompass.showAlert('Cache erfolgreich geleert!');
            }
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }

    async updateStorageDisplay() {
        await this.checkStorageUsage();
    }

    // Für Offline-Artikel speichern
    saveArticleForOffline(article) {
        const id = `article_${Date.now()}`;
        this.offlineContent.set(id, {
            type: 'article',
            data: article,
            savedAt: new Date().toISOString()
        });
        this.saveOfflineContent();
        return id;
    }

    // Für Offline-Audio speichern
    saveAudioForOffline(audio) {
        const id = `audio_${Date.now()}`;
        this.offlineContent.set(id, {
            type: 'audio',
            data: audio,
            savedAt: new Date().toISOString()
        });
        this.saveOfflineContent();
        return id;
    }

    // Gespeicherte Inhalte abrufen
    getOfflineContent(type = null) {
        if (type) {
            return Array.from(this.offlineContent.entries())
                .filter(([_, content]) => content.type === type)
                .map(([id, content]) => ({ id, ...content }));
        }
        return Array.from(this.offlineContent.entries())
            .map(([id, content]) => ({ id, ...content }));
    }

    // Content löschen
    deleteOfflineContent(id) {
        this.offlineContent.delete(id);
        this.saveOfflineContent();
    }

    // Backup erstellen
    createBackup() {
        const backup = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            userName: localStorage.getItem('jk_userName'),
            bookmarks: JSON.parse(localStorage.getItem('jk_bookmarks') || '[]'),
            prayers: JSON.parse(localStorage.getItem('jk_prayers') || '[]'),
            offlineContent: Array.from(this.offlineContent.entries())
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jugendkompass-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        if (window.Jugendkompass) {
            window.Jugendkompass.showAlert('Backup erstellt!');
        }
    }

    // Backup wiederherstellen
    async restoreBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // Validiere Backup
                    if (!backup.version || !backup.timestamp) {
                        throw new Error('Ungültiges Backup-Format');
                    }
                    
                    // Stelle Daten wieder her
                    if (backup.userName) {
                        localStorage.setItem('jk_userName', backup.userName);
                    }
                    
                    if (backup.bookmarks) {
                        localStorage.setItem('jk_bookmarks', JSON.stringify(backup.bookmarks));
                    }
                    
                    if (backup.prayers) {
                        localStorage.setItem('jk_prayers', JSON.stringify(backup.prayers));
                    }
                    
                    if (backup.offlineContent) {
                        this.offlineContent = new Map(backup.offlineContent);
                        this.saveOfflineContent();
                    }
                    
                    if (window.Jugendkompass) {
                        window.Jugendkompass.showAlert('Backup erfolgreich wiederhergestellt!', 'success');
                        // Aktualisiere UI
                        if (backup.userName) {
                            document.getElementById('user-greeting').textContent = `Hallo ${backup.userName}`;
                        }
                    }
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsText(file);
        });
    }
}

// Automatisch initialisieren
document.addEventListener('DOMContentLoaded', async () => {
    window.OfflineManager = new OfflineManager();
    
    // Cache App Shell beim ersten Laden
    if ('caches' in window) {
        await window.OfflineManager.cacheAppShell();
    }
    
    // Event Listener für Offline-Management
    document.getElementById('manage-offline-btn')?.addEventListener('click', () => {
        window.OfflineManager.showOfflineManagement();
    });
});
