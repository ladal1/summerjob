import { APIAccessController } from 'lib/api/APIAccessControler'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma/connection'
import { z } from 'zod'

const EditAdorationSlotSchema = z.object({
  capacity: z.number().int().min(1).max(20),
  fromMinute: z.number().int().min(0).max(1439), // 0-1439 minutes in a day
  length: z.number().int().min(1).max(480), // 1-480 minutes (8 hours max)
  location: z.string().min(1).max(100),
})

export default APIAccessController(
  [Permission.ADMIN, Permission.ADORATION],
  async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const { id } = req.query
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid slot ID' })
    }

    try {
      const data = EditAdorationSlotSchema.parse(req.body)

      // Check if slot exists
      const existingSlot = await prisma.adorationSlot.findUnique({
        where: { id },
        include: {
          workers: true,
        },
      })

      if (!existingSlot) {
        return res.status(404).json({ message: 'Slot not found' })
      }

      // Check if new capacity is not less than current worker count
      if (data.capacity < existingSlot.workers.length) {
        return res.status(400).json({ 
          message: `Kapacita nemůže být menší než aktuální počet přiřazených pracantů (${existingSlot.workers.length})` 
        })
      }

      // Calculate new date based on fromMinute
      const originalDate = new Date(existingSlot.dateStart)
      const newDate = new Date(originalDate)
      newDate.setHours(Math.floor(data.fromMinute / 60))
      newDate.setMinutes(data.fromMinute % 60)
      newDate.setSeconds(0)
      newDate.setMilliseconds(0)

      // Update the slot
      const updatedSlot = await prisma.adorationSlot.update({
        where: { id },
        data: {
          capacity: data.capacity,
          dateStart: newDate,
          length: data.length,
          location: data.location,
        },
        include: {
          workers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      res.status(200).json({
        message: 'Slot successfully updated',
        slot: updatedSlot,
      })
    } catch (error) {
      console.error('Error updating adoration slot:', error)
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid data format',
          errors: error.errors 
        })
      }

      res.status(500).json({ message: 'Internal server error' })
    }
  }
)
