<?php
/**
 * Database Schema Debug Tool
 * Check actual table structures to fix API queries
 */

header('Content-Type: application/json; charset=utf-8');

require_once 'includes/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $tables = [
        'quote_requests',
        'quote_contractor_assignments', 
        'sms_verifications',
        'system_settings',
        'contractors',
        'system_users'
    ];
    
    $schema = [];
    
    foreach ($tables as $table) {
        try {
            $stmt = $db->prepare("DESCRIBE `$table`");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $schema[$table] = $columns;
        } catch (Exception $e) {
            $schema[$table] = ['error' => $e->getMessage()];
        }
    }
    
    // Also check if tables exist
    $stmt = $db->prepare("SHOW TABLES");
    $stmt->execute();
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'existing_tables' => $existingTables,
        'schema' => $schema
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
