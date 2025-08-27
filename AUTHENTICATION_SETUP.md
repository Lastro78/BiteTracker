# BiteTracker Authentication System

This document explains the authentication system that has been added to your BiteTracker application.

## Features Added

### Backend Authentication
- **User Registration**: Users can create accounts with username, email, and password
- **User Login**: Secure login with JWT tokens
- **Password Hashing**: Passwords are securely hashed using bcrypt
- **JWT Tokens**: Secure token-based authentication
- **User Profiles**: Users can update their profile information
- **Password Changes**: Users can change their passwords securely
- **Protected Routes**: All catch-related endpoints now require authentication

### Frontend Authentication
- **Login Page**: Beautiful login form with validation
- **Registration Page**: User registration with form validation
- **Profile Page**: User profile management
- **Protected Routes**: React routes are protected based on authentication status
- **Header Integration**: Dynamic header showing user status and navigation
- **Token Management**: Automatic token storage and management

## Backend Changes

### New Dependencies Added
```txt
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
```

### New API Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `PUT /auth/profile` - Update user profile
- `POST /auth/change-password` - Change password

### Database Changes
- New `users` collection in MongoDB
- All catches now include a `user_id` field
- Users can only access their own catches

## Frontend Changes

### New Components
- `AuthContext.js` - Authentication state management
- `Login.js` - Login page component
- `Register.js` - Registration page component
- `Profile.js` - User profile management

### Updated Components
- `App.js` - Added authentication routing
- `Header.js` - Added user menu and authentication buttons

## Environment Variables

### Backend (.env file)
```env
SECRET_KEY=your-secret-key-change-in-production
MONGODB_URI=mongodb://localhost:27017
DB_NAME=bite_tracker_db
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env file)
```env
REACT_APP_API_URL=https://web-production-df22.up.railway.app
```

## Security Features

1. **Password Security**: Passwords are hashed using bcrypt
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Tokens expire after 30 minutes
4. **Protected Routes**: All sensitive endpoints require authentication
5. **User Isolation**: Users can only access their own data
6. **Input Validation**: Comprehensive form validation
7. **Error Handling**: Secure error messages

## User Flow

1. **Registration**: Users create an account with username, email, and password
2. **Login**: Users log in with their credentials
3. **Authentication**: JWT token is stored and used for API requests
4. **Protected Access**: Users can only access their own catches and data
5. **Profile Management**: Users can update their profile and change passwords
6. **Logout**: Users can log out, clearing their authentication

## Migration Notes

### For Existing Data
If you have existing catch data without user associations, you'll need to:
1. Create a user account
2. Manually associate existing catches with the user ID
3. Or create a migration script to assign catches to a default user

### For Production Deployment
1. Change the `SECRET_KEY` to a secure random string
2. Ensure MongoDB is properly secured
3. Set up HTTPS for production
4. Configure proper CORS settings
5. Set up environment variables in your deployment platform

## Testing the Authentication

1. Start your backend server
2. Start your frontend application
3. Navigate to the app - you should be redirected to login
4. Create a new account or log in
5. Test the protected routes and user-specific data access

## Next Steps

Consider adding these features in the future:
- Email verification
- Password reset functionality
- Social login (Google, Facebook, etc.)
- User roles and permissions
- Account deletion
- Activity logging
