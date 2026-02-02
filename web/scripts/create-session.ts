import dotenv from 'dotenv'
import { randomBytes } from 'crypto'
import { PrismaClient } from '../lib/prisma/client'
import readline from 'readline'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

function getEmailFromUser(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise(resolve => {
    rl.question('E-mail: ', (email: string) => {
      rl.close()
      resolve(email)
    })
  })
}

async function createSession(email: string) {
  email = email.toLowerCase()
  const worker = await prisma.worker.findFirst({
    where: {
      email,
    },
  })
  if (!worker) {
    console.error('Uživatel nenalezen.')
    return { success: false }
  }
  if (worker.blocked) {
    console.error('Uživatel je zablokovaný.')
    return { success: false }
  }
  if (worker.deleted) {
    console.error('Uživatel je smazaný.')
    return { success: false }
  }
  let user = await prisma.user.findFirst({
    where: {
      email,
    },
  })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
      },
    })
  }
  const token = randomBytes(32).toString('hex')
  const DAYS_TO_EXPIRE = 7
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * DAYS_TO_EXPIRE)
  await prisma.session.create({
    data: {
      sessionToken: token,
      expires: expires,
      userId: user.id,
    },
  })

  return { success: true, token, expires }
}

async function main() {
  console.log(
    'Tento skript vytvoří session token pro vybraného uživatele. Použijte v případě, že se není možné přihlásit standardním způsobem.'
  )
  console.log(
    'Vytvořený token vložte do libovolného prohlížece na webu SummerJob jako cookie (např. Nástroje pro vývojáře -> Application -> Cookies -> Dvojklik v seznamu).'
  )

  console.log(
    'Zadejte e-mailovou adresu uživatele, pro kterého chcete vytvořit session token.'
  )
  const email = await getEmailFromUser()
  const session = await createSession(email)
  if (session.success) {
    console.log('Session token vytvořen:')
    console.log('Paramerty cookie:')
    console.log('  - Name: next-auth.session-token')
    console.log(`  - Value: ${session.token}`)
    console.log(`  - Expires: ${session.expires?.toJSON()}`)
    console.log('  - HttpOnly: Ano')
    console.log('  - Secure: Ano (pro vývoj Ne)')
    console.log('  - SameSite: Lax')
  }
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
