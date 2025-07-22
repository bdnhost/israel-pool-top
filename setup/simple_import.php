<?php
/**
 * Simple Contractors Import - Manual Version
 * Use this if the automatic import doesn't work
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Pool Israel - Simple Contractors Import</h2>\n";
echo "<pre>\n";

// Database configuration - UPDATE THESE VALUES
$db_host = 'localhost';
$db_name = 'your_database_name';  // CHANGE THIS
$db_user = 'your_username';       // CHANGE THIS
$db_pass = 'your_password';       // CHANGE THIS

try {
    // Connect to database
    echo "Connecting to database...\n";
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Database connected successfully!\n\n";
    
    // Check if contractors table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'contractors'");
    if ($stmt->rowCount() == 0) {
        echo "Creating contractors table...\n";
        $create_table = "
        CREATE TABLE contractors (
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
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($create_table);
        echo "Contractors table created!\n\n";
    }
    
    // Insert sample contractors
    echo "Inserting sample contractors...\n";
    
    $sample_contractors = [
        [
            'title' => 'יגל שירותי מים',
            'description' => 'החברה הוותיקה והמובילה בישראל בתחום הקמת בריכות שחייה. מאז 1975 ביצענו אלפי פרויקטים ברחבי הארץ.',
            'city' => 'מושב תעוז',
            'phone' => '050-123-4567',
            'website' => 'https://example.com',
            'rating' => 4.9,
            'reviews_count' => 234,
            'categories' => '["בריכות בטון", "בריכות פיברגלס", "בריכות יוקרה"]',
            'is_featured' => 1
        ],
        [
            'title' => 'פלגים בריכות שחייה',
            'description' => 'חברה מובילה בתחום הקמת בריכות פרטיות. מתמחים בפתרונות איכותיים במחירים תחרותיים.',
            'city' => 'מודיעין',
            'phone' => '052-987-6543',
            'website' => 'https://example.com',
            'rating' => 4.7,
            'reviews_count' => 156,
            'categories' => '["בריכות בטון", "בריכות מתועשות", "תחזוקה"]',
            'is_featured' => 1
        ],
        [
            'title' => 'אקווה פול',
            'description' => 'מתמחים בבריכות יוקרה ופתרונות מתקדמים. צוות מקצועי עם ניסיון של מעל 20 שנה.',
            'city' => 'תל אביב',
            'phone' => '053-456-7890',
            'website' => 'https://example.com',
            'rating' => 4.8,
            'reviews_count' => 189,
            'categories' => '["בריכות יוקרה", "בריכות אינסוף", "מערכות חכמות"]',
            'is_featured' => 1
        ],
        [
            'title' => 'בריכות הצפון',
            'description' => 'שירותי בניית בריכות מקצועיים באזור הצפון. מתמחים בבריכות פרטיות ומסחריות.',
            'city' => 'חיפה',
            'phone' => '054-321-0987',
            'website' => 'https://example.com',
            'rating' => 4.6,
            'reviews_count' => 98,
            'categories' => '["בריכות בטון", "בריכות פיברגלס"]',
            'is_featured' => 0
        ],
        [
            'title' => 'מים כחולים',
            'description' => 'חברת בריכות מובילה במרכז הארץ. מתמחים בתחזוקה ושיפוץ בריכות קיימות.',
            'city' => 'פתח תקווה',
            'phone' => '055-678-1234',
            'website' => 'https://example.com',
            'rating' => 4.5,
            'reviews_count' => 142,
            'categories' => '["תחזוקה", "שיפוץ בריכות", "מערכות סינון"]',
            'is_featured' => 0
        ],
        [
            'title' => 'בריכות דרום',
            'description' => 'מתמחים בבריכות באזור הדרום. פתרונות מותאמים לאקלים המדברי.',
            'city' => 'באר שבע',
            'phone' => '056-789-0123',
            'website' => 'https://example.com',
            'rating' => 4.4,
            'reviews_count' => 87,
            'categories' => '["בריכות בטון", "בריכות עמידות חום"]',
            'is_featured' => 0
        ],
        [
            'title' => 'פול טק',
            'description' => 'טכנולוגיות מתקדמות לבריכות. מערכות אוטומציה ובקרה חכמה.',
            'city' => 'הרצליה',
            'phone' => '057-890-1234',
            'website' => 'https://example.com',
            'rating' => 4.7,
            'reviews_count' => 203,
            'categories' => '["מערכות חכמות", "אוטומציה", "בריכות יוקרה"]',
            'is_featured' => 1
        ],
        [
            'title' => 'בריכות ירושלים',
            'description' => 'שירותי בריכות מקצועיים באזור ירושלים והסביבה.',
            'city' => 'ירושלים',
            'phone' => '058-901-2345',
            'website' => 'https://example.com',
            'rating' => 4.3,
            'reviews_count' => 76,
            'categories' => '["בריכות בטון", "תחזוקה"]',
            'is_featured' => 0
        ]
    ];
    
    // Prepare insert statement
    $sql = "INSERT INTO contractors (title, description, city, phone, website, rating, reviews_count, categories, is_featured) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    
    $inserted = 0;
    foreach ($sample_contractors as $contractor) {
        try {
            $stmt->execute([
                $contractor['title'],
                $contractor['description'],
                $contractor['city'],
                $contractor['phone'],
                $contractor['website'],
                $contractor['rating'],
                $contractor['reviews_count'],
                $contractor['categories'],
                $contractor['is_featured']
            ]);
            $inserted++;
            echo "✓ Inserted: {$contractor['title']}\n";
        } catch (Exception $e) {
            echo "✗ Error inserting {$contractor['title']}: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nImport completed!\n";
    echo "Inserted: {$inserted} contractors\n";
    
    // Show statistics
    $stats = $pdo->query("SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM contractors")->fetch();
    echo "Total contractors in database: " . $stats['total'] . "\n";
    echo "Average rating: " . round($stats['avg_rating'], 2) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "\nPlease check your database configuration at the top of this file.\n";
}

echo "</pre>\n";
echo "<h3>Next Steps:</h3>\n";
echo "<ol>\n";
echo "<li><a href='../home.html'>Go to website homepage</a></li>\n";
echo "<li><a href='../contractors_page.html'>View contractors page</a></li>\n";
echo "<li><a href='../api/contractors.php'>Test API</a></li>\n";
echo "</ol>\n";

echo "<h3>Manual Import Instructions:</h3>\n";
echo "<p>If you have the contractors_data.json file, you can:</p>\n";
echo "<ol>\n";
echo "<li>Upload contractors_data.json to the root directory</li>\n";
echo "<li>Update the database config in this file</li>\n";
echo "<li>Run the main import_contractors.php script</li>\n";
echo "</ol>\n";
?>
