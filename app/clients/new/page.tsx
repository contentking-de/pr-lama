import { requireRole } from "@/lib/auth-helpers"
import Layout from "@/components/Layout"
import ClientForm from "@/components/ClientForm"

export default async function NewClientPage() {
  await requireRole(["ADMIN", "MEMBER"])

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neuer Kunde</h1>
          <p className="text-gray-600 mt-2">Erstelle einen neuen Kunden</p>
        </div>

        <ClientForm />
      </div>
    </Layout>
  )
}

