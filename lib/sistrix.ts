/**
 * Sistrix API Integration
 * Dokumentation: https://www.sistrix.com/api/domain/domain-visibilityindex/
 */

interface SistrixVisibilityIndexResponse {
  answer?: Array<{
    sichtbarkeitsindex?: Array<{
      domain?: string
      value?: number
      date?: string
    }>
  }>
  error?: {
    code?: number
    message?: string
  }
}

/**
 * Normalisiert die Domain/URL für die Sistrix API
 * Die API akzeptiert sowohl Domain als auch vollständige URL
 */
export function normalizeDomainForSistrix(url: string): string {
  try {
    // Wenn bereits eine vollständige URL, verwende sie direkt
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    // Sonst füge https:// hinzu
    return `https://${url}`
  } catch (error) {
    // Falls URL-Parsing fehlschlägt, versuche es als Domain zu behandeln
    return url.startsWith("http") ? url : `https://${url}`
  }
}

/**
 * Holt den Sichtbarkeitsindex für eine Domain von der Sistrix API
 * Verwendet domain.visibilityindex Endpoint
 */
export async function getSistrixVisibilityIndex(domain: string): Promise<number | null> {
  const apiKey = process.env.SISTRIX_API_KEY

  if (!apiKey) {
    throw new Error("SISTRIX_API_KEY nicht in der Umgebung konfiguriert")
  }

  const normalizedDomain = normalizeDomainForSistrix(domain)

  try {
    // Verwende FormData wie im Beispiel der Dokumentation
    const form = new FormData()
    form.append("api_key", apiKey)
    form.append("domain", normalizedDomain)
    form.append("country", "de") // Deutschland als Standard
    form.append("format", "json")

    const response = await fetch("https://api.sistrix.com/domain.visibilityindex", {
      method: "POST",
      body: form,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Sistrix API Response Error:", errorText)
      throw new Error(`Sistrix API Fehler: ${response.status} ${response.statusText}`)
    }

    // Response als Text holen und dann parsen (wie im Beispiel)
    const responseText = await response.text()
    console.log("Sistrix API Response:", responseText) // Debug-Log

    let data: SistrixVisibilityIndexResponse
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response:", responseText)
      throw new Error("Ungültige JSON-Antwort von Sistrix API")
    }

    if (data.error) {
      throw new Error(`Sistrix API Fehler: ${data.error.message || "Unbekannter Fehler"}`)
    }

    // Die Antwort-Struktur: answer[0].sichtbarkeitsindex[0].value
    const answerEntry = data.answer?.[0]
    const visibilityIndexEntry = answerEntry?.sichtbarkeitsindex?.[0]

    if (!visibilityIndexEntry) {
      console.log("Keine visibility data gefunden in:", data)
      return null
    }

    const value = visibilityIndexEntry.value

    if (value === undefined || value === null) {
      console.log("Value ist undefined/null:", visibilityIndexEntry)
      return null
    }

    // Der Wert ist ein Dezimalwert (z.B. 0.0204)
    // Da wir Int speichern, multiplizieren wir mit 10000 um 4 Dezimalstellen zu behalten
    // z.B. 0.0204 * 10000 = 204
    return Math.round(value * 10000)
  } catch (error: any) {
    console.error(`Fehler beim Abrufen des Sichtbarkeitsindex für ${normalizedDomain}:`, error.message)
    throw error
  }
}

