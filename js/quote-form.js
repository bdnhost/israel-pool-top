// Quote Form JavaScript

let currentStep = 1;
let verificationTimer;
let isPhoneVerified = false;
let isSendingCode = false; // Prevent double sending

document.addEventListener('DOMContentLoaded', function() {
    initializeQuoteForm();
    loadContractorInfo();
});

function initializeQuoteForm() {
    // Add event listeners
    document.getElementById('sendCodeBtn')?.addEventListener('click', sendVerificationCode);
    document.getElementById('verifyCodeBtn')?.addEventListener('click', verifyCode);
    document.getElementById('resendCodeBtn')?.addEventListener('click', resendCode);
    
    // Form submission
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', submitQuoteRequest);
    }
    
    // Image upload
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    
    if (imageUploadArea && imageInput) {
        imageUploadArea.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageUpload);
    }
    
    // Pool type info
    const poolTypeSelect = document.getElementById('poolType');
    if (poolTypeSelect) {
        poolTypeSelect.addEventListener('change', updatePoolTypeInfo);
    }
}

// Step 1: Phone Verification
async function sendVerificationCode() {
    // Prevent double sending
    if (isSendingCode) {
        console.log('Already sending code, ignoring duplicate call');
        return;
    }

    const phoneInput = document.getElementById('customerPhone');
    const phone = phoneInput.value.trim();

    if (!phone) {
        showAlert('אנא הזן מספר טלפון', 'error');
        return;
    }

    if (!validatePhone(phone)) {
        showAlert('מספר טלפון לא תקין', 'error');
        return;
    }

    isSendingCode = true; // Set flag
    showLoading('שולח קוד אימות...');
    
    try {
        const response = await fetch('/api/quotes.php?action=send_verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone: phone })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showAlert('קוד אימות נשלח בהצלחה', 'success');
            showVerificationSection();
            startTimer();
        } else {
            showAlert(result.message || 'שגיאה בשליחת קוד אימות', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showAlert('שגיאה בחיבור לשרת', 'error');
    } finally {
        isSendingCode = false; // Reset flag
    }
}

async function verifyCode() {
    const phoneInput = document.getElementById('customerPhone');
    const codeInput = document.getElementById('verificationCode');
    const phone = phoneInput.value.trim();
    const code = codeInput.value.trim();
    
    if (!code) {
        showAlert('אנא הזן קוד אימות', 'error');
        return;
    }
    
    showLoading('מאמת קוד...');
    
    try {
        const response = await fetch('/api/quotes.php?action=verify_phone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone: phone, code: code })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showAlert('אימות הצליח!', 'success');
            isPhoneVerified = true;
            goToStep(2);
        } else {
            showAlert(result.message || 'קוד אימות שגוי', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showAlert('שגיאה בחיבור לשרת', 'error');
    }
}

function resendCode() {
    sendVerificationCode();
}

function showVerificationSection() {
    const verificationSection = document.getElementById('verificationSection');
    const phoneDisplay = document.getElementById('phoneDisplay');
    const phone = document.getElementById('customerPhone').value;
    
    if (verificationSection) {
        verificationSection.style.display = 'block';
    }
    
    if (phoneDisplay) {
        phoneDisplay.textContent = phone;
    }
}

function startTimer() {
    let timeLeft = 300; // 5 minutes (same as server)
    const timerElement = document.getElementById('timer');
    const resendBtn = document.getElementById('resendCodeBtn');
    
    if (resendBtn) {
        resendBtn.disabled = true;
    }
    
    verificationTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (timerElement) {
            timerElement.textContent = ` (${minutes}:${seconds.toString().padStart(2, '0')})`;
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(verificationTimer);
            if (timerElement) {
                timerElement.textContent = '';
            }
            if (resendBtn) {
                resendBtn.disabled = false;
            }
        }
    }, 1000);
}

// Step Navigation
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.quote-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = step;
    }
}

