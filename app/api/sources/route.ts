import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getSistrixVisibilityIndex } from "@/lib/sistrix"

const sourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  publisherId: z.string().uuid(),
  price: z.number().positive(),
  category: z.string().min(1),
  type: z.string().min(1),
  da: z.number().nullable().optional(),
  dr: z.number().nullable().optional(),
  availability: z.string().min(1),
  description: z.string().nullable().optional(),
  createdBy: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = sourceSchema.parse(body)

    const source = await prisma.linkSource.create({
      data: validatedData,
    })

    // Automatisch Sistrix Sichtbarkeitsindex abrufen (im Hintergrund, ohne das Erstellen zu blockieren)
    try {
      const visibilityIndex = await getSistrixVisibilityIndex(source.url)
      
      if (visibilityIndex !== null) {
        await prisma.linkSource.update({
          where: { id: source.id },
          data: {
            sistrixVisibilityIndex: visibilityIndex,
            sistrixLastUpdated: new Date(),
          },
        })
      }
    } catch (error: any) {
      // Fehler beim Abrufen des Sichtbarkeitsindex nicht kritisch - Linkquelle wurde bereits erstellt
      console.error(`Fehler beim automatischen Abrufen des Sistrix Index für ${source.url}:`, error.message)
    }

    // Lade die aktualisierte Quelle (mit Sistrix Index falls verfügbar)
    const updatedSource = await prisma.linkSource.findUnique({
      where: { id: source.id },
    })

    return NextResponse.json(updatedSource, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const where =
      session.user.role === "PUBLISHER"
        ? { publisherId: session.user.id }
        : {}

    const sources = await prisma.linkSource.findMany({
      where,
      include: {
        publisher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(sources)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

