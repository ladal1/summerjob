import PageHeader from 'lib/components/page-header/PageHeader'
import FoodAllergiesClientPage from 'lib/components/food-allergy/FoodAllergiesClientPage'
import { getFoodAllergies } from 'lib/data/food-allergies'
import { serializeFoodAllergies } from 'lib/types/food-allergy'
import WorkAllergiesClientPage from 'lib/components/work-allergy/WorkAllergiesClientPage'
import { getWorkAllergies } from 'lib/data/work-allergies'
import { serializeWorkAllergies } from 'lib/types/work-allergy'
import SkillsClientPage from 'lib/components/skill/SkillsClientPage'
import { getSkills } from 'lib/data/skills'
import { serializeSkills } from 'lib/types/skill'
import JobTypesClientPage from 'lib/components/job-type/JobTypesClientPage'
import { getJobTypes } from 'lib/data/job-types'
import { serializeJobTypes } from 'lib/types/job-type'
import ToolNamesClientPage from 'lib/components/tool-name/ToolNamesClientPage'
import { getToolNames } from 'lib/data/tool-names'
import { serializeToolNames } from 'lib/types/tool-name'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ListsPage() {
  const foodAllergies = await getFoodAllergies()
  const serializedFoodAllergies = serializeFoodAllergies(foodAllergies)

  const workAllergies = await getWorkAllergies()
  const serializedWorkAllergies = serializeWorkAllergies(workAllergies)

  const skills = await getSkills()
  const serializedSkills = serializeSkills(skills)

  const jobTypes = await getJobTypes()
  const serializedJobTypes = serializeJobTypes(jobTypes)

  const toolNames = await getToolNames()
  const serializedToolNames = serializeToolNames(toolNames)
  return (
    <>
      <PageHeader title={'Seznamy'}>
        <Link href="/admin/lists/food-allergies/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-utensils"></i>
            <span>Nová alergie na jídlo</span>
          </button>
        </Link>

        <Link href="/admin/lists/work-allergies/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-hammer"></i>
            <span>Nová pracovní alergie</span>
          </button>
        </Link>

        <Link href="/admin/lists/skills/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-book"></i>
            <span>Nová dovednost</span>
          </button>
        </Link>

        <Link href="/admin/lists/job-types/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-briefcase"></i>
            <span>Nový typ práce</span>
          </button>
        </Link>

        <Link href="/admin/lists/tool-names/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-tools"></i>
            <span>Nový nástroj</span>
          </button>
        </Link>
      </PageHeader>

      <FoodAllergiesClientPage initialData={serializedFoodAllergies} />
      <WorkAllergiesClientPage initialData={serializedWorkAllergies} />
      <SkillsClientPage initialData={serializedSkills} />
      <JobTypesClientPage initialData={serializedJobTypes} />
      <ToolNamesClientPage initialData={serializedToolNames} />
    </>
  )
}
