/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, describe, expect, it } from 'vitest'
import { Id, api, createSummerJobEventData } from './common.js'

describe('SummerJob Events', function () {
  it('returns a list of events', async function () {
    const resp = await api.get('/api/summerjob-events', Id.ADMIN)
    expect(resp.status).toBe(200)
    expect(Array.isArray(resp.body)).toBe(true)
    expect(resp.body).toHaveLength(1)
    ;(resp.body as any[]).forEach(user => {
      expect(user).toHaveProperty('id')
    })
  })

  it('creates an event', async function () {
    const resp = await api.post(
      '/api/summerjob-events',
      Id.ADMIN,
      createSummerJobEventData()
    )
    expect(resp.status).toBe(201)
    expect(resp.body && typeof resp.body).toBe('object')
    expect(resp.body).toHaveProperty('id')
  })

  it('sets event active and unsets others', async function () {
    const activeEventId = api.getSummerJobEventId()
    const event = await api.post(
      '/api/summerjob-events',
      Id.ADMIN,
      createSummerJobEventData()
    )
    await api.patch(`/api/summerjob-events/${event.body.id}`, Id.ADMIN, {
      isActive: true,
    })
    const updatedEvents = await api.get('/api/summerjob-events', Id.ADMIN)
    updatedEvents.body.forEach((e: any) => {
      if (event.body.id === e.id) {
        expect(e.isActive).toBe(true)
      } else {
        expect(e.isActive).toBe(false)
      }
    })
    // Set the previous active event back
    await api.patch(`/api/summerjob-events/${activeEventId}`, Id.ADMIN, {
      isActive: true,
    })
  })

  it('blocks users when active event is changed', async function () {
    const worker = await api.createWorker()
    const activeEventId = api.getSummerJobEventId()
    const event = await api.post(
      '/api/summerjob-events',
      Id.ADMIN,
      createSummerJobEventData()
    )
    await api.patch(`/api/summerjob-events/${event.body.id}`, Id.ADMIN, {
      isActive: true,
    })
    const users = await api.get('/api/users', Id.ADMIN)
    ;(users.body as any[]).forEach(u => {
      expect(u.blocked).toBe(!u.permissions.includes('ADMIN'))
    })
    const adminUserIds = (users.body as any[]).map(u => u.id)
    // Check that only admins are listed in workers
    const workers = await api.get('/api/workers', Id.ADMIN)
    ;(workers.body as any[]).forEach(w => {
      expect(adminUserIds).toContain(w.id)
    })
    // Set the previous active event back
    await api.patch(`/api/summerjob-events/${activeEventId}`, Id.ADMIN, {
      isActive: true,
    })
    const workersInOriginalEvent = await api.get('/api/workers', Id.ADMIN)
    expect((workersInOriginalEvent.body as any[]).map(w => w.id)).toContain(
      worker.id
    )
  })

  afterAll(api.afterTestBlock)
})
