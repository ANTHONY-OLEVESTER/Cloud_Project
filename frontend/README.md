# Cloud Guard Platform - Frontend

React frontend for the Cloud Guard Platform, built with Vite and deployed to GitHub Pages.

## 🚀 Quick Start

### Development
```bash
cd frontend
npm install
npm run dev
```
The app will run on `http://localhost:5173`

### Production Build
```bash
npm run build
```

## 🔧 Configuration

### API Configuration
The frontend automatically detects the environment and uses the appropriate API URL:

- **Development**: `http://localhost:8000/api`
- **Production**: Your Railway backend URL

### Environment Variables
Create `.env.local` for local overrides:
```bash
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

## 📦 Deployment

### GitHub Pages (Automatic)
1. Push to the `Cloud_services` branch
2. GitHub Actions will automatically build and deploy
3. Site will be available at: `https://YOUR-USERNAME.github.io/Cloud_Project/`

### Manual Deployment
1. Update the Railway URL in `src/services/apiClient.js`
2. Update the base URL in `vite.config.js` if needed
3. Run `npm run build`
4. Deploy the `dist` folder to your hosting provider

## 🔗 Backend Connection

**IMPORTANT**: Before deploying, update the Railway backend URL in:
1. `src/services/apiClient.js` - line 2: `PRODUCTION_API`
2. `.github/workflows/deploy.yml` - line 35: `VITE_API_URL`

Replace `your-railway-app-name.up.railway.app` with your actual Railway domain.

## 🛠 Tech Stack
- React 18
- Vite
- TailwindCSS
- React Router
- React Query
- Recharts