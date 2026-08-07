import { useState } from 'react'
import { AuthProvider, useAuth } from './lib/authContext'
import { MatureProvider } from './lib/matureContext'
import LoginPage   from './pages/LoginPage'
import HomePage    from './pages/HomePage'
import ManhwaPage  from './pages/ManhwaPage'
import MangaPage   from './pages/MangaPage'
import Sidebar     from './components/Sidebar'

function AppShell() {
  const { user } = useAuth()
  const [page, setPage] = useState('home')

  if (!user) return <LoginPage />

  return (
    <MatureProvider>
      <div
        className="min-h-screen flex bg-[#120e1c] text-slate-100"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 1200px 700px at 15% 0%, rgba(124,92,214,0.30) 0%, transparent 65%),
            radial-gradient(ellipse 900px 600px at 95% 0%,  rgba(185,166,245,0.16) 0%, transparent 60%),
            radial-gradient(ellipse 800px 500px at 50% 100%, rgba(90,60,180,0.12) 0%, transparent 70%)
          `,
          backgroundAttachment: 'fixed',
        }}
      >
        <Sidebar activePage={page} onNavigate={setPage} />
        {page === 'home'    && <HomePage   onNavigate={setPage} />}
        {page === 'manhwa'  && <ManhwaPage onNavigate={setPage} />}
        {page === 'manga'   && <MangaPage  onNavigate={setPage} />}
      </div>
    </MatureProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
