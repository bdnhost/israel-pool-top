/* Pool Israel - Contractors Page JavaScript */
/* ========================================== */

// Global variables
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    search: '',
    city: '',
    category: '',
    rating: '',
    sort: 'featured'
};
let currentView = 'grid';
let contractorsData = [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const cityFilter = document.getElementById('cityFilter');
const categoryFilter = document.getElementById('categoryFilter');
const ratingFilter = document.getElementById('ratingFilter');
const sortSelect = document.getElementById('sortSelect');
const clearFiltersBtn = document.getElementById('clearFilters');
const viewBtns = document.querySelectorAll('.view-btn');
const contractorsGrid = document.getElementById('contractorsGrid');
const contractorsList = document.getElementById('contractorsList');
const loadingState = document.getElementById('loadingState');
const resultsCount = document.getElementById('resultsCount');
const pagination = document.getElementById('pagination');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadContractors();
    
    // Load URL parameters if any
    loadURLParameters();
});

// Event Listeners
function initializeEventListeners() {
    // Search input with debounce
    searchInput.addEventListener('input', PoolIsrael.debounce(function() {
        currentFilters.search = this.value;
        currentPage = 1;
        loadContractors();
    }, 500));
    
    // Filter selects
    cityFilter.addEventListener('change', function() {
        currentFilters.city = this.value;
        currentPage = 1;
        loadContractors();
        updateURL();
    });
    
    categoryFilter.addEventListener('change', function() {
        currentFilters.category = this.value;
        currentPage = 1;
        loadContractors();
        updateURL();
    });
    
    ratingFilter.addEventListener('change', function() {
        currentFilters.rating = this.value;
        currentPage = 1;
        loadContractors();
        updateURL();
    });
    
    // Sort select
    sortSelect.addEventListener('change', function() {
        currentFilters.sort = this.value;
        currentPage = 1;
        loadContractors();
        updateURL();
    });
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', function() {
        clearAllFilters();
    });
    
    // View toggle
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            switchView(view);
        });
    });
}

// Load contractors from API
async function loadContractors() {
    try {
        showLoading(true);
        
        // Build API URL with parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 12,
            search: currentFilters.search,
            city: currentFilters.city,
            category: currentFilters.category,
            min_rating: currentFilters.rating,
            sort: currentFilters.sort
        });
        
        // Remove empty parameters
        for (let [key, value] of [...params]) {
            if (!value) params.delete(key);
        }
        
        const response = await fetch(`api/contractors.php?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            contractorsData = data.contractors;
            totalPages = data.pagination.total_pages;
            currentPage = data.pagination.current_page;
            
            displayContractors();
            updateResultsCount(data.pagination.total_count);
            updatePagination();
        } else {
            throw new Error(data.message || 'Failed to load contractors');
        }
        
    } catch (error) {
        console.error('Error loading contractors:', error);
        showError('שגיאה בטעינת הקבלנים. אנא נסה שוב.');
    } finally {
        showLoading(false);
    }
}

// Display contractors in current view
function displayContractors() {
    if (currentView === 'grid') {
        displayContractorsGrid();
    } else {
        displayContractorsList();
    }
}

// Display contractors in grid view
function displayContractorsGrid() {
    contractorsGrid.innerHTML = '';
    
    if (contractorsData.length === 0) {
        contractorsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3>לא נמצאו קבלנים</h3>
                <p>נסה לשנות את הפילטרים או החיפוש</p>
            </div>
        `;
        return;
    }
    
    contractorsData.forEach(contractor => {
        const contractorCard = createContractorCard(contractor);
        contractorsGrid.appendChild(contractorCard);
    });
}

