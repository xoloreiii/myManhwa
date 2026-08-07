import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { value: 'NL', label: 'NL — Normal Love', emoji: '💕', bg: 'bg-pink-900/60',   text: 'text-pink-200',   border: 'border-pink-700/60'   },
  { value: 'BL', label: 'BL — Boys Love',   emoji: '💙', bg: 'bg-blue-900/60',   text: 'text-blue-200',   border: 'border-blue-700/60'   },
  { value: 'GL', label: 'GL — Girls Love',  emoji: '💜', bg: 'bg-purple-900/60', text: 'text-purple-200', border: 'border-purple-700/60' },
]

const STATUSES = [
  { value: 'ongoing',       label: 'Ongoing',       emoji: '🟢' },
  { value: 'completed',     label: 'Completed',     emoji: '✅' },
  { value: 'dropped',       label: 'Dropped',       emoji: '🚫' },
  { value: 'plan_to_read',  label: 'Plan to Read',  emoji: '📌' },
]

const FLAGS = [
  { value: 'Green Flag',  label: 'Green Flag',  color: 'bg-green-900/50 border-green-600/60 text-green-300',       dot: 'bg-green-400'  },
  { value: 'Red Flag',    label: 'Red Flag',    color: 'bg-red-900/50 border-red-600/60 text-red-300',             dot: 'bg-red-400'    },
  { value: 'Yellow Flag', label: 'Yellow Flag', color: 'bg-yellow-900/50 border-yellow-600/60 text-yellow-300',   dot: 'bg-yellow-400' },
  { value: 'Black Flag',  label: 'Black Flag',  color: 'bg-zinc-800/80 border-zinc-600/60 text-zinc-300',          dot: 'bg-zinc-400'   },
]

