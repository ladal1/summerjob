import dotenv from 'dotenv'
import { PrismaClient } from '../lib/prisma/client'
import readline from 'readline'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

function getInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise(resolve => {
    rl.question(prompt, (email: string) => {
      rl.close()
      resolve(email)
    })
  })
}

async function createAccount(
  firstName: string,
  lastName: string,
  email: string
) {
  email = email.toLowerCase()
  await prisma.worker.create({
    data: {
      firstName,
      lastName,
      email,
      note: '',
      phone: '000 000 000',
      permissions: {
        create: {
          permissions: ['ADMIN'],
        },
      },
    },
  })
}

async function main() {
  console.log('Vytvoření prvního administrátorského účtu.')
  console.log(
    'Tento skript přidá do databáze administrátorský účet, na který se následně bude možné přihlásit pomocí zadané e-mailové adresy.'
  )

  console.log('Pro další přidávání uživatelů použijte webové rozhraní.')
  const firstname = await getInput('Křestní jméno: ')
  const lastname = await getInput('Příjmení: ')
  const email = await getInput('E-mail: ')
  await createAccount(firstname, lastname, email)
  console.log('Účet vytvořen. Nyní se můžete přihlásit.')
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
