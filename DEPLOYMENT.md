# Cloud Guard Platform - Deployment Guide

## Backend Deployment on Railway

### Prerequisites
- Railway account
- GitHub account
- PostgreSQL database (Railway provides this)

### Setup Steps

#### 1. Railway Backend Deployment
1. Connect your backend repository to Railway
2. Railway will automatically detect the Python project
3. Add a PostgreSQL service to your Railway project
4. Configure the following environment variables in Railway:

```bash
DATABASE_URL=postgresql://username:password@hostname:port/database_name
APP_NAME=Cloud Guard Platform
PORT=8000
DEMO_SEED=false
CORS_ORIGINS=https://your-frontend-domain.github.io,https://your-frontend-domain.vercel.app
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

#### 2. PostgreSQL Setup
Railway will provide the DATABASE_URL automatically when you add a PostgreSQL service. The format will be:
```
postgresql://postgres:[password]@[host]:[port]/railway
```

#### 3. Frontend Configuration
Your frontend needs to be updated to use the Railway backend URL. Replace any localhost references with your Railway app URL:

```javascript
// Replace this
const API_BASE_URL = 'http://localhost:8000'

// With this (use your actual Railway domain)
const API_BASE_URL = 'https://your-app-name.up.railway.app'
```

### Railway Environment Variables Required:
- `DATABASE_URL` - Automatically provided by Railway PostgreSQL service
- `JWT_SECRET` - Generate a secure secret key
- `CORS_ORIGINS` - Add your frontend domain
- `DEMO_SEED` - Set to `false` for production

### Frontend Deployment Options

#### Option 1: GitHub Pages
1. Build your frontend project
2. Deploy to GitHub Pages
3. Update CORS_ORIGINS to include your GitHub Pages URL

#### Option 2: Vercel/Netlify
1. Connect your frontend repository
2. Deploy automatically
3. Update CORS_ORIGINS to include your deployed domain

### Testing the Deployment
1. Visit `https://your-app-name.up.railway.app/health` - should return `{"status": "ok"}`
2. Visit `https://your-app-name.up.railway.app/docs` - should show the API documentation
3. Test frontend API calls to ensure CORS is configured correctly

### Database Migration
The application will automatically create tables on startup via SQLAlchemy. Your existing SQLite data won't be migrated automatically - you'll start with a fresh database.

### Security Notes
- Never commit the `.env` file with real secrets
- Use strong, unique JWT secrets
- Enable HTTPS only in production
- Review CORS origins to only allow your frontend domains