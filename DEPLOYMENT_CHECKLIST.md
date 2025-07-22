# Pool Israel - רשימת בדיקות להעלאה

## לפני העלאה לשרת

### ✅ הכנת קבצים
- [x] כל קבצי HTML מועתקים
- [x] קבצי CSS ו-JS מאוחדים
- [x] קבצי API מוכנים
- [x] מבנה מסד נתונים מוכן
- [x] קבצי הגדרה מוכנים

### ✅ בדיקות אבטחה
- [ ] שינוי סיסמת admin ב-config.php
- [ ] עדכון JWT secret
- [ ] בדיקת הרשאות קבצים
- [ ] הגדרת HTTPS

## שלבי העלאה

### שלב 1: העלאת קבצים
```bash
# העלו את כל התוכן של תיקיית poolisrael1 לשרת
# וודאו שההרשאות נכונות:
chmod 755 api/
chmod 755 includes/
chmod 777 uploads/
chmod 777 logs/
```

### שלב 2: יצירת מסד נתונים
1. היכנסו ל-cPanel
2. צרו מסד נתונים חדש
3. צרו משתמש עם הרשאות מלאות
4. ייבאו את `setup/create_database.sql`

### שלב 3: הגדרת קונפיגורציה
עדכנו את `includes/config.php`:
```php
'db_host' => 'localhost',
'db_name' => 'your_database_name',
'db_username' => 'your_username', 
'db_password' => 'your_password',
'site_url' => 'https://your-domain.com',
'admin_password' => 'your_secure_password',
'jwt_secret' => 'your_unique_secret_key'
```

### שלב 4: ייבוא נתונים
```bash
# העתיקו את contractors_data.json לשרת
# הריצו:
php setup/import_contractors.php
```

### שלב 5: בדיקות
- [ ] האתר נטען: https://your-domain.com/home.html
- [ ] דף קבלנים עובד: /contractors_page.html
- [ ] API עובד: /api/contractors.php
- [ ] מדריכים נטענים: /guides_page.html

## הגדרות cPanel נדרשות

### PHP Settings
- PHP Version: 7.4 או חדש יותר
- Memory Limit: 256MB
- Max Execution Time: 300 seconds
- Upload Max Filesize: 10MB

### MySQL Settings
- Character Set: utf8mb4
- Collation: utf8mb4_unicode_ci

### SSL Certificate
- הפעילו Let's Encrypt או SSL אחר
- הגדירו redirect מ-HTTP ל-HTTPS

## בדיקות לאחר העלאה

### ✅ פונקציונליות בסיסית
- [ ] דף הבית נטען
- [ ] ניווט עובד
- [ ] חיפוש קבלנים עובד
- [ ] פילטרים עובדים
- [ ] מדריכים נטענים

### ✅ ביצועים
- [ ] זמן טעינה < 3 שניות
- [ ] תמונות נטענות מהר
- [ ] API מגיב מהר

### ✅ SEO
- [ ] Meta tags נכונים
- [ ] Sitemap נגיש
- [ ] Robots.txt נכון
- [ ] URLs ידידותיים

### ✅ אבטחה
- [ ] HTTPS פעיל
- [ ] קבצי config מוגנים
- [ ] תיקיות admin מוגנות
- [ ] Headers אבטחה פעילים

## פתרון בעיות נפוצות

### שגיאת 500
1. בדקו לוגי שגיאות ב-cPanel
2. וודאו הרשאות קבצים
3. בדקו syntax ב-PHP

### מסד נתונים לא מתחבר
1. בדקו פרטי חיבור ב-config.php
2. וודאו שהמשתמש קיים
3. בדקו הרשאות משתמש

### API לא עובד
1. בדקו שmod_rewrite פעיל
2. וודאו .htaccess נטען
3. בדקו הרשאות תיקיית api/

### תמונות לא נטענות
1. בדקו הרשאות uploads/
2. וודאו נתיבים נכונים
3. בדקו גודל קבצים

## תחזוקה שוטפת

### יומית
- [ ] בדיקת לוגי שגיאות
- [ ] ניטור ביצועים
- [ ] בדיקת גיבויים

### שבועית
- [ ] עדכון תוכן
- [ ] בדיקת קישורים שבורים
- [ ] ניתוח סטטיסטיקות

### חודשית
- [ ] עדכוני אבטחה
- [ ] אופטימיזציה של מסד נתונים
- [ ] בדיקת SEO

## אנשי קשר לתמיכה

- **תמיכה טכנית**: support@poolisrael.co.il
- **מנהל מערכת**: admin@poolisrael.co.il
- **חירום**: 050-123-4567

## קישורים חשובים

- **cPanel**: https://your-domain.com:2083
- **phpMyAdmin**: דרך cPanel
- **לוגי שגיאות**: cPanel > Error Logs
- **גיבויים**: cPanel > Backup

---

**זכרו**: לאחר העלאה מוצלחת, מחקו את תיקיית setup/ מהשרת לאבטחה!