// Display contractors in list view
function displayContractorsList() {
    contractorsList.innerHTML = '';
    
    if (contractorsData.length === 0) {
        contractorsList.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3>לא נמצאו קבלנים</h3>
                <p>נסה לשנות את הפילטרים או החיפוש</p>
            </div>
        `;
        return;
    }
    
    contractorsData.forEach(contractor => {
        const contractorCard = createContractorListItem(contractor);
        contractorsList.appendChild(contractorCard);
    });
}

// Create contractor card element
// רק תחליף את הפונקציה הזו בקובץ contractors.js הקיים שלך:

function createContractorCard(contractor) {
    const card = document.createElement('div');
    card.className = `contractor-card ${contractor.is_featured ? 'featured' : ''}`;
    card.dataset.contractorId = contractor.id;

    const categories = Array.isArray(contractor.categories) ? contractor.categories : [];
    const specialtiesTags = categories.map(cat =>
        `<span class="specialty-tag">${cat}</span>`
    ).join('');

    const stars = generateStars(contractor.rating);

    // Format phone number for display
    const phoneDisplay = contractor.phone ? formatPhoneDisplay(contractor.phone) : null;

    // Format website for display
    const websiteDisplay = contractor.website ?
        contractor.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;

    // הוספה חדשה - שעות פתיחה
    let openingHoursHTML = '';
    if (contractor.openingHours && Array.isArray(contractor.openingHours)) {
        const today = new Date().getDay();
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        const todayName = 'יום ' + dayNames[today];
        
        const todayHours = contractor.openingHours.find(day => day.day === todayName);
        const isOpen = todayHours && todayHours.hours !== 'סגור';
        
        openingHoursHTML = `
            <div class="opening-hours">
                <div class="hours-today">
                    <i class="fas fa-clock"></i>
                    <span class="${isOpen ? 'open' : 'closed'}">
                        ${todayHours ? `היום: ${todayHours.hours}` : 'שעות לא זמינות'}
                    </span>
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="contractor-header">
            <div class="contractor-top">
                <div class="contractor-avatar">
                    ${contractor.title.charAt(0)}
                </div>
                <div class="contractor-info">
                    <h3>${contractor.title}</h3>
                    <div class="contractor-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${contractor.city}
                    </div>
                    ${contractor.address ? `
                        <div class="contractor-address">
                            <i class="fas fa-home"></i>
                            ${contractor.address}
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="contractor-rating">
                <div class="stars">${stars}</div>
                <span class="rating-text">${contractor.rating} (${contractor.reviews_count} ביקורות)</span>
            </div>

            <div class="contractor-contact-info">
                ${phoneDisplay ? `
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <span>${phoneDisplay}</span>
                    </div>
                ` : ''}
                ${websiteDisplay ? `
                    <div class="contact-item">
                        <i class="fas fa-globe"></i>
                        <span>${websiteDisplay}</span>
                    </div>
                ` : ''}
            </div>

            <div class="contractor-specialties">
                <div class="specialties-list">
                    ${specialtiesTags}
                </div>
            </div>

            ${openingHoursHTML}

            ${contractor.description ? `
                <p class="contractor-description">${contractor.description}</p>
            ` : ''}
        </div>

        <div class="contractor-actions">
            ${phoneDisplay ? `
                <button class="btn-contact" onclick="contactContractor(${contractor.id})">
                    <i class="fas fa-phone"></i>
                    התקשר
                </button>
            ` : ''}
            ${websiteDisplay ? `
                <button class="btn-website" onclick="visitWebsite(${contractor.id})">
                    <i class="fas fa-globe"></i>
                    אתר
                </button>
            ` : ''}
            <button class="btn-quote" onclick="requestQuote(${contractor.id})">
                <i class="fas fa-calculator"></i>
                הצעת מחיר
            </button>
            <button class="btn-details" onclick="showContractorDetails(${contractor.id})">
                <i class="fas fa-info-circle"></i>
                מידע נוסף
            </button>
        </div>
    `;

    return card;
}

// Create contractor list item
function createContractorListItem(contractor) {
    const item = document.createElement('div');
    item.className = `contractor-card ${contractor.is_featured ? 'featured' : ''}`;
    item.style.cssText = 'display: flex; align-items: center; padding: 1.5rem;';
    
    const categories = Array.isArray(contractor.categories) ? contractor.categories : [];
    const specialtiesTags = categories.map(cat => 
        `<span class="specialty-tag">${cat}</span>`
    ).join('');
    
    const stars = generateStars(contractor.rating);
    
    item.innerHTML = `
        <div class="contractor-avatar" style="margin-left: 1rem;">
            ${contractor.title.charAt(0)}
        </div>
        <div style="flex: 1;">
            <h3 style="margin-bottom: 0.5rem;">${contractor.title}</h3>
            <div class="contractor-location" style="margin-bottom: 0.5rem;">
                <i class="fas fa-map-marker-alt"></i>
                ${contractor.city}
            </div>
            <div class="contractor-rating" style="margin-bottom: 0.5rem;">
                <div class="stars">${stars}</div>
                <span class="rating-text">${contractor.rating} (${contractor.reviews_count} ביקורות)</span>
            </div>
            <div class="specialties-list">
                ${specialtiesTags}
            </div>
        </div>
        <div class="contractor-actions" style="flex-direction: column; width: 200px;">
            <button class="btn-contact" onclick="contactContractor(${contractor.id})" style="margin-bottom: 0.5rem;">
                <i class="fas fa-phone"></i>
                צור קשר
            </button>
            <button class="btn-quote" onclick="requestQuote(${contractor.id})">
                <i class="fas fa-calculator"></i>
                הצעת מחיר
            </button>
        </div>
    `;
    
    return item;
}

// Generate stars HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star empty"></i>';
    }
    
    return starsHTML;
}

