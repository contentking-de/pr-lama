import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface BookingNotificationData {
  publisherEmail: string
  publisherName: string | null
  bookingId: string
  linkSourceName: string
  linkSourceUrl: string
  clientBrand: string
  clientDomain: string
  targetUrl: string
  anchorText: string
  publicationDate: Date
  requesterName: string | null
  requesterEmail: string
}

interface BookingAcceptedNotificationData {
  adminMemberEmails: string[]
  publisherName: string | null
  publisherEmail: string
  bookingId: string
  linkSourceName: string
  linkSourceUrl: string
  clientBrand: string
  clientDomain: string
  targetUrl: string
  anchorText: string
  publicationDate: Date
  publisherProducesContent: boolean
}

export async function sendBookingAcceptedNotificationEmail(data: BookingAcceptedNotificationData) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set")
    throw new Error("E-Mail-Konfiguration fehlt")
  }

  if (data.adminMemberEmails.length === 0) {
    return // Keine E-Mails zu senden
  }

  const publicationDateFormatted = new Date(data.publicationDate).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const statusText = data.publisherProducesContent
    ? "akzeptiert und wird den Content selbst erstellen"
    : "akzeptiert - Content wird benötigt"

  try {
    // Sende E-Mail an alle ADMIN und MEMBER
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@prlama.com",
      to: data.adminMemberEmails,
      subject: `Buchung für ${data.linkSourceName} wurde akzeptiert`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Buchung akzeptiert</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
              <h1 style="color: #10b981; margin-bottom: 20px;">Buchung akzeptiert</h1>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Die Buchung für <strong>${data.linkSourceName}</strong> wurde von <strong>${data.publisherName || data.publisherEmail}</strong> ${statusText}.
              </p>
              
              <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #10b981;">
                <h2 style="color: #10b981; margin-top: 0; margin-bottom: 20px;">Buchungsdetails</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 150px;">Linkquelle:</td>
                    <td style="padding: 8px 0;">
                      <a href="${data.linkSourceUrl}" style="color: #2563eb; text-decoration: none;">${data.linkSourceName}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Publisher:</td>
                    <td style="padding: 8px 0;">${data.publisherName || data.publisherEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Kunde:</td>
                    <td style="padding: 8px 0;">${data.clientBrand} (${data.clientDomain})</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Ziel-URL:</td>
                    <td style="padding: 8px 0;">
                      <a href="${data.targetUrl}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${data.targetUrl}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Anchor-Text:</td>
                    <td style="padding: 8px 0;">${data.anchorText}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Veröffentlichungsdatum:</td>
                    <td style="padding: 8px 0;">${publicationDateFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Content-Status:</td>
                    <td style="padding: 8px 0;">
                      ${data.publisherProducesContent 
                        ? '<span style="color: #10b981;">Publisher erstellt Content</span>' 
                        : '<span style="color: #f59e0b;">Content wird benötigt</span>'}
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/bookings/${data.bookingId}" 
                   style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Buchung ansehen
                </a>
              </div>
              
              ${!data.publisherProducesContent ? `
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Bitte erstelle jetzt den Content für diese Buchung.
              </p>
              ` : `
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Der Publisher wird den Content selbst erstellen. Du kannst die Buchung im Auge behalten.
              </p>
              `}
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Error sending booking accepted notification email:", error)
    throw new Error("E-Mail konnte nicht gesendet werden")
  }
}

interface ContentProvidedNotificationData {
  publisherEmail: string
  publisherName: string | null
  bookingId: string
  linkSourceName: string
  linkSourceUrl: string
  clientBrand: string
  clientDomain: string
  targetUrl: string
  anchorText: string
  publicationDate: Date
  contentProviderName: string | null
  contentProviderEmail: string
  fileName?: string
}

export async function sendContentProvidedNotificationEmail(data: ContentProvidedNotificationData) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set")
    throw new Error("E-Mail-Konfiguration fehlt")
  }

  const publicationDateFormatted = new Date(data.publicationDate).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@prlama.com",
      to: data.publisherEmail,
      subject: `Content bereitgestellt für ${data.linkSourceName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Content bereitgestellt</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
              <h1 style="color: #2563eb; margin-bottom: 20px;">Content bereitgestellt</h1>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hallo ${data.publisherName || data.publisherEmail},
              </p>
              
              <p style="font-size: 16px; margin-bottom: 30px;">
                Für die Buchung bei <strong>${data.linkSourceName}</strong> wurde Content bereitgestellt und ist jetzt verfügbar.
              </p>
              
              <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #10b981;">
                <h2 style="color: #10b981; margin-top: 0; margin-bottom: 20px;">Buchungsdetails</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 150px;">Linkquelle:</td>
                    <td style="padding: 8px 0;">
                      <a href="${data.linkSourceUrl}" style="color: #2563eb; text-decoration: none;">${data.linkSourceName}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Kunde:</td>
                    <td style="padding: 8px 0;">${data.clientBrand} (${data.clientDomain})</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Ziel-URL:</td>
                    <td style="padding: 8px 0;">
                      <a href="${data.targetUrl}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${data.targetUrl}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Anchor-Text:</td>
                    <td style="padding: 8px 0;">${data.anchorText}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Veröffentlichungsdatum:</td>
                    <td style="padding: 8px 0;">${publicationDateFormatted}</td>
                  </tr>
                  ${data.fileName ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Datei:</td>
                    <td style="padding: 8px 0;">${data.fileName}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Bereitgestellt von:</td>
                    <td style="padding: 8px 0;">${data.contentProviderName || data.contentProviderEmail}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/bookings/${data.bookingId}" 
                   style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Buchung ansehen
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Du kannst den Content jetzt in deinem Dashboard ansehen und die Buchung als veröffentlicht markieren, sobald der Link live ist.
              </p>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Error sending content provided notification email:", error)
    throw new Error("E-Mail konnte nicht gesendet werden")
  }
}

export async function sendBookingNotificationEmail(data: BookingNotificationData) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set")
    throw new Error("E-Mail-Konfiguration fehlt")
  }

  const publicationDateFormatted = new Date(data.publicationDate).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@prlama.com",
      to: data.publisherEmail,
      subject: `Neue Linkbuchung für ${data.linkSourceName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Neue Linkbuchung</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
              <h1 style="color: #2563eb; margin-bottom: 20px;">Neue Linkbuchung erhalten</h1>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hallo ${data.publisherName || data.publisherEmail},
              </p>
              
              <p style="font-size: 16px; margin-bottom: 30px;">
                Es wurde eine neue Linkbuchung für deine Linkquelle <strong>${data.linkSourceName}</strong> erstellt.
              </p>
              
              <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #2563eb;">
                <h2 style="color: #2563eb; margin-top: 0; margin-bottom: 20px;">Buchungsdetails</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 150px;">Linkquelle:</td>
                    <td style="padding: 8px 0;">
                      <a href="${data.linkSourceUrl}" style="color: #2563eb; text-decoration: none;">${data.linkSourceName}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Kunde:</td>
                    <td style="padding: 8px 0;">${data.clientBrand} (${data.clientDomain})</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Ziel-URL:</td>
                    <td style="padding: 8px 0;">
                      <a href="${data.targetUrl}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${data.targetUrl}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Anchor-Text:</td>
                    <td style="padding: 8px 0;">${data.anchorText}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Veröffentlichungsdatum:</td>
                    <td style="padding: 8px 0;">${publicationDateFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Angefragt von:</td>
                    <td style="padding: 8px 0;">${data.requesterName || data.requesterEmail}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/bookings/${data.bookingId}" 
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Buchung ansehen
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Bitte prüfe die Buchung in deinem Dashboard und nimm sie an oder lehne sie ab.
              </p>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Error sending booking notification email:", error)
    throw new Error("E-Mail konnte nicht gesendet werden")
  }
}

