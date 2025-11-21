import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import SourceForm from "@/components/SourceForm"

export default async function NewSourcePage() {
  const user = await requireRole(["ADMIN", "MEMBER"])

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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neue Linkquelle</h1>
          <p className="text-gray-600 mt-2">Erstelle eine neue Linkquelle</p>
        </div>

        <SourceForm publishers={publishers} userId={user.id} />
      </div>
    </Layout>
  )
}

