import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

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

    // Erstelle neuen Publisher (nicht freigeschaltet)
    const publisher = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name || null,
        role: "PUBLISHER",
        isApproved: false, // Muss von Admin freigeschaltet werden
        emailVerified: null, // Wird nach Freischaltung verifiziert
      },
    })

    // Sende E-Mail an Admins (optional - kann später implementiert werden)
    // Hier könntest du eine Benachrichtigung an Admins senden

    return NextResponse.json(
      {
        message: "Registrierung erfolgreich. Du wirst benachrichtigt, sobald dein Account freigeschaltet wurde.",
        id: publisher.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

