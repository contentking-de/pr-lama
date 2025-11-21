import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function PublisherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["ADMIN", "MEMBER"])

  const { id } = await params

  const publisher = await prisma.user.findUnique({
    where: { id },
    include: {
      linkSources: {
        orderBy: {
          createdAt: "desc",
        },
      },
      linkBookingsAccepted: {
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
        take: 10,
      },
      publisherContact: true,
      _count: {
        select: {
          linkSources: true,
          linkBookingsAccepted: true,
        },
      },
    },
  })

  if (!publisher || publisher.role !== "PUBLISHER") {
    notFound()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {publisher.name || publisher.email}
            </h1>
            <p className="text-gray-600 mt-2">Publisher Details</p>
          </div>
          <Link
            href={`/publishers/${publisher.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Bearbeiten
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Grundinformationen</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{publisher.name || "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail</label>
              <p className="mt-1 text-sm text-gray-900">{publisher.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rolle</label>
              <span className="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                PUBLISHER
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Erstellt am</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(publisher.createdAt).toLocaleDateString("de-DE")}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Statistiken</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Linkquellen</label>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {publisher._count.linkSources}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Akzeptierte Buchungen</label>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {publisher._count.linkBookingsAccepted}
              </p>
            </div>
          </div>
        </div>

        {publisher.linkSources.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Linkquellen</h2>
            <div className="space-y-2">
              {publisher.linkSources.map((source) => (
                <div
                  key={source.id}
                  className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                >
                  <div>
                    <Link
                      href={`/sources/${source.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900"
                    >
                      {source.name}
                    </Link>
                    <p className="text-xs text-gray-500">{source.url}</p>
                  </div>
                  <span className="text-sm text-gray-600">
                    {parseFloat(source.price.toString()).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {publisher.linkBookingsAccepted.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Letzte akzeptierte Buchungen</h2>
            <div className="space-y-2">
              {publisher.linkBookingsAccepted.map((booking) => (
                <div
                  key={booking.id}
                  className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                >
                  <div>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900"
                    >
                      {booking.linkSource.name} - {booking.client.brand}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "ACCEPTED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

