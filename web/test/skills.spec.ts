import { api, createSkillHasData, Id, isEmpty } from './common'

type Skill = { id: string; name: string }

describe('Skills', function () {
  //#region Access
  describe('#access', function () {
    it('should not be able to create without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      for (const perm of perms) {
        const body = createSkillHasData()
        const resp = await api.post('/api/skills', perm, body)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }
    })

    it('should be able to create with permission', async function () {
      const body = createSkillHasData()
      const resp = await api.post('/api/skills', Id.ADMIN, body)
      expect(resp.status).toBe(201)
    })

    it('should not be able to delete without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createSkillHasData()
      const skill = await api.post('/api/skills', Id.ADMIN, body)
      const id = skill.body.id

      for (const perm of perms) {
        const resp = await api.del(`/api/skills/${id}`, perm)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterDelete = await api.get('/api/skills', '')
      expect((afterDelete.body as Skill[]).map(s => s.id)).toContain(id)
    })

    it('should not be able to update without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createSkillHasData()
      const skill = await api.post('/api/skills', Id.ADMIN, body)
      const id = skill.body.id
      const name = skill.body.name

      const newName = 'New name'
      for (const perm of perms) {
        const resp = await api.patch(`/api/skills/${id}`, perm, {
          name: newName,
        })
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterPatch = await api.get(`/api/skills/${id}`, '')
      expect(afterPatch.body.name).toBe(name)
    })

    it('should be accessible without permission', async function () {
      const resp = await api.get('/api/skills', '')
      expect(resp.status).toBe(200)
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('creates a skill', async function () {
      const body = createSkillHasData()
      const resp = await api.post('/api/skills', Id.ADMIN, body)
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
    })

    it('returns 404 when skill doesnt exist', async function () {
      const resp = await api.get('/api/skills/1', '')
      expect(resp.status).toBe(404)
    })

    it('returns a list of skills', async function () {
      const resp = await api.get('/api/skills', '')
      expect(resp.status).toBe(200)
      expect(Array.isArray(resp.body)).toBe(true)
      // 4 skills created in previous tests
      expect(resp.body).toHaveLength(4)
    })

    it('returns a skill by id', async function () {
      const body = createSkillHasData()
      await api.post('/api/skills', Id.ADMIN, body)
      const skills = await api.get('/api/skills', '')
      const selectedSkill = skills.body[0]
      const resp = await api.get(`/api/skills/${selectedSkill.id}`, '')
      expect(resp.status).toBe(200)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body).toEqual(selectedSkill)
    })

    it('updates a skill', async function () {
      const skills = await api.get('/api/skills', '')
      const selectedSkill = skills.body[0]

      const body = {
        name: 'Updated name',
      }
      const patch = await api.patch(
        `/api/skills/${selectedSkill.id}`,
        Id.ADMIN,
        body
      )
      expect(patch.status).toBe(204)
      expect(isEmpty(patch.body)).toBe(true)

      const resp = await api.get(`/api/skills/${selectedSkill.id}`, '')
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body.name).toBe(body.name)
    })

    it('deletes a skill', async function () {
      // Add a new skill
      const skillsBeforeAdding = await api.get('/api/skills', '')
      const body = createSkillHasData()
      const skill = await api.post('/api/skills', Id.ADMIN, body)
      const skillId = skill.body.id
      // Check that the skill was added
      const skillsAfterAdding = await api.get('/api/skills', Id.ADMIN)
      expect(skillsAfterAdding.body).toHaveLength(
        skillsBeforeAdding.body.length + 1
      )
      expect((skillsAfterAdding.body as Skill[]).map(s => s.id)).toContain(
        skillId
      )
      // Delete the skill
      const resp = await api.del(`/api/skills/${skillId}`, Id.ADMIN)
      expect(resp.status).toBe(204)
      // Check that the skill was deleted
      const skillsAfterRemoving = await api.get('/api/skills', '')
      expect(skillsAfterRemoving.body).toHaveLength(
        skillsBeforeAdding.body.length
      )
      expect(
        (skillsAfterRemoving.body as Skill[]).map(s => s.id)
      ).not.toContain(skillId)
    })
  })
  //#endregion
  afterAll(api.afterTestBlock)
})
