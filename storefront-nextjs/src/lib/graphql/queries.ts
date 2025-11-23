import { gql } from '@apollo/client'

// Product Queries
export const GET_PRODUCTS = gql`
  query GetProducts($first: Int!, $after: String, $filter: ProductFilterInput, $sortBy: ProductOrder, $channel: String!) {
    products(first: $first, after: $after, filter: $filter, sortBy: $sortBy, channel: $channel) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          slug
          description
          category {
            id
            name
          }
          thumbnail {
            url
            alt
          }
          variants {
            id
            quantityAvailable
            pricing {
              price {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_PRODUCT_DETAILS = gql`
  query GetProductDetails($slug: String!, $channel: String!) {
    product(slug: $slug, channel: $channel) {
      id
      name
      slug
      description
      category {
        id
        name
      }
      thumbnail {
        url
        alt
      }
      pricing {
        priceRange {
          start {
            gross {
              amount
              currency
            }
          }
          stop {
            gross {
              amount
              currency
            }
          }
        }
      }
      variants {
        id
        name
        sku
        quantityAvailable
        pricing {
          price {
            gross {
              amount
              currency
            }
          }
        }
      }
    }
  }
`

export const GET_CATEGORIES = gql`
  query GetCategories($first: Int!, $channel: String!) {
    categories(first: $first) {
      edges {
        node {
          id
          name
          slug
          products(channel: $channel) {
            totalCount
          }
        }
      }
    }
  }
`

// Checkout Queries
export const GET_CHECKOUT = gql`
  query GetCheckout($id: ID!) {
    checkout(id: $id) {
      id
      email
      lines {
        id
        quantity
        totalPrice {
          gross {
            amount
            currency
          }
        }
        variant {
          id
          name
          sku
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
      }
      totalPrice {
        gross {
          amount
          currency
        }
      }
      subtotalPrice {
        gross {
          amount
          currency
        }
      }
      shippingPrice {
        gross {
          amount
          currency
        }
      }
      shippingAddress {
        id
        firstName
        lastName
        streetAddress1
        streetAddress2
        city
        postalCode
        country {
          code
          country
        }
        phone
      }
      availableShippingMethods {
        id
        name
        price {
          amount
          currency
        }
      }
      availablePaymentGateways {
        id
        name
      }
      discount {
        amount
        currency
      }
      discountName
    }
  }
`

// User Queries
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      firstName
      lastName
      addresses {
        id
        firstName
        lastName
        streetAddress1
        streetAddress2
        city
        postalCode
        country {
          code
          country
        }
        phone
      }
    }
  }
`

export const GET_MY_ORDERS = gql`
  query GetMyOrders($first: Int!, $after: String) {
    me {
      id
      orders(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            number
            created
            status
            total {
              gross {
                amount
                currency
              }
            }
          }
        }
      }
    }
  }
`

export const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($id: ID!) {
    order(id: $id) {
      id
      number
      created
      status
      total {
        gross {
          amount
          currency
        }
      }
      subtotal {
        gross {
          amount
          currency
        }
      }
      shippingPrice {
        gross {
          amount
          currency
        }
      }
      lines {
        id
        productName
        variantName
        quantity
        totalPrice {
          gross {
            amount
            currency
          }
        }
        thumbnail {
          url
        }
        variant {
          id
          product {
            id
            slug
          }
        }
      }
      shippingAddress {
        firstName
        lastName
        streetAddress1
        streetAddress2
        city
        postalCode
        country {
          code
          country
        }
        phone
      }
    }
  }
`

