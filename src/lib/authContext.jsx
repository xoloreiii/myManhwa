import { createContext, useContext, useState } from 'react'
import { supabase } from './supabase'
import { clearMatureLock } from './matureContext'

const ADMIN_USER = 'xoloreiii'
const ADMIN_PASS = 'xoloreiii913'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // user shape: { role: 'admin'|'guest', username: string }

  const loginAdmin = (username, password) => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      clearMatureLock() // fresh session — admin isn't gated, but keep state clean
      setUser({ role: 'admin', username })
      return true
    }
    return false
  }

  const loginGuest = async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    try {
      await supabase.from('guest_log').insert([{ name: trimmed }])
    } catch (_) { /* non-blocking */ }
    clearMatureLock() // every new guest login must re-enter the access code
    setUser({ role: 'guest', username: trimmed })
    return true
  }

  const logout = () => {
    clearMatureLock() // next person to log in on this device starts locked
    setUser(null)
  }

  const isAdmin = user?.role === 'admin'
  const isGuest = user?.role === 'guest'

  return (
    <AuthContext.Provider value={{ user, isAdmin, isGuest, loginAdmin, loginGuest, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}