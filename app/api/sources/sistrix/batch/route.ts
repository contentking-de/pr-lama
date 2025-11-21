import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSistrixVisibilityIndex } from "@/lib/sistrix"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prüfe ob SISTRIX_API_KEY gesetzt ist
    if (!process.env.SISTRIX_API_KEY) {
      return NextResponse.json(
        { error: "SISTRIX_API_KEY ist nicht konfiguriert" },
        { status: 500 }
      )
    }

    // Hole alle Sources
    const sources = await prisma.linkSource.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        sistrixVisibilityIndex: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    let updated = 0
    let skipped = 0
    let errors = 0
    let unchanged = 0

    // Rate limiting: Warte zwischen API-Calls (z.B. 1 Sekunde)
    const delayBetweenCalls = 1000 // 1 Sekunde

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]

      try {
        // Hole neuen Sichtbarkeitsindex
        const visibilityIndex = await getSistrixVisibilityIndex(source.url)

        if (visibilityIndex === null) {
          skipped++
          continue
        }

        // Prüfe ob sich der Wert geändert hat
        if (source.sistrixVisibilityIndex === visibilityIndex) {
          unchanged++
        } else {
          // Aktualisiere Source
          await prisma.linkSource.update({
            where: { id: source.id },
            data: {
              sistrixVisibilityIndex: visibilityIndex,
              sistrixLastUpdated: new Date(),
            },
          })
          updated++
        }

        // Rate limiting: Warte zwischen API-Calls (außer beim letzten)
        if (i < sources.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenCalls))
        }
      } catch (error: any) {
        errors++

        // Bei API-Fehlern (z.B. Rate Limit) länger warten
        if (error.message.includes("429") || error.message.includes("rate limit")) {
          await new Promise((resolve) => setTimeout(resolve, 10000))
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: sources.length,
      updated,
      unchanged,
      skipped,
      errors,
    })
  } catch (error: any) {
    console.error("Sistrix Batch Update error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Batch-Update der Sichtbarkeitsindizes" },
      { status: 500 }
    )
  }
}

