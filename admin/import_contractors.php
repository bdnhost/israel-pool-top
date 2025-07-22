<?php
/**
 * Advanced Contractors Import System
 * Pool Israel - Professional CSV Import with Validation
 */

require_once '../includes/database.php';

// Authentication check
session_start();
if (!isset($_SESSION['admin_logged_in'])) {
    header('Location: login.html');
    exit();
}

$database = new Database();
$db = $database->getConnection();

$message = '';
$messageType = '';
$importStats = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['csv_file'])) {
    $result = importContractorsFromCSV($_FILES['csv_file'], $db);
    $message = $result['message'];
    $messageType = $result['success'] ? 'success' : 'error';
    $importStats = $result['stats'] ?? null;
}

function importContractorsFromCSV($file, $db) {
    $stats = [
        'total_rows' => 0,
        'successful_imports' => 0,
        'failed_imports' => 0,
        'warnings' => 0,
        'errors' => []
    ];
    
    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'שגיאה בהעלאת הקובץ'];
    }
    
    if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
        return ['success' => false, 'message' => 'הקובץ גדול מדי (מקסימום 10MB)'];
    }
    
    $fileInfo = pathinfo($file['name']);
    if (strtolower($fileInfo['extension']) !== 'csv') {
        return ['success' => false, 'message' => 'רק קבצי CSV מותרים'];
    }
    
    // Read CSV file
    $csvData = [];
    if (($handle = fopen($file['tmp_name'], 'r')) !== FALSE) {
        // Read header
        $header = fgetcsv($handle, 1000, ',');
        if (!$header) {
            fclose($handle);
            return ['success' => false, 'message' => 'לא ניתן לקרוא את כותרות הקובץ'];
        }
        
        // Validate required columns
        $requiredColumns = ['title', 'description', 'city', 'phone'];
        $missingColumns = array_diff($requiredColumns, $header);
        if (!empty($missingColumns)) {
            fclose($handle);
            return [
                'success' => false, 
                'message' => 'עמודות חובה חסרות: ' . implode(', ', $missingColumns)
            ];
        }
        
        // Read data rows
        $rowNumber = 1;
        while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
            $rowNumber++;
            $stats['total_rows']++;
            
            if (count($data) !== count($header)) {
                $stats['errors'][] = "שורה {$rowNumber}: מספר עמודות לא תואם";
                $stats['failed_imports']++;
                continue;
            }
            
            $rowData = array_combine($header, $data);
            $csvData[] = ['row' => $rowNumber, 'data' => $rowData];
        }
        fclose($handle);
    } else {
        return ['success' => false, 'message' => 'לא ניתן לפתוח את הקובץ'];
    }
    
    // Process each row
    foreach ($csvData as $item) {
        $rowNumber = $item['row'];
        $data = $item['data'];
        
        // Validate and clean data
        $validation = validateContractorData($data, $rowNumber);
        if (!$validation['valid']) {
            $stats['errors'] = array_merge($stats['errors'], $validation['errors']);
            $stats['failed_imports']++;
            continue;
        }
        
        $cleanData = $validation['data'];
        $stats['warnings'] += count($validation['warnings']);
        
        // Insert to database
        try {
            $stmt = $db->prepare("
                INSERT INTO contractors (
                    title, description, city, address, phone, website, email,
                    categories, rating, reviews_count, status, is_featured,
                    opening_hours, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $result = $stmt->execute([
                $cleanData['title'],
                $cleanData['description'],
                $cleanData['city'],
                $cleanData['address'],
                $cleanData['phone'],
                $cleanData['website'],
                $cleanData['email'],
                $cleanData['categories'],
                $cleanData['rating'],
                $cleanData['reviews_count'],
                $cleanData['status'],
                $cleanData['is_featured'],
                $cleanData['opening_hours'],
                $cleanData['notes']
            ]);
            
            if ($result) {
                $stats['successful_imports']++;
            } else {
                $stats['errors'][] = "שורה {$rowNumber}: שגיאה בשמירה למסד הנתונים";
                $stats['failed_imports']++;
            }
            
        } catch (Exception $e) {
            $stats['errors'][] = "שורה {$rowNumber}: " . $e->getMessage();
            $stats['failed_imports']++;
        }
    }
    
    // Generate summary message
    $message = "יבוא הושלם! ";
    $message .= "יובאו בהצלחה: {$stats['successful_imports']} קבלנים. ";
    if ($stats['failed_imports'] > 0) {
        $message .= "נכשלו: {$stats['failed_imports']}. ";
    }
    if ($stats['warnings'] > 0) {
        $message .= "אזהרות: {$stats['warnings']}. ";
    }
    
    return [
        'success' => $stats['successful_imports'] > 0,
        'message' => $message,
        'stats' => $stats
    ];
}

function validateContractorData($data, $rowNumber) {
    $errors = [];
    $warnings = [];
    $cleanData = [];
    
    // Required fields validation
    $requiredFields = ['title', 'description', 'city', 'phone'];
    foreach ($requiredFields as $field) {
        if (empty(trim($data[$field] ?? ''))) {
            $errors[] = "שורה {$rowNumber}: שדה '{$field}' חובה";
        }
    }
    
    if (!empty($errors)) {
        return ['valid' => false, 'errors' => $errors, 'warnings' => $warnings, 'data' => null];
    }
    
    // Clean and validate title
    $cleanData['title'] = trim($data['title']);
    if (strlen($cleanData['title']) > 255) {
        $cleanData['title'] = substr($cleanData['title'], 0, 255);
        $warnings[] = "שורה {$rowNumber}: שם הקבלן קוצר ל-255 תווים";
    }
    
    // Clean and validate description
    $cleanData['description'] = trim($data['description']);
    
    // Clean and validate city
    $cleanData['city'] = trim($data['city']);
    
    // Clean and validate address
    $cleanData['address'] = trim($data['address'] ?? '');
    
    // Validate and clean phone
    $phone = preg_replace('/\D/', '', $data['phone']);
    if (!preg_match('/^0[5-9]\d{8}$/', $phone) && !preg_match('/^972[5-9]\d{8}$/', $phone)) {
        $errors[] = "שורה {$rowNumber}: מספר טלפון לא תקין";
    } else {
        // Convert to Israeli format
        if (strlen($phone) === 10 && substr($phone, 0, 1) === '0') {
            $cleanData['phone'] = $phone;
        } elseif (strlen($phone) === 12 && substr($phone, 0, 3) === '972') {
            $cleanData['phone'] = '0' . substr($phone, 3);
        } else {
            $cleanData['phone'] = $phone;
        }
    }
    
    // Validate and clean website
    $website = trim($data['website'] ?? '');
    if (!empty($website)) {
        if (!preg_match('/^https?:\/\//', $website)) {
            $website = 'https://' . $website;
            $warnings[] = "שורה {$rowNumber}: נוסף https:// לאתר האינטרנט";
        }
        if (!filter_var($website, FILTER_VALIDATE_URL)) {
            $warnings[] = "שורה {$rowNumber}: כתובת אתר לא תקינה - הושארה ריקה";
            $website = '';
        }
    }
    $cleanData['website'] = $website;
    
    // Validate and clean email
    $email = trim($data['email'] ?? '');
    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $warnings[] = "שורה {$rowNumber}: כתובת מייל לא תקינה - הושארה ריקה";
        $email = '';
    }
    $cleanData['email'] = $email;
    
    // Clean categories
    $categories = trim($data['categories'] ?? '');
    if (!empty($categories)) {
        $categoriesArray = array_map('trim', explode(',', $categories));
        $categoriesArray = array_filter($categoriesArray); // Remove empty values
        $cleanData['categories'] = json_encode($categoriesArray, JSON_UNESCAPED_UNICODE);
    } else {
        $cleanData['categories'] = json_encode([]);
    }
    
    // Validate and clean rating
    $rating = floatval($data['rating'] ?? 0);
    if ($rating < 1.0 || $rating > 5.0) {
        if ($rating > 0) {
            $warnings[] = "שורה {$rowNumber}: דירוג מחוץ לטווח 1-5 - הוגדר כ-0";
        }
        $rating = 0;
    }
    $cleanData['rating'] = $rating;
    
    // Validate and clean reviews_count
    $reviewsCount = intval($data['reviews_count'] ?? 0);
    if ($reviewsCount < 0) {
        $reviewsCount = 0;
        $warnings[] = "שורה {$rowNumber}: מספר ביקורות שלילי - הוגדר כ-0";
    }
    $cleanData['reviews_count'] = $reviewsCount;
    
    // Validate and clean status
    $status = strtolower(trim($data['status'] ?? 'active'));
    if (!in_array($status, ['active', 'inactive', 'pending'])) {
        $status = 'active';
        $warnings[] = "שורה {$rowNumber}: סטטוס לא מוכר - הוגדר כ-active";
    }
    $cleanData['status'] = $status;
    
    // Validate and clean is_featured
    $isFeatured = intval($data['is_featured'] ?? 0);
    $cleanData['is_featured'] = $isFeatured ? 1 : 0;
    
    // Validate and clean opening_hours
    $openingHours = trim($data['opening_hours'] ?? '');
    if (!empty($openingHours)) {
        $decoded = json_decode($openingHours, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $warnings[] = "שורה {$rowNumber}: פורמט שעות פעילות לא תקין - הושאר ריק";
            $openingHours = '';
        }
    }
    $cleanData['opening_hours'] = $openingHours;
    
    // Clean notes
    $cleanData['notes'] = trim($data['notes'] ?? '');
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'warnings' => $warnings,
        'data' => $cleanData
    ];
}
?>

