import { useState, useEffect, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useMature } from '../lib/matureContext'
import { useAuth } from '../lib/authContext'
import ManhwaCard from '../components/ManhwaCard'
import MangaForm from '../components/MangaForm'
import MatureGate from '../components/MatureGate'
import { PRESET_GENRES } from '../components/ManhwaForm'

const TABS = [
  { value: 'all', label: 'All', icon: '⌂' },
  { value: 'NL',  label: 'NL',  icon: '💕' },
  { value: 'BL',  label: 'BL',  icon: '💙' },
  { value: 'GL',  label: 'GL',  icon: '💜' },
]

const BASIC_SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'az',     label: 'A → Z'  },
  { value: 'za',     label: 'Z → A'  },
]

const STATUS_META = [
  { value: 'ongoing',      label: 'Ongoing',      color: 'text-emerald-400' },
  { value: 'completed',    label: 'Completed',    color: 'text-slate-300'   },
  { value: 'dropped',      label: 'Dropped',      color: 'text-red-400'     },
  { value: 'plan_to_read', label: 'Plan to Read', color: 'text-amber-400'   },
]

const FLAG_META = [
  { value: 'Green Flag',  label: 'Green Flag',  dot: 'bg-green-400',  text: 'text-green-300'  },
  { value: 'Yellow Flag', label: 'Yellow Flag', dot: 'bg-yellow-400', text: 'text-yellow-300' },
  { value: 'Red Flag',    label: 'Red Flag',    dot: 'bg-red-400',    text: 'text-red-300'    },
  { value: 'Black Flag',  label: 'Black Flag',  dot: 'bg-zinc-400',   text: 'text-zinc-300'   },
]

