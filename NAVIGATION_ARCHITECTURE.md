# SkillBoard Navigation Architecture 🧭

## Overview
This document explains the complete navigation system used in SkillBoard, including routing configuration, authentication flow, and navigation patterns.

---

## 🗺️ Routing Structure

### **App.jsx - Main Router Configuration**
```jsx
<HashRouter as Router>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/leetcodeloder" element={<LeetCodeLoader />} />
    <Route path="/codechefloder" element={<CodeChefLoader />} />
    <Route path="/codeforcesloder" element={<CodeForcesLoader />} />
    <Route path="/about" element={<About />} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/auth/callback" element={<AuthRedirect />} />
    <Route path="*" element={<HomePage />} /> {/* Fallback */}
  </Routes>
</HashRouter>
```

**Why HashRouter?**
- ✅ Better compatibility with static hosting (Netlify, Vercel, Render)
- ✅ No server-side configuration needed
- ✅ URLs work with `#` prefix (e.g., `/#/codechefloder`)

---

## 🔐 Authentication Flow

### **Protected Routes**
Routes like `/profile` require authentication:
```jsx
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!currentUser) return <Navigate to="/" replace />;
  
  return children;
};
```

### **Authentication Check Pattern**
Used in both `Home.jsx` and `Navbar.jsx`:
```javascript
const handleNavigation = (route) => {
    // 1. Check if user is logged in
    if (!currentUser) {
        showToast('Please sign in to access the analyzer', 'info');
        setShowLoginSignup(true); // Open login modal
        return; // Stop here
    }
    
    // 2. User is logged in, proceed with navigation
    navigate(route);
};
```

---

## 🏠 Home.jsx Navigation

### **Platform Cards Navigation**
When user clicks "Analyze CodeChef Profile" button:

```javascript
// 1. Platform data structure
const platforms = [
    {
        id: 'codechef',
        name: 'CodeChef',
        // ... other properties
    },
    // ... other platforms
];

// 2. Click handler
<button onClick={() => handleAnalyzerNavigation(platform.id)}>
    Analyze {platform.name} Profile
</button>

// 3. Navigation function
const handleAnalyzerNavigation = (platformId) => {
    // Check authentication
    if (!currentUser) {
        showToast('Please sign in to access the analyzer', 'info');
        setShowLoginSignup(true);
        return;
    }

    // Route mapping
    if (platformId === 'codechef') {
        navigate('/codechefloder');
    } else if (platformId === 'leetcode') {
        navigate('/leetcodeloder');
    } else if (platformId === 'codeforces') {
        navigate('/codeforcesloder');
    } else if (platformId === 'hackerrank') {
        showToast('HackerRank analyzer is coming soon! Stay tuned 🚀', 'info');
    }
};
```

**Flow:**
1. User clicks button → `handleAnalyzerNavigation(platformId)` called
2. Check if `currentUser` exists
3. If no → Show login modal
4. If yes → Navigate to analyzer page

---

## 🧭 Navbar.jsx Navigation

### **Services Dropdown Navigation**
When user clicks service option in navbar:

```javascript
// 1. Navigation items structure
const navItems = [
    { 
        name: 'Services', 
        icon: Briefcase, 
        isDropdown: true,
        subItems: [
            { name: 'CodeChef', route: '/codechefloder' },
            { name: 'LeetCode', route: '/leetcodeloder' },
            { name: 'CodeForces', route: '/codeforcesloder' }
        ]
    },
    // ... other nav items
];

// 2. Click handler (Desktop)
<button onClick={() => handleServiceNavigation(subItem.route)}>
    {subItem.name}
</button>

// 3. Click handler (Mobile)
<button onClick={() => handleServiceNavigation(subItem.route)}>
    {subItem.name}
</button>

// 4. Navigation function (renamed to avoid conflict with Home.jsx)
const handleServiceNavigation = (route) => {
    // Check authentication
    if (!currentUser) {
        showToast('Please sign in to access the analyzer', 'info');
        setShowLoginSignup(true);
        setOpenDropdown('');
        setIsMenuOpen(false);
        return;
    }
    
    // Close all dropdowns and menus
    setOpenDropdown('');
    setIsMenuOpen(false);
    
    // Navigate to the route
    navigate(route);
};
```

