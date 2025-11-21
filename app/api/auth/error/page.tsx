"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    Configuration: "Es gibt ein Problem mit der Server-Konfiguration.",
    AccessDenied: "Du hast keinen Zugriff auf diese Seite.",
    Verification: "Der Verifizierungs-Token ist abgelaufen oder wurde bereits verwendet.",
    Default: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
  }

  const errorMessage = errorMessages[error || ""] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Fehler bei der Anmeldung</h1>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          {error && (
            <p className="text-sm text-gray-500 mb-6">Fehlercode: {error}</p>
          )}
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  )
}

