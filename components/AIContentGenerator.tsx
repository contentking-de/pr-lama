"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Redakteur {
  id: string
  name: string | null
  email: string
}

interface AIContentGeneratorProps {
  bookingId: string
  onContentGenerated?: (content: string) => void
}

export default function AIContentGenerator({ bookingId, onContentGenerated }: AIContentGeneratorProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [prompt, setPrompt] = useState("")
  const [contentType, setContentType] = useState<"article" | "briefing" | "press-release">("article")
  const [generatedContent, setGeneratedContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [briefingRecipientType, setBriefingRecipientType] = useState<"PUBLISHER" | "REDAKTEUR">("PUBLISHER")
  const [selectedRedakteurId, setSelectedRedakteurId] = useState("")
  const [redakteure, setRedakteure] = useState<Redakteur[]>([])
  const [isLoadingRedakteure, setIsLoadingRedakteure] = useState(false)

  // Lade Redakteure, wenn Briefing ausgewählt wird
  useEffect(() => {
    if (contentType === "briefing") {
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
  }, [contentType])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Bitte gib einen Prompt ein")
      return
    }

    setIsGenerating(true)
    setError("")
    setGeneratedContent("")

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          prompt,
          contentType,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler bei der Content-Generierung")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      
      // Standard-Dateiname basierend auf Content-Typ setzen
      const defaultFileNames: Record<string, string> = {
        article: "Artikel",
        briefing: "Briefing",
        "press-release": "Pressemitteilung",
      }
      setFileName(defaultFileNames[contentType] || "Content")

      if (onContentGenerated) {
        onContentGenerated(data.content)
      }
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">KI-Content-Generator</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-2">
          Content-Typ
        </label>
        <select
          id="contentType"
          value={contentType}
          onChange={(e) => {
            setContentType(e.target.value as any)
            // Reset Briefing-Auswahl wenn Content-Typ geändert wird
            if (e.target.value !== "briefing") {
              setBriefingRecipientType("PUBLISHER")
              setSelectedRedakteurId("")
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="article">Artikel</option>
          <option value="briefing">Briefing</option>
          <option value="press-release">Pressemitteilung</option>
        </select>
      </div>

      {contentType === "briefing" && (
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

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Beschreibung / Prompt *
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Beschreibe, welchen Content du benötigst. Beispiel: 'Erstelle einen SEO-optimierten Artikel über digitale PR Strategien mit 500 Wörtern.'"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Je detaillierter der Prompt, desto besser das Ergebnis.
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? "Content wird generiert..." : "Content generieren"}
      </button>

      {generatedContent && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
            <p className="font-medium mb-1">Hinweis:</p>
            <p>Der Dateiname wird automatisch als <strong>PublisherName_BookingID.txt</strong> generiert.</p>
          </div>

          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Generierter Content</label>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedContent)
                alert("Content in Zwischenablage kopiert!")
              }}
              className="text-xs text-blue-600 hover:text-blue-900"
            >
              Kopieren
            </button>
          </div>
          <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
              {generatedContent}
            </pre>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={async () => {
                setIsSaving(true)
                setError("")
                setSuccess("")

                try {
                  const response = await fetch("/api/content/save-generated", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      bookingId,
                      content: generatedContent,
                      fileName: "", // Wird automatisch generiert
                      contentType,
                      briefingRecipientType: contentType === "briefing" ? briefingRecipientType : undefined,
                      briefingRecipientId: contentType === "briefing" && briefingRecipientType === "REDAKTEUR" ? selectedRedakteurId : undefined,
                    }),
                  })

                  if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || "Fehler beim Speichern")
                  }

                  setSuccess("Content erfolgreich gespeichert und der Buchung zugeordnet!")
                  
                  // Reset nach kurzer Zeit
                  setTimeout(() => {
                    setGeneratedContent("")
                    setFileName("")
                    setPrompt("")
                    router.refresh()
                  }, 2000)
                } catch (err: any) {
                  setError(err.message || "Ein Fehler ist aufgetreten")
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving || (contentType === "briefing" && briefingRecipientType === "REDAKTEUR" && !selectedRedakteurId)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Wird gespeichert..." : "Content speichern und zuordnen"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

