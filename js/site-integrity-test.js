/* Pool Israel - Site Integrity Test JavaScript */
/* ============================================== */

// Global test state
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
};

// Main pages to test
const mainPages = [
    'home.html',
    'contractors_page.html',
    'guides_page.html',
    'quote_modal.html',
    'privacy-policy.html',
    'terms-of-service.html'
];

// All pages to test
const allPages = [
    ...mainPages,
    'admin/index.html',
    'contractor/dashboard.html',
    'guide_complete_pool_building_2025.html',
    'guide_choosing_contractor.html',
    'guide_pool_safety_children.html',
    'guide_planning_stages.html',
    'guide_annual_maintenance.html'
];

// CSS and JS files to test
const assets = {
    css: [
        'css/template.css',
        'css/main.css',
        'css/responsive.css',
        'css/breadcrumbs.css',
        'css/quote-form.css'
    ],
    js: [
        'js/template.js',
        'js/main.js',
        'js/contractors.js',
        'js/quote-form.js'
    ]
};

// API endpoints to test
const apiEndpoints = [
    'api/contractors.php',
    'api/quotes.php',
    'api/admin.php'
];

// Utility functions
function updateProgress(percentage) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = percentage + '%';
}

function updateStatus(message) {
    document.getElementById('overallStatus').textContent = message;
}

function showResult(elementId, content, type = 'info') {
    const element = document.getElementById(elementId);
    element.innerHTML = content;
    element.className = `result ${type}`;
}

function addTestResult(passed, warning = false) {
    testResults.total++;
    if (passed) {
        if (warning) {
            testResults.warnings++;
        } else {
            testResults.passed++;
        }
    } else {
        testResults.failed++;
    }
    updateTestSummary();
}

function updateTestSummary() {
    const summary = document.getElementById('testSummary');
    summary.style.display = 'block';
    
    document.getElementById('totalTests').textContent = testResults.total;
    document.getElementById('passedTests').textContent = testResults.passed;
    document.getElementById('failedTests').textContent = testResults.failed;
    document.getElementById('warningTests').textContent = testResults.warnings;
    
    const successRate = testResults.total > 0 ? 
        Math.round(((testResults.passed + testResults.warnings) / testResults.total) * 100) : 0;
    document.getElementById('successRate').textContent = successRate + '%';
}

// Test functions
async function testAllPages() {
    showResult('pagesResult', 'בודק את כל הדפים...', 'info');
    updateStatus('בודק דפים...');
    
    let results = '🔍 בדיקת כל הדפים:\n\n';
    let totalPages = 0;
    let workingPages = 0;
    
    for (const page of allPages) {
        try {
            const response = await fetch(page, { method: 'HEAD' });
            totalPages++;
            
            if (response.ok) {
                results += `✅ ${page} - תקין (${response.status})\n`;
                workingPages++;
                addTestResult(true);
            } else {
                results += `❌ ${page} - שגיאה (${response.status})\n`;
                addTestResult(false);
            }
        } catch (error) {
            results += `❌ ${page} - לא נמצא\n`;
            totalPages++;
            addTestResult(false);
        }
    }
    
    results += `\n📊 סיכום: ${workingPages}/${totalPages} דפים עובדים`;
    
    const type = workingPages === totalPages ? 'success' : 
                 workingPages > totalPages * 0.8 ? 'warning' : 'error';
    
    showResult('pagesResult', results, type);
    updateProgress(25);
}

async function testMainPages() {
    showResult('pagesResult', 'בודק דפים עיקריים...', 'info');
    
    let results = '🔍 בדיקת דפים עיקריים:\n\n';
    let totalPages = 0;
    let workingPages = 0;
    
    for (const page of mainPages) {
        try {
            const response = await fetch(page, { method: 'HEAD' });
            totalPages++;
            
            if (response.ok) {
                results += `✅ ${page} - תקין\n`;
                workingPages++;
                addTestResult(true);
            } else {
                results += `❌ ${page} - שגיאה (${response.status})\n`;
                addTestResult(false);
            }
        } catch (error) {
            results += `❌ ${page} - לא נמצא\n`;
            totalPages++;
            addTestResult(false);
        }
    }
    
    results += `\n📊 סיכום: ${workingPages}/${totalPages} דפים עיקריים עובדים`;
    
    const type = workingPages === totalPages ? 'success' : 'error';
    showResult('pagesResult', results, type);
}

