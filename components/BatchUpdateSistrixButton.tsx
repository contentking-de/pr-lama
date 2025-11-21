"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface BatchUpdateSistrixButtonProps {
  totalSources: number
}

export default function BatchUpdateSistrixButton({ totalSources }: BatchUpdateSistrixButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<{
    updated: number
    unchanged: number
    skipped: number
    errors: number
  } | null>(null)

  const handleBatchUpdate = async () => {
    if (!confirm(`Möchtest du wirklich alle ${totalSources} Sichtbarkeitsindizes aktualisieren? Dies kann einige Minuten dauern.`)) {
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess(false)
    setResult(null)

    try {
      const response = await fetch("/api/sources/sistrix/batch", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Batch-Update")
      }

      const data = await response.json()
      setSuccess(true)
      setResult({
        updated: data.updated,
        unchanged: data.unchanged,
        skipped: data.skipped,
        errors: data.errors,
      })

      // Seite aktualisieren, um die neuen Werte anzuzeigen
      router.refresh()

      // Erfolgsmeldung nach 10 Sekunden ausblenden
      setTimeout(() => {
        setSuccess(false)
      }, 10000)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleBatchUpdate}
        disabled={isLoading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Wird aktualisiert...
          </span>
        ) : (
          `Alle Sistrix Indizes aktualisieren (${totalSources} Sources)`
        )}
      </button>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
      {success && result && (
        <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          <p className="font-semibold mb-1">✅ Batch-Update erfolgreich abgeschlossen!</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Aktualisiert: {result.updated}</li>
            <li>Unverändert: {result.unchanged}</li>
            <li>Übersprungen: {result.skipped}</li>
            {result.errors > 0 && <li className="text-red-600">Fehler: {result.errors}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

