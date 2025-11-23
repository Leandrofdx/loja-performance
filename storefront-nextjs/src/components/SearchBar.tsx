'use client'

import { Search, X } from 'lucide-react'
import { useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    // Busca apenas com 3+ caracteres ou vazio (para limpar)
    if (value.length >= 3 || value.length === 0) {
      onSearch(value)
    }
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className={`relative transition-all duration-200 ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}>
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" strokeWidth={1.5} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Buscar produtos..."
          className="w-full pl-14 pr-24 py-4 text-[17px] rounded-full border border-gray-200 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        )}
        
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium text-sm transition-all active:scale-95"
        >
          Buscar
        </button>
        
        {/* Feedback visual para busca mínima */}
        {query && query.length > 0 && query.length < 3 && (
          <div className="absolute left-0 top-full mt-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            Digite pelo menos 3 caracteres para buscar
          </div>
        )}
      </div>
    </form>
  )
}
