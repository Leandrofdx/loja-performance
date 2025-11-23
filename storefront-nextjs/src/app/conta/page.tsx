'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { User, Package, LogOut, ChevronRight, Edit2, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ACCOUNT_UPDATE } from '@/lib/graphql/mutations'
import { showSuccess, showError } from '@/lib/toast'

export default function ContaPage() {
  const { user, isAuth, loading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  })
  const [updateAccount, { loading: updateLoading }] = useMutation(ACCOUNT_UPDATE)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuth) {
    router.push('/login?redirect=/conta')
    return null
  }

  const handleEditToggle = () => {
    if (!isEditing) {
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSave = async () => {
    try {
      const { data } = await updateAccount({
        variables: {
          input: {
            firstName: formData.firstName,
            lastName: formData.lastName,
          },
        },
      })

      if (data?.accountUpdate?.errors?.length > 0) {
        const error = data.accountUpdate.errors[0]
        throw new Error(error.message)
      }

      showSuccess('Dados atualizados com sucesso!')
      await refreshUser()
      setIsEditing(false)
    } catch (error: any) {
      showError(error.message || 'Erro ao atualizar dados')
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
            Minha Conta
          </h1>
          <p className="text-lg text-gray-500">
            Gerencie suas informações e pedidos
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Personal Info */}
          <div className="p-8 bg-gray-50 rounded-3xl relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <User className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Informações</h2>
              </div>
              {!isEditing && (
                <button
                  onClick={handleEditToggle}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  title="Editar informações"
                >
                  <Edit2 className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={updateLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Check className="w-5 h-5" strokeWidth={2} />
                    <span>{updateLoading ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={updateLoading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-full font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-gray-700">
                <p className="text-[17px]">
                  <span className="text-gray-500">Nome:</span> <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                </p>
                <p className="text-[17px]">
                  <span className="text-gray-500">Email:</span> <span className="font-medium">{user?.email}</span>
                </p>
              </div>
            )}
          </div>

          {/* Orders Link */}
          <Link
            href="/conta/pedidos"
            className="p-8 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-green-600" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Meus Pedidos</h2>
            </div>
            <p className="text-gray-600 text-[17px] mb-4">
              Visualize seu histórico de compras
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              <span>Ver pedidos</span>
              <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            logout()
            router.push('/')
          }}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium px-6 py-3 rounded-full hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  )
}
