import chai from 'chai'
import { api } from './common'

chai.should()

describe('Posts', function () {
  this.afterAll(api.afterTestBlock)
})
