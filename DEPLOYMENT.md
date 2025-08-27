# 🚀 BiteTracker Deployment Guide

## Production Environment Variables

Set these in your Railway dashboard:

### Required Environment Variables:
```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/bite_tracker_db
DB_NAME=bite_tracker_db
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=https://your-frontend-domain.com
VERCEL_URL=your-vercel-app-name.vercel.app
```

### Important Security Notes:
- **SECRET_KEY**: Generate a strong random string (at least 32 characters)
- **MONGODB_URI**: Use your production MongoDB Atlas connection string
- **FRONTEND_URL**: Set to your actual frontend domain

## Frontend Deployment

### For Vercel:
1. Push your frontend code to GitHub
2. Connect your repository to Vercel
3. Set environment variable: `REACT_APP_API_URL=https://your-railway-app.up.railway.app`

### For Netlify:
1. Push your frontend code to GitHub
2. Connect your repository to Netlify
3. Set environment variable: `REACT_APP_API_URL=https://your-railway-app.up.railway.app`

## Backend Deployment (Railway)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add authentication system with user login and profiles"
   git push origin main
   ```

2. **Railway will automatically deploy** from your GitHub repository

3. **Verify deployment**:
   - Check Railway logs for any errors
   - Test the health endpoint: `https://your-railway-app.up.railway.app/health`
   - Test authentication endpoints

## Post-Deployment Testing

1. **Test Registration**: Create a new user account
2. **Test Login**: Verify JWT tokens work
3. **Test Protected Routes**: Ensure all features require authentication
4. **Test Bulk Upload**: Verify file uploads work with authentication
5. **Test Analytics**: Ensure data is user-specific

## Database Migration

Your existing data will need to be migrated to include user_id fields. You have two options:

### Option 1: Manual Migration (Recommended for small datasets)
1. Export existing data
2. Add a default user_id to all records
3. Re-import with user_id field

### Option 2: Automated Migration Script
Create a migration script to add user_id to existing records.

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Check FRONTEND_URL environment variable
2. **Authentication Failures**: Verify SECRET_KEY is set correctly
3. **Database Connection**: Check MONGODB_URI format
4. **Frontend API Calls**: Ensure REACT_APP_API_URL points to production

### Monitoring:
- Check Railway logs for errors
- Monitor MongoDB Atlas for connection issues
- Test authentication flow regularly

## Security Considerations

1. **SECRET_KEY**: Use a strong, random key
2. **HTTPS**: Ensure all production URLs use HTTPS
3. **CORS**: Only allow your frontend domain
4. **Rate Limiting**: Consider adding rate limiting for auth endpoints
5. **Password Policy**: Consider enforcing stronger password requirements

## Rollback Plan

If issues occur:
1. Keep your old deployment running
2. Test thoroughly in staging first
3. Have a rollback strategy ready
4. Monitor closely after deployment
