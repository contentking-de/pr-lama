import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function SourceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()

  const source = await prisma.linkSource.findUnique({
    where: { id: params.id },
    include: {
      publisher: {
        select: {
          id: true,
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
  })

  if (!source) {
    notFound()
  }

  // Publisher können nur eigene Quellen sehen
  if (user.role === "PUBLISHER" && source.publisherId !== user.id) {
    notFound()
  }

  const canEdit =
    user.role === "ADMIN" ||
    user.role === "MEMBER" ||
    (user.role === "PUBLISHER" && source.publisherId === user.id)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{source.name}</h1>
            <p className="text-gray-600 mt-2">Linkquelle Details</p>
          </div>
          {canEdit && (
            <Link
              href={`/sources/${source.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Bearbeiten
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{source.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">URL</label>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-blue-600 hover:underline"
              >
                {source.url}
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Publisher</label>
              <p className="mt-1 text-sm text-gray-900">
                {source.publisher.name || source.publisher.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preis</label>
              <p className="mt-1 text-sm text-gray-900">
                {parseFloat(source.price.toString()).toFixed(2)} €
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kategorie</label>
              <p className="mt-1 text-sm text-gray-900">{source.category}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Typ</label>
              <p className="mt-1 text-sm text-gray-900">{source.type}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Domain Authority (DA)</label>
              <p className="mt-1 text-sm text-gray-900">{source.da || "N/A"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Domain Rating (DR)</label>
              <p className="mt-1 text-sm text-gray-900">{source.dr || "N/A"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Verfügbarkeit</label>
              <span className="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {source.availability}
              </span>
            </div>

            {source.description && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                <p className="mt-1 text-sm text-gray-900">{source.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Erstellt von</label>
              <p className="mt-1 text-sm text-gray-900">
                {source.creator.name || source.creator.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Erstellt am</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(source.createdAt).toLocaleDateString("de-DE")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

