import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"
import PublisherFilter from "@/components/PublisherFilter"

export const dynamic = "force-dynamic"

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireAuth()

  // Next.js 15+ verwendet Promise für searchParams
  const resolvedSearchParams = await searchParams

  // Extrahiere status aus searchParams (kann string oder string[] sein)
  const statusParam = resolvedSearchParams.status
  const statusFilter = Array.isArray(statusParam) ? statusParam[0] : (statusParam as string | undefined)

  // Extrahiere publisher aus searchParams
  const publisherParam = resolvedSearchParams.publisher
  const publisherFilter = Array.isArray(publisherParam)
    ? publisherParam[0]
    : (publisherParam as string | undefined)

  // Validiere Status-Filter (nur gültige Enum-Werte erlauben)
  const validStatuses = ["REQUESTED", "ACCEPTED", "CONTENT_PENDING", "CONTENT_PROVIDED", "PUBLISHED"]
  const isValidStatus = statusFilter && validStatuses.includes(statusFilter)

  // Baue where-Klausel auf - kombiniere beide Filter korrekt
  const where: any = {}

  // Publisher sehen nur Buchungen für eigene Quellen
  if (user.role === "PUBLISHER") {
    where.linkSource = {
      publisherId: user.id,
    }
  } else {
    // Für ADMIN/MEMBER: Publisher-Filter hinzufügen, wenn vorhanden
    if (publisherFilter) {
      where.linkSource = {
        publisherId: publisherFilter,
      }
    }
  }

  // Füge Status-Filter hinzu, wenn vorhanden und gültig
  // Wichtig: Dieser Filter muss IMMER gesetzt werden, wenn ein gültiger Status übergeben wird
  if (isValidStatus && statusFilter) {
    where.status = statusFilter
  }

  // Baue where-Klausel für Zählung (ohne Status-Filter, aber mit Publisher-Filter)
  const countWhere: any = {}
  if (user.role === "PUBLISHER") {
    countWhere.linkSource = {
      publisherId: user.id,
    }
  } else {
    // Für ADMIN/MEMBER: Publisher-Filter hinzufügen, wenn vorhanden
    if (publisherFilter) {
      countWhere.linkSource = {
        publisherId: publisherFilter,
      }
    }
  }

  // Zähle Buchungen pro Status
  const statusCounts = await Promise.all(
    validStatuses.map(async (status) => {
      const count = await prisma.linkBooking.count({
        where: {
          ...countWhere,
          status: status as any,
        },
      })
      return { status, count }
    })
  )

  // Zähle alle Buchungen (für "Alle" Button)
  const totalCount = await prisma.linkBooking.count({
    where: countWhere,
  })

  // Hole alle Publisher für Filter-Dropdown (nur für ADMIN/MEMBER)
  const publishers =
    user.role === "ADMIN" || user.role === "MEMBER"
      ? await prisma.user.findMany({
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
      : []

  const bookings = await prisma.linkBooking.findMany({
    where,
    include: {
      linkSource: {
        select: {
          name: true,
          url: true,
          publisherId: true,
          publisher: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      client: {
        select: {
          brand: true,
          domain: true,
        },
      },
      requester: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const statusColors: Record<string, string> = {
    REQUESTED: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    CONTENT_PENDING: "bg-orange-100 text-orange-800",
    CONTENT_PROVIDED: "bg-purple-100 text-purple-800",
    PUBLISHED: "bg-green-100 text-green-800",
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Linkbuchungen</h1>
            <p className="text-gray-600 mt-2">
              {user.role === "PUBLISHER"
                ? "Deine Buchungsanfragen"
                : "Alle Linkbuchungen verwalten"}
            </p>
          </div>
          {(user.role === "ADMIN" || user.role === "MEMBER") && (
            <Link
              href="/bookings/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Neue Buchung
            </Link>
          )}
        </div>

        {/* Filter */}
        <div className="space-y-4">
          {/* Publisher-Filter (nur für ADMIN/MEMBER) */}
          {(user.role === "ADMIN" || user.role === "MEMBER") && publishers.length > 0 && (
            <PublisherFilter
              publishers={publishers}
              currentPublisher={publisherFilter}
              currentStatus={statusFilter}
            />
          )}

          {/* Status-Filter */}
          <div className="flex gap-2 flex-wrap">
            <Link
              href={publisherFilter ? `/bookings?publisher=${publisherFilter}` : "/bookings"}
              className={`px-3 py-1 rounded-md text-sm flex items-center gap-2 ${
                !statusFilter
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Alle
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${
                  !statusFilter ? "bg-blue-700 text-white" : "bg-gray-300 text-gray-700"
                }`}
              >
                {totalCount}
              </span>
            </Link>
            {Object.keys(statusColors).map((status) => {
              const count = statusCounts.find((sc) => sc.status === status)?.count || 0
              const href = publisherFilter
                ? `/bookings?status=${status}&publisher=${publisherFilter}`
                : `/bookings?status=${status}`
              return (
                <Link
                  key={status}
                  href={href}
                  className={`px-3 py-1 rounded-md text-sm flex items-center gap-2 ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {status}
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      statusFilter === status ? "bg-blue-700 text-white" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linkquelle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ziel-URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Veröffentlichungsdatum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.linkSource.name}
                    </div>
                    <div className="text-xs text-gray-500">{booking.linkSource.url}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.client.brand}</div>
                    <div className="text-xs text-gray-500">{booking.client.domain}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {booking.targetUrl}
                    </div>
                    <div className="text-xs text-gray-500">Anker: {booking.anchorText}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[booking.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.publicationDate).toLocaleDateString("de-DE")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/bookings/${booking.id}`}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Buchungen gefunden.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

