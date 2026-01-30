/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'
import { Id, api, isEmpty } from './common.js'

describe('Logs', function () {
  it('returns logs', async function () {
    const resp = await api.get('/api/logs', Id.ADMIN)
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTypeOf('object')
    expect(resp.body).toHaveProperty('logs')
    ;(resp.body.logs as any[]).forEach(log => {
      expect(log).toBeTypeOf('object')
    })
  })

  it('should not be accessible without permission', async function () {
    const perms = [Id.WORKERS, Id.JOBS, '']
    for (const perm of perms) {
      const resp = await api.get('/api/logs', perm)
      expect(resp.status).toBe(403)
      expect(isEmpty(resp.body)).toBe(true)
    }
  })
})
