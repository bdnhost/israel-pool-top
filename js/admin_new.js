/**
 * Pool Israel - Modern Admin Panel JavaScript
 * Enhanced with modern design and improved UX
 */

class ModernAdminPanel {
    constructor() {
        this.currentTab = 'dashboard';
        this.isAuthenticated = false;
        this.userData = null;
        this.charts = {};
        this.intervals = {};
        this.demoMode = true; // Enable demo mode for testing

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the admin panel
     */
    async init() {
        console.log('🚀 Initializing Modern Admin Panel...');
        
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Check authentication
            const isAuth = await this.checkAuthentication();
            
            if (isAuth) {
                await this.initializeAuthenticatedPanel();
            } else {
                this.showLoginForm();
            }
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('✅ Admin Panel initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing admin panel:', error);
            this.hideLoadingScreen();
            this.showError('שגיאה בטעינת המערכת');
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }

    /**
     * Check authentication status
     */
    async checkAuthentication() {
        // In demo mode, always return authenticated
        if (this.demoMode) {
            console.log('🎭 Demo mode: Skipping authentication');
            this.isAuthenticated = true;
            this.userData = {
                username: 'מנהל דמו',
                role: 'admin',
                email: 'demo@pool-israel.com'
            };
            return true;
        }

        try {
            const response = await fetch('/api/admin.php?action=check_auth');
            const result = await response.json();

            if (result.success && result.authenticated) {
                this.isAuthenticated = true;
                this.userData = result.user;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking authentication:', error);
            // Fallback to demo mode if API fails
            console.log('🎭 API failed, enabling demo mode');
            this.demoMode = true;
            this.isAuthenticated = true;
            this.userData = {
                username: 'מנהל דמו',
                role: 'admin',
                email: 'demo@pool-israel.com'
            };
            return true;
        }
    }

    /**
     * Show login form
     */
    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const adminPanel = document.getElementById('adminPanel');
        
        if (loginForm) loginForm.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'none';
        
        // Setup login form handler
        this.setupLoginForm();
    }

    /**
     * Setup login form event handlers
     */
    setupLoginForm() {
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const username = formData.get('username');
        const password = formData.get('password');
        
        if (!username || !password) {
            this.showError('אנא מלא את כל השדות');
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> מתחבר...';
            submitBtn.disabled = true;
            
            const response = await fetch('/api/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.isAuthenticated = true;
                this.userData = result.user;
                await this.initializeAuthenticatedPanel();
                this.hideLoginForm();
            } else {
                this.showError(result.message || 'שגיאה בהתחברות');
            }
            
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('שגיאה בהתחברות למערכת');
            
            // Restore button
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> התחבר למערכת';
            submitBtn.disabled = false;
        }
    }

    /**
     * Hide login form and show admin panel
     */
    hideLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const adminPanel = document.getElementById('adminPanel');
        
        if (loginForm) loginForm.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'flex';
    }

    /**
     * Initialize authenticated admin panel
     */
    async initializeAuthenticatedPanel() {
        console.log('🔐 Initializing authenticated panel...');

        // Update user info in header
        this.updateUserInfo();

        // Setup navigation
        this.setupNavigation();

        // Setup mobile menu
        this.setupMobileMenu();

        // Show demo mode notification if enabled
        if (this.demoMode) {
            this.showDemoNotification();
        }

        // Load initial data
        await this.loadInitialData();

        // Setup auto-refresh
        this.setupAutoRefresh();

        // Show default tab
        this.showTab('dashboard');

        console.log('✅ Authenticated panel initialized');
    }

