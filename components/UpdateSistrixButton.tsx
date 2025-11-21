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
    <div className="space-y-2">
      <button
        onClick={handleUpdate}
        disabled={isLoading}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Wird aktualisiert..." : "Sistrix Index aktualisieren"}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-600">Sichtbarkeitsindex erfolgreich aktualisiert!</p>
      )}
    </div>
  )
}

