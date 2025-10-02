import { useState, useEffect } from 'react'
import studentImg from '../assets/student.png'
import assignmentImg from '../assets/assignment.png'
import academicImg from '../assets/academic.png'
import facultyImg from '../assets/faculty.png'
import adminImg from '../assets/admin.png'
import notificationImg from '../assets/notification.png'
import logo from '../assets/logo.png'

function FeatureSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const features = [
    {
      title: "Student Dashboard",
      description: "Access personalized academic feeds, track assignments, monitor grades, and view attendance records in real-time",
      icon: studentImg
    },
    {
      title: "Assignment Management",
      description: "Submit assignments electronically, track submission deadlines, and monitor grading status with comprehensive feedback",
      icon: assignmentImg
    },
    {
      title: "Academic Analytics",
      description: "View detailed subject-wise attendance reports, exam performance metrics, and comprehensive grade analytics",
      icon: academicImg
    },
    {
      title: "Faculty Portal",
      description: "Create and manage assignments, grade student submissions, and maintain attendance records efficiently",
      icon: facultyImg
    },
    {
      title: "Administrative Control",
      description: "Manage user accounts, publish institutional announcements, and configure platform settings",
      icon: adminImg
    },
    {
      title: "Communication Hub",
      description: "Receive real-time notifications for assignments, deadlines, grade updates, and institutional announcements",
      icon: notificationImg
    }
  ]

  const scrollToNext = (direction) => {
    const container = document.querySelector('.feature-scroll')
    if (container) {
      const scrollAmount = 320 + 24 // card width + spacing
      const currentScroll = container.scrollLeft
      const newScroll = direction === 'next' 
        ? currentScroll + scrollAmount 
        : currentScroll - scrollAmount
      
      container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      })
    }
  }

  const scrollToIndex = (index) => {
    const container = document.querySelector('.feature-scroll')
    if (container) {
      const scrollAmount = (320 + 24) * index // card width + spacing
      container.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      })
      setCurrentIndex(index)
    }
  }

  useEffect(() => {
    const container = document.querySelector('.feature-scroll')
    if (container) {
      const handleScroll = () => {
        const scrollLeft = container.scrollLeft
        const cardWidth = 320 + 24 // card width + spacing
        const newIndex = Math.round(scrollLeft / cardWidth)
        setCurrentIndex(newIndex)
      }
      
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="w-1/2 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-8 relative overflow-hidden flex flex-col min-h-screen">
      {/* Logo */}
      <div className="text-center mb-6 flex-shrink-0">
        <img src={logo} alt="AcademixOne Logo" className="mx-auto max-h-32 w-auto" />
      </div>

      {/* Features Section */}
      <div className="flex-1 relative">
        <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide feature-scroll h-full items-center">
          {features.map((feature, index) => (
            <div key={index} className="flex-shrink-0 w-80 h-72 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 shadow-lg flex flex-col justify-center">
              <div className="text-5xl mb-6 flex justify-center">
                <img src={feature.icon} alt={feature.title} className="w-16 h-16 object-contain" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 text-center">{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed text-center opacity-90 flex-1 line-clamp-3 overflow-hidden">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* Navigation Buttons */}
        <div className="absolute top-1/2 transform -translate-y-1/2 flex justify-between w-full px-4 pointer-events-none z-10">
          <button 
            onClick={() => scrollToNext('prev')}
            className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 pointer-events-auto shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={() => scrollToNext('next')}
            className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 pointer-events-auto shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Scroll Indicators */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-blue-400 scale-125' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/10 flex-shrink-0">
        <div className="text-center">
          {/* Social Links */}
          <div className="flex justify-center space-x-6 mb-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
          </div>
          
          {/* Contact Links */}
          <div className="flex justify-center space-x-8 mb-4 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Terms</a>
          </div>
          
          <p className="text-gray-500 text-xs">
            © 2025 AcademixOne. All rights reserved. | 
            <span className="ml-2 text-gray-600">Version 1.10.2025</span>
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-32 right-16 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 left-16 w-32 h-32 bg-slate-400/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gray-400/5 rounded-full blur-2xl"></div>
    </div>
  )
}

export default FeatureSection 