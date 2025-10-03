# AcademixOne Deployment Guide

This guide covers deploying AcademixOne to Render with GitHub Actions CI/CD.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Database should be set up and accessible

## Step-by-Step Deployment Process

### 1. Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Ensure all sensitive data is in .gitignore**:
   - `.env` files with actual credentials
   - `node_modules/`
   - Upload directories

### 2. Set Up Render Services

#### Option A: Using Render Blueprint (Recommended)

1. **Connect GitHub to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing your AcademixOne project

2. **Configure Blueprint**:
   - Render will automatically detect the `render.yaml` file
   - Review the services that will be created:
     - `academixone-backend` (Web Service)
     - `academixone-frontend` (Static Site)

3. **Set Environment Variables**:
   - For the backend service, set these environment variables in Render dashboard:
     ```
     MONGODB_URI=your-mongodb-atlas-connection-string
     JWT_SECRET=your-super-secure-jwt-secret
     NODE_ENV=production
     FRONTEND_URL=https://academixone-frontend.onrender.com
     ```

#### Option B: Manual Service Creation

If you prefer to create services manually:

1. **Create Backend Service**:
   - New → Web Service
   - Connect GitHub repository
   - Configure:
     - Name: `academixone-backend`
     - Runtime: Node
     - Build Command: `cd backend && npm install`
     - Start Command: `cd backend && npm start`
     - Plan: Free

2. **Create Frontend Service**:
   - New → Static Site
   - Connect same GitHub repository
   - Configure:
     - Name: `academixone-frontend`
     - Build Command: `cd frontend && npm install && npm run build`
     - Publish Directory: `frontend/dist`
     - Plan: Free

### 3. Configure Environment Variables

#### Backend Environment Variables (Set in Render Dashboard):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/academixone?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-here
NODE_ENV=production
FRONTEND_URL=https://academixone-frontend.onrender.com
PORT=10000
```

#### Frontend Environment Variables (Set in Render Dashboard):
```
VITE_API_URL=https://academixone-backend.onrender.com
```

### 4. Update MongoDB Atlas Network Access

1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Add Render's IP ranges or allow all IPs (0.0.0.0/0) for simplicity
4. Ensure your database user has proper permissions

### 5. GitHub Actions Setup

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
- Run tests on every push/PR
- Lint code
- Build frontend
- Test database connection (if credentials are available)
- Trigger deployment on main branch pushes

#### Set GitHub Secrets (Optional):
Go to your GitHub repository → Settings → Secrets and variables → Actions:
```
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-secret
```

### 6. Deploy and Test

1. **Initial Deployment**:
   - Push to main branch triggers automatic deployment
   - Monitor deployment in Render dashboard
   - Check logs for any errors

2. **Test Your Deployment**:
   - Backend health check: `https://your-backend-url.onrender.com/api/health`
   - Frontend: `https://your-frontend-url.onrender.com`

3. **Seed Database** (if needed):
   - Access Render shell for backend service
   - Run: `npm run seed`

## Deployment URLs

After successful deployment, your services will be available at:
- **Frontend**: `https://academixone-frontend.onrender.com`
- **Backend API**: `https://academixone-backend.onrender.com`

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check network access settings in Atlas
   - Ensure database user has proper permissions

3. **CORS Issues**:
   - Update FRONTEND_URL in backend environment variables
   - Check CORS configuration in server.js

4. **Environment Variables**:
   - Ensure all required env vars are set in Render dashboard
   - Check for typos in variable names
   - Restart services after updating env vars

### Monitoring:

- **Logs**: Check Render dashboard for real-time logs
- **Health Checks**: Monitor `/api/health` endpoint
- **Performance**: Use Render's built-in metrics

## Continuous Deployment

Once set up, your deployment process is:
1. Make changes to your code
2. Push to main branch
3. GitHub Actions runs tests
4. Render automatically deploys if tests pass
5. Services restart with new code

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to repository
2. **JWT Secret**: Use a strong, unique secret for production
3. **Database**: Restrict MongoDB Atlas network access when possible
4. **HTTPS**: Render provides SSL certificates automatically
5. **Rate Limiting**: Ensure rate limiting is configured in your backend

## Scaling

- **Free Tier Limitations**: Services sleep after 15 minutes of inactivity
- **Paid Plans**: Consider upgrading for production use
- **Database**: Monitor MongoDB Atlas usage and upgrade as needed

---

## Quick Commands Reference

```bash
# Local development
npm run dev          # Start development servers
npm run build        # Build for production
npm run test-db      # Test database connection

# Deployment
git push origin main # Trigger deployment
```

For support, check:
- [Render Documentation](https://render.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)