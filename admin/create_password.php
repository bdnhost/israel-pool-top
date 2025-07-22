<?php
$password = 'pool2024!';
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "New Hash: " . $hash;
?>