<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>יבוא קבלנים - Pool Israel Admin</title>
    <link rel="stylesheet" href="../css/admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .import-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .upload-area {
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        .upload-area:hover {
            border-color: #3b82f6;
            background: #f8fafc;
        }
        .upload-area.dragover {
            border-color: #3b82f6;
            background: #dbeafe;
        }
        .file-input {
            display: none;
        }
        .upload-btn {
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        .upload-btn:hover {
            background: #2563eb;
        }
        .message {
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .message.success {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        .message.error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .stat-number {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
        }
        .stat-label {
            color: #64748b;
            font-size: 14px;
            margin-top: 4px;
        }
        .errors-list {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        .error-item {
            color: #dc2626;
            margin: 5px 0;
            font-size: 14px;
        }
        .format-info {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .download-links {
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .download-link {
            background: #10b981;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        .download-link:hover {
            background: #059669;
            transform: translateY(-1px);
        }
    </style>
</head>
<body>
    <div class="import-container">
        <div class="page-header">
            <h1><i class="fas fa-upload"></i> יבוא קבלנים</h1>
            <a href="index.html" class="btn btn-outline">
                <i class="fas fa-arrow-right"></i> חזרה לדשבורד
            </a>
        </div>

        <?php if ($message): ?>
            <div class="message <?php echo $messageType; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <?php if ($importStats): ?>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number"><?php echo $importStats['total_rows']; ?></div>
                    <div class="stat-label">סה"כ שורות</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo $importStats['successful_imports']; ?></div>
                    <div class="stat-label">יובאו בהצלחה</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo $importStats['failed_imports']; ?></div>
                    <div class="stat-label">נכשלו</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo $importStats['warnings']; ?></div>
                    <div class="stat-label">אזהרות</div>
                </div>
            </div>

            <?php if (!empty($importStats['errors'])): ?>
                <div class="errors-list">
                    <h4><i class="fas fa-exclamation-triangle"></i> שגיאות ואזהרות:</h4>
                    <?php foreach ($importStats['errors'] as $error): ?>
                        <div class="error-item"><?php echo htmlspecialchars($error); ?></div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>

        <div class="format-info">
            <h3><i class="fas fa-info-circle"></i> מידע חשוב לפני היבוא</h3>
            <ul>
                <li>הקובץ חייב להיות בפורמט CSV עם קידוד UTF-8</li>
                <li>שדות חובה: שם העסק, תיאור, עיר, טלפון</li>
                <li>גודל מקסימלי: 10MB, עד 1000 קבלנים</li>
                <li>מספרי טלפון בפורמט ישראלי (052xxxxxxx)</li>
            </ul>
        </div>

        <div class="download-links">
            <a href="contractors_import_sample.csv" class="download-link" download>
                <i class="fas fa-download"></i>
                הורד קובץ לדוגמא
            </a>
            <a href="contractors_import_format.md" class="download-link" target="_blank">
                <i class="fas fa-book"></i>
                מדריך מפורט
            </a>
        </div>

        <form method="POST" enctype="multipart/form-data">
            <div class="upload-area" id="uploadArea">
                <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #64748b; margin-bottom: 20px;"></i>
                <h3>גרור קובץ CSV לכאן או לחץ לבחירה</h3>
                <p>קבצי CSV בלבד, עד 10MB</p>
                <input type="file" name="csv_file" id="csvFile" class="file-input" accept=".csv" required>
                <button type="button" class="upload-btn" onclick="document.getElementById('csvFile').click()">
                    <i class="fas fa-folder-open"></i> בחר קובץ
                </button>
                <div id="fileName" style="margin-top: 10px; font-weight: 600;"></div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button type="submit" class="btn btn-primary" style="font-size: 18px; padding: 15px 30px;">
                    <i class="fas fa-upload"></i> התחל יבוא
                </button>
            </div>
        </form>
    </div>

    <script>
        // File upload handling
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('csvFile');
        const fileName = document.getElementById('fileName');

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                updateFileName(files[0].name);
            }
        });

        // File selection
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                updateFileName(e.target.files[0].name);
            }
        });

        function updateFileName(name) {
            fileName.textContent = `קובץ נבחר: ${name}`;
            fileName.style.color = '#10b981';
        }
    </script>
</body>
</html>
