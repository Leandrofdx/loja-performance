'use client'

import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@apollo/client'
import { GET_ORDER_DETAILS } from '@/lib/graphql/queries'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Package, MapPin, Truck, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'

export default function OrderDetailsPage() {
  const { isAuth, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const { data, loading } = useQuery(GET_ORDER_DETAILS, {
    variables: { id: orderId },
    skip: !isAuth || !orderId,
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuth) {
    router.push(`/login?redirect=/conta/pedidos/${orderId}`)
    return null
  }

  const order = data?.order

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Pedido não encontrado
          </h2>
          <Link
            href="/conta/pedidos"
            className="inline-block text-primary-600 hover:text-primary-700 font-semibold"
          >
            Voltar para Meus Pedidos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/conta/pedidos"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para Meus Pedidos
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Package className="w-6 h-6 text-primary-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Pedido #{order.number}
                </h1>
              </div>
              <p className="text-gray-600">
                Realizado em{' '}
                {format(new Date(order.created), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'FULFILLED'
                  ? 'bg-green-100 text-green-700'
                  : order.status === 'UNFULFILLED'
                  ? 'bg-yellow-100 text-yellow-700'
                  : order.status === 'CANCELED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {order.status === 'UNFULFILLED' && 'Aguardando Envio'}
              {order.status === 'FULFILLED' && 'Enviado'}
              {order.status === 'CANCELED' && 'Cancelado'}
              {order.status === 'DRAFT' && 'Rascunho'}
            </span>
          </div>

          {/* Products */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Produtos
            </h2>
            <div className="space-y-4">
              {order.lines.map((line: any) => (
                <Link
                  key={line.id}
                  href={`/produto/${line.variant?.product?.slug || ''}`}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-600 transition-colors group"
                >
                  {line.thumbnail?.url && (
                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={line.thumbnail.url}
                        alt={line.productName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {line.productName}
                    </h3>
                    <p className="text-sm text-gray-600">{line.variantName}</p>
                    <p className="text-sm text-gray-600">Quantidade: {line.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary-600">
                      R$ {line.totalPrice.gross.amount.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Endereço de Entrega
              </h2>
              <p className="text-gray-700">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p className="text-gray-700">{order.shippingAddress.streetAddress1}</p>
              {order.shippingAddress.streetAddress2 && (
                <p className="text-gray-700">{order.shippingAddress.streetAddress2}</p>
              )}
              <p className="text-gray-700">
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </p>
              <p className="text-gray-700">{order.shippingAddress.country.country}</p>
              {order.shippingAddress.phone && (
                <p className="text-gray-700 mt-1">Tel: {order.shippingAddress.phone}</p>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Resumo do Pedido
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>R$ {order.subtotal.gross.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Frete</span>
                <span>R$ {order.shippingPrice.gross.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">
                  R$ {order.total.gross.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

