import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import ContactForm from "@/components/ContactForm"
import { notFound } from "next/navigation"

export default async function NewContactPage({
  params,
}: {
  params: { id: string }
}) {
  await requireRole(["ADMIN", "MEMBER"])

  const client = await prisma.client.findUnique({
    where: { id: params.id },
  })

  if (!client) {
    notFound()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neuer Ansprechpartner</h1>
          <p className="text-gray-600 mt-2">Für {client.brand}</p>
        </div>

        <ContactForm clientId={params.id} />
      </div>
    </Layout>
  )
}

