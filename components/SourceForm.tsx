"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCountryFromUrl, getCountryFlag } from "@/lib/countryFlags"

// Verfügbare Länder für das Dropdown
const AVAILABLE_COUNTRIES = [
  "Deutschland",
  "England",
  "Frankreich",
  "Italien",
  "Niederlande",
  "Österreich",
  "Polen",
  "Schweiz",
  "Spanien",
].sort()

interface Publisher {
  id: string
  name: string | null
  email: string
}

interface Source {
  id: string
  name: string
  url: string
  publisherId: string
  price: number
  category: string
  type: string
  da: number | null
  dr: number | null
  availability: string
  description: string | null
  tags?: string[]
  country?: string | null
}

interface SourceFormProps {
  publishers: Publisher[]
  userId: string
  source?: Source
  categories?: string[]
  isPublisher?: boolean
}

export default function SourceForm({ publishers, userId, source, categories = [], isPublisher = false }: SourceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: source?.name || "",
    url: source?.url || "",
    publisherId: source?.publisherId || (isPublisher ? userId : publishers[0]?.id || ""),
    price: source?.price.toString() || "",
    category: source?.category || "",
    type: source?.type || "",
    da: source?.da?.toString() || "",
    dr: source?.dr?.toString() || "",
    availability: source?.availability || "Verfügbar",
    description: source?.description || "",
    tags: source?.tags || [],
    country: source?.country || "",
  })
  const [newTag, setNewTag] = useState("")

  const addTags = (tagInput: string) => {
    // Teile die Eingabe an Kommas auf und verarbeite jeden Tag
    const tagsToAdd = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .filter((tag) => !formData.tags.includes(tag)) // Entferne Duplikate

    if (tagsToAdd.length > 0) {
      setFormData({
        ...formData,
        tags: [...formData.tags, ...tagsToAdd],
      })
      setNewTag("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const url = source ? `/api/sources/${source.id}` : "/api/sources"
      const method = source ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          da: formData.da ? parseInt(formData.da) : null,
          dr: formData.dr ? parseInt(formData.dr) : null,
          tags: formData.tags,
          country: formData.country || null,
          createdBy: userId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      router.push("/sources")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            URL *
          </label>
          <input
            type="url"
            id="url"
            required
            value={formData.url}
            onChange={(e) => {
              const newUrl = e.target.value
              
              // Automatische Zuordnung des Landes basierend auf der URL, falls Land noch nicht gesetzt
              if (newUrl && !formData.country) {
                const autoCountry = getCountryFromUrl(newUrl)
                if (autoCountry) {
                  setFormData({ ...formData, url: newUrl, country: autoCountry })
                } else {
                  setFormData({ ...formData, url: newUrl })
                }
              } else {
                setFormData({ ...formData, url: newUrl })
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!isPublisher && (
          <div>
            <label htmlFor="publisherId" className="block text-sm font-medium text-gray-700 mb-2">
              Publisher *
            </label>
            <select
              id="publisherId"
              required
              value={formData.publisherId}
              onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen</option>
              {publishers.map((publisher) => (
                <option key={publisher.id} value={publisher.id}>
                  {publisher.name || publisher.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Preis (€) *
          </label>
          <input
            type="number"
            id="price"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Kategorie *
          </label>
          {categories.length > 0 ? (
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Kategorie eingeben"
            />
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Typ *
          </label>
          <input
            type="text"
            id="type"
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Land
          </label>
          <select
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Kein Land</option>
            {AVAILABLE_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {getCountryFlag(country)} {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="da" className="block text-sm font-medium text-gray-700 mb-2">
            Domain Authority (DA)
          </label>
          <input
            type="number"
            id="da"
            value={formData.da}
            onChange={(e) => setFormData({ ...formData, da: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="dr" className="block text-sm font-medium text-gray-700 mb-2">
            Domain Rating (DR)
          </label>
          <input
            type="number"
            id="dr"
            value={formData.dr}
            onChange={(e) => setFormData({ ...formData, dr: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
            Verfügbarkeit *
          </label>
          <select
            id="availability"
            required
            value={formData.availability}
            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Verfügbar">Verfügbar</option>
            <option value="Ausgebucht">Ausgebucht</option>
            <option value="Pausiert">Pausiert</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Beschreibung
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="space-y-3">
            {/* Tag-Eingabefeld */}
            <div className="flex gap-2">
              <input
                type="text"
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTags(newTag)
                  }
                }}
                placeholder="Tags kommagetrennt eingeben (z.B. Tag1, Tag2, Tag3) und Enter drücken"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => addTags(newTag)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Hinzufügen
              </button>
            </div>

            {/* Anzeige der Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          tags: formData.tags.filter((_, i) => i !== index),
                        })
                      }}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {formData.tags.length === 0 && (
              <p className="text-sm text-gray-500">Keine Tags vorhanden</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Wird gespeichert..." : source ? "Aktualisieren" : "Erstellen"}
        </button>
      </div>
    </form>
  )
}