    /**
     * Show demo mode notification
     */
    showDemoNotification() {
        const demoNotification = document.createElement('div');
        demoNotification.id = 'demoNotification';
        demoNotification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #ff6b35, #ffa500);
            color: white;
            padding: 10px 20px;
            text-align: center;
            z-index: 10001;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;

        demoNotification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <i class="fas fa-info-circle"></i>
                <span>🎭 מצב דמו פעיל - כל הנתונים הם לדוגמה בלבד</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; margin-right: 15px; cursor: pointer; font-size: 1.2rem;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(demoNotification);

        // Adjust body padding to account for notification
        document.body.style.paddingTop = '50px';

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (demoNotification && demoNotification.parentNode) {
                demoNotification.remove();
                document.body.style.paddingTop = '0';
            }
        }, 10000);
    }

    /**
     * Update user info in header
     */
    updateUserInfo() {
        const userNameElement = document.getElementById('currentUserName');
        if (userNameElement && this.userData) {
            userNameElement.textContent = this.userData.username || 'מנהל המערכת';
        }
    }

    /**
     * Setup navigation event handlers
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item a');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.closest('.nav-item').dataset.tab;
                if (tab) {
                    this.showTab(tab);
                }
            });
        });
    }

    /**
     * Setup mobile menu toggle
     */
    setupMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.getElementById('navMenu');
        
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('show');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('show');
                }
            });
        }
    }

    /**
     * Show specific tab
     */
    showTab(tabName) {
        console.log(`📋 Switching to tab: ${tabName}`);
        
        // Update current tab
        this.currentTab = tabName;
        
        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(tabName);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // Load tab-specific data
        this.loadTabData(tabName);

        // Auto-load data for specific tabs
        this.autoLoadTabData(tabName);

        // Close mobile menu if open
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.remove('show');
        }
    }

    /**
     * Auto-load data when switching to tabs
     */
    autoLoadTabData(tabName) {
        console.log(`🔄 Auto-loading data for tab: ${tabName}`);

        switch (tabName) {
            case 'quotes':
                if (!this.allQuotes || this.allQuotes.length === 0) {
                    console.log('📋 Loading quotes data...');
                    this.loadQuotesData();
                }
                break;
            case 'contractors':
                if (!this.allContractors || this.allContractors.length === 0) {
                    console.log('👥 Loading contractors data...');
                    this.loadContractorsData();
                }
                break;
            case 'users':
                if (!this.allUsers || this.allUsers.length === 0) {
                    console.log('👤 Loading users data...');
                    this.loadUsersData();
                }
                break;
            case 'sms':
                if (!this.allSMS || this.allSMS.length === 0) {
                    console.log('📱 Loading SMS data...');
                    this.loadSMSData();
                }
                break;
            case 'settings':
                if (!this.systemSettings || Object.keys(this.systemSettings).length === 0) {
                    console.log('⚙️ Loading settings data...');
                    this.loadSettingsData();
                }
                break;
            case 'dashboard':
                console.log('📊 Loading dashboard data...');
                this.loadDashboardData();
                break;
        }
    }

    /**
     * Load initial data for all tabs
     */
    async loadInitialData() {
        console.log('📊 Loading initial data...');
        
        try {
            // Load dashboard stats
            await this.loadDashboardStats();
            
            // Load header stats
            await this.loadHeaderStats();
            
            console.log('✅ Initial data loaded');
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
        }
    }

    /**
     * Load data for specific tab
     */
    async loadTabData(tabName) {
        console.log(`📊 Loading data for tab: ${tabName}`);
        
        try {
            switch (tabName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'quotes':
                    await this.loadQuotesData();
                    break;
                case 'contractors':
                    await this.loadContractorsData();
                    break;
                case 'users':
                    await this.loadUsersData();
                    break;
                case 'sms':
                    await this.loadSMSData();
                    break;
                case 'settings':
                    await this.loadSettingsData();
                    break;
            }
        } catch (error) {
            console.error(`❌ Error loading ${tabName} data:`, error);
        }
    }

    /**
     * Load dashboard statistics
     */
    async loadDashboardStats() {
        try {
            const response = await fetch('/api/admin.php?action=get_dashboard_stats');
            const result = await response.json();
            
            if (result.success) {
                this.updateDashboardStats(result.stats);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    /**
     * Update dashboard statistics display
     */
    updateDashboardStats(stats) {
        // Update stat cards
        const elements = {
            'totalQuotes': stats.total_quotes || 0,
            'totalContractors': stats.total_contractors || 0,
            'totalSMS': stats.total_sms || 0,
            'conversionRate': (stats.conversion_rate || 0) + '%'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update trend indicators
        this.updateTrendIndicators(stats.trends || {});
    }

    /**
     * Update trend indicators
     */
    updateTrendIndicators(trends) {
        const trendElements = {
            'quotesChange': trends.quotes_change || 0,
            'contractorsChange': trends.contractors_change || 0,
            'smsChange': trends.sms_change || 0,
            'conversionChange': trends.conversion_change || 0
        };
        
        Object.entries(trendElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                const sign = value >= 0 ? '+' : '';
                element.textContent = `${sign}${value}%`;
                element.className = `trend-value ${value >= 0 ? 'positive' : 'negative'}`;
            }
        });
    }

    /**
     * Load header statistics
     */
    async loadHeaderStats() {
        try {
            // Update header stats
            const headerElements = {
                'headerTodayQuotes': '0',
                'headerActiveContractors': '0',
                'headerSmsBalance': '-'
            };
            
            Object.entries(headerElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
        } catch (error) {
            console.error('Error loading header stats:', error);
        }
    }

    /**
     * Load dashboard data (charts, activity, etc.)
     */
    async loadDashboardData() {
        console.log('📊 Loading dashboard data...');

        try {
            // Load recent activity
            await this.loadRecentActivity();

            // Initialize charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                this.initializeCharts();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    /**
     * Load quotes data
     */
    async loadQuotesData() {
        console.log('📋 Loading quotes data...');

        try {
            this.showTableLoading('quotesTableLoading');

            // Try multiple API endpoints
            let response;
            let result;

            try {
                response = await fetch('admin.php?action=get_quotes');
                result = await response.json();
            } catch (error) {
                console.log('Main API failed, trying alternative...');
                response = await fetch('../admin.php?action=get_quotes');
                result = await response.json();
            }

            if (result && result.success && result.quotes) {
                this.allQuotes = result.quotes;
                this.filteredQuotes = [...this.allQuotes];
                console.log(`✅ Loaded ${this.allQuotes.length} quotes`);
                this.renderQuotesTable();
                this.updateQuotesStats();
                this.populateQuoteFilters();
            } else {
                // Load mock data for testing
                console.log('API failed, loading mock quotes...');
                this.loadMockQuotes();
            }
        } catch (error) {
            console.error('Error loading quotes:', error);
            this.loadMockQuotes();
        } finally {
            this.hideTableLoading('quotesTableLoading');
        }
    }

    /**
     * Load mock quotes data for testing
     */
    loadMockQuotes() {
        console.log('📋 Loading mock quotes data...');

        this.allQuotes = [
            {
                id: 1,
                request_number: 'REQ-2024-001',
                customer_name: 'יוסי כהן',
                customer_phone: '050-1234567',
                customer_email: 'yossi@example.com',
                customer_city: 'תל אביב',
                pool_type: 'concrete',
                pool_size: 'medium',
                budget_range: '100000-200000',
                project_location: 'תל אביב, רחוב הרצל 15',
                status: 'pending',
                description: 'בריכה פרטיות בחצר האחורית',
                created_at: '2024-01-15 10:30:00'
            },
            {
                id: 2,
                request_number: 'REQ-2024-002',
                customer_name: 'שרה לוי',
                customer_phone: '052-9876543',
                customer_email: 'sara@example.com',
                customer_city: 'חיפה',
                pool_type: 'fiberglass',
                pool_size: 'small',
                budget_range: '50000-100000',
                project_location: 'חיפה, שכונת הדר',
                status: 'sent_to_contractors',
                description: 'בריכה קטנה למרפסת',
                created_at: '2024-01-14 14:20:00'
            },
            {
                id: 3,
                request_number: 'REQ-2024-003',
                customer_name: 'דוד אברהם',
                customer_phone: '054-5555555',
                customer_email: 'david@example.com',
                customer_city: 'באר שבע',
                pool_type: 'vinyl',
                pool_size: 'large',
                budget_range: '200000-300000',
                project_location: 'באר שבע, שכונת רמות',
                status: 'completed',
                description: 'בריכה גדולה עם מערכת חימום',
                created_at: '2024-01-10 09:15:00'
            }
        ];

        this.filteredQuotes = [...this.allQuotes];
        console.log(`✅ Loaded ${this.allQuotes.length} mock quotes`);
        this.renderQuotesTable();
        this.updateQuotesStats();
        this.populateQuoteFilters();

        this.showSuccess(`נטענו ${this.allQuotes.length} בקשות הצעות מחיר (נתוני דמו)`);
    }

    /**
     * Load contractors data
     */
    async loadContractorsData() {
        console.log('👥 Loading contractors data...');

        try {
            this.showContractorsLoading();

            // Try multiple API endpoints
            let response;
            let result;

            // First try the main contractors API
            try {
                response = await fetch('contractors.php?action=get_contractors');
                result = await response.json();
            } catch (error) {
                console.log('Main API failed, trying alternative...');
                // Try alternative path
                response = await fetch('../contractors.php?action=get_contractors');
                result = await response.json();
            }

            if (result && result.success && result.contractors) {
                this.allContractors = result.contractors;
                this.filteredContractors = [...this.allContractors];
                console.log(`✅ Loaded ${this.allContractors.length} contractors`);
                this.renderContractors();
                this.updateContractorsStats();
                this.populateContractorFilters();
            } else {
                // Fallback to mock data for testing
                console.log('API failed, loading mock data...');
                this.loadMockContractors();
            }
        } catch (error) {
            console.error('Error loading contractors:', error);
            // Load mock data as fallback
            this.loadMockContractors();
        } finally {
            this.hideContractorsLoading();
        }
    }

    /**
     * Load mock contractors data for testing
     */
    loadMockContractors() {
        console.log('📋 Loading mock contractors data...');

        this.allContractors = [
            {
                id: 1,
                title: 'בריכות אלון - מומחים בבניית בריכות',
                phone: '050-1234567',
                email: 'info@alon-pools.co.il',
                city: 'תל אביב',
                categories: ['pool_construction', 'pool_design'],
                rating: 5,
                description: 'חברה מובילה בתחום בניית בריכות פרטיות ומסחריות',
                latitude: 32.0853,
                longitude: 34.7818,
                status: 'active'
            },
            {
                id: 2,
                title: 'Pool Tech - תחזוקת בריכות מקצועית',
                phone: '052-9876543',
                email: 'service@pooltech.co.il',
                city: 'חיפה',
                categories: ['pool_maintenance', 'pool_equipment'],
                rating: 4,
                description: 'שירותי תחזוקה מקצועיים לבריכות פרטיות',
                latitude: 32.7940,
                longitude: 34.9896,
                status: 'active'
            },
            {
                id: 3,
                title: 'בריכות הגליל - עיצוב ובנייה',
                phone: '054-5555555',
                email: 'design@galil-pools.co.il',
                city: 'נצרת',
                categories: ['pool_construction', 'pool_design', 'pool_equipment'],
                rating: 5,
                description: 'עיצוב ובנייה של בריכות יוקרה בצפון',
                latitude: 32.7022,
                longitude: 35.2993,
                status: 'active'
            },
            {
                id: 4,
                title: 'אקווה סיסטם - מערכות מים מתקדמות',
                phone: '053-7777777',
                email: 'info@aquasystem.co.il',
                city: 'באר שבע',
                categories: ['pool_equipment', 'pool_maintenance'],
                rating: 4,
                description: 'התקנת מערכות סינון וחיטוי מתקדמות',
                latitude: 31.2518,
                longitude: 34.7915,
                status: 'active'
            },
            {
                id: 5,
                title: 'בריכות יוקרה - פתרונות פרימיום',
                phone: '050-9999999',
                email: 'luxury@premium-pools.co.il',
                city: 'הרצליה',
                categories: ['pool_construction', 'pool_design'],
                rating: 5,
                description: 'בריכות יוקרה עם עיצוב אישי ומערכות חכמות',
                latitude: 32.1624,
                longitude: 34.8443,
                status: 'active'
            }
        ];

        this.filteredContractors = [...this.allContractors];
        console.log(`✅ Loaded ${this.allContractors.length} mock contractors`);
        this.renderContractors();
        this.updateContractorsStats();
        this.populateContractorFilters();

        this.showSuccess(`נטענו ${this.allContractors.length} קבלנים (נתוני דמו)`);
    }

    /**
     * Load users data
     */
    async loadUsersData() {
        console.log('👤 Loading users data...');

        try {
            this.showTableLoading('usersTableLoading');

            const response = await fetch('/api/users_fixed.php?action=get_users');
            const result = await response.json();

            if (result.success) {
                this.allUsers = result.users || [];
                this.filteredUsers = [...this.allUsers];
                this.renderUsersTable();
                this.updateUsersStats();
            } else {
                this.showError('שגיאה בטעינת משתמשים: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('שגיאה בטעינת משתמשים');
        } finally {
            this.hideTableLoading('usersTableLoading');
        }
    }

    /**
     * Load SMS data
     */
    async loadSMSData() {
        console.log('📱 Loading SMS data...');

        try {
            this.showTableLoading('smsTableLoading');

            // Load SMS history
            const response = await fetch('/api/sms.php?action=get_sms_history');
            const result = await response.json();

            if (result.success) {
                this.allSMS = result.sms || [];
                this.filteredSMS = [...this.allSMS];
                this.renderSMSTable();
                this.updateSMSStats();
            }

            // Load SMS templates
            await this.loadSMSTemplates();

            // Load SMS settings
            await this.loadSMSSettings();

        } catch (error) {
            console.error('Error loading SMS data:', error);
            this.showError('שגיאה בטעינת נתוני SMS');
        } finally {
            this.hideTableLoading('smsTableLoading');
        }
    }

    /**
     * Load settings data
     */
    async loadSettingsData() {
        console.log('⚙️ Loading settings data...');

        try {
            const response = await fetch('/api/settings_fixed.php?action=get_settings');
            const result = await response.json();

            if (result.success) {
                this.systemSettings = result.settings || {};
                this.populateSettingsForm();
            } else {
                this.showError('שגיאה בטעינת הגדרות: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showError('שגיאה בטעינת הגדרות');
        }
    }

    /**
     * Setup auto-refresh intervals
     */
    setupAutoRefresh() {
        // Refresh header stats every 30 seconds
        this.intervals.headerStats = setInterval(() => {
            this.loadHeaderStats();
        }, 30000);
        
        // Refresh dashboard stats every 60 seconds
        this.intervals.dashboardStats = setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboardStats();
            }
        }, 60000);
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create or update error notification
        let errorDiv = document.getElementById('errorNotification');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'errorNotification';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dc3545;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            `;
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; margin-right: 10px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // ===== MODAL MANAGEMENT FUNCTIONS =====

    /**
     * Create and show a modal
     */
    showModal(modalId, title, content, modalClass = '') {
        // Remove existing modal if any
        this.closeModal(modalId);

        const modalHTML = `
            <div id="${modalId}" class="modal ${modalClass}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button type="button" class="modal-close" onclick="adminPanel.closeModal('${modalId}')">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById(modalId);

        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });

        // Close on ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        return modal;
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    /**
     * Show loading state in modal
     */
    showModalLoading(modalId) {
        const modalBody = document.querySelector(`#${modalId} .modal-body`);
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="modal-loading">
                    <i class="fas fa-spinner"></i>
                    טוען נתונים...
                </div>
            `;
        }
    }

    /**
     * Show error in modal
     */
    showModalError(modalId, message) {
        const modalBody = document.querySelector(`#${modalId} .modal-body`);
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="modal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                </div>
            `;
        }
    }

    /**
     * Show change password modal
     */
    showChangePasswordModal() {
        const formContent = `
            <form id="changePasswordForm" class="modal-form" onsubmit="adminPanel.changePassword(event)">
                <div class="form-group">
                    <label for="currentPassword">סיסמה נוכחית *</label>
                    <input type="password" id="currentPassword" name="currentPassword" required>
                </div>
                <div class="form-group">
                    <label for="newPassword">סיסמה חדשה *</label>
                    <input type="password" id="newPassword" name="newPassword" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">אישור סיסמה חדשה *</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        שמור סיסמה
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal('changePasswordModal')">
                        <i class="fas fa-times"></i>
                        ביטול
                    </button>
                </div>
            </form>
        `;

        this.showModal('changePasswordModal', 'שינוי סיסמה', formContent, 'password-modal');
    }

    /**
     * Change password
     */
    async changePassword(event) {
        event.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validation
        if (newPassword !== confirmPassword) {
            this.showError('הסיסמאות החדשות אינן תואמות');
            return;
        }

        if (newPassword.length < 6) {
            this.showError('הסיסמה חייבת להכיל לפחות 6 תווים');
            return;
        }

        try {
            const response = await fetch('/api/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'change_password',
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('הסיסמה שונתה בהצלחה');
                this.closeModal('changePasswordModal');
            } else {
                this.showError('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showError('שגיאה בשינוי הסיסמה');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Create or update success notification
        let successDiv = document.getElementById('successNotification');

        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successNotification';
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            `;
            document.body.appendChild(successDiv);
        }

        successDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; margin-right: 10px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (successDiv && successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }

    /**
     * Cleanup intervals and event listeners
     */
    destroy() {
        Object.values(this.intervals).forEach(interval => {
            clearInterval(interval);
        });

        this.intervals = {};
    }

    // ===== HELPER FUNCTIONS =====

    /**
     * Show table loading state
     */
    showTableLoading(loadingId) {
        const loading = document.getElementById(loadingId);
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    /**
     * Hide table loading state
     */
    hideTableLoading(loadingId) {
        const loading = document.getElementById(loadingId);
        if (loading) {
            loading.style.display = 'none';
        }
    }

    /**
     * Show contractors loading
     */
    showContractorsLoading() {
        const loading = document.getElementById('contractorsLoading');
        const grid = document.getElementById('contractorsGrid');
        const list = document.getElementById('contractorsList');

        if (loading) loading.style.display = 'block';
        if (grid) grid.style.display = 'none';
        if (list) list.style.display = 'none';
    }

    /**
     * Hide contractors loading
     */
    hideContractorsLoading() {
        const loading = document.getElementById('contractorsLoading');
        if (loading) loading.style.display = 'none';
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'לא זמין';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('he-IL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'תאריך לא תקין';
        }
    }

    /**
     * Format phone number
     */
    formatPhone(phone) {
        if (!phone) return 'לא זמין';

        // Remove non-digits
        const cleaned = phone.replace(/\D/g, '');

        // Format Israeli phone numbers
        if (cleaned.length === 10 && cleaned.startsWith('05')) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }

        return phone;
    }

    /**
     * Get status text in Hebrew
     */
    getStatusText(status) {
        const statusMap = {
            'pending': 'ממתין',
            'sent_to_contractors': 'נשלח לקבלנים',
            'contractors_responded': 'קבלנים הגיבו',
            'completed': 'הושלם',
            'cancelled': 'בוטל',
            'active': 'פעיל',
            'inactive': 'לא פעיל',
            'banned': 'חסום',
            'sent': 'נשלח',
            'failed': 'נכשל'
        };
        return statusMap[status] || status;
    }

    /**
     * Get role text in Hebrew
     */
    getRoleText(role) {
        const roleMap = {
            'user': 'משתמש',
            'contractor': 'קבלן',
            'admin': 'מנהל'
        };
        return roleMap[role] || role;
    }

    /**
     * Get pool type text in Hebrew
     */
    getPoolTypeText(poolType) {
        const poolTypeMap = {
            'concrete': 'בטון',
            'fiberglass': 'פיברגלס',
            'vinyl': 'ויניל',
            'natural': 'טבעית'
        };
        return poolTypeMap[poolType] || poolType;
    }

    /**
     * Generate rating stars
     */
    generateStars(rating) {
        const fullStars = Math.floor(rating || 0);
        const emptyStars = 5 - fullStars;

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '★';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '☆';
        }

        return stars;
    }

    /**
     * Truncate text
     */
    truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        if (!amount) return '0 ₪';
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount);
    }

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== RENDER FUNCTIONS =====

    /**
     * Render quotes table
     */
    renderQuotesTable() {
        const tbody = document.getElementById('quotesTableBody');
        if (!tbody) return;

        if (this.filteredQuotes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: var(--gray-500);">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        אין בקשות הצעות מחיר להצגה
                    </td>
                </tr>
            `;
            this.updateResultsCount('quotesResultsCount', 0);
            return;
        }

        tbody.innerHTML = this.filteredQuotes.map(quote => `
            <tr data-id="${quote.id}">
                <td>${quote.request_number || quote.id}</td>
                <td>${quote.customer_name || 'לא זמין'}</td>
                <td>${this.formatPhone(quote.customer_phone)}</td>
                <td>${this.getPoolTypeText(quote.pool_type)}</td>
                <td>${quote.customer_city || quote.project_location || 'לא זמין'}</td>
                <td>${quote.budget_range || 'לא צוין'}</td>
                <td><span class="status-badge status-${quote.status}">${this.getStatusText(quote.status)}</span></td>
                <td>${this.formatDate(quote.created_at)}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="adminPanel.showQuoteEditModal(${quote.id})" title="עריכה">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-info" onclick="adminPanel.viewQuoteDetails(${quote.id})" title="צפייה">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="adminPanel.deleteQuote(${quote.id})" title="מחיקה">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.updateResultsCount('quotesResultsCount', this.filteredQuotes.length);
    }

    /**
     * Render contractors
     */
    renderContractors() {
        const currentView = document.querySelector('.view-btn.active')?.dataset.view || 'grid';

        if (currentView === 'grid') {
            this.renderContractorsGrid();
        } else {
            this.renderContractorsList();
        }

        this.updateResultsCount('contractorsResultsCount', this.filteredContractors.length);
    }

    /**
     * Render contractors grid
     */
    renderContractorsGrid() {
        const grid = document.getElementById('contractorsGrid');
        const list = document.getElementById('contractorsList');

        if (!grid) return;

        grid.style.display = 'grid';
        if (list) list.style.display = 'none';

        if (this.filteredContractors.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray-500);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                    <h3>אין קבלנים להצגה</h3>
                    <p>נסה לשנות את הפילטרים או להוסיף קבלנים חדשים</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredContractors.map(contractor => `
            <div class="contractor-card" data-id="${contractor.id}">
                <div class="contractor-header">
                    <h3 class="contractor-title">${contractor.title}</h3>
                    <div class="contractor-rating">
                        <span>${this.generateStars(contractor.rating)}</span>
                        <span>(${contractor.rating || 5})</span>
                    </div>
                </div>

                <div class="contractor-info">
                    <div class="contractor-info-item">
                        <i class="fas fa-phone"></i>
                        <span>${this.formatPhone(contractor.phone)}</span>
                    </div>
                    <div class="contractor-info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${contractor.city || 'לא צוין'}</span>
                    </div>
                    <div class="contractor-info-item">
                        <i class="fas fa-envelope"></i>
                        <span>${contractor.email || 'לא צוין'}</span>
                    </div>
                </div>

                <div class="contractor-categories">
                    ${this.renderContractorCategories(contractor.categories)}
                </div>

                <div class="contractor-actions">
                    <button type="button" class="btn btn-sm btn-primary" onclick="adminPanel.showContractorEditModal(${contractor.id})" title="עריכה">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-info" onclick="adminPanel.viewContractorDetails(${contractor.id})" title="צפייה">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="adminPanel.deleteContractor(${contractor.id})" title="מחיקה">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render contractors list
     */
    renderContractorsList() {
        const grid = document.getElementById('contractorsGrid');
        const list = document.getElementById('contractorsList');
        const tbody = document.getElementById('contractorsListBody');

        if (!list || !tbody) return;

        if (grid) grid.style.display = 'none';
        list.style.display = 'block';

        if (this.filteredContractors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--gray-500);">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        אין קבלנים להצגה
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredContractors.map(contractor => `
            <tr data-id="${contractor.id}">
                <td>${contractor.title}</td>
                <td>${this.formatPhone(contractor.phone)}</td>
                <td>${contractor.city || 'לא צוין'}</td>
                <td>${this.renderContractorCategoriesText(contractor.categories)}</td>
                <td>
                    <span class="contractor-rating">
                        ${this.generateStars(contractor.rating)} (${contractor.rating || 5})
                    </span>
                </td>
                <td><span class="status-badge status-active">פעיל</span></td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="adminPanel.showContractorEditModal(${contractor.id})" title="עריכה">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-info" onclick="adminPanel.viewContractorDetails(${contractor.id})" title="צפייה">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="adminPanel.deleteContractor(${contractor.id})" title="מחיקה">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render contractor categories
     */
    renderContractorCategories(categories) {
        if (!categories) return '';

        const categoryMap = {
            'pool_construction': 'בניית בריכות',
            'pool_maintenance': 'תחזוקת בריכות',
            'pool_equipment': 'ציוד בריכות',
            'pool_design': 'עיצוב בריכות'
        };

        const categoriesArray = Array.isArray(categories) ? categories :
                               typeof categories === 'string' ? categories.split(',') : [];

        return categoriesArray.map(cat =>
            `<span class="category-tag">${categoryMap[cat.trim()] || cat}</span>`
        ).join('');
    }

    /**
     * Render contractor categories as text
     */
    renderContractorCategoriesText(categories) {
        if (!categories) return 'לא צוין';

        const categoryMap = {
            'pool_construction': 'בניית בריכות',
            'pool_maintenance': 'תחזוקת בריכות',
            'pool_equipment': 'ציוד בריכות',
            'pool_design': 'עיצוב בריכות'
        };

        const categoriesArray = Array.isArray(categories) ? categories :
                               typeof categories === 'string' ? categories.split(',') : [];

        return categoriesArray.map(cat => categoryMap[cat.trim()] || cat).join(', ');
    }

    /**
     * Render users table
     */
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: var(--gray-500);">
                        <i class="fas fa-user-friends" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        אין משתמשים להצגה
                    </td>
                </tr>
            `;
            this.updateResultsCount('usersResultsCount', 0);
            return;
        }

        tbody.innerHTML = this.filteredUsers.map(user => `
            <tr data-id="${user.id}">
                <td>${user.username}</td>
                <td>${user.email || 'לא זמין'}</td>
                <td>${this.formatPhone(user.phone)}</td>
                <td><span class="status-badge status-${user.role}">${this.getRoleText(user.role)}</span></td>
                <td><span class="status-badge status-${user.status}">${this.getStatusText(user.status)}</span></td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>${this.formatDate(user.last_login)}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary" onclick="adminPanel.showUserEditModal(${user.id})" title="עריכה">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-warning" onclick="adminPanel.toggleUserStatus(${user.id})" title="שנה סטטוס">
                        <i class="fas fa-user-lock"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="adminPanel.deleteUser(${user.id})" title="מחיקה">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.updateResultsCount('usersResultsCount', this.filteredUsers.length);
    }

    /**
     * Update results count
     */
    updateResultsCount(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            const text = count === 1 ? 'תוצאה אחת' : `${count} תוצאות`;
            element.textContent = text;
        }
    }

    // ===== STATISTICS FUNCTIONS =====

    /**
     * Update quotes statistics
     */
    updateQuotesStats() {
        const pending = this.allQuotes.filter(q => q.status === 'pending').length;
        const inProgress = this.allQuotes.filter(q => ['sent_to_contractors', 'contractors_responded'].includes(q.status)).length;
        const completed = this.allQuotes.filter(q => q.status === 'completed').length;
        const today = this.allQuotes.filter(q => this.isToday(q.created_at)).length;

        this.updateStatElement('pendingQuotesCount', pending);
        this.updateStatElement('inProgressQuotesCount', inProgress);
        this.updateStatElement('completedQuotesCount', completed);
        this.updateStatElement('todayQuotesCount', today);
    }

    /**
     * Update contractors statistics
     */
    updateContractorsStats() {
        const total = this.allContractors.length;
        const active = this.allContractors.filter(c => c.status !== 'inactive').length;
        const topRated = this.allContractors.filter(c => (c.rating || 5) >= 5).length;
        const newThisMonth = this.allContractors.filter(c => this.isThisMonth(c.created_at)).length;

        this.updateStatElement('totalContractorsCount', total);
        this.updateStatElement('activeContractorsCount', active);
        this.updateStatElement('topRatedContractorsCount', topRated);
        this.updateStatElement('newContractorsCount', newThisMonth);
    }

    /**
     * Update users statistics
     */
    updateUsersStats() {
        const total = this.allUsers.length;
        const active = this.allUsers.filter(u => u.status === 'active').length;
        const contractors = this.allUsers.filter(u => u.role === 'contractor').length;
        const newThisMonth = this.allUsers.filter(u => this.isThisMonth(u.created_at)).length;

        this.updateStatElement('totalUsersCount', total);
        this.updateStatElement('activeUsersCount', active);
        this.updateStatElement('contractorUsersCount', contractors);
        this.updateStatElement('newUsersCount', newThisMonth);
    }

    /**
     * Update SMS statistics
     */
    updateSMSStats() {
        if (!this.allSMS) return;

        const total = this.allSMS.length;
        const successful = this.allSMS.filter(s => s.status === 'sent').length;
        const today = this.allSMS.filter(s => this.isToday(s.sent_at)).length;

        this.updateStatElement('totalSMSCount', total);
        this.updateStatElement('successfulSMSCount', successful);
        this.updateStatElement('todaySMSCount', today);
        this.updateStatElement('smsBalance', '1000'); // This should come from API
    }

    /**
     * Update stat element
     */
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Check if date is today
     */
    isToday(dateString) {
        if (!dateString) return false;
        const today = new Date();
        const date = new Date(dateString);
        return date.toDateString() === today.toDateString();
    }

    /**
     * Check if date is this month
     */
    isThisMonth(dateString) {
        if (!dateString) return false;
        const today = new Date();
        const date = new Date(dateString);
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }

    // ===== FILTER FUNCTIONS =====

    /**
     * Apply quote filters
     */
    applyQuoteFilters() {
        const statusFilter = document.getElementById('quoteStatusFilter')?.value || '';
        const poolTypeFilter = document.getElementById('quotePoolTypeFilter')?.value || '';
        const dateFilter = document.getElementById('quoteDateFilter')?.value || '';
        const searchTerm = document.getElementById('quoteSearchInput')?.value.toLowerCase() || '';

        this.filteredQuotes = this.allQuotes.filter(quote => {
            // Status filter
            if (statusFilter && quote.status !== statusFilter) return false;

            // Pool type filter
            if (poolTypeFilter && quote.pool_type !== poolTypeFilter) return false;

            // Date filter
            if (dateFilter && !this.matchesDateFilter(quote.created_at, dateFilter)) return false;

            // Search filter
            if (searchTerm) {
                const searchableText = [
                    quote.customer_name,
                    quote.customer_phone,
                    quote.customer_city,
                    quote.project_location
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) return false;
            }

            return true;
        });

        this.renderQuotesTable();
    }

    /**
     * Apply contractor filters
     */
    applyContractorFilters() {
        const cityFilter = document.getElementById('contractorCityFilter')?.value || '';
        const categoryFilter = document.getElementById('contractorCategoryFilter')?.value || '';
        const ratingFilter = document.getElementById('contractorRatingFilter')?.value || '';
        const searchTerm = document.getElementById('contractorSearchInput')?.value.toLowerCase() || '';

        this.filteredContractors = this.allContractors.filter(contractor => {
            // City filter
            if (cityFilter && contractor.city !== cityFilter) return false;

            // Category filter
            if (categoryFilter) {
                const categories = Array.isArray(contractor.categories) ?
                    contractor.categories :
                    (contractor.categories || '').split(',');
                if (!categories.some(cat => cat.trim() === categoryFilter)) return false;
            }

            // Rating filter
            if (ratingFilter) {
                const rating = contractor.rating || 5;
                const minRating = parseInt(ratingFilter);
                if (rating < minRating) return false;
            }

            // Search filter
            if (searchTerm) {
                const searchableText = [
                    contractor.title,
                    contractor.phone,
                    contractor.city,
                    contractor.email
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) return false;
            }

            return true;
        });

        this.renderContractors();
    }

    /**
     * Apply user filters
     */
    applyUserFilters() {
        const roleFilter = document.getElementById('userRoleFilter')?.value || '';
        const statusFilter = document.getElementById('userStatusFilter')?.value || '';
        const dateFilter = document.getElementById('userDateFilter')?.value || '';
        const searchTerm = document.getElementById('userSearchInput')?.value.toLowerCase() || '';

        this.filteredUsers = this.allUsers.filter(user => {
            // Role filter
            if (roleFilter && user.role !== roleFilter) return false;

            // Status filter
            if (statusFilter && user.status !== statusFilter) return false;

            // Date filter
            if (dateFilter && !this.matchesDateFilter(user.created_at, dateFilter)) return false;

            // Search filter
            if (searchTerm) {
                const searchableText = [
                    user.username,
                    user.email,
                    user.phone
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) return false;
            }

            return true;
        });

        this.renderUsersTable();
    }

    /**
     * Check if date matches filter
     */
    matchesDateFilter(dateString, filter) {
        if (!dateString || !filter) return true;

        const date = new Date(dateString);
        const now = new Date();

        switch (filter) {
            case 'today':
                return this.isToday(dateString);
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= weekAgo;
            case 'month':
                return this.isThisMonth(dateString);
            case 'year':
                return date.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    }

    /**
     * Reset quote filters
     */
    resetQuoteFilters() {
        document.getElementById('quoteStatusFilter').value = '';
        document.getElementById('quotePoolTypeFilter').value = '';
        document.getElementById('quoteDateFilter').value = '';
        document.getElementById('quoteSearchInput').value = '';

        this.filteredQuotes = [...this.allQuotes];
        this.renderQuotesTable();
    }

    /**
     * Reset contractor filters
     */
    resetContractorFilters() {
        document.getElementById('contractorCityFilter').value = '';
        document.getElementById('contractorCategoryFilter').value = '';
        document.getElementById('contractorRatingFilter').value = '';
        document.getElementById('contractorSearchInput').value = '';

        this.filteredContractors = [...this.allContractors];
        this.renderContractors();
    }

    /**
     * Reset user filters
     */
    resetUserFilters() {
        document.getElementById('userRoleFilter').value = '';
        document.getElementById('userStatusFilter').value = '';
        document.getElementById('userDateFilter').value = '';
        document.getElementById('userSearchInput').value = '';

        this.filteredUsers = [...this.allUsers];
        this.renderUsersTable();
    }

    /**
     * Search functions with debouncing
     */
    searchQuotes() {
        if (!this.searchQuotesDebounced) {
            this.searchQuotesDebounced = this.debounce(() => this.applyQuoteFilters(), 300);
        }
        this.searchQuotesDebounced();
    }

    searchContractors() {
        if (!this.searchContractorsDebounced) {
            this.searchContractorsDebounced = this.debounce(() => this.applyContractorFilters(), 300);
        }
        this.searchContractorsDebounced();
    }

    searchUsers() {
        if (!this.searchUsersDebounced) {
            this.searchUsersDebounced = this.debounce(() => this.applyUserFilters(), 300);
        }
        this.searchUsersDebounced();
    }

    // ===== MODAL FUNCTIONS =====

    /**
     * Show quote edit modal
     */
    async showQuoteEditModal(quoteId) {
        const modalId = 'quoteEditModal';
        const title = quoteId ? 'עריכת בקשת הצעת מחיר' : 'בקשת הצעת מחיר חדשה';

        this.showModal(modalId, title, '', 'quote-modal');
        this.showModalLoading(modalId);

        try {
            let quote = {};

            if (quoteId) {
                const response = await fetch(`/api/admin.php?action=get_quote&id=${quoteId}`);
                const result = await response.json();

                if (!result.success) {
                    this.showModalError(modalId, result.message || 'שגיאה בטעינת נתוני הבקשה');
                    return;
                }

                quote = result.quote;
            }

            const formContent = this.createQuoteForm(quote, quoteId);
            const modalBody = document.querySelector(`#${modalId} .modal-body`);
            modalBody.innerHTML = formContent;

        } catch (error) {
            console.error('Error loading quote:', error);
            this.showModalError(modalId, 'שגיאה בטעינת נתוני הבקשה');
        }
    }

    /**
     * Create quote form HTML
     */
    createQuoteForm(quote = {}, quoteId = null) {
        return `
            <form id="quoteForm" class="modal-form" onsubmit="adminPanel.saveQuote(event, ${quoteId})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="quoteCustomerName">שם הלקוח *</label>
                        <input type="text" id="quoteCustomerName" name="customer_name" value="${quote.customer_name || ''}" placeholder="הכנס שם לקוח" required>
                    </div>
                    <div class="form-group">
                        <label for="quoteCustomerPhone">טלפון לקוח *</label>
                        <input type="tel" id="quoteCustomerPhone" name="customer_phone" value="${quote.customer_phone || ''}" placeholder="050-1234567" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="quoteCustomerEmail">אימייל לקוח</label>
                        <input type="email" id="quoteCustomerEmail" name="customer_email" value="${quote.customer_email || ''}" placeholder="customer@example.com">
                    </div>
                    <div class="form-group">
                        <label for="quoteCustomerCity">עיר לקוח</label>
                        <input type="text" id="quoteCustomerCity" name="customer_city" value="${quote.customer_city || ''}" placeholder="תל אביב">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="quotePoolType">סוג בריכה *</label>
                        <select id="quotePoolType" name="pool_type" required>
                            <option value="">בחר סוג בריכה</option>
                            <option value="concrete" ${quote.pool_type === 'concrete' ? 'selected' : ''}>בטון</option>
                            <option value="fiberglass" ${quote.pool_type === 'fiberglass' ? 'selected' : ''}>פיברגלס</option>
                            <option value="vinyl" ${quote.pool_type === 'vinyl' ? 'selected' : ''}>ויניל</option>
                            <option value="natural" ${quote.pool_type === 'natural' ? 'selected' : ''}>טבעית</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="quotePoolSize">גודל בריכה</label>
                        <select id="quotePoolSize" name="pool_size">
                            <option value="">בחר גודל</option>
                            <option value="small" ${quote.pool_size === 'small' ? 'selected' : ''}>קטנה (עד 20 מ"ר)</option>
                            <option value="medium" ${quote.pool_size === 'medium' ? 'selected' : ''}>בינונית (20-40 מ"ר)</option>
                            <option value="large" ${quote.pool_size === 'large' ? 'selected' : ''}>גדולה (40+ מ"ר)</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="quoteBudgetRange">תקציב</label>
                        <select id="quoteBudgetRange" name="budget_range">
                            <option value="">בחר תקציב</option>
                            <option value="50000-100000" ${quote.budget_range === '50000-100000' ? 'selected' : ''}>50,000-100,000 ₪</option>
                            <option value="100000-200000" ${quote.budget_range === '100000-200000' ? 'selected' : ''}>100,000-200,000 ₪</option>
                            <option value="200000-300000" ${quote.budget_range === '200000-300000' ? 'selected' : ''}>200,000-300,000 ₪</option>
                            <option value="300000+" ${quote.budget_range === '300000+' ? 'selected' : ''}>300,000+ ₪</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="quoteStatus">סטטוס</label>
                        <select id="quoteStatus" name="status">
                            <option value="pending" ${quote.status === 'pending' ? 'selected' : ''}>ממתין</option>
                            <option value="sent_to_contractors" ${quote.status === 'sent_to_contractors' ? 'selected' : ''}>נשלח לקבלנים</option>
                            <option value="contractors_responded" ${quote.status === 'contractors_responded' ? 'selected' : ''}>קבלנים הגיבו</option>
                            <option value="completed" ${quote.status === 'completed' ? 'selected' : ''}>הושלם</option>
                            <option value="cancelled" ${quote.status === 'cancelled' ? 'selected' : ''}>בוטל</option>
                        </select>
                    </div>
                </div>

                <div class="form-group full-width">
                    <label for="quoteProjectLocation">מיקום הפרויקט</label>
                    <input type="text" id="quoteProjectLocation" name="project_location" value="${quote.project_location || ''}" placeholder="כתובת מלאה של הפרויקט">
                </div>

                <div class="form-group full-width">
                    <label for="quoteDescription">תיאור הפרויקט</label>
                    <textarea id="quoteDescription" name="description" rows="4" placeholder="תאר את הפרויקט, דרישות מיוחדות, וכל פרט רלוונטי...">${quote.description || ''}</textarea>
                </div>

                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        ${quoteId ? 'עדכן בקשה' : 'צור בקשה'}
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal('quoteEditModal')">
                        <i class="fas fa-times"></i>
                        ביטול
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Save quote
     */
    async saveQuote(event, quoteId) {
        event.preventDefault();

        const form = document.getElementById('quoteForm');
        const formData = new FormData(form);

        const quoteData = {};
        for (let [key, value] of formData.entries()) {
            quoteData[key] = value;
        }

        try {
            const action = quoteId ? 'update_quote' : 'create_quote';
            const requestData = {
                action: action,
                ...quoteData
            };

            if (quoteId) {
                requestData.id = quoteId;
            }

            const response = await fetch('/api/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(quoteId ? 'הבקשה עודכנה בהצלחה' : 'הבקשה נוצרה בהצלחה');
                this.closeModal('quoteEditModal');
                this.loadQuotesData();
            } else {
                this.showError('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving quote:', error);
            this.showError('שגיאה בשמירת הבקשה');
        }
    }

    /**
     * Show contractor edit modal
     */
    async showContractorEditModal(contractorId) {
        const modalId = 'contractorEditModal';
        const title = contractorId ? 'עריכת קבלן' : 'הוספת קבלן חדש';

        this.showModal(modalId, title, '', 'contractor-modal');
        this.showModalLoading(modalId);

        try {
            let contractor = {};

            if (contractorId) {
                const response = await fetch(`/api/contractors.php?action=get_contractor&id=${contractorId}`);
                const result = await response.json();

                if (!result.success) {
                    this.showModalError(modalId, result.message || 'שגיאה בטעינת נתוני הקבלן');
                    return;
                }

                contractor = result.contractor;
            }

            const formContent = this.createContractorForm(contractor, contractorId);
            const modalBody = document.querySelector(`#${modalId} .modal-body`);
            modalBody.innerHTML = formContent;

        } catch (error) {
            console.error('Error loading contractor:', error);
            this.showModalError(modalId, 'שגיאה בטעינת נתוני הקבלן');
        }
    }

    /**
     * Create contractor form HTML
     */
    createContractorForm(contractor = {}, contractorId = null) {
        // Pre-select categories if contractor exists
        const selectedCategories = contractor.categories || [];
        const categoriesArray = Array.isArray(selectedCategories) ? selectedCategories :
                               typeof selectedCategories === 'string' ? selectedCategories.split(',') : [];

        return `
            <form id="contractorForm" class="modal-form" onsubmit="adminPanel.saveContractor(event, ${contractorId})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="contractorTitle">שם הקבלן *</label>
                        <input type="text" id="contractorTitle" name="title" value="${contractor.title || ''}" placeholder="שם החברה או הקבלן" required>
                    </div>
                    <div class="form-group">
                        <label for="contractorPhone">טלפון *</label>
                        <input type="tel" id="contractorPhone" name="phone" value="${contractor.phone || ''}" placeholder="050-1234567" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="contractorEmail">אימייל</label>
                        <input type="email" id="contractorEmail" name="email" value="${contractor.email || ''}" placeholder="contractor@example.com">
                    </div>
                    <div class="form-group">
                        <label for="contractorCity">עיר</label>
                        <input type="text" id="contractorCity" name="city" value="${contractor.city || ''}" placeholder="תל אביב">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="contractorCategories">קטגוריות (ניתן לבחור מספר)</label>
                        <select id="contractorCategories" name="categories" multiple>
                            <option value="pool_construction" ${categoriesArray.includes('pool_construction') ? 'selected' : ''}>בניית בריכות</option>
                            <option value="pool_maintenance" ${categoriesArray.includes('pool_maintenance') ? 'selected' : ''}>תחזוקת בריכות</option>
                            <option value="pool_equipment" ${categoriesArray.includes('pool_equipment') ? 'selected' : ''}>ציוד בריכות</option>
                            <option value="pool_design" ${categoriesArray.includes('pool_design') ? 'selected' : ''}>עיצוב בריכות</option>
                        </select>
                        <small class="form-helper">החזק Ctrl/Cmd לבחירת מספר קטגוריות</small>
                    </div>
                    <div class="form-group">
                        <label for="contractorRating">דירוג</label>
                        <select id="contractorRating" name="rating">
                            <option value="1" ${contractor.rating == 1 ? 'selected' : ''}>1 כוכב</option>
                            <option value="2" ${contractor.rating == 2 ? 'selected' : ''}>2 כוכבים</option>
                            <option value="3" ${contractor.rating == 3 ? 'selected' : ''}>3 כוכבים</option>
                            <option value="4" ${contractor.rating == 4 ? 'selected' : ''}>4 כוכבים</option>
                            <option value="5" ${contractor.rating == 5 || !contractor.rating ? 'selected' : ''}>5 כוכבים</option>
                        </select>
                    </div>
                </div>

                <div class="form-group full-width">
                    <label for="contractorDescription">תיאור</label>
                    <textarea id="contractorDescription" name="description" rows="4" placeholder="תאר את השירותים, הניסיון והמומחיות של הקבלן...">${contractor.description || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="contractorLatitude">קו רוחב (Latitude)</label>
                        <input type="number" id="contractorLatitude" name="latitude" step="0.000001" value="${contractor.latitude || ''}" placeholder="32.0853">
                        <small class="form-helper">למיקום במפה (אופציונלי)</small>
                    </div>
                    <div class="form-group">
                        <label for="contractorLongitude">קו אורך (Longitude)</label>
                        <input type="number" id="contractorLongitude" name="longitude" step="0.000001" value="${contractor.longitude || ''}" placeholder="34.7818">
                        <small class="form-helper">למיקום במפה (אופציונלי)</small>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        ${contractorId ? 'עדכן קבלן' : 'הוסף קבלן'}
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal('contractorEditModal')">
                        <i class="fas fa-times"></i>
                        ביטול
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Save contractor
     */
    async saveContractor(event, contractorId = null) {
        event.preventDefault();

        const form = document.getElementById('contractorForm');
        const formData = new FormData(form);

        const contractorData = {};
        for (let [key, value] of formData.entries()) {
            contractorData[key] = value;
        }

        // Handle categories (multiple select)
        const categoriesSelect = document.getElementById('contractorCategories');
        contractorData.categories = Array.from(categoriesSelect.selectedOptions).map(option => option.value);

        try {
            const action = contractorId ? 'update_contractor' : 'create_contractor';
            const requestData = {
                action: action,
                ...contractorData
            };

            if (contractorId) {
                requestData.id = contractorId;
            }

            const response = await fetch('/api/contractors.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(contractorId ? 'הקבלן עודכן בהצלחה' : 'הקבלן נוסף בהצלחה');
                this.closeModal('contractorEditModal');
                this.loadContractorsData();
            } else {
                this.showError('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving contractor:', error);
            this.showError('שגיאה בשמירת הקבלן');
        }
    }

    // ===== VIEW TOGGLE FUNCTIONS =====

    /**
     * Toggle contractor view between grid and list
     */
    toggleContractorView(view) {
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Render contractors in selected view
        this.renderContractors();
    }

    // ===== TAB FUNCTIONS =====

    /**
     * Show SMS tab
     */
    showSMSTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.sms-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.sms-tabs .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`sms${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');

        // Load tab-specific data
        if (tabName === 'templates') {
            this.loadSMSTemplates();
        } else if (tabName === 'settings') {
            this.loadSMSSettings();
        }
    }

    /**
     * Show settings tab
     */
    showSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.settings-tabs .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}SettingsTab`).classList.add('active');
    }

    // ===== DELETE FUNCTIONS =====

    /**
     * Delete quote with confirmation
     */
    async deleteQuote(quoteId) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את הבקשה?')) {
            return;
        }

        try {
            const response = await fetch('/api/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete_quote',
                    id: quoteId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('הבקשה נמחקה בהצלחה');
                this.loadQuotesData();
            } else {
                this.showError('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting quote:', error);
            this.showError('שגיאה במחיקת הבקשה');
        }
    }

    /**
     * Delete contractor with confirmation
     */
    async deleteContractor(contractorId) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את הקבלן?')) {
            return;
        }

        try {
            const response = await fetch('/api/contractors.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete_contractor',
                    id: contractorId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('הקבלן נמחק בהצלחה');
                this.loadContractorsData();
            } else {
                this.showError('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting contractor:', error);
            this.showError('שגיאה במחיקת הקבלן');
        }
    }

    /**
     * Delete user with confirmation
     */
    async deleteUser(userId) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את המשתמש?')) {
            return;
        }

        try {
            const response = await fetch('/api/users_fixed.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete_user',
                    id: userId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('המשתמש נמחק בהצלחה');
                this.loadUsersData();
            } else {
                this.showError('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError('שגיאה במחיקת המשתמש');
        }
    }

    // ===== EXPORT FUNCTIONS =====

    /**
     * Export quotes to Excel
     */
    exportQuotes() {
        console.log('📊 Exporting quotes to Excel...');
        this.showSuccess('ייצוא בקשות הצעות מחיר בפיתוח');
    }

    /**
     * Export contractors to Excel
     */
    exportContractors() {
        console.log('👥 Exporting contractors to Excel...');
        this.showSuccess('ייצוא קבלנים בפיתוח');
    }

    /**
     * Export users to Excel
     */
    exportUsers() {
        console.log('👤 Exporting users to Excel...');
        this.showSuccess('ייצוא משתמשים בפיתוח');
    }

    /**
     * Export SMS history
     */
    exportSMSHistory() {
        console.log('📱 Exporting SMS history...');
        this.showSuccess('ייצוא היסטוריית SMS בפיתוח');
    }

    /**
     * Export settings
     */
    exportSettings() {
        console.log('⚙️ Exporting settings...');
        this.showSuccess('ייצוא הגדרות בפיתוח');
    }

    // ===== PLACEHOLDER FUNCTIONS =====

    /**
     * View quote details
     */
    viewQuoteDetails(quoteId) {
        console.log(`👁️ Viewing quote details: ${quoteId}`);
        this.showSuccess('צפייה בפרטי בקשה בפיתוח');
    }

    /**
     * View contractor details
     */
    viewContractorDetails(contractorId) {
        console.log(`👁️ Viewing contractor details: ${contractorId}`);
        this.showSuccess('צפייה בפרטי קבלן בפיתוח');
    }

    /**
     * Toggle user status
     */
    async toggleUserStatus(userId) {
        console.log(`🔄 Toggling user status: ${userId}`);
        this.showSuccess('שינוי סטטוס משתמש בפיתוח');
    }

    /**
     * Show user edit modal
     */
    async showUserEditModal(userId) {
        console.log(`✏️ Editing user: ${userId}`);
        this.showSuccess('עריכת משתמש בפיתוח');
    }

    /**
     * Load SMS templates
     */
    async loadSMSTemplates() {
        console.log('📄 Loading SMS templates...');
        // Implementation will be added
    }

    /**
     * Load SMS settings
     */
    async loadSMSSettings() {
        console.log('⚙️ Loading SMS settings...');
        // Implementation will be added
    }

    /**
     * Show send SMS modal
     */
    showSendSMSModal() {
        console.log('📤 Showing send SMS modal...');
        this.showSuccess('שליחת SMS בפיתוח');
    }

    /**
     * Show SMS template modal
     */
    showSMSTemplateModal(templateId) {
        console.log(`📝 Editing SMS template: ${templateId}`);
        this.showSuccess('עריכת תבנית SMS בפיתוח');
    }

    /**
     * Save SMS settings
     */
    saveSMSSettings() {
        console.log('💾 Saving SMS settings...');
        this.showSuccess('שמירת הגדרות SMS בפיתוח');
    }

    /**
     * Save all settings
     */
    saveAllSettings() {
        console.log('💾 Saving all settings...');
        this.showSuccess('שמירת כל ההגדרות בפיתוח');
    }

    /**
     * Populate settings form
     */
    populateSettingsForm() {
        console.log('📝 Populating settings form...');
        // Implementation will be added
    }

    /**
     * Create database backup
     */
    createDatabaseBackup() {
        console.log('💾 Creating database backup...');
        this.showSuccess('יצירת גיבוי מסד נתונים בפיתוח');
    }

    /**
     * Load recent activity
     */
    async loadRecentActivity() {
        console.log('📋 Loading recent activity...');
        const activityList = document.getElementById('recentActivity');
        if (activityList) {
            activityList.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--gray-500);">
                    <i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    פעילות אחרונה בפיתוח
                </div>
            `;
        }
    }

    /**
     * Initialize charts
     */
    initializeCharts() {
        console.log('📊 Initializing charts...');
        // Chart.js implementation will be added
    }

    /**
     * Populate quote filters
     */
    populateQuoteFilters() {
        // This function can be used to populate dynamic filter options
        console.log('🔍 Populating quote filters...');
    }

    /**
     * Populate contractor filters
     */
    populateContractorFilters() {
        // Populate cities dropdown
        const cityFilter = document.getElementById('contractorCityFilter');
        if (cityFilter && this.allContractors) {
            const cities = [...new Set(this.allContractors.map(c => c.city).filter(Boolean))];

            // Clear existing options except first
            while (cityFilter.children.length > 1) {
                cityFilter.removeChild(cityFilter.lastChild);
            }

            // Add city options
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                cityFilter.appendChild(option);
            });
        }
    }
}

