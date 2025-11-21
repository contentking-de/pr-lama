import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"
import DeleteUserButton from "@/components/DeleteUserButton"

export default async function UsersPage() {
  const user = await requireAuth()
  
  if (user.role !== "ADMIN") {
    return null
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    MEMBER: "bg-blue-100 text-blue-800",
    PUBLISHER: "bg-green-100 text-green-800",
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nutzer-Verwaltung</h1>
            <p className="text-gray-600 mt-2">Alle Nutzer verwalten</p>
          </div>
          <Link
            href="/users/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Neuer Nutzer
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-Mail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstellt am
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {userItem.name || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{userItem.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        roleColors[userItem.role] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userItem.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(userItem.createdAt).toLocaleDateString("de-DE")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-4">
                      <Link
                        href={`/users/${userItem.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Bearbeiten
                      </Link>
                      <DeleteUserButton
                        userId={userItem.id}
                        userEmail={userItem.email}
                        currentUserId={user.id}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Nutzer gefunden.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

