'use client'

import Link from 'next/link'
import { ShoppingCart, User, LogOut, Package } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useCartStore } from '@/store/cart'
import { useCheckoutApiStore } from '@/store/checkout-api'
import { useState, useEffect, useRef } from 'react'

export function Header() {
  const { user, isAuth, logout, loading } = useAuth()
  const { toggleCart } = useCartStore()
  const { checkout } = useCheckoutApiStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const totalItems = checkout?.lines?.reduce((sum, line) => sum + line.quantity, 0) || 0

  // Detect scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-sm' 
          : 'bg-white/95 backdrop-blur-md'
      }`}
      style={{
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent'
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[52px]">
          {/* Logo - Apple style minimalist */}
          <Link href="/" className="flex items-center group">
            <span className="text-2xl font-semibold text-gray-900 tracking-tight group-hover:text-gray-600 transition-colors">
              Store
            </span>
          </Link>

          {/* Navigation - Apple style spacing */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-[14px] text-gray-800 hover:text-gray-600 transition-colors font-normal"
            >
              Produtos
            </Link>
            {isAuth && (
              <Link 
                href="/conta/pedidos" 
                className="text-[14px] text-gray-800 hover:text-gray-600 transition-colors font-normal"
              >
                Pedidos
              </Link>
            )}
          </nav>

          {/* Right side - Ultra minimal */}
          <div className="flex items-center space-x-6">
            {/* User Menu */}
            {!loading && (
              <div className="relative" ref={menuRef}>
                {isAuth ? (
                  <>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-1.5 text-gray-800 hover:text-gray-600 transition-colors group"
                    >
                      <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
                      <span className="hidden lg:block text-[14px] font-normal">
                        {user?.firstName || user?.email?.split('@')[0]}
                      </span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden">
                        <Link
                          href="/conta"
                          className="block px-5 py-3 text-[14px] text-gray-800 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" strokeWidth={1.5} />
                          <span>Minha Conta</span>
                        </Link>
                        <Link
                          href="/conta/pedidos"
                          className="block px-5 py-3 text-[14px] text-gray-800 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Package className="w-4 h-4" strokeWidth={1.5} />
                          <span>Meus Pedidos</span>
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            logout()
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-5 py-3 text-[14px] text-red-600 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                        >
                          <LogOut className="w-4 h-4" strokeWidth={1.5} />
                          <span>Sair</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="text-[14px] text-gray-800 hover:text-gray-600 transition-colors font-normal"
                  >
                    Login
                  </Link>
                )}
              </div>
            )}

            {/* Cart Button - Apple minimal style */}
            <button
              onClick={toggleCart}
              className="relative text-gray-800 hover:text-gray-600 transition-colors group"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
