# AcademixOne Backend

## Environment Setup

Create a `.env` file in the backend directory with the following content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/academixone

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-123456789
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## API Endpoints

- Health Check: `GET /api/health`
- Authentication: `/api/auth/*`
- Users: `/api/users/*`
- Courses: `/api/courses/*`
- Assignments: `/api/assignments/*`
- Attendance: `/api/attendance/*`
- File Upload: `/api/upload/*`

