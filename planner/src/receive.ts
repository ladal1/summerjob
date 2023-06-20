#!/usr/bin/env node

import amqp from 'amqplib'
import dotenv from 'dotenv'
import { PrismaDataSource } from './datasources/Prisma'
import { BasicPlanner } from './planners/BasicPlanner'
import { Planner } from './planners/Planner'

dotenv.config()

const datasource = new PrismaDataSource()
const planner: Planner = new BasicPlanner(datasource)

async function main() {
  console.log('url is', process.env.AMQP_URL)
  const connection = await amqp.connect(
    process.env.AMQP_URL || 'amqp://localhost'
  )

  const channel = await connection.createChannel()

  const queue = process.env.QUEUE_NAME || 'planner'

  await channel.assertQueue(queue, { durable: false })

  console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queue)

  await channel.consume(
    queue,
    async (msg) => {
      console.log(' [x] Received %s', msg?.content.toString())
      if (!msg?.content) {
        console.log(' [x] No content')
        return
      }
      await onMessageReceived(msg.content.toString())
      console.log(' [x] Finished')
    },
    { noAck: true }
  )
}

async function onMessageReceived(msg: string) {
  try {
    const message = JSON.parse(msg) as { planId: string }
    if (!message.planId || typeof message.planId !== 'string') {
      console.log(' [x] No planId in message: %s', msg)
      return
    }
    const plans = await planner.start(message.planId)
    if (!plans.success) {
      console.log(' [x] Failed to plan %s', message.planId)
      return
    }
    console.log(' [x] Planned %d jobs', plans.jobs.length)
    datasource.setPlannedJobs(message.planId, plans.jobs)
  } catch (e) {
    console.log(' [x] Failed to parse message: %s', msg)
    console.error(e)
  }
}

main()