// Global functions for backward compatibility and HTML onclick handlers
let adminPanel;

/**
 * Initialize admin panel
 */
function initializeAdminPanel() {
    adminPanel = new ModernAdminPanel();
}

/**
 * Show specific tab
 */
function showTab(tabName) {
    if (adminPanel) {
        adminPanel.showTab(tabName);
    }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    if (adminPanel) {
        adminPanel.setupMobileMenu();
    }
}

/**
 * Refresh all data
 */
async function refreshAllData() {
    if (adminPanel) {
        await adminPanel.loadInitialData();
        await adminPanel.loadTabData(adminPanel.currentTab);
    }
}

/**
 * Refresh dashboard
 */
async function refreshDashboard() {
    if (adminPanel) {
        await adminPanel.loadDashboardData();
    }
}

/**
 * Show notifications
 */
function showNotifications() {
    console.log('📢 Showing notifications...');
    // Implementation will be added
}

/**
 * Export dashboard report
 */
function exportDashboardReport() {
    console.log('📊 Exporting dashboard report...');
    // Implementation will be added
}

/**
 * Load recent activity
 */
function loadRecentActivity() {
    console.log('📋 Loading recent activity...');
    // Implementation will be added
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.password-toggle i');
    
    if (passwordInput && toggleBtn) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleBtn.className = 'fas fa-eye';
        }
    }
}

/**
 * Logout function
 */
async function logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        try {
            const response = await fetch('/api/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });
            
            // Redirect to login regardless of response
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            window.location.reload();
        }
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
