<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

try {
    $jsonPath = __DIR__ . '/../contractors_data.json'; // אם contractors.php בתיקיית /api/
    // או:
    // $jsonPath = __DIR__ . '/contractors_data.json'; // אם באותה תיקייה

    if (!file_exists($jsonPath)) {
        throw new Exception('הקובץ contractors_data.json לא נמצא');
    }

    $json = file_get_contents($jsonPath);
    $contractors = json_decode($json, true);

    if (!is_array($contractors)) {
        throw new Exception('פורמט JSON שגוי');
    }

    // --- קלט ---
    $search    = $_GET['search'] ?? '';
    $city      = $_GET['city'] ?? '';
    $category  = $_GET['category'] ?? '';
    $minRating = isset($_GET['min_rating']) ? floatval($_GET['min_rating']) : 0;
    $sort      = $_GET['sort'] ?? 'featured';

    // --- סינון ---
    $filtered = array_filter($contractors, function ($c) use ($search, $city, $category, $minRating) {
        $match = true;

        if ($search) {
            $text = strtolower($c['title'] . ' ' . $c['subTitle'] . ' ' . ($c['searchString'] ?? '') . ' ' . ($c['description'] ?? ''));
            $match &= stripos($text, $search) !== false;
        }

        if ($city) {
            $match &= isset($c['city']) && stripos($c['city'], $city) !== false;
        }

        if ($category) {
            $match &= (
                (isset($c['categoryName']) && stripos($c['categoryName'], $category) !== false) ||
                (isset($c['categories']) && is_array($c['categories']) && in_array($category, $c['categories']))
            );
        }

        if ($minRating > 0) {
            $match &= isset($c['totalScore']) && floatval($c['totalScore']) >= $minRating;
        }

        return $match;
    });

    // --- מיון ---
    if ($sort === 'rating') {
        usort($filtered, fn($a, $b) => floatval($b['totalScore']) <=> floatval($a['totalScore']));
    } elseif ($sort === 'title') {
        usort($filtered, fn($a, $b) => strcmp($a['title'], $b['title']));
    } elseif ($sort === 'featured') {
        usort($filtered, fn($a, $b) => intval($b['isAdvertisement'] ?? 0) <=> intval($a['isAdvertisement'] ?? 0));
    }

    // --- פאגינציה ---
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = intval($_GET['limit'] ?? 12);
    $totalCount = count($filtered);
    $totalPages = ceil($totalCount / $limit);
    $offset = ($page - 1) * $limit;
    $pagedData = array_slice(array_values($filtered), $offset, $limit);

    // --- פלט JSON ---
    echo json_encode([
        'success' => true,
        'contractors' => $pagedData,
        'pagination' => [
            'total_pages' => $totalPages,
            'current_page' => $page,
            'total_count' => $totalCount
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'שגיאה: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
