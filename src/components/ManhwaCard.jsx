import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const CATEGORY_BADGE = { NL: 'badge-nl', BL: 'badge-bl', GL: 'badge-gl' }

const FLAG_STYLE = {
  'Green Flag':  { dot: 'bg-green-400',  text: 'text-green-300',  bg: 'bg-green-900/30 border-green-700/40'   },
  'Red Flag':    { dot: 'bg-red-400',    text: 'text-red-300',    bg: 'bg-red-900/30 border-red-700/40'       },
  'Yellow Flag': { dot: 'bg-yellow-400', text: 'text-yellow-300', bg: 'bg-yellow-900/30 border-yellow-700/40' },
  'Black Flag':  { dot: 'bg-zinc-400',   text: 'text-zinc-300',   bg: 'bg-zinc-800/50 border-zinc-600/40'     },
}

const STATUS_BADGE = {
  ongoing:      'badge-ongoing',
  completed:    'badge-completed',
  dropped:      'badge-dropped',
  plan_to_read: 'badge-plan',
}

const STATUS_LABEL = {
  ongoing:      'ONGOING',
  completed:    'COMPLETED',
  dropped:      'DROPPED',
  plan_to_read: 'PLAN TO READ',
}

function StarDisplay({ value }) {
  if (!value || value < 1) return null
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={`w-3 h-3 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 fill-slate-700'}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

export default function ManhwaCard({ manhwa, onEdit, onDeleted, blurred = false, onBlurClick }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${manhwa.title}"?`)) return
    setDeleting(true); setMenuOpen(false)
    try {
      if (manhwa.poster_url) {
        const parts = manhwa.poster_url.split('/storage/v1/object/public/manhwa-posters/')
        if (parts[1]) await supabase.storage.from('manhwa-posters').remove([parts[1]])
      }
      const { error } = await supabase.from('manhwa').delete().eq('id', manhwa.id)
      if (error) throw error
      toast.success('Manhwa deleted!')
      onDeleted(manhwa.id)
    } catch (err) {
      toast.error('Failed to delete: ' + (err.message ?? 'Unknown error'))
    } finally { setDeleting(false) }
  }

  const status    = manhwa.status ?? 'ongoing'
  const flag      = manhwa.character_flag ? FLAG_STYLE[manhwa.character_flag] : null
  const genreList = Array.isArray(manhwa.genres) && manhwa.genres.length > 0
    ? manhwa.genres : (manhwa.genre ? [manhwa.genre] : [])

  if (blurred) {
    return (
      <div
        className="card flex flex-col cursor-pointer select-none"
        onClick={onBlurClick}
      >
        <div className="relative aspect-[2/3] bg-[#1a1835] overflow-hidden">
          {/* blurred poster */}
          {manhwa.poster_url
            ? <img src={manhwa.poster_url} alt="" className="w-full h-full object-cover blur-xl scale-110" />
            : <div className="w-full h-full" style={{ background: '#1a1835' }} />
          }
          {/* lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(10,8,24,0.65)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(138,106,224,0.25)', border: '1px solid rgba(185,166,245,0.3)' }}>
              🔒
            </div>
            <p className="text-[11px] text-slate-400 font-medium text-center px-2 leading-tight">
              Enter code<br />to view
            </p>
          </div>
        </div>
        <div className="p-3 space-y-1.5">
          {/* blurred title */}
          <div className="h-3 rounded-md w-4/5 mt-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="h-3 rounded-md w-2/5"       style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="flex gap-1.5 pt-1">
            <span className="badge-bl">BL</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card flex flex-col">
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-[#1a1835] overflow-hidden">
        {manhwa.poster_url ? (
          <img src={manhwa.poster_url} alt={manhwa.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs">No Poster</span>
          </div>
        )}
        {/* Context menu — only shown when edit/delete available */}
        {(onEdit || onDeleted) && (
        <div className="absolute top-2 right-2" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-[26px] h-[26px] rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-white text-sm hover:bg-black/75 transition-colors"
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-50 w-32 rounded-xl shadow-2xl shadow-black/50 overflow-hidden py-1"
              style={{ background: '#251d3d', border: '1px solid rgba(185,166,245,0.35)' }}
            >
              <button
                onClick={() => { onEdit(manhwa); setMenuOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <svg className="w-3.5 h-3.5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <div className="h-px mx-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <button
                onClick={handleDelete} disabled={deleting}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        {/* Status badge — full width block */}
        <div>
          <span className={`${STATUS_BADGE[status] ?? 'badge-ongoing'} block w-full text-center`}>
            {STATUS_LABEL[status] ?? 'ONGOING'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-100 text-[13px] leading-snug line-clamp-2 pt-0.5 min-h-[2.2rem]">
          {manhwa.title}
        </h3>

        {/* Chapter */}
        <p className="text-[11px] text-slate-500">
          Last read: Ch. {manhwa.chapter}
          {status === 'completed' ? ' (Finished)' : ''}
        </p>

        {/* Rating */}
        <StarDisplay value={manhwa.rating} />

        {/* Category + genres */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className={CATEGORY_BADGE[manhwa.category]}>{manhwa.category}</span>
          {genreList.slice(0, 2).map(g => (
            <span
              key={g}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md text-slate-400"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {g}
            </span>
          ))}
          {genreList.length > 2 && (
            <span className="text-[10px] text-slate-600">+{genreList.length - 2}</span>
          )}
        </div>

        {/* Flag */}
        {flag && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium w-fit ${flag.bg} ${flag.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${flag.dot}`} />
            {manhwa.character_flag}
          </div>
        )}
      </div>
    </div>
  )
}
