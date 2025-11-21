"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface Publisher {
  id: string
  name: string | null
  email: string
}

interface PublisherFilterProps {
  publishers: Publisher[]
  currentPublisher?: string
  currentStatus?: string
}

export default function PublisherFilter({
  publishers,
  currentPublisher,
  currentStatus,
}: PublisherFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (publisherId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (publisherId) {
      params.set("publisher", publisherId)
    } else {
      params.delete("publisher")
    }

    // Status-Filter beibehalten, falls vorhanden
    if (currentStatus) {
      params.set("status", currentStatus)
    }

    router.push(`/bookings?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <label htmlFor="publisherFilter" className="block text-sm font-medium text-gray-700 mb-2">
        Publisher filtern
      </label>
      <select
        id="publisherFilter"
        value={currentPublisher || ""}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Alle Publisher</option>
        {publishers.map((publisher) => (
          <option key={publisher.id} value={publisher.id}>
            {publisher.name || publisher.email}
          </option>
        ))}
      </select>
    </div>
  )
}

