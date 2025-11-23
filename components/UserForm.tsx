"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

interface UserFormProps {
  user?: User
}

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    email: user?.email || "",
    name: user?.name || "",
    role: user?.role || "MEMBER",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const url = user ? `/api/users/${user.id}` : "/api/users"
      const method = user ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      router.push("/users")
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
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Rolle *
          </label>
          <select
            id="role"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MEMBER">MEMBER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="PUBLISHER">PUBLISHER</option>
            <option value="REDAKTEUR">REDAKTEUR</option>
          </select>
        </div>
      </div>

      {!user && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
          <p className="font-medium mb-1">Hinweis:</p>
          <p>
            Der neue Nutzer kann sich mit der angegebenen E-Mail-Adresse über Magic Link anmelden.
            Es wird keine E-Mail zur Registrierung versendet - der Nutzer kann sich direkt anmelden.
          </p>
        </div>
      )}

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
          {isLoading ? "Wird gespeichert..." : user ? "Aktualisieren" : "Erstellen"}
        </button>
      </div>
    </form>
  )
}

