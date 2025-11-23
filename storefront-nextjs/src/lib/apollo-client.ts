import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { getToken, clearTokens } from './auth'

const createApolloClient = () => {
  // Detect if running on server or client
  const isServer = typeof window === 'undefined'
  
  // Use different URLs for server vs client
  const apiUrl = isServer
    ? 'http://saleor_api:8000/graphql/'  // Server: use Docker service name (porta interna)
    : (process.env.NEXT_PUBLIC_SALEOR_API_URL || 'http://localhost:8002/graphql/')  // Client: use localhost (porta externa)
  
  console.log(`[Apollo Client] Running on ${isServer ? 'server' : 'client'}, API URL: ${apiUrl}`)
  
  const httpLink = new HttpLink({
    uri: apiUrl,
  })

  // Auth link to add JWT token to headers
  const authLink = setContext((_, { headers }) => {
    // Only on client side
    if (isServer) {
      return { headers }
    }

    const token = getToken()
    
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    }
  })

  // Error link to handle auth errors
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )

        // Handle JWT expired or authentication errors
        if (
          message.includes('Signature has expired') ||
          message.includes('signature has expired') ||
          message.includes('Token has expired') ||
          extensions?.code === 'UNAUTHENTICATED' ||
          extensions?.code === 'PERMISSION_DENIED'
        ) {
          if (!isServer) {
            console.log('[Apollo] Token expirado ou inválido, limpando autenticação...')
            clearTokens()
            
            // Limpar também o localStorage do checkout para evitar erros
            try {
              localStorage.removeItem('checkout-store')
            } catch (e) {
              console.error('[Apollo] Erro ao limpar checkout-store:', e)
            }
            
            // Só redireciona para login se estiver em páginas protegidas
            const protectedPaths = ['/conta', '/checkout']
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
            const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path))
            
            if (isProtectedPath && currentPath !== '/login') {
              console.log('[Apollo] Redirecionando para login...')
              window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
            } else {
              // Para páginas públicas, apenas recarrega a página para limpar o estado
              console.log('[Apollo] Recarregando página para limpar estado...')
              window.location.reload()
            }
          }
        }
      })
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`)
    }
  })
  
  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            products: {
              keyArgs: ['filter', 'sortBy', 'channel'],
              merge(existing, incoming, { args }) {
                if (!args?.after) {
                  // First page, replace cache
                  return incoming
                }
                // Append to existing (pagination)
                return {
                  ...incoming,
                  edges: [...(existing?.edges || []), ...(incoming?.edges || [])],
                }
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
    // Important: Different caches for server vs client to avoid hydration issues
    ssrMode: isServer,
  })
}

export default createApolloClient

