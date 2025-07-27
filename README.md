# AcademixOne - Academic Portal

A modern academic portal with authentication, separate dashboards for students and teachers, and a beautiful UI.

## Features

- **Authentication System**: Sign up and login with browser storage
- **Role-based Access**: Separate dashboards for students and teachers
- **Modern UI**: Beautiful design with dark/light theme toggle
- **Responsive Design**: Works on all devices
- **Google Sans Font**: Clean, modern typography

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Usage

#### Authentication

1. **Sign Up**: 
   - Click "Sign Up" tab
   - Enter your email and password
   - Select your role (Student or Faculty Member)
   - Click "Create Account"

2. **Login**:
   - Enter your registered email and password
   - Click "Sign In to Portal"

#### Student Dashboard

Students can access:
- **Overview**: Dashboard with stats and recent activity
- **My Courses**: View enrolled courses with progress
- **Assignments**: Track assignments and due dates
- **Grades**: View grades and GPA
- **Schedule**: Class schedule
- **Resources**: Learning materials

#### Teacher Dashboard

Teachers can access:
- **Overview**: Dashboard with teaching stats
- **My Courses**: Manage courses and students
- **Students**: Student management and attendance
- **Assignments**: Create and grade assignments
- **Grade Management**: Grade distribution and analytics
- **Resources**: Teaching materials and tools

#### Logout

Click the "Logout" button in the top-right corner of any dashboard to sign out.

## Technical Details

- **Frontend**: React with Vite
- **Styling**: Tailwind CSS
- **Storage**: Browser localStorage
- **Authentication**: Client-side with role-based routing
- **Font**: Product Sans (Google Sans alternative)

## Browser Storage

The app uses localStorage to store:
- `users`: Array of registered users
- `isAuthenticated`: Authentication status
- `user`: Current user data

## Development

- The app automatically redirects authenticated users to their appropriate dashboard
- Student role shows the Student Dashboard
- Teacher role shows the Teacher Dashboard
- All data persists in browser storage
- Theme preference is saved automatically

## File Structure

```
src/
├── components/
│   ├── AuthForm.jsx
│   ├── FeatureSection.jsx
│   └── ThemeToggle.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── StudentDashboard.jsx
│   └── TeacherDashboard.jsx
├── styles/
│   └── global.css
├── App.jsx
└── main.jsx
```
