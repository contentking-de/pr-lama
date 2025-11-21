import { importCategoriesFromExcel } from "../lib/import-categories"

async function main() {
  try {
    console.log("Starte Import der Kategorien aus Excel...")
    const categories = await importCategoriesFromExcel()
    console.log(`✅ Erfolgreich ${categories.length} Kategorien importiert:`)
    categories.forEach((cat) => console.log(`  - ${cat.name}`))
    process.exit(0)
  } catch (error) {
    console.error("❌ Fehler beim Importieren:", error)
    process.exit(1)
  }
}

main()

