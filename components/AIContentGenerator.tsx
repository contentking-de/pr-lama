"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
  const [contentType, setContentType] = useState<"article" | "social-media" | "email" | "press-release">("article")
  const [generatedContent, setGeneratedContent] = useState("")
  const [fileName, setFileName] = useState("")

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
        "social-media": "Social-Media-Post",
        email: "E-Mail",
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
          onChange={(e) => setContentType(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="article">Artikel</option>
          <option value="social-media">Social Media Post</option>
          <option value="email">E-Mail</option>
          <option value="press-release">Pressemitteilung</option>
        </select>
      </div>

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
              disabled={isSaving}
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

