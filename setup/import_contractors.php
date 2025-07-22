<?php
/**
 * Import contractors from JSON file to database
 * Run this script once to import the existing contractor data
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Pool Israel - Contractors Import</h2>\n";
echo "<pre>\n";

require_once '../includes/database.php';
require_once '../includes/functions.php';

// Set execution time limit for large imports
set_time_limit(300);

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Try multiple paths for the JSON file
    $possible_paths = [
        '../contractors_data.json',
        '../../contractors_data.json',
        '../data/contractors_data.json',
        '../../data/contractors_data.json'
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
        die("\nPlease upload contractors_data.json to one of these locations.\n");
    }
    
    echo "Reading JSON file...\n";
    $json_data = file_get_contents($json_file);
    $contractors_data = json_decode($json_data, true);
    
    if (!$contractors_data) {
        die("Failed to parse JSON file\n");
    }
    
    echo "Found " . count($contractors_data) . " contractors in JSON file\n";
    
    // Prepare insert statement
    $sql = "INSERT INTO contractors (title, description, city, address, phone, website, rating, reviews_count, categories, is_featured) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    
    $imported = 0;
    $skipped = 0;
    $errors = 0;
    
    foreach ($contractors_data as $contractor) {
        try {
            // Extract and clean data
            $title = trim($contractor['title'] ?? '');
            $description = trim($contractor['subTitle'] ?? $contractor['categoryName'] ?? '');
            $city = trim($contractor['city'] ?? '');
            $address = trim($contractor['address'] ?? '');
            $phone = formatPhone($contractor['phone'] ?? $contractor['phoneUnformatted'] ?? '');
            $website = trim($contractor['website'] ?? '');
            $rating = (float)($contractor['totalScore'] ?? 0);
            $reviews_count = (int)($contractor['reviewsCount'] ?? 0);
            $categories = json_encode($contractor['categories'] ?? []);
            $is_featured = (bool)($contractor['isAdvertisement'] ?? false);
            
            // Skip if missing essential data
            if (empty($title) || empty($city)) {
                $skipped++;
                continue;
            }
            
            // Clean website URL
            if (!empty($website) && !filter_var($website, FILTER_VALIDATE_URL)) {
                if (!str_starts_with($website, 'http')) {
                    $website = 'https://' . $website;
                }
                if (!filter_var($website, FILTER_VALIDATE_URL)) {
                    $website = '';
                }
            }

            // Validate phone number using function from includes/functions.php
            if (!empty($phone) && !isValidPhone($phone)) {
                $phone = '';
            }
            
            // Limit description length
            if (strlen($description) > 500) {
                $description = substr($description, 0, 497) . '...';
            }
            
            // Execute insert
            $stmt->execute([
                $title,
                $description,
                $city,
                $address,
                $phone,
                $website,
                $rating,
                $reviews_count,
                $categories,
                $is_featured
            ]);
            
            $imported++;
            
            if ($imported % 50 == 0) {
                echo "Imported {$imported} contractors...\n";
            }
            
        } catch (Exception $e) {
            $errors++;
            echo "Error importing contractor '{$title}': " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nImport completed!\n";
    echo "Imported: {$imported}\n";
    echo "Skipped: {$skipped}\n";
    echo "Errors: {$errors}\n";
    
    // Update featured contractors (mark top-rated as featured)
    echo "\nUpdating featured contractors...\n";
    $featured_sql = "UPDATE contractors SET is_featured = TRUE 
                     WHERE rating >= 4.7 AND reviews_count >= 100 
                     ORDER BY rating DESC, reviews_count DESC 
                     LIMIT 10";
    $db->exec($featured_sql);
    
    echo "Featured contractors updated\n";
    
    // Show statistics
    $stats_sql = "SELECT 
                    COUNT(*) as total,
                    AVG(rating) as avg_rating,
                    COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_count,
                    COUNT(DISTINCT city) as cities_count
                  FROM contractors";
    $stats = $db->query($stats_sql)->fetch();
    
    echo "\nDatabase Statistics:\n";
    echo "Total contractors: " . $stats['total'] . "\n";
    echo "Average rating: " . round($stats['avg_rating'], 2) . "\n";
    echo "Featured contractors: " . $stats['featured_count'] . "\n";
    echo "Cities covered: " . $stats['cities_count'] . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}



echo "\nDone!\n";
echo "</pre>\n";
echo "<p><strong>Import completed successfully!</strong></p>\n";
echo "<p><a href='../home.html'>Go to website</a> | <a href='../contractors_page.html'>View contractors</a></p>\n";
?>
