/* import { Id, api } from './common'
import chai from 'chai'

chai.should()

describe('Logs', function () {
  it('returns logs', async function () {
    const resp = await api.get('/api/logs', Id.ADMIN)
    resp.status.should.equal(200)
    resp.body.should.be.an('object')
    resp.body.should.have.property('logs')
    ;(resp.body.logs as any[]).forEach(log => {
      log.should.be.an('object')
    })
  })

  it('should not be accessible without permission', async function () {
    const perms = [Id.WORKERS, Id.JOBS, '']
    for (const perm of perms) {
      const resp = await api.get('/api/logs', perm)
      resp.status.should.equal(403)
      resp.body.should.be.empty
    }
  })
})
 */
