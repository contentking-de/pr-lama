import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const publisherUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().nullable().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const publisher = await prisma.user.findUnique({
      where: { id },
    })

    if (!publisher || publisher.role !== "PUBLISHER") {
      return NextResponse.json({ error: "Publisher not found" }, { status: 404 })
    }

    return NextResponse.json(publisher)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const publisher = await prisma.user.findUnique({
      where: { id },
    })

    if (!publisher || publisher.role !== "PUBLISHER") {
      return NextResponse.json({ error: "Publisher not found" }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = publisherUpdateSchema.parse(body)

    // Prüfe ob E-Mail bereits von anderem User verwendet wird
    if (validatedData.email && validatedData.email !== publisher.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Ein Nutzer mit dieser E-Mail-Adresse existiert bereits" },
          { status: 400 }
        )
      }
    }

    const updatedPublisher = await prisma.user.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(updatedPublisher)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const publisher = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            linkSources: true,
          },
        },
      },
    })

    if (!publisher || publisher.role !== "PUBLISHER") {
      return NextResponse.json({ error: "Publisher not found" }, { status: 404 })
    }

    // Prüfe ob Publisher noch Linkquellen hat
    if (publisher._count.linkSources > 0) {
      return NextResponse.json(
        { error: "Publisher kann nicht gelöscht werden, da noch Linkquellen zugeordnet sind" },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

