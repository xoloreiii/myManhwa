import { createContext, useContext, useState, useEffect } from 'react'

export const MATURE_KEY  = 'mature_unlocked'
const CORRECT_PWD = 'xoloreiii913'

// Called from authContext on every guest login and on logout, so the code
// prompt is tied to the login session — not just to the open browser tab.
export function clearMatureLock() {
  sessionStorage.removeItem(MATURE_KEY)
}

const MatureContext = createContext(null)

export function MatureProvider({ children }) {
  // null = not yet decided, false = skipped, true = unlocked
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem(MATURE_KEY) === 'true'
  })
  const [decided, setDecided] = useState(() => {
    return sessionStorage.getItem(MATURE_KEY) !== null
  })

  const unlock = (password) => {
    if (password === CORRECT_PWD) {
      sessionStorage.setItem(MATURE_KEY, 'true')
      setUnlocked(true)
      setDecided(true)
      return true
    }
    return false
  }

  const skip = () => {
    sessionStorage.setItem(MATURE_KEY, 'false')
    setUnlocked(false)
    setDecided(true)
  }

  const reset = () => {
    sessionStorage.removeItem(MATURE_KEY)
    setUnlocked(false)
    setDecided(false)
  }

  return (
    <MatureContext.Provider value={{ unlocked, decided, unlock, skip, reset }}>
      {children}
    </MatureContext.Provider>
  )
}

export function useMature() {
  return useContext(MatureContext)
}

export { CORRECT_PWD }