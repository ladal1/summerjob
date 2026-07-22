import { PrismaClient } from '../lib/prisma/client'

const prisma = new PrismaClient()

async function main() {
  const plan = await prisma.plan.findFirst({ orderBy: { day: 'asc' } })
  if (!plan)
    throw new Error('No plan found – run `npx tsx prisma/seed.ts` first.')
  console.log(
    `Using plan ${plan.id} (day ${plan.day.toISOString().slice(0, 10)})`
  )

  // Clean any existing ActiveJobs + deliveries on this plan to start fresh
  await prisma.foodDelivery.deleteMany({ where: { planId: plan.id } })
  await prisma.activeJob.deleteMany({ where: { planId: plan.id } })

  const allergies = await prisma.foodAllergy.findMany()
  if (allergies.length < 3) throw new Error('Need at least 3 FoodAllergy rows.')

  // Assign allergies to 30 workers (spread across the allergy types)
  const activeEvent = await prisma.summerJobEvent.findFirst({
    where: { isActive: true },
  })
  if (!activeEvent) throw new Error('No active SummerJobEvent.')
  const allWorkers = await prisma.worker.findMany({
    where: {
      deleted: false,
      availability: { some: { eventId: activeEvent.id } },
    },
    take: 60,
  })
  if (allWorkers.length < 40)
    throw new Error(
      `Need at least 40 workers with availability, got ${allWorkers.length}.`
    )

  for (let i = 0; i < 30; i++) {
    const worker = allWorkers[i]
    const allergy = allergies[i % allergies.length]
    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        foodAllergies: { connect: [{ id: allergy.id }] },
      },
    })
  }
  console.log(`Assigned allergies to 30 workers`)

  // Pick 16 proposed jobs: mix of hasFood true/false
  const withoutFood = await prisma.proposedJob.findMany({
    where: { hasFood: false },
    take: 8,
  })
  const withFood = await prisma.proposedJob.findMany({
    where: { hasFood: true },
    take: 8,
  })
  const proposedPool = [...withoutFood, ...withFood]
  if (proposedPool.length < 16) throw new Error('Not enough proposed jobs.')

  // Give coordinates to jobs that don't have them — 2 geographic clusters
  const clusterA: [number, number] = [14.43, 50.08] // Prague
  const clusterB: [number, number] = [14.4, 49.2] // ~150 km south
  for (let i = 0; i < proposedPool.length; i++) {
    const base = i < 8 ? clusterA : clusterB
    const jitter = () => (Math.random() - 0.5) * 0.2
    await prisma.proposedJob.update({
      where: { id: proposedPool[i].id },
      data: { coordinates: [base[0] + jitter(), base[1] + jitter()] },
    })
  }
  console.log('Coordinates assigned: 8 jobs near Praha, 8 jobs ~150 km south')

  // Create 16 ActiveJobs, each with 3 workers, some allergic
  const workersPool = [...allWorkers]
  const allergicPool = workersPool.slice(0, 30)
  const nonAllergicPool = workersPool.slice(30)

  for (let i = 0; i < 16; i++) {
    const job = proposedPool[i]
    const allergicCount = i % 4 === 0 ? 0 : (i % 3) + 1 // 0, 1, 2, 3, 0, 1, 2, 3…
    const pickAllergic = allergicPool.slice(i * 2, i * 2 + allergicCount)
    const pickNonAllergic = nonAllergicPool.slice(
      i * 2,
      i * 2 + (3 - pickAllergic.length)
    )
    const chosen = [...pickAllergic, ...pickNonAllergic].filter(Boolean)
    const responsible = chosen[0]

    await prisma.activeJob.create({
      data: {
        planId: plan.id,
        proposedJobId: job.id,
        responsibleWorkerId: responsible?.id ?? null,
        workers: { connect: chosen.map(w => ({ id: w.id })) },
      },
    })
  }
  console.log('Created 16 ActiveJobs on the plan')

  const summary = await prisma.activeJob.findMany({
    where: { planId: plan.id },
    include: {
      proposedJob: { select: { name: true, hasFood: true } },
      workers: { include: { foodAllergies: true } },
    },
  })
  const suggested = summary.filter(
    j =>
      !j.proposedJob.hasFood || j.workers.some(w => w.foodAllergies.length > 0)
  ).length
  console.log(
    `\nSummary: ${summary.length} ActiveJobs on plan, ${suggested} matching "suggested" rule (no food OR allergic worker), ${summary.length - suggested} "other" (ok for manual-add testing).`
  )
  console.log(`\nOpen: http://localhost:3000/plan/${plan.id}/food-delivery`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
