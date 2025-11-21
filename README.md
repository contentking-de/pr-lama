# PR Lama - Digitale PR Management Plattform

Eine interne SaaS-Lösung zur Digitalisierung und Automatisierung von digitalen PR-Maßnahmen.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (PostgreSQL via Neon)
- **NextAuth.js** (Magic Link Authentifizierung)
- **Resend API** (E-Mail-Versand)

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Resend API
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

### 3. Datenbank-Schema erstellen

```bash
# Prisma Client generieren
npm run db:generate

# Datenbank-Schema pushen
npm run db:push

# Oder Migrationen erstellen
npm run db:migrate
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung läuft dann auf [http://localhost:3000](http://localhost:3000)

## Projektstruktur

```
├── app/                    # Next.js App Router Seiten
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard-Seite
│   ├── login/             # Login-Seite
│   ├── sources/           # Linkquellen-Verwaltung
│   ├── clients/           # Kunden-Verwaltung
│   └── bookings/          # Linkbuchungen
├── components/            # React Komponenten
├── lib/                   # Utility-Funktionen
│   ├── auth.ts           # NextAuth Konfiguration
│   ├── auth-helpers.ts   # Auth Helper-Funktionen
│   └── prisma.ts         # Prisma Client
├── prisma/                # Prisma Schema
│   └── schema.prisma
└── types/                 # TypeScript Typen
```

## Rollen & Berechtigungen

- **ADMIN**: Vollzugriff auf alle Funktionen
- **MEMBER**: CRUD für Linkquellen, Kunden und Buchungen
- **PUBLISHER**: Nur eigene Linkquellen sehen/bearbeiten, Buchungen akzeptieren

## Features

- ✅ Magic Link Authentifizierung
- ✅ Linkquellen-Verwaltung (CRUD)
- 🔄 Kunden-Verwaltung (in Arbeit)
- 🔄 Linkbuchungen mit Status-Workflow (in Arbeit)
- 🔄 Content-Asset Upload (in Arbeit)
- 🔄 E-Mail-Benachrichtigungen (in Arbeit)

## Nächste Schritte

1. Datenbank-Verbindung konfigurieren (Neon PostgreSQL)
2. Resend API Key konfigurieren
3. Ersten Admin-User in der Datenbank erstellen
4. Weitere Features implementieren

