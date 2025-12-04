import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import BookingsChart from "@/components/BookingsChart"
import ContentStatusChart from "@/components/ContentStatusChart"
import { getCountryFlag } from "@/lib/countryFlags"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Statistiken basierend auf Rolle
  let stats: {
    totalSources?: number
    totalClients?: number
    totalBookings?: number
    pendingBookings?: number
    totalPublishers?: number
    bookingsData?: { date: string; count: number }[]
    contentData?: { name: string; pending: number; provided: number }[]
    countryBreakdown?: { country: string | null; count: number }[]
    tagCloud?: { tag: string; count: number }[]
    mySources?: number
    myBookings?: number
    pendingRequests?: number
  } = {}
  
  if (user.role === "ADMIN" || user.role === "MEMBER") {
    const [
      totalSources,
      totalClients,
      totalBookings,
      pendingBookings,
      totalPublishers,
      bookingsData,
      contentData,
      countryBreakdown,
      tagCloud,
    ] = await Promise.all([
      prisma.linkSource.count(),
      prisma.client.count(),
      prisma.linkBooking.count(),
      prisma.linkBooking.count({ where: { status: "REQUESTED" } }),
      prisma.user.count({ where: { role: "PUBLISHER" } }),
      // Buchungen im zeitlichen Verlauf (letzte 12 Monate)
      (async () => {
        const now = new Date()
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        
        const bookings = await prisma.linkBooking.findMany({
          where: {
            createdAt: {
              gte: twelveMonthsAgo,
            },
          },
          select: {
            createdAt: true,
          },
        })

        // Gruppiere nach Monat
        const monthlyData: Record<string, number> = {}
        bookings.forEach((booking) => {
          const date = new Date(booking.createdAt)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
        })

        // Erstelle Array für die letzten 12 Monate
        const result = []
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          const monthName = date.toLocaleDateString("de-DE", { month: "short", year: "numeric" })
          result.push({
            date: monthName,
            count: monthlyData[monthKey] || 0,
          })
        }
        return result
      })(),
      // Content nach Status
      (async () => {
        const pending = await prisma.linkBooking.count({
          where: { status: "CONTENT_PENDING" },
        })
        const provided = await prisma.linkBooking.count({
          where: { status: "CONTENT_PROVIDED" },
        })
        return [
          { name: "Content Status", pending, provided },
        ]
      })(),
      // Länder-Breakdown
      (async () => {
        const sources = await prisma.linkSource.findMany({
          select: {
            country: true,
          },
        })
        
        // Gruppiere nach Land
        const countryCounts: Record<string, number> = {}
        sources.forEach((source) => {
          const country = source.country || "Ohne Land"
          countryCounts[country] = (countryCounts[country] || 0) + 1
        })
        
        // Konvertiere zu Array und sortiere nach Anzahl (absteigend)
        return Object.entries(countryCounts)
          .map(([country, count]) => ({
            country: country === "Ohne Land" ? null : country,
            count,
          }))
          .sort((a, b) => b.count - a.count)
      })(),
      // Tag-Cloud
      (async () => {
        const sources = await prisma.linkSource.findMany({
          select: {
            tags: true,
          },
        })
        
        // Sammle alle Tags und zähle Vorkommen
        const tagCounts: Record<string, number> = {}
        sources.forEach((source) => {
          if (source.tags && source.tags.length > 0) {
            source.tags.forEach((tag) => {
              const normalizedTag = tag.trim()
              if (normalizedTag) {
                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1
              }
            })
          }
        })
        
        // Konvertiere zu Array und sortiere nach Anzahl (absteigend)
        // Begrenze auf Top 50 Tags
        return Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 50)
      })(),
    ])
    
    stats = {
      totalSources,
      totalClients,
      totalBookings,
      pendingBookings,
      totalPublishers,
      bookingsData,
      contentData,
      countryBreakdown,
      tagCloud,
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
  } else if (user.role === "REDAKTEUR") {
    const [contentPending, contentProvided] = await Promise.all([
      prisma.linkBooking.count({ where: { status: "CONTENT_PENDING" } }),
      prisma.linkBooking.count({ where: { status: "CONTENT_PROVIDED" } }),
    ])
    
    stats = {
      contentData: [
        { name: "Content Status", pending: contentPending, provided: contentProvided },
      ],
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
                value={stats.totalSources || 0}
                description="Gesamt"
                href="/sources"
              />
              <StatCard
                title="Publisher"
                value={stats.totalPublishers || 0}
                description="Gesamt"
                href="/publishers"
              />
              <StatCard
                title="Buchungen"
                value={stats.totalBookings || 0}
                description="Gesamt"
                href="/bookings"
              />
              <StatCard
                title="Offene Anfragen"
                value={stats.pendingBookings || 0}
                description="Warten auf Publisher"
                href="/bookings?status=REQUESTED"
              />
            </>
          ) : user.role === "REDAKTEUR" ? (
            <>
              <StatCard
                title="Content ausstehend"
                value={stats.contentData?.[0]?.pending || 0}
                description="Benötigt Content"
                href="/content"
              />
              <StatCard
                title="Content bereitgestellt"
                value={stats.contentData?.[0]?.provided || 0}
                description="Bereit für Veröffentlichung"
                href="/content"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Meine Linkquellen"
                value={stats.mySources || 0}
                description="Gesamt"
                href="/sources"
              />
              <StatCard
                title="Meine Buchungen"
                value={stats.myBookings || 0}
                description="Gesamt"
                href="/bookings"
              />
              <StatCard
                title="Offene Anfragen"
                value={stats.pendingRequests || 0}
                description="Warten auf Akzeptanz"
                href="/bookings?status=REQUESTED"
              />
            </>
          )}
        </div>

        {/* Charts für ADMIN/MEMBER und REDAKTEUR */}
        {(user.role === "ADMIN" || user.role === "MEMBER" || user.role === "REDAKTEUR") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Buchungen im zeitlichen Verlauf - nur für ADMIN/MEMBER */}
            {(user.role === "ADMIN" || user.role === "MEMBER") && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Buchungen im zeitlichen Verlauf
                </h2>
                {stats.bookingsData && stats.bookingsData.length > 0 ? (
                  <BookingsChart data={stats.bookingsData} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Keine Daten verfügbar
                  </div>
                )}
              </div>
            )}

            {/* Content Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Status</h2>
              {stats.contentData && stats.contentData.length > 0 ? (
                <ContentStatusChart data={stats.contentData} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Keine Daten verfügbar
                </div>
              )}
            </div>
          </div>
        )}

        {/* Länder-Breakdown - nur für ADMIN/MEMBER */}
        {(user.role === "ADMIN" || user.role === "MEMBER") && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Linkquellen nach Ländern
              </h2>
              {stats.countryBreakdown && stats.countryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {stats.countryBreakdown.map((item) => {
                    const countryFlag = getCountryFlag(item.country)
                    const countryName = item.country || "Ohne Land"
                    const percentage = stats.totalSources
                      ? ((item.count / stats.totalSources) * 100).toFixed(1)
                      : "0"
                    
                    return (
                      <div key={countryName} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <span className="text-2xl">{countryFlag || "-"}</span>
                          <span className="text-sm font-medium text-gray-900">{countryName}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="text-sm font-semibold text-gray-900 min-w-[60px] text-right">
                              {item.count}
                            </div>
                            <div className="text-sm text-gray-500 min-w-[50px] text-right">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Keine Daten verfügbar
                </div>
              )}
            </div>

            {/* Tag-Cloud - nur für ADMIN/MEMBER */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tag-Cloud
              </h2>
              {stats.tagCloud && stats.tagCloud.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const tagCloud = stats.tagCloud
                    const maxCount = tagCloud[0].count
                    const minCount = tagCloud[tagCloud.length - 1].count
                    const range = maxCount - minCount || 1
                    
                    return tagCloud.map((item) => {
                      // Berechne Schriftgröße basierend auf Häufigkeit
                      // Min: 0.75rem, Max: 1.5rem
                      const size = 0.75 + ((item.count - minCount) / range) * 0.75
                      
                      // Berechne Opacity basierend auf Häufigkeit
                      const opacity = 0.6 + ((item.count - minCount) / range) * 0.4
                    
                      return (
                        <a
                          key={item.tag}
                          href={`/sources?search=${encodeURIComponent(item.tag)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
                          style={{
                            fontSize: `${size}rem`,
                            opacity: opacity,
                          }}
                          title={`${item.count} Linkquelle${item.count !== 1 ? "n" : ""}`}
                        >
                          <span className="text-purple-800 font-medium">{item.tag}</span>
                          <span className="text-purple-600 text-xs">({item.count})</span>
                        </a>
                      )
                    })
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Keine Tags verfügbar
                </div>
              )}
            </div>
          </>
        )}

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
            {user.role === "REDAKTEUR" && (
              <>
                <QuickLink href="/content" title="Content verwalten" />
                <QuickLink href="/content/new" title="Neues Content-Asset" />
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

