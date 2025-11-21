import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const sourceSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  publisherId: z.string().uuid().optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  da: z.number().nullable().optional(),
  dr: z.number().nullable().optional(),
  availability: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const source = await prisma.linkSource.findUnique({
      where: { id: params.id },
      include: {
        publisher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!source) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Publisher können nur eigene Quellen sehen
    if (session.user.role === "PUBLISHER" && source.publisherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(source)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const source = await prisma.linkSource.findUnique({
      where: { id: params.id },
    })

    if (!source) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Publisher können nur eigene Quellen bearbeiten
    if (session.user.role === "PUBLISHER" && source.publisherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ADMIN und MEMBER können alle bearbeiten
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "MEMBER" &&
      source.publisherId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = sourceSchema.parse(body)

    const updatedSource = await prisma.linkSource.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(updatedSource)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const source = await prisma.linkSource.findUnique({
      where: { id: params.id },
    })

    if (!source) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.linkSource.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