async function testAllLinks() {
    showResult('linksResult', 'בודק קישורים...', 'info');
    updateStatus('בודק קישורים...');
    
    let results = '🔗 בדיקת קישורים:\n\n';
    
    // Test navigation links
    const navLinks = [
        'home.html',
        'contractors_page.html',
        'guides_page.html',
        'quote_modal.html'
    ];
    
    let workingLinks = 0;
    let totalLinks = navLinks.length;
    
    for (const link of navLinks) {
        try {
            const response = await fetch(link, { method: 'HEAD' });
            if (response.ok) {
                results += `✅ ${link} - קישור תקין\n`;
                workingLinks++;
                addTestResult(true);
            } else {
                results += `❌ ${link} - קישור שבור\n`;
                addTestResult(false);
            }
        } catch (error) {
            results += `❌ ${link} - קישור לא נגיש\n`;
            addTestResult(false);
        }
    }
    
    results += `\n📊 סיכום: ${workingLinks}/${totalLinks} קישורים עובדים`;
    
    const type = workingLinks === totalLinks ? 'success' : 'error';
    showResult('linksResult', results, type);
    updateProgress(35);
}

async function testInternalLinks() {
    showResult('linksResult', 'בודק קישורים פנימיים...', 'info');
    
    let results = '🔗 בדיקת קישורים פנימיים:\n\n';
    
    // Test anchor links
    const anchorLinks = ['#contact', '#about', '#services'];
    
    for (const anchor of anchorLinks) {
        // Check if anchor exists in home page
        try {
            const response = await fetch('home.html');
            const html = await response.text();
            
            if (html.includes(`id="${anchor.substring(1)}"`) || 
                html.includes(`name="${anchor.substring(1)}"`)) {
                results += `✅ ${anchor} - עוגן נמצא\n`;
                addTestResult(true);
            } else {
                results += `⚠️ ${anchor} - עוגן לא נמצא\n`;
                addTestResult(true, true);
            }
        } catch (error) {
            results += `❌ ${anchor} - שגיאה בבדיקה\n`;
            addTestResult(false);
        }
    }
    
    showResult('linksResult', results, 'warning');
}

async function testAssets() {
    showResult('assetsResult', 'בודק נכסים...', 'info');
    updateStatus('בודק CSS ו-JavaScript...');
    
    let results = '🎨 בדיקת נכסים:\n\n';
    let totalAssets = 0;
    let workingAssets = 0;
    
    // Test CSS files
    results += 'קבצי CSS:\n';
    for (const css of assets.css) {
        try {
            const response = await fetch(css, { method: 'HEAD' });
            totalAssets++;
            
            if (response.ok) {
                results += `✅ ${css} - תקין\n`;
                workingAssets++;
                addTestResult(true);
            } else {
                results += `❌ ${css} - לא נמצא\n`;
                addTestResult(false);
            }
        } catch (error) {
            results += `❌ ${css} - שגיאה\n`;
            totalAssets++;
            addTestResult(false);
        }
    }
    
    results += '\nקבצי JavaScript:\n';
    for (const js of assets.js) {
        try {
            const response = await fetch(js, { method: 'HEAD' });
            totalAssets++;
            
            if (response.ok) {
                results += `✅ ${js} - תקין\n`;
                workingAssets++;
                addTestResult(true);
            } else {
                results += `❌ ${js} - לא נמצא\n`;
                addTestResult(false);
            }
        } catch (error) {
            results += `❌ ${js} - שגיאה\n`;
            totalAssets++;
            addTestResult(false);
        }
    }
    
    results += `\n📊 סיכום: ${workingAssets}/${totalAssets} נכסים תקינים`;
    
    const type = workingAssets === totalAssets ? 'success' : 
                 workingAssets > totalAssets * 0.8 ? 'warning' : 'error';
    
    showResult('assetsResult', results, type);
    updateProgress(45);
}

async function testCSS() {
    showResult('assetsResult', 'בודק קבצי CSS...', 'info');
    
    let results = '🎨 בדיקת קבצי CSS:\n\n';
    
    for (const css of assets.css) {
        try {
            const response = await fetch(css);
            if (response.ok) {
                const content = await response.text();
                const size = (content.length / 1024).toFixed(2);
                results += `✅ ${css} - תקין (${size}KB)\n`;
                addTestResult(true);
            } else {
                results += `❌ ${css} - שגיאה\n`;
                addTestResult(false);
            }
        } catch (error) {
            results += `❌ ${css} - לא נגיש\n`;
            addTestResult(false);
        }
    }
    
    showResult('assetsResult', results, 'success');
}

