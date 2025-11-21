import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { z } from "zod"
import { sendContentProvidedNotificationEmail } from "@/lib/email"

const saveGeneratedContentSchema = z.object({
  bookingId: z.string().uuid(),
  content: z.string().min(1),
  fileName: z.string().optional(), // Optional, wird automatisch generiert
  contentType: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN nicht konfiguriert" },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { bookingId, content, fileName, contentType = "article" } = saveGeneratedContentSchema.parse(body)

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
        { error: "Content can only be saved for bookings in CONTENT_PENDING or CONTENT_PROVIDED status" },
        { status: 400 }
      )
    }

    // Publisher-Namen für Dateinamen sanitizen
    const publisherName = booking.linkSource.publisher.name || "Unknown"
    const sanitizedPublisherName = publisherName.replace(/[^a-zA-Z0-9.-]/g, "_")

    // Dateiname generieren: {PublisherName}_{bookingId}.txt
    const generatedFileName = `${sanitizedPublisherName}_${bookingId}.txt`
    const timestamp = Date.now()
    const blobFileName = `content/${bookingId}/${timestamp}-${generatedFileName}`

    // Content als Text-Datei in Vercel Blob speichern
    const blob = await put(blobFileName, content, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: "text/plain",
    })

    // In Datenbank speichern
    const contentAsset = await prisma.contentAsset.create({
      data: {
        bookingId,
        fileName: generatedFileName,
        fileUrl: blob.url,
        fileType: "text",
        uploadedBy: session.user.id,
      },
    })

    // Status auf CONTENT_PROVIDED setzen, wenn noch nicht gesetzt
    const wasContentPending = booking.status === "CONTENT_PENDING"
    if (wasContentPending) {
      await prisma.linkBooking.update({
        where: { id: bookingId },
        data: {
          status: "CONTENT_PROVIDED",
          contentCompletedBy: session.user.id,
        },
      })

      // E-Mail an Publisher senden (nur wenn Status geändert wurde)
      try {
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
          contentProviderName: session.user.name || null,
          contentProviderEmail: session.user.email,
          fileName: generatedFileName,
        })
      } catch (emailError: any) {
        // E-Mail-Fehler nicht kritisch - Content wurde bereits gespeichert
        console.error("Fehler beim Senden der Content-Benachrichtigung:", emailError.message)
      }
    }

    return NextResponse.json(contentAsset, { status: 201 })
  } catch (error: any) {
    console.error("Save generated content error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