// Form Submission
async function submitQuoteRequest(event) {
    event.preventDefault();
    
    if (!isPhoneVerified) {
        showAlert('אנא אמת את מספר הטלפון תחילה', 'error');
        goToStep(1);
        return;
    }
    
    const formData = collectFormData();
    
    if (!validateFormData(formData)) {
        return;
    }
    
    showLoading('שולח בקשה...');
    
    try {
        const response = await fetch('/api/quotes.php?action=submit_quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showSuccessStep(result);
        } else {
            showAlert(result.message || 'שגיאה בשליחת הבקשה', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        showAlert('שגיאה בחיבור לשרת', 'error');
    }
}

function collectFormData() {
    const formData = {
        customer_phone: document.getElementById('customerPhone').value,
        customer_name: document.getElementById('customerName').value,
        customer_email: document.getElementById('customerEmail').value,
        customer_city: document.getElementById('customerCity').value,
        pool_type: document.getElementById('poolType').value,
        pool_size: document.getElementById('poolSize').value,
        budget_range: document.getElementById('budgetRange').value,
        preferred_timing: document.getElementById('preferredTiming').value,
        project_location: document.getElementById('projectLocation').value,
        description: document.getElementById('description').value,
        special_requirements: [],
        selected_contractor: window.selectedContractor || null
    };

    // Collect special requirements
    const requirements = document.querySelectorAll('input[name="requirements[]"]:checked');
    requirements.forEach(req => {
        formData.special_requirements.push(req.value);
    });

    return formData;
}

function validateFormData(data) {
    const required = ['customer_name', 'customer_phone', 'pool_type', 'pool_size', 'budget_range', 'preferred_timing', 'project_location'];
    
    for (const field of required) {
        if (!data[field]) {
            showAlert(`שדה ${getFieldLabel(field)} הוא חובה`, 'error');
            return false;
        }
    }
    
    return true;
}

function getFieldLabel(field) {
    const labels = {
        customer_name: 'שם מלא',
        customer_phone: 'טלפון',
        pool_type: 'סוג בריכה',
        pool_size: 'גודל בריכה',
        budget_range: 'תקציב',
        preferred_timing: 'זמן ביצוע',
        project_location: 'מיקום פרויקט'
    };
    return labels[field] || field;
}

function showSuccessStep(result) {
    goToStep(3);
    
    const successMessage = document.getElementById('successMessage');
    const quoteSummary = document.getElementById('quoteSummary');
    
    if (successMessage) {
        successMessage.textContent = `בקשתך נשלחה ל-${result.contractors_notified || 0} קבלנים באזור`;
    }
    
    if (quoteSummary && result.quote_number) {
        quoteSummary.innerHTML = `
            <h4>פרטי הבקשה</h4>
            <p><strong>מספר בקשה:</strong> ${result.quote_number}</p>
            <p><strong>תאריך:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
        `;
    }
}

// Utility Functions
function validatePhone(phone) {
    const phoneRegex = /^0[5-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, ''));
}

function updatePoolTypeInfo() {
    const poolType = document.getElementById('poolType').value;
    const infoElement = document.getElementById('poolTypeInfo');
    
    const info = {
        concrete: 'בריכה עמידה ומותאמת אישית, זמן בנייה ארוך יותר',
        fiberglass: 'התקנה מהירה, תחזוקה קלה',
        modular: 'פתרון מהיר וחסכוני',
        renovation: 'שיפוץ בריכה קיימת',
        maintenance: 'תחזוקה שוטפת ושירות'
    };
    
    if (infoElement) {
        infoElement.textContent = info[poolType] || '';
    }
}

function handleImageUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('imagePreview');
    
    if (!preview) return;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-preview-item';
                imageItem.innerHTML = `
                    <img src="${e.target.result}" alt="תמונה">
                    <button type="button" class="image-remove" onclick="removeImage(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                preview.appendChild(imageItem);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImage(button) {
    button.parentElement.remove();
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button type="button" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to page
    document.body.insertBefore(alert, document.body.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function showLoading(text = 'טוען...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    if (loadingText) {
        loadingText.textContent = text;
    }
    
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Load contractor info from URL parameter
async function loadContractorInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const contractorId = urlParams.get('contractor');

    if (contractorId && contractorId !== 'null' && contractorId !== 'undefined') {
        try {
            // Fetch contractor details from API
            console.log('Loading contractor ID:', contractorId);
            const response = await fetch(`/api/contractors.php?action=get_contractor&id=${contractorId}`);
            const result = await response.json();

            console.log('API Response:', result);

            if (result.success && result.contractor) {
                const contractor = result.contractor;

                // Update page title to include contractor name
                const pageTitle = document.querySelector('h1');
                if (pageTitle) {
                    pageTitle.innerHTML = `🏊‍♂️ קבל הצעת מחיר מ-${contractor.name}`;
                }

                // Add contractor info section
                const pageDescription = document.querySelector('.page-description');
                if (pageDescription) {
                    pageDescription.innerHTML = `
                        <div class="selected-contractor">
                            <i class="fas fa-user-tie"></i>
                            <strong>קבלן נבחר:</strong> ${contractor.name}
                            <span class="contractor-location">${contractor.city || ''}</span>
                        </div>
                        <p>מלא את הפרטים למטה וקבל הצעת מחיר מקצועית</p>
                    `;
                }

                // Store contractor data for form submission
                window.selectedContractor = {
                    id: contractorId,
                    name: contractor.name,
                    phone: contractor.phone
                };
            } else {
                // Fallback to ID if contractor not found
                const pageTitle = document.querySelector('h1');
                if (pageTitle) {
                    pageTitle.innerHTML = `🏊‍♂️ קבל הצעת מחיר`;
                }
                window.selectedContractor = contractorId;
            }
        } catch (error) {
            console.error('Error loading contractor info:', error);
            // Fallback to basic display
            const pageTitle = document.querySelector('h1');
            if (pageTitle) {
                pageTitle.innerHTML = `🏊‍♂️ קבל הצעת מחיר`;
            }
            window.selectedContractor = contractorId;
        }
    }
}
