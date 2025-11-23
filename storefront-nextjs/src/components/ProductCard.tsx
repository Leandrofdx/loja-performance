'use client'

import { ShoppingCart, Package } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useCheckoutApiStore } from '@/store/checkout-api'
import { useState } from 'react'
import Link from 'next/link'

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

interface ProductCardProps {
  product: any
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggleCart } = useCartStore()
  const { addItem, loading } = useCheckoutApiStore()
  const [isAdding, setIsAdding] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Get price from first variant
  const firstVariant = product.variants?.[0]
  const pricing = firstVariant?.pricing?.price?.gross
  const priceAmount = pricing?.amount || 99.99
  const currency = pricing?.currency === 'BRL' ? 'R$' : pricing?.currency || 'R$'
  
  // Get real stock from variants
  const stock = product.variants?.reduce((sum: number, v: any) => sum + (v.quantityAvailable || 0), 0) || 0
  const emoji = categoryEmojis[product.category?.name] || '🛍️'
  
  const handleAddToCart = async () => {
    console.log('[ProductCard] handleAddToCart called')
    if (!firstVariant?.id) {
      alert('Produto sem variante disponível')
      return
    }
    
    console.log('[ProductCard] Setting isAdding to true')
    setIsAdding(true)
    try {
      console.log('[ProductCard] Calling addItem with variant:', firstVariant.id)
      await addItem(firstVariant.id, 1)
      console.log('[ProductCard] addItem completed, toggling cart')
      toggleCart()
      console.log('[ProductCard] Cart toggled')
    } catch (error) {
      console.error('[ProductCard] Erro ao adicionar ao carrinho:', error)
      alert('Erro ao adicionar produto ao carrinho. Tente novamente.')
    } finally {
      console.log('[ProductCard] Setting isAdding to false')
      setIsAdding(false)
      console.log('[ProductCard] handleAddToCart completed')
    }
  }

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Apple-style Card */}
      <div className="bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
        {/* Image Area - Clean Apple style */}
        <Link href={`/produto/${product.slug}`}>
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center overflow-hidden cursor-pointer">
            <div 
              className={`text-9xl transform transition-all duration-700 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
            >
              {emoji}
            </div>
            
            {/* Stock badge - minimal */}
            {stock < 10 && stock > 0 && (
              <div className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                Últimas {stock}
              </div>
            )}
            {stock === 0 && (
              <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                Esgotado
              </div>
            )}
          </div>
        </Link>

        {/* Content - Spacious Apple style */}
        <div className="p-6 space-y-3">
          {/* Category - subtle */}
          <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
            {product.category?.name || 'Produto'}
          </p>

          {/* Name - Apple typography */}
          <Link 
            href={`/produto/${product.slug}`}
            className="block"
          >
            <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 min-h-[3.5rem] hover:text-gray-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Price - Apple style clean */}
          <div className="pt-2">
            <p className="text-sm text-gray-600 font-normal">A partir de</p>
            <p className="text-3xl font-semibold text-gray-900 tracking-tight">
              {currency} {priceAmount.toFixed(2)}
            </p>
          </div>

          {/* Stock indicator - minimal */}
          <div className="flex items-center pt-2">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              stock === 0 ? 'bg-gray-400' : stock < 10 ? 'bg-orange-500' : 'bg-green-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {stock === 0 ? 'Fora de estoque' : stock < 10 ? `Apenas ${stock} disponíveis` : 'Disponível'}
            </span>
          </div>

          {/* Buttons - Apple style minimal */}
          <div className="pt-8">
            <button
              onClick={handleAddToCart}
              disabled={stock === 0 || isAdding || loading}
              className={`w-full py-4 rounded-full font-medium text-[15px] transition-all duration-200 flex items-center justify-center space-x-2 ${
                stock === 0 || isAdding || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              }`}
            >
              {isAdding || loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Adicionando...</span>
                </>
              ) : (
                <span>{stock === 0 ? 'Indisponível' : 'Adicionar ao carrinho'}</span>
              )}
            </button>

            <Link href={`/produto/${product.slug}`} className="block mt-6">
              <button className="w-full py-4 rounded-full font-medium text-[15px] text-blue-600 hover:text-blue-700 transition-colors border border-blue-600/20 hover:border-blue-600/40 active:scale-95">
                Saiba mais
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
