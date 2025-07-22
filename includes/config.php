<?php
/**
 * Pool Israel - Configuration File
 * 
 * IMPORTANT: Update these settings according to your hosting environment
 */

return [
    // Database Configuration - עדכן את הפרטים האלה לפי השרת שלך
    'db_host' => 'localhost',
    'db_name' => 'shlomion_israelpool',
    'db_username' => 'shlomion_israel-pool',
    'db_password' => 'f^NUl$!VKKid',
    'db_charset' => 'utf8mb4',,
    
    // Site Configuration
    'site_name' => 'Pool Israel',
    'site_url' => 'https://israel-pool.top/',
    'site_description' => 'המדריך המקיף לבריכות שחייה בישראל',
    
    // Admin Configuration
    'admin_email' => 'yaaqovb@gmail.com',
    'admin_password' => 'hgeC2020!!', // Will be hashed
    
    // File Upload Configuration
    'upload_path' => 'uploads/',
    'max_file_size' => 5 * 1024 * 1024, // 5MB
    'allowed_file_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    
    // Pagination
    'contractors_per_page' => 12,
    'guides_per_page' => 10,
    
    // Cache Configuration
    'cache_enabled' => true,
    'cache_duration' => 3600, // 1 hour
    
    // Email Configuration (for contact forms)
    'smtp_host' => 'smtp.your-provider.com',
    'smtp_port' => 587,
    'smtp_username' => 'info@israel-pool.top',
    'smtp_password' => 'hgeC2020!!',
    'smtp_encryption' => 'tls',
    
    // Security
    'jwt_secret' => 'your-jwt-secret-key-change-this',
    'session_lifetime' => 86400, // 24 hours
    
    // API Configuration
    'api_rate_limit' => 100, // requests per hour
    'api_version' => 'v1',
    
    // Development/Production
    'environment' => 'production', // 'development' or 'production'
    'debug_mode' => false,
    'error_reporting' => false,
    
    // Social Media Links
    'social_links' => [
        'facebook' => 'https://facebook.com/poolisrael',
        'instagram' => 'https://instagram.com/poolisrael',
        'youtube' => 'https://youtube.com/poolisrael',
        'whatsapp' => 'https://wa.me/972584995151'
    ],
    
    // Contact Information
    'contact_info' => [
        'phone' => '058-4995151',
        'email' => 'info@israel-pool.top',
        'address' => 'תל אביב, ישראל'
    ],
    
    // SEO Configuration
    'seo' => [
        'default_title' => 'Pool Israel - המדריך המקיף לבריכות שחייה בישראל',
        'default_description' => 'מצאו קבלנים מקצועיים, מדריכים מפורטים וכל המידע שאתם צריכים לבניית בריכת השחייה המושלמת',
        'default_keywords' => 'בריכות שחייה, קבלני בריכות, בניית בריכה, תחזוקת בריכות, ישראל',
        'og_image' => 'images/og-image.jpg'
    ]
];
?>