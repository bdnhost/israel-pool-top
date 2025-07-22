// Pool Israel - Main JavaScript File

// Global variables
let contractors = [];
let filteredContractors = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentFilters = {
    specialty: '',
    region: '',
    rating: '',
    price: ''
};
let currentSort = 'relevance';
let searchQuery = '';

// API Configuration
const API_BASE_URL = '/api';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize based on current page
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('contractors_page.html')) {
        initializeContractorsPage();
    } else if (currentPath.includes('guides_page.html')) {
        initializeGuidesPage();
    } else if (currentPath.includes('index.html') || currentPath === '/') {
        initializeHomePage();
    }
    
    // Initialize common components
    initializeNavigation();
    initializeSearch();
}

// Contractors Page Functions
async function initializeContractorsPage() {
    try {
        await fetchContractors();
        setupFilters();
        setupPagination();
        setupSorting();
    } catch (error) {
        console.error('Error initializing contractors page:', error);
        showErrorMessage('שגיאה בטעינת נתוני הקבלנים');
    }
}

async function fetchContractors() {
    try {
        showLoadingSpinner();
        
        const response = await fetch(`${API_BASE_URL}/contractors.php`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        contractors = data.contractors || [];
        filteredContractors = [...contractors];
        
        hideLoadingSpinner();
        renderContractors();
        updateHeaderStats();
        updateResultsCount();
        
        console.log(`Loaded ${contractors.length} contractors from API`);
    } catch (error) {
        console.error('Error fetching contractors:', error);
        hideLoadingSpinner();
        
        // Fallback to static data if API fails
        loadFallbackContractors();
    }
}

function loadFallbackContractors() {
    // Minimal fallback data for development
    contractors = [
        {
            id: 1,
            title: "יגל שירותי מים",
            description: "החברה הוותיקה והמובילה בישראל בתחום הקמת בריכות שחייה",
            city: "מושב תעוז",
            categories: ["בריכות בטון", "בריכות פיברגלס"],
            rating: 4.9,
            reviews_count: 234,
            phone: "050-123-4567",
            website: "https://example.com",
            is_featured: true
        },
        {
            id: 2,
            title: "פלגים בריכות שחייה",
            description: "חברה מובילה בתחום הקמת בריכות פרטיות",
            city: "מודיעין",
            categories: ["בריכות בטון", "תחזוקה"],
            rating: 4.7,
            reviews_count: 156,
            phone: "052-987-6543",
            website: "https://example.com",
            is_featured: false
        }
    ];
    
    filteredContractors = [...contractors];
    renderContractors();
    updateHeaderStats();
    updateResultsCount();
    
    console.log('Loaded fallback contractor data');
}

function renderContractors() {
    const container = document.getElementById('contractorsGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const contractorsToShow = filteredContractors.slice(startIndex, endIndex);
    
    if (contractorsToShow.length === 0) {
        container.innerHTML = '<div class="no-results">לא נמצאו קבלנים התואמים לחיפוש</div>';
        return;
    }
    
    contractorsToShow.forEach(contractor => {
        const card = createContractorCard(contractor);
        container.appendChild(card);
    });
    
    updatePagination();
}

function createContractorCard(contractor) {
    const card = document.createElement('div');
    card.className = `contractor-card ${contractor.is_featured ? 'featured-contractor' : ''}`;
    card.dataset.id = contractor.id;
    
    const starsHtml = generateStarsHtml(contractor.rating || 4.5);
    const categoriesHtml = (contractor.categories || []).slice(0, 3)
        .map(cat => `<span class="specialty-tag">${cat}</span>`).join('');
    
    let badgesHtml = '';
    if (contractor.is_featured) {
        badgesHtml += '<span class="badge badge-premium">מומלץ</span>';
    }
    if (contractor.rating >= 4.8) {
        badgesHtml += '<span class="badge badge-verified">דירוג גבוה</span>';
    }
    
    card.innerHTML = `
        <div class="contractor-header">
            <div class="contractor-top">
                <div class="contractor-logo">
                    ${contractor.title.charAt(0)}
                </div>
                <div class="contractor-info">
                    <h3>${contractor.title}</h3>
                    <div class="contractor-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${contractor.city}
                    </div>
                </div>
            </div>
            <div class="contractor-rating">
                <div class="stars">${starsHtml}</div>
                <span class="rating-text">${contractor.rating.toFixed(1)} (${contractor.reviews_count} ביקורות)</span>
            </div>
            <div class="contractor-badges">${badgesHtml}</div>
        </div>
        <div class="contractor-body">
            <div class="contractor-specialties">
                <div class="specialties-title">התמחויות:</div>
                <div class="specialties-list">${categoriesHtml}</div>
            </div>
            <div class="contractor-description">${contractor.description}</div>
            <div class="contractor-actions">
                <a href="tel:${contractor.phone}" class="btn btn-primary btn-sm">התקשר עכשיו</a>
                <a href="${contractor.website}" class="btn btn-outline btn-sm" target="_blank">אתר החברה</a>
            </div>
        </div>
    `;
    
    return card;
}

function generateStarsHtml(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star star"></i>';
    }
    
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt star"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star star"></i>';
    }
    
    return starsHtml;
}

// Filter and Search Functions
function setupFilters() {
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    currentPage = 1;
    
    currentFilters = {
        specialty: document.getElementById('specialtyFilter')?.value || '',
        region: document.getElementById('regionFilter')?.value || '',
        rating: document.getElementById('ratingFilter')?.value || '',
        price: document.getElementById('priceFilter')?.value || ''
    };
    
    filteredContractors = contractors.filter(contractor => {
        // Apply specialty filter
        if (currentFilters.specialty && !contractor.categories.some(cat => 
            cat.includes(getSpecialtyKeyword(currentFilters.specialty)))) {
            return false;
        }
        
        // Apply region filter
        if (currentFilters.region && !matchesRegion(contractor.city, currentFilters.region)) {
            return false;
        }
        
        // Apply rating filter
        if (currentFilters.rating && contractor.rating < parseFloat(currentFilters.rating)) {
            return false;
        }
        
        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return contractor.title.toLowerCase().includes(query) || 
                   contractor.city.toLowerCase().includes(query) || 
                   contractor.description.toLowerCase().includes(query);
        }
        
        return true;
    });
    
    sortContractors();
    renderContractors();
    updateResultsCount();
}

function getSpecialtyKeyword(specialty) {
    const keywords = {
        'concrete': 'בטון',
        'fiberglass': 'פיברגלס',
        'modular': 'מתועשות',
        'maintenance': 'תחזוקה',
        'luxury': 'יוקרה'
    };
    return keywords[specialty] || specialty;
}

function matchesRegion(city, region) {
    const regionMappings = {
        'center': ['מרכז', 'תל אביב', 'רמת גן', 'פתח תקווה', 'מודיעין'],
        'north': ['צפון', 'חיפה', 'נצרת', 'כרמיאל', 'עכו'],
        'south': ['דרום', 'באר שבע', 'אשדוד', 'אשקלון'],
        'jerusalem': ['ירושלים', 'בית שמש']
    };
    
    return regionMappings[region]?.some(r => city.includes(r)) || false;
}

// Utility Functions
function showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'block';
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem;
        border-radius: 6px;
        z-index: 9999;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Navigation and Common Functions
function initializeNavigation() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

function initializeSearch() {
    const searchInput = document.getElementById('locationSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFilters();
        });
    }
}

function initializeHomePage() {
    // Home page specific initialization
    console.log('Home page initialized');
}

function initializeGuidesPage() {
    // Guides page specific initialization
    console.log('Guides page initialized');
}
