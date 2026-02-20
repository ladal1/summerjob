import dotenv from 'dotenv'
import { PrismaClient } from '../lib/prisma/client'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function createReceptionAccount() {
  const firstName = 'Recepce'
  const lastName = 'Recepce'
  const email = process.env.RECEPTION_EMAIL!
  try {
    await prisma.worker.create({
      data: {
        firstName,
        lastName,
        email,
        note: '',
        phone: '000 000 000',
        permissions: {
          create: {
            permissions: ['RECEPTION'],
          },
        },
      },
    })
    console.log('Účet recepce byl úspěšně vytvořen.')
  } catch (e: unknown) {
    console.log(
      '[ERROR] Účet recepce se napodařilo vytvořit. Ujistěte se, zda-li již neexistuje.'
    )
  }
}

async function main() {
  console.log('Vytvoření účtu recepce.')
  await createReceptionAccount()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
