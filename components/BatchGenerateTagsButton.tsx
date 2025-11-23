"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface BatchGenerateTagsButtonProps {
  totalSources: number
}

export default function BatchGenerateTagsButton({ totalSources }: BatchGenerateTagsButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleBatchGenerate = async () => {
    if (!confirm(`Möchtest du wirklich Tags für alle ${totalSources} Linkquellen generieren? Dies kann einige Zeit dauern.`)) {
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/sources/tags/batch", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler bei der Batch-Tag-Generierung")
      }

      const data = await response.json()
      setSuccess(`${data.processed} Linkquellen erfolgreich verschlagwortet.${data.errors > 0 ? ` ${data.errors} Fehler aufgetreten.` : ""}`)

      router.refresh()

      setTimeout(() => {
        setSuccess("")
      }, 10000)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleBatchGenerate}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {isLoading ? "Tags werden generiert..." : "Tags für alle generieren"}
      </button>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm max-w-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm max-w-md">
          {success}
        </div>
      )}
    </div>
  )
}

