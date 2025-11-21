"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface LinkSource {
  id: string
  name: string
  url: string
  publisher: {
    name: string | null
    email: string
  }
}

interface Client {
  id: string
  brand: string
  domain: string
}

interface BookingFormProps {
  sources: LinkSource[]
  clients: Client[]
  userId: string
}

export default function BookingForm({ sources, clients, userId }: BookingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    linkSourceId: "",
    clientId: "",
    targetUrl: "",
    anchorText: "",
    publicationDate: new Date().toISOString().split("T")[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          publicationDate: new Date(formData.publicationDate),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Erstellen der Buchung")
      }

      const result = await response.json()
      router.push(`/bookings/${result.id}`)
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
          <label htmlFor="linkSourceId" className="block text-sm font-medium text-gray-700 mb-2">
            Linkquelle *
          </label>
          <select
            id="linkSourceId"
            required
            value={formData.linkSourceId}
            onChange={(e) => setFormData({ ...formData, linkSourceId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Bitte wählen</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name} - {source.publisher.name || source.publisher.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
            Kunde *
          </label>
          <select
            id="clientId"
            required
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Bitte wählen</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.brand} ({client.domain})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Ziel-URL *
          </label>
          <input
            type="url"
            id="targetUrl"
            required
            value={formData.targetUrl}
            onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
            placeholder="https://example.com/page"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="anchorText" className="block text-sm font-medium text-gray-700 mb-2">
            Ankertext *
          </label>
          <input
            type="text"
            id="anchorText"
            required
            value={formData.anchorText}
            onChange={(e) => setFormData({ ...formData, anchorText: e.target.value })}
            placeholder="Beispiel Text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="publicationDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Veröffentlichungsdatum *
          </label>
          <input
            type="date"
            id="publicationDate"
            required
            value={formData.publicationDate}
            onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          {isLoading ? "Wird erstellt..." : "Buchung erstellen"}
        </button>
      </div>
    </form>
  )
}

