/**
 * Mobile Menu JavaScript - Pool Israel
 * תפריט המבורגר מקצועי RTL עם אנימציות
 */

class MobileMenu {
    constructor() {
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        this.mobileMenuClose = document.getElementById('mobileMenuClose');
        this.isOpen = false;
        
        this.init();
    }
    
    init() {
        if (!this.mobileMenuBtn || !this.mobileMenu || !this.mobileMenuOverlay) {
            console.warn('Mobile menu elements not found');
            return;
        }
        
        this.bindEvents();
        this.setActiveMenuItem();
        this.handleResize();
    }
    
    bindEvents() {
        // פתיחת התפריט
        this.mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openMenu();
        });
        
        // סגירת התפריט
        this.mobileMenuClose?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenu();
        });
        
        // סגירה על ידי לחיצה על הרקע
        this.mobileMenuOverlay.addEventListener('click', () => {
            this.closeMenu();
        });
        
        // סגירה עם מקש ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
        
        // סגירה בעת שינוי גודל המסך
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // סגירה בעת לחיצה על קישור בתפריט
        const menuLinks = this.mobileMenu.querySelectorAll('.mobile-nav-menu a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                // עיכוב קצר לפני סגירה לאנימציה
                setTimeout(() => {
                    this.closeMenu();
                }, 150);
            });
        });
        
        // מניעת גלילה כאשר התפריט פתוח
        this.mobileMenu.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        });
    }
    
    openMenu() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        
        // הוספת קלאסים לאנימציה
        this.mobileMenuOverlay.classList.add('active');
        this.mobileMenu.classList.add('active');
        
        // מניעת גלילה ברקע
        document.body.style.overflow = 'hidden';
        
        // פוקוס על כפתור הסגירה
        setTimeout(() => {
            this.mobileMenuClose?.focus();
        }, 300);
        
        // אנימציה לפריטי התפריט
        this.animateMenuItems();
        
        // עדכון ARIA
        this.mobileMenuBtn.setAttribute('aria-expanded', 'true');
        this.mobileMenu.setAttribute('aria-hidden', 'false');
        
        // הוספת אירוע לטראפ פוקוס
        this.trapFocus();
    }
    
    closeMenu() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // הסרת קלאסים
        this.mobileMenuOverlay.classList.remove('active');
        this.mobileMenu.classList.remove('active');
        
        // החזרת גלילה
        document.body.style.overflow = '';
        
        // פוקוס חזרה לכפתור הפתיחה
        this.mobileMenuBtn.focus();
        
        // עדכון ARIA
        this.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        this.mobileMenu.setAttribute('aria-hidden', 'true');
        
        // הסרת טראפ פוקוס
        this.removeFocusTrap();
    }
    
    animateMenuItems() {
        const menuItems = this.mobileMenu.querySelectorAll('.mobile-nav-menu li');
        
        menuItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(30px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 100 + (index * 50));
        });
    }
    
    setActiveMenuItem() {
        const currentPath = window.location.pathname;
        const menuLinks = this.mobileMenu.querySelectorAll('.mobile-nav-menu a');
        
        menuLinks.forEach(link => {
            link.classList.remove('active');
            
            const linkPath = new URL(link.href).pathname;
            if (currentPath === linkPath || 
                (currentPath === '/' && linkPath.includes('home.html'))) {
                link.classList.add('active');
            }
        });
    }
    
    handleResize() {
        // סגירת התפריט אם המסך גדול מ-768px
        if (window.innerWidth > 768 && this.isOpen) {
            this.closeMenu();
        }
    }
    
    trapFocus() {
        const focusableElements = this.mobileMenu.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        this.focusTrapHandler = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', this.focusTrapHandler);
    }
    
    removeFocusTrap() {
        if (this.focusTrapHandler) {
            document.removeEventListener('keydown', this.focusTrapHandler);
            this.focusTrapHandler = null;
        }
    }
    
    // פונקציה ציבורית לפתיחה/סגירה
    toggle() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    // פונקציה לבדיקת מצב התפריט
    getState() {
        return {
            isOpen: this.isOpen,
            isMobile: window.innerWidth <= 768
        };
    }
}

// אתחול התפריט כאשר הDOM מוכן
document.addEventListener('DOMContentLoaded', () => {
    // יצירת אינסטנס גלובלי
    window.mobileMenu = new MobileMenu();
    
    // הוספת אירועי touch למובייל
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // מניעת זום כפול בלחיצה על כפתורים
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(button => {
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                button.click();
            });
        });
    }
    
    // הוספת אירוע לשינוי כיוון המסך
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (window.mobileMenu && window.mobileMenu.isOpen) {
                window.mobileMenu.closeMenu();
            }
        }, 100);
    });
});

// הוספת סטיילים דינמיים לאנימציות
const addDynamicStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .mobile-nav-menu li {
            transition: all 0.3s ease;
        }
        
        .mobile-nav-menu a {
            position: relative;
            overflow: hidden;
        }
        
        .mobile-nav-menu a::before {
            content: '';
            position: absolute;
            top: 0;
            right: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: right 0.5s ease;
        }
        
        .mobile-nav-menu a:hover::before {
            right: 100%;
        }
        
        @media (prefers-reduced-motion: reduce) {
            .mobile-menu,
            .mobile-menu-overlay,
            .mobile-nav-menu li,
            .mobile-nav-menu a {
                transition: none !important;
            }
        }
    `;
    document.head.appendChild(style);
};

// הוספת הסטיילים הדינמיים
addDynamicStyles();

// ייצוא לשימוש במודולים
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileMenu;
}
