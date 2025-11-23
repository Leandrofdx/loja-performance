'use client'

import { useEffect, useState } from 'react'

export default function TokenExpiredHandler() {
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    // Interceptar erros de token expirado
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token-cleared' && e.newValue === 'true') {
        setIsClearing(true)
        setTimeout(() => {
          setIsClearing(false)
          localStorage.removeItem('token-cleared')
        }, 2000)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (!isClearing) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4 text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            <svg
              className="w-8 h-8 text-blue-600 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Atualizando sessão
        </h3>
        <p className="text-gray-600">
          Detectamos dados expirados e estamos limpando automaticamente...
        </p>
      </div>
    </div>
  )
}

