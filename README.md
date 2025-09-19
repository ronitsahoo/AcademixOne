# AcademixOne - Academic Portal

A comprehensive academic portal with full-stack architecture, featuring authentication, role-based dashboards, course management, assignments, and attendance tracking.

## Features

### 🔐 Authentication System

- JWT-based secure authentication
- Role-based access control (Students, Teachers, Admins)
- Password hashing with bcrypt
- Token refresh functionality

### 👨‍🎓 Student Features

- **Dashboard**: Overview with stats and recent activity
- **Course Management**: Enroll/drop from courses, view detailed course information
- **Course Details**: Comprehensive course view with overview, assignments, and attendance
- **Assignments**: Submit assignments, track due dates, view grades
- **Attendance**: View attendance records and statistics
- **Profile Management**: Update personal information, department, and semester
- **First-time Setup**: Department and semester selection after first login

### 👨‍🏫 Teacher Features

- **Dashboard**: Teaching statistics and course overview
- **Course Management**: Create courses for multiple departments, update, and manage courses
- **Student Management**: View enrolled students, manage enrollments
- **Assignment Management**: Create assignments, grade submissions
- **Attendance Management**: Mark attendance, generate reports
- **File Upload**: Upload course resources and materials
- **Multi-Department Support**: Assign courses to multiple departments of the same semester

### 🎨 Modern UI/UX

- Beautiful, responsive design with Tailwind CSS
- Dark/light theme toggle
- Mobile-friendly interface
- Smooth animations and transitions

## Tech Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend

- **React 19** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios/Fetch** for API calls

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd AcademixOne
   ```

2. **Install all dependencies**

   ```bash
   npm run install-all
   ```

3. **Setup environment files**

   **Backend (.env):**

   ```bash
   cd backend
   # Create .env file with your MongoDB URI
   echo "NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/academixone
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads" > .env
   ```

   **Frontend (.env):**

   ```bash
   cd ../frontend
   echo "VITE_API_URL=http://localhost:5000/api" > .env
   ```

4. **Seed the database**

   ```bash
   cd ../backend
   npm run seed
   ```

5. **Start development servers**

   ```bash
   cd ..
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

### Sample Login Credentials

After running the seed script, you can use these credentials:

**Students:**

- john.doe@student.edu / password123
- jane.smith@student.edu / password123
- mike.johnson@student.edu / password123

**Teachers:**

- rupali.kale@teacher.edu / password123
- ravita.mishra@teacher.edu / password123
- abhishek.chaudhari@teacher.edu / password123

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### Course Endpoints

- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course (Teachers only)
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Enroll in course
- `DELETE /api/courses/:id/enroll` - Drop from course

### Assignment Endpoints

- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment (Teachers only)
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments/:id/submit` - Submit assignment
- `PUT /api/assignments/:id/grade/:studentId` - Grade assignment

### Attendance Endpoints

- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance session
- `PUT /api/attendance/:id/mark` - Mark attendance
- `GET /api/attendance/student/:studentId/summary` - Get student attendance summary

## Database Schema

### User Model

- Email, password (hashed), role (student/teacher/admin)
- Profile information (name, phone, department, etc.)
- Enrolled/teaching courses references

### Course Model

- Course details (name, code, description, credits)
- Instructor reference
- Enrolled students with status
- Schedule and syllabus information

### Assignment Model

- Assignment details and instructions
- Course and instructor references
- Student submissions with grades
- File attachments support

### Attendance Model

- Course and date information
- Student attendance records
- Session details and statistics

## File Structure

```
AcademixOne/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & validation
│   ├── scripts/         # Database seeding
│   ├── uploads/         # File uploads
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   └── styles/      # Global styles
│   └── public/          # Static assets
└── README.md
```

## Development

### Backend Development

```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Start Vite dev server
```

### Database Management

```bash
cd backend
npm run seed  # Populate database with sample data
```

## Deployment

### Backend Deployment

1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Configure environment variables for production
3. Deploy to your preferred platform (Heroku, DigitalOcean, AWS, etc.)

### Frontend Deployment

1. Build the production bundle: `npm run build`
2. Deploy the `dist` folder to your preferred hosting (Netlify, Vercel, etc.)
3. Update the API URL in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@academixone.com or create an issue in the repository.
