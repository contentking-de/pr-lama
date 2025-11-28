import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET 
  })

  // Öffentliche Routen
  if (path === "/login" || path === "/login/verify" || path === "/publishers/register") {
    // Wenn bereits eingeloggt, zum Dashboard weiterleiten (außer bei Registrierung)
    if (token && path !== "/publishers/register") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Geschützte Routen
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/sources") ||
    path.startsWith("/publishers") ||
    path.startsWith("/clients") ||
    path.startsWith("/bookings") ||
    path.startsWith("/content") ||
    path.startsWith("/users")
  ) {
    // Wenn nicht eingeloggt, zum Login weiterleiten
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Rollenbasierte Zugriffskontrolle
    const userRole = (token as any)?.role

    if (path.startsWith("/clients") && userRole === "PUBLISHER") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Schutz für /publishers Routen (nur ADMIN und MEMBER)
    // /publishers/register ist öffentlich und wird oben behandelt
    if (path.startsWith("/publishers") && !path.startsWith("/publishers/register") && userRole !== "ADMIN" && userRole !== "MEMBER") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Schutz für /content Routen (ADMIN, MEMBER und REDAKTEUR)
    if (path.startsWith("/content") && userRole !== "ADMIN" && userRole !== "MEMBER" && userRole !== "REDAKTEUR") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // REDAKTEUR kann nur auf Content zugreifen
    if (userRole === "REDAKTEUR" && !path.startsWith("/content") && !path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/content", req.url))
    }

    // Schutz für /users Routen (nur ADMIN)
    if (path.startsWith("/users") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sources/:path*",
    "/publishers/:path*",
    "/clients/:path*",
    "/bookings/:path*",
    "/content/:path*",
    "/users/:path*",
    "/login/:path*",
  ],
}
