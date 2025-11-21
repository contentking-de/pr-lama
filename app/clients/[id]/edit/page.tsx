import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import ClientForm from "@/components/ClientForm"
import { notFound } from "next/navigation"

export default async function EditClientPage({
  params,
}: {
  params: { id: string }
}) {
  await requireRole(["ADMIN", "MEMBER"])

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      contactPersons: true,
    },
  })

  if (!client) {
    notFound()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kunde bearbeiten</h1>
          <p className="text-gray-600 mt-2">{client.brand}</p>
        </div>

        <ClientForm client={client} />
      </div>
    </Layout>
  )
}

