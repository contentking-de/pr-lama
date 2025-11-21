import { requireRole } from "@/lib/auth-helpers"
import Layout from "@/components/Layout"
import PublisherForm from "@/components/PublisherForm"

export default async function NewPublisherPage() {
  await requireRole(["ADMIN", "MEMBER"])

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neuer Publisher</h1>
          <p className="text-gray-600 mt-2">Erstelle einen neuen Publisher</p>
        </div>

        <PublisherForm />
      </div>
    </Layout>
  )
}

