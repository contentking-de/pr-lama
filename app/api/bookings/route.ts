import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bookingSchema = z.object({
  linkSourceId: z.string().uuid(),
  clientId: z.string().uuid(),
  targetUrl: z.string().url(),
  anchorText: z.string().min(1),
  publicationDate: z.string().or(z.date()),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = bookingSchema.parse(body)

    const booking = await prisma.linkBooking.create({
      data: {
        ...validatedData,
        publicationDate: new Date(validatedData.publicationDate),
        status: "REQUESTED",
        requestedBy: session.user.id,
      },
      include: {
        linkSource: {
          include: {
            publisher: true,
          },
        },
      },
    })

    // TODO: E-Mail an Publisher senden

    return NextResponse.json(booking, { status: 201 })
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

    const statusFilter = req.nextUrl.searchParams.get("status")

    const validStatuses = ["REQUESTED", "ACCEPTED", "CONTENT_PENDING", "CONTENT_PROVIDED", "PUBLISHED"]
    const isValidStatus = statusFilter && validStatuses.includes(statusFilter)

    const where: any =
      session.user.role === "PUBLISHER"
        ? {
            linkSource: {
              publisherId: session.user.id,
            },
          }
        : {}

    if (isValidStatus && statusFilter) {
      where.status = statusFilter as any
    }

    const bookings = await prisma.linkBooking.findMany({
      where,
      include: {
        linkSource: {
          select: {
            name: true,
            url: true,
          },
        },
        client: {
          select: {
            brand: true,
            domain: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(bookings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

