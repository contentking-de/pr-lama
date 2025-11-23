import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"

export default async function PublishersPage() {
  const user = await requireRole(["ADMIN", "MEMBER"])

  const publishers = await prisma.user.findMany({
    where: {
      role: "PUBLISHER",
    },
    include: {
      _count: {
        select: {
          linkSources: true,
          linkBookingsAccepted: true,
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
            <h1 className="text-3xl font-bold text-gray-900">Publisher-Verwaltung</h1>
            <p className="text-gray-600 mt-2">Alle Publisher verwalten</p>
          </div>
          <Link
            href="/publishers/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Neuer Publisher
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-Mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linkquellen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akzeptierte Buchungen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstellt am
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {publishers.map((publisher) => (
                <tr key={publisher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {publisher.name || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{publisher.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{publisher._count.linkSources}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{publisher._count.linkBookingsAccepted}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(publisher.createdAt).toLocaleDateString("de-DE")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/publishers/${publisher.id}`}
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
                      <Link
                        href={`/publishers/${publisher.id}/edit`}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {publishers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Publisher gefunden.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

