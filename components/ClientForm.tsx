"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ContactPerson {
  id: string
  name: string
  email: string
  phone: string
}

interface Client {
  id: string
  brand: string
  domain: string
  categories: string[]
  contactPersons: ContactPerson[]
}

interface ClientFormProps {
  client?: Client
}

export default function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    brand: client?.brand || "",
    domain: client?.domain || "",
    categories: client?.categories.join(", ") || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const categories = formData.categories
        .split(",")
        .map((cat) => cat.trim())
        .filter((cat) => cat.length > 0)

      const url = client ? `/api/clients/${client.id}` : "/api/clients"
      const method = client ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          categories,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      const result = await response.json()
      router.push(`/clients/${result.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
              Brand *
            </label>
            <input
              type="text"
              id="brand"
              required
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
              Domain *
            </label>
            <input
              type="text"
              id="domain"
              required
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-2">
              Kategorien (kommagetrennt) *
            </label>
            <input
              type="text"
              id="categories"
              required
              value={formData.categories}
              onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
              placeholder="E-Commerce, Fashion, Lifestyle"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Trenne mehrere Kategorien mit Kommas
            </p>
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
            {isLoading ? "Wird gespeichert..." : client ? "Aktualisieren" : "Erstellen"}
          </button>
        </div>
      </form>

      {client && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Ansprechpartner</h2>
            <Link
              href={`/clients/${client.id}/contacts/new`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              + Ansprechpartner hinzufügen
            </Link>
          </div>
          <div className="space-y-4">
            {client.contactPersons.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Ansprechpartner vorhanden.</p>
            ) : (
              client.contactPersons.map((contact) => (
                <div
                  key={contact.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.email}</p>
                    <p className="text-sm text-gray-600">{contact.phone}</p>
                  </div>
                  <Link
                    href={`/clients/${client.id}/contacts/${contact.id}/edit`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Bearbeiten
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

