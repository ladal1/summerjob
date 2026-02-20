import dotenv from 'dotenv'
import { PrismaClient } from '../lib/prisma/client'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function createReceptionAccount() {
  const firstName = 'Recepce'
  const lastName = 'Recepce'
  const email = ''
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
}

async function main() {
  console.log('Vytvoření účtu recepce.')
  await createReceptionAccount()
  console.log('Účet recepce byl úspěšně vytvořen.')
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
