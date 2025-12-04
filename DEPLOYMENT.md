# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Backend API**: Your Express.js backend needs to be deployed separately (see Backend Deployment section)
3. **GitHub/GitLab/Bitbucket Repository**: Your code should be in a Git repository

## Frontend Deployment (Vercel)

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Select the `front-end-system` folder as the root directory

2. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `front-end-system`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Environment Variables**:
   Add the following environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-api-url.com/api
   ```
   Replace `https://your-backend-api-url.com` with your actual backend API URL.

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**:
   ```bash
   cd front-end-system
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts and add environment variables when asked.

5. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   ```
   Enter your backend API URL when prompted.

6. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Backend Deployment

Your Express.js backend needs to be deployed separately. Recommended platforms:

### Option 1: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Add PostgreSQL database
4. Set environment variables (DATABASE_URL, JWT_SECRET, etc.)
5. Deploy

### Option 2: Render
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your repository
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Add PostgreSQL database
7. Set environment variables

### Option 3: Heroku
1. Install Heroku CLI
2. Create Heroku app
3. Add PostgreSQL addon
4. Set environment variables
5. Deploy

## Environment Variables

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://api.yourapp.com/api`)

### Backend (Railway/Render/Heroku)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `EMAIL_HOST`: SMTP host for emails
- `EMAIL_PORT`: SMTP port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret
- `NODE_ENV`: `production`

## Post-Deployment Checklist

1. ✅ Update `NEXT_PUBLIC_API_URL` in Vercel environment variables
2. ✅ Ensure backend API is deployed and accessible
3. ✅ Run database migrations on backend
4. ✅ Test authentication flow
5. ✅ Test API endpoints
6. ✅ Update CORS settings on backend to allow Vercel domain
7. ✅ Test OAuth callbacks (update redirect URLs in OAuth providers)

## CORS Configuration

Make sure your backend allows requests from your Vercel domain:

```typescript
// In your backend CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-project.vercel.app',
  'https://your-custom-domain.com'
];
```

## Custom Domain

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally

### API Calls Fail
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend CORS settings
- Verify backend is deployed and accessible

### Environment Variables Not Working
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Continuous Deployment

Vercel automatically deploys on every push to your main branch. For other branches, it creates preview deployments.

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)

