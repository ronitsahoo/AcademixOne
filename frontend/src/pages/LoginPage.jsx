import { useState } from 'react'
import FeatureSection from '../components/FeatureSection'
import AuthForm from '../components/AuthForm'
import ThemeToggle from '../components/ThemeToggle'

function LoginPage() {
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

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isLogin) {
      // Handle login
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const user = users.find(u => u.email === formData.email && u.password === formData.password)
      
      if (user) {
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('user', JSON.stringify(user))
        window.location.reload() // Reload to trigger App.jsx useEffect
      } else {
        alert('Invalid email or password. Please try again or sign up.')
      }
    } else {
      // Handle signup
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match!')
        return
      }
      
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const existingUser = users.find(u => u.email === formData.email)
      
      if (existingUser) {
        alert('User with this email already exists!')
        return
      }
      
      const newUser = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        id: Date.now().toString()
      }
      
      users.push(newUser)
      localStorage.setItem('users', JSON.stringify(users))
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', JSON.stringify(newUser))
      window.location.reload() // Reload to trigger App.jsx useEffect
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 transition-colors duration-300">
      {/* Theme Toggle */}
      <ThemeToggle />
      
      <div className="flex h-screen">
        {/* Left Half - Features */}
        <FeatureSection />
        
        {/* Right Half - Login/Signup Form */}
        <div className="w-1/2 flex items-center justify-center p-8">
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