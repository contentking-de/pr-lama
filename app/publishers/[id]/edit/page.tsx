import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import PublisherForm from "@/components/PublisherForm"
import { notFound } from "next/navigation"

export default async function EditPublisherPage({
  params,
}: {
  params: { id: string }
}) {
  await requireRole(["ADMIN", "MEMBER"])

  const publisher = await prisma.user.findUnique({
    where: { id: params.id },
  })

  if (!publisher || publisher.role !== "PUBLISHER") {
    notFound()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publisher bearbeiten</h1>
          <p className="text-gray-600 mt-2">{publisher.name || publisher.email}</p>
        </div>

        <PublisherForm publisher={publisher} />
      </div>
    </Layout>
  )
}

