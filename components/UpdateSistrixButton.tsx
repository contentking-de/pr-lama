"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface UpdateSistrixButtonProps {
  sourceId: string
  onUpdate?: (visibilityIndex: number) => void
}

export default function UpdateSistrixButton({ sourceId, onUpdate }: UpdateSistrixButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleUpdate = async () => {
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch(`/api/sources/${sourceId}/sistrix`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Aktualisieren")
      }

      const data = await response.json()
      setSuccess(true)
      
      if (onUpdate && data.visibilityIndex !== null && data.visibilityIndex !== undefined) {
        onUpdate(data.visibilityIndex)
      }

      // Seite aktualisieren, um den neuen Wert anzuzeigen
      router.refresh()

      // Erfolgsmeldung nach kurzer Zeit ausblenden
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleUpdate}
        disabled={isLoading}
        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Sistrix Index aktualisieren"
      >
        <svg
          className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded shadow-lg z-10 whitespace-nowrap">
          {error}
        </div>
      )}
      {success && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded shadow-lg z-10 whitespace-nowrap">
          Aktualisiert!
        </div>
      )}
    </div>
  )
}

