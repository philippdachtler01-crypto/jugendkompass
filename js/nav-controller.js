// Navigation Controller für iOS 26 Navbar
class NavController {
    constructor() {
        this.currentSection = 'feed';
        this.init();
    }

    init() {
        this.setupNavEvents();
        this.setupHapticSimulation();
        this.setupKeyboardNavigation();
    }

    setupNavEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            // Click Event
            item.addEventListener('click', (e) => {
                this.handleNavClick(e);
            });
            
            // Touch Events für bessere Mobile-Interaktion
            item.addEventListener('touchstart', () => {
                this.animateButtonPress(item);
            });
            
            item.addEventListener('touchend', () => {
                this.animateButtonRelease(item);
            });
        });
    }

    handleNavClick(event) {
        const target = event.currentTarget;
        const section = target.dataset.section;
        
        if (this.currentSection === section) return;
        
        // Aktiven Zustand aktualisieren
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        target.classList.add('active');
        
        // Section wechseln
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');
        
        this.currentSection = section;
        
        // Haptic Feedback
        this.triggerHapticFeedback();
        
        // Smooth Scroll nach oben
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    animateButtonPress(button) {
        button.style.transform = 'scale(0.95)';
        button.style.opacity = '0.8';
    }

    animateButtonRelease(button) {
        setTimeout(() => {
            button.style.transform = '';
            button.style.opacity = '';
        }, 150);
    }

    setupHapticSimulation() {
        // Simuliere Haptic Feedback für nicht unterstützte Geräte
        if (!navigator.vibrate) {
            console.log('Haptic Feedback wird simuliert');
        }
    }

    triggerHapticFeedback() {
        // Versuche echte Vibration
        if (navigator.vibrate) {
            navigator.vibrate(10);
        } else {
            // Fallback: Visuelles Feedback
            const activeItem = document.querySelector('.nav-item.active');
            if (activeItem) {
                activeItem.style.boxShadow = '0 0 0 2px rgba(93, 138, 168, 0.3)';
                setTimeout(() => {
                    activeItem.style.boxShadow = '';
                }, 200);
            }
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Nur wenn kein Input fokussiert ist
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const navItems = document.querySelectorAll('.nav-item');
            const currentIndex = Array.from(navItems).findIndex(item => 
                item.dataset.section === this.currentSection
            );
            
            let newIndex = currentIndex;
            
            switch(e.key) {
                case 'ArrowRight':
                    newIndex = (currentIndex + 1) % navItems.length;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    newIndex = (currentIndex - 1 + navItems.length) % navItems.length;
                    e.preventDefault();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    newIndex = parseInt(e.key) - 1;
                    if (newIndex < navItems.length) {
                        e.preventDefault();
                    }
                    break;
            }
            
            if (newIndex !== currentIndex && navItems[newIndex]) {
                navItems[newIndex].click();
            }
        });
    }

    // Externe Navigation (von anderen Teilen der App)
    navigateTo(section) {
        const targetItem = document.querySelector(`.nav-item[data-section="${section}"]`);
        if (targetItem) {
            targetItem.click();
        }
    }

    // Aktiven Zustand abfragen
    getCurrentSection() {
        return this.currentSection;
    }

    // Navbar ein-/ausblenden
    toggleNavbar(show = true) {
        const navbar = document.querySelector('.ios-navbar');
        if (navbar) {
            navbar.style.transform = show ? 'translateY(0)' : 'translateY(100%)';
            navbar.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }
}

// Automatisch initialisieren
document.addEventListener('DOMContentLoaded', () => {
    window.NavController = new NavController();
    
    // Globale Navigation-Funktionen
    window.navigateTo = (section) => {
        if (window.NavController) {
            window.NavController.navigateTo(section);
        }
    };
});
