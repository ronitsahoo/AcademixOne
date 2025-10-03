# MongoDB Atlas Setup Guide

This guide will help you migrate from local MongoDB to MongoDB Atlas cloud database.

## Prerequisites

1. Create a MongoDB Atlas account at [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Have your backend project ready

## Step 1: Create a MongoDB Atlas Cluster

1. **Sign up/Login** to MongoDB Atlas
2. **Create a new project** or use an existing one
3. **Build a cluster**:
   - Choose the FREE tier (M0 Sandbox)
   - Select your preferred cloud provider and region
   - Name your cluster (e.g., "academixone-cluster")

## Step 2: Configure Database Access

1. **Create a Database User**:

   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Set database user privileges to "Read and write to any database"
   - Click "Add User"

2. **Whitelist IP Addresses**:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses
   - Click "Confirm"

## Step 3: Get Your Connection String

1. Go to "Clusters" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string (it looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 4: Update Your Environment Variables

1. Open your `.env` file in the backend directory
2. Replace the `MONGODB_URI` with your Atlas connection string:

   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.xxxxx.mongodb.net/academixone?retryWrites=true&w=majority
   ```

   **Important**:

   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Replace `<cluster-url>` with your actual cluster URL
   - Add `/academixone` before the `?` to specify the database name

## Step 5: Test the Connection

1. **Start your backend server**:

   ```bash
   npm run dev
   ```

2. **Check the console output** for:

   ```
   ✅ Connected to MongoDB Atlas
   🏛️  Database: academixone
   ```

3. **Seed your database** (optional):
   ```bash
   npm run seed
   ```

## Step 6: Verify in Atlas Dashboard

1. Go back to your MongoDB Atlas dashboard
2. Click "Browse Collections" on your cluster
3. You should see the `academixone` database with collections like:
   - users
   - courses
   - assignments
   - attendances

## Common Issues and Solutions

### Authentication Failed

- Double-check your username and password in the connection string
- Ensure the database user has proper permissions

### Network Timeout

- Verify your IP address is whitelisted in Network Access
- Check your internet connection

### Database Not Created

- The database will be created automatically when you first write data
- Run the seed script to populate initial data

### Connection String Format

Make sure your connection string follows this format:

```
mongodb+srv://username:password@cluster.mongodb.net/databasename?retryWrites=true&w=majority
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Restrict IP access** in production
4. **Use strong passwords** for database users
5. **Regularly rotate passwords**

## Production Deployment

When deploying to production:

1. **Create a production cluster** (consider a paid tier for better performance)
2. **Set up proper network access** (specific IP addresses)
3. **Use MongoDB Atlas monitoring** and alerts
4. **Set up automated backups**
5. **Configure proper indexes** for better performance

## Monitoring and Maintenance

- Use MongoDB Atlas built-in monitoring
- Set up alerts for connection issues
- Monitor database performance metrics
- Regular backup verification

---

Your AcademixOne backend is now configured to use MongoDB Atlas! 🎉
