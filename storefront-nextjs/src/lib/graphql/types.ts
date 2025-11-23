// GraphQL Types based on Saleor API

export interface Money {
  amount: number
  currency: string
}

export interface TaxedMoney {
  gross: Money
  net: Money
  tax: Money
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  quantityAvailable: number
  pricing?: {
    price?: {
      gross: Money
    }
  }
}

export interface Product {
  id: string
  name: string
  slug: string
  description: any
  category?: Category
  variants: ProductVariant[]
  thumbnail?: {
    url: string
    alt?: string
  }
  pricing?: {
    priceRange: {
      start: {
        gross: Money
      }
      stop: {
        gross: Money
      }
    }
  }
}

export interface CheckoutLine {
  id: string
  quantity: number
  totalPrice: TaxedMoney
  variant: ProductVariant
}

export interface ShippingMethod {
  id: string
  name: string
  price: Money
}

export interface PaymentGateway {
  id: string
  name: string
  config: any[]
}

export interface Address {
  id?: string
  firstName: string
  lastName: string
  streetAddress1: string
  streetAddress2?: string
  city: string
  postalCode: string
  country: {
    code: string
    country: string
  }
  phone?: string
}

export interface Checkout {
  id: string
  email?: string
  lines: CheckoutLine[]
  totalPrice: TaxedMoney
  subtotalPrice: TaxedMoney
  shippingPrice: TaxedMoney
  shippingAddress?: Address
  billingAddress?: Address
  availableShippingMethods: ShippingMethod[]
  availablePaymentGateways: PaymentGateway[]
  shippingMethod?: ShippingMethod
  discount?: Money
  discountName?: string
  user?: {
    id: string
    email: string
  }
}

export interface Order {
  id: string
  number: string
  created: string
  status: string
  total: TaxedMoney
  lines: OrderLine[]
  shippingAddress?: Address
  billingAddress?: Address
}

export interface OrderLine {
  id: string
  productName: string
  variantName: string
  quantity: number
  totalPrice: TaxedMoney
  thumbnail?: {
    url: string
  }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  addresses: Address[]
  orders: {
    edges: Array<{
      node: Order
    }>
  }
}

export interface AuthTokens {
  token: string
  refreshToken: string
  csrfToken?: string
}

