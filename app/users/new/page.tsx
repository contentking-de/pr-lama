import { requireRole } from "@/lib/auth-helpers"
import Layout from "@/components/Layout"
import UserForm from "@/components/UserForm"

export default async function NewUserPage() {
  await requireRole(["ADMIN"])

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neuer Nutzer</h1>
          <p className="text-gray-600 mt-2">Erstelle einen neuen Nutzer</p>
        </div>

        <UserForm />
      </div>
    </Layout>
  )
}

