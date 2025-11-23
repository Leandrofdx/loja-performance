'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuth } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  if (isAuth) {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect') || '/conta'
    router.push(redirect)
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const success = await login(email, password)
    
    if (success) {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect') || '/conta'
      router.push(redirect)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-32 pb-20 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
            Login
          </h1>
          <p className="text-lg text-gray-500">
            Entre com sua conta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 text-[17px] border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 text-[17px] border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
            </label>
            <Link 
              href="/recuperar-senha" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-8"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Não tem uma conta?{' '}
            <Link 
              href="/register" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Criar conta
            </Link>
          </p>
        </div>

        {/* Test credentials */}
        <div className="mt-12 p-5 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Credenciais de teste:
          </p>
          <p className="text-xs text-gray-600">
            Email: <code className="bg-white px-2 py-1 rounded">admin@example.com</code>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Senha: <code className="bg-white px-2 py-1 rounded">admin</code>
          </p>
        </div>
      </div>
    </div>
  )
}
