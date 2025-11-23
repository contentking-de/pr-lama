"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Booking {
  id: string
  linkSource: {
    name: string
  }
  client: {
    brand: string
    domain: string
  }
  status: string
}

interface ContentUploadFormProps {
  bookings: Booking[]
  userId: string
}

export default function ContentUploadForm({ bookings, userId }: ContentUploadFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedBookingId, setSelectedBookingId] = useState("")
  const [isBriefing, setIsBriefing] = useState(false)
  const [briefingRecipientType, setBriefingRecipientType] = useState<"PUBLISHER" | "REDAKTEUR">("PUBLISHER")
  const [selectedRedakteurId, setSelectedRedakteurId] = useState("")
  const [redakteure, setRedakteure] = useState<Array<{ id: string; name: string | null; email: string }>>([])
  const [isLoadingRedakteure, setIsLoadingRedakteure] = useState(false)

  // Lade Redakteure, wenn Briefing ausgewählt wird
  useEffect(() => {
    if (isBriefing) {
      setIsLoadingRedakteure(true)
      fetch("/api/users/redakteure")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setRedakteure(data)
          }
        })
        .catch((err) => {
          console.error("Error loading redakteure:", err)
        })
        .finally(() => {
          setIsLoadingRedakteure(false)
        })
    }
  }, [isBriefing])

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!selectedBookingId) {
      setError("Bitte wähle eine Buchung aus")
      setIsLoading(false)
      return
    }

    if (isBriefing && briefingRecipientType === "REDAKTEUR" && !selectedRedakteurId) {
      setError("Bitte wähle einen Redakteur aus")
      setIsLoading(false)
      return
    }

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
      uploadFormData.append("bookingId", selectedBookingId)
      uploadFormData.append("userId", userId)
      if (isBriefing) {
        uploadFormData.append("isBriefing", "true")
        uploadFormData.append("briefingRecipientType", briefingRecipientType)
        if (briefingRecipientType === "REDAKTEUR" && selectedRedakteurId) {
          uploadFormData.append("briefingRecipientId", selectedRedakteurId)
        }
      }

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
      setSelectedBookingId("")

      setTimeout(() => {
        router.push("/content")
      }, 1500)
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
          <label htmlFor="bookingId" className="block text-sm font-medium text-gray-700 mb-2">
            Buchung auswählen *
          </label>
          <select
            id="bookingId"
            required
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Bitte wählen</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.linkSource.name} - {booking.client.brand} ({booking.status})
              </option>
            ))}
          </select>
          {bookings.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Keine Buchungen im Status CONTENT_PENDING oder CONTENT_PROVIDED gefunden.
            </p>
          )}
        </div>

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

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isBriefing}
              onChange={(e) => {
                setIsBriefing(e.target.checked)
                if (!e.target.checked) {
                  setBriefingRecipientType("PUBLISHER")
                  setSelectedRedakteurId("")
                }
              }}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Dies ist ein Briefing</span>
          </label>
        </div>

        {isBriefing && (
          <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Briefing-Empfänger
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="briefingRecipient"
                    value="PUBLISHER"
                    checked={briefingRecipientType === "PUBLISHER"}
                    onChange={(e) => {
                      setBriefingRecipientType("PUBLISHER")
                      setSelectedRedakteurId("")
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Publisher der Buchung</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="briefingRecipient"
                    value="REDAKTEUR"
                    checked={briefingRecipientType === "REDAKTEUR"}
                    onChange={(e) => setBriefingRecipientType("REDAKTEUR")}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Redakteur</span>
                </label>
              </div>
            </div>

            {briefingRecipientType === "REDAKTEUR" && (
              <div>
                <label htmlFor="redakteur" className="block text-sm font-medium text-gray-700 mb-2">
                  Redakteur auswählen *
                </label>
                {isLoadingRedakteure ? (
                  <p className="text-sm text-gray-500">Lade Redakteure...</p>
                ) : redakteure.length === 0 ? (
                  <p className="text-sm text-yellow-600">Keine Redakteure verfügbar</p>
                ) : (
                  <select
                    id="redakteur"
                    required={briefingRecipientType === "REDAKTEUR"}
                    value={selectedRedakteurId}
                    onChange={(e) => setSelectedRedakteurId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bitte wählen</option>
                    {redakteure.map((redakteur) => (
                      <option key={redakteur.id} value={redakteur.id}>
                        {redakteur.name || redakteur.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
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
            disabled={isLoading || bookings.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Wird hochgeladen..." : "Hochladen"}
          </button>
        </div>
      </form>
    </div>
  )
}