async function testAllAPIs() {
    showResult('apiResult', 'בודק APIs...', 'info');
    updateStatus('בודק API endpoints...');
    
    let results = '🔌 בדיקת APIs:\n\n';
    let workingAPIs = 0;
    let totalAPIs = apiEndpoints.length;
    
    for (const endpoint of apiEndpoints) {
        try {
            const response = await fetch(endpoint);
            
            if (response.ok) {
                const data = await response.json();
                results += `✅ ${endpoint} - תקין\n`;
                workingAPIs++;
                addTestResult(true);
            } else {
                results += `❌ ${endpoint} - שגיאה (${response.status})\n`;
                addTestResult(false);
            }
        } catch (error) {
            results += `❌ ${endpoint} - לא נגיש\n`;
            addTestResult(false);
        }
    }
    
    results += `\n📊 סיכום: ${workingAPIs}/${totalAPIs} APIs עובדים`;
    
    const type = workingAPIs === totalAPIs ? 'success' : 'error';
    showResult('apiResult', results, type);
    updateProgress(55);
}

async function testContractorsAPI() {
    showResult('apiResult', 'בודק API קבלנים...', 'info');
    
    let results = '🔌 בדיקת API קבלנים:\n\n';
    
    try {
        // Test basic endpoint
        const response = await fetch('api/contractors.php?limit=5');
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                results += `✅ API בסיסי - תקין\n`;
                results += `📊 נמצאו ${data.pagination.total_count} קבלנים\n`;
                results += `📄 ${data.contractors.length} קבלנים בדף\n`;
                addTestResult(true);
                
                // Test with filters
                const filterResponse = await fetch('api/contractors.php?city=תל אביב&limit=3');
                if (filterResponse.ok) {
                    const filterData = await filterResponse.json();
                    results += `✅ פילטרים - תקינים\n`;
                    results += `🏙️ ${filterData.pagination.total_count} קבלנים בתל אביב\n`;
                    addTestResult(true);
                } else {
                    results += `❌ פילטרים - שגיאה\n`;
                    addTestResult(false);
                }
                
            } else {
                results += `❌ API מחזיר שגיאה: ${data.message}\n`;
                addTestResult(false);
            }
        } else {
            results += `❌ API לא נגיש (${response.status})\n`;
            addTestResult(false);
        }
    } catch (error) {
        results += `❌ שגיאה בחיבור ל-API: ${error.message}\n`;
        addTestResult(false);
    }
    
    showResult('apiResult', results, 'success');
}

async function testDatabase() {
    showResult('databaseResult', 'בודק מסד נתונים...', 'info');
    updateStatus('בודק מסד נתונים...');
    
    let results = '🗄️ בדיקת מסד נתונים:\n\n';
    
    try {
        // Test database connection through API
        const response = await fetch('api/contractors.php?debug=1&limit=1');
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                results += `✅ חיבור למסד נתונים - תקין\n`;
                results += `📊 סה"כ קבלנים: ${data.pagination.total_count}\n`;
                addTestResult(true);
                
                // Test data quality
                if (data.contractors.length > 0) {
                    const contractor = data.contractors[0];
                    results += `✅ איכות נתונים - תקינה\n`;
                    results += `📝 דוגמה: ${contractor.title}\n`;
                    results += `⭐ דירוג: ${contractor.rating}\n`;
                    addTestResult(true);
                } else {
                    results += `⚠️ אין נתונים במסד\n`;
                    addTestResult(true, true);
                }
                
            } else {
                results += `❌ שגיאה במסד נתונים: ${data.message}\n`;
                addTestResult(false);
            }
        } else {
            results += `❌ לא ניתן לגשת למסד נתונים\n`;
            addTestResult(false);
        }
    } catch (error) {
        results += `❌ שגיאה בחיבור: ${error.message}\n`;
        addTestResult(false);
    }
    
    showResult('databaseResult', results, 'success');
    updateProgress(65);
}

async function testTables() {
    showResult('databaseResult', 'בודק טבלאות...', 'info');
    
    let results = '🗄️ בדיקת טבלאות:\n\n';
    
    // This would require a specific API endpoint to check tables
    results += `⚠️ בדיקת טבלאות דורשת גישה ישירה למסד נתונים\n`;
    results += `💡 ניתן לבדוק דרך phpMyAdmin או כלי ניהול מסד נתונים\n`;
    results += `📋 טבלאות צפויות:\n`;
    results += `   - contractors\n`;
    results += `   - quotes\n`;
    results += `   - users\n`;
    results += `   - admin_users\n`;
    results += `   - sms_verifications\n`;
    
    addTestResult(true, true);
    showResult('databaseResult', results, 'warning');
}

// Quick action functions
async function runAllTests() {
    updateStatus('מריץ את כל הבדיקות...');
    testResults = { total: 0, passed: 0, failed: 0, warnings: 0 };
    
    await testMainPages();
    await testAllLinks();
    await testAssets();
    await testAllAPIs();
    await testDatabase();
    
    updateProgress(100);
    updateStatus('כל הבדיקות הושלמו');
}

