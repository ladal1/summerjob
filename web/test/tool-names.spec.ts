import {
  api,
  createJobTypeData,
  createSkillHasData,
  createToolNameData,
  Id,
  isEmpty,
} from './common'

type ToolName = { id: string; name: string }

describe('Tool names', function () {
  //#region Access
  describe('#access', function () {
    it('should not be able to create without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      for (const perm of perms) {
        const body = createToolNameData()
        const resp = await api.post('/api/tool-names', perm, body)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }
    })

    it('should be able to create with permission', async function () {
      const body = createToolNameData()
      const resp = await api.post('/api/tool-names', Id.ADMIN, body)
      expect(resp.status).toBe(201)
    })

    it('should not be able to delete without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createToolNameData()
      const toolName = await api.post('/api/tool-names', Id.ADMIN, body)
      const id = toolName.body.id

      for (const perm of perms) {
        const resp = await api.del(`/api/tool-names/${id}`, perm)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterDelete = await api.get('/api/tool-names', '')
      expect((afterDelete.body as ToolName[]).map(tn => tn.id)).toContain(id)
    })

    it('should not be able to update without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createToolNameData()
      const toolName = await api.post('/api/tool-names', Id.ADMIN, body)
      const id = toolName.body.id
      const name = toolName.body.name

      const newName = 'New name'
      for (const perm of perms) {
        const resp = await api.patch(`/api/tool-names/${id}`, perm, {
          name: newName,
        })
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterPatch = await api.get(`/api/tool-names/${id}`, '')
      expect(afterPatch.body.name).toBe(name)
    })

    it('should be accessible without permission', async function () {
      const resp = await api.get('/api/tool-names', '')
      expect(resp.status).toBe(200)
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('creates a tool name', async function () {
      const body = createToolNameData()
      const resp = await api.post('/api/tool-names', Id.ADMIN, body)
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
    })

    it('creates a tool name with job types and skills', async function () {
      // Create skills and job types
      const skillIds: string[] = []
      const jobTypeIds: string[] = []
      for (let i = 0; i < 5; ++i) {
        const skillBody = createSkillHasData()
        const jobTypeBody = createJobTypeData()
        const skill = await api.post('/api/skills', Id.ADMIN, skillBody)
        const jobType = await api.post('/api/job-types', Id.ADMIN, jobTypeBody)
        skillIds.push(skill.body.id)
        jobTypeIds.push(jobType.body.id)
      }

      // Create tool name
      const body = createToolNameData(skillIds, jobTypeIds)
      const resp = await api.post('/api/tool-names', Id.ADMIN, body)
      const id = resp.body.id
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')

      // Check that the new tool name has the skills and job types
      const toolName = await api.get(`/api/tool-names/${id}`, '')
      expect(toolName.status).toBe(200)
      const returnedSkillIds = toolName.body.skills.map(
        (s: { id: string }) => s.id
      )
      const returnedJobTypeIds = toolName.body.jobTypes.map(
        (jt: { id: string }) => jt.id
      )
      expect(returnedSkillIds).toHaveLength(skillIds.length)
      expect(returnedJobTypeIds).toHaveLength(jobTypeIds.length)
      for (const skillId of skillIds) {
        expect(returnedSkillIds).toContain(skillId)
      }
      for (const jobTypeId of jobTypeIds) {
        expect(returnedJobTypeIds).toContain(jobTypeId)
      }
    })

    it('returns 404 when tool name doesnt exist', async function () {
      const resp = await api.get('/api/tool-names/1', '')
      expect(resp.status).toBe(404)
    })

    it('returns a list of tool names', async function () {
      const resp = await api.get('/api/tool-names', '')
      expect(resp.status).toBe(200)
      expect(Array.isArray(resp.body)).toBe(true)
      // 5 toolNames created in previous tests
      expect(resp.body).toHaveLength(5)
    })

    it('returns a tool name by id', async function () {
      const body = createToolNameData()
      await api.post('/api/tool-names', Id.ADMIN, body)
      const toolNames = await api.get('/api/tool-names', '')
      const selectedToolName = toolNames.body[0]
      const resp = await api.get(`/api/tool-names/${selectedToolName.id}`, '')
      expect(resp.status).toBe(200)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body).toEqual(selectedToolName)
    })

    it('updates a tool name', async function () {
      const toolNames = await api.get('/api/tool-names', '')
      const selectedToolName = toolNames.body[0]

      const body = {
        name: 'Updated name',
      }
      const patch = await api.patch(
        `/api/tool-names/${selectedToolName.id}`,
        Id.ADMIN,
        body
      )
      expect(patch.status).toBe(204)
      expect(isEmpty(patch.body)).toBe(true)

      const resp = await api.get(`/api/tool-names/${selectedToolName.id}`, '')
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body.name).toBe(body.name)
    })

    it("updates tool name's skills", async function () {
      // Create the tool name
      const body = createToolNameData()
      const toolName = await api.post('/api/tool-names', Id.ADMIN, body)
      const id = toolName.body.id

      // Create the skill
      const skillBody = createSkillHasData()
      const skill = await api.post('/api/skills', Id.ADMIN, skillBody)
      const skillId = skill.body.id

      // Update the tool name
      const patchBody = {
        skills: [skillId],
      }
      const patch = await api.patch(
        `/api/tool-names/${id}`,
        Id.ADMIN,
        patchBody
      )
      expect(patch.status).toBe(204)
      expect(isEmpty(patch.body)).toBe(true)

      // Check that the tool name contains the skill
      const updated = await api.get(`/api/tool-names/${id}`, '')
      expect(updated.body).toBeTypeOf('object')
      expect(updated.body).toHaveProperty('skills')
      const skillIds = updated.body.skills.map((s: { id: string }) => s.id)
      expect(skillIds).toContain(skillId)
    })

    it('deletes a tool name', async function () {
      // Add a new toolName
      const toolNamesBeforeAdding = await api.get('/api/tool-names', '')
      const body = createToolNameData()
      const toolName = await api.post('/api/tool-names', Id.ADMIN, body)
      const toolNameId = toolName.body.id
      // Check that the tool name was added
      const toolNamesAfterAdding = await api.get('/api/tool-names', Id.ADMIN)
      expect(toolNamesAfterAdding.body).toHaveLength(
        toolNamesBeforeAdding.body.length + 1
      )
      expect(
        (toolNamesAfterAdding.body as ToolName[]).map(tn => tn.id)
      ).toContain(toolNameId)
      // Delete the toolName
      const resp = await api.del(`/api/tool-names/${toolNameId}`, Id.ADMIN)
      expect(resp.status).toBe(204)
      // Check that the toolName was deleted
      const toolNamesAfterRemoving = await api.get('/api/tool-names', '')
      expect(toolNamesAfterRemoving.body).toHaveLength(
        toolNamesBeforeAdding.body.length
      )
      expect(
        (toolNamesAfterRemoving.body as ToolName[]).map(tn => tn.id)
      ).not.toContain(toolNameId)
    })
  })
  //#endregion
  afterAll(api.afterTestBlock)
})
