import { skillMapping } from 'lib/data/enumMapping/skillMapping'
import { Skill } from 'lib/prisma/client'
import { WorkerComplete } from 'lib/types/worker'
import { useMemo } from 'react'

interface WorkersStatisticsProps {
  data: WorkerComplete[]
}

export const WorkersStatistics = ({ data }: WorkersStatisticsProps) => {
  const calculateWithCar = useMemo(() => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + (current.cars.length > 0 ? 1 : 0)
    }, 0)

    return count ?? 0
  }, [data])

  const calculateIsStrong = useMemo(() => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + +current.isStrong
    }, 0)

    return count ?? 0
  }, [data])

  interface SkillsList {
    [key: string]: {
      name: Skill
      amount: number
    }
  }

  const skillsList: SkillsList = useMemo(
    () =>
      (data || []).reduce((accumulator: SkillsList, worker) => {
        const sortedSkills = worker.skills.sort((a, b) =>
          skillMapping[a].localeCompare(skillMapping[b])
        )
        sortedSkills.forEach(skill => {
          accumulator[skill] = {
            name: skill,
            amount: (accumulator[skill]?.amount || 0) + 1,
          }
        })
        return accumulator
      }, {}),
    [data]
  )

  return (
    <>
      <div className="vstack smj-search-stack smj-shadow rounded-3">
        <h5>Statistiky</h5>
        <hr />
        <ul className="list-group list-group-flush ">
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Pracantů</span>
            <span>{data?.length}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">S autem</span>
            <span>{calculateWithCar}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Silných</span>
            <span>{calculateIsStrong}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 smj-gray">
            <span className="me-2">Dovednosti</span>
            <table className="table">
              <tbody>
                {Object.entries(skillsList).map(([key, skill]) => (
                  <tr key={key} className="text-end">
                    <td>{skillMapping[skill.name]}</td>
                    <td>{skill.amount}</td>
                  </tr>
                ))}
                {Object.entries(skillsList).length === 0 && (
                  <tr key="none" className="text-end">
                    <td>žádné</td>
                  </tr>
                )}
              </tbody>
            </table>
          </li>
        </ul>
      </div>
    </>
  )
}