async function runCriticalTests() {
    updateStatus('מריץ בדיקות קריטיות...');
    testResults = { total: 0, passed: 0, failed: 0, warnings: 0 };
    
    await testMainPages();
    await testContractorsAPI();
    await testDatabase();
    
    updateProgress(100);
    updateStatus('בדיקות קריטיות הושלמו');
}

async function runPerformanceTests() {
    updateStatus('מריץ בדיקות ביצועים...');
    await testPerformance();
    updateProgress(100);
    updateStatus('בדיקות ביצועים הושלמו');
}

function clearAllResults() {
    const resultElements = document.querySelectorAll('.result');
    resultElements.forEach(element => {
        element.innerHTML = 'לחץ על כפתור לבדיקה';
        element.className = 'result';
    });
    
    testResults = { total: 0, passed: 0, failed: 0, warnings: 0 };
    updateTestSummary();
    updateProgress(0);
    updateStatus('מוכן לבדיקה');
    
    document.getElementById('testSummary').style.display = 'none';
}

// Additional test functions (stubs for now)
async function testResponsive() {
    showResult('responsiveResult', '📱 בדיקת Responsive:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק את האתר בגדלי מסך שונים', 'warning');
    addTestResult(true, true);
}

async function testMobile() {
    showResult('responsiveResult', '📱 בדיקת מובייל:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק תפריט המבורגר ותצוגה במובייל', 'warning');
    addTestResult(true, true);
}

async function testSEO() {
    showResult('seoResult', '🔍 בדיקת SEO:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק meta tags, כותרות ותוכן', 'warning');
    addTestResult(true, true);
}

async function testMetaTags() {
    showResult('seoResult', '🏷️ בדיקת Meta Tags:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק title, description ו-keywords', 'warning');
    addTestResult(true, true);
}

async function testPerformance() {
    showResult('performanceResult', '⚡ בדיקת ביצועים:\n\nמודד זמני טעינה...', 'info');
    
    const startTime = performance.now();
    
    try {
        await fetch('home.html');
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);
        
        let results = '⚡ בדיקת ביצועים:\n\n';
        results += `🏠 דף הבית: ${loadTime}ms\n`;
        
        if (loadTime < 1000) {
            results += `✅ זמן טעינה מצוין\n`;
            addTestResult(true);
        } else if (loadTime < 3000) {
            results += `⚠️ זמן טעינה סביר\n`;
            addTestResult(true, true);
        } else {
            results += `❌ זמן טעינה איטי\n`;
            addTestResult(false);
        }
        
        showResult('performanceResult', results, loadTime < 1000 ? 'success' : 'warning');
    } catch (error) {
        showResult('performanceResult', `❌ שגיאה בבדיקת ביצועים: ${error.message}`, 'error');
        addTestResult(false);
    }
}

async function testLoadTimes() {
    showResult('performanceResult', '⏱️ בדיקת זמני טעינה:\n\n⚠️ בדיקה ידנית נדרשת\n💡 השתמש בכלי Developer Tools', 'warning');
    addTestResult(true, true);
}

async function testSecurity() {
    showResult('securityResult', '🔒 בדיקת אבטחה:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק HTTPS, headers ואבטחת טפסים', 'warning');
    addTestResult(true, true);
}

async function testHeaders() {
    showResult('securityResult', '📋 בדיקת Headers:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק security headers בכלי Developer Tools', 'warning');
    addTestResult(true, true);
}

async function testForms() {
    showResult('formsResult', '📝 בדיקת טפסים:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק טופס הצעת מחיר ואימות שדות', 'warning');
    addTestResult(true, true);
}

async function testQuoteForm() {
    showResult('formsResult', '💰 בדיקת טופס הצעת מחיר:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק שליחה ואימות SMS', 'warning');
    addTestResult(true, true);
}

async function testImages() {
    showResult('imagesResult', '🖼️ בדיקת תמונות:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק טעינת תמונות ו-alt text', 'warning');
    addTestResult(true, true);
}

async function testImageOptimization() {
    showResult('imagesResult', '🗜️ בדיקת אופטימיזציה:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק גדלי קבצים ודחיסה', 'warning');
    addTestResult(true, true);
}

async function testAccessibility() {
    showResult('accessibilityResult', '♿ בדיקת נגישות:\n\n⚠️ בדיקה ידנית נדרשת\n💡 בדוק ניווט במקלדת וקוראי מסך', 'warning');
    addTestResult(true, true);
}

async function testWCAG() {
    showResult('accessibilityResult', '📋 בדיקת WCAG:\n\n⚠️ בדיקה ידנית נדרשת\n💡 השתמש בכלי בדיקת נגישות', 'warning');
    addTestResult(true, true);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateStatus('מוכן לבדיקה - לחץ על כפתור לתחילת הבדיקות');
});
