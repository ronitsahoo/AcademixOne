import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureSection from '../components/FeatureSection'
import AuthForm from '../components/AuthForm'
import ThemeToggle from '../components/ThemeToggle'
import apiService from '../services/api'

function LoginPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (isLogin) {
        // Handle login
        const response = await apiService.login(formData.email, formData.password)

        // Store user data
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('user', JSON.stringify(response.user))

        // Navigate based on role
        if (response.user.role === 'student') {
          navigate('/student-dashboard')
        } else if (response.user.role === 'teacher') {
          navigate('/teacher-dashboard')
        }
      } else {
        // Handle signup
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match!')
          return
        }

        const response = await apiService.register(formData.email, formData.password, formData.role)

        // Store user data
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('user', JSON.stringify(response.user))

        // Navigate based on role
        if (response.user.role === 'student') {
          navigate('/student-dashboard')
        } else if (response.user.role === 'teacher') {
          navigate('/teacher-dashboard')
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      alert(error.message || 'Authentication failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 transition-colors duration-300">
      {/* Theme Toggle */}
      <ThemeToggle />

      <div className="flex min-h-screen">
        {/* Left Half - Features */}
        <FeatureSection />

        {/* Right Half - Login/Signup Form */}
        <div className="w-1/2 flex items-center justify-center min-h-screen p-8">
          <AuthForm
            isLogin={isLogin}
            setIsLogin={setIsLogin}
            formData={formData}
            setFormData={setFormData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}

export default LoginPage 