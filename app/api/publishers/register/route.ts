import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  exampleSources: z.string().optional(), // Wird nicht gespeichert, nur für Admin-E-Mail
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

    // Sende E-Mail-Benachrichtigung an alle Admins
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: "ADMIN",
        },
        select: {
          email: true,
          name: true,
        },
      })

      if (admins.length > 0 && process.env.RESEND_API_KEY) {
        const adminEmails = admins.map((admin) => admin.email)
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const usersUrl = `${baseUrl}/users`

        await resend.emails.send({
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          to: adminEmails,
          subject: "Neue Publisher-Registrierung - Freischaltung erforderlich",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Neue Publisher-Registrierung</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
                  <h1 style="color: #2563eb; margin-bottom: 20px;">PR Lama</h1>
                  <h2 style="color: #dc2626; margin-bottom: 20px;">Neue Publisher-Registrierung</h2>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Ein neuer Publisher hat sich registriert und wartet auf Freischaltung.
                  </p>
                  <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #2563eb;">
                    <h3 style="color: #2563eb; margin-top: 0; margin-bottom: 15px;">Publisher-Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 150px;">Name:</td>
                        <td style="padding: 8px 0;">${publisher.name || "-"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold;">E-Mail:</td>
                        <td style="padding: 8px 0;">${publisher.email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Registriert am:</td>
                        <td style="padding: 8px 0;">${new Date(publisher.createdAt).toLocaleDateString("de-DE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</td>
                      </tr>
                    </table>
                  </div>
                  ${validatedData.exampleSources ? `
                  <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                    <h3 style="color: #f59e0b; margin-top: 0; margin-bottom: 15px;">Beispiel-Linkquellen</h3>
                    <p style="font-size: 14px; color: #78350f; white-space: pre-wrap; margin: 0;">${validatedData.exampleSources}</p>
                  </div>
                  ` : ""}
                  <a href="${usersUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
                    Zur Nutzer-Verwaltung
                  </a>
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    Bitte prüfe die Registrierung und schalte den Publisher frei, damit er sich anmelden und sein Inventar einstellen kann.
                  </p>
                </div>
              </body>
            </html>
          `,
        })

        console.log(`[Publisher Register] Benachrichtigung an ${admins.length} Admin(s) gesendet`)
      }
    } catch (emailError: any) {
      console.error("[Publisher Register] Fehler beim Senden der Admin-Benachrichtigung:", emailError)
      // E-Mail-Fehler sollte nicht die Registrierung verhindern
    }

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

