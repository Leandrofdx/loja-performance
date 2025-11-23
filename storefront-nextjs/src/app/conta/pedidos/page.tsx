'use client'

import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@apollo/client'
import { GET_MY_ORDERS } from '@/lib/graphql/queries'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PedidosPage() {
  const { isAuth, loading: authLoading } = useAuth()
  const router = useRouter()

  const { data, loading } = useQuery(GET_MY_ORDERS, {
    variables: { first: 20 },
    skip: !isAuth,
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuth) {
    router.push('/login?redirect=/conta/pedidos')
    return null
  }

  const orders = data?.me?.orders?.edges || []

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Meus Pedidos</h1>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum pedido encontrado
              </h2>
              <p className="text-gray-500 mb-6">Faça seu primeiro pedido!</p>
              <Link
                href="/"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Ir para Loja
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(({ node: order }: any) => (
                <Link
                  key={order.id}
                  href={`/conta/pedidos/${order.id}`}
                  className="block p-6 border-2 border-gray-200 rounded-lg hover:border-primary-600 transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <Package className="w-5 h-5 text-primary-600" />
                        <h3 className="font-bold text-lg">Pedido #{order.number}</h3>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {format(new Date(order.created), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="mt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          order.status === 'FULFILLED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        R$ {order.total.gross.amount.toFixed(2)}
                      </p>
                      <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all ml-auto mt-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

