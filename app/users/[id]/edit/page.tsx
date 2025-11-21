import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import UserForm from "@/components/UserForm"
import { notFound } from "next/navigation"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["ADMIN"])

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    notFound()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nutzer bearbeiten</h1>
          <p className="text-gray-600 mt-2">{user.name || user.email}</p>
        </div>

        <UserForm user={user} />
      </div>
    </Layout>
  )
}