function FilterDropdown({ label, icon, badge, children, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap
          ${badge ? 'bg-purple-600/30 border border-purple-500/60 text-purple-200' : 'text-slate-400 hover:text-slate-200'}`}
        style={!badge ? { background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' } : {}}
      >
        {icon}{label}
        {badge != null && badge > 0 && (
          <span className="bg-purple-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">{badge}</span>
        )}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={`absolute top-11 z-40 rounded-xl shadow-2xl shadow-black/60 ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{ background: '#1e1a38', border: '1px solid rgba(185,166,245,0.25)', minWidth: '200px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl shadow-black/40 transition-all hover:scale-110 active:scale-95"
      style={{ background: 'linear-gradient(135deg, #8a6ae0, #6a49c4)', border: '1px solid rgba(185,166,245,0.3)' }}
      aria-label="Scroll to top">
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}

export default function MangaPage({ onNavigate }) {
  const { unlocked, decided } = useMature()
  const { isAdmin } = useAuth()
  const [showGate, setShowGate] = useState(false)
  const gateActive = !isAdmin

  const [mangaList, setMangaList]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('all')
  const [search, setSearch]               = useState('')
  const [sortBy, setSortBy]               = useState('newest')
  const [sortRating, setSortRating]       = useState(null)
  const [sortFlag, setSortFlag]           = useState(null)
  const [sortStatus, setSortStatus]       = useState(null)
  const [filterGenres, setFilterGenres]   = useState([])
  const [formOpen, setFormOpen]           = useState(false)
  const [editingManga, setEditingManga]   = useState(null)

  useEffect(() => { fetchManga() }, [])
  useEffect(() => { if (gateActive && !decided) setShowGate(true) }, [decided, gateActive])
  useEffect(() => { if (gateActive && activeTab === 'BL' && !unlocked) setShowGate(true) }, [activeTab, unlocked, gateActive])

  const fetchManga = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('manga').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setMangaList(data ?? [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load data: ' + (err.message ?? 'Unknown error'))
    } finally { setLoading(false) }
  }

  const handleDeleted     = (id) => setMangaList(prev => prev.filter(m => m.id !== id))
  const handleFormSuccess = () => { setFormOpen(false); setEditingManga(null); fetchManga() }
  const openAddForm       = () => { setEditingManga(null); setFormOpen(true) }
  const openEditForm      = (m) => { setEditingManga(m); setFormOpen(true) }
  const toggleFilterGenre = (g) =>
    setFilterGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const tabCount = useMemo(() => ({
    all: mangaList.length,
    NL:  mangaList.filter(m => m.category === 'NL').length,
    BL:  mangaList.filter(m => m.category === 'BL').length,
    GL:  mangaList.filter(m => m.category === 'GL').length,
  }), [mangaList])

  const filtered = useMemo(() => {
    let list = mangaList.filter(m => {
      const matchTab    = activeTab === 'all' || m.category === activeTab
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase())
      const mGenres     = Array.isArray(m.genres) ? m.genres : (m.genre ? [m.genre] : [])
      const matchGenre  = filterGenres.length === 0 || filterGenres.every(g => mGenres.includes(g))
      const matchRating = sortRating == null || (m.rating ?? 0) === sortRating
      const matchFlag   = sortFlag   == null || m.character_flag === sortFlag
      const matchStatus = sortStatus == null || m.status === sortStatus
      return matchTab && matchSearch && matchGenre && matchRating && matchFlag && matchStatus
    })
    if (sortBy === 'az') list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    else if (sortBy === 'za') list = [...list].sort((a, b) => b.title.localeCompare(a.title))
    return list
  }, [mangaList, activeTab, search, sortBy, filterGenres, sortRating, sortFlag, sortStatus])

  const activeTabData     = TABS.find(t => t.value === activeTab)
  const activeFilterCount = (sortRating ? 1 : 0) + (sortFlag ? 1 : 0) + (sortStatus ? 1 : 0)
  const isBLLockedTab     = gateActive && activeTab === 'BL' && !unlocked

  return (
    <main className="flex-1 px-10 py-8 min-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Manga Collection</h1>
            <p className="text-[13px] text-slate-400">
              {activeTabData?.icon && <span className="mr-1">{activeTabData.icon}</span>}
              <span className="font-semibold text-slate-300">{tabCount[activeTab]}</span>
              {' '}title{tabCount[activeTab] !== 1 ? 's' : ''}
              {isAdmin ? ' in your digital shelf' : ' available to browse'}
            </p>
          </div>
          {isAdmin && (
            <button onClick={openAddForm}
              className="flex items-center gap-2 text-[#f6f2ff] px-[18px] py-[11px] rounded-[11px] text-[13px] font-semibold hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(135deg, #8a6ae0, #6a49c4)' }}>
              + Add Manga
            </button>
          )}
        </div>

        {/* Tabs + Controls */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex gap-2 p-1.5 rounded-xl"
            style={{ background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' }}>
            {TABS.map(tab => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${
                  activeTab === tab.value ? 'bg-[#2c2348] text-[#b9a6f5]' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab.label}
                <span className={`ml-1.5 text-[11px] ${activeTab === tab.value ? 'text-purple-400/70' : 'text-slate-600'}`}>
                  {tabCount[tab.value]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FilterDropdown label="Genre" badge={filterGenres.length}
              icon={<svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h6m-6 5h4" /></svg>}>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Filter Genre</span>
                  {filterGenres.length > 0 && <button onClick={() => setFilterGenres([])} className="text-[10px] text-slate-600 hover:text-slate-400">Clear</button>}
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto">
                  {PRESET_GENRES.map(genre => {
                    const active = filterGenres.includes(genre)
                    return (
                      <button key={genre} onClick={() => toggleFilterGenre(genre)}
                        className={`text-left px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          active ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200'
                               : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}>
                        {active && <span className="mr-1 text-purple-400">✓</span>}{genre}
                      </button>
                    )
                  })}
                </div>
              </div>
            </FilterDropdown>

            <FilterDropdown label="Sort" badge={activeFilterCount} align="right"
              icon={<svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}>
              <div className="p-3 w-56">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Order by</p>
                <div className="space-y-0.5 mb-3">
                  {BASIC_SORTS.map(s => (
                    <button key={s.value} onClick={() => setSortBy(s.value)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        sortBy === s.value ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}>
                      {sortBy === s.value && <span className="mr-1.5 text-purple-400">✓</span>}{s.label}
                    </button>
                  ))}
                </div>
                <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Filter by Rating</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {[5,4,3,2,1].map(r => (
                    <button key={r} onClick={() => setSortRating(sortRating === r ? null : r)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                        sortRating === r ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                          : 'border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                      {'★'.repeat(r)}
                    </button>
                  ))}
                </div>
                <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Filter by Flag</p>
                <div className="space-y-0.5 mb-3">
                  {FLAG_META.map(f => (
                    <button key={f.value} onClick={() => setSortFlag(sortFlag === f.value ? null : f.value)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        sortFlag === f.value ? 'bg-white/10 border-white/20 text-white'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${f.dot}`} />
                      <span className={sortFlag === f.value ? f.text : ''}>{f.label}</span>
                      {sortFlag === f.value && <span className="ml-auto text-purple-400 text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Filter by Status</p>
                <div className="space-y-0.5">
                  {STATUS_META.map(s => (
                    <button key={s.value} onClick={() => setSortStatus(sortStatus === s.value ? null : s.value)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        sortStatus === s.value ? 'bg-white/10 border-white/20 text-white'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                      <span className={`text-xs ${s.color}`}>●</span>
                      <span className={sortStatus === s.value ? 'text-white' : ''}>{s.label}</span>
                      {sortStatus === s.value && <span className="ml-auto text-purple-400 text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
                {activeFilterCount > 0 && (
                  <>
                    <div className="h-px mt-3 mb-2" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <button onClick={() => { setSortRating(null); setSortFlag(null); setSortStatus(null) }}
                      className="w-full text-center text-[11px] text-red-400/70 hover:text-red-400 transition-colors py-1">
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            </FilterDropdown>

            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl w-52 text-slate-500 text-sm"
              style={{ background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span>⌕</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search title..."
                className="bg-transparent outline-none w-full placeholder:text-slate-500 text-slate-200" />
              {search && <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400">✕</button>}
            </div>
          </div>
        </div>

        {(filterGenres.length > 0 || sortRating || sortFlag || sortStatus) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-slate-600">Active:</span>
            {filterGenres.map(g => <Chip key={g} label={g} onRemove={() => toggleFilterGenre(g)} color="purple" />)}
            {sortRating && <Chip label={`${'★'.repeat(sortRating)}`} onRemove={() => setSortRating(null)} color="yellow" />}
            {sortFlag   && <Chip label={sortFlag} onRemove={() => setSortFlag(null)} color="white" />}
            {sortStatus && <Chip label={STATUS_META.find(s => s.value === sortStatus)?.label ?? sortStatus} onRemove={() => setSortStatus(null)} color="green" />}
          </div>
        )}

        {isBLLockedTab ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(138,106,224,0.15)', border: '1px solid rgba(185,166,245,0.2)' }}>🔒</div>
            <p className="text-slate-400 text-sm text-center">BL content is locked.<br />Enter the code to access it.</p>
            <button onClick={() => setShowGate(true)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(135deg, #8a6ae0, #6a49c4)' }}>
              Enter Code
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[18px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[2/3]" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <div className="h-3 rounded w-2/5" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-500 text-sm py-16 text-center">
            {search || filterGenres.length > 0 || sortRating || sortFlag || sortStatus
              ? 'No results found. Try adjusting the filters.'
              : 'No manga yet. Click "+ Add Manga" to start your collection!'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[18px]">
            {filtered.map(manga => {
              const isBL      = manga.category === 'BL'
              const needsBlur = gateActive && isBL && !unlocked && activeTab === 'all'
              return (
                <ManhwaCard
                  key={manga.id}
                  manhwa={manga}
                  onEdit={isAdmin ? openEditForm : undefined}
                  onDeleted={isAdmin ? handleDeleted : undefined}
                  blurred={needsBlur}
                  onBlurClick={() => setShowGate(true)}
                />
              )
            })}
          </div>
        )}
      {formOpen && (
        <MangaForm
          manga={editingManga}
          onClose={() => { setFormOpen(false); setEditingManga(null) }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showGate && <MatureGate onClose={() => setShowGate(false)} />}
      <ScrollToTop />
    </main>
  )
}

function Chip({ label, onRemove, color }) {
  const colors = {
    purple: 'bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-300',
    yellow: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300 hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-300',
    white:  'bg-white/8 border-white/20 text-slate-300 hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-300',
    green:  'bg-emerald-600/15 border-emerald-500/40 text-emerald-300 hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-300',
  }
  return (
    <button onClick={onRemove}
      className={`flex items-center gap-1 text-xs border px-2.5 py-1 rounded-lg transition-all ${colors[color]}`}>
      {label} <span className="text-[10px] opacity-60 ml-0.5">✕</span>
    </button>
  )
}
