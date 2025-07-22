/**
 * Quote Modal JavaScript
 * Handles quote request flow: SMS verification, form submission, image upload
 */

class QuoteModal {
    constructor() {
        this.currentStep = 1;
        this.selectedContractor = null;
        this.verificationTimer = null;
        this.verificationTimeLeft = 300; // 5 minutes
        this.uploadedImages = [];
        this.maxImages = 5;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupImageUpload();
    }
    
    bindEvents() {
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'quoteModal') {
                this.close();
            }
        });
        
        // Form submission
        document.getElementById('quoteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitQuote();
        });
        
        // Phone input formatting
        document.getElementById('customerPhone').addEventListener('input', (e) => {
            this.formatPhoneInput(e.target);
        });
        
        // Verification code input
        document.getElementById('verificationCode').addEventListener('input', (e) => {
            this.handleCodeInput(e.target);
        });
        
        // Pool type change
        document.getElementById('poolType').addEventListener('change', (e) => {
            this.updatePoolTypeInfo(e.target.value);
        });
    }
    
    /**
     * Open modal for specific contractor
     */
    open(contractorData) {
        this.selectedContractor = contractorData;
        this.populateContractorInfo();
        this.goToStep(1);
        
        const modal = document.getElementById('quoteModal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close modal
     */
    close() {
        const modal = document.getElementById('quoteModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            this.reset();
        }, 300);
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
    
    /**
     * Reset modal to initial state
     */
    reset() {
        this.currentStep = 1;
        this.selectedContractor = null;
        this.clearVerificationTimer();
        this.uploadedImages = [];
        
        // Reset forms
        document.getElementById('customerPhone').value = '';
        document.getElementById('verificationCode').value = '';
        document.getElementById('quoteForm').reset();
        
        // Hide verification section
        document.getElementById('verificationSection').style.display = 'none';
        
        // Clear image preview
        document.getElementById('imagePreview').innerHTML = '';
        
        // Reset buttons
        document.getElementById('sendCodeBtn').disabled = false;
        document.getElementById('verifyCodeBtn').disabled = false;
        document.getElementById('resendCodeBtn').disabled = true;
    }
    
    /**
     * Navigate to specific step
     */
    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.quote-step').forEach(el => {
            el.classList.remove('active');
        });
        
        // Show target step
        document.getElementById(`step${step}`).classList.add('active');
        this.currentStep = step;
        
        // Update modal title
        const titles = {
            1: 'בקשת הצעת מחיר - אימות טלפון',
            2: 'בקשת הצעת מחיר - פרטי הבקשה',
            3: 'בקשה נשלחה בהצלחה!'
        };
        document.getElementById('modalTitle').textContent = titles[step];
    }
    
    /**
     * Populate contractor information
     */
    populateContractorInfo() {
        if (!this.selectedContractor) return;
        
        const contractorInfo = document.getElementById('selectedContractorInfo');
        const initials = this.selectedContractor.title.split(' ').map(word => word[0]).join('').substring(0, 2);
        
        contractorInfo.innerHTML = `
            <div class="contractor-avatar">${initials}</div>
            <div class="contractor-details">
                <h4>${this.selectedContractor.title}</h4>
                <p>${this.selectedContractor.city || 'ישראל'}</p>
                <div class="contractor-rating">
                    <span>דירוג: ${this.selectedContractor.rating || '4.5'}</span>
                    <div class="stars">
                        ${this.generateStars(this.selectedContractor.rating || 4.5)}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate stars HTML
     */
    generateStars(rating) {
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        return starsHtml;
    }
    
    /**
     * Format phone input
     */
    formatPhoneInput(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Remove country code if present
        if (value.startsWith('972')) {
            value = '0' + value.substring(3);
        }
        
        // Format as XXX-XXX-XXXX
        if (value.length >= 10) {
            value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6, 10);
        } else if (value.length >= 6) {
            value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6);
        } else if (value.length >= 3) {
            value = value.substring(0, 3) + '-' + value.substring(3);
        }
        
        input.value = value;
    }
    
    /**
     * Send SMS verification code
     */
    async sendVerificationCode() {
        const phoneInput = document.getElementById('customerPhone');
        const phone = phoneInput.value.replace(/\D/g, '');
        
        if (!this.validatePhone(phone)) {
            this.showError('מספר טלפון לא תקין');
            return;
        }
        
        this.showLoading('שולח קוד אימות...');
        
        try {
            const response = await fetch('/api/quotes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'send_verification',
                    phone: phone
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.showVerificationSection(phone);
                this.startVerificationTimer();
                document.getElementById('sendCodeBtn').disabled = true;
                this.showSuccess('קוד אימות נשלח בהצלחה');
            } else {
                this.showError(result.message);
            }
            
        } catch (error) {
            this.hideLoading();
            this.showError('שגיאה בשליחת הקוד. נסה שוב.');
        }
    }
    
    /**
     * Show verification section
     */
    showVerificationSection(phone) {
        const section = document.getElementById('verificationSection');
        const phoneDisplay = document.getElementById('phoneDisplay');
        
        phoneDisplay.textContent = this.formatPhoneDisplay(phone);
        section.style.display = 'block';
        
        // Focus on verification input
        setTimeout(() => {
            document.getElementById('verificationCode').focus();
        }, 100);
    }
    
    /**
     * Start verification timer
     */
    startVerificationTimer() {
        this.verificationTimeLeft = 300; // 5 minutes
        this.updateTimerDisplay();
        
        this.verificationTimer = setInterval(() => {
            this.verificationTimeLeft--;
            this.updateTimerDisplay();
            
            if (this.verificationTimeLeft <= 0) {
                this.clearVerificationTimer();
                document.getElementById('resendCodeBtn').disabled = false;
            }
        }, 1000);
    }
    
    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const timer = document.getElementById('timer');
        const minutes = Math.floor(this.verificationTimeLeft / 60);
        const seconds = this.verificationTimeLeft % 60;
        
        if (this.verificationTimeLeft > 0) {
            timer.textContent = ` (${minutes}:${seconds.toString().padStart(2, '0')})`;
        } else {
            timer.textContent = ' (פג תוקף)';
        }
    }
    
    /**
     * Clear verification timer
     */
    clearVerificationTimer() {
        if (this.verificationTimer) {
            clearInterval(this.verificationTimer);
            this.verificationTimer = null;
        }
    }
    
    /**
     * Handle verification code input
     */
    handleCodeInput(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 4) value = value.substring(0, 4);
        input.value = value;
        
        // Auto-verify when 4 digits entered
        if (value.length === 4) {
            setTimeout(() => this.verifyCode(), 500);
        }
    }
    
    /**
     * Verify SMS code
     */
    async verifyCode() {
        const phone = document.getElementById('customerPhone').value.replace(/\D/g, '');
        const code = document.getElementById('verificationCode').value;
        
        if (code.length !== 4) {
            this.showError('הזן קוד בן 4 ספרות');
            return;
        }
        
        this.showLoading('מאמת קוד...');
        
        try {
            const response = await fetch('/api/quotes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'verify_code',
                    phone: phone,
                    code: code
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.clearVerificationTimer();
                this.showSuccess('אימות בוצע בהצלחה!');
                setTimeout(() => this.goToStep(2), 1500);
            } else {
                this.showError(result.message);
                document.getElementById('verificationCode').value = '';
                document.getElementById('verificationCode').focus();
            }
            
        } catch (error) {
            this.hideLoading();
            this.showError('שגיאה באימות הקוד. נסה שוב.');
        }
    }
    
    /**
     * Resend verification code
     */
    async resendCode() {
        document.getElementById('resendCodeBtn').disabled = true;
        await this.sendVerificationCode();
    }
    
    /**
     * Update pool type information
     */
    updatePoolTypeInfo(poolType) {
        const infoElement = document.getElementById('poolTypeInfo');
        const poolTypeInfo = {
            'concrete': 'בריכה עמידה ומותאמת אישית, זמן בנייה: 4-8 שבועות',
            'fiberglass': 'התקנה מהירה ותחזוקה קלה, זמן התקנה: 1-2 שבועות',
            'modular': 'פתרון חסכוני ומהיר, זמן התקנה: 3-7 ימים',
            'renovation': 'שיפוץ ושדרוג בריכה קיימת',
            'maintenance': 'תחזוקה שוטפת ושירותי תיקון'
        };
        
        infoElement.textContent = poolTypeInfo[poolType] || '';
    }
    
    /**
     * Setup image upload functionality
     */
    setupImageUpload() {
        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('imageInput');
        
        // Click to upload
        uploadArea.addEventListener('click', () => {
            if (this.uploadedImages.length < this.maxImages) {
                fileInput.click();
            }
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });
    }
    
    /**
     * Handle file selection
     */
    async handleFileSelect(files) {
        const remainingSlots = this.maxImages - this.uploadedImages.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);
        
        for (const file of filesToProcess) {
            if (this.validateImageFile(file)) {
                await this.uploadImage(file);
            }
        }
        
        this.updateImageUploadArea();
    }
    
    /**
     * Validate image file
     */
    validateImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!allowedTypes.includes(file.type)) {
            this.showError('סוג קובץ לא נתמך. השתמש ב-JPG, PNG או GIF');
            return false;
        }
        
        if (file.size > maxSize) {
            this.showError('הקובץ גדול מדי. מקסימום 5MB');
            return false;
        }
        
        return true;
    }
    
    /**
     * Upload image to server
     */
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('action', 'upload_image');
        
        try {
            const response = await fetch('/api/quotes.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.uploadedImages.push({
                    file_path: result.file_path,
                    original_name: file.name
                });
                this.updateImagePreview();
            } else {
                this.showError(result.message);
            }
            
        } catch (error) {
            this.showError('שגיאה בהעלאת התמונה');
        }
    }
    
    /**
     * Update image preview
     */
    updateImagePreview() {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';
        
        this.uploadedImages.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${image.file_path}" alt="${image.original_name}">
                <button type="button" class="image-remove" onclick="quoteModal.removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            preview.appendChild(imageItem);
        });
    }
    
    /**
     * Remove uploaded image
     */
    removeImage(index) {
        this.uploadedImages.splice(index, 1);
        this.updateImagePreview();
        this.updateImageUploadArea();
    }
    
    /**
     * Update image upload area state
     */
    updateImageUploadArea() {
        const uploadArea = document.getElementById('imageUploadArea');
        const placeholder = uploadArea.querySelector('.upload-placeholder p');
        
        if (this.uploadedImages.length >= this.maxImages) {
            uploadArea.style.display = 'none';
        } else {
            uploadArea.style.display = 'block';
            const remaining = this.maxImages - this.uploadedImages.length;
            placeholder.textContent = `גרור תמונות לכאן או לחץ לבחירה (עוד ${remaining} תמונות)`;
        }
    }
    
    /**
     * Submit quote request
     */
    async submitQuote() {
        if (!this.validateQuoteForm()) {
            return;
        }
        
        const formData = this.collectFormData();
        this.showLoading('שולח בקשה...');
        
        try {
            const response = await fetch('/api/quotes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'submit_quote',
                    ...formData
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.showQuoteSuccess(result);
            } else {
                this.showError(result.message);
            }
            
        } catch (error) {
            this.hideLoading();
            this.showError('שגיאה בשליחת הבקשה. נסה שוב.');
        }
    }
    
    /**
     * Validate quote form
     */
    validateQuoteForm() {
        const requiredFields = [
            'customerName', 'poolType', 'poolSize', 
            'budgetRange', 'preferredTiming', 'projectLocation'
        ];
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.focus();
                this.showError('אנא מלא את כל השדות הנדרשים');
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Collect form data
     */
    collectFormData() {
        const specialRequirements = Array.from(
            document.querySelectorAll('input[name="requirements[]"]:checked')
        ).map(cb => cb.value);
        
        return {
            contractor_id: this.selectedContractor?.id,
            customer_name: document.getElementById('customerName').value,
            customer_phone: document.getElementById('customerPhone').value.replace(/\D/g, ''),
            customer_email: document.getElementById('customerEmail').value,
            customer_city: document.getElementById('customerCity').value,
            pool_type: document.getElementById('poolType').value,
            pool_size: document.getElementById('poolSize').value,
            budget_range: document.getElementById('budgetRange').value,
            project_location: document.getElementById('projectLocation').value,
            preferred_timing: document.getElementById('preferredTiming').value,
            description: document.getElementById('description').value,
            special_requirements: specialRequirements,
            images: this.uploadedImages.map(img => img.file_path)
        };
    }
    
    /**
     * Show quote success
     */
    showQuoteSuccess(result) {
        this.populateQuoteSummary(result);
        this.goToStep(3);
    }
    
    /**
     * Populate quote summary
     */
    populateQuoteSummary(result) {
        const summary = document.getElementById('quoteSummary');
        const successMessage = document.getElementById('successMessage');
        
        successMessage.textContent = `בקשתך נשלחה ל-${result.contractors_notified} קבלנים באזור`;
        
        summary.innerHTML = `
            <h4>סיכום הבקשה</h4>
            <div class="summary-item">
                <span>מספר בקשה:</span>
                <strong>${result.quote_number}</strong>
            </div>
            <div class="summary-item">
                <span>סוג פרויקט:</span>
                <span>${this.getPoolTypeText(document.getElementById('poolType').value)}</span>
            </div>
            <div class="summary-item">
                <span>מיקום:</span>
                <span>${document.getElementById('projectLocation').value}</span>
            </div>
            <div class="summary-item">
                <span>קבלנים שקיבלו:</span>
                <span>${result.contractors_notified}</span>
            </div>
        `;
    }
    
    /**
     * Get pool type text in Hebrew
     */
    getPoolTypeText(poolType) {
        const types = {
            'concrete': 'בריכת בטון',
            'fiberglass': 'בריכת פיברגלס',
            'modular': 'בריכה מתועשת',
            'renovation': 'שיפוץ בריכה',
            'maintenance': 'תחזוקה ושירות'
        };
        return types[poolType] || poolType;
    }
    
    /**
     * Utility functions
     */
    validatePhone(phone) {
        const patterns = [
            /^05[0-9]{8}$/,     // Mobile
            /^0[2-4,8-9][0-9]{7}$/ // Landline
        ];
        return patterns.some(pattern => pattern.test(phone));
    }
    
    formatPhoneDisplay(phone) {
        if (phone.length === 10) {
            return phone.substring(0, 3) + '-' + phone.substring(3, 6) + '-' + phone.substring(6);
        }
        return phone;
    }
    
    showLoading(text) {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        loadingText.textContent = text;
        overlay.style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    showError(message) {
        // You can implement a toast notification system here
        alert(message); // Temporary solution
    }
    
    showSuccess(message) {
        // You can implement a toast notification system here
        console.log('Success:', message);
    }
}

// Initialize quote modal
const quoteModal = new QuoteModal();

// Global functions for HTML onclick events
function openQuoteModal(contractorData) {
    quoteModal.open(contractorData);
}

// Global functions for modal only - renamed to avoid conflicts
function closeQuoteModal() {
    quoteModal.close();
}

function sendVerificationCodeModal() {
    quoteModal.sendVerificationCode();
}

function verifyCodeModal() {
    quoteModal.verifyCode();
}

function resendCodeModal() {
    quoteModal.resendCode();
}

function goToStep(step) {
    quoteModal.goToStep(step);
}

function updatePoolTypeInfo() {
    const poolType = document.getElementById('poolType').value;
    quoteModal.updatePoolTypeInfo(poolType);
}
