import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSistrixVisibilityIndex } from "@/lib/sistrix"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const source = await prisma.linkSource.findUnique({
      where: { id },
    })

    if (!source) {
      return NextResponse.json({ error: "Link source not found" }, { status: 404 })
    }

    // Hole Sichtbarkeitsindex von Sistrix API
    const visibilityIndex = await getSistrixVisibilityIndex(source.url)

    // Aktualisiere Linkquelle mit dem neuen Sichtbarkeitsindex
    const updatedSource = await prisma.linkSource.update({
      where: { id },
      data: {
        sistrixVisibilityIndex: visibilityIndex,
        sistrixLastUpdated: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      visibilityIndex,
      source: updatedSource,
    })
  } catch (error: any) {
    console.error("Sistrix API error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Abrufen des Sichtbarkeitsindex" },
      { status: 500 }
    )
  }
}

