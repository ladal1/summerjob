/* import { Id, api, createSummerJobEventData } from './common'
import chai from 'chai'

chai.should()

describe('SummerJob Events', function () {
  it('returns a list of events', async function () {
    const resp = await api.get('/api/summerjob-events', Id.ADMIN)
    resp.status.should.equal(200)
    resp.body.should.be.an('array')
    resp.body.should.have.lengthOf(1)
    ;(resp.body as any[]).forEach(user => {
      user.should.have.property('id')
    })
  })

  it('creates an event', async function () {
    const resp = await api.post(
      '/api/summerjob-events',
      Id.ADMIN,
      createSummerJobEventData()
    )
    resp.status.should.equal(201)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
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
        e.isActive.should.equal(true)
      } else {
        e.isActive.should.equal(false)
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
      u.blocked.should.equal(!u.permissions.includes('ADMIN'))
    })
    const adminUserIds = (users.body as any[]).map(u => u.id)
    // Check that only admins are listed in workers
    const workers = await api.get('/api/workers', Id.ADMIN)
    ;(workers.body as any[]).forEach(w => {
      adminUserIds.should.include(w.id)
    })
    // Set the previous active event back
    await api.patch(`/api/summerjob-events/${activeEventId}`, Id.ADMIN, {
      isActive: true,
    })
    const workersInOriginalEvent = await api.get('/api/workers', Id.ADMIN)
    ;(workersInOriginalEvent.body as any[])
      .map(w => w.id)
      .should.include(worker.id)
  })

  this.afterAll(api.afterTestBlock)
})
 */
