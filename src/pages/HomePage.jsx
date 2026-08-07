import { useState, useEffect } from 'react'
import { useAuth } from '../lib/authContext'
import { supabase } from '../lib/supabase'

function StatCard({ label, value, color, icon }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'rgba(124,92,214,0.10)', border: '1px solid rgba(185,166,245,0.12)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`text-lg ${color}`}>{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value ?? '—'}</div>
    </div>
  )
}

function RecentCard({ item, type }) {
  const status = item.status ?? 'ongoing'
  const STATUS_COLOR = {
    ongoing:      'text-emerald-400 bg-emerald-500/15',
    completed:    'text-slate-300 bg-slate-500/15',
    dropped:      'text-red-400 bg-red-500/15',
    plan_to_read: 'text-amber-400 bg-amber-500/15',
  }
  const STATUS_LABEL = { ongoing: 'Ongoing', completed: 'Completed', dropped: 'Dropped', plan_to_read: 'Plan to Read' }

  return (
    <div className="flex gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
      style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1835]">
        {item.poster_url
          ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-200 truncate">{item.title}</p>
        <p className="text-[11px] text-slate-600 mt-0.5">Ch. {item.chapter}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${STATUS_COLOR[status] ?? STATUS_COLOR.ongoing}`}>
            {STATUS_LABEL[status] ?? 'Ongoing'}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md capitalize"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            {item.category} · {type}
          </span>
        </div>
      </div>
      {item.rating > 0 && (
        <div className="flex items-start gap-0.5 flex-shrink-0 pt-0.5">
          {[1,2,3,4,5].map(s => (
            <svg key={s} className={`w-2.5 h-2.5 ${s <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-700 text-slate-700'}`} viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HomePage({ onNavigate }) {
  const { user, isAdmin } = useAuth()
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [{ data: mw }, { data: mg }] = await Promise.all([
          supabase.from('manhwa').select('id,category,status,title,chapter,poster_url,rating,created_at').order('created_at', { ascending: false }),
          supabase.from('manga').select('id,category,status,title,chapter,poster_url,rating,created_at').order('created_at', { ascending: false }),
        ])
        const manhwaList = mw ?? []
        const mangaList  = mg ?? []
        const all        = [
          ...manhwaList.map(i => ({ ...i, _type: 'manhwa' })),
          ...mangaList.map(i => ({ ...i, _type: 'manga' })),
        ]
        const byDate = all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        setStats({
          manhwa:  { total: manhwaList.length, NL: manhwaList.filter(x => x.category==='NL').length, BL: manhwaList.filter(x => x.category==='BL').length, GL: manhwaList.filter(x => x.category==='GL').length },
          manga:   { total: mangaList.length,  NL: mangaList.filter(x => x.category==='NL').length,  BL: mangaList.filter(x => x.category==='BL').length,  GL: mangaList.filter(x => x.category==='GL').length  },
          total:   manhwaList.length + mangaList.length,
          reading: all.filter(x => x.status === 'ongoing').length,
          done:    all.filter(x => x.status === 'completed').length,
        })
        setRecent(byDate.slice(0, 6))
      } catch (_) {}
      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <div className="flex-1 px-10 py-8 min-h-screen overflow-y-auto">

      {/* ── Hero welcome banner ── */}
      <div
        className="relative rounded-2xl overflow-hidden mb-8 px-8 py-10 flex flex-col items-center justify-center text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(124,92,214,0.28) 0%, rgba(90,55,180,0.22) 50%, rgba(185,166,245,0.10) 100%)',
          border: '1px solid rgba(185,166,245,0.18)',
        }}
      >
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(185,166,245,0.12) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,92,214,0.15) 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

        {/* book icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative"
          style={{ background: 'rgba(185,166,245,0.12)', border: '1px solid rgba(185,166,245,0.25)' }}>
          <svg className="w-7 h-7 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        {/* username */}
        <h1 className="text-4xl font-bold text-white mb-2 relative">
          Welcome, {user?.username ?? 'Reader'}
          {isAdmin && (
            <span className="ml-3 text-[11px] font-semibold px-2.5 py-1 rounded-full align-middle relative"
              style={{ background: 'rgba(138,106,224,0.3)', border: '1px solid rgba(185,166,245,0.35)', color: '#c4b0f8' }}>
              admin
            </span>
          )}
        </h1>

        {/* subtitle — different for admin vs guest */}
        {isAdmin ? (
          <p className="text-slate-400 text-sm relative">
            You have{' '}
            <span className="text-purple-300 font-semibold">{stats?.total ?? '…'}</span>
            {' '}titles in your collection.
          </p>
        ) : (
          <p className="text-slate-400 text-sm relative">
            Browsing the collection — enjoy exploring!
          </p>
        )}

        {/* quick nav buttons — both start transparent, color on hover only */}
        <div className="flex gap-3 mt-6 relative">
          <HoverButton onClick={() => onNavigate('manhwa')}>Browse Manhwa</HoverButton>
          <HoverButton onClick={() => onNavigate('manga')}>Browse Manga</HoverButton>
        </div>
      </div>

      {/* ── Stats ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({length:4}).map((_,i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse" style={{background:'rgba(255,255,255,0.04)'}} />
          ))}
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Titles" value={stats.total}   color="text-purple-300"  icon="📚" />
            <StatCard label="Reading"      value={stats.reading} color="text-emerald-400" icon="📖" />
            <StatCard label="Completed"    value={stats.done}    color="text-slate-300"   icon="✅" />
            <StatCard label="Manhwa + Manga" value={`${stats.manhwa.total} + ${stats.manga.total}`} color="text-blue-300" icon="🗂️" />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <BreakdownCard title="Manhwa" data={stats.manhwa} onNavigate={() => onNavigate('manhwa')} />
            <BreakdownCard title="Manga"  data={stats.manga}  onNavigate={() => onNavigate('manga')}  />
          </div>
        </>
      )}

      {/* ── Recently Added ── */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">Recently Added</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({length:6}).map((_,i) => <div key={i} className="h-24 rounded-xl animate-pulse" style={{background:'rgba(255,255,255,0.04)'}} />)}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-slate-600 text-sm">Nothing added yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map(item => <RecentCard key={`${item._type}-${item.id}`} item={item} type={item._type} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function BreakdownCard({ title, data, onNavigate }) {  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(124,92,214,0.08)', border: '1px solid rgba(185,166,245,0.10)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <button onClick={onNavigate} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">View all →</button>
      </div>
      <div className="text-2xl font-bold text-purple-300 mb-3">{data.total} titles</div>
      <div className="space-y-2">
        {[
          { label: 'Normal Love (NL)', count: data.NL, color: 'bg-pink-500' },
          { label: 'Boys Love (BL)',   count: data.BL, color: 'bg-blue-500' },
          { label: 'Girls Love (GL)',  count: data.GL, color: 'bg-purple-500' },
        ].map(row => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-32 flex-shrink-0">{row.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full ${row.color} opacity-70`}
                style={{ width: data.total ? `${(row.count/data.total)*100}%` : '0%' }} />
            </div>
            <span className="text-xs text-slate-400 w-6 text-right">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Both buttons start with no fill — only show color on hover (same purple for both)
function HoverButton({ children, onClick }) {
  const [hovered, setHovered] = useState(false)

  const baseStyle = {
    background: hovered
      ? 'linear-gradient(135deg, #8a6ae0, #6a49c4)'
      : 'rgba(255,255,255,0.05)',
    border: hovered
      ? '1px solid rgba(138,106,224,0.6)'
      : '1px solid rgba(255,255,255,0.12)',
    transition: 'all 0.2s ease',
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="px-5 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
      style={{
        ...baseStyle,
        color: hovered ? '#fff' : 'rgba(255,255,255,0.55)',
      }}
    >
      {children}
    </button>
  )
}