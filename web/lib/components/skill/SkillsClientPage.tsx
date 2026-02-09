'use client'
import { Serialized } from 'lib/types/serialize'
import { deserializeSkills, SkillHasComplete } from 'lib/types/skill'
import { useAPISkills } from 'lib/fetcher/skill'
import { SkillsTable } from './SkillsTable'

interface SkillsClientPageProps {
  initialData: Serialized
}

export default function SkillsClientPage({
  initialData,
}: SkillsClientPageProps) {
  const initialSkills = deserializeSkills(initialData)
  const { data, mutate } = useAPISkills({
    fallbackData: initialSkills,
  })

  const requestReload = (expectedResult: SkillHasComplete[]) => {
    mutate(expectedResult)
  }

  return (
    <>
      <section>
        <div className="container-fluid">
          <h3>Dovednosti</h3>
          <div className="row gx-3"></div>
          <div className="row gx-3">
            <div className="col-lg-10 pb-2">
              <SkillsTable data={data} reload={requestReload} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
