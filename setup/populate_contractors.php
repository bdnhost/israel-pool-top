<?php
/* Pool Israel - Populate Contractors Database */
/* ============================================ */

require_once '../includes/database.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    echo "<h2>🏊 Pool Israel - מילוי מסד נתונים קבלנים</h2>";
    
    // Check if contractors table exists and has data
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM contractors");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "<p>📊 נמצאו {$count} קבלנים במסד הנתונים</p>";
    
    if ($count < 10) {
        echo "<p>🔄 מוסיף קבלנים לדוגמה...</p>";
        
        // Sample contractors data
        $contractors = [
            [
                'title' => 'בריכות אלון - מומחים בבריכות בטון',
                'description' => 'חברה מובילה בתחום בניית בריכות בטון מותאמות אישית. ניסיון של מעל 15 שנה בבניית בריכות יוקרה ברחבי הארץ. מתמחים בעיצובים מותאמים אישית ובטכנולוגיות מתקדמות.',
                'phone' => '052-1234567',
                'email' => 'info@alon-pools.co.il',
                'website' => 'https://alon-pools.co.il',
                'city' => 'תל אביב',
                'categories' => '["בטון", "עיצוב", "תחזוקה"]',
                'rating' => 4.8,
                'reviews_count' => 127,
                'is_featured' => true
            ],
            [
                'title' => 'פיברגלס פרימיום - בריכות פיברגלס',
                'description' => 'התמחות בבריכות פיברגלס איכותיות עם התקנה מהירה ואחריות מלאה. מגוון רחב של דגמים וגדלים. התקנה מקצועית תוך יום אחד.',
                'phone' => '053-2345678',
                'email' => 'sales@premium-fiber.co.il',
                'website' => 'https://premium-fiber.co.il',
                'city' => 'חיפה',
                'categories' => '["פיברגלס", "התקנה מהירה"]',
                'rating' => 4.6,
                'reviews_count' => 89,
                'is_featured' => false
            ],
            [
                'title' => 'בריכות הגליל - פתרונות מתקדמים',
                'description' => 'חברה צפונית המתמחה בבריכות מתועשות ופתרונות חכמים. מערכות אוטומציה מתקדמות וחיסכון באנרגיה.',
                'phone' => '054-3456789',
                'email' => 'info@galil-pools.co.il',
                'website' => 'https://galil-pools.co.il',
                'city' => 'נצרת',
                'categories' => '["מתועשות", "אוטומציה", "חיסכון באנרגיה"]',
                'rating' => 4.7,
                'reviews_count' => 156,
                'is_featured' => true
            ],
            [
                'title' => 'מים כחולים - תחזוקת בריכות',
                'description' => 'מתמחים בתחזוקה שוטפת של בריכות, שיפוץ ושדרוג בריכות קיימות. שירות מקצועי ואמין עם מנויים חודשיים.',
                'phone' => '055-4567890',
                'email' => 'service@blue-water.co.il',
                'website' => 'https://blue-water.co.il',
                'city' => 'פתח תקווה',
                'categories' => '["תחזוקה", "שיפוץ", "שדרוג"]',
                'rating' => 4.5,
                'reviews_count' => 203,
                'is_featured' => false
            ],
            [
                'title' => 'בריכות הדרום - מומחי הנגב',
                'description' => 'חברה דרומית עם התמחות בתנאי האקלים הקשים של הדרום. פתרונות מותאמים לאקלים חם ויבש.',
                'phone' => '056-5678901',
                'email' => 'info@south-pools.co.il',
                'website' => 'https://south-pools.co.il',
                'city' => 'באר שבע',
                'categories' => '["בטון", "פיברגלס", "אקלים חם"]',
                'rating' => 4.4,
                'reviews_count' => 78,
                'is_featured' => false
            ],
            [
                'title' => 'אקווה דיזיין - עיצוב בריכות יוקרה',
                'description' => 'סטודיו עיצוב המתמחה בבריכות יוקרה ועיצובים ייחודיים. שילוב של אמנות ופונקציונליות.',
                'phone' => '057-6789012',
                'email' => 'design@aqua-design.co.il',
                'website' => 'https://aqua-design.co.il',
                'city' => 'הרצליה',
                'categories' => '["עיצוב", "יוקרה", "אמנות"]',
                'rating' => 4.9,
                'reviews_count' => 45,
                'is_featured' => true
            ],
            [
                'title' => 'בריכות המרכז - פתרונות משפחתיים',
                'description' => 'מתמחים בבריכות משפחתיות במחירים נגישים. דגש על איכות ושירות אישי לכל משפחה.',
                'phone' => '058-7890123',
                'email' => 'family@center-pools.co.il',
                'website' => 'https://center-pools.co.il',
                'city' => 'רמת גן',
                'categories' => '["משפחתי", "מחירים נגישים", "שירות אישי"]',
                'rating' => 4.3,
                'reviews_count' => 167,
                'is_featured' => false
            ],
            [
                'title' => 'פול טק - טכנולוגיות מתקדמות',
                'description' => 'חברת הייטק לבריכות עם מערכות חכמות ובקרה מרחוק. אפליקציה לניהול הבריכה מהטלפון.',
                'phone' => '059-8901234',
                'email' => 'tech@pool-tech.co.il',
                'website' => 'https://pool-tech.co.il',
                'city' => 'רעננה',
                'categories' => '["טכנולוגיה", "מערכות חכמות", "בקרה מרחוק"]',
                'rating' => 4.6,
                'reviews_count' => 92,
                'is_featured' => false
            ],
            [
                'title' => 'בריכות ירושלים - מומחי ההרים',
                'description' => 'התמחות בבניית בריכות באזור ירושלים וההרים. פתרונות מותאמים לתנאי שטח מאתגרים.',
                'phone' => '050-9012345',
                'email' => 'info@jerusalem-pools.co.il',
                'website' => 'https://jerusalem-pools.co.il',
                'city' => 'ירושלים',
                'categories' => '["הרים", "תנאי שטח מאתגרים", "בטון"]',
                'rating' => 4.2,
                'reviews_count' => 134,
                'is_featured' => false
            ],
            [
                'title' => 'אקווה ספא - בריכות ספא ויוקרה',
                'description' => 'מתמחים בבריכות ספא, ג\'קוזי ובריכות יוקרה עם מערכות הידרומסאז׳. חוויית רחצה מושלמת.',
                'phone' => '051-0123456',
                'email' => 'spa@aqua-spa.co.il',
                'website' => 'https://aqua-spa.co.il',
                'city' => 'נתניה',
                'categories' => '["ספא", "ג\'קוזי", "הידרומסאז\'"]',
                'rating' => 4.8,
                'reviews_count' => 67,
                'is_featured' => true
            ],
            [
                'title' => 'בריכות השרון - מומחי האזור',
                'description' => 'חברה אזורית המכירה את השרון כמו כף היד. שירות מקצועי ומהיר לתושבי האזור.',
                'phone' => '052-1357924',
                'email' => 'info@sharon-pools.co.il',
                'website' => 'https://sharon-pools.co.il',
                'city' => 'כפר סבא',
                'categories' => '["אזורי", "שירות מהיר", "מקצועי"]',
                'rating' => 4.4,
                'reviews_count' => 189,
                'is_featured' => false
            ],
            [
                'title' => 'בריכות אשדוד - מומחי החוף',
                'description' => 'התמחות בבריכות באזור החוף הדרומי. התמודדות עם תנאי מלחות ורוח ים.',
                'phone' => '053-2468135',
                'email' => 'coast@ashdod-pools.co.il',
                'website' => 'https://ashdod-pools.co.il',
                'city' => 'אשדוד',
                'categories' => '["חוף", "מלחות", "רוח ים"]',
                'rating' => 4.1,
                'reviews_count' => 98,
                'is_featured' => false
            ]
        ];
        
        // Prepare insert statement
        $stmt = $pdo->prepare("
            INSERT INTO contractors (title, description, phone, email, website, city, categories, rating, reviews_count, is_featured) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE title = VALUES(title)
        ");
        
        $inserted = 0;
        foreach ($contractors as $contractor) {
            try {
                $stmt->execute([
                    $contractor['title'],
                    $contractor['description'],
                    $contractor['phone'],
                    $contractor['email'],
                    $contractor['website'],
                    $contractor['city'],
                    $contractor['categories'],
                    $contractor['rating'],
                    $contractor['reviews_count'],
                    $contractor['is_featured']
                ]);
                $inserted++;
                echo "<p>✅ הוכנס: {$contractor['title']}</p>";
            } catch (Exception $e) {
                echo "<p>❌ שגיאה בהכנסת {$contractor['title']}: " . $e->getMessage() . "</p>";
            }
        }
        
        echo "<p>🎉 הושלם! הוכנסו {$inserted} קבלנים חדשים</p>";
    } else {
        echo "<p>✅ מסד הנתונים כבר מכיל מספיק קבלנים</p>";
    }
    
    // Show final count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM contractors");
    $finalCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "<p>📊 סה\"כ קבלנים במסד הנתונים: {$finalCount}</p>";
    
    // Show sample data
    echo "<h3>📋 דוגמה לנתונים:</h3>";
    $stmt = $pdo->query("SELECT title, city, rating, reviews_count, is_featured FROM contractors LIMIT 5");
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>שם</th><th>עיר</th><th>דירוג</th><th>ביקורות</th><th>מומלץ</th></tr>";
    foreach ($samples as $sample) {
        $featured = $sample['is_featured'] ? '⭐' : '';
        echo "<tr>";
        echo "<td>{$sample['title']}</td>";
        echo "<td>{$sample['city']}</td>";
        echo "<td>{$sample['rating']}</td>";
        echo "<td>{$sample['reviews_count']}</td>";
        echo "<td>{$featured}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<p>🚀 <a href='../contractors_new.html'>לחץ כאן לצפייה בדף הקבלנים</a></p>";
    
} catch (Exception $e) {
    echo "<p>❌ שגיאה: " . $e->getMessage() . "</p>";
}
?>
