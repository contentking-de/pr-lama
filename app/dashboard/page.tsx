import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Statistiken basierend auf Rolle
  let stats = {}
  
  if (user.role === "ADMIN" || user.role === "MEMBER") {
    const [totalSources, totalClients, totalBookings, pendingBookings] = await Promise.all([
      prisma.linkSource.count(),
      prisma.client.count(),
      prisma.linkBooking.count(),
      prisma.linkBooking.count({ where: { status: "REQUESTED" } }),
    ])
    
    stats = {
      totalSources,
      totalClients,
      totalBookings,
      pendingBookings,
    }
  } else if (user.role === "PUBLISHER") {
    const [mySources, myBookings, pendingRequests] = await Promise.all([
      prisma.linkSource.count({ where: { publisherId: user.id } }),
      prisma.linkBooking.count({
        where: {
          linkSource: {
            publisherId: user.id,
          },
        },
      }),
      prisma.linkBooking.count({
        where: {
          linkSource: {
            publisherId: user.id,
          },
          status: "REQUESTED",
        },
      }),
    ])
    
    stats = {
      mySources,
      myBookings,
      pendingRequests,
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Willkommen zurück, {user.name || user.email}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {user.role === "ADMIN" || user.role === "MEMBER" ? (
            <>
              <StatCard
                title="Linkquellen"
                value={stats.totalSources}
                description="Gesamt"
                href="/sources"
              />
              <StatCard
                title="Kunden"
                value={stats.totalClients}
                description="Gesamt"
                href="/clients"
              />
              <StatCard
                title="Buchungen"
                value={stats.totalBookings}
                description="Gesamt"
                href="/bookings"
              />
              <StatCard
                title="Offene Anfragen"
                value={stats.pendingBookings}
                description="Warten auf Publisher"
                href="/bookings?status=REQUESTED"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Meine Linkquellen"
                value={stats.mySources}
                description="Gesamt"
                href="/sources"
              />
              <StatCard
                title="Meine Buchungen"
                value={stats.myBookings}
                description="Gesamt"
                href="/bookings"
              />
              <StatCard
                title="Offene Anfragen"
                value={stats.pendingRequests}
                description="Warten auf Akzeptanz"
                href="/bookings?status=REQUESTED"
              />
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schnellzugriff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(user.role === "ADMIN" || user.role === "MEMBER") && (
              <>
                <QuickLink href="/sources/new" title="Neue Linkquelle" />
                <QuickLink href="/clients/new" title="Neuer Kunde" />
                <QuickLink href="/bookings/new" title="Neue Buchung" />
              </>
            )}
            {user.role === "PUBLISHER" && (
              <QuickLink href="/bookings?status=REQUESTED" title="Anfragen prüfen" />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({
  title,
  value,
  description,
  href,
}: {
  title: string
  value: number
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </a>
  )
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <a
      href={href}
      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="font-medium text-gray-900">{title}</span>
    </a>
  )
}

