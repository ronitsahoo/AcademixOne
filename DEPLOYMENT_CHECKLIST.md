# Deployment Checklist for Render

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All code committed and pushed to GitHub
- [ ] `.env` files are in `.gitignore`
- [ ] MongoDB Atlas database is set up and accessible
- [ ] All dependencies are listed in `package.json` files
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend starts without errors (`npm start`)

### ✅ Environment Variables Ready
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `JWT_SECRET` - Secure random string for JWT signing
- [ ] `NODE_ENV` - Set to "production"
- [ ] `FRONTEND_URL` - Frontend URL for CORS
- [ ] `VITE_API_URL` - Backend API URL for frontend

### ✅ MongoDB Atlas Configuration
- [ ] Database user created with read/write permissions
- [ ] Network access configured (allow all IPs: 0.0.0.0/0 or specific IPs)
- [ ] Connection string tested and working
- [ ] Database name is "academixone"

## Render Deployment Steps

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Connect your GitHub repository

### Step 2: Deploy Using Blueprint (Recommended)
1. In Render Dashboard, click "New" → "Blueprint"
2. Select your GitHub repository
3. Render will detect `render.yaml` and create services automatically
4. Review the services that will be created:
   - `academixone-backend` (Web Service)
   - `academixone-frontend` (Static Site)

### Step 3: Configure Environment Variables
In Render Dashboard, for the backend service, add:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/academixone?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-here
NODE_ENV=production
FRONTEND_URL=https://academixone-frontend.onrender.com
```

### Step 4: Deploy and Monitor
1. Services will start deploying automatically
2. Monitor logs in Render dashboard
3. Check health endpoint: `https://your-backend-url.onrender.com/api/health`
4. Test frontend: `https://your-frontend-url.onrender.com`

## Post-Deployment Checklist

### ✅ Verify Deployment
- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Database connection is working
- [ ] User registration/login works
- [ ] API endpoints respond correctly
- [ ] Real-time chat functionality works
- [ ] File uploads work (if applicable)

### ✅ Performance & Security
- [ ] HTTPS is enabled (automatic with Render)
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Error handling works correctly
- [ ] Logs are accessible in Render dashboard

### ✅ Optional: Seed Database
If you want sample data:
1. Access Render shell for backend service
2. Run: `npm run seed`
3. Verify sample users and courses are created

## GitHub Actions CI/CD

### ✅ Automatic Deployment
- [ ] GitHub Actions workflow runs on push to main
- [ ] Tests pass in CI pipeline
- [ ] Frontend builds successfully
- [ ] Render auto-deploys when main branch is updated

### ✅ Monitoring
- [ ] GitHub Actions show green checkmarks
- [ ] Render deployment logs show no errors
- [ ] Application is accessible at production URLs

## Troubleshooting Common Issues

### Build Failures
- Check Node.js version compatibility (18+)
- Verify all dependencies are in package.json
- Check build logs in Render dashboard

### Database Connection Issues
- Verify MongoDB Atlas connection string
- Check network access settings in Atlas
- Ensure database user has proper permissions

### CORS Errors
- Update FRONTEND_URL in backend environment variables
- Check allowed origins in server.js

### Environment Variable Issues
- Ensure all required env vars are set in Render
- Check for typos in variable names
- Restart services after updating env vars

## Production URLs

After successful deployment:
- **Frontend**: `https://academixone-frontend.onrender.com`
- **Backend API**: `https://academixone-backend.onrender.com`
- **Health Check**: `https://academixone-backend.onrender.com/api/health`

## Default Login Credentials (After Seeding)
- **Teacher**: teacher@example.com / password123
- **Students**: student1@example.com to student5@example.com / password123

---

## Support Resources
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)