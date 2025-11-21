import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface CSVRow {
  name: string
  url: string
  publisher: string
  kategorie: string
  preis: string
}

function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

async function parseCSV(filePath: string): Promise<CSVRow[]> {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const lines = fileContent.split('\n').filter(line => line.trim() !== '')
  
  // Überspringe Header-Zeile
  const dataLines = lines.slice(1)
  
  return dataLines.map(line => {
    const [name, url, publisher, kategorie, preis] = line.split(';').map(col => col.trim())
    
    // Wenn Name eine URL ist, extrahiere Domain-Name
    let sourceName = name || ''
    if (sourceName.startsWith('http')) {
      sourceName = extractDomainName(sourceName)
    }
    
    // Wenn URL leer ist, verwende Name als URL
    const sourceUrl = url || name || ''
    
    return {
      name: sourceName,
      url: sourceUrl,
      publisher: publisher || '',
      kategorie: kategorie || '',
      preis: preis || '0',
    }
  }).filter(row => row.name && row.url) // Filtere leere Zeilen
}

async function getOrCreatePublisher(publisherName: string): Promise<string> {
  // Generiere eine E-Mail basierend auf dem Publisher-Namen
  const email = `${publisherName.toLowerCase().replace(/\s+/g, '.')}@publisher.local`
  
  // Suche zuerst nach einem User mit diesem Namen oder dieser E-Mail
  let publisher = await prisma.user.findFirst({
    where: {
      OR: [
        { name: publisherName },
        { email: email },
      ],
      role: 'PUBLISHER',
    },
  })
  
  if (!publisher) {
    // Erstelle neuen Publisher-User
    publisher = await prisma.user.create({
      data: {
        email,
        name: publisherName,
        role: 'PUBLISHER',
        emailVerified: new Date(),
      },
    })
    console.log(`✅ Publisher erstellt: ${publisherName} (${email})`)
  } else {
    console.log(`ℹ️  Publisher gefunden: ${publisherName}`)
  }
  
  return publisher.id
}

async function getAdminOrMemberUser(): Promise<string> {
  // Suche nach einem ADMIN oder MEMBER User
  const user = await prisma.user.findFirst({
    where: {
      role: {
        in: ['ADMIN', 'MEMBER'],
      },
    },
  })
  
  if (!user) {
    throw new Error('Kein ADMIN oder MEMBER User gefunden. Bitte erstelle zuerst einen Admin-User.')
  }
  
  return user.id
}

async function importSources() {
  try {
    console.log('Starte Import der Sources aus CSV...')
    
    const csvPath = path.join(process.cwd(), 'public', 'brosy.csv')
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV-Datei nicht gefunden: ${csvPath}`)
    }
    
    const rows = await parseCSV(csvPath)
    console.log(`📊 ${rows.length} Zeilen gefunden`)
    
    const createdBy = await getAdminOrMemberUser()
    console.log(`👤 Verwende User-ID für createdBy: ${createdBy}`)
    
    const publisherMap = new Map<string, string>()
    let created = 0
    let skipped = 0
    let errors = 0
    
    for (const row of rows) {
      try {
        // Hole oder erstelle Publisher
        let publisherId = publisherMap.get(row.publisher)
        if (!publisherId) {
          publisherId = await getOrCreatePublisher(row.publisher)
          publisherMap.set(row.publisher, publisherId)
        }
        
        // Prüfe ob Source bereits existiert (basierend auf URL)
        const existingSource = await prisma.linkSource.findFirst({
          where: {
            url: row.url,
          },
        })
        
        if (existingSource) {
          console.log(`⏭️  Überspringe bereits vorhandene Source: ${row.name} (${row.url})`)
          skipped++
          continue
        }
        
        // Parse Preis
        const price = parseFloat(row.preis.replace(',', '.')) || 0
        
        // Erstelle Source
        await prisma.linkSource.create({
          data: {
            name: row.name,
            url: row.url,
            publisherId,
            price,
            category: row.kategorie,
            type: 'Link', // Standardwert
            availability: 'Verfügbar', // Standardwert
            createdBy,
          },
        })
        
        created++
        if (created % 50 === 0) {
          console.log(`📝 ${created} Sources importiert...`)
        }
      } catch (error: any) {
        console.error(`❌ Fehler beim Importieren von ${row.name}:`, error.message)
        errors++
      }
    }
    
    console.log('\n✅ Import abgeschlossen!')
    console.log(`   Erstellt: ${created}`)
    console.log(`   Übersprungen: ${skipped}`)
    console.log(`   Fehler: ${errors}`)
    console.log(`   Publisher: ${publisherMap.size}`)
    
  } catch (error: any) {
    console.error('❌ Fehler beim Importieren:', error)
    throw error
  }
}

async function main() {
  try {
    await importSources()
    process.exit(0)
  } catch (error) {
    console.error('❌ Fehler:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

