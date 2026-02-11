import ErrorPage404 from 'lib/components/404/404'
import EditSkill from 'lib/components/skill/EditSkill'
import { getSkillById } from 'lib/data/skills'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditSkillPage(props: PathProps) {
  const params = await props.params
  const skill = await getSkillById(params.id)
  if (!skill) return <ErrorPage404 message="Dovednost nenalezena." />

  return <EditSkill skill={skill} />
}
