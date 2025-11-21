import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import { z } from "zod"

const generateContentSchema = z.object({
  bookingId: z.string().uuid(),
  prompt: z.string().min(1),
  contentType: z.enum(["article", "social-media", "email", "press-release"]).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key nicht konfiguriert" }, { status: 500 })
    }

    const body = await req.json()
    const { bookingId, prompt, contentType = "article" } = generateContentSchema.parse(body)

    // Buchung prüfen
    const booking = await prisma.linkBooking.findUnique({
      where: { id: bookingId },
      include: {
        linkSource: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            brand: true,
            domain: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // OpenAI Client initialisieren
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // System-Prompt basierend auf Content-Typ
    const systemPrompts: Record<string, string> = {
      article: "Du bist ein professioneller Content-Autor für digitale PR-Artikel. Erstelle hochwertige, SEO-optimierte Artikel.",
      "social-media": "Du bist ein Social Media Experte. Erstelle ansprechende Social Media Posts.",
      email: "Du bist ein E-Mail-Marketing Experte. Erstelle professionelle E-Mails.",
      "press-release": "Du bist ein PR-Experte. Erstelle professionelle Pressemitteilungen.",
    }

    const systemPrompt = systemPrompts[contentType] || systemPrompts.article

    // Erweiterten Prompt mit Kontext erstellen
    const fullPrompt = `
${systemPrompt}

Kontext:
- Linkquelle: ${booking.linkSource.name}
- Kunde: ${booking.client.brand} (${booking.client.domain})
- Ziel-URL: ${booking.targetUrl}
- Ankertext: ${booking.anchorText}

Aufgabe:
${prompt}

Erstelle professionellen Content, der zum Kontext passt und die Anforderungen erfüllt.
`

    // Content mit OpenAI generieren
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Verwende das neueste GPT-4 Modell (GPT-5 gibt es noch nicht)
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const generatedContent = completion.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json({ error: "Kein Content generiert" }, { status: 500 })
    }

    return NextResponse.json({
      content: generatedContent,
      model: completion.model,
      usage: completion.usage,
    })
  } catch (error: any) {
    console.error("OpenAI API Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler bei der Content-Generierung" },
      { status: 500 }
    )
  }
}

