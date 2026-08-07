import { useState } from 'react'
import { useAuth } from '../lib/authContext'

export default function LoginPage() {
  const { loginAdmin, loginGuest } = useAuth()
  const [mode, setMode]         = useState(null)        // null | 'guest' | 'admin'
  const [guestName, setGuestName] = useState('')
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [shaking, setShaking]   = useState(false)

  const shake = () => {
    setShaking(true)
    setTimeout(() => setShaking(false), 450)
  }

  const handleGuest = async () => {
    if (!guestName.trim()) { setError('Please enter your name.'); shake(); return }
    setLoading(true)
    await loginGuest(guestName)
    setLoading(false)
  }

  const handleAdmin = () => {
    if (!adminUser.trim() || !adminPass.trim()) { setError('Please fill in all fields.'); shake(); return }
    const ok = loginAdmin(adminUser, adminPass)
    if (!ok) { setError('Incorrect username or password.'); shake() }
  }

  const reset = () => { setMode(null); setError(''); setGuestName(''); setAdminUser(''); setAdminPass('') }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[#120e1c]"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 1000px 600px at 20% 0%, rgba(124,92,214,0.32) 0%, transparent 60%),
          radial-gradient(ellipse 800px 500px at 90% 10%, rgba(185,166,245,0.15) 0%, transparent 55%),
          radial-gradient(ellipse 600px 400px at 50% 100%, rgba(90,60,180,0.14) 0%, transparent 65%)
        `,
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#1c1630] font-black text-2xl mb-4 shadow-lg shadow-purple-900/40"
            style={{ background: 'linear-gradient(135deg, #b9a6f5, #6a49c4)' }}>
            屋
          </div>
          <h1 className="text-2xl font-bold text-white">myTsundoku</h1>
          <p className="text-sm text-slate-500 mt-1">Your digital reading shelf</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl overflow-hidden shadow-2xl shadow-black/50 transition-transform ${shaking ? 'animate-shake' : ''}`}
          style={{ background: '#17162f', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #8a6ae0, #b9a6f5, #6a49c4)' }} />
          <div className="px-7 py-8">

            {mode === null && (
              <>
                <h2 className="text-[17px] font-bold text-white text-center mb-1">Welcome back</h2>
                <p className="text-[13px] text-slate-400 text-center mb-8">How would you like to continue?</p>
                <div className="space-y-3">
                  <button onClick={() => { setMode('admin'); setError('') }}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] group"
                    style={{ background: 'linear-gradient(135deg, #8a6ae0, #6a49c4)', border: '1px solid rgba(185,166,245,0.2)' }}>
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">Admin</div>
                      <div className="text-xs text-purple-200/70">Full access — edit & manage collection</div>
                    </div>
                    <svg className="w-4 h-4 text-purple-200/50 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button onClick={() => { setMode('guest'); setError('') }}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all hover:bg-white/8 active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-slate-200">Guest</div>
                      <div className="text-xs text-slate-500">Browse only — view-only access</div>
                    </div>
                    <svg className="w-4 h-4 text-slate-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {mode === 'guest' && (
              <>
                <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Continue as Guest</div>
                    <div className="text-xs text-slate-500">Browse-only access</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Name</label>
                    <input type="text" value={guestName} onChange={e => { setGuestName(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleGuest()}
                      placeholder="e.g. Sakura" autoFocus className="input-field" />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <button onClick={handleGuest} disabled={loading}
                    className="w-full btn-primary py-2.5 mt-1 disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading
                      ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Entering...</>
                      : 'Enter as Guest'}
                  </button>
                </div>
              </>
            )}

            {mode === 'admin' && (
              <>
                <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(138,106,224,0.2)', border: '1px solid rgba(185,166,245,0.25)' }}>
                    <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Admin Login</div>
                    <div className="text-xs text-slate-500">Full access</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                    <input type="text" value={adminUser} onChange={e => { setAdminUser(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleAdmin()}
                      placeholder="Username" autoFocus className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                    <input type="password" value={adminPass} onChange={e => { setAdminPass(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleAdmin()}
                      placeholder="••••••••" className="input-field" />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <button onClick={handleAdmin}
                    className="w-full py-2.5 mt-1 rounded-xl text-sm font-bold text-white hover:brightness-110 transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #8a6ae0, #6a49c4)' }}>
                    Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">myTsundoku — personal reading tracker</p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
        }
        .animate-shake{animation:shake 0.45s ease}
      `}</style>
    </div>
  )
}
