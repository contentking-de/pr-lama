import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendBookingAcceptedNotificationEmail } from "@/lib/email"

const statusUpdateSchema = z.object({
  status: z.enum([
    "REQUESTED",
    "ACCEPTED",
    "CONTENT_PENDING",
    "CONTENT_PROVIDED",
    "PUBLISHED",
  ]),
  publisherProducesContent: z.boolean().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.linkBooking.findUnique({
      where: { id },
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

    const body = await req.json()
    const { status, publisherProducesContent } = statusUpdateSchema.parse(body)

    // Publisher kann nur eigene Buchungen bearbeiten
    if (session.user.role === "PUBLISHER") {
      if (booking.linkSource.publisherId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      // Publisher kann REQUESTED -> ACCEPTED/CONTENT_PENDING oder ACCEPTED/CONTENT_PROVIDED -> PUBLISHED
      if (
        !(
          (booking.status === "REQUESTED" && status === "ACCEPTED") ||
          (booking.status === "ACCEPTED" && status === "PUBLISHED") ||
          (booking.status === "CONTENT_PROVIDED" && status === "PUBLISHED")
        )
      ) {
        return NextResponse.json({ error: "Invalid status transition for publisher" }, { status: 400 })
      }
    }

    // Wenn Publisher Content produziert: Status ACCEPTED
    // Wenn Publisher keinen Content produziert: Status direkt CONTENT_PENDING
    let finalStatus = status
    if (status === "ACCEPTED" && session.user.role === "PUBLISHER") {
      if (publisherProducesContent === true) {
        // Publisher produziert Content: Status bleibt ACCEPTED
        finalStatus = "ACCEPTED"
      } else {
        // Publisher produziert keinen Content: Status direkt CONTENT_PENDING
        finalStatus = "CONTENT_PENDING"
      }
    }

    // Status-Übergänge validieren (nach der Logik-Anpassung)
    const validTransitions: Record<string, string[]> = {
      REQUESTED: ["ACCEPTED", "CONTENT_PENDING"], // CONTENT_PENDING ist jetzt auch möglich
      ACCEPTED: ["CONTENT_PENDING", "PUBLISHED"],
      CONTENT_PENDING: ["CONTENT_PROVIDED"],
      CONTENT_PROVIDED: ["PUBLISHED"],
      PUBLISHED: [],
    }

    if (!validTransitions[booking.status]?.includes(finalStatus)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${booking.status} to ${finalStatus}` },
        { status: 400 }
      )
    }

    const updateData: any = {
      status: finalStatus,
    }

    // Wenn Publisher akzeptiert (egal ob ACCEPTED oder CONTENT_PENDING)
    if (status === "ACCEPTED" && session.user.role === "PUBLISHER") {
      updateData.acceptedBy = session.user.id
      updateData.publisherProducesContent = publisherProducesContent || false
    }

    if (finalStatus === "CONTENT_PROVIDED" && (session.user.role === "ADMIN" || session.user.role === "MEMBER")) {
      updateData.contentCompletedBy = session.user.id
    }

    if (finalStatus === "PUBLISHED") {
      updateData.publishedBy = session.user.id
    }

    const updatedBooking = await prisma.linkBooking.update({
      where: { id },
      data: updateData,
    })

    // E-Mail an alle ADMIN und MEMBER senden, wenn Publisher die Buchung akzeptiert hat
    if (
      session.user.role === "PUBLISHER" &&
      booking.status === "REQUESTED" &&
      (finalStatus === "ACCEPTED" || finalStatus === "CONTENT_PENDING")
    ) {
      try {
        // Hole alle ADMIN und MEMBER E-Mail-Adressen
        const adminMembers = await prisma.user.findMany({
          where: {
            role: {
              in: ["ADMIN", "MEMBER"],
            },
          },
          select: {
            email: true,
          },
        })

        const adminMemberEmails = adminMembers.map((user) => user.email)

        if (adminMemberEmails.length > 0) {
          await sendBookingAcceptedNotificationEmail({
            adminMemberEmails,
            publisherName: booking.linkSource.publisher.name,
            publisherEmail: booking.linkSource.publisher.email,
            bookingId: booking.id,
            linkSourceName: booking.linkSource.name,
            linkSourceUrl: booking.linkSource.url,
            clientBrand: booking.client.brand,
            clientDomain: booking.client.domain,
            targetUrl: booking.targetUrl,
            anchorText: booking.anchorText,
            publicationDate: booking.publicationDate,
            publisherProducesContent: publisherProducesContent || false,
          })
        }
      } catch (emailError: any) {
        // E-Mail-Fehler nicht kritisch - Buchung wurde bereits aktualisiert
        console.error("Fehler beim Senden der Akzeptierungs-Benachrichtigung:", emailError.message)
      }
    }

    return NextResponse.json(updatedBooking)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

