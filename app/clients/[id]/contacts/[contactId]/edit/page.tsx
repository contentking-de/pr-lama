import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import ContactForm from "@/components/ContactForm"
import { notFound } from "next/navigation"

export default async function EditContactPage({
  params,
}: {
  params: { id: string; contactId: string }
}) {
  await requireRole(["ADMIN", "MEMBER"])

  const contact = await prisma.contactPerson.findUnique({
    where: { id: params.contactId },
    include: {
      client: true,
    },
  })

  if (!contact || contact.clientId !== params.id) {
    notFound()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ansprechpartner bearbeiten</h1>
          <p className="text-gray-600 mt-2">{contact.name} - {contact.client.brand}</p>
        </div>

        <ContactForm clientId={params.id} contact={contact} />
      </div>
    </Layout>
  )
}

