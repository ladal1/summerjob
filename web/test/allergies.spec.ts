import { api } from './common'
import chai from 'chai'

chai.should()

describe('Allergies', function () {
  it('returns a list of allergies', async function () {
    const resp = await api.get('/api/allergies', '')
    resp.status.should.equal(200)
    resp.body.should.be.an('array')
    ;(resp.body as any[]).forEach(allergy => {
      allergy.should.be.a('string')
    })
  })
})
