import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import ContentUpload from "@/components/ContentUpload"
import { notFound } from "next/navigation"

export default async function ContentPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireRole(["ADMIN", "MEMBER"])

  const booking = await prisma.linkBooking.findUnique({
    where: { id: params.id },
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

  if (booking.status !== "CONTENT_PENDING") {
    return (
      <Layout>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          Diese Buchung ist nicht im Status CONTENT_PENDING. Content kann nur für Buchungen im
          Status CONTENT_PENDING hochgeladen werden.
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

        <ContentUpload bookingId={params.id} userId={user.id} />

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
          </div>
        )}
      </div>
    </Layout>
  )
}

