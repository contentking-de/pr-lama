"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ApprovePublisherButtonProps {
  userId: string
}

export default function ApprovePublisherButton({ userId }: ApprovePublisherButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = async () => {
    if (!confirm("Möchtest du diesen Publisher wirklich freischalten?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Freischalten")
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isLoading}
      className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Publisher freischalten"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
  )
}

