"use client"

import { useState } from "react"
import Link from "next/link"
import UpdateSistrixButton from "./UpdateSistrixButton"
import GenerateTagsButton from "./GenerateTagsButton"
import { getCountryFlag } from "@/lib/countryFlags"

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
  const [isTagsExpanded, setIsTagsExpanded] = useState(false)
  const [tags, setTags] = useState<string[]>(source.tags || [])
  const [sistrixVisibilityIndex, setSistrixVisibilityIndex] = useState<number | null>(
    source.sistrixVisibilityIndex
  )
  const [sistrixLastUpdated, setSistrixLastUpdated] = useState<Date | null>(
    source.sistrixLastUpdated
  )
  
  const handleTagsUpdate = (newTags: string[]) => {
    setTags(newTags)
    setIsTagsExpanded(true) // Automatisch Tags-Zeile öffnen nach Generierung
  }

  const handleSistrixUpdate = (newVisibilityIndex: number) => {
    setSistrixVisibilityIndex(newVisibilityIndex)
    setSistrixLastUpdated(new Date())
  }

  const countryFlag = getCountryFlag(source.country)

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-2 py-4 whitespace-nowrap text-center">
          <div className="text-2xl" title={source.country || ""}>
            {countryFlag || "-"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{source.name}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {source.url}
          </a>
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
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{source.category}</div>
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
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-3">
            {(userRole === "ADMIN" || userRole === "MEMBER") && (
              <>
                <Link
                  href={`/bookings/new?sourceId=${source.id}`}
                  className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  title="Buchen"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </Link>
            )}
          </div>
        </td>
      </tr>
      {/* Tags Toggle Row */}
      {(tags && tags.length > 0) || (userRole === "ADMIN" || userRole === "MEMBER") ? (
        <tr className="bg-gray-50">
          <td colSpan={9} className="px-6 py-3">
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

