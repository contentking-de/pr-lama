import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import SourceForm from "@/components/SourceForm"
import { notFound } from "next/navigation"

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()

  const { id } = await params

  const source = await prisma.linkSource.findUnique({
    where: { id },
  })

  if (!source) {
    notFound()
  }

  // Publisher können nur eigene Quellen bearbeiten
  if (user.role === "PUBLISHER" && source.publisherId !== user.id) {
    notFound()
  }

  // ADMIN und MEMBER können alle bearbeiten
  if (user.role !== "ADMIN" && user.role !== "MEMBER" && source.publisherId !== user.id) {
    notFound()
  }

  const publishers = await prisma.user.findMany({
    where: {
      role: "PUBLISHER",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  // Serialisiere source für Client Component (konvertiere Decimal zu number)
  const serializedSource = {
    ...source,
    price: parseFloat(source.price.toString()),
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Linkquelle bearbeiten</h1>
          <p className="text-gray-600 mt-2">{source.name}</p>
        </div>

        <SourceForm publishers={publishers} userId={user.id} source={serializedSource} />
      </div>
    </Layout>
  )
}

