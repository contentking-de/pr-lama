import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import { notFound } from "next/navigation"
import BookingActions from "@/components/BookingActions"
import Link from "next/link"

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()

  const booking = await prisma.linkBooking.findUnique({
    where: { id: params.id },
    include: {
      linkSource: {
        include: {
          publisher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      client: {
        include: {
          contactPersons: true,
        },
      },
      requester: {
        select: {
          name: true,
          email: true,
        },
      },
      accepter: {
        select: {
          name: true,
          email: true,
        },
      },
      contentCompleter: {
        select: {
          name: true,
          email: true,
        },
      },
      publisher: {
        select: {
          name: true,
          email: true,
        },
      },
      contentAssets: {
        include: {
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
      },
    },
  })

  if (!booking) {
    notFound()
  }

  // Publisher können nur Buchungen für eigene Quellen sehen
  if (user.role === "PUBLISHER" && booking.linkSource.publisherId !== user.id) {
    notFound()
  }

  // Serialisiere das booking-Objekt für Client Components (konvertiere Decimal zu number)
  const serializedBooking = {
    ...booking,
    linkSource: {
      ...booking.linkSource,
      price: parseFloat(booking.linkSource.price.toString()),
    },
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Buchungsdetails</h1>
            <p className="text-gray-600 mt-2">Linkquelle: {booking.linkSource.name}</p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              statusColors[booking.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {booking.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Buchungsinformationen</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Linkquelle</label>
              <p className="mt-1 text-sm text-gray-900">{booking.linkSource.name}</p>
              <a
                href={booking.linkSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                {booking.linkSource.url}
              </a>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kunde</label>
              <p className="mt-1 text-sm text-gray-900">{booking.client.brand}</p>
              <p className="text-xs text-gray-500">{booking.client.domain}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ziel-URL</label>
              <a
                href={booking.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-blue-600 hover:underline"
              >
                {booking.targetUrl}
              </a>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ankertext</label>
              <p className="mt-1 text-sm text-gray-900">{booking.anchorText}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Veröffentlichungsdatum
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(booking.publicationDate).toLocaleDateString("de-DE")}
              </p>
            </div>
            {booking.publisherProducesContent && (
              <div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Publisher produziert Content
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Status & Historie</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span
                className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  statusColors[booking.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {booking.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Angefragt von</label>
              <p className="mt-1 text-sm text-gray-900">
                {booking.requester.name || booking.requester.email}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(booking.createdAt).toLocaleDateString("de-DE")}
              </p>
            </div>
            {booking.accepter && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Akzeptiert von</label>
                <p className="mt-1 text-sm text-gray-900">
                  {booking.accepter.name || booking.accepter.email}
                </p>
              </div>
            )}
            {booking.contentCompleter && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Content bereitgestellt von
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {booking.contentCompleter.name || booking.contentCompleter.email}
                </p>
              </div>
            )}
            {booking.publisher && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Veröffentlicht von</label>
                <p className="mt-1 text-sm text-gray-900">
                  {booking.publisher.name || booking.publisher.email}
                </p>
              </div>
            )}
          </div>
        </div>

        <BookingActions booking={serializedBooking} user={user} />

        {booking.status === "CONTENT_PENDING" && (user.role === "ADMIN" || user.role === "MEMBER") && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Content-Assets</h2>
            <Link
              href={`/bookings/${booking.id}/content`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mb-4"
            >
              Content hochladen
            </Link>
            {booking.contentAssets.length > 0 && (
              <div className="space-y-2 mt-4">
                {booking.contentAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{asset.fileName}</p>
                      <p className="text-xs text-gray-500">
                        Hochgeladen von {asset.uploader.name || asset.uploader.email} am{" "}
                        {new Date(asset.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

