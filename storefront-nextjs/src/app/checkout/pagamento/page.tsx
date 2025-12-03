'use client'

import { useState, useEffect } from 'react'
import { useQuery, useApolloClient } from '@apollo/client'
import { GET_CHECKOUT } from '@/lib/graphql/queries'
import { useCheckoutApiStore } from '@/store/checkout-api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Smartphone, FileText, Check } from 'lucide-react'
import { CheckoutStepper } from '@/components/CheckoutStepper'

type PaymentMethod = 'credit_card' | 'pix' | 'boleto'

export default function CheckoutPagamento() {
  const router = useRouter()
  const client = useApolloClient()
  const { checkout: checkoutState, setPaymentMethod, selectedPaymentMethod } = useCheckoutApiStore()
  const checkoutId = checkoutState?.id
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)

  // Estado para cartão de crédito
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1'
  })

  const { data } = useQuery(GET_CHECKOUT, {
    variables: { id: checkoutId || '' },
    skip: !checkoutId,
  })

  // Mapeamento de métodos para gateways
  const gatewayMap: Record<PaymentMethod, { id: string; name: string }> = {
    pix: { id: 'mirumee.payments.pix', name: 'PIX' },
    boleto: { id: 'mirumee.payments.boleto', name: 'Boleto Bancário' },
    credit_card: { id: 'mirumee.payments.credit_card', name: 'Cartão de Crédito' }
  }

  // Função para adicionar gateway selecionado ao cache do Apollo
  const addSelectedGatewayToCache = (method: PaymentMethod) => {
    if (!checkoutId) return

    try {
      const selectedGateway = gatewayMap[method]
      
      // Ler cache atual
      const existingData = client.readQuery({
        query: GET_CHECKOUT,
        variables: { id: checkoutId }
      })

      if (!existingData?.checkout) {
        console.warn('⚠️ [Pagamento] Não foi possível ler cache do checkout')
        return
      }

      // Verificar se gateway já existe no array (evitar duplicatas)
      const gateways = existingData.checkout.availablePaymentGateways || []
      const gatewayExists = gateways.some((g: any) => g.id === selectedGateway.id)

      if (gatewayExists) {
        console.log('✅ [Pagamento] Gateway já existe no cache:', selectedGateway.id)
        return
      }

      // Adicionar novo gateway ao array
      const newGateway = {
        ...selectedGateway,
        __typename: 'PaymentGateway' as const
      }

      // Escrever cache atualizado
      client.writeQuery({
        query: GET_CHECKOUT,
        variables: { id: checkoutId },
        data: {
          checkout: {
            ...existingData.checkout,
            availablePaymentGateways: [
              ...gateways,
              newGateway
            ]
          }
        }
      })

      console.log('✅ [Pagamento] Gateway adicionado ao cache:', newGateway)
    } catch (error) {
      console.error('❌ [Pagamento] Erro ao adicionar gateway ao cache:', error)
    }
  }

  // Restaurar gateway ao montar componente se houver método selecionado
  useEffect(() => {
    if (!checkoutId || !data?.checkout) return

    // Verificar se há método selecionado nos metadados do checkout
    const checkout = data.checkout
    if (checkout.metadata) {
      const paymentMethodMeta = checkout.metadata.find((m: any) => m.key === 'selected_payment_method')
      if (paymentMethodMeta) {
        const method = paymentMethodMeta.value as PaymentMethod
        if (method && ['pix', 'boleto', 'credit_card'].includes(method)) {
          console.log('🔄 [Pagamento] Restaurando gateway dos metadados:', method)
          addSelectedGatewayToCache(method)
          setSelectedMethod(method)
          return // Priorizar metadados do checkout
        }
      }
    }

    // Também verificar se há método no store local
    if (selectedPaymentMethod?.method) {
      const method = selectedPaymentMethod.method
      if (['pix', 'boleto', 'credit_card'].includes(method)) {
        console.log('🔄 [Pagamento] Restaurando gateway do store:', method)
        addSelectedGatewayToCache(method)
        setSelectedMethod(method)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutId, data?.checkout?.metadata, selectedPaymentMethod?.method])

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
  const totalAmount = checkout?.totalPrice?.gross?.amount || 0

  const paymentMethods = [
    {
      id: 'credit_card' as PaymentMethod,
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Parcele em até 12x sem juros',
      popular: true
    },
    {
      id: 'pix' as PaymentMethod,
      name: 'PIX',
      icon: Smartphone,
      description: 'Aprovação instantânea',
      popular: false
    },
    {
      id: 'boleto' as PaymentMethod,
      name: 'Boleto Bancário',
      icon: FileText,
      description: 'Vencimento em 3 dias',
      popular: false
    }
  ]

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
    return formatted.substring(0, 19) // 4 groups of 4 digits + 3 spaces
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
    }
    return cleaned
  }

  const handleCardChange = (field: string, value: string) => {
    if (field === 'number') {
      value = formatCardNumber(value)
    } else if (field === 'expiry') {
      value = formatExpiry(value)
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4)
    }
    setCardData({ ...cardData, [field]: value })
  }

  const fillTestData = () => {
    setCardData({
      number: '4111 1111 1111 1111',
      name: 'TESTE SILVA',
      expiry: '12/28',
      cvv: '123',
      installments: '1'
    })
  }

  const handleContinue = async () => {
    if (!selectedMethod) {
      alert('Selecione um método de pagamento')
      return
    }

    // Validações específicas por método
    if (selectedMethod === 'credit_card') {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        alert('Preencha todos os dados do cartão')
        return
      }
      if (cardData.number.replace(/\s/g, '').length < 13) {
        alert('Número do cartão inválido')
        return
      }
    }

    setLoading(true)
    
    // Salvar método de pagamento selecionado no store
    const paymentData = {
      method: selectedMethod,
      ...(selectedMethod === 'credit_card' && {
        cardLastDigits: cardData.number.replace(/\s/g, '').slice(-4),
        cardName: cardData.name,
        installments: cardData.installments
      })
    }
    
    setPaymentMethod(paymentData)
    console.log('🔵 [Pagamento] Método salvo no Zustand:', paymentData)
    
    // Adicionar gateway ao cache do Apollo para aparecer na requisição GraphQL
    addSelectedGatewayToCache(selectedMethod)
    console.log('✅ [Pagamento] Gateway adicionado ao cache do Apollo')
    
    // Verificar se foi salvo corretamente
    const savedMethod = useCheckoutApiStore.getState().selectedPaymentMethod
    console.log('🔵 [Pagamento] Método verificado após salvar:', savedMethod)
    
    if (!savedMethod || savedMethod.method !== selectedMethod) {
      console.error('❌ [Pagamento] ERRO: Método não foi salvo corretamente!')
    } else {
      console.log('✅ [Pagamento] Método salvo com sucesso!')
    }
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    
    router.push('/checkout/confirmacao')
  }

  const installmentOptions: { value: string; label: string }[] = []
  for (let i = 1; i <= 12; i++) {
    const installmentValue = totalAmount / i
    installmentOptions.push({
      value: i.toString(),
      label: i === 1 
        ? `À vista - R$ ${totalAmount.toFixed(2)}`
        : `${i}x de R$ ${installmentValue.toFixed(2)} ${i <= 3 ? 'sem juros' : ''}`
    })
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Stepper */}
        <CheckoutStepper currentStep={3} />
        
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Pagamento</h1>

          {/* Métodos de Pagamento */}
          <div className="space-y-4 mb-8">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = selectedMethod === method.id
              
              return (
                <div key={method.id}>
                  <button
                    onClick={() => {
                      setSelectedMethod(method.id)
                      // Adicionar gateway ao cache imediatamente quando selecionado
                      addSelectedGatewayToCache(method.id)
                    }}
                    className={`w-full p-6 border-2 rounded-2xl transition-all text-left ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg text-gray-900">{method.name}</h3>
                            {method.popular && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{method.description}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="bg-blue-600 text-white rounded-full p-1.5">
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Formulário do Cartão - logo abaixo do botão */}
                  {isSelected && method.id === 'credit_card' && (
                    <div className="bg-gray-50/50 rounded-b-2xl border-2 border-t-0 border-blue-600 p-6 space-y-4 mt-[-8px]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-gray-900">Dados do Cartão</h3>
                        <button
                          type="button"
                          onClick={fillTestData}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-all active:scale-95 flex items-center space-x-2"
                        >
                          <span>🚀</span>
                          <span>Preencher Teste</span>
                        </button>
                      </div>
              
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          value={cardData.number}
                          onChange={(e) => handleCardChange('number', e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome no Cartão
                        </label>
                        <input
                          type="text"
                          value={cardData.name}
                          onChange={(e) => handleCardChange('name', e.target.value.toUpperCase())}
                          placeholder="NOME COMO ESTÁ NO CARTÃO"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Validade
                          </label>
                          <input
                            type="text"
                            value={cardData.expiry}
                            onChange={(e) => handleCardChange('expiry', e.target.value)}
                            placeholder="MM/AA"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <input
                            type="text"
                            value={cardData.cvv}
                            onChange={(e) => handleCardChange('cvv', e.target.value)}
                            placeholder="123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Parcelas
                        </label>
                        <select
                          value={cardData.installments}
                          onChange={(e) => setCardData({ ...cardData, installments: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {installmentOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Formulário PIX - logo abaixo do botão */}
                  {isSelected && method.id === 'pix' && (

                    <div className="bg-white rounded-b-xl border-2 border-t-0 border-primary-600 p-6 mt-[-8px]">
              <h3 className="font-bold text-lg mb-4">Pagamento via PIX</h3>
              
              <div className="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
                <div className="bg-gray-100 w-64 h-64 mx-auto rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">QR Code PIX</p>
                  </div>
                </div>
                
                <p className="text-gray-700 font-semibold mb-2">
                  R$ {totalAmount.toFixed(2)}
                </p>
                
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">Chave PIX (Copia e Cola)</p>
                  <code className="text-xs text-gray-800 break-all font-mono">
                    00020126580014br.gov.bcb.pix0136{Math.random().toString(36).substring(2, 38)}520400005303986540{totalAmount.toFixed(2)}5802BR5925LOJA TESTE6009SAO PAULO
                  </code>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText('PIX_MOCK_CODE_' + Date.now())
                    alert('Código PIX copiado!')
                  }}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Copiar Código PIX
                </button>
              </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <p className="text-sm font-semibold text-green-900 mb-2">
                          ⚡ Aprovação Instantânea
                        </p>
                        <p className="text-xs text-green-700">
                          Em ambiente de produção, o pagamento seria confirmado automaticamente após a leitura do QR Code.
                          Para testes, clique em "Continuar" para simular o pagamento aprovado.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Formulário Boleto - logo abaixo do botão */}
                  {isSelected && method.id === 'boleto' && (
                    <div className="bg-white rounded-b-xl border-2 border-t-0 border-primary-600 p-6 mt-[-8px]">
              <h3 className="font-bold text-lg mb-4">Boleto Bancário</h3>
              
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
                <div className="border-b pb-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Dados do Boleto</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Beneficiário:</span>
                      <span className="font-semibold">LOJA TESTE LTDA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-semibold">R$ {totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vencimento:</span>
                      <span className="font-semibold">
                        {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                        <div className="bg-white rounded p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">Código de Barras</p>
                  <code className="text-sm font-mono text-gray-800">
                    34191.79001 01043.510047 91020.150008 1 {(Date.now() % 100000000000000).toString().padStart(14, '0')}
                  </code>
                </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => alert('Boleto copiado! Em produção, o código seria copiado.')}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                          >
                            Copiar Código
                          </button>
                          <button
                            onClick={() => alert('Em produção, o boleto PDF seria baixado.')}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                          >
                            Baixar PDF
                          </button>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <p className="text-sm font-semibold text-yellow-900 mb-2">
                          ⏰ Vencimento em 3 dias
                        </p>
                        <p className="text-xs text-yellow-700">
                          O boleto pode ser pago em qualquer banco, casa lotérica ou via internet banking.
                          Após o pagamento, a confirmação leva até 2 dias úteis.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Botões de Navegação */}
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/checkout/envio')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-4 rounded-full transition-all active:scale-95 text-[17px]"
            >
              Voltar
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedMethod || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 text-[17px]"
            >
              {loading ? 'Processando...' : 'Continuar para Confirmação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
