import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Sync token into axios default header whenever it changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('token', token)
    } else {
      delete api.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
    }
  }, [token])

  const register = async (name, email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      setToken(data.token)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.token)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setError(null)
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
