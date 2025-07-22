# 🏊 Pool Israel - מדריך התקנה מלא

## 📋 **דרישות מערכת**

### **שרת:**
- **PHP:** 7.4+ (מומלץ 8.0+)
- **MySQL:** 5.7+ או MariaDB 10.3+
- **Apache/Nginx:** עם mod_rewrite
- **SSL Certificate:** מומלץ מאוד
- **cURL:** לשליחת SMS
- **JSON Extension:** מובנה ב-PHP

### **הרשאות:**
- **קריאה/כתיבה:** לתיקיות uploads/, logs/
- **ביצוע:** לקבצי PHP
- **חיבור:** למסד נתונים

---

## 🚀 **שלבי ההתקנה**

### **שלב 1: הכנת השרת**

#### **1.1 העלאת קבצים:**
```bash
# העלה את כל הקבצים לתיקיית השורש של האתר
# ודא שהמבנה נכון:
/
├── home.html
├── contractors_page.html
├── guides_page.html
├── css/
├── js/
├── api/
├── includes/
├── setup/
├── admin/
└── contractor/
```

#### **1.2 הגדרת הרשאות:**
```bash
chmod 755 uploads/
chmod 755 logs/
chmod 644 *.html
chmod 644 css/*
chmod 644 js/*
chmod 755 api/
chmod 755 includes/
```

### **שלב 2: הגדרת מסד נתונים**

#### **2.1 יצירת מסד נתונים:**
- היכנס ל-cPanel או phpMyAdmin
- צור מסד נתונים חדש: `shlomion_israelpool`
- צור משתמש: `shlomion_israel-pool`
- הקצה הרשאות מלאות למשתמש

#### **2.2 פרטי החיבור:**
```php
// פרטים שכבר מוגדרים בקובץ ההתקנה:
'db_host' => 'localhost',
'db_name' => 'shlomion_israelpool',
'db_user' => 'shlomion_israel-pool',
'db_pass' => 'f^NUl$!VKKid'
```

### **שלב 3: הרצת ההתקנה**

#### **3.1 גישה לסקריפט ההתקנה:**
```
https://israel-pool.top/setup/install.php
```

#### **3.2 מה יקרה בהתקנה:**
✅ **חיבור למסד נתונים** - בדיקת פרטי החיבור  
✅ **יצירת טבלאות** - 8 טבלאות מלאות  
✅ **הכנסת נתונים** - 5 קבלנים לדוגמה  
✅ **הגדרות מערכת** - כל הפרמטרים  
✅ **משתמש אדמין** - admin/pool2024!  
✅ **תיקיות** - uploads/, logs/  
✅ **קבצי אבטחה** - .htaccess  

#### **3.3 אם יש שגיאות:**
- בדוק פרטי מסד נתונים
- ודא שהשרת תומך ב-PHP 7.4+
- בדוק הרשאות תיקיות
- בדוק שמסד הנתונים קיים

### **שלב 4: הגדרת SMS**

#### **4.1 עדכון סיסמת SMS:**
עדכן בקובץ `includes/SMSService.php` שורה 67:
```php
'pass' => 'YOUR_SMS_PASSWORD', // החלף עם הסיסמה האמיתית
```

#### **4.2 פרטי SMS4Free:**
- **API Key:** iHXHOETxM
- **משתמש:** 0584995151
- **שולח:** 0584995151

### **שלב 5: בדיקת המערכת**

#### **5.1 דפים לבדיקה:**
- **דף הבית:** https://israel-pool.top/home.html
- **קבלנים:** https://israel-pool.top/contractors_page.html
- **מדריכים:** https://israel-pool.top/guides_page.html
- **פאנל אדמין:** https://israel-pool.top/admin/index.html

#### **5.2 API לבדיקה:**
- **קבלנים:** https://israel-pool.top/api/contractors.php?action=featured
- **בקשות:** https://israel-pool.top/api/quotes.php?action=list

#### **5.3 פרטי כניסה:**
- **אדמין:** admin / pool2024!
- **הנהלת פורטל:** 058-499-5151
- **אימייל:** info@israel-pool.top

---

## 🔧 **הגדרות נוספות**

### **SSL Certificate:**
```apache
# הוסף ל-.htaccess:
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### **Caching:**
```apache
# הוסף ל-.htaccess:
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

### **Security Headers:**
```apache
# הוסף ל-.htaccess:
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

---

## 🛠️ **פתרון בעיות נפוצות**

### **שגיאת חיבור למסד נתונים:**
```
SQLSTATE[HY000] [1045] Access denied
```
**פתרון:** בדוק פרטי חיבור במסד נתונים

### **שגיאת הרשאות:**
```
Permission denied
```
**פתרון:** 
```bash
chmod 755 uploads/
chmod 755 logs/
```

### **שגיאת PHP:**
```
Parse error: syntax error
```
**פתרון:** ודא PHP 7.4+ מותקן

### **SMS לא נשלח:**
```
SMS sending failed
```
**פתרון:** עדכן סיסמת SMS בקובץ SMSService.php

---

## 📱 **בדיקת פונקציונליות**

### **1. בדיקת תפריט המבורגר:**
- פתח באייפון/אנדרואיד
- לחץ על כפתור התפריט
- ודא שהתפריט נפתח מימין לשמאל

### **2. בדיקת פירורי לחם:**
- נווט בין הדפים
- ודא שפירורי הלחם מופיעים
- בדוק שהקישורים עובדים

### **3. בדיקת קבלנים:**
- פתח דף קבלנים
- ודא שהקבלנים נטענים
- בדוק פילטרים לפי עיר

### **4. בדיקת הצעת מחיר:**
- מלא טופס הצעת מחיר
- ודא שקוד SMS נשלח
- בדוק שהבקשה נשמרת

---

## 🎯 **מה הבא?**

### **1. תוכן:**
- הוסף מדריכים נוספים
- עדכן פרטי קבלנים
- הוסף תמונות איכותיות

### **2. SEO:**
- הגש ל-Google Search Console
- צור קישורים חיצוניים
- עדכן תוכן באופן קבוע

### **3. שיווק:**
- הפעל קמפיינים ב-Google Ads
- שתף ברשתות חברתיות
- צור קשר עם קבלנים

### **4. ניטור:**
- בדוק Google Analytics
- עקוב אחר ביצועי SMS
- נטר שגיאות בלוגים

---

## 📞 **תמיכה**

### **פרטי קשר:**
- **טלפון:** 058-499-5151
- **אימייל:** info@israel-pool.top
- **אתר:** https://israel-pool.top

### **קבצי לוג:**
- **שגיאות PHP:** logs/error.log
- **SMS:** בטבלת sms_logs
- **פעילות:** בטבלת activity_logs

### **גיבוי:**
```bash
# גבה את מסד הנתונים:
mysqldump -u shlomion_israel-pool -p shlomion_israelpool > backup.sql

# גבה קבצים:
tar -czf backup.tar.gz uploads/ logs/
```

---

## 🏆 **המערכת מוכנה!**

✅ **אתר מקצועי** - עיצוב מושלם ורספונסיבי  
✅ **מערכת הצעות מחיר** - עם SMS ואימות  
✅ **פאנל ניהול** - לניהול קבלנים ובקשות  
✅ **SEO מתקדם** - לדירוג גבוה במנועי חיפוש  
✅ **אבטחה מלאה** - הגנה מפני פריצות  
✅ **ביצועים מעולים** - טעינה מהירה  

**🎉 בהצלחה עם Pool Israel!**
