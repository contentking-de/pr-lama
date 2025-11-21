import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import ContentUploadForm from "@/components/ContentUploadForm"
import AIContentGenerator from "@/components/AIContentGenerator"

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
          <p className="text-gray-600 mt-2">
            Lade ein neues Content-Asset hoch oder generiere Content mit KI und ordne es einer Buchung zu
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Datei-Upload</h2>
            <ContentUploadForm bookings={bookings} userId={user.id} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KI-Content-Generierung</h2>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        {booking.linkSource.name} - {booking.client.brand}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: {booking.status === "CONTENT_PENDING" ? "Content ausstehend" : "Content bereitgestellt"}
                      </p>
                    </div>
                    <AIContentGenerator bookingId={booking.id} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                Keine Buchungen mit ausstehendem Content gefunden.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

