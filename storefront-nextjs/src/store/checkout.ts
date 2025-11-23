import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CheckoutState {
  checkoutId: string | null
  setCheckoutId: (id: string | null) => void
  clearCheckout: () => void
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      checkoutId: null,
      
      setCheckoutId: (id) => set({ checkoutId: id }),
      
      clearCheckout: () => set({ checkoutId: null }),
    }),
    {
      name: 'checkout-storage',
    }
  )
)

