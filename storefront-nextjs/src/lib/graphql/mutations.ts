import { gql } from '@apollo/client'

// Authentication Mutations
export const TOKEN_CREATE = gql`
  mutation TokenCreate($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      csrfToken
      errors {
        field
        message
        code
      }
    }
  }
`

export const TOKEN_REFRESH = gql`
  mutation TokenRefresh($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
      errors {
        field
        message
      }
    }
  }
`

export const ACCOUNT_REGISTER = gql`
  mutation AccountRegister($input: AccountRegisterInput!) {
    accountRegister(input: $input) {
      user {
        id
        email
        firstName
        lastName
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!, $redirectUrl: String!) {
    requestPasswordReset(email: $email, redirectUrl: $redirectUrl) {
      errors {
        field
        message
      }
    }
  }
`

export const PASSWORD_CHANGE = gql`
  mutation PasswordChange($oldPassword: String!, $newPassword: String!) {
    passwordChange(oldPassword: $oldPassword, newPassword: $newPassword) {
      errors {
        field
        message
      }
    }
  }
`

export const ACCOUNT_UPDATE = gql`
  mutation AccountUpdate($input: AccountInput!) {
    accountUpdate(input: $input) {
      user {
        id
        email
        firstName
        lastName
      }
      errors {
        field
        message
      }
    }
  }
`

// Checkout Mutations
export const CHECKOUT_CREATE = gql`
  mutation CheckoutCreate($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        email
        lines {
          id
          quantity
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const CHECKOUT_LINES_ADD = gql`
  mutation CheckoutLinesAdd($id: ID!, $lines: [CheckoutLineInput!]!) {
    checkoutLinesAdd(id: $id, lines: $lines) {
      checkout {
        id
        lines {
          id
          quantity
          variant {
            id
            name
          }
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const CHECKOUT_LINES_UPDATE = gql`
  mutation CheckoutLinesUpdate($id: ID!, $lines: [CheckoutLineUpdateInput!]!) {
    checkoutLinesUpdate(id: $id, lines: $lines) {
      checkout {
        id
        lines {
          id
          quantity
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const CHECKOUT_LINES_DELETE = gql`
  mutation CheckoutLinesDelete($id: ID!, $linesIds: [ID!]!) {
    checkoutLinesDelete(id: $id, linesIds: $linesIds) {
      checkout {
        id
        lines {
          id
        }
      }
      errors {
        field
        message
      }
    }
  }
`

export const CHECKOUT_EMAIL_UPDATE = gql`
  mutation CheckoutEmailUpdate($id: ID!, $email: String!) {
    checkoutEmailUpdate(id: $id, email: $email) {
      checkout {
        id
        email
      }
      errors {
        field
        message
      }
    }
  }
`

export const CHECKOUT_CUSTOMER_ATTACH = gql`
  mutation CheckoutCustomerAttach($id: ID!) {
    checkoutCustomerAttach(id: $id) {
      checkout {
        id
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
`

export const CHECKOUT_SHIPPING_ADDRESS_UPDATE = gql`
  mutation CheckoutShippingAddressUpdate($id: ID!, $shippingAddress: AddressInput!) {
    checkoutShippingAddressUpdate(id: $id, shippingAddress: $shippingAddress) {
      checkout {
        id
        shippingAddress {
          firstName
          lastName
          streetAddress1
          city
          postalCode
        }
        availableShippingMethods {
          id
          name
          price {
            amount
            currency
          }
        }
      }
      errors {
        field
        message
      }
    }
  }
`

export const CHECKOUT_BILLING_ADDRESS_UPDATE = gql`
  mutation CheckoutBillingAddressUpdate($id: ID!, $billingAddress: AddressInput!) {
    checkoutBillingAddressUpdate(id: $id, billingAddress: $billingAddress) {
      checkout {
        id
        billingAddress {
          firstName
          lastName
          streetAddress1
          city
          postalCode
        }
      }
      errors {
        field
        message
      }
    }
  }
`

export const CHECKOUT_DELIVERY_METHOD_UPDATE = gql`
  mutation CheckoutDeliveryMethodUpdate($id: ID!, $deliveryMethodId: ID!) {
    checkoutDeliveryMethodUpdate(id: $id, deliveryMethodId: $deliveryMethodId) {
      checkout {
        id
        shippingMethod {
          id
          name
        }
      }
      errors {
        field
        message
      }
    }
  }
`

export const CHECKOUT_ADD_PROMO_CODE = gql`
  mutation CheckoutAddPromoCode($id: ID!, $promoCode: String!) {
    checkoutAddPromoCode(id: $id, promoCode: $promoCode) {
      checkout {
        id
        discount {
          amount
          currency
        }
        discountName
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const CHECKOUT_REMOVE_PROMO_CODE = gql`
  mutation CheckoutRemovePromoCode($id: ID!, $promoCode: String!) {
    checkoutRemovePromoCode(id: $id, promoCode: $promoCode) {
      checkout {
        id
        discount {
          amount
          currency
        }
      }
      errors {
        field
        message
      }
    }
  }
`

export const CHECKOUT_PAYMENT_CREATE = gql`
  mutation CheckoutPaymentCreate($id: ID!, $input: PaymentInput!) {
    checkoutPaymentCreate(id: $id, input: $input) {
      payment {
        id
        gateway
        total {
          amount
          currency
        }
      }
      errors {
        field
        message
      }
    }
  }
`

export const CHECKOUT_COMPLETE = gql`
  mutation CheckoutComplete($id: ID!) {
    checkoutComplete(id: $id) {
      order {
        id
        number
      }
      errors {
        field
        message
        code
      }
    }
  }
`

// Address Mutations
export const ACCOUNT_ADDRESS_CREATE = gql`
  mutation AccountAddressCreate($input: AddressInput!) {
    accountAddressCreate(input: $input) {
      address {
        id
        firstName
        lastName
        streetAddress1
        city
        postalCode
      }
      errors {
        field
        message
      }
    }
  }
`

export const ACCOUNT_ADDRESS_UPDATE = gql`
  mutation AccountAddressUpdate($id: ID!, $input: AddressInput!) {
    accountAddressUpdate(id: $id, input: $input) {
      address {
        id
        firstName
        lastName
      }
      errors {
        field
        message
      }
    }
  }
`

export const ACCOUNT_ADDRESS_DELETE = gql`
  mutation AccountAddressDelete($id: ID!) {
    accountAddressDelete(id: $id) {
      errors {
        field
        message
      }
    }
  }
`

export const ACCOUNT_SET_DEFAULT_ADDRESS = gql`
  mutation AccountSetDefaultAddress($id: ID!, $type: AddressTypeEnum!) {
    accountSetDefaultAddress(id: $id, type: $type) {
      user {
        id
        defaultShippingAddress {
          id
        }
        defaultBillingAddress {
          id
        }
      }
      errors {
        field
        message
      }
    }
  }
`