**Flow:**
1. User clicks service (CodeChef/LeetCode/CodeForces)
2. `handleServiceNavigation(route)` called with route path
3. Check if `currentUser` exists
4. If no → Show login modal + Close dropdowns
5. If yes → Close dropdowns + Navigate to analyzer page

---

## 🔄 Navigation Patterns Comparison

| Aspect | Home.jsx | Navbar.jsx |
|--------|----------|------------|
| **Function Name** | `handleAnalyzerNavigation` | `handleServiceNavigation` ✅ |
| **Parameter** | `platformId` (string) | `route` (string) |
| **Auth Check** | ✅ Yes | ✅ Yes |
| **Login Modal** | ✅ Opens on fail | ✅ Opens on fail |
| **Route Mapping** | Manual if-else | Direct route param |
| **State Cleanup** | None needed | Closes dropdowns + menu |
| **Navigation** | `navigate(route)` | `navigate(route)` |

---

## ⚠️ Important Notes

### **Function Naming Convention**
- **Home.jsx**: `handleAnalyzerNavigation(platformId)`
- **Navbar.jsx**: `handleServiceNavigation(route)` ← **Renamed to avoid confusion**

### **Route Consistency**
All analyzer routes use lowercase:
- ✅ `/codechefloder`
- ✅ `/leetcodeloder`
- ✅ `/codeforcesloder`
- ❌ NOT `/CodeChefLoder` or `/LeetCodeProfileAnalyze`

### **Authentication Context**
Both components use the same auth check:
```javascript
const { currentUser } = useAuth();

if (!currentUser) {
    // Show login
}
```

---

## 🐛 Common Issues & Solutions

### **Issue: Services dropdown doesn't navigate**
**Cause:** Function name conflict or dropdown not closing
**Solution:** 
- Renamed function to `handleServiceNavigation`
- Added proper state cleanup (`setOpenDropdown('')`, `setIsMenuOpen(false)`)

### **Issue: Routes not working**
**Cause:** Using BrowserRouter instead of HashRouter
**Solution:** 
- Changed to `HashRouter` in App.jsx
- Routes now use `/#/path` format

### **Issue: Duplicate function names**
**Cause:** Both Home.jsx and Navbar.jsx had `handleAnalyzerNavigation`
**Solution:**
- Home.jsx: `handleAnalyzerNavigation(platformId)` - Takes platform ID
- Navbar.jsx: `handleServiceNavigation(route)` - Takes route path

---

## 📱 Mobile vs Desktop Navigation

### **Desktop**
- Services dropdown appears horizontally below navbar
- Smooth animations with staggered delays
- Closes on click or outside click

### **Mobile**
- Services dropdown appears vertically in mobile menu
- Accordion-style expansion
- Closes entire menu on navigation

---

## 🔒 Security Features

1. **Protected Routes**: Profile page requires authentication
2. **Auth Check on Navigation**: All analyzer pages check for `currentUser`
3. **Login Modal**: Automatically opens if user tries to access protected content
4. **Toast Notifications**: Informs user why navigation failed

---

## 🎯 Navigation Best Practices

1. **Always check authentication** before navigating to protected routes
2. **Close dropdowns/menus** after navigation to clean UI state
3. **Show feedback** to user (toast messages) when action fails
4. **Use consistent route names** (lowercase, no special chars)
5. **Avoid duplicate function names** across components

---

## 📊 Navigation Flow Diagram

```
User Action
    ↓
Check Authentication
    ↓
    ├── Not Logged In → Show Login Modal → Return
    └── Logged In
            ↓
        Close UI Elements (dropdowns, menus)
            ↓
        Navigate to Route
            ↓
        Route Renders Component
```

---

## 🚀 Future Enhancements

- [ ] Add route transitions/animations
- [ ] Implement breadcrumb navigation
- [ ] Add route guards for admin routes
- [ ] Create navigation history tracking
- [ ] Add deep linking support
- [ ] Implement route-based analytics

---

**Last Updated:** November 1, 2025
**Maintainer:** Ayan Pandey
