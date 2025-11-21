# Product Requirements Document (PRD)
## PR Lama - Digitale PR Management Plattform

**Version:** 1.0  
**Datum:** 2024  
**Status:** Draft

---

## 1. Projektübersicht

### 1.1 Vision
PR Lama ist eine interne SaaS-Lösung zur Digitalisierung und Automatisierung von digitalen PR-Maßnahmen. Die Plattform ermöglicht die Verwaltung von Linkquellen, deren Publishern, Kunden und die Abwicklung von Linkbuchungen.

### 1.2 Zielgruppe
- **Interne Nutzer:** ADMIN und MEMBER Rollen
- **Externe Nutzer:** PUBLISHER Rollen (Eigentümer der Linkquellen)

### 1.3 Technischer Stack
- **Frontend/Backend:** Next.js (App Router)
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS
- **Datenbank:** Neon PostgreSQL (extern)
- **E-Mail Service:** Resend API
- **Authentifizierung:** Magic Link (keine Registrierung)

---

## 2. Funktionale Anforderungen

### 2.1 Authentifizierung & Autorisierung

#### 2.1.1 Magic Link Login
- **Zugriff:** Nur für bereits existierende Nutzer (keine öffentliche Registrierung)
- **Flow:**
  1. Nutzer gibt E-Mail-Adresse ein
  2. System sendet Magic Link per E-Mail (Resend API)
  3. Nutzer klickt auf Link und wird automatisch eingeloggt
  4. Weiterleitung zum Dashboard

#### 2.1.2 Rollen & Berechtigungen

**ADMIN:**
- Vollzugriff auf alle Funktionen
- CRUD für alle Linkquellen
- CRUD für alle Kunden
- Verwaltung von Nutzern und Rollen
- Einsehen aller Linkbuchungen

**MEMBER:**
- CRUD für alle Linkquellen
- CRUD für alle Kunden
- Erstellen und Verwalten von Linkbuchungen
- Content-Prozess für Buchungen abschließen
- Einsehen aller Linkbuchungen

**PUBLISHER:**
- Nur eigene Linkquellen sehen und bearbeiten
- Eigene Linkquellen-Assets verwalten
- Linkbuchungen für eigene Quellen annehmen/ablehnen
- Kontaktinformationen einsehen

---

## 3. Datenmodelle

