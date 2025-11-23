import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import { z } from "zod"

const contentCheckSchema = z.object({
  contentAssetId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER" && session.user.role !== "REDAKTEUR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key nicht konfiguriert" }, { status: 500 })
    }

    const body = await req.json()
    const { contentAssetId } = contentCheckSchema.parse(body)

    // Content Asset mit Booking und Client laden
    const contentAsset = await prisma.contentAsset.findUnique({
      where: { id: contentAssetId },
      include: {
        booking: {
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
                aiContentCheckRules: true,
              },
            },
          },
        },
      },
    })

    if (!contentAsset) {
      return NextResponse.json({ error: "Content asset not found" }, { status: 404 })
    }

    // Content aus Blob laden (falls Text-Content)
    let contentText = ""
    if (contentAsset.fileType === "text") {
      try {
        const response = await fetch(contentAsset.fileUrl)
        if (response.ok) {
          contentText = await response.text()
        } else {
          return NextResponse.json({ error: "Content konnte nicht geladen werden" }, { status: 500 })
        }
      } catch (error) {
        return NextResponse.json({ error: "Fehler beim Laden des Contents" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Content-Check ist nur für Text-Content verfügbar" }, { status: 400 })
    }

    // OpenAI Client initialisieren
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // System-Prompt für Content-Check
    let systemPrompt = `Du bist ein professioneller Content-Prüfer für digitale PR-Content. 
Prüfe den bereitgestellten Content auf Qualität, Relevanz, SEO-Optimierung und Einhaltung der Vorgaben.`

    // Client-spezifische Check-Regeln hinzufügen
    let checkRules = ""
    if (contentAsset.booking.client.aiContentCheckRules) {
      checkRules = `
Spezielle Prüfregeln für diesen Kunden:
${contentAsset.booking.client.aiContentCheckRules}
`
    }

    // Prüf-Prompt erstellen
    const checkPrompt = `
${systemPrompt}

${checkRules}

Kontext:
- Linkquelle: ${contentAsset.booking.linkSource.name}
- Kunde: ${contentAsset.booking.client.brand} (${contentAsset.booking.client.domain})
- Ziel-URL: ${contentAsset.booking.targetUrl}
- Ankertext: ${contentAsset.booking.anchorText}
- Dateiname: ${contentAsset.fileName}

Zu prüfender Content:
${contentText}

Bitte führe eine umfassende Prüfung durch und gib eine detaillierte Bewertung zurück mit:
1. Qualitätsbewertung (1-10)
2. Stärken des Contents
3. Verbesserungsvorschläge
4. SEO-Relevanz
5. Einhaltung der Vorgaben
6. Gesamtbewertung und Empfehlung
`

    // Content-Check mit OpenAI durchführen
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: checkPrompt,
        },
      ],
      temperature: 0.3, // Niedrigere Temperatur für konsistente Bewertungen
      max_tokens: 2000,
    })

    const checkResult = completion.choices[0]?.message?.content

    if (!checkResult) {
      return NextResponse.json({ error: "Kein Prüfergebnis generiert" }, { status: 500 })
    }

    return NextResponse.json({
      checkResult,
      model: completion.model,
      usage: completion.usage,
      checkedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("OpenAI API Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Content-Check" },
      { status: 500 }
    )
  }
}

