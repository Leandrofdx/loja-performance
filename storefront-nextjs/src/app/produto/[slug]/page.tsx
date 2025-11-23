'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_PRODUCT_DETAILS } from '@/lib/graphql/queries'
import { CHECKOUT_ADD_PROMO_CODE } from '@/lib/graphql/mutations'
import { useRouter, useParams } from 'next/navigation'
import { ShoppingCart, ArrowLeft, Truck, Tag, MapPin } from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast'
import Link from 'next/link'
import { useCheckoutApiStore } from '@/store/checkout-api'
import { useCartStore } from '@/store/cart'

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

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [cep, setCep] = useState('')
  const [shippingData, setShippingData] = useState<any>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  
  const { addItem, loading: cartLoading, checkout, createCheckout } = useCheckoutApiStore()
  const { toggleCart } = useCartStore()
  
  // Mutation para aplicar cupom via API
  const [applyCouponMutation, { loading: couponLoading }] = useMutation(CHECKOUT_ADD_PROMO_CODE)

  // Decode slug para lidar com acentos
  const decodedSlug = params.slug ? decodeURIComponent(params.slug as string) : ''
  
  const { data, loading, error } = useQuery(GET_PRODUCT_DETAILS, {
    variables: {
      slug: decodedSlug,
      channel: 'default-channel',
    },
    skip: !decodedSlug,
  })

  const product = data?.product

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-32 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">Produto não encontrado</h1>
          <p className="text-gray-500 mb-8">
            O produto que você está procurando não existe ou foi removido.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-6 py-3 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para home
          </Link>
        </div>
      </div>
    )
  }

  const variant = selectedVariant || product.variants[0]
  const price = product.pricing?.priceRange?.start?.gross || variant?.pricing?.price?.gross
  const emoji = categoryEmojis[product.category?.name] || '🛍️'
  const stock = product.variants?.reduce((sum: number, v: any) => sum + (v.quantityAvailable || 0), 0) || 0

  // Calcular preço com desconto
  const basePrice = price?.amount || 0
  const discount = appliedCoupon ? 0.10 : 0 // 10% de desconto
  const finalPrice = basePrice * (1 - discount)

  const handleAddToCart = async () => {
    if (!variant) {
      showError('Selecione uma variante')
      return
    }

    try {
      await addItem(variant.id, quantity)
      showSuccess(`${quantity}x ${product.name} adicionado ao carrinho!`)
      toggleCart()
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
      showError('Erro ao adicionar ao carrinho. Tente novamente.')
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showError('Digite um código de cupom')
      return
    }
    
    let checkoutId = checkout?.id
    
    // Se não houver checkout, tentar criar um
    if (!checkoutId) {
      try {
        await createCheckout()
        checkoutId = useCheckoutApiStore.getState().checkout?.id
        
        if (!checkoutId) {
          showError('Carrinho vazio. Adicione um produto primeiro.')
          return
        }
      } catch (error) {
        showError('Erro ao criar carrinho. Adicione um produto primeiro.')
        return
      }
    }
    
    try {
      const { data } = await applyCouponMutation({
        variables: {
          id: checkoutId,
          promoCode: couponCode.toUpperCase()
        }
      })
      
      if (data?.checkoutAddPromoCode?.errors?.length > 0) {
        const errorMsg = data.checkoutAddPromoCode.errors[0].message
        showError(errorMsg || 'Cupom inválido')
      } else {
        setAppliedCoupon(couponCode.toUpperCase())
        const discount = data?.checkoutAddPromoCode?.checkout?.discount
        if (discount) {
          showSuccess(`Cupom aplicado! Desconto de R$ ${discount.amount}`)
        } else {
          showSuccess('Cupom aplicado com sucesso!')
        }
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error)
      showError('Erro ao aplicar cupom. Tente novamente.')
    }
  }

  const handleCalculateShipping = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      showError('Digite um CEP válido')
      return
    }

    setLoadingShipping(true)
    
    // Simular consulta de frete
    setTimeout(() => {
      setShippingData({
        sedex: { days: '2-3 dias úteis', price: 15.90 },
        pac: { days: '5-7 dias úteis', price: 8.50 },
        express: { days: '1 dia útil', price: 25.00 }
      })
      setLoadingShipping(false)
      showSuccess('Frete calculado!')
    }, 1500)
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          Voltar
        </Link>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Product Image */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center overflow-hidden">
            <div className="text-[200px] leading-none">
              {emoji}
            </div>
            
            {stock < 10 && stock > 0 && (
              <div className="absolute top-6 right-6 bg-orange-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                Últimas {stock}
              </div>
            )}
            {stock === 0 && (
              <div className="absolute top-6 right-6 bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                Esgotado
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-orange-600 uppercase tracking-wide mb-3">
              {product.category?.name || 'Produto'}
            </p>

            <h1 className="text-5xl font-semibold text-gray-900 mb-6 tracking-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-1">
                {appliedCoupon ? 'De R$ ' + basePrice.toFixed(2) + ' por' : 'A partir de'}
              </p>
              <div className="flex items-baseline space-x-3">
                <p className="text-4xl font-semibold text-gray-900">
                  R$ {finalPrice.toFixed(2)}
                </p>
                {appliedCoupon && (
                  <span className="text-lg text-green-600 font-medium">
                    10% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Coupon */}
            <div className="mb-8 p-6 bg-gray-50 rounded-3xl">
              <div className="flex items-center mb-4">
                <Tag className="w-5 h-5 text-gray-700 mr-2" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-gray-900">Cupom de Desconto</h3>
              </div>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                  <div>
                    <p className="font-semibold text-green-800">{appliedCoupon}</p>
                    <p className="text-sm text-green-600">10% de desconto aplicado</p>
                  </div>
                  <button
                    onClick={() => {
                      setAppliedCoupon(null)
                      setCouponCode('')
                      showSuccess('Cupom removido')
                    }}
                    className="text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Digite o cupom"
                    className="flex-1 px-5 py-3 text-[15px] border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? 'Aplicando...' : 'Aplicar'}
                  </button>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-3">
                💡 Cupons válidos: <code className="bg-white px-2 py-1 rounded">DESC10</code> ou <code className="bg-white px-2 py-1 rounded">PRIMEIRACOMPRA</code>
              </p>
            </div>

            {/* Shipping Calculator */}
            <div className="mb-8 p-6 bg-gray-50 rounded-3xl">
              <div className="flex items-center mb-4">
                <Truck className="w-5 h-5 text-gray-700 mr-2" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-gray-900">Calcular Frete</h3>
              </div>
              
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(formatCep(e.target.value))}
                  placeholder="00000-000"
                  maxLength={9}
                  className="flex-1 px-5 py-3 text-[15px] border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
                <button
                  onClick={handleCalculateShipping}
                  disabled={loadingShipping}
                  className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {loadingShipping ? 'Calculando...' : 'Calcular'}
                </button>
              </div>

              {shippingData && (
                <div className="space-y-2">
                  {Object.entries(shippingData).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-white rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{key}</p>
                        <p className="text-sm text-gray-500">{value.days}</p>
                      </div>
                      <p className="font-semibold text-gray-900">R$ {value.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h3>
                <div className="text-gray-600 text-[17px] leading-relaxed">
                  {(() => {
                    try {
                      const desc = JSON.parse(product.description)
                      if (desc.blocks) {
                        return desc.blocks.map((block: any, i: number) => (
                          <p key={i} className="mb-3">{block.data.text}</p>
                        ))
                      }
                      return product.description
                    } catch {
                      return <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Opções</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={v.quantityAvailable === 0}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        (selectedVariant?.id || product.variants[0].id) === v.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${v.quantityAvailable === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <p className="font-medium text-gray-900 text-sm">{v.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {v.quantityAvailable === 0 ? 'Esgotado' : `${v.quantityAvailable} disponíveis`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantidade</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center font-semibold text-gray-700 transition-all active:scale-95"
                >
                  −
                </button>
                <span className="text-2xl font-semibold text-gray-900 w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center font-semibold text-gray-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={stock === 0 || cartLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-5 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center space-x-2 text-lg"
            >
              {cartLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Adicionando...</span>
                </>
              ) : stock === 0 ? (
                <span>Indisponível</span>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
                  <span>Adicionar ao carrinho</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
