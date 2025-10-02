// Authentication utilities
import apiService from '../services/api';

export const logout = async (navigate) => {
  try {
    await apiService.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear all authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    
    // Dispatch custom event to notify App component
    window.dispatchEvent(new CustomEvent('authStateChange', {
      detail: { isAuthenticated: false, user: {} }
    }));
    
    // Navigate to login page
    if (navigate) {
      navigate('/');
    }
  }
};

export const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};