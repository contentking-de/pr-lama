import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEMBER" && session.user.role !== "REDAKTEUR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const redakteure = await prisma.user.findMany({
      where: {
        role: "REDAKTEUR",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(redakteure)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

