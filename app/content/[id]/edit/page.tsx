import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import ContentEditForm from "@/components/ContentEditForm"
import AIContentGenerator from "@/components/AIContentGenerator"
import { notFound } from "next/navigation"

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["ADMIN", "MEMBER"])

  const { id } = await params

  const asset = await prisma.contentAsset.findUnique({
    where: { id },
    include: {
      booking: {
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
      },
    },
  })

  if (!asset) {
    notFound()
  }

  // Für Text-Content: Content aus Blob laden
  let content = null
  if (asset.fileType === "text") {
    try {
      const response = await fetch(asset.fileUrl)
      if (response.ok) {
        content = await response.text()
      }
    } catch (error) {
      console.error("Error fetching content from blob:", error)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content bearbeiten</h1>
          <p className="text-gray-600 mt-2">
            {asset.booking.linkSource.name} - {asset.booking.client.brand}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Content bearbeiten</h2>
            <ContentEditForm asset={{ ...asset, content }} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KI-Content generieren</h2>
            <AIContentGenerator bookingId={asset.bookingId} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

