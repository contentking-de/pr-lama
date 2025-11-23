import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"
import ContentFilter from "@/components/ContentFilter"

export const dynamic = "force-dynamic"

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireRole(["ADMIN", "MEMBER", "REDAKTEUR"])

  // Next.js 15+ verwendet Promise für searchParams
  const resolvedSearchParams = await searchParams

  const bookingFilter = Array.isArray(resolvedSearchParams.booking)
    ? resolvedSearchParams.booking[0]
    : (resolvedSearchParams.booking as string | undefined)

  // Baue where-Klausel auf
  const where: any = {}
  if (bookingFilter) {
    where.bookingId = bookingFilter
  }

  const contentAssets = await prisma.contentAsset.findMany({
    where,
    include: {
      booking: {
        include: {
          linkSource: {
            select: {
              name: true,
              url: true,
            },
          },
          client: {
            select: {
              brand: true,
              domain: true,
            },
          },
        },
      },
      uploader: {
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

  // Hole alle Buchungen für Filter-Dropdown (die Content haben oder benötigen)
  const bookings = await prisma.linkBooking.findMany({
    where: {
      OR: [
        {
          status: {
            in: ["CONTENT_PENDING", "CONTENT_PROVIDED"],
          },
        },
        {
          contentAssets: {
            some: {},
          },
        },
      ],
    },
    include: {
      linkSource: {
        select: {
          name: true,
        },
      },
      client: {
        select: {
          brand: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Gruppiere Content-Assets nach bookingId
  const groupedAssets = contentAssets.reduce((acc, asset) => {
    const bookingId = asset.bookingId
    if (!acc[bookingId]) {
      acc[bookingId] = {
        booking: asset.booking,
        assets: [],
      }
    }
    acc[bookingId].assets.push(asset)
    return acc
  }, {} as Record<string, { booking: typeof contentAssets[0]["booking"]; assets: typeof contentAssets }>)

  // Konvertiere zu Array und sortiere nach neuestem Asset
  const groupedAssetsArray = Object.values(groupedAssets).sort((a, b) => {
    const aLatest = Math.max(...a.assets.map((asset) => new Date(asset.createdAt).getTime()))
    const bLatest = Math.max(...b.assets.map((asset) => new Date(asset.createdAt).getTime()))
    return bLatest - aLatest
  })

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content-Verwaltung</h1>
            <p className="text-gray-600 mt-2">Alle Content-Assets verwalten und Buchungen zuordnen</p>
          </div>
          <Link
            href="/content/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Neues Content-Asset
          </Link>
        </div>

        {/* Filter */}
        <ContentFilter bookings={bookings} currentFilter={bookingFilter} />

        {/* Content-Assets Liste */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dateiname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buchung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hochgeladen von
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedAssetsArray.map((group) => (
                <tr key={group.booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {group.assets.map((asset) => (
                        <div key={asset.id} className="text-sm font-medium text-gray-900">
                          {asset.fileName}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/bookings/${group.booking.id}`}
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      {group.booking.linkSource.name} - {group.booking.client.brand}
                    </Link>
                    <div className="text-xs text-gray-500">{group.booking.client.domain}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">
                      ID: {group.booking.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        group.booking.status === "CONTENT_PROVIDED"
                          ? "bg-purple-100 text-purple-800"
                          : group.booking.status === "CONTENT_PENDING"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {group.booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {group.assets.map((asset) => (
                        <span
                          key={asset.id}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded block"
                        >
                          {asset.fileType.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {group.assets.map((asset) => (
                        <div key={asset.id} className="text-sm text-gray-900">
                          {asset.uploader.name || asset.uploader.email}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {group.assets.map((asset) => (
                        <div key={asset.id}>
                          <div className="text-sm text-gray-900">
                            {new Date(asset.createdAt).toLocaleDateString("de-DE")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(asset.createdAt).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex flex-col items-end gap-2">
                      {group.assets.map((asset) => (
                        <div key={asset.id} className="flex items-center gap-3">
                          <a
                            href={asset.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Download"
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
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </a>
                          <Link
                            href={`/content/${asset.id}/edit`}
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
                        </div>
                      ))}
                      <Link
                        href={`/bookings/${group.booking.id}`}
                        className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Zur Buchung"
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
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {groupedAssetsArray.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Content-Assets gefunden.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

