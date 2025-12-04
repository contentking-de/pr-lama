"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import UpdateSistrixButton from "./UpdateSistrixButton"
import GenerateTagsButton from "./GenerateTagsButton"
import { getCountryFlag } from "@/lib/countryFlags"
import { useRouter } from "next/navigation"

// Verfügbare Länder für das Dropdown
const AVAILABLE_COUNTRIES = [
  "Belgien",
  "Dänemark",
  "Deutschland",
  "England",
  "Frankreich",
  "Italien",
  "Niederlande",
  "Österreich",
  "Polen",
  "Schweiz",
  "Spanien",
].sort()

interface SourceRowWithTagsProps {
  source: {
    id: string
    name: string
    url: string
    publisherId?: string
    publisher: {
      name: string | null
      email: string
    }
    price: number
    category: string
    country: string | null
    availability: string
    sistrixVisibilityIndex: number | null
    sistrixLastUpdated: Date | null
    tags: string[]
  }
  userRole: string
  userId?: string
}

export default function SourceRowWithTags({ source, userRole, userId }: SourceRowWithTagsProps) {
  const router = useRouter()
  const [isTagsExpanded, setIsTagsExpanded] = useState(false)
  const [tags, setTags] = useState<string[]>(source.tags || [])
  const [sistrixVisibilityIndex, setSistrixVisibilityIndex] = useState<number | null>(
    source.sistrixVisibilityIndex
  )
  const [sistrixLastUpdated, setSistrixLastUpdated] = useState<Date | null>(
    source.sistrixLastUpdated
  )
  const [country, setCountry] = useState<string | null>(source.country)
  const [isUpdatingCountry, setIsUpdatingCountry] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Schließe Dropdown beim Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }

    if (showCountryDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showCountryDropdown])
  
  const handleTagsUpdate = (newTags: string[]) => {
    setTags(newTags)
    setIsTagsExpanded(true) // Automatisch Tags-Zeile öffnen nach Generierung
  }

  const handleSistrixUpdate = (newVisibilityIndex: number) => {
    setSistrixVisibilityIndex(newVisibilityIndex)
    setSistrixLastUpdated(new Date())
  }

  const handleCountryChange = async (newCountry: string | null) => {
    setIsUpdatingCountry(true)
    setShowCountryDropdown(false)
    
    try {
      const response = await fetch(`/api/sources/${source.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: newCountry || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren des Landes")
      }

      setCountry(newCountry)
      router.refresh()
    } catch (error) {
      console.error("Error updating country:", error)
      alert("Fehler beim Aktualisieren des Landes")
    } finally {
      setIsUpdatingCountry(false)
    }
  }

  const countryFlag = getCountryFlag(country)

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-2 py-4 whitespace-nowrap text-center">
          {country ? (
            <div className="text-2xl" title={country}>
              {countryFlag}
            </div>
          ) : (
            <div className="relative inline-block" ref={dropdownRef}>
              {isUpdatingCountry ? (
                <svg
                  className="animate-spin h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <button
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Land auswählen"
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}
              {showCountryDropdown && !isUpdatingCountry && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                  <div className="py-1">
                    <button
                      onClick={() => handleCountryChange(null)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Kein Land
                    </button>
                    {AVAILABLE_COUNTRIES.map((countryOption) => (
                      <button
                        key={countryOption}
                        onClick={() => handleCountryChange(countryOption)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span>{getCountryFlag(countryOption)}</span>
                        <span>{countryOption}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap hidden">
          <div className="text-sm font-medium text-gray-900">{source.name}</div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-2">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {source.url}
            </a>
            <div className="flex items-center gap-2">
              {(userRole === "ADMIN" || userRole === "MEMBER") && (
                <>
                  <Link
                    href={`/bookings/new?sourceId=${source.id}`}
                    className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Buchen"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </Link>
                  <GenerateTagsButton sourceId={source.id} onUpdate={handleTagsUpdate} />
                </>
              )}
              <Link
                href={`/sources/${source.id}`}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Ansehen"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </Link>
              {(userRole === "ADMIN" ||
                userRole === "MEMBER" ||
                (userRole === "PUBLISHER" && source.publisherId && userId && source.publisherId === userId)) && (
                <Link
                  href={`/sources/${source.id}/edit`}
                  className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title="Bearbeiten"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {source.publisher.name || source.publisher.email}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {parseFloat(source.price.toString()).toFixed(2)} €
          </div>
        </td>
        <td className="px-3 py-4">
          <div className="text-sm text-gray-900 break-words max-w-xs">{source.category}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            {source.availability}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {sistrixVisibilityIndex !== null && sistrixVisibilityIndex !== undefined ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {(sistrixVisibilityIndex / 10000).toFixed(4)}
                  </span>
                  {sistrixLastUpdated && (
                    <span className="text-xs text-gray-500">
                      {new Date(sistrixLastUpdated).toLocaleDateString("de-DE")}
                    </span>
                  )}
                </div>
                {(userRole === "ADMIN" || userRole === "MEMBER") && (
                  <UpdateSistrixButton sourceId={source.id} onUpdate={handleSistrixUpdate} />
                )}
              </div>
            ) : (
              <>
                <span className="text-xs text-gray-400">Nicht verfügbar</span>
                {(userRole === "ADMIN" || userRole === "MEMBER") && (
                  <UpdateSistrixButton sourceId={source.id} onUpdate={handleSistrixUpdate} />
                )}
              </>
            )}
          </div>
        </td>
      </tr>
      {/* Tags Toggle Row */}
      {(tags && tags.length > 0) || (userRole === "ADMIN" || userRole === "MEMBER") ? (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-6 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors text-left"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isTagsExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="font-medium">
                  {tags && tags.length > 0
                    ? `${tags.length} Tag${tags.length !== 1 ? "s" : ""}`
                    : "Tags"}
                </span>
              </button>
              {(userRole === "ADMIN" || userRole === "MEMBER") && (
                <GenerateTagsButton sourceId={source.id} onUpdate={handleTagsUpdate} />
              )}
            </div>
            {isTagsExpanded && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags && tags.length > 0 ? (
                  tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Keine Tags vorhanden</span>
                )}
              </div>
            )}
          </td>
        </tr>
      ) : null}
    </>
  )
}

