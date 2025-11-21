import { PrismaClient } from '@prisma/client'
import { getSistrixVisibilityIndex } from '../lib/sistrix'

const prisma = new PrismaClient()

async function updateAllSistrixIndexes() {
  try {
    console.log('Starte Aktualisierung der Sistrix Sichtbarkeitsindizes für alle Sources...\n')
    
    // Hole alle Sources
    const sources = await prisma.linkSource.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        sistrixVisibilityIndex: true,
        sistrixLastUpdated: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
    
    console.log(`📊 ${sources.length} Sources gefunden\n`)
    
    let updated = 0
    let skipped = 0
    let errors = 0
    let unchanged = 0
    
    // Rate limiting: Warte zwischen API-Calls (z.B. 1 Sekunde)
    const delayBetweenCalls = 1000 // 1 Sekunde
    
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      const progress = `[${i + 1}/${sources.length}]`
      
      try {
        console.log(`${progress} Verarbeite: ${source.name} (${source.url})`)
        
        // Hole neuen Sichtbarkeitsindex
        const visibilityIndex = await getSistrixVisibilityIndex(source.url)
        
        if (visibilityIndex === null) {
          console.log(`   ⚠️  Kein Index verfügbar`)
          skipped++
          continue
        }
        
        // Prüfe ob sich der Wert geändert hat
        if (source.sistrixVisibilityIndex === visibilityIndex) {
          console.log(`   ✓ Index unverändert: ${(visibilityIndex / 10000).toFixed(4)}`)
          unchanged++
        } else {
          // Aktualisiere Source
          await prisma.linkSource.update({
            where: { id: source.id },
            data: {
              sistrixVisibilityIndex: visibilityIndex,
              sistrixLastUpdated: new Date(),
            },
          })
          
          const oldValue = source.sistrixVisibilityIndex 
            ? (source.sistrixVisibilityIndex / 10000).toFixed(4) 
            : 'N/A'
          const newValue = (visibilityIndex / 10000).toFixed(4)
          
          console.log(`   ✅ Aktualisiert: ${oldValue} → ${newValue}`)
          updated++
        }
        
        // Rate limiting: Warte zwischen API-Calls (außer beim letzten)
        if (i < sources.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenCalls))
        }
        
      } catch (error: any) {
        console.error(`   ❌ Fehler: ${error.message}`)
        errors++
        
        // Bei API-Fehlern (z.B. Rate Limit) länger warten
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.log(`   ⏳ Warte 10 Sekunden wegen Rate Limit...`)
          await new Promise(resolve => setTimeout(resolve, 10000))
        }
      }
    }
    
    console.log('\n✅ Aktualisierung abgeschlossen!')
    console.log(`   Aktualisiert: ${updated}`)
    console.log(`   Unverändert: ${unchanged}`)
    console.log(`   Übersprungen: ${skipped}`)
    console.log(`   Fehler: ${errors}`)
    
  } catch (error: any) {
    console.error('❌ Fehler beim Aktualisieren:', error)
    throw error
  }
}

async function main() {
  try {
    // Prüfe ob SISTRIX_API_KEY gesetzt ist
    if (!process.env.SISTRIX_API_KEY) {
      console.error('❌ Fehler: SISTRIX_API_KEY ist nicht in der Umgebung konfiguriert')
      console.error('   Bitte setze die Umgebungsvariable SISTRIX_API_KEY')
      process.exit(1)
    }
    
    await updateAllSistrixIndexes()
    process.exit(0)
  } catch (error) {
    console.error('❌ Fehler:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

