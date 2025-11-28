import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "PUBLISHER") {
      return NextResponse.json(
        { error: "Nur Publisher können freigeschaltet werden" },
        { status: 400 }
      )
    }

    if (user.isApproved) {
      return NextResponse.json(
        { error: "Publisher ist bereits freigeschaltet" },
        { status: 400 }
      )
    }

    // Freischalten des Publishers
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isApproved: true,
        emailVerified: new Date(), // E-Mail als verifiziert markieren
      },
    })

    // Sende Bestätigungs-E-Mail an Publisher
    let emailSent = false
    let emailError: any = null

    if (!process.env.RESEND_API_KEY) {
      console.error("[Approve Publisher] RESEND_API_KEY is not set")
      emailError = "RESEND_API_KEY nicht konfiguriert"
    } else {
      try {
        console.log(`[Approve Publisher] Versende E-Mail an ${user.email}`)
        
        const emailResult = await resend.emails.send({
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          to: user.email,
          subject: "Dein Publisher-Account wurde freigeschaltet",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Account freigeschaltet</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
                  <h1 style="color: #2563eb; margin-bottom: 20px;">PR Lama</h1>
                  <h2 style="color: #059669; margin-bottom: 20px;">Dein Account wurde freigeschaltet!</h2>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Hallo ${user.name || user.email},
                  </p>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Dein Publisher-Account wurde erfolgreich freigeschaltet. Du kannst dich jetzt anmelden und dein Inventar bei uns einstellen, damit wir in Zukunft deine Linkquellen buchen können.
                  </p>
                  <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
                    Jetzt anmelden
                  </a>
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    Nach dem Login kannst du unter "Linkquellen" dein Inventar verwalten und neue Linkquellen hinzufügen.
                  </p>
                </div>
              </body>
            </html>
          `,
        })

        emailSent = true
        console.log(`[Approve Publisher] E-Mail erfolgreich versendet:`, emailResult)
      } catch (err: any) {
        emailError = err
        console.error("[Approve Publisher] Fehler beim Senden der E-Mail:", err)
        console.error("[Approve Publisher] Error details:", JSON.stringify(err, null, 2))
      }
    }

    return NextResponse.json({
      ...updatedUser,
      emailSent,
      emailError: emailError ? (emailError.message || String(emailError)) : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