### 3.1 User (Nutzer)
```typescript
{
  id: string (UUID)
  email: string (unique)
  name: string
  role: 'ADMIN' | 'MEMBER' | 'PUBLISHER'
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3.2 Linkquelle (Link Source)
```typescript
{
  id: string (UUID)
  name: string
  url: string
  publisherId: string (FK zu User)
  price: number (decimal)
  category: string
  type: string
  da: number (Domain Authority)
  dr: number (Domain Rating)
  availability: string
  description: string
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: string (FK zu User)
}
```

### 3.3 Kunde (Client)
```typescript
{
  id: string (UUID)
  brand: string
  domain: string
  categories: string[]
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3.4 Ansprechpartner (Contact Person)
```typescript
{
  id: string (UUID)
  clientId: string (FK zu Client)
  name: string
  email: string
  phone: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3.5 Linkbuchung (Link Booking)
```typescript
{
  id: string (UUID)
  linkSourceId: string (FK zu Link Source)
  clientId: string (FK zu Client)
  targetUrl: string
  anchorText: string
  publicationDate: date
  status: 'REQUESTED' | 'ACCEPTED' | 'CONTENT_PENDING' | 'CONTENT_PROVIDED' | 'PUBLISHED'
  publisherProducesContent: boolean (default: false)
  requestedBy: string (FK zu User)
  acceptedBy: string? (FK zu User, Publisher)
  contentCompletedBy: string? (FK zu User, ADMIN/MEMBER)
  publishedBy: string? (FK zu User, ADMIN/MEMBER)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3.7 Content-Asset (Content Asset)
```typescript
{
  id: string (UUID)
  bookingId: string (FK zu Link Booking)
  fileName: string
  fileUrl: string (oder base64)
  fileType: string (z.B. 'image', 'pdf', 'text')
  uploadedBy: string (FK zu User)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3.6 Publisher Kontakt (Publisher Contact)
```typescript
{
  id: string (UUID)
  publisherId: string (FK zu User)
  email: string
  phone: string
  notes: string?
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 4. User Flows

### 4.1 Login Flow
1. Nutzer öffnet Startseite
2. Eingabe der E-Mail-Adresse
3. Klick auf "Magic Link senden"
4. E-Mail mit Magic Link wird versendet (Resend API)
5. Nutzer klickt auf Link in E-Mail
6. Automatischer Login
7. Weiterleitung zum Dashboard

### 4.2 Dashboard (nach Login)
- Übersicht über alle Linkquellen (für ADMIN/MEMBER)
- Übersicht über eigene Linkquellen (für PUBLISHER)
- Offene Linkbuchungen
- Statistiken (optional)

### 4.3 Linkquellen-Verwaltung

#### 4.3.1 Übersicht (ADMIN/MEMBER)
- Tabelle mit allen Linkquellen
- Filter nach Publisher, Kategorie, Typ, Verfügbarkeit
- Sortierung nach verschiedenen Spalten
- Suche nach Name/URL

#### 4.3.2 CRUD Operationen (ADMIN/MEMBER)
- **Create:** Formular mit allen Feldern
- **Read:** Detailansicht einer Linkquelle
- **Update:** Bearbeitungsformular
- **Delete:** Löschen mit Bestätigung

#### 4.3.3 Publisher-Ansicht
- Nur eigene Linkquellen werden angezeigt
- Bearbeitung der eigenen Quellen möglich
- Preise und Verfügbarkeit aktualisieren

### 4.4 Kunden-Verwaltung

#### 4.4.1 Übersicht
- Liste aller Kunden
- Suche nach Brand/Domain
- Filter nach Kategorien

#### 4.4.2 CRUD Operationen
- **Create:** Formular mit Brand, Domain, Kategorien
- **Read:** Detailansicht mit allen Ansprechpartnern
- **Update:** Bearbeitung von Kunde und Ansprechpartnern
- **Delete:** Löschen mit Bestätigung

#### 4.4.3 Ansprechpartner-Verwaltung
- Mehrere Ansprechpartner pro Kunde möglich
- Jeder Ansprechpartner hat Name, E-Mail, Telefon
- CRUD innerhalb der Kundendetailansicht

### 4.5 Linkbuchungen

#### 4.5.1 Buchung erstellen (ADMIN/MEMBER)
1. Auswahl einer Linkquelle
2. Auswahl eines Kunden
3. Eingabe: Ziel-URL, Ankertext, Veröffentlichungsdatum
4. Status wird auf "REQUESTED" gesetzt
5. Publisher wird benachrichtigt (E-Mail)

#### 4.5.2 Buchungsübersicht
- Tabelle mit allen Buchungen
- Filter nach Status, Linkquelle, Kunde
- Status-Badges farblich unterschieden

#### 4.5.3 Publisher-Akzeptanz (PUBLISHER)
1. Publisher sieht Buchungen für eigene Quellen
2. Status "REQUESTED" wird angezeigt
3. Publisher kann akzeptieren oder ablehnen
4. Bei Akzeptanz:
   - Publisher kann Häkchen "Publisher produziert Content" setzen
   - Wenn Häkchen gesetzt: Status → "ACCEPTED" (überspringt Content-Prozess)
   - Wenn Häkchen nicht gesetzt: Status → "ACCEPTED" → automatisch "CONTENT_PENDING"
5. Bei Ablehnung: Status bleibt "REQUESTED" (oder wird auf "REJECTED" gesetzt)

#### 4.5.4 Content-Prozess (ADMIN/MEMBER)
**Workflow nach Publisher-Akzeptanz:**

1. **Wenn Publisher Content produziert:**
   - Status bleibt "ACCEPTED"
   - MEMBER/ADMIN kann direkt auf "PUBLISHED" setzen

2. **Wenn Publisher keinen Content produziert:**
   - Status wechselt automatisch zu "CONTENT_PENDING"
   - MEMBER/ADMIN muss Content bereitstellen:
     - Upload von Content-Assets (Bilder, PDFs, Text)
     - Mehrere Dateien möglich
     - Kommentare/Notizen hinzufügen
   - Nach Content-Upload: Status → "CONTENT_PROVIDED"
   - MEMBER/ADMIN markiert als "PUBLISHED" wenn Link live ist

#### 4.5.5 Status-Workflow

**Standard-Workflow:**
```
REQUESTED → ACCEPTED → CONTENT_PENDING → CONTENT_PROVIDED → PUBLISHED
```

**Workflow wenn Publisher Content produziert:**
```
REQUESTED → ACCEPTED → PUBLISHED
```

**Status-Beschreibungen:**
- **REQUESTED:** Buchung wurde erstellt, wartet auf Publisher-Akzeptanz
- **ACCEPTED:** Publisher hat zugesagt
  - Wenn `publisherProducesContent = true`: Bereit für Veröffentlichung
  - Wenn `publisherProducesContent = false`: Wechselt automatisch zu CONTENT_PENDING
- **CONTENT_PENDING:** Wartet auf Content-Bereitstellung durch MEMBER/ADMIN
- **CONTENT_PROVIDED:** Content wurde hochgeladen, bereit für Veröffentlichung
- **PUBLISHED:** Link ist veröffentlicht, Buchung abgeschlossen

### 4.6 Content-Verwaltung

#### 4.6.1 Content-Asset Upload (ADMIN/MEMBER)
- Upload-Interface für Buchungen im Status "CONTENT_PENDING"
- Drag & Drop oder Datei-Auswahl
- Mehrere Dateien pro Buchung möglich
- Vorschau für Bilder und PDFs
- Dateinamen und Beschreibungen hinzufügen
- Kommentare/Notizen zu Content-Assets

#### 4.6.2 Content-Übersicht
- Liste aller hochgeladenen Content-Assets pro Buchung
- Download-Funktion für alle Dateien
- Löschen von Assets (mit Bestätigung)
- Status-Anzeige: Welche Assets wurden bereits an Publisher gesendet

#### 4.6.3 Content-Bereitstellung abschließen
- Nach Upload aller benötigten Assets: Status auf "CONTENT_PROVIDED" setzen
- Optional: E-Mail-Benachrichtigung an Publisher über bereitgestellten Content
- Publisher kann dann Content herunterladen und veröffentlichen

### 4.7 Publisher-Kontakt

#### 4.7.1 Kontaktinformationen
- E-Mail-Adresse des Publishers
- Telefonnummer des Publishers
- Interne Notizen zum Publisher

#### 4.7.2 Kontaktaufnahme
- Direkter E-Mail-Link
- Telefon-Link (tel:)
- Interne Nachricht (optional, falls Chat implementiert wird)

---

## 5. UI/UX Anforderungen

### 5.1 Design-Prinzipien
- **Clean & Modern:** Minimalistisches Design
- **Intuitive Navigation:** Klare Struktur und Menüführung
- **Responsive:** Mobile-first Ansatz
- **Accessible:** WCAG 2.1 AA Standards

### 5.2 Farbpalette & Typografie
- Moderne, professionelle Farben
- Klare Typografie-Hierarchie
- Konsistente Spacing-Systeme (Tailwind)

### 5.3 Komponenten
- Wiederverwendbare UI-Komponenten
- Formulare mit Validierung
- Tabellen mit Pagination
- Modals für Bestätigungen
- Toast-Notifications für Feedback

### 5.4 Seitenstruktur

#### Startseite (Public)
- Login-Formular (Magic Link)
- Branding/Logo
- Minimalistisches Layout

#### Dashboard (Protected)
- Sidebar-Navigation
- Header mit User-Info und Logout
- Hauptinhalt-Bereich

#### Linkquellen-Seiten
- `/sources` - Übersicht
- `/sources/new` - Neue Quelle erstellen
- `/sources/[id]` - Detailansicht
- `/sources/[id]/edit` - Bearbeitung

#### Kunden-Seiten
- `/clients` - Übersicht
- `/clients/new` - Neuer Kunde
- `/clients/[id]` - Detailansicht
- `/clients/[id]/edit` - Bearbeitung

#### Linkbuchungen-Seiten
- `/bookings` - Übersicht
- `/bookings/new` - Neue Buchung
- `/bookings/[id]` - Detailansicht
- `/bookings/[id]/content` - Content-Verwaltung (für CONTENT_PENDING Status)

---

## 6. Technische Spezifikationen

### 6.1 Next.js Setup
- App Router (Next.js 13+)
- Server Components wo möglich
- Client Components für interaktive Elemente
- API Routes für Backend-Logik

### 6.2 Datenbank-Schema
- PostgreSQL via Neon
- Migrations mit Prisma oder Drizzle ORM
- Foreign Keys für Beziehungen
- Indizes für Performance

### 6.3 Authentifizierung
- Magic Link Token-basiert
- Session Management (NextAuth.js oder Custom)
- Token-Validierung bei jedem Request
- Secure Cookie-Handling

### 6.4 E-Mail-Versand
- Resend API Integration
- Magic Link E-Mails
- Benachrichtigungen bei Buchungsstatus-Änderungen
- Benachrichtigung bei Content-Bereitstellung
- Templates für verschiedene E-Mail-Typen

### 6.7 File Upload & Storage
- Content-Asset Upload (Bilder, PDFs, Text-Dateien)
- Datei-Speicherung (lokales Storage oder Cloud-Storage wie S3)
- Datei-Größenlimits definieren
- Unterstützte Dateitypen validieren

### 6.5 API-Struktur
- RESTful API Routes
- Type-safe mit TypeScript
- Error Handling
- Input Validation

### 6.6 Sicherheit
- CSRF Protection
- XSS Prevention
- SQL Injection Prevention (ORM)
- Rate Limiting für Login
- Role-based Access Control (RBAC)

---

## 7. Nicht-funktionale Anforderungen

### 7.1 Performance
- Ladezeiten < 2 Sekunden
- Optimierte Datenbankabfragen
- Caching wo sinnvoll

### 7.2 Skalierbarkeit
- Unterstützung für 100+ Nutzer
- 1000+ Linkquellen
- 100+ Kunden

### 7.3 Verfügbarkeit
- 99% Uptime
- Fehlerbehandlung
- Logging für Debugging

### 7.4 Datenschutz
- DSGVO-konform
- Sichere Speicherung von Nutzerdaten
- Verschlüsselte Verbindungen (HTTPS)

---

## 8. Offene Fragen & Annahmen

### 8.1 Annahmen
- Publisher werden manuell als Nutzer angelegt (keine Selbstregistrierung)
- E-Mail-Templates werden im System definiert
- Preise werden in EUR gespeichert
- Datumsfelder verwenden ISO 8601 Format
- Content-Assets werden lokal oder in Cloud-Storage gespeichert
- Maximale Dateigröße für Uploads: 10MB (konfigurierbar)
- Unterstützte Dateitypen: PDF, JPG, PNG, DOCX, TXT

### 8.2 Offene Punkte für spätere Phasen
- Reporting & Analytics
- Export-Funktionen (CSV, PDF)
- Bulk-Operationen
- Erweiterte Filter und Suche
- Dashboard-Widgets und Statistiken
- Chat/Messaging-System für interne Kommunikation

---

## 9. Erfolgskriterien

### 9.1 MVP (Minimum Viable Product)
- Magic Link Login funktioniert
- Linkquellen CRUD vollständig
- Kunden-Verwaltung mit Ansprechpartnern
- Linkbuchungen mit erweitertem Status-Workflow
- Publisher können Buchungen akzeptieren (mit Option "Publisher produziert Content")
- Content-Prozess für MEMBER/ADMIN
- Content-Asset Upload und Verwaltung
- Status "PUBLISHED" als Abschluss
- Rollenbasierte Berechtigungen implementiert

### 9.2 Akzeptanzkriterien
- Alle Rollen können ihre Aufgaben erfüllen
- UI ist intuitiv und modern
- System ist stabil und performant
- E-Mail-Versand funktioniert zuverlässig

---

## 10. Implementierungsreihenfolge (Empfehlung)

### Phase 1: Foundation
1. Next.js Projekt Setup
2. Datenbank-Schema & Migrations
3. Authentifizierung (Magic Link)
4. Basis-Layout & Navigation

### Phase 2: Core Features
5. Linkquellen CRUD
6. Kunden-Verwaltung
7. Ansprechpartner-Verwaltung

### Phase 3: Buchungen
8. Linkbuchungen CRUD
9. Status-Workflow (REQUESTED → ACCEPTED)
10. Publisher-Akzeptanz mit "Publisher produziert Content" Option

### Phase 4: Content-Prozess
11. Content-Prozess nach Akzeptanz
12. Content-Asset Upload & Verwaltung
13. Status-Workflow (CONTENT_PENDING → CONTENT_PROVIDED → PUBLISHED)
14. Content-Verwaltungs-UI

### Phase 5: Polish
15. E-Mail-Integration (Resend)
16. Benachrichtigungen für alle Status-Änderungen
17. UI/UX Verbesserungen
18. Testing & Bugfixes

---

**Ende des PRD**

