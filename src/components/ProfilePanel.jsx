import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../lib/authContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const PANEL_WIDTH = 288 // matches w-72
const MARGIN = 12

const LS_KEY = 'admin_profile'

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}
function saveProfile(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export default function ProfilePanel({ onClose, onLogout, anchorRect }) {
  const { user, isAdmin } = useAuth()
  const [tab, setTab]     = useState(isAdmin ? 'profile' : 'info') // admin sees profile/visitors; guest sees info only
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState(loadProfile)
  const [draft, setDraft]     = useState(loadProfile)
  const [visitors, setVisitors] = useState([])
  const [visLoading, setVisLoading] = useState(false)
  const fileRef = useRef(null)
  const panelRef = useRef(null)
  const [style, setStyle] = useState({ visibility: 'hidden' })

  // Position the panel relative to the viewport (not clipped by sidebar's
  // sticky/overflow context) and keep it fully on-screen on any window size.
  useLayoutEffect(() => {
    const place = () => {
      if (!anchorRect) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const panelHeight = panelRef.current?.offsetHeight ?? 400

      let left = anchorRect.left
      left = Math.min(left, vw - PANEL_WIDTH - MARGIN)
      left = Math.max(left, MARGIN)

      let top = anchorRect.top - panelHeight - 12
      if (top < MARGIN) top = Math.min(anchorRect.bottom + 12, vh - panelHeight - MARGIN)

      setStyle({ position: 'fixed', top, left, width: PANEL_WIDTH, visibility: 'visible' })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchorRect])

  useEffect(() => {
    if (tab === 'visitors' && isAdmin) fetchVisitors()
  }, [tab])

  const fetchVisitors = async () => {
    setVisLoading(true)
    try {
      const { data } = await supabase.from('guest_log').select('*').order('created_at', { ascending: false }).limit(50)
      setVisitors(data ?? [])
    } catch (_) {}
    setVisLoading(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Must be an image file'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => setDraft(p => ({ ...p, avatar_url: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    saveProfile(draft)
    setProfile(draft)
    setEditing(false)
    toast.success('Profile saved!')
  }

  const handleDiscard = () => { setDraft(profile); setEditing(false) }

  const fmt = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return createPortal(
    <div data-profile-panel ref={panelRef}
      className="rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
      style={{ ...style, background: '#1e1a38', border: '1px solid rgba(185,166,245,0.2)' }}>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#8a6ae0,#b9a6f5,#6a49c4)' }} />

      {/* Tabs (admin only) */}
      {isAdmin && (
        <div className="flex gap-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {[{ id: 'profile', label: 'Profile' }, { id: 'visitors', label: 'Visitors' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t.id ? 'text-purple-300 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Profile tab */}
      {(tab === 'profile' || tab === 'info') && (
        <div className="p-4">
          {/* ── Header: always shows current user (admin or guest) ── */}
          <div className="flex items-center gap-3 mb-4">
            {/* Avatar: admin shows saved photo, guest shows letter-initial only */}
            <div className="relative flex-shrink-0">
              {isAdmin ? (
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-base"
                  style={{ background: 'linear-gradient(135deg, #e8b9d8, #8a6ae0)' }}>
                  {(editing ? draft : profile).avatar_url
                    ? <img src={(editing ? draft : profile).avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white text-lg">{(user?.username ?? 'A')[0].toUpperCase()}</span>
                  }
                </div>
              ) : (
                /* Guest: plain gradient initial, never admin photo */
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #6a8ae0, #4960c4)' }}>
                  {(user?.username ?? 'G')[0].toUpperCase()}
                </div>
              )}
              {editing && isAdmin && (
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: '#8a6ae0', border: '2px solid #1e1a38' }}>
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {isAdmin ? (profile.display_name || user?.username) : user?.username}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                {isAdmin
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />Administrator</>
                  : <><span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />Guest</>
                }
              </div>
            </div>
            {isAdmin && !editing && (
              <button onClick={() => setEditing(true)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(138,106,224,0.1)' }}>
                Edit
              </button>
            )}
          </div>

          {/* ── Admin: edit form ── */}
          {isAdmin && editing && (
            <div className="space-y-2.5 mb-3">
              <Field label="Display Name">
                <input type="text" value={draft.display_name ?? ''} onChange={e => setDraft(p => ({...p, display_name: e.target.value}))}
                  placeholder="Your name" className="input-field text-xs py-2" />
              </Field>
              <Field label="Email">
                <input type="email" value={draft.email ?? ''} onChange={e => setDraft(p => ({...p, email: e.target.value}))}
                  placeholder="email@example.com" className="input-field text-xs py-2" />
              </Field>
              <Field label="GitHub">
                <input type="text" value={draft.github ?? ''} onChange={e => setDraft(p => ({...p, github: e.target.value}))}
                  placeholder="github.com/username" className="input-field text-xs py-2" />
              </Field>
              <div className="flex gap-2 pt-1">
                <button onClick={handleDiscard} className="flex-1 btn-secondary text-xs py-2">Discard</button>
                <button onClick={handleSave} className="flex-1 btn-primary text-xs py-2">Save</button>
              </div>
            </div>
          )}

          {/* ── Admin: view info ── */}
          {isAdmin && !editing && (
            <div className="space-y-1.5 mb-3">
              {profile.email && <InfoRow icon="✉️" label={profile.email} href={`mailto:${profile.email}`} />}
              {profile.github && (
                <InfoRow icon={<GithubIcon />}
                  label={profile.github.replace(/^https?:\/\/(www\.)?/, '')}
                  href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`} />
              )}
              {!profile.email && !profile.github && (
                <p className="text-xs text-slate-600 text-center py-2">No profile info yet. Click Edit to add.</p>
              )}
            </div>
          )}

          {/* ── Guest: show a clear "Collection Owner" section, separate from guest identity ── */}
          {!isAdmin && (
            <div className="mb-3">
              <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Collection Owner</p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* owner mini-header */}
                <div className="flex items-center gap-2.5 px-3 py-2.5"
                  style={{ background: 'rgba(138,106,224,0.08)' }}>
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs"
                    style={{ background: 'linear-gradient(135deg, #e8b9d8, #8a6ae0)' }}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white">{(profile.display_name ?? 'A')[0].toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{profile.display_name || 'Admin'}</div>
                    <div className="text-[10px] text-purple-400/70">Administrator</div>
                  </div>
                </div>
                {/* owner links */}
                <div className="px-3 py-2 space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {profile.email && <InfoRow icon="✉️" label={profile.email} href={`mailto:${profile.email}`} />}
                  {profile.github && (
                    <InfoRow icon={<GithubIcon />}
                      label={profile.github.replace(/^https?:\/\/(www\.)?/, '')}
                      href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`} />
                  )}
                  {!profile.email && !profile.github && (
                    <p className="text-xs text-slate-600 py-1">No contact info available.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}

      {/* Visitors tab */}
      {tab === 'visitors' && isAdmin && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Guest Login History</span>
            <div className="flex items-center gap-2">
              <button onClick={fetchVisitors}
                className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded-md"
                style={{ background: 'rgba(138,106,224,0.1)' }}>
                Refresh
              </button>
              {visitors.length > 0 && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Clear all guest visit history?')) return
                    try {
                      await supabase.from('guest_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                      setVisitors([])
                      toast.success('History cleared')
                    } catch (_) { toast.error('Failed to clear') }
                  }}
                  className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded-md"
                  style={{ background: 'rgba(239,68,68,0.08)' }}>
                  Clear all
                </button>
              )}
            </div>
          </div>
          {visLoading ? (
            <div className="space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-8 rounded-lg animate-pulse" style={{background:'rgba(255,255,255,0.05)'}}/>)}</div>
          ) : visitors.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-4">No guest visits yet.</p>
          ) : (
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {visitors.map((v, i) => (
                <div key={v.id ?? i} className="flex items-center justify-between px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-purple-200"
                      style={{ background: 'rgba(138,106,224,0.2)' }}>
                      {(v.name ?? '?')[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-300">{v.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-600">{fmt(v.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, href }) {
  const content = (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <span className="text-sm flex-shrink-0 w-4 flex items-center justify-center">{icon}</span>
      <span className="text-xs text-slate-300 truncate">{label}</span>
      {href && <svg className="w-3 h-3 text-slate-600 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>}
    </div>
  )
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">{content}</a>
  return content
}

function GithubIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}