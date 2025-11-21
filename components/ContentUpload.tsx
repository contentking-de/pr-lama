"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ContentUploadProps {
  bookingId: string
  userId: string
}

export default function ContentUpload({ bookingId, userId }: ContentUploadProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement

    if (!fileInput.files || fileInput.files.length === 0) {
      setError("Bitte wähle eine Datei aus")
      setIsLoading(false)
      return
    }

    const file = fileInput.files[0]

    // Dateigröße prüfen (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Datei ist zu groß. Maximale Größe: 10MB")
      setIsLoading(false)
      return
    }

    // Dateityp prüfen
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    if (!allowedTypes.includes(file.type)) {
      setError("Dateityp nicht unterstützt. Erlaubt: PDF, JPG, PNG, DOCX, TXT")
      setIsLoading(false)
      return
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("bookingId", bookingId)
      uploadFormData.append("userId", userId)

      const response = await fetch("/api/content/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Hochladen")
      }

      setSuccess("Datei erfolgreich hochgeladen!")
      fileInput.value = ""
      router.refresh()

      // Status auf CONTENT_PROVIDED setzen, wenn Content hochgeladen wurde
      setTimeout(() => {
        fetch(`/api/bookings/${bookingId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "CONTENT_PROVIDED",
          }),
        })
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Content-Asset hochladen</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleFileUpload} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            Datei auswählen *
          </label>
          <input
            type="file"
            id="file"
            name="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Erlaubte Formate: PDF, JPG, PNG, DOCX, TXT (max. 10MB)
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Wird hochgeladen..." : "Hochladen"}
          </button>
        </div>
      </form>
    </div>
  )
}

