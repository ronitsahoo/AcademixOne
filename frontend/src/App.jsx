import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import './styles/global.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    const userData = localStorage.getItem('user')
    
    if (authStatus === 'true' && userData) {
      setIsAuthenticated(true)
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  // If user is authenticated, show appropriate dashboard
  if (isAuthenticated && currentUser) {
    if (currentUser.role === 'student') {
      return <StudentDashboard />
    } else if (currentUser.role === 'teacher') {
      return <TeacherDashboard />
    }
  }

  return <LoginPage />
}

export default App
