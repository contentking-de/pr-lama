import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { sendContentProvidedNotificationEmail, sendBriefingEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER" && session.user.role !== "REDAKTEUR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const bookingId = formData.get("bookingId") as string
    const userId = formData.get("userId") as string
    const isBriefing = formData.get("isBriefing") === "true"
    const briefingRecipientType = formData.get("briefingRecipientType") as "PUBLISHER" | "REDAKTEUR" | null
    const briefingRecipientId = formData.get("briefingRecipientId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Buchung mit allen benötigten Daten laden
    const booking = await prisma.linkBooking.findUnique({
      where: { id: bookingId },
      include: {
        linkSource: {
          include: {
            publisher: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        client: {
          select: {
            brand: true,
            domain: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status !== "CONTENT_PENDING" && booking.status !== "CONTENT_PROVIDED") {
      return NextResponse.json(
        { error: "Content can only be uploaded for bookings in CONTENT_PENDING or CONTENT_PROVIDED status" },
        { status: 400 }
      )
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN nicht konfiguriert" },
        { status: 500 }
      )
    }

    // Dateiname generieren (mit Timestamp um Duplikate zu vermeiden)
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const blobFileName = `content/${bookingId}/${timestamp}-${sanitizedFileName}`

    // Datei in Vercel Blob speichern
    const blob = await put(blobFileName, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Dateityp bestimmen
    const fileType = file.type.startsWith("image/")
      ? "image"
      : file.type === "application/pdf"
      ? "pdf"
      : "text"

    // Für Briefings: Content aus Datei lesen (nur für Text-Dateien)
    let briefingContent = ""
    if (isBriefing && fileType === "text") {
      try {
        briefingContent = await file.text()
      } catch (error) {
        console.error("Error reading briefing content from file:", error)
      }
    }

    // In Datenbank speichern
    const contentAsset = await prisma.contentAsset.create({
      data: {
        bookingId,
        fileName: file.name,
        fileUrl: blob.url,
        fileType,
        uploadedBy: userId,
      },
    })

    // Status auf CONTENT_PROVIDED setzen, wenn noch nicht gesetzt
    const wasContentPending = booking.status === "CONTENT_PENDING"
    if (wasContentPending) {
      await prisma.linkBooking.update({
        where: { id: bookingId },
        data: {
          status: "CONTENT_PROVIDED",
          contentCompletedBy: userId,
        },
      })

      // E-Mail an Publisher senden (nur wenn Status geändert wurde)
      try {
        const contentProvider = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
          },
        })

        if (contentProvider) {
          await sendContentProvidedNotificationEmail({
            publisherEmail: booking.linkSource.publisher.email,
            publisherName: booking.linkSource.publisher.name,
            bookingId: booking.id,
            linkSourceName: booking.linkSource.name,
            linkSourceUrl: booking.linkSource.url,
            clientBrand: booking.client.brand,
            clientDomain: booking.client.domain,
            targetUrl: booking.targetUrl,
            anchorText: booking.anchorText,
            publicationDate: booking.publicationDate,
            contentProviderName: contentProvider.name,
            contentProviderEmail: contentProvider.email,
            fileName: file.name,
          })
        }
      } catch (emailError: any) {
        // E-Mail-Fehler nicht kritisch - Content wurde bereits hochgeladen
        console.error("Fehler beim Senden der Content-Benachrichtigung:", emailError.message)
      }
    }

    // Wenn es ein Briefing ist, Briefing-E-Mail senden
    if (isBriefing && briefingRecipientType) {
      try {
        let recipientEmail = ""
        let recipientName: string | null = null
        let recipientType: "PUBLISHER" | "REDAKTEUR" = "PUBLISHER"

        if (briefingRecipientType === "REDAKTEUR" && briefingRecipientId) {
          // Redakteur laden
          const redakteur = await prisma.user.findUnique({
            where: { id: briefingRecipientId },
            select: {
              email: true,
              name: true,
            },
          })

          if (redakteur) {
            recipientEmail = redakteur.email
            recipientName = redakteur.name
            recipientType = "REDAKTEUR"
          } else {
            throw new Error("Redakteur nicht gefunden")
          }
        } else {
          // Publisher verwenden
          recipientEmail = booking.linkSource.publisher.email
          recipientName = booking.linkSource.publisher.name
          recipientType = "PUBLISHER"
        }

        // Content für Briefing-E-Mail verwenden (falls verfügbar, sonst Dateiname)
        const contentForEmail = briefingContent || `Briefing-Datei: ${file.name}`

        await sendBriefingEmail({
          recipientEmail,
          recipientName,
          recipientType,
          bookingId: booking.id,
          linkSourceName: booking.linkSource.name,
          linkSourceUrl: booking.linkSource.url,
          clientBrand: booking.client.brand,
          clientDomain: booking.client.domain,
          targetUrl: booking.targetUrl,
          anchorText: booking.anchorText,
          publicationDate: booking.publicationDate,
          briefingContent: contentForEmail,
          contentAssetId: contentAsset.id,
        })
      } catch (emailError: any) {
        // E-Mail-Fehler nicht kritisch - Content wurde bereits hochgeladen
        console.error("Fehler beim Senden der Briefing-E-Mail:", emailError.message)
      }
    }

    return NextResponse.json(contentAsset, { status: 201 })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

