import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contact = await prisma.contactPerson.findUnique({
      where: { id: params.contactId },
    })

    if (!contact || contact.clientId !== params.id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = contactSchema.parse(body)

    const updatedContact = await prisma.contactPerson.update({
      where: { id: params.contactId },
      data: validatedData,
    })

    return NextResponse.json(updatedContact)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contact = await prisma.contactPerson.findUnique({
      where: { id: params.contactId },
    })

    if (!contact || contact.clientId !== params.id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    await prisma.contactPerson.delete({
      where: { id: params.contactId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

