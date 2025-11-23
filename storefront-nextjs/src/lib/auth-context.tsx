'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { TOKEN_CREATE, ACCOUNT_REGISTER } from './graphql/mutations'
import { GET_ME } from './graphql/queries'
import { saveTokens, clearTokens, isAuthenticated, getUser, saveUser } from './auth'
import { showSuccess, showError } from './toast'
import { User } from './graphql/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuth: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)

  const [loginMutation] = useMutation(TOKEN_CREATE)
  const [registerMutation] = useMutation(ACCOUNT_REGISTER)
  
  const { refetch: refetchMe } = useQuery(GET_ME, {
    skip: true,
  })

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const savedUser = getUser()
        if (savedUser) {
          // Validar se o token ainda é válido fazendo uma query
          try {
            const { data } = await refetchMe()
            if (data?.me) {
              setUser(data.me)
              saveUser(data.me)
              setIsAuth(true)
            } else {
              // Token inválido, limpar
              console.log('[Auth] Token inválido, limpando autenticação...')
              clearTokens()
              setUser(null)
              setIsAuth(false)
            }
          } catch (error: any) {
            // Token expirado ou inválido
            console.log('[Auth] Erro ao validar token:', error?.message)
            if (
              error?.message?.includes('Signature has expired') ||
              error?.message?.includes('signature has expired') ||
              error?.message?.includes('Token has expired')
            ) {
              console.log('[Auth] Token expirado, limpando autenticação e checkout...')
              clearTokens()
              // Limpar também o checkout para evitar erros
              try {
                localStorage.removeItem('checkout-store')
              } catch (e) {
                console.error('[Auth] Erro ao limpar checkout-store:', e)
              }
            } else {
              clearTokens()
            }
            setUser(null)
            setIsAuth(false)
          }
        } else {
          // Fetch user data from API
          try {
            const { data } = await refetchMe()
            if (data?.me) {
              setUser(data.me)
              saveUser(data.me)
              setIsAuth(true)
            }
          } catch (error: any) {
            console.log('[Auth] Erro ao buscar usuário:', error?.message)
            clearTokens()
            setUser(null)
            setIsAuth(false)
          }
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [refetchMe])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data } = await loginMutation({
        variables: { email, password },
      })

      if (data?.tokenCreate?.errors?.length > 0) {
        const errorMsg = data.tokenCreate.errors[0].message
        showError(errorMsg || 'Erro ao fazer login')
        return false
      }

      if (data?.tokenCreate?.token) {
        saveTokens(data.tokenCreate.token, data.tokenCreate.refreshToken)
        
        // Fetch user data
        const { data: userData } = await refetchMe()
        if (userData?.me) {
          setUser(userData.me)
          saveUser(userData.me)
          setIsAuth(true)
          showSuccess('Login realizado com sucesso!')
          return true
        }
      }

      showError('Erro ao fazer login')
      return false
    } catch (error: any) {
      showError(error.message || 'Erro ao fazer login')
      return false
    }
  }

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<boolean> => {
    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            email,
            password,
            firstName,
            lastName,
            redirectUrl: `${window.location.origin}/conta`,
            channel: 'default-channel',
          },
        },
      })

      if (data?.accountRegister?.errors?.length > 0) {
        const errorMsg = data.accountRegister.errors[0].message
        showError(errorMsg || 'Erro ao criar conta')
        return false
      }

      if (data?.accountRegister?.user) {
        showSuccess('Conta criada com sucesso! Faça login para continuar.')
        return true
      }

      showError('Erro ao criar conta')
      return false
    } catch (error: any) {
      showError(error.message || 'Erro ao criar conta')
      return false
    }
  }

  const logout = () => {
    clearTokens()
    setUser(null)
    setIsAuth(false)
    showSuccess('Logout realizado com sucesso!')
  }

  const refreshUser = async () => {
    try {
      const { data } = await refetchMe()
      if (data?.me) {
        setUser(data.me)
        saveUser(data.me)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuth,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

