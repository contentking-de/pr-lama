import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["ADMIN", "MEMBER"])

  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contactPersons: {
        orderBy: {
          createdAt: "asc",
        },
      },
      linkBookings: {
        include: {
          linkSource: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  })

  if (!client) {
    notFound()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.brand}</h1>
            <p className="text-gray-600 mt-2">Kundendetails</p>
          </div>
          <Link
            href={`/clients/${client.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Bearbeiten
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Grundinformationen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <p className="mt-1 text-sm text-gray-900">{client.brand}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Domain</label>
                <a
                  href={`https://${client.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-blue-600 hover:underline"
                >
                  {client.domain}
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kategorien</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {client.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Ansprechpartner</h2>
              <Link
                href={`/clients/${client.id}/contacts/new`}
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                + Hinzufügen
              </Link>
            </div>
            <div className="space-y-4">
              {client.contactPersons.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Ansprechpartner vorhanden.</p>
              ) : (
                client.contactPersons.map((contact) => (
                  <div key={contact.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/clients/${client.id}/contacts/${contact.id}/edit`}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Bearbeiten
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {client.linkBookings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Letzte Buchungen</h2>
            <div className="space-y-2">
              {client.linkBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                >
                  <div>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900"
                    >
                      {booking.linkSource.name}
                    </Link>
                    <p className="text-xs text-gray-500">{booking.targetUrl}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "ACCEPTED"
                        ? "bg-blue-100 text-blue-800"
                        : booking.status === "REQUESTED"
                        ? "bg-yellow-100 text-yellow-800"
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

