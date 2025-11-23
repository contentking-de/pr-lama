"use client"

import { useState } from "react"

interface ContentCheckProps {
  contentAssetId: string
  fileType: string
}

export default function ContentCheck({ contentAssetId, fileType }: ContentCheckProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState("")
  const [checkResult, setCheckResult] = useState("")
  const [checkedAt, setCheckedAt] = useState<string | null>(null)

  // Nur für Text-Content verfügbar
  if (fileType !== "text") {
    return null
  }

  const handleCheck = async () => {
    setIsChecking(true)
    setError("")
    setCheckResult("")

    try {
      const response = await fetch(`/api/content/${contentAssetId}/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentAssetId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Content-Check")
      }

      const data = await response.json()
      setCheckResult(data.checkResult)
      setCheckedAt(data.checkedAt)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">AI-Content-Check</h3>
        <button
          onClick={handleCheck}
          disabled={isChecking}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isChecking ? "Prüfung läuft..." : "Content prüfen"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {checkResult && (
        <div className="space-y-3">
          {checkedAt && (
            <p className="text-xs text-gray-500">
              Prüfung durchgeführt am: {new Date(checkedAt).toLocaleString("de-DE")}
            </p>
          )}
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Prüfergebnis:</h4>
            <div className="bg-white rounded-md p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                {checkResult}
              </pre>
            </div>
          </div>
        </div>
      )}

      {!checkResult && !error && (
        <p className="text-sm text-gray-500">
          Klicke auf "Content prüfen", um eine KI-basierte Qualitätsprüfung durchzuführen.
        </p>
      )}
    </div>
  )
}

