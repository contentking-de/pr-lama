import { requireRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import Layout from "@/components/Layout"
import Link from "next/link"
import UpdateSistrixButton from "@/components/UpdateSistrixButton"
import SourceFilters from "@/components/SourceFilters"
import BatchUpdateSistrixButton from "@/components/BatchUpdateSistrixButton"
import BatchGenerateTagsButton from "@/components/BatchGenerateTagsButton"
import SourceRowWithTags from "@/components/SourceRowWithTags"
import Pagination from "@/components/Pagination"

export const dynamic = "force-dynamic"

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const user = await requireRole(["ADMIN", "MEMBER", "PUBLISHER"])

  // Extrahiere Filter-Parameter
  const search = Array.isArray(resolvedSearchParams.search)
    ? resolvedSearchParams.search[0]
    : (resolvedSearchParams.search as string | undefined)
  const category = Array.isArray(resolvedSearchParams.category)
    ? resolvedSearchParams.category[0]
    : (resolvedSearchParams.category as string | undefined)
  const maxPrice = Array.isArray(resolvedSearchParams.maxPrice)
    ? resolvedSearchParams.maxPrice[0]
    : (resolvedSearchParams.maxPrice as string | undefined)
  const minSistrix = Array.isArray(resolvedSearchParams.minSistrix)
    ? resolvedSearchParams.minSistrix[0]
    : (resolvedSearchParams.minSistrix as string | undefined)
  const publisher = Array.isArray(resolvedSearchParams.publisher)
    ? resolvedSearchParams.publisher[0]
    : (resolvedSearchParams.publisher as string | undefined)
  
  // Pagination
  const page = parseInt(
    Array.isArray(resolvedSearchParams.page)
      ? resolvedSearchParams.page[0]
      : (resolvedSearchParams.page as string | undefined) || "1"
  )
  const itemsPerPage = 50
  const skip = (page - 1) * itemsPerPage

  // Baue where-Klausel auf
  const where: any =
    user.role === "PUBLISHER"
      ? { publisherId: user.id }
      : {}

  // Publisher-Filter (nur für ADMIN/MEMBER, Publisher sehen nur eigene)
  if (publisher && user.role !== "PUBLISHER") {
    where.publisherId = publisher
  }

  // Suche nach Name, URL oder Tags
  if (search) {
    // Für Tag-Suche: Prisma unterstützt keine Teilstring-Suche in Arrays direkt
    // Wir verwenden hasSome für exakte Matches
    // Für case-insensitive Suche müssen wir den Suchbegriff normalisieren
    const searchLower = search.toLowerCase()
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { url: { contains: search, mode: "insensitive" } },
      // Tag-Suche: Prisma's hasSome funktioniert nur mit exakten Matches
      // Daher müssen wir alle Sources laden und dann filtern, oder
      // wir verwenden eine Raw Query für bessere Performance
      // Für jetzt: hasSome mit exaktem Match (case-sensitive)
      { tags: { hasSome: [search] } },
    ]
  }

  // Filter nach Kategorie
  if (category) {
    where.category = category
  }

  // Preis-Filter
  if (maxPrice) {
    where.price = {
      lte: parseFloat(maxPrice),
    }
  }

  // Sistrix Sichtbarkeitsindex-Filter
  if (minSistrix) {
    where.sistrixVisibilityIndex = {
      gte: parseInt(minSistrix),
    }
  }

  // Basis-Query für Preis-Berechnung (ohne Filter)
  const baseWhere = user.role === "PUBLISHER" ? { publisherId: user.id } : {}

  // Für Tag-Suche müssen wir alle Sources laden und dann filtern,
  // da Prisma keine contains für Array-Elemente unterstützt
  const whereWithoutSearch = { ...where }
  delete whereWithoutSearch.OR

  // Lade alle Sources (ohne Pagination, wenn nach Tags gesucht wird)
  const allSourcesQuery = prisma.linkSource.findMany({
    where: search
      ? {
          ...whereWithoutSearch,
          // Suche nur nach Name/URL in Prisma, Tags filtern wir manuell
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { url: { contains: search, mode: "insensitive" } },
          ],
        }
      : where,
    include: {
      publisher: {
        select: {
          name: true,
          email: true,
        },
      },
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Wenn nach Tags gesucht wird, müssen wir alle laden und filtern
  let allSources = await allSourcesQuery
  if (search) {
    const searchLower = search.toLowerCase()
    allSources = allSources.filter((source) => {
      // Prüfe Name und URL (bereits gefiltert durch Prisma)
      const matchesNameOrUrl =
        source.name.toLowerCase().includes(searchLower) ||
        source.url.toLowerCase().includes(searchLower)

      // Prüfe Tags (case-insensitive Teilstring-Suche)
      const matchesTags =
        source.tags &&
        source.tags.length > 0 &&
        source.tags.some((tag) => tag.toLowerCase().includes(searchLower))

      return matchesNameOrUrl || matchesTags
    })
  }

  // Pagination nach Filterung
  const totalSourcesFiltered = allSources.length
  const paginatedSources = allSources.slice(skip, skip + itemsPerPage)

  const [categories, publishers, priceRange, sistrixRange, totalSourcesCount] = await Promise.all([
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        name: true,
      },
    }).catch(() => []),
    // Hole alle Publisher für Filter (nur für ADMIN/MEMBER)
    user.role === "ADMIN" || user.role === "MEMBER"
      ? prisma.user.findMany({
          where: {
            role: "PUBLISHER",
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      : Promise.resolve([]),
    // Berechne Min/Max Preis für Slider
    (async () => {
      const prices = await prisma.linkSource.findMany({
        where: baseWhere,
        select: {
          price: true,
        },
      })
      if (prices.length === 0) {
        return { min: 0, max: 1000 }
      }
      const priceValues = prices.map((p) => parseFloat(p.price.toString()))
      return {
        min: Math.floor(Math.min(...priceValues)),
        max: Math.ceil(Math.max(...priceValues)),
      }
    })(),
    // Berechne Min/Max Sistrix Index für Slider
    (async () => {
      try {
        const sistrixValues = await prisma.linkSource.findMany({
          where: {
            ...baseWhere,
            sistrixVisibilityIndex: { not: null },
          },
          select: {
            sistrixVisibilityIndex: true,
          },
        })
        if (sistrixValues.length === 0) {
          return { min: 0, max: 10000 } // Standard-Werte (0.0000 - 1.0000)
        }
        const sistrixIndexes = sistrixValues
          .map((s) => s.sistrixVisibilityIndex)
          .filter((v): v is number => v !== null)
        if (sistrixIndexes.length === 0) {
          return { min: 0, max: 10000 }
        }
        return {
          min: Math.floor(Math.min(...sistrixIndexes)),
          max: Math.ceil(Math.max(...sistrixIndexes)),
        }
      } catch (error) {
        console.error("Fehler beim Berechnen der Sistrix Range:", error)
        return { min: 0, max: 10000 }
      }
    })(),
    // Gesamtzahl aller Sources (für Batch-Update Button)
    prisma.linkSource.count({
      where: baseWhere,
    }),
  ])

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Linkquellen</h1>
            <p className="text-gray-600 mt-2">
              {user.role === "PUBLISHER"
                ? "Deine Linkquellen verwalten"
                : "Alle Linkquellen verwalten"}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {(user.role === "ADMIN" || user.role === "MEMBER") && (
              <>
                <BatchGenerateTagsButton totalSources={totalSourcesCount} />
                <BatchUpdateSistrixButton totalSources={totalSourcesCount} />
              </>
            )}
            <Link
              href="/sources/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Neue Linkquelle
            </Link>
          </div>
        </div>

        {/* Filter */}
        <SourceFilters 
          categories={categories.map((c) => c.name)} 
          priceRange={priceRange}
          sistrixRange={sistrixRange}
          publishers={publishers}
        />

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publisher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verfügbarkeit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sistrix Index
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSources.map((source) => (
                <SourceRowWithTags
                  key={source.id}
                  source={{
                    ...source,
                    price: parseFloat(source.price.toString()),
                  }}
                  userRole={user.role}
                  userId={user.id}
                />
              ))}
            </tbody>
          </table>
          {paginatedSources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Linkquellen gefunden.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalSourcesFiltered > 0 && (
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalSourcesFiltered / itemsPerPage)}
            totalItems={totalSourcesFiltered}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </Layout>
  )
}

