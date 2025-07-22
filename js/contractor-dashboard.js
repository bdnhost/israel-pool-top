/**
 * Contractor Dashboard JavaScript
 * Handles contractor quote management and responses
 */

class ContractorDashboard {
    constructor() {
        this.contractorId = this.getContractorId();
        this.quotes = [];
        this.filteredQuotes = [];
        this.currentQuote = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadContractorData();
        this.loadQuotes();
        this.startAutoRefresh();
    }
    
    bindEvents() {
        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('typeFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('budgetFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        
        // Response form
        document.getElementById('responseType').addEventListener('change', (e) => {
            this.toggleResponseFields(e.target.value);
        });
        
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }
    
    /**
     * Get contractor ID from URL or session
     */
    getContractorId() {
        // In a real implementation, this would come from authentication
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('contractor_id') || '1'; // Default for demo
    }
    
    /**
     * Load contractor data
     */
    async loadContractorData() {
        try {
            const response = await fetch(`/api/contractors.php?id=${this.contractorId}`);
            const result = await response.json();
            
            if (result.success && result.contractor) {
                this.updateContractorInfo(result.contractor);
            }
        } catch (error) {
            console.error('Error loading contractor data:', error);
        }
    }
    
    /**
     * Load quotes for contractor
     */
    async loadQuotes() {
        this.showLoading();
        
        try {
            const response = await fetch(`/api/contractor-quotes.php?contractor_id=${this.contractorId}`);
            const result = await response.json();
            
            if (result.success) {
                this.quotes = result.quotes || [];
                this.filteredQuotes = [...this.quotes];
                this.updateQuotesDisplay();
                this.updateStats();
            } else {
                this.showError('שגיאה בטעינת הבקשות');
            }
        } catch (error) {
            console.error('Error loading quotes:', error);
            this.showError('שגיאה בחיבור לשרת');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Update contractor information display
     */
    updateContractorInfo(contractor) {
        document.getElementById('contractorName').textContent = contractor.title;
        document.getElementById('contractorPhone').textContent = contractor.phone || 'לא צוין';
        document.getElementById('contractorEmail').textContent = contractor.email || 'לא צוין';
    }
    
    /**
     * Update statistics display
     */
    updateStats() {
        const pendingQuotes = this.quotes.filter(q => q.status === 'new' || q.status === 'sent').length;
        const totalQuotes = this.quotes.length;
        const respondedQuotes = this.quotes.filter(q => q.response_type).length;
        const responseRate = totalQuotes > 0 ? Math.round((respondedQuotes / totalQuotes) * 100) : 0;
        
        document.getElementById('pendingQuotes').textContent = pendingQuotes;
        document.getElementById('totalQuotes').textContent = totalQuotes;
        document.getElementById('responseRate').textContent = `${responseRate}%`;
        
        document.getElementById('newQuotesCount').textContent = `${pendingQuotes} בקשות ממתינות`;
        document.getElementById('respondedCount').textContent = `${respondedQuotes} תגובות`;
    }
    
    /**
     * Update quotes display
     */
    updateQuotesDisplay() {
        const container = document.getElementById('quotesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredQuotes.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        container.innerHTML = '';
        
        this.filteredQuotes.forEach(quote => {
            const quoteCard = this.createQuoteCard(quote);
            container.appendChild(quoteCard);
        });
    }
    
    /**
     * Create quote card element
     */
    createQuoteCard(quote) {
        const card = document.createElement('div');
        card.className = `quote-card ${quote.status === 'new' ? 'new' : ''}`;
        
        const statusText = this.getStatusText(quote.status, quote.response_type);
        const statusClass = this.getStatusClass(quote.status, quote.response_type);
        
        card.innerHTML = `
            <div class="quote-header">
                <div class="quote-info">
                    <h3>${quote.customer_name}</h3>
                    <div class="quote-number">בקשה #${quote.request_number}</div>
                    <div class="quote-date">${this.formatDate(quote.created_at)}</div>
                </div>
                <div class="quote-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="quote-details">
                <div class="detail-item">
                    <div class="detail-icon customer">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="detail-content">
                        <div class="detail-label">לקוח</div>
                        <div class="detail-value">${quote.customer_name}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon project">
                        <i class="fas fa-swimming-pool"></i>
                    </div>
                    <div class="detail-content">
                        <div class="detail-label">סוג פרויקט</div>
                        <div class="detail-value">${this.getPoolTypeText(quote.pool_type)}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon location">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="detail-content">
                        <div class="detail-label">מיקום</div>
                        <div class="detail-value">${quote.project_location}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon budget">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="detail-content">
                        <div class="detail-label">תקציב</div>
                        <div class="detail-value">${this.getBudgetRangeText(quote.budget_range)}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon timing">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="detail-content">
                        <div class="detail-label">זמן ביצוע</div>
                        <div class="detail-value">${this.getTimingText(quote.preferred_timing)}</div>
                    </div>
                </div>
            </div>
            
            ${quote.description ? `
                <div class="quote-description">
                    "${quote.description}"
                </div>
            ` : ''}
            
            <div class="quote-actions">
                <button class="btn btn-outline btn-sm" onclick="contractorDashboard.viewQuote('${quote.id}')">
                    <i class="fas fa-eye"></i>
                    צפה בפרטים
                </button>
                ${!quote.response_type ? `
                    <button class="btn btn-primary btn-sm" onclick="contractorDashboard.respondToQuote('${quote.id}')">
                        <i class="fas fa-reply"></i>
                        הגב לבקשה
                    </button>
                ` : `
                    <button class="btn btn-success btn-sm" disabled>
                        <i class="fas fa-check"></i>
                        הגבת
                    </button>
                `}
                <a href="tel:${quote.customer_phone}" class="btn btn-warning btn-sm">
                    <i class="fas fa-phone"></i>
                    התקשר
                </a>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Apply filters to quotes
     */
    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const budgetFilter = document.getElementById('budgetFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        this.filteredQuotes = this.quotes.filter(quote => {
            // Status filter
            if (statusFilter) {
                const quoteStatus = quote.response_type ? 'responded' : 
                                 quote.viewed_at ? 'viewed' : 'new';
                if (statusFilter !== quoteStatus) return false;
            }
            
            // Type filter
            if (typeFilter && quote.pool_type !== typeFilter) return false;
            
            // Budget filter
            if (budgetFilter && quote.budget_range !== budgetFilter) return false;
            
            // Search filter
            if (searchTerm) {
                const searchableText = `${quote.customer_name} ${quote.project_location} ${quote.request_number}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            return true;
        });
        
        this.updateQuotesDisplay();
    }
    
    /**
     * View quote details
     */
    async viewQuote(quoteId) {
        try {
            const response = await fetch(`/api/contractor-quotes.php?action=get_quote&quote_id=${quoteId}&contractor_id=${this.contractorId}`);
            const result = await response.json();
            
            if (result.success) {
                this.currentQuote = result.quote;
                this.showQuoteModal();
                
                // Mark as viewed
                if (!this.currentQuote.viewed_at) {
                    this.markAsViewed(quoteId);
                }
            } else {
                this.showError('שגיאה בטעינת פרטי הבקשה');
            }
        } catch (error) {
            console.error('Error loading quote details:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }
    
    /**
     * Show quote details modal
     */
    showQuoteModal() {
        const quote = this.currentQuote;
        const modal = document.getElementById('quoteModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="quote-details-full">
                <div class="detail-section">
                    <h3>פרטי הלקוח</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>שם:</strong> ${quote.customer_name}
                        </div>
                        <div class="detail-item">
                            <strong>טלפון:</strong> <a href="tel:${quote.customer_phone}">${this.formatPhone(quote.customer_phone)}</a>
                        </div>
                        ${quote.customer_email ? `
                            <div class="detail-item">
                                <strong>אימייל:</strong> <a href="mailto:${quote.customer_email}">${quote.customer_email}</a>
                            </div>
                        ` : ''}
                        ${quote.customer_city ? `
                            <div class="detail-item">
                                <strong>עיר מגורים:</strong> ${quote.customer_city}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>פרטי הפרויקט</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>סוג בריכה:</strong> ${this.getPoolTypeText(quote.pool_type)}
                        </div>
                        <div class="detail-item">
                            <strong>גודל:</strong> ${this.getPoolSizeText(quote.pool_size)}
                        </div>
                        <div class="detail-item">
                            <strong>תקציב:</strong> ${this.getBudgetRangeText(quote.budget_range)}
                        </div>
                        <div class="detail-item">
                            <strong>מיקום הפרויקט:</strong> ${quote.project_location}
                        </div>
                        <div class="detail-item">
                            <strong>זמן ביצוע רצוי:</strong> ${this.getTimingText(quote.preferred_timing)}
                        </div>
                    </div>
                </div>
                
                ${quote.special_requirements && quote.special_requirements.length > 0 ? `
                    <div class="detail-section">
                        <h3>דרישות מיוחדות</h3>
                        <ul class="requirements-list">
                            ${quote.special_requirements.map(req => `<li>${this.getRequirementText(req)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${quote.description ? `
                    <div class="detail-section">
                        <h3>תיאור נוסף</h3>
                        <div class="description-text">${quote.description}</div>
                    </div>
                ` : ''}
                
                ${quote.images && quote.images.length > 0 ? `
                    <div class="detail-section">
                        <h3>תמונות</h3>
                        <div class="images-gallery">
                            ${quote.images.map(img => `
                                <img src="${img}" alt="תמונת פרויקט" onclick="this.style.transform='scale(2)'; setTimeout(() => this.style.transform='scale(1)', 2000)">
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${quote.response_type ? `
                    <div class="detail-section response-section">
                        <h3>התגובה שלך</h3>
                        <div class="response-info">
                            <div class="response-type">${this.getResponseTypeText(quote.response_type)}</div>
                            ${quote.estimated_price ? `<div class="response-price">הערכת מחיר: ₪${Number(quote.estimated_price).toLocaleString()}</div>` : ''}
                            ${quote.estimated_duration ? `<div class="response-duration">זמן ביצוע: ${quote.estimated_duration}</div>` : ''}
                            ${quote.contractor_notes ? `<div class="response-notes">${quote.contractor_notes}</div>` : ''}
                            <div class="response-date">נשלח ב: ${this.formatDateTime(quote.responded_at)}</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Update respond button
        const respondBtn = document.getElementById('respondBtn');
        if (quote.response_type) {
            respondBtn.style.display = 'none';
        } else {
            respondBtn.style.display = 'inline-flex';
            respondBtn.onclick = () => this.respondToQuote(quote.id);
        }
        
        modal.classList.add('show');
    }
    
    /**
     * Utility functions
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('he-IL');
    }
    
    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('he-IL');
    }
    
    formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
        }
        return phone;
    }
    
    getPoolTypeText(type) {
        const types = {
            concrete: 'בריכת בטון',
            fiberglass: 'בריכת פיברגלס',
            modular: 'בריכה מתועשת',
            renovation: 'שיפוץ בריכה',
            maintenance: 'תחזוקה ושירות'
        };
        return types[type] || type;
    }
    
    getPoolSizeText(size) {
        const sizes = {
            small: 'קטנה (עד 20 מ"ר)',
            medium: 'בינונית (20-40 מ"ר)',
            large: 'גדולה (40-60 מ"ר)',
            xl: 'גדולה מאוד (60+ מ"ר)',
            unknown: 'לא יודע'
        };
        return sizes[size] || size;
    }
    
    getBudgetRangeText(range) {
        const ranges = {
            under_100k: 'עד 100,000 ₪',
            '100k_200k': '100,000 - 200,000 ₪',
            '200k_300k': '200,000 - 300,000 ₪',
            '300k_500k': '300,000 - 500,000 ₪',
            over_500k: 'מעל 500,000 ₪',
            unknown: 'לא יודע'
        };
        return ranges[range] || range;
    }
    
    getTimingText(timing) {
        const timings = {
            asap: 'דחוף (עד חודש)',
            '1_month': 'תוך חודש',
            '1_3_months': '1-3 חודשים',
            '3_6_months': '3-6 חודשים',
            '6_12_months': '6-12 חודשים',
            flexible: 'גמיש'
        };
        return timings[timing] || timing;
    }
    
    getRequirementText(requirement) {
        const requirements = {
            heating: 'חימום בריכה',
            cover: 'כיסוי בריכה',
            lighting: 'תאורה מתקדמת',
            automation: 'מערכת אוטומציה',
            waterfall: 'מפל מים',
            jacuzzi: 'ג\'קוזי'
        };
        return requirements[requirement] || requirement;
    }
    
    getStatusText(status, responseType) {
        if (responseType) return 'הגבת';
        if (status === 'viewed') return 'נצפה';
        return 'חדש';
    }
    
    getStatusClass(status, responseType) {
        if (responseType) return 'status-responded';
        if (status === 'viewed') return 'status-viewed';
        return 'status-new';
    }
    
    getResponseTypeText(responseType) {
        const types = {
            interested: 'מעוניין לתת הצעת מחיר',
            need_more_info: 'צריך פרטים נוספים',
            not_interested: 'לא מעוניין'
        };
        return types[responseType] || responseType;
    }
    
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    showError(message) {
        this.showToast(message, 'error');
    }
    
    showToast(message, type) {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle'
        };
        
        icon.className = `toast-icon ${icons[type]}`;
        messageEl.textContent = message;
        toast.className = `toast ${type} show`;
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('quotesContainer').style.display = 'none';
    }
    
    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('quotesContainer').style.display = 'block';
    }
    
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    startAutoRefresh() {
        // Refresh every 2 minutes
        setInterval(() => {
            this.loadQuotes();
        }, 2 * 60 * 1000);
    }

    /**
     * Respond to quote
     */
    respondToQuote(quoteId) {
        this.currentQuote = this.quotes.find(q => q.id == quoteId);
        if (!this.currentQuote) return;

        this.closeModals();
        this.showResponseModal();
    }

    /**
     * Show response modal
     */
    showResponseModal() {
        const modal = document.getElementById('responseModal');

        // Reset form
        document.getElementById('responseForm').reset();
        this.toggleResponseFields('');

        modal.classList.add('show');
    }

    /**
     * Toggle response form fields based on response type
     */
    toggleResponseFields(responseType) {
        const priceGroup = document.getElementById('priceGroup');
        const durationGroup = document.getElementById('durationGroup');

        if (responseType === 'interested') {
            priceGroup.style.display = 'block';
            durationGroup.style.display = 'block';
        } else {
            priceGroup.style.display = 'none';
            durationGroup.style.display = 'none';
        }
    }

    /**
     * Submit response
     */
    async submitResponse() {
        const responseData = {
            action: 'submit_response',
            quote_id: this.currentQuote.id,
            contractor_id: this.contractorId,
            response_type: document.getElementById('responseType').value,
            estimated_price: document.getElementById('estimatedPrice').value,
            estimated_duration: document.getElementById('estimatedDuration').value,
            contractor_notes: document.getElementById('responseMessage').value
        };

        // Validate required fields
        if (!responseData.response_type || !responseData.contractor_notes) {
            this.showError('אנא מלא את כל השדות הנדרשים');
            return;
        }

        try {
            const response = await fetch('/api/contractor-quotes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(responseData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('התגובה נשלחה בהצלחה!');
                this.closeModals();
                this.loadQuotes(); // Refresh quotes
            } else {
                this.showError(result.message || 'שגיאה בשליחת התגובה');
            }
        } catch (error) {
            console.error('Error submitting response:', error);
            this.showError('שגיאה בחיבור לשרת');
        }
    }

    /**
     * Mark quote as viewed
     */
    async markAsViewed(quoteId) {
        try {
            await fetch('/api/contractor-quotes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'mark_viewed',
                    quote_id: quoteId,
                    contractor_id: this.contractorId
                })
            });
        } catch (error) {
            console.error('Error marking as viewed:', error);
        }
    }
}

// Global functions for HTML onclick events
function refreshData() {
    contractorDashboard.loadQuotes();
}

function updateProfile() {
    // Implementation for profile update
    console.log('Update profile');
}

function showNewQuotes() {
    document.getElementById('statusFilter').value = 'new';
    contractorDashboard.applyFilters();
}

function showAllQuotes() {
    document.getElementById('statusFilter').value = '';
    contractorDashboard.applyFilters();
}

function showResponded() {
    document.getElementById('statusFilter').value = 'responded';
    contractorDashboard.applyFilters();
}

function showSettings() {
    // Implementation for settings
    console.log('Show settings');
}

function closeQuoteModal() {
    contractorDashboard.closeModals();
}

function closeResponseModal() {
    contractorDashboard.closeModals();
}

function respondToQuote() {
    contractorDashboard.respondToQuote(contractorDashboard.currentQuote.id);
}

function submitResponse() {
    contractorDashboard.submitResponse();
}

// Initialize contractor dashboard
const contractorDashboard = new ContractorDashboard();
