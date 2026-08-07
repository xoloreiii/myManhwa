import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import ManhwaCard from '../components/ManhwaCard'
import ManhwaForm from '../components/ManhwaForm'

const TABS = [
  { value: 'all', label: 'All', icon: '⌂' },
  { value: 'NL',  label: 'NL',  icon: '💕' },
  { value: 'BL',  label: 'BL',  icon: '💙' },
  { value: 'GL',  label: 'GL',  icon: '💜' },
]

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest' },
  { value: 'az',      label: 'A → Z'  },
  { value: 'za',      label: 'Z → A'  },
  { value: 'rating',  label: 'Rating' },
  { value: 'flag',    label: 'Flag'   },
  { value: 'genre',   label: 'Genre'  },
]

// Flag sort order: Green > Yellow > Red > Black > none
const FLAG_ORDER = { 'Green Flag': 0, 'Yellow Flag': 1, 'Red Flag': 2, 'Black Flag': 3 }

const ALL_GENRES = [
  'Action', 'Romance', 'Fantasy', 'Comedy', 'Drama', 'Thriller',
  'Horror', 'Slice of Life', 'Mystery', 'Sci-Fi', 'Supernatural',
  'Historical', 'Isekai', 'Martial Arts', 'School Life', 'Sports',
  'Psychological', 'Adventure', 'Harem', 'Mature',
]

