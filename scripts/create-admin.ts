import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'nico@contentking.de'
  
  // Prüfe ob User bereits existiert
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log(`User ${email} existiert bereits. Aktualisiere Rolle zu ADMIN...`)
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    })
    console.log('User erfolgreich aktualisiert:', updatedUser)
  } else {
    console.log(`Erstelle neuen ADMIN-User für ${email}...`)
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Nico',
        role: 'ADMIN',
      },
    })
    console.log('User erfolgreich erstellt:', user)
  }
}

main()
  .catch((e) => {
    console.error('Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

