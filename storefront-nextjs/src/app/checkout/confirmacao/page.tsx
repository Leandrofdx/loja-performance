'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_CHECKOUT } from '@/lib/graphql/queries'
import { CHECKOUT_COMPLETE, CHECKOUT_PAYMENT_CREATE } from '@/lib/graphql/mutations'
import { useCheckoutApiStore } from '@/store/checkout-api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toast'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { CheckoutStepper } from '@/components/CheckoutStepper'

export default function CheckoutConfirmacao() {
  const router = useRouter()
  const { checkout: checkoutState, clearCheckout, selectedPaymentMethod } = useCheckoutApiStore()
  const checkoutId = checkoutState?.id
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [processingOrder, setProcessingOrder] = useState(false)

  const { data } = useQuery(GET_CHECKOUT, {
    variables: { id: checkoutId || '' },
    skip: !checkoutId,
  })

  const [completeCheckout] = useMutation(CHECKOUT_COMPLETE)
  const [createPayment] = useMutation(CHECKOUT_PAYMENT_CREATE)

  // Debug: verificar método salvo quando componente monta
  useEffect(() => {
    console.log('🟢 [Confirmação] Componente montado')
    console.log('🟢 [Confirmação] Método de pagamento do store:', selectedPaymentMethod)
    console.log('🟢 [Confirmação] Checkout ID:', checkoutId)
  }, [selectedPaymentMethod, checkoutId])

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

  const handleComplete = async () => {
    setLoading(true)
    setProcessingOrder(true)

    try {
      // 1. Criar pagamento com método selecionado
      const totalAmount = checkout?.totalPrice?.gross?.amount || 0
      const currency = checkout?.totalPrice?.gross?.currency || 'BRL'
      
      // SEMPRE usar mirumee.payments.dummy (único gateway disponível no Saleor)
      // Mas passar método selecionado no token para identificação
      let paymentGateway = 'mirumee.payments.dummy' // Sempre dummy (único aceito pelo Saleor)
      let paymentToken = 'dummy-token-' + Date.now()
      let paymentName = 'Dummy'
      
      console.log('🟢 [Confirmação] Verificando método antes de gerar token:', selectedPaymentMethod)
      
      if (selectedPaymentMethod) {
        const { method, cardLastDigits, installments } = selectedPaymentMethod
        
        // Mapear método para nome
        switch (method) {
          case 'credit_card':
            paymentName = 'Cartão de Crédito'
            paymentToken = `dummy-card-${cardLastDigits || 'xxxx'}-${installments || '1'}x-${Date.now()}`
            break
          case 'pix':
            paymentName = 'PIX'
            paymentToken = `dummy-pix-payment-${Date.now()}`
            break
          case 'boleto':
            paymentName = 'Boleto Bancário'
            paymentToken = `dummy-boleto-payment-${Date.now()}`
            break
          default:
            paymentName = method
            paymentToken = `dummy-${method}-payment-${Date.now()}`
        }
      } else {
        console.warn('⚠️ [Confirmação] NENHUM MÉTODO DE PAGAMENTO SELECIONADO! Usando fallback.')
      }
      
      console.log('🟢 [Confirmação] Criando pagamento com método:', selectedPaymentMethod?.method || 'não selecionado')
      console.log('🟢 [Confirmação] Gateway (sempre dummy):', paymentGateway)
      console.log('🟢 [Confirmação] Nome do método:', paymentName)
      console.log('🟢 [Confirmação] Token gerado (com método):', paymentToken)
      console.log('🟢 [Confirmação] Dados completos do método:', selectedPaymentMethod)
      
      const paymentInput = {
        gateway: paymentGateway, // Sempre dummy (único aceito)
        token: paymentToken, // Token contém informação do método
        amount: totalAmount,
      }
      
      console.log('🟢 [Confirmação] Input da requisição GraphQL:', JSON.stringify(paymentInput, null, 2))
      
      const { data: paymentData } = await createPayment({
        variables: {
          id: checkoutId,
          input: paymentInput,
        },
      })

      if (paymentData?.checkoutPaymentCreate?.errors?.length > 0) {
        const error = paymentData.checkoutPaymentCreate.errors[0]
        console.error('Erro ao criar pagamento:', error)
        throw new Error(`${error.field}: ${error.message}`)
      }

      console.log('Pagamento criado:', paymentData?.checkoutPaymentCreate?.payment)

      // 2. Completar checkout
      const { data: completeData } = await completeCheckout({
        variables: { id: checkoutId },
      })

      if (completeData?.checkoutComplete?.errors?.length > 0) {
        throw new Error(completeData.checkoutComplete.errors[0].message)
      }

      const newOrderId = completeData?.checkoutComplete?.order?.id
      const newOrderNumber = completeData?.checkoutComplete?.order?.number

      if (newOrderId) {
        setOrderId(newOrderId)
        setOrderNumber(newOrderNumber)
        clearCheckout()
        showSuccess(`Pedido #${newOrderNumber} criado com sucesso!`)
        // Clear cart
        window.dispatchEvent(new Event('cart-updated'))
        
        // Redirecionar para página de detalhes do pedido após 2 segundos
        setTimeout(() => {
          router.push(`/conta/pedidos/${newOrderId}`)
        }, 2000)
      }
    } catch (error: any) {
      showError(error.message || 'Erro ao finalizar pedido')
      setProcessingOrder(false)
    } finally {
      setLoading(false)
    }
  }

  // Loading state while processing order
  if (processingOrder || orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto text-center p-8">
          {orderId ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">Pedido Confirmado!</h1>
              <p className="text-[17px] text-gray-500 mb-1">Pedido #{orderNumber}</p>
              <p className="text-[15px] text-gray-500 mb-8 max-w-sm mx-auto">
                Obrigado pela sua compra! Você receberá um email de confirmação em breve.
              </p>
              <p className="text-sm text-gray-400 mb-8">Redirecionando para detalhes do pedido...</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">Processando seu pedido...</h1>
              <p className="text-[17px] text-gray-500 mb-8">
                Aguarde enquanto finalizamos sua compra
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Stepper */}
        <CheckoutStepper currentStep={4} />
        
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Confirmação</h1>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <h2 className="font-semibold text-xl mb-4 text-gray-900">Resumo do Pedido</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-[17px]">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    R$ {checkout?.subtotalPrice?.gross?.amount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-[17px]">
                  <span className="text-gray-600">Frete</span>
                  <span className="font-medium text-gray-900">
                    R$ {checkout?.shippingPrice?.gross?.amount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between text-2xl">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">
                    R$ {checkout?.totalPrice?.gross?.amount?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 text-[17px]"
            >
              {loading ? 'Finalizando...' : 'Finalizar Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

