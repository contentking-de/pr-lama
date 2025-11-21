"use client"

import { useRouter } from "next/navigation"

interface Booking {
  id: string
  linkSource: {
    name: string
  }
  client: {
    brand: string
  }
  status: string
}

interface ContentFilterProps {
  bookings: Booking[]
  currentFilter?: string
}

export default function ContentFilter({ bookings, currentFilter }: ContentFilterProps) {
  const router = useRouter()

  const handleFilterChange = (bookingId: string) => {
    if (bookingId) {
      router.push(`/content?booking=${bookingId}`)
    } else {
      router.push("/content")
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="bookingFilter" className="block text-sm font-medium text-gray-700 mb-2">
            Nach Buchung filtern
          </label>
          <select
            id="bookingFilter"
            value={currentFilter || ""}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Buchungen</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.linkSource.name} - {booking.client.brand} ({booking.status})
              </option>
            ))}
          </select>
        </div>
        {currentFilter && (
          <button
            onClick={() => router.push("/content")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>
    </div>
  )
}

