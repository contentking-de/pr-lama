import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key nicht konfiguriert" }, { status: 500 })
    }

    const { id } = await params

    // Linkquelle laden
    const source = await prisma.linkSource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true,
        description: true,
        category: true,
        type: true,
      },
    })

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 })
    }

    // OpenAI Client initialisieren mit Timeout
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000, // 60 Sekunden Timeout
    })

    // Prompt für Tag-Generierung
    const prompt = `Ich arbeite an einem Tool mit dem ich Domains bzw. die Projekte und Webseite auf diesen Domains verschlagworten kann. Was weißt Du über die Webseite ${source.name} (${source.url}) und welche 20 Schlagworte wären angebracht um diese Domain zu verschlagworten?

Zusätzliche Informationen:
${source.description ? `Beschreibung: ${source.description}` : ""}
Kategorie: ${source.category}
Typ: ${source.type}

Bitte gib mir genau 20 Schlagworte zurück, kommagetrennt, ohne weitere Erklärungen.`

    // Tags mit OpenAI generieren (mit Timeout-Handling)
    let completion
    try {
      completion = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Du bist ein Experte für Webseiten-Analyse und Verschlagwortung. Gib präzise, relevante Schlagworte zurück.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3, // Niedrigere Temperatur für konsistente Ergebnisse
          max_tokens: 500,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("OpenAI API Timeout: Die Anfrage hat länger als 60 Sekunden gedauert")), 60000)
        ),
      ]) as any
    } catch (timeoutError: any) {
      if (timeoutError.message?.includes("Timeout")) {
        return NextResponse.json(
          { error: "Die Tag-Generierung hat zu lange gedauert. Bitte versuche es erneut." },
          { status: 504 }
        )
      }
      throw timeoutError
    }

    const generatedTags = completion.choices[0]?.message?.content

    if (!generatedTags) {
      return NextResponse.json({ error: "Keine Tags generiert" }, { status: 500 })
    }

    // Tags parsen (kommagetrennt, trimmen, leere entfernen)
    const tags = generatedTags
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0)
      .slice(0, 20) // Maximal 20 Tags

    // Tags in Datenbank speichern
    const updatedSource = await prisma.linkSource.update({
      where: { id },
      data: {
        tags,
      },
      select: {
        id: true,
        tags: true,
      },
    })

    return NextResponse.json({
      tags: updatedSource.tags,
      model: completion.model,
      usage: completion.usage,
    })
  } catch (error: any) {
    console.error("OpenAI API Error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler bei der Tag-Generierung" },
      { status: 500 }
    )
  }
}

