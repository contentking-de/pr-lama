import * as XLSX from "xlsx"
import { readFileSync } from "fs"
import { join } from "path"
import { prisma } from "./prisma"

/**
 * Importiert Kategorien aus der Excel-Datei in die Datenbank
 */
export async function importCategoriesFromExcel() {
  try {
    const filePath = join(process.cwd(), "public", "kats.xlsx")
    const workbook = XLSX.readFile(filePath)
    
    // Nimm das erste Sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Konvertiere zu JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    // Extrahiere Kategorien (nehme an, dass sie in der ersten Spalte stehen)
    const categories: string[] = []
    
    // Überspringe Header-Zeile falls vorhanden und sammle alle Werte aus der ersten Spalte
    data.forEach((row, index) => {
      if (index === 0 && typeof row[0] === "string" && row[0].toLowerCase().includes("kategorie")) {
        // Header-Zeile überspringen
        return
      }
      if (row[0] && typeof row[0] === "string" && row[0].trim()) {
        const category = row[0].trim()
        if (!categories.includes(category)) {
          categories.push(category)
        }
      }
    })
    
    // Speichere Kategorien in der Datenbank
    const results = []
    for (const categoryName of categories) {
      try {
        const category = await prisma.category.upsert({
          where: { name: categoryName },
          update: {}, // Wenn bereits vorhanden, nichts ändern
          create: { name: categoryName },
        })
        results.push(category)
      } catch (error) {
        console.error(`Fehler beim Speichern der Kategorie "${categoryName}":`, error)
      }
    }
    
    return results
  } catch (error) {
    console.error("Fehler beim Importieren der Kategorien aus Excel:", error)
    throw error
  }
}


