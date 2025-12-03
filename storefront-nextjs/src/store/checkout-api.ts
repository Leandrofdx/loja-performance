import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CheckoutLine {
  id: string
  quantity: number
  variant: {
    id: string
    name: string
    product: {
      name: string
      thumbnail?: {
        url: string
      }
    }
    pricing?: {
      price?: {
        gross: {
          amount: number
          currency: string
        }
      }
    }
  }
  totalPrice?: {
    gross: {
      amount: number
      currency: string
    }
  }
}

export interface PaymentMethodData {
  method: 'credit_card' | 'pix' | 'boleto'
  cardData?: {
    lastFourDigits: string
    cardholderName: string
    installments: string
  }
}

export interface Checkout {
  id: string
  token: string
  lines: CheckoutLine[]
  totalPrice?: {
    gross: {
      amount: number
      currency: string
    }
  }
  user?: {
    id: string
    email: string
  }
}

export interface PaymentMethodData {
  method: 'credit_card' | 'pix' | 'boleto'
  cardLastDigits?: string
  cardName?: string
  installments?: string
}

interface CheckoutApiState {
  checkout: Checkout | null
  loading: boolean
  error: Error | null
  hydrated: boolean
  selectedPaymentMethod: PaymentMethodData | null
  
  // Actions
  createCheckout: () => Promise<void>
  fetchCheckout: () => Promise<void>
  addItem: (variantId: string, quantity: number) => Promise<void>
  updateItemQuantity: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  clearCheckout: () => void
  setHydrated: (hydrated: boolean) => void
  setPaymentMethod: (paymentData: PaymentMethodData) => void
  getPaymentMethod: () => PaymentMethodData | null
}

const GRAPHQL_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL || 'http://localhost:8002/graphql/'

async function graphqlRequest(query: string, variables?: any) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  
  const json = await response.json()
  
  if (json.errors) {
    console.error('GraphQL Errors:', json.errors)
    throw new Error(json.errors[0]?.message || 'GraphQL Error')
  }
  
  return json.data
}

