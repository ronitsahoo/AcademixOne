# AcademixOne Academic Portal

A comprehensive academic management system built with React, Node.js, and MongoDB.

## 🚀 Live Demo

- **Frontend**: [https://academixone-frontend.onrender.com](https://academixone-frontend.onrender.com)
- **Backend API**: [https://academixone-backend.onrender.com](https://academixone-backend.onrender.com)
- **API Health**: [https://academixone-backend.onrender.com/api/health](https://academixone-backend.onrender.com/api/health)

[![Deploy Status](https://img.shields.io/badge/deploy-ready-brightgreen)](https://render.com)
[![CI/CD](https://github.com/yourusername/academixone/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/yourusername/academixone/actions)

## 📋 Features

- **Student Management**: Registration, profiles, course enrollment
- **Course Management**: Create courses, modules, assignments
- **Assignment System**: Submit, grade, and track assignments
- **Attendance Tracking**: Mark and monitor student attendance
- **Real-time Chat**: Course-specific communication
- **Announcements**: Course updates and notifications
- **Dashboard**: Role-based dashboards for students and teachers

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Socket.io Client** for real-time features

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Multer** for file uploads

### Deployment
- **Render** for hosting
- **GitHub Actions** for CI/CD
- **MongoDB Atlas** for database

## 🏗️ Project Structure

```
AcademixOne/
├── backend/                 # Node.js API server
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication & validation
│   ├── socket/             # Socket.io handlers
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── utils/          # Utility functions
│   └── dist/               # Built files
├── .github/workflows/      # GitHub Actions
└── render.yaml            # Render deployment config
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/academixone.git
   cd academixone
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**:
   
   Backend (`backend/.env`):
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/academixone
   JWT_SECRET=your-super-secure-jwt-secret
   NODE_ENV=development
   PORT=3001
   ```
   
   Frontend (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

5. **Seed database** (optional):
   ```bash
   npm run seed
   ```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health

## 🚀 Deployment

This project is configured for automatic deployment to Render using GitHub Actions.

### Quick Deploy to Render

1. **Fork this repository**
2. **Set up MongoDB Atlas** (see [MongoDB Atlas Setup Guide](backend/MONGODB_ATLAS_SETUP.md))
3. **Deploy to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will create both frontend and backend services

4. **Configure Environment Variables** in Render Dashboard:
   ```
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-super-secure-jwt-secret
   NODE_ENV=production
   ```

5. **Push to main branch** to trigger deployment:
   ```bash
   git push origin main
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (teachers only)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course

### Assignments
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment
- `POST /api/assignments/:id/submit` - Submit assignment

### More endpoints available - see route files in `backend/routes/`

## 🧪 Testing

```bash
# Test database connection
npm run test:db

# Run linting
npm run lint

# Build for production
npm run build
```

## 🔧 Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`, models in `backend/models/`
2. **Frontend**: Add components in `frontend/src/components/`, pages in `frontend/src/pages/`
3. **API Integration**: Update `frontend/src/services/api.js`

### Environment Variables

#### Backend
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `FRONTEND_URL` - Frontend URL for CORS

#### Frontend
- `VITE_API_URL` - Backend API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- **Database Setup**: See [MongoDB Atlas Setup Guide](backend/MONGODB_ATLAS_SETUP.md)
- **Issues**: Open an issue on GitHub

## 🎯 Default Login Credentials

After seeding the database:
- **Teacher**: teacher@example.com / password123
- **Students**: student1@example.com to student5@example.com / password123

---

Built with ❤️ by the AcademixOne Team