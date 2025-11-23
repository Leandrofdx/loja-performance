'use client'

import { useQuery, useMutation } from '@apollo/client'
import { GET_CHECKOUT } from '@/lib/graphql/queries'
import { CHECKOUT_DELIVERY_METHOD_UPDATE } from '@/lib/graphql/mutations'
import { useCheckoutApiStore } from '@/store/checkout-api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toast'
import { useState } from 'react'
import Link from 'next/link'
import { CheckoutStepper } from '@/components/CheckoutStepper'

export default function CheckoutEnvio() {
  const router = useRouter()
  const { checkout: checkoutState } = useCheckoutApiStore()
  const checkoutId = checkoutState?.id
  const [selectedMethod, setSelectedMethod] = useState('')
  const [loading, setLoading] = useState(false)

  const { data } = useQuery(GET_CHECKOUT, {
    variables: { id: checkoutId || '' },
    skip: !checkoutId,
  })

  const [updateDeliveryMethod] = useMutation(CHECKOUT_DELIVERY_METHOD_UPDATE)

  if (!checkoutId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carrinho vazio</h1>
          <Link href="/" className="text-primary-600">Voltar para loja</Link>
        </div>
      </div>
    )
  }

  const checkout = data?.checkout
  const shippingMethods = checkout?.availableShippingMethods || []

  const handleContinue = async () => {
    if (!selectedMethod) {
      showError('Selecione um método de envio')
      return
    }

    setLoading(true)

    try {
      await updateDeliveryMethod({
        variables: {
          id: checkoutId,
          deliveryMethodId: selectedMethod,
        },
      })

      showSuccess('Método de envio selecionado!')
      router.push('/checkout/pagamento')
    } catch (error: any) {
      showError(error.message || 'Erro ao selecionar envio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Stepper */}
        <CheckoutStepper currentStep={2} />
        
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Método de Envio</h1>

          {shippingMethods.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum método de envio disponível para este endereço.</p>
              <Link href="/checkout/endereco" className="text-primary-600 mt-4 inline-block">
                Voltar para endereço
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {shippingMethods.map((method: any) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{method.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">Entrega em 5-10 dias úteis</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-900">
                        R$ {method.price?.amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={handleContinue}
                disabled={loading || !selectedMethod}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 mt-6 text-[17px]"
              >
                {loading ? 'Salvando...' : 'Continuar para Pagamento'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

