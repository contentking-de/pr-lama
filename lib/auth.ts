import type { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { EmailConfig } from "next-auth/providers/email"
import { prisma } from "./prisma"
import { Resend } from "resend"
import NextAuth from "next-auth"

const resend = new Resend(process.env.RESEND_API_KEY)

// Custom Email Provider ohne nodemailer
const customEmailProvider: EmailConfig = {
  id: "email",
  type: "email",
  name: "Email",
  from: process.env.EMAIL_FROM || "noreply@prlama.com",
  async sendVerificationRequest({ identifier: email, url }) {
        if (!process.env.RESEND_API_KEY) {
          console.error("RESEND_API_KEY is not set")
          throw new Error("E-Mail-Konfiguration fehlt")
        }
        
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: email,
            subject: "Anmelden bei PR Lama",
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Anmelden bei PR Lama</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
                    <h1 style="color: #2563eb; margin-bottom: 20px;">PR Lama</h1>
                    <p style="font-size: 16px; margin-bottom: 30px;">Klicke auf den Button unten, um dich anzumelden:</p>
                    <a href="${url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px;">Jetzt anmelden</a>
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">Oder kopiere diesen Link in deinen Browser:</p>
                    <p style="font-size: 12px; color: #999; word-break: break-all;">${url}</p>
                    <p style="font-size: 12px; color: #999; margin-top: 30px;">Dieser Link ist 24 Stunden gültig.</p>
                  </div>
                </body>
              </html>
            `,
          })
        } catch (error) {
          console.error("Error sending email:", error)
          throw new Error("E-Mail konnte nicht gesendet werden")
        }
      },
}

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    customEmailProvider as any,
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        // Lade User-Rolle aus der Datenbank
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          })
          token.role = dbUser?.role || "MEMBER"
        } catch (error) {
          console.error("Error loading user role:", error)
          token.role = "MEMBER"
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || "MEMBER"
        // Lade aktuelle User-Daten aus der Datenbank
        if (token.id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, name: true, email: true },
            })
            if (dbUser) {
              session.user.role = dbUser.role || "MEMBER"
              session.user.name = dbUser.name
              session.user.email = dbUser.email
            }
          } catch (error) {
            console.error("Error loading user data:", error)
          }
        }
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
