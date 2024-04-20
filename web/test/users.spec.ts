/* import { Id, api } from './common'
import chai from 'chai'

chai.should()

describe('Users', function () {
  it('returns a list of users', async function () {
    const resp = await api.get('/api/users', Id.ADMIN)
    resp.status.should.equal(200)
    resp.body.should.be.an('array')
    ;(resp.body as any[]).forEach(user => {
      user.should.have.property('id')
    })
  })

  it('modifies user permissions', async function () {
    const worker = await api.createWorker()
    const users = await api.get('/api/users', Id.ADMIN)
    const selectedUser = (users.body as any[]).find(u => u.id === worker.id)
    selectedUser.permissions.should.have.lengthOf(0)
    const userUpdateData = {
      permissions: ['JOBS', 'CARS'],
    }
    const resp = await api.patch(
      `/api/users/${worker.id}`,
      Id.ADMIN,
      userUpdateData
    )
    resp.status.should.equal(204)

    const updatedUsers = await api.get('/api/users', Id.ADMIN)
    const updatedUser = (updatedUsers.body as any[]).find(
      u => u.id === worker.id
    )
    updatedUser.permissions.should.have.lengthOf(2)
    updatedUser.permissions.should.include('JOBS')
    updatedUser.permissions.should.include('CARS')
  })

  it('blocks a user', async function () {
    const worker = await api.createWorker()
    const users = await api.get('/api/users', Id.ADMIN)
    const selectedUser = (users.body as any[]).find(u => u.id === worker.id)
    selectedUser.permissions.should.have.lengthOf(0)
    const userUpdateData = {
      blocked: true,
    }
    const resp = await api.patch(
      `/api/users/${worker.id}`,
      Id.ADMIN,
      userUpdateData
    )
    resp.status.should.equal(204)

    const updatedUsers = await api.get('/api/users', Id.ADMIN)
    const updatedUser = (updatedUsers.body as any[]).find(
      u => u.id === worker.id
    )
    updatedUser.blocked.should.equal(true)
  })

  this.afterAll(api.afterTestBlock)
})
 */
