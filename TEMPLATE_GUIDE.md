# 🎨 מדריך שימוש בתבנית העיצוב - Pool Israel

## 📋 **סקירה כללית**

התבנית נוצרה כדי להבטיח אחידות מלאה בכל דפי האתר. כל דף חדש צריך להיבנות על בסיס התבנית הזו.

---

## 📁 **קבצי התבנית**

### **1. קבצי HTML:**
- `template.html` - תבנית HTML בסיסית
- כל דף חדש צריך להיבנות על בסיסה

### **2. קבצי CSS:**
- `css/template.css` - CSS מאוחד עם כל הסגנונות
- משתמש במשתנים CSS לקביעת צבעים וגדלים
- כולל responsive design מובנה

---

## 🔧 **איך ליצור דף חדש**

### **שלב 1: העתק את התבנית**
```bash
cp template.html new_page.html
```

### **שלב 2: החלף את המשתנים**
החלף את המשתנים הבאים בדף החדש:

```html
{{PAGE_TITLE}} → כותרת הדף
{{PAGE_DESCRIPTION}} → תיאור הדף למטא
{{PAGE_KEYWORDS}} → מילות מפתח
{{PAGE_URL}} → כתובת הדף
{{CURRENT_PAGE}} → שם הדף ב-breadcrumbs
{{PAGE_H1}} → כותרת ראשית
{{PAGE_DESCRIPTION_TEXT}} → תיאור תחת הכותרת
{{PAGE_CONTENT}} → תוכן הדף
{{PAGE_SCRIPTS}} → סקריפטים ספציפיים לדף
```

### **שלב 3: הוסף את ה-CSS**
```html
<link rel="stylesheet" href="css/template.css">
```

---

## 🎨 **מערכת הצבעים**

### **צבעים עיקריים:**
- `--primary-blue: #2c5aa0` - כחול עיקרי
- `--primary-blue-dark: #1e3a8a` - כחול כהה
- `--primary-orange: #f59e0b` - כתום עיקרי
- `--accent-blue: #4a90e2` - כחול משני

### **גווני אפור:**
- `--gray-50` עד `--gray-900` - סקלה מלאה

---

## 📐 **מערכת הרווחים**

### **משתנים:**
- `--spacing-1` עד `--spacing-16` - רווחים סטנדרטיים
- `--radius-sm` עד `--radius-2xl` - רדיוסים

### **דוגמאות שימוש:**
```css
.my-element {
    padding: var(--spacing-4);
    margin: var(--spacing-8);
    border-radius: var(--radius-lg);
}
```

---

## 🧩 **קומפוננטים מוכנים**

### **כפתורים:**
```html
<a href="#" class="btn btn-primary">כפתור עיקרי</a>
<a href="#" class="btn btn-secondary">כפתור משני</a>
<a href="#" class="btn btn-outline">כפתור מסגרת</a>
```

### **כרטיסים:**
```html
<div class="card">
    <div class="card-icon">
        <i class="fas fa-star"></i>
    </div>
    <h3>כותרת הכרטיס</h3>
    <p>תוכן הכרטיס</p>
</div>
```

### **רשת:**
```html
<div class="grid grid-3">
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
</div>
```

### **טפסים:**
```html
<div class="form-group">
    <label class="form-label">תווית השדה</label>
    <input type="text" class="form-control" placeholder="טקסט עזר">
</div>
```

---

## 📱 **Responsive Design**

התבנית כוללת responsive design מובנה:

### **נקודות שבירה:**
- **Desktop:** מעל 1024px
- **Tablet:** 768px-1024px  
- **Mobile:** מתחת ל-768px

### **התנהגות:**
- Grid משתנה ל-1 עמודה במובייל
- תפריט ניווט הופך למובייל
- גדלי פונט מתכווצים
- רווחים מצטמצמים

---

## ✅ **כללי עיצוב**

### **DO - כן:**
✅ השתמש במשתנים CSS  
✅ השתמש בקלאסים מוכנים  
✅ שמור על אחידות צבעים  
✅ השתמש ברווחים סטנדרטיים  
✅ בדוק responsive בכל הגדלים  

### **DON'T - לא:**
❌ אל תשתמש בצבעים קשיחים  
❌ אל תיצור CSS חדש ללא צורך  
❌ אל תשבור את מערכת הרווחים  
❌ אל תשכח breadcrumbs  
❌ אל תשנה את מבנה ה-header/footer  

---

## 🔄 **תהליך עדכון דף קיים**

### **שלב 1: גיבוי**
```bash
cp existing_page.html existing_page_backup.html
```

### **שלב 2: החלפת מבנה**
1. העתק את ה-head מהתבנית
2. החלף את ה-header
3. הוסף breadcrumbs
4. עטוף את התוכן ב-main
5. החלף את ה-footer

### **שלב 3: עדכון CSS**
1. הסר CSS ישן
2. הוסף `template.css`
3. עדכן קלאסים לפי התבנית

---

## 🎯 **דוגמה מלאה**

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>דף דוגמה - Pool Israel</title>
    <meta name="description" content="זהו דף דוגמה לשימוש בתבנית">
    <link rel="stylesheet" href="css/template.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Header מהתבנית -->
    
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
        <div class="container">
            <ol class="breadcrumb-list">
                <li><a href="home.html">דף הבית</a></li>
                <li>דף דוגמה</li>
            </ol>
        </div>
    </nav>
    
    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            <div class="page-header">
                <h1>כותרת הדף</h1>
                <p class="page-description">תיאור הדף</p>
            </div>
            
            <div class="grid grid-3">
                <div class="card">
                    <div class="card-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <h3>כרטיס 1</h3>
                    <p>תוכן הכרטיס</p>
                    <a href="#" class="btn btn-primary">לחץ כאן</a>
                </div>
                <!-- עוד כרטיסים... -->
            </div>
        </div>
    </main>
    
    <!-- Footer מהתבנית -->
    
    <script src="js/main.js"></script>
</body>
</html>
```

---

## 🚀 **יתרונות התבנית**

✅ **אחידות מלאה** בכל האתר  
✅ **קוד נקי ומסודר**  
✅ **Responsive מובנה**  
✅ **קל לתחזוקה**  
✅ **מהיר לפיתוח**  
✅ **SEO אופטימלי**  

---

**🎯 השתמש בתבנית הזו לכל דף חדש כדי להבטיח אחידות ואיכות גבוהה!**