const PRESET_GENRES = [
  'Action', 'Romance', 'Fantasy', 'Comedy', 'Drama', 'Thriller',
  'Horror', 'Slice of Life', 'Mystery', 'Sci-Fi', 'Supernatural',
  'Historical', 'Isekai', 'Martial Arts', 'School Life', 'Sports',
  'Psychological', 'Adventure', 'Harem', 'Mature',
]

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <svg
            className={`w-7 h-7 transition-colors ${
              star <= (hovered || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-slate-600 fill-slate-700'
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-slate-500 ml-1">{value}/5</span>
      )}
    </div>
  )
}

export default function ManhwaForm({ manhwa, onClose, onSuccess }) {
  const isEditing = !!manhwa
  const [form, setForm] = useState({
    title:          manhwa?.title          ?? '',
    category:       manhwa?.category       ?? 'NL',
    chapter:        manhwa?.chapter        ?? '',
    status:         manhwa?.status         ?? 'ongoing',
    character_flag: manhwa?.character_flag ?? null,
    rating:         manhwa?.rating         ?? 0,
  })
  const [genres, setGenres] = useState(
    Array.isArray(manhwa?.genres) ? manhwa.genres : (manhwa?.genre ? [manhwa.genre] : [])
  )
  const [posterFile, setPosterFile]       = useState(null)
  const [posterPreview, setPosterPreview] = useState(manhwa?.poster_url ?? null)
  const [loading, setLoading]             = useState(false)
  const fileInputRef = useRef(null)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const toggleGenre = useCallback((genre) => {
    setGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    )
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('File must be an image!'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max image size is 5MB!'); return }
    setPosterFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPosterPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const uploadPoster = async (file) => {
    const mimeToExt = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
    const ext = mimeToExt[file.type] ?? 'jpg'
    const filePath = `posters/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data: uploadData, error } = await supabase.storage
      .from('manhwa-posters').upload(filePath, file, { contentType: file.type, cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('manhwa-posters').getPublicUrl(uploadData.path)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title cannot be empty!'); return }
    if (!form.chapter || isNaN(form.chapter) || Number(form.chapter) < 0) { toast.error('Chapter must be a valid number!'); return }
    setLoading(true)
    try {
      let posterUrl = manhwa?.poster_url ?? null
      if (posterFile) {
        if (manhwa?.poster_url) {
          const parts = manhwa.poster_url.split('/storage/v1/object/public/manhwa-posters/')
          if (parts[1]) await supabase.storage.from('manhwa-posters').remove([parts[1]])
        }
        posterUrl = await uploadPoster(posterFile)
      }
      const payload = {
        title:          form.title.trim(),
        category:       form.category,
        chapter:        Number(form.chapter),
        status:         form.status,
        genres,
        character_flag: form.character_flag || null,
        poster_url:     posterUrl,
        rating:         form.rating || null,
      }
      let error
      if (isEditing) { ;({ error } = await supabase.from('manhwa').update(payload).eq('id', manhwa.id)) }
      else           { ;({ error } = await supabase.from('manhwa').insert([payload])) }
      if (error) throw error
      toast.success(isEditing ? 'Manhwa updated!' : 'Manhwa added!')
      onSuccess()
    } catch (err) { toast.error('Error: ' + (err.message ?? 'Unknown error')) }
    finally { setLoading(false) }
  }

  const selectedCat = CATEGORIES.find(c => c.value === form.category)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#17162f', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-base font-bold text-white">{isEditing ? '✏️ Edit Manhwa' : '➕ Add Manhwa'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Poster */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Poster / Cover</label>
            <div
              className="relative w-full h-40 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 transition-colors cursor-pointer overflow-hidden group"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              onClick={() => fileInputRef.current?.click()}
            >
              {posterPreview ? (
                <>
                  <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">Change Poster</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-slate-500">Click to upload poster</span>
                  <span className="text-xs text-slate-600">PNG, JPG, WEBP — Max 5MB</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Title <span className="text-red-400 normal-case">*</span>
            </label>
            <input type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="e.g. Solo Leveling" className="input-field" required />
          </div>

          {/* Category & Chapter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Category <span className="text-red-400 normal-case">*</span>
              </label>
              <div className="relative">
                <select name="category" value={form.category} onChange={handleChange}
                  className={`input-field appearance-none font-semibold ${selectedCat.text} ${selectedCat.bg} ${selectedCat.border}`}>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value} className="bg-[#1a1835] text-slate-200 font-normal">
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Chapter <span className="text-red-400 normal-case">*</span>
              </label>
              <input type="number" name="chapter" value={form.chapter} onChange={handleChange}
                placeholder="0" min="0" className="input-field" required />
            </div>
          </div>

          {/* Genre Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Genres
              {genres.length > 0 && (
                <span className="normal-case font-normal text-purple-400 ml-2">({genres.length} selected)</span>
              )}
            </label>
            <div className="rounded-xl border border-white/10 p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {PRESET_GENRES.map(genre => {
                  const checked = genres.includes(genre)
                  return (
                    <label
                      key={genre}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-xs font-medium select-none
                        ${checked
                          ? 'bg-purple-600/25 border border-purple-500/50 text-purple-200'
                          : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all border
                        ${checked ? 'bg-purple-500 border-purple-400' : 'border-slate-600 bg-white/5'}`}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <input type="checkbox" checked={checked} onChange={() => toggleGenre(genre)} className="hidden" />
                      {genre}
                    </label>
                  )
                })}
              </div>
              {genres.length > 0 && (
                <button type="button" onClick={() => setGenres([])}
                  className="text-[11px] text-slate-600 hover:text-slate-400 mt-2 transition-colors">
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Character Flag */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Character Personality</label>
            <div className="grid grid-cols-2 gap-2">
              {FLAGS.map(f => (
                <label key={f.value}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium
                    ${form.character_flag === f.value ? f.color : 'border-white/10 text-slate-500 hover:text-slate-300'}`}
                  style={form.character_flag !== f.value ? { background: 'rgba(255,255,255,0.03)' } : {}}>
                  <input type="radio" name="character_flag" value={f.value}
                    checked={form.character_flag === f.value} onChange={handleChange} className="hidden" />
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${form.character_flag === f.value ? f.dot : 'bg-slate-600'}`} />
                  {f.label}
                </label>
              ))}
            </div>
            {form.character_flag && (
              <button type="button" onClick={() => setForm(p => ({ ...p, character_flag: null }))}
                className="text-[11px] text-slate-600 hover:text-slate-400 mt-1.5 transition-colors">
                Clear selection
              </button>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => (
                <label key={s.value}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium
                    ${form.status === s.value
                      ? 'border-purple-500/60 bg-purple-600/20 text-white'
                      : 'text-slate-500 hover:text-slate-300'}`}
                  style={form.status !== s.value ? { border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' } : {}}>
                  <input type="radio" name="status" value={s.value}
                    checked={form.status === s.value} onChange={handleChange} className="hidden" />
                  <span>{s.emoji}</span>{s.label}
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rating</label>
            <StarRating value={form.rating} onChange={(val) => setForm(p => ({ ...p, rating: val }))} />
            <p className="text-[11px] text-slate-600 mt-1">Click again on the same star to clear rating</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : (isEditing ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
