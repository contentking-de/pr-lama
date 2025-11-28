"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function PublisherRegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    exampleSources: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/publishers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Fehler bei der Registrierung")
      }

      setSuccess(true)
      setFormData({ email: "", name: "", exampleSources: "" })
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {success ? (
        <div className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Erfolgreich registriert!</h2>
          <p className="text-gray-600">
            Unsere Admins prüfen die Registrierung und schalten Dich dann frei. Du bekommst in den nächsten Tagen eine Mail und kannst Dich dann einloggen und Dein Inventar bei uns einstellen, damit wir in Zukunft Deine Linkquellen buchen können.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail-Adresse *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dein Name"
            />
          </div>

          <div>
            <label htmlFor="exampleSources" className="block text-sm font-medium text-gray-700 mb-2">
              Beispiel-Linkquellen aus deinem Portfolio (optional)
            </label>
            <textarea
              id="exampleSources"
              rows={4}
              value={formData.exampleSources}
              onChange={(e) => setFormData({ ...formData, exampleSources: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bitte nenne 2-3 Beispiel-Linkquellen aus deinem Portfolio (z.B. Domain-Namen oder URLs)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Diese Informationen helfen uns bei der Prüfung deiner Registrierung.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Nach der Registrierung musst du von einem Administrator freigeschaltet werden, bevor du dich anmelden kannst.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Wird registriert..." : "Registrieren"}
          </button>
        </form>
      )}
    </div>
  )
}

