"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"

const navigation = [
  { name: "Dashboard", href: "/dashboard", roles: ["ADMIN", "MEMBER", "PUBLISHER"] },
  { name: "Linkquellen", href: "/sources", roles: ["ADMIN", "MEMBER", "PUBLISHER"] },
  { name: "Publisher", href: "/publishers", roles: ["ADMIN", "MEMBER"] },
  { name: "Kunden", href: "/clients", roles: ["ADMIN", "MEMBER"] },
  { name: "Buchungen", href: "/bookings", roles: ["ADMIN", "MEMBER", "PUBLISHER"] },
  { name: "Content", href: "/content", roles: ["ADMIN", "MEMBER"] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role || ""

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <Image
          src="/prlama-logo.png"
          alt="PR Lama Logo"
          width={120}
          height={48}
          className="object-contain"
        />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-2 text-sm text-gray-600">
          <div className="font-medium text-gray-900">{session?.user?.name || session?.user?.email}</div>
          <div className="text-xs mt-1 text-gray-500">{userRole}</div>
        </div>
        {userRole === "ADMIN" && (
          <Link
            href="/users"
            className={`mt-2 block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname?.startsWith("/users")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Nutzer verwalten
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          Abmelden
        </button>
      </div>
    </div>
  )
}

