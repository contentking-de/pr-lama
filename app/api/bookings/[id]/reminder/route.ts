import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendBookingReminderEmail } from "@/lib/email"

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

    // Lade die Buchung mit allen benötigten Informationen
    const booking = await prisma.linkBooking.findUnique({
      where: { id },
      include: {
        linkSource: {
          include: {
            publisher: {
              select: {
                id: true,
                name: true,
                email: true,
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
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Prüfe ob Status REQUESTED ist
    if (booking.status !== "REQUESTED") {
      return NextResponse.json(
        { error: "Reminder kann nur für Buchungen mit Status REQUESTED gesendet werden" },
        { status: 400 }
      )
    }

    // Prüfe ob RESEND_API_KEY gesetzt ist
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY ist nicht konfiguriert" },
        { status: 500 }
      )
    }

    // Sende Reminder-E-Mail
    try {
      await sendBookingReminderEmail({
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
        requesterName: booking.requester.name,
        requesterEmail: booking.requester.email,
        createdAt: booking.createdAt,
      })

      return NextResponse.json({
        success: true,
        message: "Reminder-E-Mail erfolgreich gesendet",
      })
    } catch (emailError: any) {
      console.error("Error sending reminder email:", emailError)
      return NextResponse.json(
        { error: emailError.message || "Fehler beim Senden der E-Mail" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Booking reminder error:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

