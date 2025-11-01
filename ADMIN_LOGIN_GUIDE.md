# Admin Login Feature 🛡️

## Overview
The SkillBoard platform now includes an **Admin Access** feature that allows authorized users to log in without requiring Supabase authentication. This is useful for administrators, testers, or demo purposes.

## How It Works

### 1. **Admin Login Button**
- Located on the home page, next to the "Start Comparing" button
- Opens a secure login popup when clicked
- Features a shield icon and dark theme styling

### 2. **Authentication**
- Admin credentials are stored in environment variables (`.env` file)
- Username and password are validated against the environment variables
- Upon successful login, a mock admin user is created and stored in localStorage
- Admin session persists across page refreshes until logout

### 3. **Admin Features**
- Full access to all platform features without Supabase sign-up
- Admin badge (shield icon) displayed in the navbar
- Special "Admin User" display name
- Separate logout flow that clears localStorage

## Configuration

### Environment Variables
Add these to your `.env` file:

```bash
# Admin Login Credentials
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=SkillBoard@2025
```

### Security Recommendations

⚠️ **IMPORTANT**: For production environments:
1. Use strong, unique passwords
2. Change the default credentials immediately
3. Consider implementing additional security measures like:
   - IP whitelisting
   - 2FA for admin access
   - Rate limiting on login attempts
   - Encrypted credential storage

## Files Modified

### New Files
- `Frontend/src/components/AdminLogin.jsx` - Admin login popup component

### Modified Files
- `Frontend/src/context/AuthContext.jsx` - Added admin login logic
- `Frontend/src/components/Home.jsx` - Added admin login button
- `Frontend/src/components/Navbar.jsx` - Added admin badge display
- `Frontend/.env` - Added admin credentials
- `Frontend/.env.example` - Added admin credential template

## Usage

### For Admins
1. Click the "Admin Access" button on the home page
2. Enter the admin username and password
3. Click "Login as Admin"
4. You'll be logged in with full access to the platform

### For Developers
To add admin-only features in your components:

```jsx
import { useAuth } from '../context/AuthContext';

const YourComponent = () => {
  const { isAdmin } = useAuth();

  return (
    <div>
      {isAdmin && (
        <div>
          {/* Admin-only content */}
        </div>
      )}
    </div>
  );
};
```

## UI/UX Features

### Login Popup
- **Dark Theme**: Gradient background with glass morphism effect
- **Animated Shield Icon**: Pulsing animation for visual appeal
- **Password Toggle**: Eye icon to show/hide password
- **Loading State**: Spinner animation during authentication
- **Responsive Design**: Works on all screen sizes

### Admin Badge
- **Shield Icon**: Golden shield icon (⚡) displayed next to username
- **Special Styling**: Distinct visual indicator in navbar
- **Both Desktop & Mobile**: Consistent across all views

## Technical Details

### Admin User Object
```javascript
{
  id: 'admin-user',
  email: 'admin@skillboard.com',
  user_metadata: {
    full_name: 'Admin User',
    role: 'admin'
  },
  role: 'admin'
}
```

### Storage
- Admin session stored in `localStorage`:
  - `isAdmin`: Boolean flag
  - `adminUser`: Serialized admin user object

### Logout
- Clears localStorage
- Resets authentication state
- Redirects to home page

## Future Enhancements

Potential improvements for the admin system:
- [ ] Multiple admin roles (super admin, moderator, etc.)
- [ ] Admin dashboard with analytics
- [ ] Activity logging for admin actions
- [ ] Session timeout for security
- [ ] Admin user management interface
- [ ] Encrypted credential storage
- [ ] Two-factor authentication
- [ ] Rate limiting on login attempts

## Support

For issues or questions about the admin feature:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure localStorage is enabled in the browser
4. Clear localStorage and try again if experiencing issues

---

**Note**: This feature is designed for development and demo purposes. For production use, implement additional security measures and consider using a proper admin authentication system.
