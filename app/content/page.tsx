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
  await requireRole(["ADMIN", "MEMBER"])

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
              {contentAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{asset.fileName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/bookings/${asset.booking.id}`}
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      {asset.booking.linkSource.name} - {asset.booking.client.brand}
                    </Link>
                    <div className="text-xs text-gray-500">{asset.booking.client.domain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        asset.booking.status === "CONTENT_PROVIDED"
                          ? "bg-purple-100 text-purple-800"
                          : asset.booking.status === "CONTENT_PENDING"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {asset.booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                      {asset.fileType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {asset.uploader.name || asset.uploader.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(asset.createdAt).toLocaleDateString("de-DE")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(asset.createdAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Download
                    </a>
                    <Link
                      href={`/bookings/${asset.booking.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Zur Buchung
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contentAssets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Content-Assets gefunden.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

