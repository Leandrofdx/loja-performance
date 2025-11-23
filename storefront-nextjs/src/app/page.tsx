'use client'

import { useQuery, gql } from '@apollo/client'
import { ProductGrid } from '@/components/ProductGrid'
import { CategoryFilter } from '@/components/CategoryFilter'
import { SearchBar } from '@/components/SearchBar'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowDown } from 'lucide-react'

import { GET_PRODUCTS, GET_CATEGORIES } from '@/lib/graphql/queries'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24

  const { data: categoriesData } = useQuery(GET_CATEGORIES, {
    variables: { first: 20, channel: 'default-channel' },
  })
  
  const categories = categoriesData?.categories?.edges?.map((edge: any) => edge.node) || []
  
  // Ler categoria da URL na inicialização
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl) {
      setSelectedCategory(decodeURIComponent(categoryFromUrl))
    }
  }, [searchParams])
  
  // Função para atualizar categoria e URL
  const handleSelectCategory = (category: string | null) => {
    setSelectedCategory(category)
    if (category) {
      router.push(`/?category=${encodeURIComponent(category)}`)
    } else {
      router.push('/')
    }
  }
  
  const filter: any = {}
  if (searchQuery) filter.search = searchQuery
  if (selectedCategory) {
    const category = categories.find((c: any) => c.name === selectedCategory)
    if (category) filter.categories = [category.id]
  }
  
  const { data, loading, error, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: {
      first: itemsPerPage,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      channel: 'default-channel',
    },
  })

  const products = data?.products?.edges?.map((edge: any) => edge.node) || []
  const hasNextPage = data?.products?.pageInfo?.hasNextPage
  const endCursor = data?.products?.pageInfo?.endCursor

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchMore({
        variables: {
          after: endCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev
          return {
            products: {
              ...fetchMoreResult.products,
              edges: [...prev.products.edges, ...fetchMoreResult.products.edges],
            },
          }
        },
      })
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Apple Style */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.03),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.03),transparent_50%)]"></div>
        
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Main Heading - Apple Typography */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-gray-900">
              Store.
            </h1>
            
            {/* Subheading */}
            <p className="text-2xl md:text-3xl font-medium text-gray-600 tracking-tight">
              O extraordinário em cada produto.
            </p>

            {/* Description */}
            <p className="text-lg text-gray-500 max-w-2xl mx-auto pt-4">
              Descubra uma seleção cuidadosa de produtos premium em 8 categorias.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-16">
        {/* Search Bar - Minimal */}
        <div className="mb-12">
          <SearchBar onSearch={setSearchQuery} />
        </div>

        {/* Categories Filter - Apple Style Pills */}
        <div className="mb-16">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Results count - Subtle */}
        {products.length > 0 && (
          <div className="mb-12 text-center">
            <p className="text-sm text-gray-500">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'}
              {selectedCategory && (
                <span className="ml-2">
                  em <span className="font-medium text-gray-700">{selectedCategory}</span>
                </span>
              )}
            </p>
          </div>
        )}

        {/* Product Grid - Spacious Apple Layout */}
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Carregando produtos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <p className="text-red-500 text-lg mb-2">Erro ao carregar produtos</p>
            <p className="text-gray-500">{error.message}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-2xl font-medium text-gray-900 mb-2">Nenhum produto encontrado</p>
            <p className="text-gray-500 mb-8">
              {searchQuery 
                ? `Tente buscar por outro termo` 
                : 'Experimente selecionar outra categoria'
              }
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  handleSelectCategory(null)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium transition-all active:scale-95"
              >
                Ver todos os produtos
              </button>
            )}
          </div>
        ) : (
          <>
            <ProductGrid products={products} />
            
            {/* Load More - Apple Style */}
            {hasNextPage && (
              <div className="text-center mt-16">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <>
                      <span>Ver mais produtos</span>
                      <ArrowDown className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
