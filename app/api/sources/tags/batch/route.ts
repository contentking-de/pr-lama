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

    // Hole alle Sources (ohne Limit) und filtere die ohne Tags
    // Dies ist notwendig, da Prisma's isEmpty möglicherweise NULL-Werte nicht korrekt erfasst
    const allSources = await prisma.linkSource.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        description: true,
        category: true,
        type: true,
        tags: true,
      },
    })

    console.log(`[Batch Tags] Gesamt Sources in DB: ${allSources.length}`)
    
    // Debug: Zeige Tags-Status für alle Sources
    const tagsStatus = allSources.map((s) => ({
      id: s.id,
      name: s.name,
      tags: s.tags,
      tagsLength: s.tags?.length || 0,
      isNull: s.tags === null,
      isEmpty: s.tags?.length === 0,
    }))
    console.log(`[Batch Tags] Tags-Status (erste 5):`, JSON.stringify(tagsStatus.slice(0, 5), null, 2))

    // Filtere Sources ohne Tags (NULL oder leeres Array)
    const sourcesWithoutTags = allSources.filter((source) => {
      const hasNoTags = !source.tags || source.tags.length === 0
      return hasNoTags
    })

    console.log(`[Batch Tags] Gefunden: ${sourcesWithoutTags.length} Sources ohne Tags (von ${allSources.length} total)`)

    // Limit auf 100 für Batch-Verarbeitung
    const sources = sourcesWithoutTags.slice(0, 100).map((source) => ({
      id: source.id,
      name: source.name,
      url: source.url,
      description: source.description,
      category: source.category,
      type: source.type,
    }))

    console.log(`[Batch Tags] Starte Verarbeitung von ${sources.length} Sources`)

    if (sources.length === 0) {
      return NextResponse.json({ 
        message: "Keine Sources ohne Tags gefunden", 
        processed: 0,
        total: sourcesWithoutTags.length,
        totalSources: allSources.length,
      })
    }

    // OpenAI Client initialisieren mit Timeout
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000, // 60 Sekunden Timeout
    })

    let processed = 0
    let errors = 0
    const startTime = Date.now()

    // Verarbeite jede Source
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      const progress = i + 1
      
      try {
        console.log(`[Batch Tags] Verarbeite ${progress}/${sources.length}: ${source.name} (${source.id})`)

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
            console.error(`[Batch Tags] Timeout für Source ${source.id} (${source.name})`)
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
          console.log(`[Batch Tags] ✓ Erfolgreich: ${source.name} - ${tags.length} Tags`)
        } else {
          console.error(`[Batch Tags] ✗ Keine Tags generiert für ${source.name}`)
          errors++
        }

        // Rate Limiting: 5 Sekunden Pause zwischen Requests (OpenAI hat lange Antwortzeiten)
        if (i < sources.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      } catch (error: any) {
        console.error(`[Batch Tags] ✗ Fehler bei Source ${source.id} (${source.name}):`, error.message || error)
        errors++
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(`[Batch Tags] Abgeschlossen: ${processed} erfolgreich, ${errors} Fehler, Dauer: ${duration}s`)

    return NextResponse.json({
      message: `Batch-Verarbeitung abgeschlossen`,
      processed,
      errors,
      total: sources.length,
      totalWithoutTags: sourcesWithoutTags.length,
      totalSources: allSources.length,
      duration: `${duration}s`,
    })
  } catch (error: any) {
    console.error("[Batch Tags] Kritischer Fehler:", error)
    return NextResponse.json(
      { 
        error: error.message || "Fehler bei der Batch-Tag-Generierung",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

