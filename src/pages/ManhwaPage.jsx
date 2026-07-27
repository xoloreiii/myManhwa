import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import ManhwaCard from '../components/ManhwaCard'
import ManhwaForm from '../components/ManhwaForm'

const TABS = [
  { value: 'all', label: 'All'  },
  { value: 'NL',  label: 'NL'   },
  { value: 'BL',  label: 'BL'   },
  { value: 'GL',  label: 'GL'   },
]

export default function ManhwaPage() {
  const [manhwaList, setManhwaList]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('all')
  const [search, setSearch]               = useState('')
  const [formOpen, setFormOpen]           = useState(false)
  const [editingManhwa, setEditingManhwa] = useState(null)

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

  const filtered = useMemo(() => manhwaList.filter(m => {
    const matchTab    = activeTab === 'all' || m.category === activeTab
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  }), [manhwaList, activeTab, search])

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
          <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[#1c1630] font-bold text-base"
            style={{ background: 'linear-gradient(135deg, #b9a6f5, #6a49c4)' }}>
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Manhwa Collection</h1>
            <p className="text-[13px] text-slate-400">
              {manhwaList.length} title{manhwaList.length !== 1 ? 's' : ''} in your digital shelf
            </p>
          </div>
          <button onClick={openAddForm}
            className="flex items-center gap-2 text-[#f6f2ff] px-[18px] py-[11px] rounded-[11px] text-[13px] font-semibold hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #8a6ae0, #6a49c4)' }}>
            + Add Manhwa
          </button>
        </div>

        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div className="flex gap-2 p-1.5 rounded-xl"
            style={{ background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' }}>
            {TABS.map(tab => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${
                  activeTab === tab.value ? 'bg-[#2c2348] text-[#b9a6f5]' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl w-64 text-slate-500 text-sm"
            style={{ background: '#1c1630', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span>⌕</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search title..."
              className="bg-transparent outline-none w-full placeholder:text-slate-500 text-slate-200" />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400 transition-colors">✕</button>
            )}
          </div>
        </div>

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
            {search
              ? `No results for "${search}". Try a different keyword.`
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
