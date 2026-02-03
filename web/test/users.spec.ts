/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, describe, expect, it } from 'vitest'
import { Id, api } from './common.js'

describe('Users', function () {
  it('returns a list of users', async function () {
    const resp = await api.get('/api/users', Id.ADMIN)
    expect(resp.status).toBe(200)
    expect(Array.isArray(resp.body)).toBe(true)
    ;(resp.body as any[]).forEach(user => {
      expect(user).toHaveProperty('id')
    })
  })

  it('modifies user permissions', async function () {
    const worker = await api.createWorker()
    const users = await api.get('/api/users', Id.ADMIN)
    const selectedUser = (users.body as any[]).find(u => u.id === worker.id)
    expect(selectedUser.permissions).toHaveLength(0)
    const userUpdateData = {
      permissions: ['JOBS', 'CARS'],
    }
    const resp = await api.patch(
      `/api/users/${worker.id}`,
      Id.ADMIN,
      userUpdateData
    )
    expect(resp.status).toBe(204)

    const updatedUsers = await api.get('/api/users', Id.ADMIN)
    const updatedUser = (updatedUsers.body as any[]).find(
      u => u.id === worker.id
    )
    expect(updatedUser.permissions).toHaveLength(2)
    expect(updatedUser.permissions).toContain('JOBS')
    expect(updatedUser.permissions).toContain('CARS')
  })

  it('blocks a user', async function () {
    const worker = await api.createWorker()
    const users = await api.get('/api/users', Id.ADMIN)
    const selectedUser = (users.body as any[]).find(u => u.id === worker.id)
    expect(selectedUser.permissions).toHaveLength(0)
    const userUpdateData = {
      blocked: true,
    }
    const resp = await api.patch(
      `/api/users/${worker.id}`,
      Id.ADMIN,
      userUpdateData
    )
    expect(resp.status).toBe(204)

    const updatedUsers = await api.get('/api/users', Id.ADMIN)
    const updatedUser = (updatedUsers.body as any[]).find(
      u => u.id === worker.id
    )
    expect(updatedUser.blocked).toBe(true)
  })

  afterAll(api.afterTestBlock)
})
