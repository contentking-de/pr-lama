import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"
import UpdateSistrixButton from "@/components/UpdateSistrixButton"
import SourceFilters from "@/components/SourceFilters"
import BatchUpdateSistrixButton from "@/components/BatchUpdateSistrixButton"
import Pagination from "@/components/Pagination"

export const dynamic = "force-dynamic"

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const user = await requireRole(["ADMIN", "MEMBER", "PUBLISHER"])

  // Extrahiere Filter-Parameter
  const search = Array.isArray(resolvedSearchParams.search)
    ? resolvedSearchParams.search[0]
    : (resolvedSearchParams.search as string | undefined)
  const category = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : (resolvedSearchParams.category as string | undefined)
  const maxPrice = Array.isArray(resolvedSearchParams.maxPrice)
    ? resolvedSearchParams.maxPrice[0]
    : (resolvedSearchParams.maxPrice as string | undefined)
  const minSistrix = Array.isArray(resolvedSearchParams.minSistrix)
    ? resolvedSearchParams.minSistrix[0]
    : (resolvedSearchParams.minSistrix as string | undefined)
  const publisher = Array.isArray(resolvedSearchParams.publisher)
    ? resolvedSearchParams.publisher[0]
    : (resolvedSearchParams.publisher as string | undefined)
  
  // Pagination
  const page = parseInt(
    Array.isArray(resolvedSearchParams.page)
      ? resolvedSearchParams.page[0]
      : (resolvedSearchParams.page as string | undefined) || "1"
  )
  const itemsPerPage = 50
  const skip = (page - 1) * itemsPerPage

  // Baue where-Klausel auf
  const where: any =
    user.role === "PUBLISHER"
      ? { publisherId: user.id }
      : {}

  // Publisher-Filter (nur für ADMIN/MEMBER, Publisher sehen nur eigene)
  if (publisher && user.role !== "PUBLISHER") {
    where.publisherId = publisher
  }

  // Suche nach Name oder URL
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { url: { contains: search, mode: "insensitive" } },
    ]
  }

  // Filter nach Kategorie
  if (category) {
    where.category = category
  }

  // Preis-Filter
  if (maxPrice) {
    where.price = {
      lte: parseFloat(maxPrice),
    }
  }

  // Sistrix Sichtbarkeitsindex-Filter
  if (minSistrix) {
    where.sistrixVisibilityIndex = {
      gte: parseInt(minSistrix),
    }
  }

  // Basis-Query für Preis-Berechnung (ohne Filter)
  const baseWhere = user.role === "PUBLISHER" ? { publisherId: user.id } : {}

  const [sources, totalSources, categories, publishers, priceRange, sistrixRange, totalSourcesCount] = await Promise.all([
    prisma.linkSource.findMany({
      where,
      include: {
        publisher: {
          select: {
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: itemsPerPage,
    }),
    prisma.linkSource.count({ where }),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        name: true,
      },
    }).catch(() => []),
    // Hole alle Publisher für Filter (nur für ADMIN/MEMBER)
    user.role === "ADMIN" || user.role === "MEMBER"
      ? prisma.user.findMany({
          where: {
            role: "PUBLISHER",
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      : Promise.resolve([]),
    // Berechne Min/Max Preis für Slider
    (async () => {
      const prices = await prisma.linkSource.findMany({
        where: baseWhere,
        select: {
          price: true,
        },
      })
      if (prices.length === 0) {
        return { min: 0, max: 1000 }
      }
      const priceValues = prices.map((p) => parseFloat(p.price.toString()))
      return {
        min: Math.floor(Math.min(...priceValues)),
        max: Math.ceil(Math.max(...priceValues)),
      }
    })(),
    // Berechne Min/Max Sistrix Index für Slider
    (async () => {
      try {
        const sistrixValues = await prisma.linkSource.findMany({
          where: {
            ...baseWhere,
            sistrixVisibilityIndex: { not: null },
          },
          select: {
            sistrixVisibilityIndex: true,
          },
        })
        if (sistrixValues.length === 0) {
          return { min: 0, max: 10000 } // Standard-Werte (0.0000 - 1.0000)
        }
        const sistrixIndexes = sistrixValues
          .map((s) => s.sistrixVisibilityIndex)
          .filter((v): v is number => v !== null)
        if (sistrixIndexes.length === 0) {
          return { min: 0, max: 10000 }
        }
        return {
          min: Math.floor(Math.min(...sistrixIndexes)),
          max: Math.ceil(Math.max(...sistrixIndexes)),
        }
      } catch (error) {
        console.error("Fehler beim Berechnen der Sistrix Range:", error)
        return { min: 0, max: 10000 }
      }
    })(),
    // Gesamtzahl aller Sources (für Batch-Update Button)
    prisma.linkSource.count({
      where: baseWhere,
    }),
  ])

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Linkquellen</h1>
            <p className="text-gray-600 mt-2">
              {user.role === "PUBLISHER"
                ? "Deine Linkquellen verwalten"
                : "Alle Linkquellen verwalten"}
            </p>
          </div>
          {(user.role === "ADMIN" || user.role === "MEMBER") && (
            <div className="flex gap-3 items-center">
              <BatchUpdateSistrixButton totalSources={totalSourcesCount} />
              <Link
                href="/sources/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Neue Linkquelle
              </Link>
            </div>
          )}
        </div>

        {/* Filter */}
        <SourceFilters 
          categories={categories.map((c) => c.name)} 
          priceRange={priceRange}
          sistrixRange={sistrixRange}
          publishers={publishers}
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publisher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verfügbarkeit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sistrix Index
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50">
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
                      {source.sistrixVisibilityIndex !== null && source.sistrixVisibilityIndex !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {(source.sistrixVisibilityIndex / 10000).toFixed(4)}
                            </span>
                            {source.sistrixLastUpdated && (
                              <span className="text-xs text-gray-500">
                                {new Date(source.sistrixLastUpdated).toLocaleDateString("de-DE")}
                              </span>
                            )}
                          </div>
                          {(user.role === "ADMIN" || user.role === "MEMBER") && (
                            <UpdateSistrixButton sourceId={source.id} />
                          )}
                        </div>
                      ) : (
                        <>
                          <span className="text-xs text-gray-400">Nicht verfügbar</span>
                          {(user.role === "ADMIN" || user.role === "MEMBER") && (
                            <UpdateSistrixButton sourceId={source.id} />
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      {(user.role === "ADMIN" || user.role === "MEMBER") && (
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
                      {(user.role === "ADMIN" ||
                        user.role === "MEMBER" ||
                        (user.role === "PUBLISHER" && source.publisherId === user.id)) && (
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
              ))}
            </tbody>
          </table>
          {sources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Linkquellen gefunden.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalSources > 0 && (
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalSources / itemsPerPage)}
            totalItems={totalSources}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </Layout>
  )
}