export const useCheckoutApiStore = create<CheckoutApiState>()(
  persist(
    (set, get) => ({
      checkout: null,
      loading: false,
      error: null,
      hydrated: false,
      selectedPaymentMethod: null,
      
      createCheckout: async () => {
        try {
          set({ loading: true, error: null })
          
          const data = await graphqlRequest(`
            mutation {
              checkoutCreate(input: { channel: "default-channel", lines: [], languageCode: PT_BR }) {
                checkout {
                  id
                  token
                  lines {
                    id
                    quantity
                    variant {
                      id
                      name
                      product {
                        name
                        thumbnail {
                          url
                        }
                      }
                      pricing {
                        price {
                          gross {
                            amount
                            currency
                          }
                        }
                      }
                    }
                    totalPrice {
                      gross {
                        amount
                        currency
                      }
                    }
                  }
                  totalPrice {
                    gross {
                      amount
                      currency
                    }
                  }
                  user {
                    id
                    email
                  }
                }
                errors {
                  field
                  message
                }
              }
            }
          `)
          
          if (data.checkoutCreate.errors.length > 0) {
            throw new Error(data.checkoutCreate.errors[0].message)
          }
          
          set({ checkout: data.checkoutCreate.checkout, loading: false })
        } catch (error) {
          console.error('Error creating checkout:', error)
          set({ error: error as Error, loading: false })
        }
      },
      
      fetchCheckout: async () => {
        const { checkout } = get()
        if (!checkout?.token) return
        
        try {
          set({ loading: true, error: null })
          
          const data = await graphqlRequest(`
            query GetCheckout($token: UUID!) {
              checkout(token: $token) {
                id
                token
                lines {
                  id
                  quantity
                  variant {
                    id
                    name
                    product {
                      name
                      thumbnail {
                        url
                      }
                    }
                    pricing {
                      price {
                        gross {
                          amount
                          currency
                        }
                      }
                    }
                  }
                  totalPrice {
                    gross {
                      amount
                      currency
                    }
                  }
                  user {
                    id
                    email
                  }
                }
                totalPrice {
                  gross {
                    amount
                    currency
                  }
                }
              }
            }
          `, { token: checkout.token })
          
          set({ checkout: data.checkout, loading: false })
        } catch (error) {
          console.error('Error fetching checkout:', error)
          set({ error: error as Error, loading: false })
        }
      },
      
      addItem: async (variantId: string, quantity: number) => {
        console.log('[Checkout API] addItem called:', { variantId, quantity })
        let { checkout } = get()
        
        // Create checkout if it doesn't exist
        if (!checkout) {
          console.log('[Checkout API] No checkout, creating...')
          await get().createCheckout()
          checkout = get().checkout
          if (!checkout) throw new Error('Failed to create checkout')
          console.log('[Checkout API] Checkout created:', checkout.id)
        }
        
        try {
          set({ loading: true, error: null })
          console.log('[Checkout API] Adding item to checkout:', checkout.id)
          
          const data = await graphqlRequest(`
            mutation AddToCheckout($id: ID!, $lines: [CheckoutLineInput!]!) {
              checkoutLinesAdd(id: $id, lines: $lines) {
                checkout {
                  id
                  token
                  lines {
                    id
                    quantity
                    variant {
                      id
                      name
                      product {
                        name
                        thumbnail {
                          url
                        }
                      }
                      pricing {
                        price {
                          gross {
                            amount
                            currency
                          }
                        }
                      }
                    }
                    totalPrice {
                      gross {
                        amount
                        currency
                      }
                    }
                  }
                  totalPrice {
                    gross {
                      amount
                      currency
                    }
                  }
                  user {
                    id
                    email
                  }
                }
                errors {
                  field
                  message
                }
              }
            }
          `, {
            id: checkout.id,
            lines: [{ variantId, quantity }]
          })
          
          if (data.checkoutLinesAdd.errors.length > 0) {
            const error = data.checkoutLinesAdd.errors[0]
            console.error('[Checkout API] GraphQL errors:', data.checkoutLinesAdd.errors)
            
            // Detectar checkout inválido (deletado do banco)
            if (error.message && error.message.includes("Couldn't resolve to a node")) {
              console.warn('[Checkout API] Checkout inválido detectado, criando novo automaticamente...')
              
              // Limpar checkout inválido
              set({ checkout: null, loading: true })
              
              // Criar novo checkout
              await get().createCheckout()
              const newCheckout = get().checkout
              
              if (!newCheckout) {
                set({ loading: false })
                throw new Error('Failed to create new checkout after invalid checkout detected')
              }
              
              console.log('[Checkout API] Novo checkout criado:', newCheckout.id)
              console.log('[Checkout API] Tentando adicionar item novamente...')
              
              // Tentar adicionar item novamente com novo checkout
              const retryData = await graphqlRequest(`
                mutation AddToCheckout($id: ID!, $lines: [CheckoutLineInput!]!) {
                  checkoutLinesAdd(id: $id, lines: $lines) {
                    checkout {
                      id
                      token
                      lines {
                        id
                        quantity
                        variant {
                          id
                          name
                          product {
                            name
                            thumbnail {
                              url
                            }
                          }
                          pricing {
                            price {
                              gross {
                                amount
                                currency
                              }
                            }
                          }
                        }
                        totalPrice {
                          gross {
                            amount
                            currency
                          }
                        }
                      }
                      totalPrice {
                        gross {
                          amount
                          currency
                        }
                      }
                      user {
                        id
                        email
                      }
                    }
                    errors {
                      field
                      message
                    }
                  }
                }
              `, {
                id: newCheckout.id,
                lines: [{ variantId, quantity }]
              })
              
              if (retryData.checkoutLinesAdd.errors.length > 0) {
                console.error('[Checkout API] Erro ao adicionar item no novo checkout:', retryData.checkoutLinesAdd.errors)
                set({ loading: false })
                throw new Error(retryData.checkoutLinesAdd.errors[0].message)
              }
              
              console.log('[Checkout API] Item adicionado com sucesso ao novo checkout!')
              set({ checkout: retryData.checkoutLinesAdd.checkout, loading: false })
              return
            }
            
            throw new Error(error.message)
          }
          
          console.log('[Checkout API] Item added successfully, checkout:', data.checkoutLinesAdd.checkout)
          set({ checkout: data.checkoutLinesAdd.checkout, loading: false })
          console.log('[Checkout API] State updated, loading set to false')
        } catch (error) {
          console.error('[Checkout API] Error adding item:', error)
          set({ error: error as Error, loading: false })
          throw error
        }
      },
      
      updateItemQuantity: async (lineId: string, quantity: number) => {
        const { checkout } = get()
        if (!checkout) return
        
        try {
          set({ loading: true, error: null })
          
          const data = await graphqlRequest(`
            mutation UpdateCheckoutLine($id: ID!, $lines: [CheckoutLineUpdateInput!]!) {
              checkoutLinesUpdate(id: $id, lines: $lines) {
                checkout {
                  id
                  token
                  lines {
                    id
                    quantity
                    variant {
                      id
                      name
                      product {
                        name
                        thumbnail {
                          url
                        }
                      }
                      pricing {
                        price {
                          gross {
                            amount
                            currency
                          }
                        }
                      }
                    }
                    totalPrice {
                      gross {
                        amount
                        currency
                      }
                    }
                  }
                  totalPrice {
                    gross {
                      amount
                      currency
                    }
                  }
                  user {
                    id
                    email
                  }
                }
                errors {
                  field
                  message
                }
              }
            }
          `, {
            id: checkout.id,
            lines: [{ lineId, quantity }]
          })
          
          if (data.checkoutLinesUpdate.errors.length > 0) {
            throw new Error(data.checkoutLinesUpdate.errors[0].message)
          }
          
          set({ checkout: data.checkoutLinesUpdate.checkout, loading: false })
        } catch (error) {
          console.error('Error updating item:', error)
          set({ error: error as Error, loading: false })
        }
      },
      
      removeItem: async (lineId: string) => {
        const { checkout } = get()
        if (!checkout) return
        
        try {
          set({ loading: true, error: null })
          
          const data = await graphqlRequest(`
            mutation RemoveFromCheckout($id: ID!, $lineIds: [ID!]!) {
              checkoutLinesDelete(id: $id, linesIds: $lineIds) {
                checkout {
                  id
                  token
                  lines {
                    id
                    quantity
                    variant {
                      id
                      name
                      product {
                        name
                        thumbnail {
                          url
                        }
                      }
                      pricing {
                        price {
                          gross {
                            amount
                            currency
                          }
                        }
                      }
                    }
                    totalPrice {
                      gross {
                        amount
                        currency
                      }
                    }
                  }
                  totalPrice {
                    gross {
                      amount
                      currency
                    }
                  }
                  user {
                    id
                    email
                  }
                }
                errors {
                  field
                  message
                }
              }
            }
          `, {
            id: checkout.id,
            lineIds: [lineId]
          })
          
          if (data.checkoutLinesDelete.errors.length > 0) {
            throw new Error(data.checkoutLinesDelete.errors[0].message)
          }
          
          set({ checkout: data.checkoutLinesDelete.checkout, loading: false })
        } catch (error) {
          console.error('Error removing item:', error)
          set({ error: error as Error, loading: false })
        }
      },
      
      clearCheckout: () => {
        set({ checkout: null, loading: false, error: null, selectedPaymentMethod: null })
      },
      
      setHydrated: (hydrated: boolean) => {
        set({ hydrated })
      },
      
      setPaymentMethod: (paymentData: PaymentMethodData) => {
        set({ selectedPaymentMethod: paymentData })
      },
      
      getPaymentMethod: () => {
        return get().selectedPaymentMethod
      },
    }),
    {
      name: 'checkout-api-storage',
      version: 2,
      partialize: (state) => ({ 
        checkout: state.checkout,
        selectedPaymentMethod: state.selectedPaymentMethod 
      }),
      migrate: (persistedState: any, version: number) => {
        // Se versão antiga (0 ou 1), adicionar selectedPaymentMethod
        if (version === 0) {
          console.log('[Checkout API] Migrando de versão 0, limpando checkout...')
          return { ...persistedState, checkout: null, selectedPaymentMethod: null }
        }
        if (version === 1) {
          console.log('[Checkout API] Migrando de versão 1, adicionando selectedPaymentMethod...')
          return { ...persistedState, selectedPaymentMethod: null }
        }
        return persistedState
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Validar e limpar checkout corrompido
          if (state.checkout && (!state.checkout.id || !state.checkout.token)) {
            console.log('[Checkout API] Checkout corrompido detectado, limpando...')
            state.checkout = null
          }
          // Marcar como hidratado
          state.setHydrated(true)
        }
      },
    }
  )
)

