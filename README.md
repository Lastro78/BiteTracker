# 🎣 BiteTracker - Fishing Catch Logger

A comprehensive fishing catch tracking application with user authentication, analytics, and bulk data management.

## ✨ Features

### 🔐 Authentication System
- **User Registration & Login**: Secure JWT-based authentication
- **Profile Management**: Update personal information and change passwords
- **Protected Routes**: All features require user authentication
- **User Data Isolation**: Each user only sees their own catch data

### 📊 Catch Management
- **Log Catches**: Record detailed fishing information
- **Bulk Upload**: Import multiple catches via CSV or JSON files
- **View & Edit**: Manage your fishing records
- **Data Validation**: Ensures data integrity and consistency

### 📈 Analytics & Insights
- **Bait Success Analysis**: Track which baits perform best
- **Time Analysis**: Find optimal fishing times
- **Structure Analysis**: Analyze catch patterns by structure type
- **Water Temperature Analysis**: Correlate temperature with catch success
- **Enhanced Analytics**: AI-powered insights and predictions
- **Advanced Analytics**: Dynamic analysis with custom grouping and filtering
- **Statistics Overview**: Comprehensive fishing statistics dashboard

### 🗺️ Advanced Features
- **Heat Map Visualization**: Geographic catch distribution
- **Custom Options Management**: Configure fishing options and preferences
- **Export Capabilities**: Download data in various formats
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)
- **FastAPI**: Modern, fast web framework
- **MongoDB**: NoSQL database with Motor async driver
- **JWT Authentication**: Secure token-based authentication
- **Pydantic Models**: Data validation and serialization
- **CORS Support**: Cross-origin resource sharing

### Frontend (React)
- **React 18**: Modern UI framework
- **Context API**: State management for authentication and fishing data
- **React Router**: Client-side routing with protected routes
- **Axios**: HTTP client with automatic token handling
- **Recharts**: Data visualization library
- **Lucide React**: Beautiful icons

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB (local or Atlas)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd BiteTracker
   ```

2. **Backend Setup**
   ```bash
   # Create virtual environment
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   
   # Run the backend
   uvicorn main:app --reload --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create environment file
   echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
   
   # Start the frontend
   npm start
   ```

4. **Access the Application**
   - Backend API: http://localhost:8000
   - Frontend App: http://localhost:3000
   - API Documentation: http://localhost:8000/docs

## 🚀 Production Deployment

### Quick Deploy to Railway

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add authentication system"
   git push origin main
   ```

2. **Set Environment Variables in Railway**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `SECRET_KEY`: Strong random string (32+ characters)
   - `FRONTEND_URL`: Your frontend domain
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: 30

3. **Deploy Frontend**
   - Push frontend to separate repository
   - Deploy to Vercel/Netlify
   - Set `REACT_APP_API_URL` to your Railway backend URL

### Detailed Deployment Guide
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

## 📁 Project Structure

```
BiteTracker/
├── main.py                 # FastAPI backend application
├── models.py              # Pydantic data models
├── requirements.txt       # Python dependencies
├── DEPLOYMENT.md         # Deployment instructions
├── migrate_existing_data.py  # Data migration script
└── frontend/             # React frontend application
    ├── src/
    │   ├── components/   # Reusable UI components
    │   ├── contexts/     # React contexts (Auth, Fishing)
    │   ├── hooks/        # Custom React hooks
    │   ├── pages/        # Application pages
    │   └── config/       # Configuration files
    ├── public/           # Static assets
    └── package.json      # Node.js dependencies
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `PUT /auth/profile` - Update user profile
- `POST /auth/change-password` - Change password

### Catches
- `GET /catches/` - Get all user's catches
- `POST /catches/` - Create new catch
- `GET /catches/{id}` - Get specific catch
- `PUT /catches/{id}` - Update catch
- `DELETE /catches/{id}` - Delete catch

### Bulk Operations
- `POST /catches/bulk` - Upload multiple catches
- `GET /catches/template/csv` - Download CSV template
- `GET /catches/template/json` - Download JSON template

### Analytics
- `POST /analyze/` - Run data analysis
- `POST /analyze/advanced/` - Advanced dynamic analysis
- `GET /catches/stats/overview` - Get fishing statistics overview
- `GET /catches/options/{field_name}` - Get field options for filtering

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **CORS Protection**: Configured for specific domains
- **Input Validation**: Pydantic model validation
- **User Data Isolation**: Users can only access their own data
- **Environment Variables**: Secure configuration management

## 🧪 Testing

### Backend Testing
```bash
# Run backend tests
pytest

# Test specific endpoint
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123","full_name":"Test User"}'
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Review the [API Documentation](http://localhost:8000/docs) when running locally
3. Check the deployment logs in Railway dashboard

## 🔄 Migration from Previous Version

If you're upgrading from a version without authentication:

1. Deploy the new version
2. Create your first user account
3. Run the migration script: `python migrate_existing_data.py`
4. Verify all data is properly associated with your user account

---

**Happy Fishing! 🎣**
