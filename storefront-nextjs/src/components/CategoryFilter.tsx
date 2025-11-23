'use client'

interface Category {
  id: string
  name: string
  products: {
    totalCount: number
  }
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

const categoryEmojis: Record<string, string> = {
  'Eletrônicos': '📱',
  'Moda e Vestuário': '👕',
  'Casa e Decoração': '🏠',
  'Livros e Papelaria': '📚',
  'Esportes e Fitness': '⚽',
  'Beleza e Cuidados': '💄',
  'Alimentos e Bebidas': '🍕',
  'Brinquedos e Games': '🎮',
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="relative">
      {/* Scrollable horizontal list - Apple style */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex-shrink-0 px-6 py-3 rounded-full font-medium text-sm transition-all ${
            selectedCategory === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
          }`}
        >
          Todas
        </button>
        {categories.map((category) => (
          category.products.totalCount > 0 && (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.name)}
              className={`flex-shrink-0 px-6 py-3 rounded-full font-medium text-sm transition-all flex items-center space-x-2 ${
                selectedCategory === category.name
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
              }`}
            >
              <span>{categoryEmojis[category.name] || '🛍️'}</span>
              <span>{category.name}</span>
              <span className="opacity-60">
                ({category.products.totalCount})
              </span>
            </button>
          )
        ))}
      </div>
      
      {/* Fade gradient on right for scroll indicator */}
      <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
    </div>
  )
}
