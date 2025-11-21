import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import ContentUploadForm from "@/components/ContentUploadForm"

export default async function NewContentPage() {
  const user = await requireRole(["ADMIN", "MEMBER"])

  // Hole alle Buchungen, die Content benötigen
  const bookings = await prisma.linkBooking.findMany({
    where: {
      status: {
        in: ["CONTENT_PENDING", "CONTENT_PROVIDED"],
      },
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
          domain: true,
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neues Content-Asset</h1>
          <p className="text-gray-600 mt-2">Lade ein neues Content-Asset hoch und ordne es einer Buchung zu</p>
        </div>

        <ContentUploadForm bookings={bookings} userId={user.id} />
      </div>
    </Layout>
  )
}

