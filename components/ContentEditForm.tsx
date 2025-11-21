"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface ContentEditFormProps {
  asset: {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    content?: string | null
    booking: {
      linkSource: {
        name: string
      }
      client: {
        brand: string
      }
    }
  }
}

export default function ContentEditForm({ asset }: ContentEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fileName, setFileName] = useState(asset.fileName.replace(/\.txt$/, ""))
  const [content, setContent] = useState(asset.content || "")
  const [file, setFile] = useState<File | null>(null)

  const isTextContent = asset.fileType === "text"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (isTextContent) {
        // Text-Content aktualisieren
        const response = await fetch(`/api/content/${asset.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: fileName.trim(),
            content: content,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Fehler beim Speichern")
        }

        setSuccess("Content erfolgreich aktualisiert!")
      } else {
        // Datei ersetzen oder nur Dateiname ändern
        const formData = new FormData()
        formData.append("fileName", fileName.trim())
        if (file) {
          formData.append("file", file)
        }

        const response = await fetch(`/api/content/${asset.id}`, {
          method: "PUT",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Fehler beim Speichern")
        }

        setSuccess("Content erfolgreich aktualisiert!")
      }

      setTimeout(() => {
        router.push("/content")
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
            Dateiname *
          </label>
          <input
            id="fileName"
            type="text"
            required
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isTextContent && (
            <p className="mt-1 text-xs text-gray-500">
              Die Datei wird als .txt gespeichert
            </p>
          )}
        </div>

        {isTextContent ? (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {content.length} Zeichen
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Datei ersetzen (optional)
            </label>
            <input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept={
                asset.fileType === "image"
                  ? ".jpg,.jpeg,.png"
                  : asset.fileType === "pdf"
                  ? ".pdf"
                  : ".pdf,.jpg,.jpeg,.png,.docx,.txt"
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Aktuelle Datei:{" "}
              <a
                href={asset.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-900"
              >
                {asset.fileName}
              </a>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Wenn keine neue Datei ausgewählt wird, bleibt die aktuelle Datei erhalten.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isLoading || !fileName.trim() || (isTextContent && !content.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  )
}

