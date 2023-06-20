import prisma from 'lib/prisma/connection'
import { randomBytes } from 'crypto'

export async function dev_getLoginToken() {
  return prisma.verificationToken.findFirst({
    orderBy: {
      expires: 'desc',
    },
  })
}

export async function dev_createUser(email: string) {
  const user = await prisma.user.create({
    data: {
      email,
      emailVerified: new Date(),
    },
  })
  return user
}

export async function dev_createSession() {
  const latestToken = await dev_getLoginToken()
  if (!latestToken) return null
  let user = await prisma.user.findFirst({
    where: {
      email: latestToken.identifier,
    },
  })
  if (!user) {
    user = await dev_createUser(latestToken.identifier)
  }
  const token = randomBytes(32).toString('hex')
  const newSession = await prisma.session.create({
    data: {
      sessionToken: token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      userId: user.id,
    },
  })
  return newSession
}
