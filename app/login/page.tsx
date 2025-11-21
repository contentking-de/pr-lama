"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
      })

      if (result?.error) {
        setMessage("Fehler beim Senden des Magic Links. Bitte versuche es erneut.")
      } else {
        setMessage("Magic Link wurde gesendet! Bitte prüfe dein E-Mail-Postfach.")
      }
    } catch (error) {
      setMessage("Ein Fehler ist aufgetreten. Bitte versuche es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/prlama-logo.png"
              alt="PR Lama Logo"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="deine@email.de"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.includes("gesendet")
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Wird gesendet..." : "Magic Link senden"}
            </button>
          </div>
        </form>

        <p className="text-xs text-center text-gray-500 mt-4">
          Diese Plattform ist nur für autorisierte Nutzer zugänglich.
        </p>
      </div>
    </div>
  )
}

