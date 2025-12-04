import Layout from "@/components/Layout"
import PublisherRegisterForm from "@/components/PublisherRegisterForm"

export default function PublisherRegisterPage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Publisher Registrierung</h1>
          <p className="text-gray-600 mt-2">
            Registriere dich als Publisher. Nach der Registrierung musst du von einem Administrator freigeschaltet werden, bevor du dich anmelden kannst.
          </p>
        </div>

        <PublisherRegisterForm />
      </div>
    </Layout>
  )
}


