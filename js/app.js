// Jugendkompass Hauptanwendung
class JugendkompassApp {
    constructor() {
        this.userName = localStorage.getItem('jk_userName') || '';
        this.currentSection = 'feed';
        this.init();
    }

    init() {
        // Onboarding Event Listener
        document.getElementById('start-journey').addEventListener('click', () => this.handleOnboarding());
        document.getElementById('user-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleOnboarding();
        });

        // Navigation Event Listener
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchSection(e));
        });

        // Name bearbeiten
        document.getElementById('edit-name-btn')?.addEventListener('click', () => this.editUserName());

        // Theme wechseln
        document.getElementById('theme-select')?.addEventListener('change', (e) => this.changeTheme(e.target.value));

        // Initialisiere Datum
        this.updateDate();

        // Prüfe ob Onboarding nötig ist
        if (this.userName) {
            this.showApp();
        }
    }

    handleOnboarding() {
        const nameInput = document.getElementById('user-name');
        const name = nameInput.value.trim();
        
        if (name.length < 2) {
            this.showAlert('Bitte gib einen gültigen Namen ein (mind. 2 Zeichen)');
            nameInput.focus();
            return;
        }

        this.userName = name;
        localStorage.setItem('jk_userName', name);
        this.showApp();
    }

    showApp() {
        // Update Begrüßung
        document.getElementById('user-greeting').textContent = `Hallo ${this.userName}`;
        
        // Screens wechseln
        document.getElementById('onboarding-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Feed initialisieren
        if (typeof window.FeedManager !== 'undefined') {
            window.FeedManager.init();
        }
        
        // Simuliere Haptic Feedback
        this.hapticFeedback();
    }

    switchSection(event) {
        const section = event.currentTarget.dataset.section;
        
        if (this.currentSection === section) return;
        
        // Update Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Update Content Sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');
        
        this.currentSection = section;
        this.hapticFeedback();
    }

    editUserName() {
        const newName = prompt('Wie soll ich dich nennen?', this.userName);
        if (newName && newName.trim().length >= 2) {
            this.userName = newName.trim();
            localStorage.setItem('jk_userName', this.userName);
            document.getElementById('user-greeting').textContent = `Hallo ${this.userName}`;
            this.showAlert('Name erfolgreich geändert!');
        }
    }

    changeTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.style.setProperty('--ios-background', '#000000');
            document.documentElement.style.setProperty('--ios-surface', '#1C1C1E');
        } else if (theme === 'light') {
            document.documentElement.style.setProperty('--ios-background', '#F2F2F7');
            document.documentElement.style.setProperty('--ios-surface', '#FFFFFF');
        } else {
            // Auto - CSS media query übernimmt
        }
        localStorage.setItem('jk_theme', theme);
    }

    updateDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('de-DE', options);
        document.getElementById('current-date').textContent = dateString;
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = 'ios-alert';
        alert.innerHTML = `
            <p>${message}</p>
            <div class="ios-alert-actions">
                <button class="ios-button-secondary" id="alert-ok">OK</button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        document.getElementById('alert-ok').addEventListener('click', () => {
            alert.remove();
            this.hapticFeedback();
        });
        
        this.hapticFeedback('success');
    }

    hapticFeedback(type = 'light') {
        // Simuliere Haptic Feedback für Web
        if (navigator.vibrate) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30],
                success: [20, 40, 20],
                error: [40, 40, 40]
            };
            navigator.vibrate(patterns[type] || [10]);
        }
    }

    // Offline Status überwachen
    monitorConnection() {
        window.addEventListener('online', () => {
            this.showAlert('Du bist wieder online!');
        });
        
        window.addEventListener('offline', () => {
            this.showAlert('Du bist offline. Einige Funktionen sind eingeschränkt.', 'warning');
        });
    }
}

// App initialisieren wenn DOM geladen
document.addEventListener('DOMContentLoaded', () => {
    window.Jugendkompass = new JugendkompassApp();
    window.Jugendkompass.monitorConnection();
});
