"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface GenerateTagsButtonProps {
  sourceId: string
  onUpdate?: (tags: string[]) => void
}

export default function GenerateTagsButton({ sourceId, onUpdate }: GenerateTagsButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch(`/api/sources/${sourceId}/tags`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Generieren der Tags")
      }

      const data = await response.json()
      setSuccess(true)

      if (onUpdate && data.tags) {
        onUpdate(data.tags)
      }

      router.refresh()

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
    <div className="relative group">
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="p-1.5 rounded-full text-gray-600 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        title="Tags generieren"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      </button>
      {error && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          {error}
        </div>
      )}
      {success && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-green-600 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          Tags generiert!
        </div>
      )}
    </div>
  )
}


