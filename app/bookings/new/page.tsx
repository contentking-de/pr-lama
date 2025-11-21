import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import BookingForm from "@/components/BookingForm"

export default async function NewBookingPage() {
  const user = await requireRole(["ADMIN", "MEMBER"])

  const [sources, clients] = await Promise.all([
    prisma.linkSource.findMany({
      include: {
        publisher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.client.findMany({
      orderBy: {
        brand: "asc",
      },
    }),
  ])

  // Serialisiere sources für Client Component (konvertiere Decimal zu number)
  const serializedSources = sources.map((source) => ({
    ...source,
    price: parseFloat(source.price.toString()),
  }))

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neue Linkbuchung</h1>
          <p className="text-gray-600 mt-2">Erstelle eine neue Linkbuchung</p>
        </div>

        <BookingForm sources={serializedSources} clients={clients} userId={user.id} />
      </div>
    </Layout>
  )
}

