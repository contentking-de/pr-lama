import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const booking = await prisma.linkBooking.findUnique({
      where: { id: params.id },
      include: {
        linkSource: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const body = await req.json()
    const { status, publisherProducesContent } = statusUpdateSchema.parse(body)

    // Publisher kann nur eigene Buchungen akzeptieren
    if (session.user.role === "PUBLISHER") {
      if (booking.linkSource.publisherId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (booking.status !== "REQUESTED" || status !== "ACCEPTED") {
        return NextResponse.json({ error: "Invalid status transition" }, { status: 400 })
      }
    }

    // Status-Übergänge validieren
    const validTransitions: Record<string, string[]> = {
      REQUESTED: ["ACCEPTED"],
      ACCEPTED: ["CONTENT_PENDING", "PUBLISHED"],
      CONTENT_PENDING: ["CONTENT_PROVIDED"],
      CONTENT_PROVIDED: ["PUBLISHED"],
      PUBLISHED: [],
    }

    if (!validTransitions[booking.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${booking.status} to ${status}` },
        { status: 400 }
      )
    }

    // Wenn Publisher Content produziert, überspringe CONTENT_PENDING
    let finalStatus = status
    if (
      status === "ACCEPTED" &&
      publisherProducesContent === true &&
      session.user.role === "PUBLISHER"
    ) {
      // Status bleibt ACCEPTED, kann später direkt zu PUBLISHED
    } else if (status === "ACCEPTED" && publisherProducesContent === false) {
      finalStatus = "CONTENT_PENDING"
    }

    const updateData: any = {
      status: finalStatus,
    }

    if (status === "ACCEPTED" && session.user.role === "PUBLISHER") {
      updateData.acceptedBy = session.user.id
      updateData.publisherProducesContent = publisherProducesContent || false
    }

    if (finalStatus === "CONTENT_PROVIDED" && (session.user.role === "ADMIN" || session.user.role === "MEMBER")) {
      updateData.contentCompletedBy = session.user.id
    }

    if (finalStatus === "PUBLISHED" && (session.user.role === "ADMIN" || session.user.role === "MEMBER")) {
      updateData.publishedBy = session.user.id
    }

    const updatedBooking = await prisma.linkBooking.update({
      where: { id: params.id },
      data: updateData,
    })

    // TODO: E-Mail-Benachrichtigungen senden

    return NextResponse.json(updatedBooking)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

