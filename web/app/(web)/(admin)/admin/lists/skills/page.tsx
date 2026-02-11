import PageHeader from 'lib/components/page-header/PageHeader'
import SkillsClientPage from 'lib/components/skill/SkillsClientPage'
import { getSkills } from 'lib/data/skills'
import { serializeSkills } from 'lib/types/skill'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SkillsPage() {
  const skills = await getSkills()
  const serializedSkills = serializeSkills(skills)
  return (
    <>
      <PageHeader title={'Dovednosti'}>
        <Link href="/admin/lists/skills/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-book"></i>
            <span>Nová dovednost</span>
          </button>
        </Link>
      </PageHeader>

      <SkillsClientPage initialData={serializedSkills} />
    </>
  )
}
