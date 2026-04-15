import { PrismaClient } from './client/client'
import { PrismaPg } from '@prisma/adapter-pg'

let prisma: PrismaClient

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter })
} else {
  if (!global._prisma) {
    global._prisma = new PrismaClient({ adapter })
  }

  prisma = global._prisma
}

export default prisma
