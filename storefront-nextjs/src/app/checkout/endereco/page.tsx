'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CHECKOUT_SHIPPING_ADDRESS_UPDATE, CHECKOUT_BILLING_ADDRESS_UPDATE, CHECKOUT_EMAIL_UPDATE, CHECKOUT_CUSTOMER_ATTACH } from '@/lib/graphql/mutations'
import { useCheckoutApiStore } from '@/store/checkout-api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toast'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { CheckoutStepper } from '@/components/CheckoutStepper'

export default function CheckoutEndereco() {
  const router = useRouter()
  const { checkout, hydrated } = useCheckoutApiStore()
  const { user, isAuth, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)

  // Redirecionar para login se não estiver autenticado
  if (!authLoading && !isAuth) {
    router.push('/login?redirect=/checkout/endereco')
    return null
  }
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    cityArea: '',
    countryArea: '',
    postalCode: '',
    phone: '',
  })

  const [updateAddress] = useMutation(CHECKOUT_SHIPPING_ADDRESS_UPDATE)
  const [updateBillingAddress] = useMutation(CHECKOUT_BILLING_ADDRESS_UPDATE)
  const [updateEmail] = useMutation(CHECKOUT_EMAIL_UPDATE)
  const [attachCustomer] = useMutation(CHECKOUT_CUSTOMER_ATTACH)

  // Aguardar autenticação e hidratação do checkout
  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!checkout || !checkout.lines || checkout.lines.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carrinho vazio</h1>
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            Voltar para loja
          </Link>
        </div>
      </div>
    )
  }

  const handleFillTestData = () => {
    setFormData({
      firstName: 'Teste',
      lastName: 'Silva',
      streetAddress1: 'Rua Teste, 123',
      streetAddress2: 'Apto 45',
      city: 'São Paulo',
      cityArea: '',
      countryArea: 'SP',
      postalCode: '01234-567',
      phone: '+5511999999999',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Auto-preencher campos vazios com dados de teste
    const addressData = {
      firstName: formData.firstName || 'Teste',
      lastName: formData.lastName || 'Silva',
      streetAddress1: formData.streetAddress1 || 'Rua Teste, 123',
      streetAddress2: formData.streetAddress2,
      city: formData.city || 'São Paulo',
      cityArea: formData.cityArea,
      countryArea: formData.countryArea || 'SP',
      postalCode: formData.postalCode || '01234-567',
      phone: formData.phone || '+5511999999999',
      country: 'BR',
    }

    try {
      // 1. Vincular usuário ao checkout (apenas se ainda não estiver vinculado)
      if (!checkout.user) {
        const { data: attachData } = await attachCustomer({
          variables: { id: checkout.id },
        })

        if (attachData?.checkoutCustomerAttach?.errors?.length > 0) {
          const error = attachData.checkoutCustomerAttach.errors[0]
          console.error('Erro ao vincular usuário:', error)
          throw new Error(`Erro ao vincular usuário: ${error.message}`)
        }

        console.log('Usuário vinculado ao checkout:', user?.email)
      } else {
        console.log('Checkout já vinculado ao usuário:', checkout.user.email)
      }

      // 2. Definir email do checkout
      const email = user?.email || ''
      const { data: emailData } = await updateEmail({
        variables: {
          id: checkout.id,
          email: email,
        },
      })

      if (emailData?.checkoutEmailUpdate?.errors?.length > 0) {
        const error = emailData.checkoutEmailUpdate.errors[0]
        console.error('Erro ao definir email:', error)
        throw new Error(`${error.field}: ${error.message}`)
      }

      // 3. Atualizar endereço
      const { data: updateData } = await updateAddress({
        variables: {
          id: checkout.id,
          shippingAddress: addressData,
        },
      })

      if (updateData?.checkoutShippingAddressUpdate?.errors?.length > 0) {
        const error = updateData.checkoutShippingAddressUpdate.errors[0]
        console.error('Erro de validação:', error)
        throw new Error(`${error.field}: ${error.message}`)
      }

      // 4. Atualizar endereço de cobrança (mesmo que o de entrega)
      const { data: billingData } = await updateBillingAddress({
        variables: {
          id: checkout.id,
          billingAddress: addressData,
        },
      })

      if (billingData?.checkoutBillingAddressUpdate?.errors?.length > 0) {
        const error = billingData.checkoutBillingAddressUpdate.errors[0]
        console.error('Erro ao definir endereço de cobrança:', error)
        throw new Error(`${error.field}: ${error.message}`)
      }

      showSuccess('Endereço salvo com sucesso!')
      router.push('/checkout/envio')
    } catch (error: any) {
      showError(error.message || 'Erro ao salvar endereço')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Stepper */}
        <CheckoutStepper currentStep={1} />
        
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Endereço de Entrega</h1>
            </div>
            <button
              type="button"
              onClick={handleFillTestData}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              🚀 Preencher Teste
            </button>
          </div>
          
          {/* Resumo do Carrinho */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Resumo do Pedido</h3>
            <div className="space-y-2">
              {checkout.lines.map((line) => (
                <div key={line.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {line.quantity}x {line.variant.product.name}
                  </span>
                  <span className="font-medium">
                    R$ {(line.totalPrice?.gross.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-primary-600">
                  R$ {(checkout.totalPrice?.gross.amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sobrenome
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                name="streetAddress1"
                value={formData.streetAddress1}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Rua, número"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                name="streetAddress2"
                value={formData.streetAddress2}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Apartamento, bloco, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  name="countryArea"
                  value={formData.countryArea}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="SP"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Salvando...' : 'Continuar para Envio'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


