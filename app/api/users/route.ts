import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "MEMBER", "PUBLISHER", "REDAKTEUR"]),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = userSchema.parse(body)

    // Prüfe ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Ein Nutzer mit dieser E-Mail-Adresse existiert bereits" },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name || null,
        role: validatedData.role,
        emailVerified: new Date(),
      },
    })

    return NextResponse.json(user, { status: 201 })
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
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

