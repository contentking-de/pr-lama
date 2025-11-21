import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { importCategoriesFromExcel } from "@/lib/import-categories"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await importCategoriesFromExcel()

    return NextResponse.json({
      success: true,
      message: `${categories.length} Kategorien erfolgreich importiert`,
      categories,
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Importieren der Kategorien" },
      { status: 500 }
    )
  }
}

