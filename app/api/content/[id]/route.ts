import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put, del } from "@vercel/blob"
import { z } from "zod"

const updateContentSchema = z.object({
  fileName: z.string().min(1).optional(),
  content: z.string().optional(), // Für Text-Content
  file: z.any().optional(), // Für Datei-Ersetzung
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER" && session.user.role !== "REDAKTEUR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const asset = await prisma.contentAsset.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            linkSource: {
              select: {
                name: true,
              },
            },
            client: {
              select: {
                brand: true,
              },
            },
          },
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: "Content asset not found" }, { status: 404 })
    }

    // Für Text-Content: Content aus Blob laden
    let content = null
    if (asset.fileType === "text") {
      try {
        const response = await fetch(asset.fileUrl)
        if (response.ok) {
          content = await response.text()
        }
      } catch (error) {
        console.error("Error fetching content from blob:", error)
      }
    }

    return NextResponse.json({
      ...asset,
      content,
    })
  } catch (error: any) {
    console.error("Get content asset error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER" && session.user.role !== "REDAKTEUR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN nicht konfiguriert" },
        { status: 500 }
      )
    }

    const { id } = await params

    const asset = await prisma.contentAsset.findUnique({
      where: { id },
    })

    if (!asset) {
      return NextResponse.json({ error: "Content asset not found" }, { status: 404 })
    }

    // Prüfe ob Content-Type JSON oder FormData ist
    const contentType = req.headers.get("content-type") || ""
    let updateData: any = {}

    if (contentType.includes("application/json")) {
      const body = await req.json()
      const validated = updateContentSchema.parse(body)
      updateData = validated
    } else {
      // FormData für Datei-Upload
      const formData = await req.formData()
      const file = formData.get("file") as File | null
      const fileName = formData.get("fileName") as string | null
      const content = formData.get("content") as string | null

      if (file) {
        updateData.file = file
      }
      if (fileName) {
        updateData.fileName = fileName
      }
      if (content) {
        updateData.content = content
      }
    }

    let newFileUrl = asset.fileUrl
    let newFileName = asset.fileName

    // Wenn Content geändert wird (für Text-Content)
    if (updateData.content !== undefined && asset.fileType === "text") {
      // Alte Datei aus Blob löschen
      try {
        await del(asset.fileUrl, { token: process.env.BLOB_READ_WRITE_TOKEN })
      } catch (error) {
        console.error("Error deleting old blob:", error)
        // Weiter machen, auch wenn Löschen fehlschlägt
      }

      // Neue Datei in Blob speichern
      const timestamp = Date.now()
      const sanitizedFileName = (updateData.fileName || asset.fileName).replace(/[^a-zA-Z0-9.-]/g, "_")
      const blobFileName = `content/${asset.bookingId}/${timestamp}-${sanitizedFileName}.txt`

      const blob = await put(blobFileName, updateData.content, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: "text/plain",
      })

      newFileUrl = blob.url
      newFileName = `${sanitizedFileName}.txt`
    }

    // Wenn Datei ersetzt wird
    if (updateData.file) {
      // Alte Datei aus Blob löschen
      try {
        await del(asset.fileUrl, { token: process.env.BLOB_READ_WRITE_TOKEN })
      } catch (error) {
        console.error("Error deleting old blob:", error)
      }

      // Neue Datei in Blob speichern
      const timestamp = Date.now()
      const sanitizedFileName = updateData.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const blobFileName = `content/${asset.bookingId}/${timestamp}-${sanitizedFileName}`

      const blob = await put(blobFileName, updateData.file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      newFileUrl = blob.url
      newFileName = updateData.file.name

      // Dateityp aktualisieren
      const fileType = updateData.file.type.startsWith("image/")
        ? "image"
        : updateData.file.type === "application/pdf"
        ? "pdf"
        : "text"
      
      await prisma.contentAsset.update({
        where: { id },
        data: {
          fileName: newFileName,
          fileUrl: newFileUrl,
          fileType,
        },
      })
    } else {
      // Nur Dateiname aktualisieren
      await prisma.contentAsset.update({
        where: { id },
        data: {
          fileName: updateData.fileName || newFileName,
          fileUrl: newFileUrl,
        },
      })
    }

    const updatedAsset = await prisma.contentAsset.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            linkSource: {
              select: {
                name: true,
              },
            },
            client: {
              select: {
                brand: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedAsset)
  } catch (error: any) {
    console.error("Update content asset error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

