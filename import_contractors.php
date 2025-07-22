<?php
/**
 * Import contractors from JSON file to database
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Pool Israel - Contractors Import</h2>\n";
echo "<pre>\n";

require_once 'includes/database.php';

// Database connection
try {
    $database = new Database();
    $db = $database->getConnection();
    echo "Database connection successful!\n";
} catch (Exception $e) {
    die("Database connection failed: " . $e->getMessage() . "\n");
}

// Set execution time limit for large imports
set_time_limit(300);

try {
    // Try multiple paths for the JSON file
    $possible_paths = [
        'contractors_data.json',
        '../contractors_data.json',
        './contractors_data.json',
        'data/contractors_data.json'
    ];

    $json_file = null;
    foreach ($possible_paths as $path) {
        echo "Checking path: {$path}\n";
        if (file_exists($path)) {
            $json_file = $path;
            echo "Found JSON file at: {$path}\n";
            break;
        }
    }

    if (!$json_file) {
        echo "JSON file not found in any of these locations:\n";
        foreach ($possible_paths as $path) {
            echo "- {$path}\n";
        }
        die("\nPlease make sure contractors_data.json is in the same directory as this script.\n");
    }

    echo "Reading JSON file...\n";
    $json_data = file_get_contents($json_file);
    $contractors = json_decode($json_data, true);

    if (!$contractors) {
        throw new Exception('Failed to parse JSON file');
    }
    
    echo "Found " . count($contractors) . " contractors in JSON file\n";

    // Clear existing contractors (optional - uncomment to replace all)
    echo "Clearing existing contractors...\n";
    $db->exec("DELETE FROM contractors");
    echo "Existing contractors cleared.\n";

    // Prepare insert statement (using only existing columns)
    $stmt = $db->prepare("
        INSERT INTO contractors (
            title, description, phone, website, address, city,
            categories, rating, reviews_count, status,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            phone = VALUES(phone),
            website = VALUES(website),
            address = VALUES(address),
            categories = VALUES(categories),
            rating = VALUES(rating),
            reviews_count = VALUES(reviews_count),
            updated_at = NOW()
    ");
    
    $imported = 0;
    $skipped = 0;
    
    foreach ($contractors as $contractor) {
        try {
            // Clean phone number
            $phone = cleanPhoneNumber($contractor['phone'] ?? '');
            
            // Skip if no phone
            if (empty($phone)) {
                $skipped++;
                continue;
            }
            
            // Prepare data
            $title = $contractor['title'] ?? '';
            $description = $contractor['subTitle'] ?? $contractor['categoryName'] ?? '';
            $website = $contractor['website'] ?? null;
            $address = $contractor['address'] ?? '';
            $city = $contractor['city'] ?? '';
            $categories = json_encode($contractor['categories'] ?? []);
            $rating = $contractor['totalScore'] ?? 0;
            $reviews_count = $contractor['reviewsCount'] ?? 0;
            $status = 'active'; // Default status

            // Clean website URL
            if (!empty($website) && !filter_var($website, FILTER_VALIDATE_URL)) {
                if (!str_starts_with($website, 'http')) {
                    $website = 'https://' . $website;
                }
                if (!filter_var($website, FILTER_VALIDATE_URL)) {
                    $website = '';
                }
            }

            // Execute insert
            $stmt->execute([
                $title, $description, $phone, $website, $address, $city,
                $categories, $rating, $reviews_count, $status
            ]);
            
            $imported++;
            
            if ($imported % 50 == 0) {
                echo "Imported $imported contractors...\n";
            }
            
        } catch (Exception $e) {
            echo "Error importing contractor '{$contractor['title']}': " . $e->getMessage() . "\n";
            $skipped++;
        }
    }
    
    echo "\nImport completed!\n";
    echo "Imported: $imported contractors\n";
    echo "Skipped: $skipped contractors\n";

    // Show statistics
    $stats_sql = "SELECT
                    COUNT(*) as total,
                    AVG(rating) as avg_rating,
                    COUNT(DISTINCT city) as cities_count
                  FROM contractors";
    $stats_stmt = $db->prepare($stats_sql);
    $stats_stmt->execute();
    $stats = $stats_stmt->fetch(PDO::FETCH_ASSOC);

    echo "\nDatabase Statistics:\n";
    echo "Total contractors: " . $stats['total'] . "\n";
    echo "Average rating: " . round($stats['avg_rating'], 2) . "\n";
    echo "Cities covered: " . $stats['cities_count'] . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\nDone!\n";
echo "</pre>\n";
echo "<p><strong>Import completed successfully!</strong></p>\n";
echo "<p><a href='home.html'>Go to website</a> | <a href='contractors_page.html'>View contractors</a></p>\n";

/**
 * Clean phone number to Israeli format
 */
function cleanPhoneNumber($phone) {
    if (empty($phone)) return '';

    // Remove all non-digit characters
    $phone = preg_replace('/[^0-9]/', '', $phone);

    // Convert international format to local
    if (str_starts_with($phone, '972')) {
        $phone = '0' . substr($phone, 3);
    } elseif (str_starts_with($phone, '+972')) {
        $phone = '0' . substr($phone, 4);
    }

    // Validate Israeli phone format
    if (preg_match('/^0[5-9]\d{8}$/', $phone)) {
        return $phone;
    }

    return '';
}
?>
