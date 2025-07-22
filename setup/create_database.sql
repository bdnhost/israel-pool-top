-- Pool Israel Database Setup
-- Run this script to create the database structure

-- Create database (if needed)
-- CREATE DATABASE poolisrael CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE poolisrael;

-- Contractors table
CREATE TABLE IF NOT EXISTS contractors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    city VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    website VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 0,
    reviews_count INT DEFAULT 0,
    categories JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_city (city),
    INDEX idx_rating (rating),
    INDEX idx_featured (is_featured),
    INDEX idx_status (status),
    FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guides table
CREATE TABLE IF NOT EXISTS guides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    content LONGTEXT,
    excerpt TEXT,
    category VARCHAR(100),
    difficulty_level ENUM('מתחילים', 'בינוני', 'מתקדם') DEFAULT 'מתחילים',
    reading_time INT DEFAULT 5,
    featured_image VARCHAR(255),
    status ENUM('published', 'draft', 'archived') DEFAULT 'draft',
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_slug (slug),
    FULLTEXT idx_search (title, content, excerpt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table (for admin panel)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample contractors data
INSERT INTO contractors (title, description, city, phone, website, rating, reviews_count, categories, is_featured) VALUES
('יגל שירותי מים', 'החברה הוותיקה והמובילה בישראל בתחום הקמת בריכות שחייה. מאז 1975 ביצענו אלפי פרויקטים ברחבי הארץ.', 'מושב תעוז', '050-123-4567', 'https://example.com', 4.9, 234, '["בריכות בטון", "בריכות פיברגלס", "בריכות יוקרה"]', TRUE),

('פלגים בריכות שחייה', 'חברה מובילה בתחום הקמת בריכות פרטיות. מתמחים בפתרונות איכותיים במחירים תחרותיים.', 'מודיעין', '052-987-6543', 'https://example.com', 4.7, 156, '["בריכות בטון", "בריכות מתועשות", "תחזוקה"]', TRUE),

('אקווה פול', 'מתמחים בבריכות יוקרה ופתרונות מתקדמים. צוות מקצועי עם ניסיון של מעל 20 שנה.', 'תל אביב', '053-456-7890', 'https://example.com', 4.8, 189, '["בריכות יוקרה", "בריכות אינסוף", "מערכות חכמות"]', TRUE),

('בריכות הצפון', 'שירותי בניית בריכות מקצועיים באזור הצפון. מתמחים בבריכות פרטיות ומסחריות.', 'חיפה', '054-321-0987', 'https://example.com', 4.6, 98, '["בריכות בטון", "בריכות פיברגלס"]', FALSE),

('מים כחולים', 'חברת בריכות מובילה במרכז הארץ. מתמחים בתחזוקה ושיפוץ בריכות קיימות.', 'פתח תקווה', '055-678-1234', 'https://example.com', 4.5, 142, '["תחזוקה", "שיפוץ בריכות", "מערכות סינון"]', FALSE);

-- Insert sample guides data
INSERT INTO guides (title, slug, content, excerpt, category, difficulty_level, reading_time, status) VALUES
('מדריך שלבי בניית בריכה 2025', 'guide-pool-building-steps-2025', 
'<h2>מבוא</h2><p>בניית בריכת שחייה היא פרויקט מרגש ומורכב שדורש תכנון קפדני...</p>', 
'מדריך מקיף לכל שלבי התכנון והבנייה של בריכת שחייה פרטית', 
'תכנון ובנייה', 'מתחילים', 15, 'published'),

('בטיחות בריכות לילדים', 'pool-safety-children', 
'<h2>חשיבות הבטיחות</h2><p>בטיחות בריכות היא נושא קריטי במיוחד כשיש ילדים בבית...</p>', 
'כל מה שצריך לדעת על בטיחות בריכות כשיש ילדים בבית', 
'בטיחות', 'חשוב', 10, 'published'),

('איזון כימי של המים', 'chemical-balance-guide', 
'<h2>יסודות האיזון הכימי</h2><p>שמירה על איזון כימי נכון במי הבריכה חיונית...</p>', 
'מדריך לשמירה על איכות המים ואיזון כימי נכון', 
'תחזוקה', 'בינוני', 12, 'published'),

('בחירת קבלן בריכות', 'choosing-pool-contractor', 
'<h2>איך לבחור קבלן אמין</h2><p>בחירת קבלן בריכות היא החלטה חשובה...</p>', 
'מדריך לבחירת קבלן בריכות מקצועי ואמין', 
'תכנון ובנייה', 'מתחילים', 8, 'published'),

('תחזוקה שנתית של בריכות', 'annual-pool-maintenance', 
'<h2>תחזוקה לאורך השנה</h2><p>תחזוקה נכונה של הבריכה חיונית לשמירה על איכותה...</p>', 
'מדריך מקיף לתחזוקת בריכות לאורך כל עונות השנה', 
'תחזוקה', 'בינוני', 18, 'published');

-- Create admin user (password: admin123 - change this!)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@poolisrael.co.il', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Create indexes for better performance
CREATE INDEX idx_contractors_search ON contractors(title, city);
CREATE INDEX idx_guides_search ON guides(title, category);
CREATE INDEX idx_contractors_rating_featured ON contractors(rating DESC, is_featured DESC);
CREATE INDEX idx_guides_status_created ON guides(status, created_at DESC);
