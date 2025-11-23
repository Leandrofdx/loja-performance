'use client'

import { ApolloProvider } from '@apollo/client'
import createApolloClient from './apollo-client'
import { useMemo } from 'react'

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => createApolloClient(), [])
  
  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

