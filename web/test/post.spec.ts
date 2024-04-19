import chai from 'chai'
import { Id, api } from './common'

chai.should()

describe('Posts', function () {
  it('returns 404 when post does not exist', async function () {
    const resp = await api.get('/api/posts/1', Id.POSTS)
    resp.status.should.equal(404)
  })

  this.afterAll(api.afterTestBlock)
})
