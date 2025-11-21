"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteUserButtonProps {
  userId: string
  userEmail: string
  currentUserId: string
}

export default function DeleteUserButton({
  userId,
  userEmail,
  currentUserId,
}: DeleteUserButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Löschen")
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  if (userId === currentUserId) {
    return (
      <span className="text-sm text-gray-400">Eigener Account</span>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-900 text-sm"
      >
        Löschen
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">
              Nutzer löschen?
            </h3>
            <div className="mb-6 text-sm text-gray-600 space-y-1 text-left">
              <p>Möchtest du den Nutzer</p>
              <p className="font-semibold text-gray-900 break-all">{userEmail}</p>
              <p>wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Wird gelöscht..." : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

