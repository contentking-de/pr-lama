"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Booking {
  id: string
  status: string
  publisherProducesContent: boolean
  linkSource: {
    publisherId: string
  }
}

interface User {
  id: string
  role: string
}

interface BookingActionsProps {
  booking: Booking
  user: User
}

export default function BookingActions({ booking, user }: BookingActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [publisherProducesContent, setPublisherProducesContent] = useState(false)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [reminderError, setReminderError] = useState("")
  const [reminderSuccess, setReminderSuccess] = useState(false)

  const handleStatusChange = async (newStatus: string, publisherProducesContent?: boolean) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          publisherProducesContent,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Aktualisieren des Status")
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  // Publisher kann REQUESTED Buchungen akzeptieren/ablehnen und ACCEPTED/CONTENT_PROVIDED als veröffentlicht markieren
  if (user.role === "PUBLISHER" && booking.linkSource.publisherId === user.id) {
    if (booking.status === "REQUESTED") {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Buchung bearbeiten</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="publisherProducesContent"
                checked={publisherProducesContent}
                onChange={(e) => setPublisherProducesContent(e.target.checked)}
                className="mt-1 mr-2"
              />
              <label htmlFor="publisherProducesContent" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">Ich produziere den Content selbst</span>
                <p className="text-xs text-gray-500 mt-1">
                  Wenn angehakt: Status wird auf ACCEPTED gesetzt. Wenn nicht angehakt: Status wird auf CONTENT_PENDING gesetzt und Content muss geliefert werden.
                </p>
              </label>
            </div>
            <div className="flex gap-3 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  handleStatusChange("ACCEPTED", publisherProducesContent)
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Wird verarbeitet..." : "Anfrage akzeptieren"}
              </button>
              <button
                onClick={() => {
                  if (confirm("Möchtest du diese Buchung wirklich ablehnen?")) {
                    // TODO: Ablehnungs-Logik implementieren (z.B. Status REJECTED oder Kommentar)
                    alert("Ablehnungs-Funktion wird noch implementiert")
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Publisher kann ACCEPTED oder CONTENT_PROVIDED Buchungen als veröffentlicht markieren
    if (booking.status === "ACCEPTED" || booking.status === "CONTENT_PROVIDED") {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Buchung bearbeiten</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Die Buchung wurde akzeptiert{booking.status === "CONTENT_PROVIDED" ? " und der Content wurde bereitgestellt" : ""}.
              Du kannst sie jetzt als veröffentlicht markieren.
            </p>
            <button
              onClick={() => {
                if (confirm("Möchtest du diese Buchung wirklich als veröffentlicht markieren?")) {
                  handleStatusChange("PUBLISHED")
                }
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Wird verarbeitet..." : "Als veröffentlicht markieren"}
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  const handleSendReminder = async () => {
    setIsSendingReminder(true)
    setReminderError("")
    setReminderSuccess(false)

    try {
      const response = await fetch(`/api/bookings/${booking.id}/reminder`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Senden des Reminders")
      }

      setReminderSuccess(true)
      setTimeout(() => {
        setReminderSuccess(false)
      }, 3000)
    } catch (err: any) {
      setReminderError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsSendingReminder(false)
    }
  }

  // ADMIN und MEMBER können Status ändern
  if (user.role === "ADMIN" || user.role === "MEMBER") {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktionen</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {reminderError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
            {reminderError}
          </div>
        )}
        {reminderSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4">
            Reminder-E-Mail erfolgreich gesendet!
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {booking.status === "REQUESTED" && (
            <button
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingReminder ? "Wird gesendet..." : "Reminder senden"}
            </button>
          )}
          {booking.status === "ACCEPTED" && booking.publisherProducesContent && (
            <button
              onClick={() => handleStatusChange("PUBLISHED")}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Als veröffentlicht markieren
            </button>
          )}
          {booking.status === "CONTENT_PROVIDED" && (
            <button
              onClick={() => handleStatusChange("PUBLISHED")}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Als veröffentlicht markieren
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

