import prisma from 'lib/prisma/connection'

export type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]
