import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const user = await requireRole(["ADMIN", "MEMBER", "PUBLISHER"])

  // Publisher sehen nur eigene Quellen
  const where =
    user.role === "PUBLISHER"
      ? { publisherId: user.id }
      : {}

  const sources = await prisma.linkSource.findMany({
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
  })

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
            <Link
              href="/sources/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Neue Linkquelle
            </Link>
          )}
        </div>

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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/sources/${source.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Ansehen
                    </Link>
                    {(user.role === "ADMIN" ||
                      user.role === "MEMBER" ||
                      (user.role === "PUBLISHER" && source.publisherId === user.id)) && (
                      <Link
                        href={`/sources/${source.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Bearbeiten
                      </Link>
                    )}
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
      </div>
    </Layout>
  )
}