// Switch between grid and list view
function switchView(view) {
    currentView = view;
    
    // Update buttons
    viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update containers
    if (view === 'grid') {
        contractorsGrid.classList.add('active');
        contractorsList.classList.remove('active');
        contractorsGrid.style.display = 'grid';
        contractorsList.style.display = 'none';
    } else {
        contractorsGrid.classList.remove('active');
        contractorsList.classList.add('active');
        contractorsGrid.style.display = 'none';
        contractorsList.style.display = 'flex';
    }
    
    displayContractors();
}

// Clear all filters
function clearAllFilters() {
    searchInput.value = '';
    cityFilter.value = '';
    categoryFilter.value = '';
    ratingFilter.value = '';
    sortSelect.value = 'featured';
    
    currentFilters = {
        search: '',
        city: '',
        category: '',
        rating: '',
        sort: 'featured'
    };
    
    currentPage = 1;
    loadContractors();
    updateURL();
}

// Update results count
function updateResultsCount(count) {
    resultsCount.textContent = `נמצאו ${count} קבלנים`;
}

// Update pagination
function updatePagination() {
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i> הקודם';
        prevBtn.onclick = () => goToPage(currentPage - 1);
        pagination.appendChild(prevBtn);
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = 'הבא <i class="fas fa-chevron-left"></i>';
        nextBtn.onclick = () => goToPage(currentPage + 1);
        pagination.appendChild(nextBtn);
    }
}

// Go to specific page
function goToPage(page) {
    currentPage = page;
    loadContractors();
    updateURL();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show/hide loading state
function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
    contractorsGrid.style.display = show ? 'none' : (currentView === 'grid' ? 'grid' : 'none');
    contractorsList.style.display = show ? 'none' : (currentView === 'list' ? 'flex' : 'none');
}

// Show error message
function showError(message) {
    contractorsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--red); margin-bottom: 1rem;"></i>
            <h3>שגיאה</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="loadContractors()" style="margin-top: 1rem;">
                נסה שוב
            </button>
        </div>
    `;
}

// Format phone number for display
function formatPhoneDisplay(phone) {
    if (!phone) return null;

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Format Israeli phone numbers
    if (digits.length === 10 && digits.startsWith('0')) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 12 && digits.startsWith('972')) {
        return `0${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
    }

    return phone; // Return original if can't format
}

// Contact contractor
function contactContractor(contractorId) {
    const contractor = contractorsData.find(c => c.id == contractorId);
    if (contractor && contractor.phone) {
        window.open(`tel:${contractor.phone}`, '_self');
    } else {
        alert('מספר הטלפון לא זמין');
    }
}

// Visit contractor website
function visitWebsite(contractorId) {
    const contractor = contractorsData.find(c => c.id == contractorId);
    if (contractor && contractor.website) {
        let url = contractor.website;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        alert('אתר האינטרנט לא זמין');
    }
}

// Request quote from contractor
function requestQuote(contractorId) {
    // Redirect to quote page with contractor pre-selected
    window.location.href = `quote_modal.html?contractor=${contractorId}`;
}

