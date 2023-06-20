import amqp from 'amqplib'

export async function requestPlanner(planId: string) {
  const connection = await amqp.connect(
    process.env.AMQP_URL || 'amqp://localhost'
  )

  const channel = await connection.createChannel()

  const queue = process.env.QUEUE_NAME || 'planner'

  await channel.assertQueue(queue, { durable: false })

  const msg = JSON.stringify({
    planId,
  })

  await channel.sendToQueue(queue, Buffer.from(msg))
}
