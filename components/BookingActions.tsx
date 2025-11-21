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

  // Publisher kann nur REQUESTED Buchungen akzeptieren
  if (user.role === "PUBLISHER" && booking.linkSource.publisherId === user.id) {
    if (booking.status === "REQUESTED") {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktionen</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="publisherProducesContent"
                className="mr-2"
                onChange={(e) => {
                  // Checkbox wird beim Akzeptieren berücksichtigt
                }}
              />
              <label htmlFor="publisherProducesContent" className="text-sm text-gray-700">
                Publisher produziert Content
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const checkbox = document.getElementById(
                    "publisherProducesContent"
                  ) as HTMLInputElement
                  handleStatusChange("ACCEPTED", checkbox.checked)
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Wird verarbeitet..." : "Anfrage akzeptieren"}
              </button>
            </div>
          </div>
        </div>
      )
    }
    return null
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
        <div className="flex flex-wrap gap-3">
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

