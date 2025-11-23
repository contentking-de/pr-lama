import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API Key nicht konfiguriert" }, { status: 500 })
    }

    // Hole alle Linkquellen ohne Tags oder mit leeren Tags
    const sources = await prisma.linkSource.findMany({
      where: {
        tags: { isEmpty: true },
      },
      select: {
        id: true,
        name: true,
        url: true,
        description: true,
        category: true,
        type: true,
      },
      take: 100, // Limit für Batch-Verarbeitung
    })

    if (sources.length === 0) {
      return NextResponse.json({ message: "Keine Sources ohne Tags gefunden", processed: 0 })
    }

    // OpenAI Client initialisieren mit Timeout
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000, // 60 Sekunden Timeout
    })

    let processed = 0
    let errors = 0

    // Verarbeite jede Source
    for (const source of sources) {
      try {
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
              temperature: 0.3,
              max_tokens: 500,
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("OpenAI API Timeout: Die Anfrage hat länger als 60 Sekunden gedauert")), 60000)
            ),
          ]) as any
        } catch (timeoutError: any) {
          if (timeoutError.message?.includes("Timeout")) {
            console.error(`Timeout für Source ${source.id} (${source.name})`)
            errors++
            // Weiter mit nächster Source, auch bei Timeout
            continue
          }
          throw timeoutError
        }

        const generatedTags = completion.choices[0]?.message?.content

        if (generatedTags) {
          // Tags parsen
          const tags = generatedTags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0)
            .slice(0, 20)

          // Tags in Datenbank speichern
          await prisma.linkSource.update({
            where: { id: source.id },
            data: {
              tags,
            },
          })

          processed++
        } else {
          errors++
        }

        // Rate Limiting: 5 Sekunden Pause zwischen Requests (OpenAI hat lange Antwortzeiten)
        await new Promise((resolve) => setTimeout(resolve, 5000))
      } catch (error: any) {
        console.error(`Error processing source ${source.id}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      message: `Batch-Verarbeitung abgeschlossen`,
      processed,
      errors,
      total: sources.length,
    })
  } catch (error: any) {
    console.error("Batch tag generation error:", error)
    return NextResponse.json(
      { error: error.message || "Fehler bei der Batch-Tag-Generierung" },
      { status: 500 }
    )
  }
}

