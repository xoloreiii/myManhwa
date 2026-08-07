import { useState } from 'react'
import { useMature } from '../lib/matureContext'

function PurpleLockIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
      {/* shackle */}
      <rect x="20" y="28" width="24" height="22" rx="5" fill="#7c5cbf" />
      <rect x="21" y="29" width="22" height="20" rx="4" fill="#9b7de8" />
      {/* shackle arc */}
      <path d="M22 28v-8a10 10 0 0120 0v8" stroke="#5a3fa0" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M23 28v-8a9 9 0 0118 0v8" stroke="#b9a6f5" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
      {/* keyhole body */}
      <circle cx="32" cy="37" r="4" fill="#5a3fa0"/>
      <rect x="30.5" y="39" width="3" height="5" rx="1.5" fill="#5a3fa0"/>
      {/* shine */}
      <ellipse cx="26" cy="32" rx="3" ry="2" fill="white" opacity="0.12" transform="rotate(-20 26 32)"/>
    </svg>
  )
}

export default function MatureGate({ onClose }) {
  const { unlock, skip } = useMature()
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [shaking, setShaking]   = useState(false)

  const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 500) }

  const handleUnlock = () => {
    const ok = unlock(password)
    if (ok) { onClose?.() }
    else { setError('Incorrect code. Try again.'); shake() }
  }

  const handleSkip = () => { skip(); onClose?.() }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transition-transform ${shaking ? 'animate-shake' : ''}`}
        style={{ background: '#17162f', border: '1px solid rgba(185,166,245,0.2)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #8a6ae0, #b9a6f5, #6a49c4)' }} />

        <div className="px-7 py-7">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(124,92,191,0.12)', border: '1px solid rgba(185,166,245,0.15)' }}>
              <PurpleLockIcon />
            </div>
          </div>

          <h2 className="text-center text-[17px] font-bold text-white mb-1">Restricted Content</h2>
          <p className="text-center text-[13px] text-slate-400 mb-6 leading-relaxed">
            This section contains mature content.<br />
            Enter the access code to unlock full view.
          </p>

          <div className="mb-2">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="Enter access code..."
              autoFocus
              className="input-field text-center tracking-widest"
            />
            {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
          </div>

          <button onClick={handleUnlock} className="w-full btn-primary mt-3 py-2.5">
            Unlock Access
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <button onClick={handleSkip}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Skip — continue without full access
          </button>

          <p className="text-center text-[11px] text-slate-700 mt-4">
            If skipped, BL content will be blurred.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        .animate-shake{animation:shake 0.45s ease}
      `}</style>
    </div>
  )
}
