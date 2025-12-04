"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { getCountryFlag } from "@/lib/countryFlags"

interface Publisher {
  id: string
  name: string | null
  email: string
}

interface SourceFiltersProps {
  categories: string[]
  priceRange: { min: number; max: number }
  sistrixRange?: { min: number; max: number }
  publishers?: Publisher[]
  countries?: string[]
}

export default function SourceFilters({ categories, priceRange, sistrixRange, publishers = [], countries = [] }: SourceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Fallback-Werte für priceRange und sistrixRange
  const defaultPriceRange = priceRange || { min: 0, max: 1000 }
  const defaultSistrixRange = sistrixRange || { min: 0, max: 10000 }
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "")
  const [selectedPublisher, setSelectedPublisher] = useState(searchParams.get("publisher") || "")
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "")
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("maxPrice") || defaultPriceRange.max.toString()
  )
  const [minSistrix, setMinSistrix] = useState(
    searchParams.get("minSistrix") || defaultSistrixRange.min.toString()
  )

  const handleFilterChange = () => {
    const params = new URLSearchParams()
    
    if (searchTerm) params.set("search", searchTerm)
    if (selectedCategory) params.set("category", selectedCategory)
    if (selectedPublisher) params.set("publisher", selectedPublisher)
    if (selectedCountry) params.set("country", selectedCountry)
    if (maxPrice && parseFloat(maxPrice) < defaultPriceRange.max) {
      params.set("maxPrice", maxPrice)
    }
    if (minSistrix && parseFloat(minSistrix) > defaultSistrixRange.min) {
      params.set("minSistrix", minSistrix)
    }

    router.push(`/sources?${params.toString()}`)
  }

  const handleReset = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setSelectedPublisher("")
    setSelectedCountry("")
    setMaxPrice(defaultPriceRange.max.toString())
    setMinSistrix(defaultSistrixRange.min.toString())
    router.push("/sources")
  }

  useEffect(() => {
    // Debounce für Suche
    const timer = setTimeout(() => {
      handleFilterChange()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    handleFilterChange()
  }, [selectedCategory, selectedPublisher, selectedCountry, maxPrice, minSistrix])

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
        <button
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Zurücksetzen
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${sistrixRange ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
        {/* Suche */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Suche (Name/URL/Tags)
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, URL oder Tags suchen..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Kategorie Filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Kategorie
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Kategorien</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Land Filter */}
        {countries.length > 0 && (
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Land
            </label>
            <select
              id="country"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Länder</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {getCountryFlag(country)} {country}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Publisher Filter */}
        {publishers.length > 0 && (
          <div>
            <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-2">
              Publisher
            </label>
            <select
              id="publisher"
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Publisher</option>
              {publishers.map((publisher) => (
                <option key={publisher.id} value={publisher.id}>
                  {publisher.name || publisher.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Max Preis Slider */}
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
            Max Preis: {parseFloat(maxPrice).toFixed(2)} €
          </label>
          <input
            id="maxPrice"
            type="range"
            min={defaultPriceRange.min}
            max={defaultPriceRange.max}
            step="1"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Sistrix Sichtbarkeit Min Slider */}
        {sistrixRange && (
          <div>
            <label htmlFor="minSistrix" className="block text-sm font-medium text-gray-700 mb-2">
              Min Sistrix Index: {(parseFloat(minSistrix) / 10000).toFixed(4)}
            </label>
            <input
              id="minSistrix"
              type="range"
              min={defaultSistrixRange.min}
              max={defaultSistrixRange.max}
              step="100"
              value={minSistrix}
              onChange={(e) => setMinSistrix(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}

