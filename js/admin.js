/**
 * Admin Panel JavaScript
 * Handles dashboard, quotes management, contractors, SMS, settings
 */

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.charts = {};
        this.data = {
            quotes: [],
            contractors: [],
            smsLogs: [],
            stats: {},
            settings: {}
        };
        
        this.init();
    }
    
    async init() {
        console.log('Initializing admin panel with real database connection...');

        // For development - skip auth check temporarily
        // TODO: Re-enable authentication in production
        // if (!this.checkAuth()) {
        //     window.location.href = '/admin/login.html';
        //     return;
        // }

        this.bindEvents();

        // Load real data from database
        await this.loadInitialData();

        this.initCharts();
        this.startAutoRefresh();

        console.log('Admin panel initialized successfully with real data');
    }

    /**
     * Check authentication status
     */
    async checkAuth() {
        try {
            const response = await fetch('/api/admin.php?action=check_auth');
            const result = await response.json();

            if (result.success && result.authenticated) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    }

    /**
     * Show change password modal
     */
    showChangePasswordModal() {
        this.createChangePasswordModal();

        // Clear form after modal is created
        setTimeout(() => {
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        }, 100);
    }

    /**
     * Create change password modal
     */
    createChangePasswordModal() {
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
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeChangePasswordModal()">
                        <i class="fas fa-times"></i>
                        ביטול
                    </button>
                </div>
            </form>
        `;

        this.showModal('changePasswordModal', 'שינוי סיסמה', formContent, 'password-modal');
    }

    /**
     * Close change password modal
     */
    closeChangePasswordModal() {
        this.closeModal('changePasswordModal');
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
            alert('הסיסמאות החדשות אינן תואמות');
            return;
        }

        if (newPassword.length < 6) {
            alert('הסיסמה חייבת להכיל לפחות 6 תווים');
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
                alert('הסיסמה שונתה בהצלחה');
                this.closeChangePasswordModal();
            } else {
                alert('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('שגיאה בשינוי הסיסמה');
        }
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
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
            }
        });

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

    // ===== CONTRACTOR MODAL FUNCTIONS =====

    /**
     * Show contractor edit modal
     */
    async showContractorEditModal(contractorId) {
        const modalId = 'contractorEditModal';
        const title = contractorId ? 'עריכת קבלן' : 'הוספת קבלן חדש';

        // Create modal with loading state
        this.showModal(modalId, title, '', 'contractor-modal');
        this.showModalLoading(modalId);

        try {
            let contractor = {};

            if (contractorId) {
                // Load contractor data
                const response = await fetch(`/api/contractors.php?action=get_contractor&id=${contractorId}`);
                const result = await response.json();

                if (!result.success) {
                    this.showModalError(modalId, result.message || 'שגיאה בטעינת נתוני הקבלן');
                    return;
                }

                contractor = result.contractor;
            }

            // Create form content
            const formContent = this.createContractorForm(contractor, contractorId);

            // Update modal content
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
        return `
            <form id="contractorForm" class="modal-form" onsubmit="adminPanel.saveContractor(event, ${contractorId})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="contractorTitle">שם הקבלן *</label>
                        <input type="text" id="contractorTitle" name="title" value="${contractor.title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="contractorPhone">טלפון *</label>
                        <input type="tel" id="contractorPhone" name="phone" value="${contractor.phone || ''}" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="contractorEmail">אימייל</label>
                        <input type="email" id="contractorEmail" name="email" value="${contractor.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="contractorCity">עיר</label>
                        <input type="text" id="contractorCity" name="city" value="${contractor.city || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="contractorCategories">קטגוריות</label>
                        <select id="contractorCategories" name="categories" multiple>
                            <option value="pool_construction">בניית בריכות</option>
                            <option value="pool_maintenance">תחזוקת בריכות</option>
                            <option value="pool_equipment">ציוד בריכות</option>
                            <option value="pool_design">עיצוב בריכות</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contractorRating">דירוג</label>
                        <select id="contractorRating" name="rating">
                            <option value="1">1 כוכב</option>
                            <option value="2">2 כוכבים</option>
                            <option value="3">3 כוכבים</option>
                            <option value="4">4 כוכבים</option>
                            <option value="5" selected>5 כוכבים</option>
                        </select>
                    </div>
                </div>

                <div class="form-group full-width">
                    <label for="contractorDescription">תיאור</label>
                    <textarea id="contractorDescription" name="description" rows="4">${contractor.description || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="contractorLatitude">קו רוחב</label>
                        <input type="number" id="contractorLatitude" name="latitude" step="0.000001" value="${contractor.latitude || ''}">
                    </div>
                    <div class="form-group">
                        <label for="contractorLongitude">קו אורך</label>
                        <input type="number" id="contractorLongitude" name="longitude" step="0.000001" value="${contractor.longitude || ''}">
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
     * Save contractor (create or update)
     */
    async saveContractor(event, contractorId = null) {
        event.preventDefault();

        const form = document.getElementById('contractorForm');
        const formData = new FormData(form);

        // Convert FormData to object
        const contractorData = {};
        for (let [key, value] of formData.entries()) {
            contractorData[key] = value;
        }

        // Handle categories (multiple select)
        const categoriesSelect = document.getElementById('contractorCategories');
        contractorData.categories = Array.from(categoriesSelect.selectedOptions).map(option => option.value);

        try {
            const action = contractorId ? 'update_contractor' : 'create_contractor';
            const url = '/api/contractors.php';

            const requestData = {
                action: action,
                ...contractorData
            };

            if (contractorId) {
                requestData.id = contractorId;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                alert(contractorId ? 'הקבלן עודכן בהצלחה' : 'הקבלן נוסף בהצלחה');
                this.closeModal('contractorEditModal');
                this.loadContractors(); // Refresh contractors list
            } else {
                alert('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving contractor:', error);
            alert('שגיאה בשמירת הקבלן');
        }
    }

    // ===== QUOTE REQUEST MODAL FUNCTIONS =====

    /**
     * Show quote request edit modal
     */
    async showQuoteEditModal(quoteId) {
        const modalId = 'quoteEditModal';
        const title = 'עריכת בקשת הצעת מחיר';

        // Create modal with loading state
        this.showModal(modalId, title, '', 'quote-modal');
        this.showModalLoading(modalId);

        try {
            // Load quote data
            const response = await fetch(`/api/admin.php?action=get_quote&id=${quoteId}`);
            const result = await response.json();

            if (!result.success) {
                this.showModalError(modalId, result.message || 'שגיאה בטעינת נתוני הבקשה');
                return;
            }

            const quote = result.quote;

            // Create form content
            const formContent = this.createQuoteForm(quote, quoteId);

            // Update modal content
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
                        <input type="text" id="quoteCustomerName" name="customer_name" value="${quote.customer_name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="quoteCustomerPhone">טלפון לקוח *</label>
                        <input type="tel" id="quoteCustomerPhone" name="customer_phone" value="${quote.customer_phone || ''}" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="quoteCustomerEmail">אימייל לקוח</label>
                        <input type="email" id="quoteCustomerEmail" name="customer_email" value="${quote.customer_email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="quoteCustomerCity">עיר לקוח</label>
                        <input type="text" id="quoteCustomerCity" name="customer_city" value="${quote.customer_city || ''}">
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
                    <input type="text" id="quoteProjectLocation" name="project_location" value="${quote.project_location || ''}">
                </div>

                <div class="form-group full-width">
                    <label for="quoteDescription">תיאור הפרויקט</label>
                    <textarea id="quoteDescription" name="description" rows="4">${quote.description || ''}</textarea>
                </div>

                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        עדכן בקשה
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
     * Save quote request
     */
    async saveQuote(event, quoteId) {
        event.preventDefault();

        const form = document.getElementById('quoteForm');
        const formData = new FormData(form);

        // Convert FormData to object
        const quoteData = {};
        for (let [key, value] of formData.entries()) {
            quoteData[key] = value;
        }

        try {
            const response = await fetch('/api/admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_quote',
                    id: quoteId,
                    ...quoteData
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('הבקשה עודכנה בהצלחה');
                this.closeModal('quoteEditModal');
                this.loadQuotes(); // Refresh quotes list
            } else {
                alert('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving quote:', error);
            alert('שגיאה בשמירת הבקשה');
        }
    }

    // ===== USER MODAL FUNCTIONS =====

    /**
     * Show user edit modal
     */
    async showUserEditModal(userId) {
        const modalId = 'userEditModal';
        const title = userId ? 'עריכת משתמש' : 'הוספת משתמש חדש';

        // Create modal with loading state
        this.showModal(modalId, title, '', 'user-modal');
        this.showModalLoading(modalId);

        try {
            let user = {};

            if (userId) {
                // Load user data
                const response = await fetch(`/api/users_fixed.php?action=get_user&id=${userId}`);
                const result = await response.json();

                if (!result.success) {
                    this.showModalError(modalId, result.message || 'שגיאה בטעינת נתוני המשתמש');
                    return;
                }

                user = result.user;
            }

            // Create form content
            const formContent = this.createUserForm(user, userId);

            // Update modal content
            const modalBody = document.querySelector(`#${modalId} .modal-body`);
            modalBody.innerHTML = formContent;

        } catch (error) {
            console.error('Error loading user:', error);
            this.showModalError(modalId, 'שגיאה בטעינת נתוני המשתמש');
        }
    }

    /**
     * Create user form HTML
     */
    createUserForm(user = {}, userId = null) {
        return `
            <form id="userForm" class="modal-form" onsubmit="adminPanel.saveUser(event, ${userId})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="userUsername">שם משתמש *</label>
                        <input type="text" id="userUsername" name="username" value="${user.username || ''}" required ${userId ? 'readonly' : ''}>
                    </div>
                    <div class="form-group">
                        <label for="userEmail">אימייל *</label>
                        <input type="email" id="userEmail" name="email" value="${user.email || ''}" required>
                    </div>
                </div>

                ${!userId ? `
                <div class="form-row">
                    <div class="form-group">
                        <label for="userPassword">סיסמה *</label>
                        <input type="password" id="userPassword" name="password" required>
                    </div>
                    <div class="form-group">
                        <label for="userPasswordConfirm">אישור סיסמה *</label>
                        <input type="password" id="userPasswordConfirm" name="password_confirm" required>
                    </div>
                </div>
                ` : ''}

                <div class="form-row">
                    <div class="form-group">
                        <label for="userRole">תפקיד</label>
                        <select id="userRole" name="role">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>משתמש רגיל</option>
                            <option value="contractor" ${user.role === 'contractor' ? 'selected' : ''}>קבלן</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>מנהל</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="userStatus">סטטוס</label>
                        <select id="userStatus" name="status">
                            <option value="active" ${user.status === 'active' ? 'selected' : ''}>פעיל</option>
                            <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>לא פעיל</option>
                            <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>חסום</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="userPhone">טלפון</label>
                        <input type="tel" id="userPhone" name="phone" value="${user.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label for="userCity">עיר</label>
                        <input type="text" id="userCity" name="city" value="${user.city || ''}">
                    </div>
                </div>

                <div class="form-group full-width">
                    <label for="userNotes">הערות</label>
                    <textarea id="userNotes" name="notes" rows="3">${user.notes || ''}</textarea>
                </div>

                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        ${userId ? 'עדכן משתמש' : 'הוסף משתמש'}
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal('userEditModal')">
                        <i class="fas fa-times"></i>
                        ביטול
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Save user (create or update)
     */
    async saveUser(event, userId = null) {
        event.preventDefault();

        const form = document.getElementById('userForm');
        const formData = new FormData(form);

        // Convert FormData to object
        const userData = {};
        for (let [key, value] of formData.entries()) {
            userData[key] = value;
        }

        // Validate passwords for new users
        if (!userId && userData.password !== userData.password_confirm) {
            alert('הסיסמאות אינן תואמות');
            return;
        }

        try {
            const action = userId ? 'update_user' : 'create_user';

            const requestData = {
                action: action,
                ...userData
            };

            if (userId) {
                requestData.id = userId;
                delete requestData.password_confirm; // Remove confirm password for updates
            }

            const response = await fetch('/api/users_fixed.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                alert(userId ? 'המשתמש עודכן בהצלחה' : 'המשתמש נוסף בהצלחה');
                this.closeModal('userEditModal');
                this.loadUsers(); // Refresh users list
            } else {
                alert('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('שגיאה בשמירת המשתמש');
        }
    }

    // ===== UPDATED EXISTING FUNCTIONS TO USE MODALS =====

    /**
     * Edit contractor - Updated to use modal
     */
    editContractor(contractorId) {
        this.showContractorEditModal(contractorId);
    }

    /**
     * Add contractor - Updated to use modal
     */
    addContractor() {
        this.showContractorEditModal(null);
    }

    /**
     * Edit quote - Updated to use modal
     */
    editQuote(quoteId) {
        this.showQuoteEditModal(quoteId);
    }

    /**
     * Edit user - Updated to use modal
     */
    editUser(userId) {
        this.showUserEditModal(userId);
    }

    /**
     * Create user - Updated to use modal
     */
    createUser() {
        this.showUserEditModal(null);
    }

    /**
     * Load contractors and render them
     */
    async loadContractors() {
        try {
            const response = await fetch('/api/contractors.php?action=get_contractors');
            const result = await response.json();

            if (result.success) {
                this.renderContractors(result.contractors);
            } else {
                console.error('Error loading contractors:', result.message);
            }
        } catch (error) {
            console.error('Error loading contractors:', error);
        }
    }

    /**
     * Render contractors grid
     */
    renderContractors(contractors) {
        const grid = document.getElementById('contractorsGrid');
        if (!grid) return;

        grid.innerHTML = contractors.map(contractor => `
            <div class="contractor-card" data-id="${contractor.id}">
                <div class="contractor-header">
                    <h3>${contractor.title}</h3>
                    <div class="contractor-rating">
                        ${'★'.repeat(contractor.rating || 5)}
                    </div>
                </div>
                <div class="contractor-info">
                    <p><i class="fas fa-phone"></i> ${contractor.phone}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${contractor.city || 'לא צוין'}</p>
                    <p><i class="fas fa-envelope"></i> ${contractor.email || 'לא צוין'}</p>
                </div>
                <div class="contractor-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editContractor(${contractor.id})">
                        <i class="fas fa-edit"></i> עריכה
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteContractor(${contractor.id})">
                        <i class="fas fa-trash"></i> מחיקה
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load quotes and render them
     */
    async loadQuotes() {
        try {
            const response = await fetch('/api/admin.php?action=get_quotes');
            const result = await response.json();

            if (result.success) {
                this.renderQuotes(result.quotes);
            } else {
                console.error('Error loading quotes:', result.message);
            }
        } catch (error) {
            console.error('Error loading quotes:', error);
        }
    }

    /**
     * Render quotes table
     */
    renderQuotes(quotes) {
        const tbody = document.getElementById('quotesTableBody');
        if (!tbody) return;

        tbody.innerHTML = quotes.map(quote => `
            <tr data-id="${quote.id}">
                <td>${quote.request_number || quote.id}</td>
                <td>${quote.customer_name}</td>
                <td>${quote.customer_phone}</td>
                <td>${quote.pool_type}</td>
                <td>${quote.project_location || quote.customer_city}</td>
                <td>${quote.budget_range || 'לא צוין'}</td>
                <td><span class="status-badge status-${quote.status}">${this.getStatusText(quote.status)}</span></td>
                <td>${new Date(quote.created_at).toLocaleDateString('he-IL')}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editQuote(${quote.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteQuote(${quote.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Load users and render them
     */
    async loadUsers() {
        try {
            const response = await fetch('/api/users_fixed.php?action=get_users');
            const result = await response.json();

            if (result.success) {
                this.renderUsers(result.users);
            } else {
                console.error('Error loading users:', result.message);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    /**
     * Render users table
     */
    renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr data-id="${user.id}">
                <td>${user.username}</td>
                <td>${user.phone || 'לא צוין'}</td>
                <td>${this.getRoleText(user.role)}</td>
                <td>${user.email_verified ? 'מאומת' : 'לא מאומת'}</td>
                <td>${new Date(user.created_at).toLocaleDateString('he-IL')}</td>
                <td>${user.last_login ? new Date(user.last_login).toLocaleDateString('he-IL') : 'אף פעם'}</td>
                <td><span class="status-badge status-${user.status}">${this.getStatusText(user.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // ===== HELPER FUNCTIONS =====

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
            'banned': 'חסום'
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
                alert('הקבלן נמחק בהצלחה');
                this.loadContractors();
            } else {
                alert('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting contractor:', error);
            alert('שגיאה במחיקת הקבלן');
        }
    }

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
                alert('הבקשה נמחקה בהצלחה');
                this.loadQuotes();
            } else {
                alert('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting quote:', error);
            alert('שגיאה במחיקת הבקשה');
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
                alert('המשתמש נמחק בהצלחה');
                this.loadUsers();
            } else {
                alert('שגיאה: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('שגיאה במחיקת המשתמש');
        }
    }
    
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Search and filters
        document.getElementById('quotesSearch')?.addEventListener('input', (e) => {
            this.filterQuotes(e.target.value);
        });
        
        document.getElementById('quotesFilter')?.addEventListener('change', (e) => {
            this.filterQuotesByStatus(e.target.value);
        });
        
        document.getElementById('logFilter')?.addEventListener('change', (e) => {
            this.filterLogs(e.target.value);
        });
        
        // Chart period change
        document.getElementById('chartPeriod')?.addEventListener('change', (e) => {
            this.updateChartsData(e.target.value);
        });
        
        // Settings auto-save
        document.querySelectorAll('.settings-card input').forEach(input => {
            input.addEventListener('change', () => {
                this.autoSaveSettings();
            });
        });
    }
    
    /**
     * Load initial data
     */
    async loadInitialData() {
        this.showLoading();
        
        try {
            await Promise.all([
                this.loadDashboardStats(),
                this.loadQuotes(),
                this.loadContractors(),
                this.loadSMSLogs(),
                this.loadSettings(),
                this.checkSMSBalance()
            ]);
            
            this.hideLoading();
            this.updateUI();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('שגיאה בטעינת נתונים');
            this.hideLoading();
        }
    }
    
    /**
     * Load dashboard statistics
     */
    async loadDashboardStats() {
        try {
            const response = await fetch('/api/admin.php?action=get_stats');
            const result = await response.json();
            
            if (result.success) {
                this.data.stats = result.stats;
                this.updateDashboardStats();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    /**
     * Load quotes data
     */
    async loadQuotes() {
        try {
            const response = await fetch('/api/admin.php?action=get_quotes');
            const result = await response.json();
            
            if (result.success) {
                this.data.quotes = result.quotes;
                this.updateQuotesTable();
                this.updateQuotesCount();
            }
        } catch (error) {
            console.error('Error loading quotes:', error);
        }
    }
    
    /**
     * Load contractors data
     */
    async loadContractors(filters = {}) {
        try {
            const params = new URLSearchParams();
            params.append('limit', '1000');

            // Add filters if provided
            if (filters.search) params.append('search', filters.search);
            if (filters.city) params.append('city', filters.city);
            if (filters.status) params.append('status', filters.status);
            if (filters.min_rating) params.append('min_rating', filters.min_rating);
            if (filters.category) params.append('category', filters.category);

            const response = await fetch(`/api/contractors.php?${params}`);
            const result = await response.json();

            if (result.success) {
                this.data.contractors = result.contractors;
                this.updateContractorsGrid();
                this.updateContractorsStats();

                // Update filters if they exist
                this.populateCityFilter();
            } else {
                console.error('Failed to load contractors:', result.message);
                this.showError('שגיאה בטעינת קבלנים: ' + (result.message || ''));
            }
        } catch (error) {
            console.error('Error loading contractors:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }
    
    /**
     * Load SMS logs
     */
    async loadSMSLogs() {
        try {
            // Get current filters
            const filters = this.getSMSFilters();
            const queryParams = new URLSearchParams(filters);

            // Load SMS logs
            const logsResponse = await fetch(`/api/sms_simple.php?action=get_logs&${queryParams}`);
            const logsResult = await logsResponse.json();

            if (logsResult.success) {
                this.data.smsLogs = logsResult.logs || [];
                this.data.smsPagination = logsResult.pagination;
                this.updateSMSTable();
            } else {
                console.error('Failed to load SMS logs:', logsResult.message);
                this.showError('שגיאה בטעינת לוגי SMS');
            }

            // Load SMS statistics
            const statsResponse = await fetch('/api/sms_simple.php?action=get_stats&period=30');
            const statsResult = await statsResponse.json();

            if (statsResult.success) {
                this.data.smsStats = statsResult;
                this.updateSMSStats();
                this.updateSMSCharts();
            } else {
                console.error('Failed to load SMS stats:', statsResult.message);
                // Set default stats to prevent errors
                this.data.smsStats = {
                    summary: {
                        total_sent: 0,
                        total_delivered: 0,
                        total_failed: 0,
                        total_cost: 0,
                        delivery_rate: 0,
                        customer_sms: 0,
                        contractor_sms: 0,
                        verification_sms: 0,
                        notification_sms: 0
                    },
                    today: {
                        today_sent: 0,
                        today_cost: 0
                    }
                };
                this.updateSMSStats();
            }

            // Load SMS balance
            const balanceResponse = await fetch('/api/sms_simple.php?action=get_balance');
            const balanceResult = await balanceResponse.json();

            if (balanceResult.success) {
                this.data.smsBalance = balanceResult.balance;
                this.updateSMSBalance();
            } else {
                console.error('Failed to load SMS balance:', balanceResult.message);
            }

        } catch (error) {
            console.error('Error loading SMS logs:', error);
            this.showError('שגיאה בחיבור לשרת SMS');
        }
    }
    
    /**
     * Load system settings
     */
    async loadSettings() {
        try {
            const response = await fetch('/api/settings.php?action=get_settings');
            const result = await response.json();

            if (result.success) {
                this.data.settings = result.settings;
                this.populateSettings();
                this.updateSettingsUI();
            } else {
                console.error('Failed to load settings:', result.message);
                this.showError('שגיאה בטעינת הגדרות');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }
    
    /**
     * Check SMS balance
     */
    async checkSMSBalance() {
        try {
            const response = await fetch('/api/admin.php?action=check_sms_balance');
            const result = await response.json();
            
            if (result.success) {
                this.updateSMSBalance(result.balance);
            }
        } catch (error) {
            console.error('Error checking SMS balance:', error);
        }
    }
    
    /**
     * Show specific section
     */
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).parentElement.classList.add('active');
        
        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');
        
        // Update page title
        const titles = {
            dashboard: 'דשבורד',
            quotes: 'בקשות הצעות מחיר',
            contractors: 'ניהול קבלנים',
            users: 'ניהול משתמשים',
            sms: 'ניהול SMS',
            settings: 'הגדרות מערכת',
            logs: 'לוגי מערכת'
        };
        document.getElementById('pageTitle').textContent = titles[sectionName];
        
        this.currentSection = sectionName;
        
        // Load section-specific data if needed
        this.loadSectionData(sectionName);
    }
    
    /**
     * Load section-specific data
     */
    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadRecentActivity();
                this.updateCharts();
                break;
            case 'quotes':
                await this.loadQuotes();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'contractors':
                await this.loadContractors();
                break;
            case 'sms':
                await this.loadSMSLogs();
                break;
            case 'settings':
                await this.loadSettings();
                break;
            case 'logs':
                await this.loadActivityLogs();
                break;
        }
    }
    
    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const stats = this.data.stats;
        
        document.getElementById('totalQuotes').textContent = stats.total_quotes || 0;
        document.getElementById('totalContractors').textContent = stats.total_contractors || 0;
        document.getElementById('totalSMS').textContent = stats.total_sms || 0;
        document.getElementById('conversionRate').textContent = `${stats.conversion_rate || 0}%`;
        
        document.getElementById('todayQuotes').textContent = stats.today_quotes || 0;
        
        // Update change indicators
        document.getElementById('quotesChange').textContent = `+${stats.quotes_change || 0}%`;
        document.getElementById('contractorsChange').textContent = `+${stats.contractors_change || 0}%`;
        document.getElementById('smsChange').textContent = `+${stats.sms_change || 0}%`;
        document.getElementById('conversionChange').textContent = `+${stats.conversion_change || 0}%`;
    }
    
    /**
     * Update quotes table
     */
    updateQuotesTable() {
        const tbody = document.getElementById('quotesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.data.quotes.forEach(quote => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${quote.request_number}</strong></td>
                <td>${quote.customer_name}</td>
                <td><a href="tel:${quote.customer_phone}">${this.formatPhone(quote.customer_phone)}</a></td>
                <td>${this.getPoolTypeText(quote.pool_type)}</td>
                <td>${quote.project_location}</td>
                <td>${this.getBudgetRangeText(quote.budget_range)}</td>
                <td><span class="status-badge status-${quote.status}">${this.getStatusText(quote.status)}</span></td>
                <td>${this.formatDate(quote.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.viewQuote(${quote.id})">
                        <i class="fas fa-eye"></i>
                        צפה
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminPanel.editQuote(${quote.id})">
                        <i class="fas fa-edit"></i>
                        ערוך
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        if (this.data.quotes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">אין בקשות להצגה</td></tr>';
        }
    }
    
    /**
     * Update contractors grid
     */
    updateContractorsGrid() {
        const grid = document.getElementById('contractorsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.data.contractors.forEach(contractor => {
            const card = document.createElement('div');
            card.className = 'contractor-card';
            card.innerHTML = `
                <div class="contractor-header">
                    <h3>${contractor.title}</h3>
                    <span class="contractor-status status-${contractor.status || 'active'}">${this.getContractorStatusText(contractor.status)}</span>
                </div>
                <div class="contractor-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${contractor.city || 'לא צוין'}</p>
                    <p><i class="fas fa-phone"></i> ${this.formatPhone(contractor.phone) || 'לא צוין'}</p>
                    <p><i class="fas fa-star"></i> ${contractor.rating || 0} (${contractor.reviews_count || 0} ביקורות)</p>
                    <p><i class="fas fa-tools"></i> ${this.getContractorCategories(contractor.categories)}</p>
                </div>
                <div class="contractor-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editContractor('${contractor.id}')">
                        <i class="fas fa-edit"></i> ערוך
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminPanel.viewContractorQuotes('${contractor.id}')">
                        <i class="fas fa-file-invoice"></i> בקשות
                    </button>
                    <button class="btn btn-sm btn-success" onclick="adminPanel.toggleContractorStatus('${contractor.id}')">
                        <i class="fas fa-toggle-${contractor.status === 'active' ? 'on' : 'off'}"></i>
                        ${contractor.status === 'active' ? 'השבת' : 'הפעל'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteContractor('${contractor.id}', '${contractor.title}')">
                        <i class="fas fa-trash"></i> מחק
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        if (this.data.contractors.length === 0) {
            grid.innerHTML = '<div class="empty-state">אין קבלנים להצגה</div>';
        }
    }

    /**
     * Update contractors statistics
     */
    updateContractorsStats() {
        const contractors = this.data.contractors;
        const activeContractors = contractors.filter(c => c.status === 'active').length;
        const totalContractors = contractors.length;
        const avgRating = contractors.length > 0 ?
            (contractors.reduce((sum, c) => sum + (parseFloat(c.rating) || 0), 0) / contractors.length).toFixed(1) : 0;

        // Update dashboard stats if elements exist
        const totalElement = document.getElementById('totalContractors');
        if (totalElement) totalElement.textContent = activeContractors;

        // Update contractors section stats
        const contractorsSection = document.getElementById('contractors');
        if (contractorsSection) {
            const statsHtml = `
                <div class="contractors-stats">
                    <div class="stat-item">
                        <span class="stat-value">${totalContractors}</span>
                        <span class="stat-label">סה"כ קבלנים</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${activeContractors}</span>
                        <span class="stat-label">פעילים</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${avgRating}</span>
                        <span class="stat-label">דירוג ממוצע</span>
                    </div>
                </div>
            `;

            let statsContainer = contractorsSection.querySelector('.contractors-stats-container');
            if (!statsContainer) {
                statsContainer = document.createElement('div');
                statsContainer.className = 'contractors-stats-container';
                contractorsSection.querySelector('.section-header').after(statsContainer);
            }
            statsContainer.innerHTML = statsHtml;
        }
    }
    
    /**
     * Update SMS table
     */
    updateSMSTable() {
        const tbody = document.getElementById('smsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!this.data.smsLogs || this.data.smsLogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">אין הודעות SMS להצגה</td></tr>';
            return;
        }

        this.data.smsLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDateTime(log.created_at)}</td>
                <td>${this.formatPhone(log.phone)}</td>
                <td>${this.getSMSRecipientTypeText(log.recipient_type)}</td>
                <td>${this.getSMSTypeText(log.type)}</td>
                <td><span class="status-badge ${log.status === 'sent' ? 'status-completed' : 'status-cancelled'}">${log.status === 'sent' ? 'נשלח' : 'נכשל'}</span></td>
                <td>${log.contractor_name || '-'}</td>
                <td>₪${(log.cost || 0.15).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.viewSMSDetails('${log.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    /**
     * Update SMS statistics
     */
    updateSMSStats() {
        const stats = this.data.smsStats;

        if (!stats) {
            console.log('No SMS stats available');
            return;
        }

        // Handle different response formats
        const summary = stats.summary || stats;
        const today = stats.today || {};

        if (!summary) {
            console.log('No SMS summary data available');
            return;
        }

        // Update main stats cards
        this.updateElement('todaySMSSent', today.today_sent || 0);
        this.updateElement('totalSMSSent', summary.total_sent || 0);
        this.updateElement('smsDeliveryRate', `${summary.delivery_rate || 0}%`);
        this.updateElement('totalSMSCost', `₪${(summary.total_cost || 0).toFixed(2)}`);

        // Update breakdown stats
        this.updateElement('customerSMS', summary.customer_sms || 0);
        this.updateElement('contractorSMS', summary.contractor_sms || 0);
        this.updateElement('verificationSMS', summary.verification_sms || 0);
        this.updateElement('notificationSMS', summary.notification_sms || 0);

        // Update dashboard SMS count
        this.updateElement('totalSMS', summary.total_sent || 0);
    }

    /**
     * Helper functions for formatting and display
     */
    formatPhone(phone) {
        if (!phone) return '';
        // Format Israeli phone numbers
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('972')) {
            return cleaned.replace(/^972/, '0').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        if (cleaned.startsWith('0')) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        return phone;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('he-IL');
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('he-IL');
    }

    formatTimeAgo(dateString) {
        if (!dateString) return '';
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'עכשיו';
        if (diffMins < 60) return `לפני ${diffMins} דקות`;
        if (diffHours < 24) return `לפני ${diffHours} שעות`;
        return `לפני ${diffDays} ימים`;
    }

    getQuoteStatusText(status) {
        const statuses = {
            'pending': 'ממתין',
            'assigned': 'הוקצה',
            'completed': 'הושלם',
            'cancelled': 'בוטל'
        };
        return statuses[status] || status;
    }

    getContractorStatusText(status) {
        const statuses = {
            'active': 'פעיל',
            'inactive': 'לא פעיל',
            'pending': 'ממתין לאישור'
        };
        return statuses[status] || 'פעיל';
    }

    /**
     * Additional helper functions
     */
    getContractorCategories(categories) {
        if (!categories) return 'לא צוין';
        if (typeof categories === 'string') {
            try {
                const parsed = JSON.parse(categories);
                return Array.isArray(parsed) ? parsed.join(', ') : categories;
            } catch {
                return categories;
            }
        }
        if (Array.isArray(categories)) {
            return categories.join(', ');
        }
        return 'לא צוין';
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    /**
     * Update SMS balance display
     */
    updateSMSBalance(balance) {
        document.getElementById('smsBalance').textContent = balance;
        document.getElementById('smsBalance2').textContent = balance;
        
        // Show warning if balance is low
        if (balance < 50) {
            this.showWarning('יתרת SMS נמוכה - מומלץ לטעון יתרה');
        }
    }
    
    /**
     * Update quotes count in sidebar
     */
    updateQuotesCount() {
        const pendingQuotes = this.data.quotes.filter(q => q.status === 'pending').length;
        document.getElementById('quotesCount').textContent = pendingQuotes;
    }
    
    /**
     * Initialize charts
     */
    initCharts() {
        this.initQuotesChart();
        this.initPoolTypesChart();
    }
    
    /**
     * Initialize quotes chart
     */
    initQuotesChart() {
        const ctx = document.getElementById('quotesChart');
        if (!ctx) return;
        
        this.charts.quotes = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'בקשות הצעת מחיר',
                    data: [],
                    borderColor: '#2E86AB',
                    backgroundColor: 'rgba(46, 134, 171, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Initialize pool types chart
     */
    initPoolTypesChart() {
        const ctx = document.getElementById('poolTypesChart');
        if (!ctx) return;
        
        this.charts.poolTypes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['בריכת בטון', 'פיברגלס', 'מתועשת', 'שיפוץ'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#2E86AB', '#F39C12', '#27AE60', '#E74C3C']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    /**
     * Update charts with new data
     */
    updateCharts() {
        this.updateQuotesChart();
        this.updatePoolTypesChart();
    }
    
    /**
     * Update quotes chart
     */
    updateQuotesChart() {
        if (!this.charts.quotes) return;
        
        // Generate last 7 days data
        const days = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            days.push(date.toLocaleDateString('he-IL', { weekday: 'short' }));
            
            const dayQuotes = this.data.quotes.filter(quote => 
                quote.created_at.startsWith(dateStr)
            ).length;
            
            data.push(dayQuotes);
        }
        
        this.charts.quotes.data.labels = days;
        this.charts.quotes.data.datasets[0].data = data;
        this.charts.quotes.update();
    }
    
    /**
     * Update pool types chart
     */
    updatePoolTypesChart() {
        if (!this.charts.poolTypes) return;
        
        const typeCounts = {
            concrete: 0,
            fiberglass: 0,
            modular: 0,
            renovation: 0
        };
        
        this.data.quotes.forEach(quote => {
            if (typeCounts.hasOwnProperty(quote.pool_type)) {
                typeCounts[quote.pool_type]++;
            }
        });
        
        this.charts.poolTypes.data.datasets[0].data = [
            typeCounts.concrete,
            typeCounts.fiberglass,
            typeCounts.modular,
            typeCounts.renovation
        ];
        
        this.charts.poolTypes.update();
    }
    
    /**
     * Load recent activity
     */
    async loadRecentActivity() {
        try {
            const response = await fetch('/api/admin.php?action=get_recent_activity');
            const result = await response.json();
            
            if (result.success) {
                this.updateRecentActivity(result.activities);
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }
    
    /**
     * Update recent activity display
     */
    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        container.innerHTML = '';
        
        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon ${activity.entity_type}">
                    <i class="${this.getActivityIcon(activity.entity_type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${this.getActivityTitle(activity)}</div>
                    <div class="activity-description">${this.getActivityDescription(activity)}</div>
                </div>
                <div class="activity-time">${this.formatTimeAgo(activity.created_at)}</div>
            `;
            container.appendChild(item);
        });
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="empty-state">אין פעילות אחרונה</div>';
        }
    }
    
    /**
     * Filter quotes by search term
     */
    filterQuotes(searchTerm) {
        const filteredQuotes = this.data.quotes.filter(quote => 
            quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.customer_phone.includes(searchTerm) ||
            quote.request_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.displayFilteredQuotes(filteredQuotes);
    }
    
    /**
     * Filter quotes by status
     */
    filterQuotesByStatus(status) {
        const filteredQuotes = status ? 
            this.data.quotes.filter(quote => quote.status === status) : 
            this.data.quotes;
        
        this.displayFilteredQuotes(filteredQuotes);
    }
    
    /**
     * Display filtered quotes
     */
    displayFilteredQuotes(quotes) {
        const originalQuotes = this.data.quotes;
        this.data.quotes = quotes;
        this.updateQuotesTable();
        this.data.quotes = originalQuotes;
    }
    
    /**
     * Auto-save settings
     */
    async autoSaveSettings() {
        const settings = this.collectSettings();

        try {
            const response = await fetch('/api/settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save_settings',
                    settings: settings
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('הגדרות נשמרו אוטומטית');
            } else {
                this.showError('שגיאה בשמירת הגדרות: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }
    
    /**
     * Update settings UI
     */
    updateSettingsUI() {
        const settings = this.data.settings;

        // Update general settings
        if (settings.general) {
            this.updateElement('maxContractors', settings.general.max_contractors_per_quote?.value || 3);
            this.updateElement('smsTimeout', settings.general.sms_verification_timeout?.value || 300);
            this.updateElement('quoteExpireDays', settings.general.quote_auto_expire_days?.value || 30);
        }

        // Update fee settings
        if (settings.fees) {
            this.updateElement('basicFee', settings.fees.quote_fee_per_lead?.value || 20);
            this.updateElement('premiumFee', settings.fees.quote_fee_premium?.value || 35);
            this.updateElement('commissionRate', settings.fees.commission_rate?.value || 5);
        }

        // Update SMS settings
        if (settings.sms) {
            this.updateElement('smsSender', settings.sms.sender_name?.value || 'PoolIsrael');
            this.updateElement('systemEmail', settings.sms.system_email?.value || 'admin@israel-pool.top');
        }

        // Update system settings
        if (settings.system) {
            this.updateElement('maxImages', settings.system.max_images_per_quote?.value || 5);
        }
    }

    /**
     * Collect settings from form
     */
    collectSettings() {
        return {
            general: {
                max_contractors_per_quote: document.getElementById('maxContractors')?.value || 3,
                sms_verification_timeout: document.getElementById('smsTimeout')?.value || 300,
                quote_auto_expire_days: document.getElementById('quoteExpireDays')?.value || 30
            },
            fees: {
                quote_fee_per_lead: document.getElementById('basicFee')?.value || 20,
                quote_fee_premium: document.getElementById('premiumFee')?.value || 35,
                commission_rate: document.getElementById('commissionRate')?.value || 5
            },
            sms: {
                sender_name: document.getElementById('smsSender')?.value || 'PoolIsrael',
                system_email: document.getElementById('systemEmail')?.value || 'admin@israel-pool.top'
            },
            system: {
                max_images_per_quote: document.getElementById('maxImages')?.value || 5
            }
        };
    }

    /**
     * Populate settings form
     */
    populateSettings() {
        // This function is called after settings are loaded
        // The actual population is done in updateSettingsUI()
        console.log('Settings loaded:', this.data.settings);
    }

    /**
     * Save settings manually
     */
    async saveSettings() {
        const settings = this.collectSettings();

        try {
            const response = await fetch('/api/settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save_settings',
                    settings: settings
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('הגדרות נשמרו בהצלחה');
                await this.loadSettings(); // Reload to get updated values
            } else {
                this.showError('שגיאה בשמירת הגדרות: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Reset settings to default
     */
    async resetSettings(category = '') {
        if (!confirm('האם אתה בטוח שברצונך לאפס את ההגדרות לברירת מחדל?')) {
            return;
        }

        try {
            const response = await fetch('/api/settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reset_settings',
                    category: category
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('הגדרות אופסו לברירת מחדל');
                await this.loadSettings(); // Reload to get updated values
            } else {
                this.showError('שגיאה באיפוס הגדרות: ' + result.message);
            }
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }
    

    
    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('collapsed');
    }
    
    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Refresh all data
     */
    async refreshData() {
        await this.loadInitialData();
        this.showSuccess('נתונים עודכנו');
    }
    
    /**
     * Utility functions
     */
    formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
        }
        return phone;
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('he-IL');
    }
    
    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('he-IL');
    }
    
    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'עכשיו';
        if (diffMins < 60) return `לפני ${diffMins} דקות`;
        if (diffHours < 24) return `לפני ${diffHours} שעות`;
        return `לפני ${diffDays} ימים`;
    }
    
    getPoolTypeText(type) {
        const types = {
            concrete: 'בריכת בטון',
            fiberglass: 'פיברגלס',
            modular: 'מתועשת',
            renovation: 'שיפוץ',
            maintenance: 'תחזוקה'
        };
        return types[type] || type;
    }
    
    getBudgetRangeText(range) {
        const ranges = {
            under_100k: 'עד 100K',
            '100k_200k': '100K-200K',
            '200k_300k': '200K-300K',
            '300k_500k': '300K-500K',
            over_500k: '500K+',
            unknown: 'לא יודע'
        };
        return ranges[range] || range;
    }
    
    getStatusText(status) {
        const statuses = {
            pending: 'ממתין',
            sent_to_contractors: 'נשלח לקבלנים',
            contractors_responded: 'קבלנים הגיבו',
            completed: 'הושלם',
            cancelled: 'בוטל'
        };
        return statuses[status] || status;
    }
    
    getSMSTypeText(type) {
        const types = {
            verification: 'אימות',
            quote_notification: 'הודעת בקשה',
            reminder: 'תזכורת',
            marketing: 'שיווק'
        };
        return types[type] || type;
    }
    
    getActivityIcon(entityType) {
        const icons = {
            quote_request: 'fas fa-file-invoice',
            contractor: 'fas fa-user',
            sms: 'fas fa-sms',
            system: 'fas fa-cog'
        };
        return icons[entityType] || 'fas fa-info';
    }
    
    getActivityTitle(activity) {
        const titles = {
            quote_created: 'בקשת הצעת מחיר חדשה',
            quote_sent: 'בקשה נשלחה לקבלנים',
            contractor_added: 'קבלן חדש נוסף',
            sms_sent: 'SMS נשלח',
            settings_updated: 'הגדרות עודכנו'
        };
        return titles[activity.action] || activity.action;
    }
    
    getActivityDescription(activity) {
        try {
            const details = JSON.parse(activity.details);
            return details.description || 'פעילות במערכת';
        } catch {
            return 'פעילות במערכת';
        }
    }
    
    showLoading() {
        // Implementation for loading state
        console.log('Loading...');
    }
    
    hideLoading() {
        // Implementation for hiding loading state
        console.log('Loading complete');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    updateUI() {
        // Update all UI components
        this.updateDashboardStats();
        this.updateQuotesTable();
        this.updateContractorsGrid();
        this.updateSMSTable();
        this.updateSMSStats();
        this.updateQuotesCount();
    }



    /**
     * Get SMS recipient type text
     */
    getSMSRecipientTypeText(type) {
        const types = {
            customer: 'לקוח',
            contractor: 'קבלן',
            admin: 'מנהל'
        };
        return types[type] || type;
    }

    /**
     * View SMS details
     */
    viewSMSDetails(smsId) {
        const sms = this.data.smsLogs.find(log => log.id == smsId);
        if (!sms) {
            this.showError('הודעת SMS לא נמצאה');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal sms-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>פרטי הודעת SMS</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="sms-details">
                        <div class="detail-row">
                            <label>תאריך שליחה:</label>
                            <span>${this.formatDateTime(sms.created_at)}</span>
                        </div>
                        <div class="detail-row">
                            <label>מספר טלפון:</label>
                            <span>${this.formatPhone(sms.phone)}</span>
                        </div>
                        <div class="detail-row">
                            <label>סוג נמען:</label>
                            <span>${this.getSMSRecipientTypeText(sms.recipient_type)}</span>
                        </div>
                        <div class="detail-row">
                            <label>סוג הודעה:</label>
                            <span>${this.getSMSTypeText(sms.type)}</span>
                        </div>
                        <div class="detail-row">
                            <label>סטטוס:</label>
                            <span class="status-badge ${sms.status === 'sent' ? 'status-completed' : 'status-cancelled'}">${sms.status === 'sent' ? 'נשלח' : 'נכשל'}</span>
                        </div>
                        ${sms.contractor_name ? `
                        <div class="detail-row">
                            <label>קבלן:</label>
                            <span>${sms.contractor_name}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <label>עלות:</label>
                            <span>₪${(sms.cost || 0.15).toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <label>תוכן ההודעה:</label>
                            <div class="sms-message-content">${sms.message || sms.verification_code ? `קוד אימות: ${sms.verification_code}` : 'לא זמין'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }



    // Real functionality methods
    async editContractor(contractorId) {
        try {
            // Load contractor data from API to ensure we have the latest data
            const response = await fetch(`/api/contractors.php?id=${contractorId}`);
            const result = await response.json();

            if (result.success && result.contractor) {
                this.showContractorEditModal(result.contractor);
            } else {
                // Fallback to local data if API fails
                const contractor = this.data.contractors?.find(c => c.id == contractorId);
                if (contractor) {
                    this.showContractorEditModal(contractor);
                } else {
                    this.showError('קבלן לא נמצא');
                }
            }
        } catch (error) {
            console.error('Error editing contractor:', error);
            // Fallback to local data
            const contractor = this.data.contractors?.find(c => c.id == contractorId);
            if (contractor) {
                this.showContractorEditModal(contractor);
            } else {
                this.showError('שגיאה בטעינת נתוני קבלן');
            }
        }
    }

    async viewContractorQuotes(contractorId) {
        try {
            const contractor = this.data.contractors.find(c => c.id == contractorId);
            if (!contractor) {
                this.showError('קבלן לא נמצא');
                return;
            }

            // Load contractor quotes from API
            const response = await fetch(`/api/contractors.php?action=get_contractor_quotes&contractor_id=${contractorId}`);
            const result = await response.json();

            if (result.success) {
                this.showContractorQuotesModal(contractor, result.quotes || []);
            } else {
                this.showError('שגיאה בטעינת בקשות הקבלן: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading contractor quotes:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    async toggleContractorStatus(contractorId) {
        try {
            const contractor = this.data.contractors.find(c => c.id == contractorId);
            if (!contractor) return;

            const newStatus = contractor.status === 'active' ? 'inactive' : 'active';

            const response = await fetch('/api/contractors.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_contractor',
                    id: contractorId,
                    status: newStatus,
                    title: contractor.title // Required field
                })
            });

            const result = await response.json();
            if (result.success) {
                contractor.status = newStatus;
                this.updateContractorsGrid();
                this.showSuccess(`סטטוס קבלן עודכן ל${newStatus === 'active' ? 'פעיל' : 'לא פעיל'}`);
            } else {
                this.showError('שגיאה בעדכון סטטוס קבלן: ' + result.message);
            }
        } catch (error) {
            console.error('Error toggling contractor status:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Delete contractor
     */
    async deleteContractor(contractorId, contractorName) {
        if (!confirm(`האם אתה בטוח שברצונך למחוק את הקבלן "${contractorName}"?\n\nפעולה זו אינה ניתנת לביטול!`)) {
            return;
        }

        try {
            const response = await fetch('/api/contractors.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: contractorId
                })
            });

            const result = await response.json();
            if (result.success) {
                // Remove from local data
                this.data.contractors = this.data.contractors.filter(c => c.id != contractorId);
                this.updateContractorsGrid();
                this.updateContractorsStats();
                this.showSuccess(`קבלן "${contractorName}" נמחק בהצלחה`);
            } else {
                this.showError('שגיאה במחיקת קבלן: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting contractor:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    async viewQuote(quoteId) {
        try {
            console.log('Loading quote details for ID:', quoteId);
            const response = await fetch(`/api/admin.php?action=get_quote_details&quote_id=${quoteId}`);
            const result = await response.json();

            console.log('Quote details response:', result);

            if (result.success) {
                this.showQuoteDetailsModal(result.quote);
            } else {
                this.showError('שגיאה בטעינת פרטי הבקשה: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading quote details:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Edit quote
     */
    async editQuote(quoteId) {
        try {
            console.log('Loading quote for editing:', quoteId);
            const response = await fetch(`/api/admin.php?action=get_quote_details&quote_id=${quoteId}`);
            const result = await response.json();

            if (result.success) {
                this.showEditQuoteModal(result.quote);
            } else {
                this.showError('שגיאה בטעינת פרטי הבקשה: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading quote for editing:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Show edit quote modal
     */
    showEditQuoteModal(quote) {
        const modal = document.createElement('div');
        modal.className = 'modal edit-quote-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>עריכת בקשת הצעת מחיר - QR-${String(quote.id).padStart(6, '0')}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editQuoteForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>שם לקוח:</label>
                                <input type="text" id="editCustomerName" value="${quote.customer_name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>טלפון לקוח:</label>
                                <input type="tel" id="editCustomerPhone" value="${quote.customer_phone || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>עיר לקוח:</label>
                                <input type="text" id="editCustomerCity" value="${quote.customer_city || ''}">
                            </div>
                            <div class="form-group">
                                <label>סוג בריכה:</label>
                                <select id="editPoolType">
                                    <option value="concrete" ${quote.pool_type === 'concrete' ? 'selected' : ''}>בריכת בטון</option>
                                    <option value="fiberglass" ${quote.pool_type === 'fiberglass' ? 'selected' : ''}>פיברגלס</option>
                                    <option value="modular" ${quote.pool_type === 'modular' ? 'selected' : ''}>מתועשת</option>
                                    <option value="renovation" ${quote.pool_type === 'renovation' ? 'selected' : ''}>שיפוץ</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>גודל בריכה:</label>
                                <select id="editPoolSize">
                                    <option value="small" ${quote.pool_size === 'small' ? 'selected' : ''}>קטנה</option>
                                    <option value="medium" ${quote.pool_size === 'medium' ? 'selected' : ''}>בינונית</option>
                                    <option value="large" ${quote.pool_size === 'large' ? 'selected' : ''}>גדולה</option>
                                    <option value="xl" ${quote.pool_size === 'xl' ? 'selected' : ''}>ענקית</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>תקציב:</label>
                                <input type="text" id="editBudgetRange" value="${quote.budget_range || ''}">
                            </div>
                            <div class="form-group">
                                <label>מיקום פרויקט:</label>
                                <input type="text" id="editProjectLocation" value="${quote.project_location || ''}">
                            </div>
                            <div class="form-group">
                                <label>סטטוס:</label>
                                <select id="editQuoteStatus">
                                    <option value="pending" ${quote.status === 'pending' ? 'selected' : ''}>ממתין</option>
                                    <option value="assigned" ${quote.status === 'assigned' ? 'selected' : ''}>הוקצה</option>
                                    <option value="completed" ${quote.status === 'completed' ? 'selected' : ''}>הושלם</option>
                                    <option value="cancelled" ${quote.status === 'cancelled' ? 'selected' : ''}>בוטל</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label>פרטים נוספים:</label>
                                <textarea id="editAdditionalDetails" rows="4">${quote.additional_details || ''}</textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="adminPanel.saveQuoteChanges(${quote.id})">
                        <i class="fas fa-save"></i>
                        שמור שינויים
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                        ביטול
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Save quote changes
     */
    async saveQuoteChanges(quoteId) {
        try {
            const formData = {
                quote_id: quoteId,
                customer_name: document.getElementById('editCustomerName').value,
                customer_phone: document.getElementById('editCustomerPhone').value,
                customer_city: document.getElementById('editCustomerCity').value,
                pool_type: document.getElementById('editPoolType').value,
                pool_size: document.getElementById('editPoolSize').value,
                budget_range: document.getElementById('editBudgetRange').value,
                project_location: document.getElementById('editProjectLocation').value,
                status: document.getElementById('editQuoteStatus').value,
                additional_details: document.getElementById('editAdditionalDetails').value
            };

            const response = await fetch('/api/admin.php?action=update_quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('בקשה עודכנה בהצלחה');

                // Refresh quotes list
                await this.loadQuotes();

                // Close modal
                document.querySelector('.edit-quote-modal').remove();
            } else {
                this.showError('שגיאה בעדכון הבקשה: ' + result.message);
            }

        } catch (error) {
            console.error('Error saving quote changes:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Show contractor edit modal
     */
    showContractorEditModal(contractor) {
        const modal = document.createElement('div');
        modal.className = 'modal contractor-edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>עריכת קבלן - ${contractor.title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editContractorForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>שם הקבלן: *</label>
                                <input type="text" id="editContractorTitle" value="${contractor.title || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>טלפון:</label>
                                <input type="tel" id="editContractorPhone" value="${contractor.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label>עיר:</label>
                                <input type="text" id="editContractorCity" value="${contractor.city || ''}">
                            </div>
                            <div class="form-group">
                                <label>דירוג:</label>
                                <input type="number" id="editContractorRating" min="0" max="5" step="0.1" value="${contractor.rating || 0}">
                            </div>
                            <div class="form-group">
                                <label>סטטוס:</label>
                                <select id="editContractorStatus">
                                    <option value="active" ${contractor.status === 'active' ? 'selected' : ''}>פעיל</option>
                                    <option value="inactive" ${contractor.status === 'inactive' ? 'selected' : ''}>לא פעיל</option>
                                    <option value="pending" ${contractor.status === 'pending' ? 'selected' : ''}>ממתין לאישור</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>אתר:</label>
                                <input type="url" id="editContractorWebsite" value="${contractor.website || ''}">
                            </div>
                            <div class="form-group full-width">
                                <label>תיאור:</label>
                                <textarea id="editContractorDescription" rows="3">${contractor.description || ''}</textarea>
                            </div>
                            <div class="form-group full-width">
                                <label>כתובת:</label>
                                <textarea id="editContractorAddress" rows="2">${contractor.address || ''}</textarea>
                            </div>
                            <div class="form-group full-width">
                                <label>קטגוריות (מופרדות בפסיק):</label>
                                <input type="text" id="editContractorCategories" value="${this.formatCategoriesForEdit(contractor.categories)}">
                                <small>לדוגמה: בניית בריכות, תחזוקה, שיפוצים</small>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="adminPanel.saveContractorChanges('${contractor.id}')">
                        <i class="fas fa-save"></i>
                        שמור שינויים
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                        ביטול
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Show contractor quotes modal
     */
    showContractorQuotesModal(contractor, quotes) {
        const modal = document.createElement('div');
        modal.className = 'modal contractor-quotes-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>בקשות הצעות מחיר - ${contractor.title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="contractor-quotes-summary">
                        <div class="summary-stats">
                            <div class="stat-item">
                                <span class="stat-value">${quotes.length}</span>
                                <span class="stat-label">סה"כ בקשות</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${quotes.filter(q => q.status === 'pending').length}</span>
                                <span class="stat-label">ממתינות</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${quotes.filter(q => q.status === 'completed').length}</span>
                                <span class="stat-label">הושלמו</span>
                            </div>
                        </div>
                    </div>

                    <div class="quotes-table-container">
                        <table class="quotes-table">
                            <thead>
                                <tr>
                                    <th>מספר בקשה</th>
                                    <th>לקוח</th>
                                    <th>סוג בריכה</th>
                                    <th>תאריך</th>
                                    <th>סטטוס</th>
                                    <th>תגובת קבלן</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${quotes.length > 0 ? quotes.map(quote => `
                                    <tr>
                                        <td>QR-${String(quote.id).padStart(6, '0')}</td>
                                        <td>${quote.customer_name || 'לא זמין'}</td>
                                        <td>${quote.pool_type || 'לא צוין'}</td>
                                        <td>${this.formatDate(quote.created_at)}</td>
                                        <td><span class="status-badge status-${quote.status}">${this.getQuoteStatusText(quote.status)}</span></td>
                                        <td>${quote.contractor_response || 'ללא תגובה'}</td>
                                        <td>
                                            <button class="btn btn-sm btn-primary" onclick="adminPanel.viewQuoteDetails('${quote.id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="7" class="empty-state">אין בקשות הצעות מחיר עבור קבלן זה</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Save contractor changes
     */
    async saveContractorChanges(contractorId) {
        try {
            const formData = {
                id: contractorId,
                title: document.getElementById('editContractorTitle').value,
                phone: document.getElementById('editContractorPhone').value,
                city: document.getElementById('editContractorCity').value,
                rating: parseFloat(document.getElementById('editContractorRating').value) || 0,
                status: document.getElementById('editContractorStatus').value,
                website: document.getElementById('editContractorWebsite').value,
                description: document.getElementById('editContractorDescription').value,
                address: document.getElementById('editContractorAddress').value,
                categories: document.getElementById('editContractorCategories').value
            };

            // Validate required fields
            if (!formData.title.trim()) {
                this.showError('שם הקבלן הוא שדה חובה');
                return;
            }

            const response = await fetch('/api/contractors.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_contractor',
                    ...formData
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('פרטי הקבלן עודכנו בהצלחה');

                // Update local data
                const contractorIndex = this.data.contractors.findIndex(c => c.id == contractorId);
                if (contractorIndex !== -1) {
                    this.data.contractors[contractorIndex] = { ...this.data.contractors[contractorIndex], ...formData };
                }

                // Refresh contractors grid
                this.updateContractorsGrid();

                // Close modal
                document.querySelector('.contractor-edit-modal').remove();

            } else {
                this.showError('שגיאה בעדכון פרטי הקבלן: ' + result.message);
            }

        } catch (error) {
            console.error('Error saving contractor changes:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Format categories for editing
     */
    formatCategoriesForEdit(categories) {
        if (!categories) return '';
        if (typeof categories === 'string') {
            try {
                const parsed = JSON.parse(categories);
                return Array.isArray(parsed) ? parsed.join(', ') : categories;
            } catch {
                return categories;
            }
        }
        if (Array.isArray(categories)) {
            return categories.join(', ');
        }
        return '';
    }

    /**
     * Get quote status text
     */
    getQuoteStatusText(status) {
        const statuses = {
            'pending': 'ממתין',
            'assigned': 'הוקצה',
            'in_progress': 'בתהליך',
            'completed': 'הושלם',
            'cancelled': 'בוטל'
        };
        return statuses[status] || status;
    }



    /**
     * Show quote details modal
     */
    showQuoteDetailsModal(quote) {
        const modal = document.createElement('div');
        modal.className = 'modal quote-details-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>פרטי בקשת הצעת מחיר - QR-${String(quote.id).padStart(6, '0')}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="quote-details-grid">
                        <div class="detail-section">
                            <h4>פרטי לקוח</h4>
                            <div class="detail-row">
                                <label>שם:</label>
                                <span>${quote.customer_name || 'לא זמין'}</span>
                            </div>
                            <div class="detail-row">
                                <label>טלפון:</label>
                                <span>${this.formatPhone(quote.customer_phone)}</span>
                            </div>
                            <div class="detail-row">
                                <label>עיר:</label>
                                <span>${quote.customer_city || 'לא צוין'}</span>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4>פרטי בריכה</h4>
                            <div class="detail-row">
                                <label>סוג בריכה:</label>
                                <span>${quote.pool_type || 'לא צוין'}</span>
                            </div>
                            <div class="detail-row">
                                <label>גודל בריכה:</label>
                                <span>${quote.pool_size || 'לא צוין'}</span>
                            </div>
                            <div class="detail-row">
                                <label>תקציב:</label>
                                <span>${quote.budget_range || 'לא צוין'}</span>
                            </div>
                            <div class="detail-row">
                                <label>מיקום פרויקט:</label>
                                <span>${quote.project_location || 'לא צוין'}</span>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4>סטטוס ותאריכים</h4>
                            <div class="detail-row">
                                <label>סטטוס:</label>
                                <span class="status-badge status-${quote.status}">${this.getQuoteStatusText(quote.status)}</span>
                            </div>
                            <div class="detail-row">
                                <label>תאריך יצירה:</label>
                                <span>${this.formatDateTime(quote.created_at)}</span>
                            </div>
                            <div class="detail-row">
                                <label>עדכון אחרון:</label>
                                <span>${this.formatDateTime(quote.updated_at)}</span>
                            </div>
                        </div>

                        ${quote.additional_details ? `
                        <div class="detail-section full-width">
                            <h4>פרטים נוספים</h4>
                            <div class="detail-content">
                                ${quote.additional_details}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="adminPanel.editQuote('${quote.id}')">
                        <i class="fas fa-edit"></i>
                        ערוך בקשה
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                        סגור
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Add new contractor
     */
    async addContractor() {
        const modal = document.createElement('div');
        modal.className = 'modal add-contractor-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>הוספת קבלן חדש</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="addContractorForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>שם הקבלן: *</label>
                                <input type="text" id="newContractorTitle" required>
                            </div>
                            <div class="form-group">
                                <label>טלפון:</label>
                                <input type="tel" id="newContractorPhone">
                            </div>
                            <div class="form-group">
                                <label>עיר:</label>
                                <input type="text" id="newContractorCity">
                            </div>
                            <div class="form-group">
                                <label>דירוג:</label>
                                <input type="number" id="newContractorRating" min="0" max="5" step="0.1" value="0">
                            </div>
                            <div class="form-group">
                                <label>אתר:</label>
                                <input type="url" id="newContractorWebsite">
                            </div>
                            <div class="form-group">
                                <label>סטטוס:</label>
                                <select id="newContractorStatus">
                                    <option value="active">פעיל</option>
                                    <option value="inactive">לא פעיל</option>
                                    <option value="pending" selected>ממתין לאישור</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label>תיאור:</label>
                                <textarea id="newContractorDescription" rows="3"></textarea>
                            </div>
                            <div class="form-group full-width">
                                <label>כתובת:</label>
                                <textarea id="newContractorAddress" rows="2"></textarea>
                            </div>
                            <div class="form-group full-width">
                                <label>קטגוריות (מופרדות בפסיק):</label>
                                <input type="text" id="newContractorCategories" placeholder="בניית בריכות, תחזוקה, שיפוצים">
                                <small>לדוגמה: בניית בריכות, תחזוקה, שיפוצים</small>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="adminPanel.saveNewContractor()">
                        <i class="fas fa-save"></i>
                        הוסף קבלן
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                        ביטול
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Save new contractor
     */
    async saveNewContractor() {
        try {
            const formData = {
                title: document.getElementById('newContractorTitle').value,
                phone: document.getElementById('newContractorPhone').value,
                city: document.getElementById('newContractorCity').value,
                rating: parseFloat(document.getElementById('newContractorRating').value) || 0,
                status: document.getElementById('newContractorStatus').value,
                website: document.getElementById('newContractorWebsite').value,
                description: document.getElementById('newContractorDescription').value,
                address: document.getElementById('newContractorAddress').value,
                categories: document.getElementById('newContractorCategories').value
            };

            // Validate required fields
            if (!formData.title.trim()) {
                this.showError('שם הקבלן הוא שדה חובה');
                return;
            }

            const response = await fetch('/api/contractors.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('קבלן נוסף בהצלחה');

                // Refresh contractors list
                await this.loadContractors();

                // Close modal
                document.querySelector('.add-contractor-modal').remove();

            } else {
                this.showError('שגיאה בהוספת קבלן: ' + result.message);
            }

        } catch (error) {
            console.error('Error adding contractor:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Export quotes to CSV
     */
    async exportQuotes() {
        try {
            const filters = this.getQuotesFilters();
            const queryParams = new URLSearchParams(filters);

            // Get all quotes for export
            const response = await fetch(`/api/admin.php?action=get_quotes&limit=10000&${queryParams}`);
            const result = await response.json();

            if (result.success && result.quotes) {
                this.downloadCSV(result.quotes, 'quotes_export.csv');
                this.showSuccess('קובץ ייצוא נוצר בהצלחה');
            } else {
                this.showError('שגיאה בייצוא נתונים');
            }

        } catch (error) {
            console.error('Error exporting quotes:', error);
            this.showError('שגיאה בייצוא נתונים');
        }
    }

    /**
     * Import contractors
     */
    async importContractors() {
        const modal = document.createElement('div');
        modal.className = 'modal import-contractors-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>ייבוא קבלנים</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="import-options">
                        <div class="import-option">
                            <h4><i class="fas fa-file-csv"></i> ייבוא מקובץ CSV</h4>
                            <p>העלה קובץ CSV עם פרטי קבלנים</p>
                            <input type="file" id="csvFileInput" accept=".csv" style="margin: 10px 0;">
                            <button class="btn btn-primary" onclick="adminPanel.uploadCSVFile()">
                                <i class="fas fa-upload"></i> העלה קובץ
                            </button>
                        </div>

                        <div class="import-option">
                            <h4><i class="fas fa-link"></i> ייבוא מקישור ישיר</h4>
                            <p>השתמש בקישור הייבוא הקיים</p>
                            <a href="/admin/import_contractors.php" target="_blank" class="btn btn-outline">
                                <i class="fas fa-external-link-alt"></i> פתח דף ייבוא
                            </a>
                        </div>

                        <div class="import-option">
                            <h4><i class="fas fa-download"></i> הורד תבנית</h4>
                            <p>הורד קובץ CSV לדוגמה</p>
                            <button class="btn btn-outline" onclick="adminPanel.downloadCSVTemplate()">
                                <i class="fas fa-download"></i> הורד תבנית
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Upload CSV file
     */
    async uploadCSVFile() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];

        if (!file) {
            this.showError('אנא בחר קובץ CSV');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('אנא בחר קובץ CSV תקין');
            return;
        }

        const formData = new FormData();
        formData.append('csv_file', file);

        try {
            const response = await fetch('/admin/import_contractors.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`ייבוא הושלם בהצלחה! יובאו ${result.imported} קבלנים`);

                // Refresh contractors list
                await this.loadContractors();

                // Close modal
                document.querySelector('.import-contractors-modal').remove();
            } else {
                this.showError('שגיאה בייבוא: ' + result.message);
            }

        } catch (error) {
            console.error('Error uploading CSV:', error);
            this.showError('שגיאה בהעלאת הקובץ');
        }
    }

    /**
     * Download CSV template
     */
    downloadCSVTemplate() {
        const csvContent = `title,description,city,address,phone,website,email,categories,rating,status
"קבלן בריכות דוגמה","תיאור הקבלן","תל אביב","רחוב הדוגמה 123","0501234567","https://example.com","info@example.com","בניית בריכות,תחזוקה","4.5","active"`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'contractors_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showSuccess('תבנית CSV הורדה בהצלחה');
    }

    /**
     * Export contractors to CSV
     */
    async exportContractors() {
        try {
            const response = await fetch('/api/contractors.php?limit=10000');
            const result = await response.json();

            if (result.success && result.contractors) {
                this.downloadContractorsCSV(result.contractors);
                this.showSuccess('קובץ ייצוא קבלנים נוצר בהצלחה');
            } else {
                this.showError('שגיאה בייצוא קבלנים');
            }

        } catch (error) {
            console.error('Error exporting contractors:', error);
            this.showError('שגיאה בייצוא קבלנים');
        }
    }

    /**
     * Download contractors as CSV
     */
    downloadContractorsCSV(contractors) {
        if (!contractors || contractors.length === 0) {
            this.showError('אין קבלנים לייצוא');
            return;
        }

        // CSV headers
        const headers = [
            'ID', 'שם', 'תיאור', 'עיר', 'כתובת', 'טלפון', 'אתר', 'אימייל',
            'קטגוריות', 'דירוג', 'מספר ביקורות', 'סטטוס', 'תאריך יצירה'
        ];

        // Create CSV content
        let csvContent = headers.join(',') + '\n';

        contractors.forEach(contractor => {
            const row = [
                contractor.id || '',
                `"${(contractor.title || '').replace(/"/g, '""')}"`,
                `"${(contractor.description || '').replace(/"/g, '""')}"`,
                `"${(contractor.city || '').replace(/"/g, '""')}"`,
                `"${(contractor.address || '').replace(/"/g, '""')}"`,
                contractor.phone || '',
                contractor.website || '',
                contractor.email || '',
                `"${this.formatCategoriesForExport(contractor.categories)}"`,
                contractor.rating || 0,
                contractor.reviews_count || 0,
                contractor.status || 'active',
                this.formatDate(contractor.created_at)
            ];
            csvContent += row.join(',') + '\n';
        });

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `contractors_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Format categories for export
     */
    formatCategoriesForExport(categories) {
        if (!categories) return '';
        if (typeof categories === 'string') {
            try {
                const parsed = JSON.parse(categories);
                return Array.isArray(parsed) ? parsed.join('; ') : categories;
            } catch {
                return categories;
            }
        }
        if (Array.isArray(categories)) {
            return categories.join('; ');
        }
        return '';
    }

    /**
     * Advanced contractor search and filtering
     */
    setupContractorFilters() {
        const filtersHTML = `
            <div class="contractors-filters">
                <div class="filter-row">
                    <div class="filter-group">
                        <label>חיפוש:</label>
                        <input type="text" id="contractorSearch" placeholder="חפש לפי שם, עיר או טלפון">
                    </div>
                    <div class="filter-group">
                        <label>עיר:</label>
                        <select id="contractorCityFilter">
                            <option value="">כל העיר</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>סטטוס:</label>
                        <select id="contractorStatusFilter">
                            <option value="">כל הסטטוסים</option>
                            <option value="active">פעיל</option>
                            <option value="inactive">לא פעיל</option>
                            <option value="pending">ממתין לאישור</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>דירוג מינימלי:</label>
                        <select id="contractorRatingFilter">
                            <option value="">כל הדירוגים</option>
                            <option value="4">4+ כוכבים</option>
                            <option value="3">3+ כוכבים</option>
                            <option value="2">2+ כוכבים</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <button class="btn btn-primary" onclick="adminPanel.applyContractorFilters()">
                            <i class="fas fa-search"></i> חפש
                        </button>
                        <button class="btn btn-outline" onclick="adminPanel.clearContractorFilters()">
                            <i class="fas fa-times"></i> נקה
                        </button>
                    </div>
                </div>
            </div>
        `;

        const contractorsSection = document.querySelector('.contractors-section');
        if (contractorsSection) {
            const existingFilters = contractorsSection.querySelector('.contractors-filters');
            if (existingFilters) {
                existingFilters.remove();
            }
            contractorsSection.insertAdjacentHTML('afterbegin', filtersHTML);

            // Populate city filter
            this.populateCityFilter();

            // Add event listeners
            document.getElementById('contractorSearch').addEventListener('input',
                this.debounce(() => this.applyContractorFilters(), 300));
        }
    }

    /**
     * Populate city filter with unique cities
     */
    populateCityFilter() {
        const cityFilter = document.getElementById('contractorCityFilter');
        if (!cityFilter || !this.data.contractors) return;

        const cities = [...new Set(this.data.contractors
            .map(c => c.city)
            .filter(city => city && city.trim())
            .sort())];

        // Clear existing options except first
        cityFilter.innerHTML = '<option value="">כל הערים</option>';

        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }

    /**
     * Apply contractor filters
     */
    async applyContractorFilters() {
        const search = document.getElementById('contractorSearch')?.value || '';
        const city = document.getElementById('contractorCityFilter')?.value || '';
        const status = document.getElementById('contractorStatusFilter')?.value || '';
        const minRating = document.getElementById('contractorRatingFilter')?.value || '';

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (city) params.append('city', city);
            if (status) params.append('status', status);
            if (minRating) params.append('min_rating', minRating);
            params.append('limit', '1000');

            const response = await fetch(`/api/contractors.php?${params}`);
            const result = await response.json();

            if (result.success) {
                this.data.contractors = result.contractors;
                this.updateContractorsGrid();
                this.updateContractorsStats();
            } else {
                this.showError('שגיאה בחיפוש קבלנים');
            }
        } catch (error) {
            console.error('Error filtering contractors:', error);
            this.showError('שגיאה בחיפוש קבלנים');
        }
    }

    /**
     * Clear contractor filters
     */
    async clearContractorFilters() {
        document.getElementById('contractorSearch').value = '';
        document.getElementById('contractorCityFilter').value = '';
        document.getElementById('contractorStatusFilter').value = '';
        document.getElementById('contractorRatingFilter').value = '';

        await this.loadContractors();
    }

    /**
     * Debounce function for search input
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

    /**
     * Bulk operations for contractors
     */
    async bulkUpdateContractors(action, contractorIds) {
        if (!contractorIds || contractorIds.length === 0) {
            this.showError('לא נבחרו קבלנים');
            return;
        }

        const actionText = {
            'activate': 'הפעלת',
            'deactivate': 'השבתת',
            'delete': 'מחיקת'
        };

        if (!confirm(`האם אתה בטוח שברצונך לבצע ${actionText[action]} של ${contractorIds.length} קבלנים?`)) {
            return;
        }

        try {
            const promises = contractorIds.map(id => {
                switch (action) {
                    case 'activate':
                    case 'deactivate':
                        return fetch('/api/contractors.php', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'update_contractor',
                                id: id,
                                status: action === 'activate' ? 'active' : 'inactive'
                            })
                        });
                    case 'delete':
                        return fetch('/api/contractors.php', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: id })
                        });
                }
            });

            const results = await Promise.all(promises);
            const successful = results.filter(r => r.ok).length;

            if (successful === contractorIds.length) {
                this.showSuccess(`${actionText[action]} ${successful} קבלנים הושלמה בהצלחה`);
                await this.loadContractors();
            } else {
                this.showWarning(`${actionText[action]} הושלמה חלקית: ${successful}/${contractorIds.length} קבלנים`);
                await this.loadContractors();
            }

        } catch (error) {
            console.error('Error in bulk operation:', error);
            this.showError('שגיאה בביצוע פעולה קבוצתית');
        }
    }

    /**
     * Show contractor selection modal for bulk operations
     */
    showBulkOperationsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal bulk-operations-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>פעולות קבוצתיות על קבלנים</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="bulk-actions">
                        <button class="btn btn-success" onclick="adminPanel.selectAllContractors()">
                            <i class="fas fa-check-square"></i> בחר הכל
                        </button>
                        <button class="btn btn-outline" onclick="adminPanel.clearContractorSelection()">
                            <i class="fas fa-square"></i> נקה בחירה
                        </button>
                        <button class="btn btn-primary" onclick="adminPanel.bulkActivateContractors()">
                            <i class="fas fa-toggle-on"></i> הפעל נבחרים
                        </button>
                        <button class="btn btn-warning" onclick="adminPanel.bulkDeactivateContractors()">
                            <i class="fas fa-toggle-off"></i> השבת נבחרים
                        </button>
                        <button class="btn btn-danger" onclick="adminPanel.bulkDeleteContractors()">
                            <i class="fas fa-trash"></i> מחק נבחרים
                        </button>
                    </div>

                    <div class="contractors-selection-grid" id="contractorsSelectionGrid">
                        ${this.renderContractorsForSelection()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Render contractors for selection
     */
    renderContractorsForSelection() {
        if (!this.data.contractors || this.data.contractors.length === 0) {
            return '<div class="empty-state">אין קבלנים להצגה</div>';
        }

        return this.data.contractors.map(contractor => `
            <div class="contractor-selection-item">
                <input type="checkbox" id="contractor_${contractor.id}" value="${contractor.id}">
                <label for="contractor_${contractor.id}">
                    <div class="contractor-info">
                        <h4>${contractor.title}</h4>
                        <p>${contractor.city || 'לא צוין'} • ${contractor.phone || 'ללא טלפון'}</p>
                        <span class="status-badge status-${contractor.status}">${this.getContractorStatusText(contractor.status)}</span>
                    </div>
                </label>
            </div>
        `).join('');
    }

    /**
     * Get contractor status text
     */
    getContractorStatusText(status) {
        const statuses = {
            'active': 'פעיל',
            'inactive': 'לא פעיל',
            'pending': 'ממתין לאישור'
        };
        return statuses[status] || status;
    }

    /**
     * Get selected contractor IDs
     */
    getSelectedContractorIds() {
        const checkboxes = document.querySelectorAll('#contractorsSelectionGrid input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    /**
     * Select all contractors
     */
    selectAllContractors() {
        const checkboxes = document.querySelectorAll('#contractorsSelectionGrid input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    }

    /**
     * Clear contractor selection
     */
    clearContractorSelection() {
        const checkboxes = document.querySelectorAll('#contractorsSelectionGrid input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }

    /**
     * Bulk activate contractors
     */
    async bulkActivateContractors() {
        const selectedIds = this.getSelectedContractorIds();
        await this.bulkUpdateContractors('activate', selectedIds);
        document.querySelector('.bulk-operations-modal').remove();
    }

    /**
     * Bulk deactivate contractors
     */
    async bulkDeactivateContractors() {
        const selectedIds = this.getSelectedContractorIds();
        await this.bulkUpdateContractors('deactivate', selectedIds);
        document.querySelector('.bulk-operations-modal').remove();
    }

    /**
     * Bulk delete contractors
     */
    async bulkDeleteContractors() {
        const selectedIds = this.getSelectedContractorIds();
        await this.bulkUpdateContractors('delete', selectedIds);
        document.querySelector('.bulk-operations-modal').remove();
    }

    /**
     * Send test SMS
     */
    async sendTestSMS() {
        const phone = prompt('הכנס מספר טלפון לשליחת SMS בדיקה (פורמט: 972XXXXXXXXX):');

        if (!phone) {
            return;
        }

        // Validate phone format
        if (!/^972[5-9]\d{8}$/.test(phone)) {
            this.showError('מספר טלפון לא תקין. השתמש בפורמט: 972XXXXXXXXX');
            return;
        }

        try {
            const response = await fetch('/api/sms_simple.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'send_test',
                    phone: phone,
                    message: 'זהו SMS בדיקה מהדשבורד של Pool Israel'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('SMS נשלח בהצלחה ל-' + phone);

                // Refresh SMS stats
                await this.loadSMSLogs();
            } else {
                this.showError('שגיאה בשליחת SMS: ' + result.message);
            }

        } catch (error) {
            console.error('Error sending test SMS:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }



    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // SMS Management Functions
    getSMSFilters() {
        const recipientType = document.getElementById('smsRecipientFilter')?.value || '';
        const messageType = document.getElementById('smsMessageFilter')?.value || '';
        const status = document.getElementById('smsStatusFilter')?.value || '';
        const dateFrom = document.getElementById('smsDateFrom')?.value || '';
        const dateTo = document.getElementById('smsDateTo')?.value || '';
        const page = this.currentSMSPage || 1;
        const limit = 50;

        return {
            recipient_type: recipientType,
            message_type: messageType,
            status: status,
            date_from: dateFrom,
            date_to: dateTo,
            page: page,
            limit: limit
        };
    }

    updateSMSTable() {
        const tableBody = document.getElementById('smsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!this.data.smsLogs || this.data.smsLogs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-state">אין הודעות SMS להצגה</td></tr>';
            return;
        }

        this.data.smsLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDateTime(log.created_at)}</td>
                <td>${this.formatPhone(log.recipient_phone)}</td>
                <td><span class="badge badge-${log.recipient_type}">${this.getRecipientTypeText(log.recipient_type)}</span></td>
                <td><span class="badge badge-${log.message_type}">${this.getMessageTypeText(log.message_type)}</span></td>
                <td><span class="status-badge status-${log.status}">${this.getSMSStatusText(log.status)}</span></td>
                <td>${log.contractor_name || '-'}</td>
                <td>₪${parseFloat(log.cost || 0).toFixed(3)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="adminPanel.viewSMSDetails('${log.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Update pagination
        this.updateSMSPagination();
    }

    updateSMSStats() {
        if (!this.data.smsStats) return;

        const summary = this.data.smsStats.summary;
        const today = this.data.smsStats.today;

        // Update summary cards
        this.updateStatCard('totalSMSSent', summary.total_sent || 0);
        this.updateStatCard('totalSMSDelivered', summary.total_delivered || 0);
        this.updateStatCard('totalSMSFailed', summary.total_failed || 0);
        this.updateStatCard('totalSMSCost', `₪${parseFloat(summary.total_cost || 0).toFixed(2)}`);
        this.updateStatCard('smsDeliveryRate', `${summary.delivery_rate || 0}%`);

        // Update today's stats
        this.updateStatCard('todaySMSSent', today.today_sent || 0);
        this.updateStatCard('todaySMSCost', `₪${parseFloat(today.today_cost || 0).toFixed(2)}`);

        // Update breakdown
        this.updateStatCard('customerSMS', summary.customer_sms || 0);
        this.updateStatCard('contractorSMS', summary.contractor_sms || 0);
        this.updateStatCard('verificationSMS', summary.verification_sms || 0);
        this.updateStatCard('notificationSMS', summary.notification_sms || 0);
    }

    updateSMSBalance() {
        const balanceElement = document.getElementById('smsBalance');
        if (balanceElement && this.data.smsBalance !== undefined) {
            balanceElement.textContent = `₪${parseFloat(this.data.smsBalance).toFixed(2)}`;

            // Add warning if balance is low
            if (this.data.smsBalance < 50) {
                balanceElement.classList.add('low-balance');
                this.showWarning('יתרת SMS נמוכה - מומלץ לטעון יתרה');
            }
        }
    }

    updateSMSCharts() {
        if (!this.data.smsStats || !this.data.smsStats.daily_stats) return;

        const dailyStats = this.data.smsStats.daily_stats;

        // Prepare chart data
        const dates = dailyStats.map(stat => stat.stat_date).reverse();
        const sentData = dailyStats.map(stat => stat.total_sent).reverse();
        const deliveredData = dailyStats.map(stat => stat.total_delivered).reverse();
        const failedData = dailyStats.map(stat => stat.total_failed).reverse();

        // Update SMS chart if exists
        const chartElement = document.getElementById('smsChart');
        if (chartElement) {
            this.renderSMSChart(chartElement, {
                dates: dates,
                sent: sentData,
                delivered: deliveredData,
                failed: failedData
            });
        }
    }

    updateSMSPagination() {
        const paginationContainer = document.getElementById('smsPagination');
        if (!paginationContainer || !this.data.smsPagination) return;

        const pagination = this.data.smsPagination;
        const currentPage = pagination.current_page;
        const totalPages = pagination.total_pages;

        let paginationHTML = '';

        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<button onclick="adminPanel.loadSMSPage(${currentPage - 1})">הקודם</button>`;
        }

        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<button class="${activeClass}" onclick="adminPanel.loadSMSPage(${i})">${i}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `<button onclick="adminPanel.loadSMSPage(${currentPage + 1})">הבא</button>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    // SMS Helper Functions
    getRecipientTypeText(type) {
        const types = {
            'customer': 'לקוח',
            'contractor': 'קבלן',
            'admin': 'מנהל'
        };
        return types[type] || type;
    }

    getMessageTypeText(type) {
        const types = {
            'verification': 'אימות',
            'quote_notification': 'התראת הצעה',
            'contractor_alert': 'התראת קבלן',
            'marketing': 'שיווק',
            'system': 'מערכת'
        };
        return types[type] || type;
    }

    getSMSStatusText(status) {
        const statuses = {
            'pending': 'ממתין',
            'sent': 'נשלח',
            'delivered': 'נמסר',
            'failed': 'נכשל'
        };
        return statuses[status] || status;
    }

    // SMS Actions
    async loadSMSPage(page) {
        this.currentSMSPage = page;
        await this.loadSMSLogs();
    }

    async filterSMS() {
        this.currentSMSPage = 1;
        await this.loadSMSLogs();
    }

    async viewSMSDetails(smsId) {
        const sms = this.data.smsLogs.find(log => log.id == smsId);
        if (!sms) return;

        // Create modal with SMS details
        const modal = document.createElement('div');
        modal.className = 'modal sms-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>פרטי הודעת SMS</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="sms-details">
                        <div class="detail-row">
                            <strong>מספר טלפון:</strong> ${this.formatPhone(sms.recipient_phone)}
                        </div>
                        <div class="detail-row">
                            <strong>סוג נמען:</strong> ${this.getRecipientTypeText(sms.recipient_type)}
                        </div>
                        <div class="detail-row">
                            <strong>סוג הודעה:</strong> ${this.getMessageTypeText(sms.message_type)}
                        </div>
                        <div class="detail-row">
                            <strong>סטטוס:</strong> <span class="status-badge status-${sms.status}">${this.getSMSStatusText(sms.status)}</span>
                        </div>
                        <div class="detail-row">
                            <strong>תוכן ההודעה:</strong>
                            <div class="message-content">${sms.message_content}</div>
                        </div>
                        <div class="detail-row">
                            <strong>עלות:</strong> ₪${parseFloat(sms.cost || 0).toFixed(3)}
                        </div>
                        <div class="detail-row">
                            <strong>נשלח בתאריך:</strong> ${this.formatDateTime(sms.created_at)}
                        </div>
                        ${sms.failed_reason ? `
                            <div class="detail-row">
                                <strong>סיבת כשל:</strong> <span class="error-text">${sms.failed_reason}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }



    renderSMSChart(element, data) {
        // Simple chart implementation - can be replaced with Chart.js or similar
        element.innerHTML = `
            <div class="simple-chart">
                <div class="chart-legend">
                    <span class="legend-item sent">נשלח</span>
                    <span class="legend-item delivered">נמסר</span>
                    <span class="legend-item failed">נכשל</span>
                </div>
                <div class="chart-bars">
                    ${data.dates.slice(-7).map((date, index) => `
                        <div class="chart-bar">
                            <div class="bar sent" style="height: ${(data.sent[data.sent.length - 7 + index] || 0) * 5}px"></div>
                            <div class="bar delivered" style="height: ${(data.delivered[data.delivered.length - 7 + index] || 0) * 5}px"></div>
                            <div class="bar failed" style="height: ${(data.failed[data.failed.length - 7 + index] || 0) * 5}px"></div>
                            <div class="bar-label">${new Date(date).getDate()}/${new Date(date).getMonth() + 1}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Download data as CSV
     */
    downloadCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showError('אין נתונים לייצוא');
            return;
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Create CSV content
        let csvContent = headers.join(',') + '\n';

        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header] || '';
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            });
            csvContent += values.join(',') + '\n';
        });

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Get quotes filters
     */
    getQuotesFilters() {
        return {
            status: document.getElementById('quotesStatusFilter')?.value || '',
            search: document.getElementById('quotesSearch')?.value || '',
            page: this.currentQuotesPage || 1,
            limit: 50
        };
    }

    /**
     * Update element safely
     */
    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    // Users Management Functions
    async loadUsers() {
        try {
            const filters = this.getUsersFilters();
            const queryParams = new URLSearchParams(filters);

            const response = await fetch(`/api/users.php?action=get_users&${queryParams}`);
            const result = await response.json();

            if (result.success) {
                this.data.users = result.users;
                this.data.usersPagination = result.pagination;
                this.updateUsersTable();
            } else {
                console.error('Failed to load users:', result.message);
                this.showError('שגיאה בטעינת משתמשים');
            }

            // Load user statistics
            const statsResponse = await fetch('/api/users.php?action=get_user_stats&period=30');
            const statsResult = await statsResponse.json();

            if (statsResult.success) {
                this.data.userStats = statsResult;
                this.updateUsersStats();
                this.updateUsersChart();
            }

        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    getUsersFilters() {
        const userType = document.getElementById('userTypeFilter')?.value || '';
        const verificationStatus = document.getElementById('verificationFilter')?.value || '';
        const isActive = document.getElementById('activeFilter')?.value || '';
        const isBlocked = document.getElementById('blockedFilter')?.value || '';
        const dateFrom = document.getElementById('userDateFrom')?.value || '';
        const dateTo = document.getElementById('userDateTo')?.value || '';
        const search = document.getElementById('userSearch')?.value || '';
        const page = this.currentUsersPage || 1;
        const limit = 50;

        return {
            user_type: userType,
            verification_status: verificationStatus,
            is_active: isActive,
            is_blocked: isBlocked,
            date_from: dateFrom,
            date_to: dateTo,
            search: search,
            page: page,
            limit: limit
        };
    }

    updateUsersTable() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!this.data.users || this.data.users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-state">אין משתמשים להצגה</td></tr>';
            return;
        }

        this.data.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="user-info">
                        <strong>${user.display_name || user.name || 'לא צוין'}</strong>
                        ${user.email ? `<br><small>${user.email}</small>` : ''}
                    </div>
                </td>
                <td>${this.formatPhone(user.phone)}</td>
                <td><span class="badge badge-${user.user_type}">${this.getUserTypeText(user.user_type)}</span></td>
                <td><span class="status-badge status-${user.verification_status}">${this.getVerificationStatusText(user.verification_status)}</span></td>
                <td>${this.formatDate(user.registration_date)}</td>
                <td>${user.last_login ? this.formatTimeAgo(user.last_login) : 'אף פעם'}</td>
                <td>
                    ${user.is_blocked ? '<span class="status-badge status-blocked">חסום</span>' :
                      user.is_active ? '<span class="status-badge status-active">פעיל</span>' :
                      '<span class="status-badge status-inactive">לא פעיל</span>'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="adminPanel.viewUser('${user.id}')" title="צפייה בפרטים">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="adminPanel.editUser('${user.id}')" title="עריכה">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.is_blocked ?
                            `<button class="btn btn-sm btn-success" onclick="adminPanel.unblockUser('${user.id}')" title="בטל חסימה">
                                <i class="fas fa-unlock"></i>
                            </button>` :
                            `<button class="btn btn-sm btn-warning" onclick="adminPanel.blockUser('${user.id}')" title="חסום">
                                <i class="fas fa-ban"></i>
                            </button>`
                        }
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Update pagination
        this.updateUsersPagination();
    }

    updateUsersStats() {
        if (!this.data.userStats) return;

        const totals = this.data.userStats.totals;

        // Update stats cards
        this.updateStatCard('totalUsers', totals.total_users || 0);
        this.updateStatCard('totalCustomers', totals.total_customers || 0);
        this.updateStatCard('totalContractorUsers', totals.total_contractors || 0);
        this.updateStatCard('verifiedUsers', totals.verified_users || 0);
        this.updateStatCard('todayRegistrations', totals.today_registrations || 0);
    }

    updateUsersChart() {
        if (!this.data.userStats || !this.data.userStats.daily_stats) return;

        const dailyStats = this.data.userStats.daily_stats;

        // Prepare chart data
        const dates = dailyStats.map(stat => stat.stat_date).reverse();
        const registrations = dailyStats.map(stat => stat.new_registrations).reverse();
        const customers = dailyStats.map(stat => stat.new_customers).reverse();
        const contractors = dailyStats.map(stat => stat.new_contractors).reverse();

        // Update users growth chart
        const chartElement = document.getElementById('usersGrowthChart');
        if (chartElement) {
            this.renderUsersChart(chartElement, {
                dates: dates,
                registrations: registrations,
                customers: customers,
                contractors: contractors
            });
        }
    }

    updateUsersPagination() {
        const paginationContainer = document.getElementById('usersPagination');
        if (!paginationContainer || !this.data.usersPagination) return;

        const pagination = this.data.usersPagination;
        const currentPage = pagination.current_page;
        const totalPages = pagination.total_pages;

        let paginationHTML = '';

        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<button onclick="adminPanel.loadUsersPage(${currentPage - 1})">הקודם</button>`;
        }

        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<button class="${activeClass}" onclick="adminPanel.loadUsersPage(${i})">${i}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `<button onclick="adminPanel.loadUsersPage(${currentPage + 1})">הבא</button>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    // User Helper Functions
    getUserTypeText(type) {
        const types = {
            'customer': 'לקוח',
            'contractor': 'קבלן',
            'admin': 'מנהל'
        };
        return types[type] || type;
    }

    getVerificationStatusText(status) {
        const statuses = {
            'verified': 'מאומת',
            'pending': 'ממתין',
            'rejected': 'נדחה'
        };
        return statuses[status] || status;
    }

    // User Actions
    async loadUsersPage(page) {
        this.currentUsersPage = page;
        await this.loadUsers();
    }

    async filterUsers() {
        this.currentUsersPage = 1;
        await this.loadUsers();
    }

    async searchUsers() {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.filterUsers();
        }, 500);
    }

    async viewUser(userId) {
        try {
            const response = await fetch(`/api/users_fixed.php?action=get_user&user_id=${userId}`);
            const result = await response.json();

            if (result.success) {
                this.showUserDetailsModal(result.user, result.activities, result.sessions);
            } else {
                this.showError('שגיאה בטעינת פרטי משתמש');
            }
        } catch (error) {
            console.error('Error viewing user:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    async editUser(userId) {
        const user = this.data.users.find(u => u.id == userId);
        if (!user) return;

        this.showEditUserModal(user);
    }

    async blockUser(userId) {
        const reason = prompt('סיבת החסימה:');
        if (!reason) return;

        try {
            const response = await fetch('/api/users_fixed.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'block_user',
                    user_id: userId,
                    reason: reason
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('משתמש נחסם בהצלחה');
                await this.loadUsers();
            } else {
                this.showError('שגיאה בחסימת משתמש: ' + result.message);
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    async unblockUser(userId) {
        if (!confirm('האם אתה בטוח שברצונך לבטל את חסימת המשתמש?')) return;

        try {
            const response = await fetch('/api/users_fixed.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'unblock_user',
                    user_id: userId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('חסימת משתמש בוטלה בהצלחה');
                await this.loadUsers();
            } else {
                this.showError('שגיאה בביטול חסימה: ' + result.message);
            }
        } catch (error) {
            console.error('Error unblocking user:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    renderUsersChart(element, data) {
        // Enhanced chart implementation for users growth
        const maxValue = Math.max(...data.registrations, ...data.customers, ...data.contractors);
        const chartHeight = 120;

        element.innerHTML = `
            <div class="simple-chart">
                <div class="chart-legend">
                    <span class="legend-item registrations">הרשמות (${data.registrations.reduce((a, b) => a + b, 0)})</span>
                    <span class="legend-item customers">לקוחות (${data.customers.reduce((a, b) => a + b, 0)})</span>
                    <span class="legend-item contractors">קבלנים (${data.contractors.reduce((a, b) => a + b, 0)})</span>
                </div>
                <div class="chart-bars">
                    ${data.dates.slice(-7).map((date, index) => {
                        const regValue = data.registrations[data.registrations.length - 7 + index] || 0;
                        const custValue = data.customers[data.customers.length - 7 + index] || 0;
                        const contrValue = data.contractors[data.contractors.length - 7 + index] || 0;

                        return `
                        <div class="chart-bar" title="${new Date(date).toLocaleDateString('he-IL')}">
                            <div class="bar registrations"
                                 style="height: ${maxValue > 0 ? (regValue / maxValue) * chartHeight : 0}px"
                                 title="הרשמות: ${regValue}"></div>
                            <div class="bar customers"
                                 style="height: ${maxValue > 0 ? (custValue / maxValue) * chartHeight : 0}px"
                                 title="לקוחות: ${custValue}"></div>
                            <div class="bar contractors"
                                 style="height: ${maxValue > 0 ? (contrValue / maxValue) * chartHeight : 0}px"
                                 title="קבלנים: ${contrValue}"></div>
                            <div class="bar-label">${new Date(date).getDate()}/${new Date(date).getMonth() + 1}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Advanced User Management Functions
    showUserDetailsModal(user, activities, sessions) {
        const modal = document.createElement('div');
        modal.className = 'modal user-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user"></i> פרטי משתמש - ${user.display_name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="user-details">
                        <div class="user-detail-card">
                            <h4>מידע בסיסי</h4>
                            <div class="detail-item">
                                <span class="detail-label">מזהה:</span>
                                <span class="detail-value">#${user.id}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">טלפון:</span>
                                <span class="detail-value">${this.formatPhone(user.phone)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">סוג משתמש:</span>
                                <span class="detail-value badge badge-${user.user_type}">${this.getUserTypeText(user.user_type)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">אימייל:</span>
                                <span class="detail-value">${user.email || 'לא צוין'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">סטטוס אימות:</span>
                                <span class="detail-value status-badge status-${user.verification_status}">${this.getVerificationStatusText(user.verification_status)}</span>
                            </div>
                        </div>

                        <div class="user-detail-card">
                            <h4>סטטיסטיקות</h4>
                            <div class="detail-item">
                                <span class="detail-label">תאריך הרשמה:</span>
                                <span class="detail-value">${this.formatDate(user.registration_date)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">התחברות אחרונה:</span>
                                <span class="detail-value">${user.last_login ? this.formatTimeAgo(user.last_login) : 'אף פעם'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">בקשות הצעות מחיר:</span>
                                <span class="detail-value">${user.total_quotes || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">פעילויות:</span>
                                <span class="detail-value">${user.total_activities || 0}</span>
                            </div>
                            ${user.user_type === 'contractor' ? `
                            <div class="detail-item">
                                <span class="detail-label">דירוג קבלן:</span>
                                <span class="detail-value">${user.contractor_rating ? user.contractor_rating + ' ⭐' : 'לא דורג'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">עיר:</span>
                                <span class="detail-value">${user.contractor_city || 'לא צוין'}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    ${user.blocked_reason ? `
                    <div class="user-detail-card">
                        <h4>סיבת חסימה</h4>
                        <p class="error-text">${user.blocked_reason}</p>
                        <small>נחסם ב: ${this.formatDate(user.blocked_at)}</small>
                    </div>
                    ` : ''}

                    <div class="user-detail-card">
                        <h4>פעילות אחרונה</h4>
                        <div class="activity-list">
                            ${activities.slice(0, 10).map(activity => `
                                <div class="activity-item">
                                    <div class="activity-icon ${activity.activity_type}">
                                        <i class="fas fa-${this.getActivityIcon(activity.activity_type)}"></i>
                                    </div>
                                    <div class="activity-content">
                                        <div class="activity-description">${activity.activity_description}</div>
                                        <div class="activity-time">${this.formatTimeAgo(activity.created_at)}</div>
                                    </div>
                                </div>
                            `).join('')}
                            ${activities.length === 0 ? '<p>אין פעילות רשומה</p>' : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="adminPanel.editUser('${user.id}')">
                        <i class="fas fa-edit"></i> ערוך
                    </button>
                    ${user.is_blocked ?
                        `<button class="btn btn-success" onclick="adminPanel.unblockUser('${user.id}')">
                            <i class="fas fa-unlock"></i> בטל חסימה
                        </button>` :
                        `<button class="btn btn-warning" onclick="adminPanel.blockUser('${user.id}')">
                            <i class="fas fa-ban"></i> חסום
                        </button>`
                    }
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">סגור</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    showEditUserModal(user) {
        const modal = document.createElement('div');
        modal.className = 'modal edit-user-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-edit"></i> עריכת משתמש - ${user.display_name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>שם:</label>
                                <input type="text" id="editUserName" value="${user.name || ''}" placeholder="שם המשתמש">
                            </div>
                            <div class="form-group">
                                <label>אימייל:</label>
                                <input type="email" id="editUserEmail" value="${user.email || ''}" placeholder="כתובת אימייל">
                            </div>
                            <div class="form-group">
                                <label>סטטוס אימות:</label>
                                <select id="editUserVerification">
                                    <option value="pending" ${user.verification_status === 'pending' ? 'selected' : ''}>ממתין לאימות</option>
                                    <option value="verified" ${user.verification_status === 'verified' ? 'selected' : ''}>מאומת</option>
                                    <option value="rejected" ${user.verification_status === 'rejected' ? 'selected' : ''}>נדחה</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>פעיל:</label>
                                <select id="editUserActive">
                                    <option value="1" ${user.is_active ? 'selected' : ''}>פעיל</option>
                                    <option value="0" ${!user.is_active ? 'selected' : ''}>לא פעיל</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label>הערות:</label>
                                <textarea id="editUserNotes" placeholder="הערות נוספות">${user.notes || ''}</textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="adminPanel.saveUserChanges('${user.id}')">
                        <i class="fas fa-save"></i> שמור שינויים
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">ביטול</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    async saveUserChanges(userId) {
        const name = document.getElementById('editUserName').value;
        const email = document.getElementById('editUserEmail').value;
        const verificationStatus = document.getElementById('editUserVerification').value;
        const isActive = document.getElementById('editUserActive').value === '1';
        const notes = document.getElementById('editUserNotes').value;

        try {
            const response = await fetch('/api/users_fixed.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_user',
                    user_id: userId,
                    name: name,
                    email: email,
                    verification_status: verificationStatus,
                    is_active: isActive,
                    notes: notes
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('משתמש עודכן בהצלחה');
                document.querySelector('.edit-user-modal').remove();
                await this.loadUsers();
            } else {
                this.showError('שגיאה בעדכון משתמש: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving user changes:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }



    async exportUsers() {
        try {
            const filters = this.getUsersFilters();
            const queryParams = new URLSearchParams(filters);
            queryParams.set('export', 'csv');

            const response = await fetch(`/api/users_fixed.php?action=export_users&${queryParams}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showSuccess('קובץ המשתמשים יוצא בהצלחה');
            } else {
                this.showError('שגיאה בייצוא קובץ המשתמשים');
            }
        } catch (error) {
            console.error('Error exporting users:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    async createUser() {
        const modal = document.createElement('div');
        modal.className = 'modal create-user-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> הוספת משתמש חדש</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="createUserForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>מספר טלפון: *</label>
                                <input type="tel" id="newUserPhone" placeholder="052-123-4567" required>
                            </div>
                            <div class="form-group">
                                <label>סוג משתמש: *</label>
                                <select id="newUserType" required>
                                    <option value="customer">לקוח</option>
                                    <option value="contractor">קבלן</option>
                                    <option value="admin">מנהל</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>שם:</label>
                                <input type="text" id="newUserName" placeholder="שם המשתמש">
                            </div>
                            <div class="form-group">
                                <label>אימייל:</label>
                                <input type="email" id="newUserEmail" placeholder="email@example.com">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="adminPanel.saveNewUser()">
                        <i class="fas fa-plus"></i> הוסף משתמש
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">ביטול</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    async saveNewUser() {
        const phone = document.getElementById('newUserPhone').value;
        const userType = document.getElementById('newUserType').value;
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;

        if (!phone || !userType) {
            this.showError('מספר טלפון וסוג משתמש הם שדות חובה');
            return;
        }

        try {
            const response = await fetch('/api/users_fixed.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_user',
                    phone: phone,
                    user_type: userType,
                    name: name,
                    email: email
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('משתמש נוצר בהצלחה');
                document.querySelector('.create-user-modal').remove();
                await this.loadUsers();
            } else {
                this.showError('שגיאה ביצירת משתמש: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Load activity logs
     */
    async loadActivityLogs() {
        try {
            const response = await fetch('/api/admin.php?action=get_recent_activity&limit=100');
            const result = await response.json();

            if (result.success) {
                this.data.activityLogs = result.activities || [];
                this.updateActivityLogsTable();
            } else {
                console.error('Failed to load activity logs:', result.message);
                this.showError('שגיאה בטעינת לוגי פעילות');
            }
        } catch (error) {
            console.error('Error loading activity logs:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Update activity logs table
     */
    updateActivityLogsTable() {
        const tbody = document.getElementById('activityLogsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!this.data.activityLogs || this.data.activityLogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">אין לוגי פעילות להצגה</td></tr>';
            return;
        }

        this.data.activityLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDateTime(log.created_at)}</td>
                <td>${this.getActivityTitle(log)}</td>
                <td>${this.getActivityDescription(log)}</td>
                <td>${log.ip_address || 'לא זמין'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.viewActivityDetails('${log.id}')">
                        <i class="fas fa-eye"></i>
                        פרטים
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * View activity details
     */
    viewActivityDetails(logId) {
        const log = this.data.activityLogs.find(l => l.id == logId);
        if (!log) {
            this.showError('לוג פעילות לא נמצא');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal activity-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>פרטי פעילות</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="activity-details">
                        <div class="detail-row">
                            <label>תאריך:</label>
                            <span>${this.formatDateTime(log.created_at)}</span>
                        </div>
                        <div class="detail-row">
                            <label>סוג ישות:</label>
                            <span>${log.entity_type}</span>
                        </div>
                        <div class="detail-row">
                            <label>פעולה:</label>
                            <span>${log.action}</span>
                        </div>
                        <div class="detail-row">
                            <label>כתובת IP:</label>
                            <span>${log.ip_address || 'לא זמין'}</span>
                        </div>
                        <div class="detail-row">
                            <label>פרטים:</label>
                            <div class="details-content">
                                <pre>${log.details || 'אין פרטים נוספים'}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Filter logs by type
     */
    filterLogs(logType) {
        if (!this.data.activityLogs) return;

        const filteredLogs = logType ?
            this.data.activityLogs.filter(log => log.entity_type === logType) :
            this.data.activityLogs;

        // Temporarily replace data for display
        const originalLogs = this.data.activityLogs;
        this.data.activityLogs = filteredLogs;
        this.updateActivityLogsTable();
        this.data.activityLogs = originalLogs;
    }

    /**
     * Update charts data based on period
     */
    updateChartsData(period) {
        // This function would update charts based on the selected period
        console.log('Updating charts for period:', period);
        this.updateCharts();
    }

    /**
     * View quote details (alias for viewQuote)
     */
    viewQuoteDetails(quoteId) {
        this.viewQuote(quoteId);
    }
}

// Global functions for HTML onclick events
function refreshData() {
    adminPanel.refreshData();
}











function sendBulkSMS() {
    // Implementation for bulk SMS
    console.log('Sending bulk SMS...');
}



function clearLogs() {
    if (confirm('האם אתה בטוח שברצונך לנקות את הלוגים?')) {
        // Implementation for clearing logs
        console.log('Clearing logs...');
    }
}



// Initialize admin panel
const adminPanel = new AdminPanel();
window.adminPanel = adminPanel;

// Ensure all functions are available globally
window.addContractor = addContractor;
window.exportQuotes = exportQuotes;
window.importContractors = importContractors;
window.sendTestSMS = sendTestSMS;
window.editContractor = editContractor;
window.deleteContractor = deleteContractor;
window.viewContractorQuotes = viewContractorQuotes;
window.toggleContractorStatus = toggleContractorStatus;
window.exportContractors = exportContractors;
window.setupContractorFilters = setupContractorFilters;
window.showBulkOperationsModal = showBulkOperationsModal;

// Global functions for HTML onclick handlers
function addContractor() {
    if (window.adminPanel || adminPanel) {
        (window.adminPanel || adminPanel).addContractor();
    }
}

function exportQuotes() {
    if (window.adminPanel || adminPanel) {
        (window.adminPanel || adminPanel).exportQuotes();
    }
}

function importContractors() {
    if (window.adminPanel || adminPanel) {
        (window.adminPanel || adminPanel).importContractors();
    }
}

function sendTestSMS() {
    if (window.adminPanel || adminPanel) {
        (window.adminPanel || adminPanel).sendTestSMS();
    }
}

// Additional global functions for contractor management
function editContractor(contractorId) {
    if (window.adminPanel || adminPanel) {
        (window.adminPanel || adminPanel).editContractor(contractorId);
    }
}

function deleteContractor(contractorId, contractorName) {
    if (window.adminPanel || adminPanel) {
        (window.adminPanel || adminPanel).deleteContractor(contractorId, contractorName);
    }
}

function viewContractorQuotes(contractorId) {
    if (window.adminPanel || adminPanel) {
        (window.adminPanel || adminPanel).viewContractorQuotes(contractorId);
    }
}

function toggleContractorStatus(contractorId) {
    if (window.adminPanel || adminPanel) {
        (window.adminPanel || adminPanel).toggleContractorStatus(contractorId);
    }
}

function exportContractors() {
    try {
        if (window.adminPanel || adminPanel) {
            (window.adminPanel || adminPanel).exportContractors();
        } else {
            console.error('AdminPanel not found');
        }
    } catch (error) {
        console.error('Error in exportContractors:', error);
    }
}

function setupContractorFilters() {
    try {
        if (window.adminPanel || adminPanel) {
            (window.adminPanel || adminPanel).setupContractorFilters();
        } else {
            console.error('AdminPanel not found');
        }
    } catch (error) {
        console.error('Error in setupContractorFilters:', error);
    }
}

function showBulkOperationsModal() {
    try {
        if (window.adminPanel || adminPanel) {
            (window.adminPanel || adminPanel).showBulkOperationsModal();
        } else {
            console.error('AdminPanel not found');
        }
    } catch (error) {
        console.error('Error in showBulkOperationsModal:', error);
    }
}

// Additional global functions for quote management
function editQuote(quoteId) {
    try {
        if (window.adminPanel || adminPanel) {
            (window.adminPanel || adminPanel).editQuote(quoteId);
        } else {
            console.error('AdminPanel not found');
        }
    } catch (error) {
        console.error('Error in editQuote:', error);
    }
}

function viewQuote(quoteId) {
    try {
        if (window.adminPanel || adminPanel) {
            (window.adminPanel || adminPanel).viewQuote(quoteId);
        } else {
            console.error('AdminPanel not found');
        }
    } catch (error) {
        console.error('Error in viewQuote:', error);
    }
}

// Logout function
function logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        // Clear any stored session data
        localStorage.removeItem('admin_session');
        sessionStorage.clear();

        // Redirect to login page or home
        window.location.href = '/admin/login.html';
    }
}
