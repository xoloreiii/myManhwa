import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../lib/authContext'
import ProfilePanel from './ProfilePanel'

const NAV_ITEMS = [
  {
    id: 'home', label: 'Home',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'manhwa', label: 'Manhwa',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'manga', label: 'Manga',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { user, isAdmin, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <aside
      className="w-[236px] shrink-0 p-7 flex flex-col gap-9 relative h-screen sticky top-0"
      style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 font-bold text-[19px]">
        <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[#1c1630] font-bold text-base"
          style={{ background: 'linear-gradient(135deg, #b9a6f5, #6a49c4)' }}>
          屋
        </div>
        myManhwa
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const active = activePage === item.id
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-[14px] py-[10px] rounded-[10px] text-sm font-medium w-full text-left transition-all
                ${active ? 'text-slate-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              style={active ? { background: '#251d3d', border: '1px solid rgba(185,166,245,0.35)' } : {}}>
              <span className={`flex-shrink-0 ${active ? 'text-purple-300' : ''}`}>{item.icon}</span>
              {item.label}
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#b9a6f5] ml-auto" />}
            </button>
          )
        })}
      </nav>

      {/* Profile bottom */}
      <div className="mt-auto pt-5 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} ref={profileRef}>
        <button
          onClick={() => setProfileOpen(o => !o)}
          className="flex items-center gap-2.5 w-full group hover:opacity-90 transition-opacity"
        >
          <UserAvatar user={user} size={36} />
          <div className="text-left flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-100 truncate">{user?.username ?? 'Guest'}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              {isAdmin
                ? <><span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />Admin</>
                : <><span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />Guest</>
              }
            </div>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {profileOpen && (
          <ProfilePanel onClose={() => setProfileOpen(false)} onLogout={() => { setProfileOpen(false); logout() }} />
        )}
      </div>
    </aside>
  )
}

export function UserAvatar({ user, size = 36 }) {
  const profileData = (() => {
    try { return JSON.parse(localStorage.getItem('admin_profile') ?? '{}') } catch { return {} }
  })()
  const src     = profileData?.avatar_url
  const initial = (user?.username ?? 'G')[0].toUpperCase()
  return (
    <div className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #e8b9d8, #8a6ae0)', fontSize: size * 0.38 }}>
      {src
        ? <img src={src} alt="" className="w-full h-full object-cover" />
        : <span className="text-white">{initial}</span>
      }
    </div>
  )
}