// Show contractor details modal
function showContractorDetails(contractorId) {
    // Convert to string for comparison since IDs come as strings from API
    const contractor = contractorsData.find(c => c.id == contractorId);
    if (!contractor) {
        alert('פרטי הקבלן לא נמצאו');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'contractor-modal';
    modal.innerHTML = createContractorDetailsModal(contractor);

    // Add to page
    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => modal.classList.add('show'), 10);

    // Close modal events
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            closeContractorModal(modal);
        }
    });

    // ESC key to close
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeContractorModal(modal);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Create contractor details modal content
function createContractorDetailsModal(contractor) {
    const categories = Array.isArray(contractor.categories) ? contractor.categories : [];
    const specialtiesTags = categories.map(cat =>
        `<span class="specialty-tag">${cat}</span>`
    ).join('');

    const stars = generateStars(contractor.rating);
    const phoneDisplay = contractor.phone ? formatPhoneDisplay(contractor.phone) : null;
    const websiteDisplay = contractor.website ?
        contractor.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;

    // Parse opening hours if available
    let openingHoursHTML = '';
    if (contractor.opening_hours) {
        try {
            const hours = typeof contractor.opening_hours === 'string' ?
                JSON.parse(contractor.opening_hours) : contractor.opening_hours;

            if (Array.isArray(hours) && hours.length > 0) {
                openingHoursHTML = `
                    <div class="detail-section">
                        <h4><i class="fas fa-clock"></i> שעות פעילות</h4>
                        <div class="opening-hours">
                            ${hours.map(hour => `
                                <div class="hour-item">
                                    <span class="day">${hour.day}</span>
                                    <span class="time">${hour.hours}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            console.log('Error parsing opening hours:', e);
        }
    }

    return `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${contractor.title}</h2>
                    <button class="modal-close" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="modal-body">
                    <div class="contractor-details-grid">
                        <div class="detail-section">
                            <h4><i class="fas fa-info-circle"></i> פרטים כלליים</h4>
                            <div class="detail-item">
                                <strong>שם העסק:</strong> ${contractor.title}
                            </div>
                            ${contractor.description ? `
                                <div class="detail-item">
                                    <strong>תיאור:</strong> ${contractor.description}
                                </div>
                            ` : ''}
                            <div class="detail-item">
                                <strong>דירוג:</strong>
                                <div class="stars inline">${stars}</div>
                                ${contractor.rating} (${contractor.reviews_count} ביקורות)
                            </div>
                            <div class="detail-item">
                                <strong>סטטוס:</strong>
                                <span class="status-badge ${contractor.status || 'active'}">${getStatusText(contractor.status)}</span>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-map-marker-alt"></i> מיקום</h4>
                            <div class="detail-item">
                                <strong>עיר:</strong> ${contractor.city}
                            </div>
                            ${contractor.address ? `
                                <div class="detail-item">
                                    <strong>כתובת:</strong> ${contractor.address}
                                </div>
                            ` : ''}
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-phone"></i> פרטי קשר</h4>
                            ${phoneDisplay ? `
                                <div class="detail-item">
                                    <strong>טלפון:</strong>
                                    <a href="tel:${contractor.phone}" class="contact-link">
                                        ${phoneDisplay}
                                    </a>
                                </div>
                            ` : ''}
                            ${websiteDisplay ? `
                                <div class="detail-item">
                                    <strong>אתר אינטרנט:</strong>
                                    <a href="${contractor.website.startsWith('http') ? contractor.website : 'https://' + contractor.website}"
                                       target="_blank" rel="noopener" class="contact-link">
                                        ${websiteDisplay}
                                    </a>
                                </div>
                            ` : ''}
                        </div>

                        ${categories.length > 0 ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-tools"></i> התמחויות</h4>
                                <div class="specialties-list">
                                    ${specialtiesTags}
                                </div>
                            </div>
                        ` : ''}

                        ${openingHoursHTML}
                    </div>
                </div>

                <div class="modal-footer">
                    ${phoneDisplay ? `
                        <button class="btn btn-primary" onclick="contactContractor(${contractor.id})">
                            <i class="fas fa-phone"></i>
                            התקשר עכשיו
                        </button>
                    ` : ''}
                    ${websiteDisplay ? `
                        <button class="btn btn-outline" onclick="visitWebsite(${contractor.id})">
                            <i class="fas fa-globe"></i>
                            בקר באתר
                        </button>
                    ` : ''}
                    <button class="btn btn-primary" onclick="requestQuote(${contractor.id})">
                        <i class="fas fa-calculator"></i>
                        בקש הצעת מחיר
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Get status text in Hebrew
function getStatusText(status) {
    const statusMap = {
        'active': 'פעיל',
        'inactive': 'לא פעיל',
        'pending': 'ממתין לאישור'
    };
    return statusMap[status] || 'פעיל';
}

// Close contractor modal
function closeContractorModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

// URL management
function updateURL() {
    const params = new URLSearchParams();
    
    if (currentFilters.search) params.set('search', currentFilters.search);
    if (currentFilters.city) params.set('city', currentFilters.city);
    if (currentFilters.category) params.set('category', currentFilters.category);
    if (currentFilters.rating) params.set('rating', currentFilters.rating);
    if (currentFilters.sort !== 'featured') params.set('sort', currentFilters.sort);
    if (currentPage > 1) params.set('page', currentPage);
    
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newURL);
}

function loadURLParameters() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('search')) {
        currentFilters.search = params.get('search');
        searchInput.value = currentFilters.search;
    }
    
    if (params.get('city')) {
        currentFilters.city = params.get('city');
        cityFilter.value = currentFilters.city;
    }
    
    if (params.get('category')) {
        currentFilters.category = params.get('category');
        categoryFilter.value = currentFilters.category;
    }
    
    if (params.get('rating')) {
        currentFilters.rating = params.get('rating');
        ratingFilter.value = currentFilters.rating;
    }
    
    if (params.get('sort')) {
        currentFilters.sort = params.get('sort');
        sortSelect.value = currentFilters.sort;
    }
    
    if (params.get('page')) {
        currentPage = parseInt(params.get('page')) || 1;
    }
}