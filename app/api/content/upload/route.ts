import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const bookingId = formData.get("bookingId") as string
    const userId = formData.get("userId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Buchung prüfen
    const booking = await prisma.linkBooking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status !== "CONTENT_PENDING") {
      return NextResponse.json(
        { error: "Content can only be uploaded for bookings in CONTENT_PENDING status" },
        { status: 400 }
      )
    }

    // Datei speichern
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload-Verzeichnis erstellen
    const uploadDir = join(process.cwd(), "public", "uploads", bookingId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Dateiname generieren (mit Timestamp um Duplikate zu vermeiden)
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    // Dateityp bestimmen
    const fileType = file.type.startsWith("image/")
      ? "image"
      : file.type === "application/pdf"
      ? "pdf"
      : "text"

    // In Datenbank speichern
    const contentAsset = await prisma.contentAsset.create({
      data: {
        bookingId,
        fileName: file.name,
        fileUrl: `/uploads/${bookingId}/${fileName}`,
        fileType,
        uploadedBy: userId,
      },
    })

    return NextResponse.json(contentAsset, { status: 201 })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

