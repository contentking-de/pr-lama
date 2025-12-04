/**
 * Ermittelt das Land basierend auf der Top-Level-Domain (TLD) einer URL
 */
export function getCountryFromUrl(url: string): string | null {
  try {
    // Parse die URL
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Extrahiere die TLD (z.B. .nl, .es, .fr)
    const parts = hostname.split('.')
    if (parts.length < 2) return null
    
    const tld = parts[parts.length - 1]
    
    // Mapping von TLD zu Ländernamen
    const tldToCountry: Record<string, string> = {
      'nl': 'Niederlande',
      'es': 'Spanien',
      'fr': 'Frankreich',
      'de': 'Deutschland',
      'it': 'Italien',
      'ch': 'Schweiz',
      'at': 'Österreich',
      'pl': 'Polen',
      'be': 'Belgien',
      'dk': 'Dänemark',
    }
    
    return tldToCountry[tld] || null
  } catch (error) {
    // Falls URL-Parsing fehlschlägt, versuche TLD direkt aus String zu extrahieren
    const match = url.match(/\.([a-z]{2})(?:\/|$)/i)
    if (match) {
      const tld = match[1].toLowerCase()
      const tldToCountry: Record<string, string> = {
        'nl': 'Niederlande',
        'es': 'Spanien',
        'fr': 'Frankreich',
        'de': 'Deutschland',
        'it': 'Italien',
        'ch': 'Schweiz',
        'at': 'Österreich',
        'pl': 'Polen',
        'be': 'Belgien',
        'dk': 'Dänemark',
      }
      return tldToCountry[tld] || null
    }
    return null
  }
}

/**
 * Konvertiert einen Ländernamen zu einem Flaggen-Emoji
 */
export function getCountryFlag(country: string | null): string {
  if (!country) return ""

  const countryLower = country.toLowerCase().trim()

  // Mapping von Ländernamen zu Flaggen-Emojis
  const countryFlags: Record<string, string> = {
    // Deutschland
    deutschland: "🇩🇪",
    germany: "🇩🇪",
    de: "🇩🇪",
    
    // Spanien
    spanien: "🇪🇸",
    spain: "🇪🇸",
    es: "🇪🇸",
    
    // Frankreich
    frankreich: "🇫🇷",
    france: "🇫🇷",
    fr: "🇫🇷",
    
    // Niederlande
    niederlande: "🇳🇱",
    netherlands: "🇳🇱",
    nl: "🇳🇱",
    holland: "🇳🇱",
    
    // Österreich
    österreich: "🇦🇹",
    oesterreich: "🇦🇹",
    austria: "🇦🇹",
    at: "🇦🇹",
    
    // Schweiz
    schweiz: "🇨🇭",
    switzerland: "🇨🇭",
    ch: "🇨🇭",
    
    // Italien
    italien: "🇮🇹",
    italy: "🇮🇹",
    it: "🇮🇹",
    
    // Vereinigtes Königreich
    "vereinigtes königreich": "🇬🇧",
    "vereinigtes koenigreich": "🇬🇧",
    "united kingdom": "🇬🇧",
    uk: "🇬🇧",
    england: "🇬🇧",
    "großbritannien": "🇬🇧",
    "grossbritannien": "🇬🇧",
    gb: "🇬🇧",
    
    // USA
    "vereinigte staaten": "🇺🇸",
    "vereinigte staaten von amerika": "🇺🇸",
    "united states": "🇺🇸",
    usa: "🇺🇸",
    us: "🇺🇸",
    
    // Polen
    polen: "🇵🇱",
    poland: "🇵🇱",
    pl: "🇵🇱",
    
    // Belgien
    belgien: "🇧🇪",
    belgium: "🇧🇪",
    be: "🇧🇪",
    
    // Dänemark
    dänemark: "🇩🇰",
    daenemark: "🇩🇰",
    denmark: "🇩🇰",
    dk: "🇩🇰",
    
    // Schweden
    schweden: "🇸🇪",
    sweden: "🇸🇪",
    se: "🇸🇪",
    
    // Norwegen
    norwegen: "🇳🇴",
    norway: "🇳🇴",
    no: "🇳🇴",
    
    // Finnland
    finnland: "🇫🇮",
    finland: "🇫🇮",
    fi: "🇫🇮",
  }

  return countryFlags[countryLower] || ""
}