export default function ManhwaPage() {
  const [manhwaList, setManhwaList]         = useState([])
  const [loading, setLoading]               = useState(true)
  const [activeTab, setActiveTab]           = useState('all')
  const [search, setSearch]                 = useState('')
  const [sortBy, setSortBy]                 = useState('newest')
  const [filterGenres, setFilterGenres]     = useState([])
  const [genreDropOpen, setGenreDropOpen]   = useState(false)
  const [formOpen, setFormOpen]             = useState(false)
  const [editingManhwa, setEditingManhwa]   = useState(null)

  useEffect(() => { fetchManhwa() }, [])

  const fetchManhwa = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('manhwa')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setManhwaList(data ?? [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load data: ' + (err.message ?? 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleted     = (id) => setManhwaList(prev => prev.filter(m => m.id !== id))
  const handleFormSuccess = () => { setFormOpen(false); setEditingManhwa(null); fetchManhwa() }
  const openAddForm       = () => { setEditingManhwa(null); setFormOpen(true) }
  const openEditForm      = (manhwa) => { setEditingManhwa(manhwa); setFormOpen(true) }

  const toggleFilterGenre = (genre) => {
    setFilterGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    )
  }

  // Count per tab (always from full list, not filtered)
  const tabCount = useMemo(() => ({
    all: manhwaList.length,
    NL:  manhwaList.filter(m => m.category === 'NL').length,
    BL:  manhwaList.filter(m => m.category === 'BL').length,
    GL:  manhwaList.filter(m => m.category === 'GL').length,
  }), [manhwaList])

  const filtered = useMemo(() => {
    let list = manhwaList.filter(m => {
      const matchTab    = activeTab === 'all' || m.category === activeTab
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase())
      const matchGenre  = filterGenres.length === 0 || filterGenres.every(g => {
        const genres = Array.isArray(m.genres) ? m.genres : (m.genre ? [m.genre] : [])
        return genres.includes(g)
      })
      return matchTab && matchSearch && matchGenre
    })

    switch (sortBy) {
      case 'az':
        list = [...list].sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'za':
        list = [...list].sort((a, b) => b.title.localeCompare(a.title))
        break
      case 'rating':
        list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        break
      case 'flag':
        list = [...list].sort((a, b) => {
          const fa = FLAG_ORDER[a.character_flag] ?? 99
          const fb = FLAG_ORDER[b.character_flag] ?? 99
          return fa - fb
        })
        break
      case 'genre':
        list = [...list].sort((a, b) => {
          const ga = Array.isArray(a.genres) && a.genres.length > 0 ? a.genres[0] : (a.genre ?? '')
          const gb = Array.isArray(b.genres) && b.genres.length > 0 ? b.genres[0] : (b.genre ?? '')
          return ga.localeCompare(gb)
        })
        break
      // 'newest' — already sorted by created_at desc from Supabase
      default:
        break
    }

    return list
  }, [manhwaList, activeTab, search, sortBy, filterGenres])

  const activeTabData = TABS.find(t => t.value === activeTab)

  return (
    <div
      className="min-h-screen flex bg-[#120e1c] text-slate-100"
      style={{
        backgroundImage: `
          radial-gradient(1200px 600px at 15% -10%, rgba(124,92,214,0.28), transparent 60%),
          radial-gradient(900px 500px at 100% 0%, rgba(185,166,245,0.14), transparent 55%)
        `,
      }}
    >
      {/* Sidebar */}
      <aside className="w-[236px] shrink-0 p-7 flex flex-col gap-9"
        style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5 font-bold text-[19px]">
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[#1c1630] font-bold text-base"
            style={{ background: 'linear-gradient(135deg, #b9a6f5, #6a49c4)' }}
          >
            屋
          </div>
          myManhwa
        </div>
        <nav className="flex flex-col gap-1">
          <SidebarItem icon="⌂" label="Home" />
          <SidebarItem icon="▤" label="Manhwa" active />
          <SidebarItem icon="▥" label="Manga" />
          <SidebarItem icon="◐" label="Profile" />
        </nav>
        <div className="mt-auto pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full shrink-0"
              style={{ background: 'linear-gradient(135deg, #e8b9d8, #8a6ae0)' }} />
            <div>
              <div className="text-[13px] font-semibold">Reika</div>
              <div className="text-[11px] text-slate-500">{manhwaList.length} titles collected</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Manhwa Collection</h1>
            <p className="text-[13px] text-slate-400">
              {activeTabData?.icon && <span className="mr-1">{activeTabData.icon}</span>}
              <span className="font-semibold text-slate-300">{tabCount[activeTab]}</span>
              {' '}title{tabCount[activeTab] !== 1 ? 's' : ''} in your digital shelf
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 text-[#f6f2ff] px-[18px] py-[11px] rounded-[11px] text-[13px] font-semibold hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #8a6ae0, #6a49c4)' }}
          >
            + Add Manhwa
          </button>
        </div>

        {/* Tabs + Search + Sort */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 rounded-xl"
            style={{ background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' }}>
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${
                  activeTab === tab.value ? 'bg-[#2c2348] text-[#b9a6f5]' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <span className="ml-1.5 text-[11px] text-purple-400/70">
                    {tabCount[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Genre multi-filter */}
            <div className="relative">
              <button
                onClick={() => setGenreDropOpen(o => !o)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  filterGenres.length > 0
                    ? 'bg-purple-600/30 border border-purple-500/60 text-purple-200'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={filterGenres.length === 0 ? { background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' } : {}}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10m-7 4h4" />
                </svg>
                Genre
                {filterGenres.length > 0 && (
                  <span className="bg-purple-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {filterGenres.length}
                  </span>
                )}
              </button>
              {genreDropOpen && (
                <div
                  className="absolute left-0 top-11 z-40 w-56 rounded-xl shadow-2xl shadow-black/60 p-3"
                  style={{ background: '#1e1a38', border: '1px solid rgba(185,166,245,0.25)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Filter Genre</span>
                    {filterGenres.length > 0 && (
                      <button onClick={() => setFilterGenres([])}
                        className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto">
                    {ALL_GENRES.map(genre => {
                      const active = filterGenres.includes(genre)
                      return (
                        <button
                          key={genre}
                          onClick={() => toggleFilterGenre(genre)}
                          className={`text-left px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            active
                              ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          {active && <span className="mr-1">✓</span>}{genre}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setGenreDropOpen(false)}
                    className="w-full mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors text-center"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Sort by */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl text-xs font-semibold text-slate-300 outline-none transition-all cursor-pointer"
                style={{ background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#1a1835]">{o.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl w-56 text-slate-500 text-sm"
              style={{ background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span>⌕</span>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search title..."
                className="bg-transparent outline-none w-full placeholder:text-slate-500 text-slate-200"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400 transition-colors">✕</button>
              )}
            </div>
          </div>
        </div>

        {/* Active genre filters display */}
        {filterGenres.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-slate-500">Filtering by:</span>
            {filterGenres.map(g => (
              <button
                key={g}
                onClick={() => toggleFilterGenre(g)}
                className="flex items-center gap-1 text-xs bg-purple-600/20 border border-purple-500/40 text-purple-300 px-2.5 py-1 rounded-lg hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-300 transition-all"
              >
                {g} <span className="text-[10px] opacity-60">✕</span>
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
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
            {search || filterGenres.length > 0
              ? 'No results found. Try adjusting the filters.'
              : 'No manhwa yet. Click "+ Add Manhwa" to start your collection!'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[18px]">
            {filtered.map(manhwa => (
              <ManhwaCard key={manhwa.id} manhwa={manhwa} onEdit={openEditForm} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </main>

      {formOpen && (
        <ManhwaForm
          manhwa={editingManhwa}
          onClose={() => { setFormOpen(false); setEditingManhwa(null) }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

function SidebarItem({ icon, label, active }) {
  return (
    <div
      className={`flex items-center gap-3 px-[14px] py-[10px] rounded-[10px] text-sm font-medium cursor-pointer
        ${active ? 'text-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
      style={active ? { background: '#251d3d', border: '1px solid rgba(185,166,245,0.35)' } : {}}
    >
      <span className="w-[18px] text-center opacity-90">{icon}</span>
      {label}
      {active && <span className="w-1.5 h-1.5 rounded-full bg-[#b9a6f5] ml-auto" />}
    </div>
  )
}
