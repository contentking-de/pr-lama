import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import ContentUpload from "@/components/ContentUpload"
import AIContentGenerator from "@/components/AIContentGenerator"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(["ADMIN", "MEMBER"])

  const { id } = await params

  const booking = await prisma.linkBooking.findUnique({
    where: { id },
    select: {
      id: true,
      targetUrl: true,
      anchorText: true,
      publicationDate: true,
      status: true,
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

  if (booking.status !== "CONTENT_PENDING" && booking.status !== "CONTENT_PROVIDED") {
    return (
      <Layout>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          Content kann nur für Buchungen im Status CONTENT_PENDING oder CONTENT_PROVIDED hochgeladen werden.
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content hochladen</h1>
          <p className="text-gray-600 mt-2">
            {booking.linkSource.name} - {booking.client.brand}
          </p>
        </div>

        {/* Buchungsdetails */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Buchungsdetails</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ziel-URL</label>
              <a
                href={booking.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-900 break-all"
              >
                {booking.targetUrl}
              </a>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anchor-Text</label>
              <p className="text-sm text-gray-900">{booking.anchorText}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veröffentlichungsdatum</label>
              <p className="text-sm text-gray-900">
                {new Date(booking.publicationDate).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <AIContentGenerator bookingId={id} />

        <ContentUpload bookingId={id} userId={user.id} />

        {booking.contentAssets.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bereits hochgeladene Assets</h2>
            <div className="space-y-2">
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
                  <div className="flex gap-3">
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      Download
                    </a>
                    <Link
                      href={`/content/${asset.id}/edit`}
                      className="text-sm text-green-600 hover:text-green-900"
                    >
                      Bearbeiten
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

