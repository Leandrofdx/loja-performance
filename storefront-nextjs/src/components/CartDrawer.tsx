'use client'

import { X, Plus, Minus, Trash2, ShoppingCart as CartIcon } from 'lucide-react'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import { useCheckoutApiStore } from '@/store/checkout-api'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export function CartDrawer() {
  console.log('🔴🔴🔴 CARTDRAWER CARREGADO - NOVO CÓDIGO 🔴🔴🔴')
  
  const { isOpen, toggleCart } = useCartStore()
  const { checkout, loading, updateItemQuantity, removeItem } = useCheckoutApiStore()
  const { isAuth } = useAuth()
  const router = useRouter()
  
  const hasItems = checkout?.lines && Array.isArray(checkout.lines) && checkout.lines.length > 0
  
  console.log('[CartDrawer] Render:', { 
    isOpen, 
    checkout, 
    loading, 
    lines: checkout?.lines?.length,
    hasItems,
    linesIsArray: Array.isArray(checkout?.lines)
  })
  
  const totalItems = checkout?.lines?.reduce((sum, line) => sum + line.quantity, 0) || 0
  const totalPrice = checkout?.totalPrice?.gross.amount || 0
  const currency = checkout?.totalPrice?.gross.currency || 'BRL'
  
  const handleUpdateQuantity = async (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(lineId)
    } else {
      await updateItemQuantity(lineId, quantity)
    }
  }
  
  const handleCheckout = () => {
    if (totalItems === 0) {
      alert('Seu carrinho está vazio!')
      return
    }
    toggleCart()
    
    // Verificar se usuário está autenticado usando hook
    if (!isAuth) {
      router.push('/login?redirect=/checkout/endereco')
    } else {
      router.push('/checkout/endereco')
    }
  }
  
  return (
    <div
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-all duration-300 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      onClick={toggleCart}
    >
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Apple Style Clean */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200/80">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            Sacola
          </h2>
          <button 
            onClick={toggleCart} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Items Count Badge */}
        {totalItems > 0 && (
          <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-200/50">
            <p className="text-sm text-gray-600">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </p>
          </div>
        )}
        
        {/* Items */}
        <div className="px-6 py-4 h-[calc(100%-240px)] overflow-y-auto">
          {(() => {
            console.log('[CartDrawer] Branch check:', {
              loadingAndNoCheckout: loading && !checkout,
              notHasItems: !hasItems,
              shouldShowProducts: hasItems,
              checkoutExists: !!checkout,
              linesCount: checkout?.lines?.length
            })
            
            if (loading && !checkout) {
              return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg className="animate-spin h-10 w-10 mb-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-[17px] text-gray-500">Carregando sacola...</p>
                </div>
              )
            }
            
            if (!hasItems) {
              console.log('[CartDrawer] Showing empty cart')
              return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-16">
                  <div className="w-24 h-24 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <CartIcon className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-xl font-semibold mb-2 text-gray-900">Sua sacola está vazia</p>
                  <p className="text-[15px] text-center text-gray-500 max-w-[260px]">
                    Adicione produtos para começar suas compras
                  </p>
                </div>
              )
            }
            
            console.log('[CartDrawer] Showing products, lines:', checkout!.lines.length)
            return (
              <div className="space-y-6 min-h-[200px]">
                {checkout!.lines.map((line, index) => {
                  console.log(`[CartDrawer] Rendering line ${index}:`, {
                    id: line.id,
                    productName: line.variant.product.name,
                    variantName: line.variant.name,
                    price: line.variant.pricing?.price?.gross?.amount
                  })
                  
                  const price = line.variant.pricing?.price?.gross?.amount || 0
                  const currencySymbol = line.variant.pricing?.price?.gross?.currency === 'BRL' ? 'R$' : line.variant.pricing?.price?.gross?.currency || 'R$'
                  
                  return (
                  <div key={line.id} className="flex items-start space-x-4 py-4 border-b border-gray-100 last:border-b-0">
                    {/* Image */}
                    <div className="relative w-24 h-24 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
                      {line.variant.product.thumbnail?.url ? (
                        <Image
                          src={line.variant.product.thumbnail.url}
                          alt={line.variant.product.name}
                          layout="fill"
                          objectFit="cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🛍️
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="font-medium text-[17px] text-gray-900 line-clamp-2 mb-1">
                        {line.variant.product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">{line.variant.name}</p>
                      
                      {/* Quantity Controls - Horizontal */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1.5">
                          <button
                            onClick={() => handleUpdateQuantity(line.id, line.quantity - 1)}
                            disabled={loading}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <span className="font-medium text-[15px] px-2 min-w-[24px] text-center">
                            {line.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(line.id, line.quantity + 1)}
                            disabled={loading}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(line.id)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                      
                      <p className="text-gray-900 font-semibold text-[17px]">
                        {currencySymbol} {price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
        
        {/* Footer - Apple Style */}
        <div className="absolute bottom-0 left-0 w-full bg-white px-6 py-6 border-t border-gray-200/80">
          <div className="space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-baseline">
              <span className="text-[15px] text-gray-600">Subtotal</span>
              <span className="text-2xl font-semibold text-gray-900">
                R$ {totalPrice.toFixed(2)}
              </span>
            </div>
            
            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={totalItems === 0 || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center space-x-2 text-[17px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processando...</span>
                </>
              ) : (
                <span>Finalizar Compra</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
