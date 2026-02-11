import { ToolName } from 'lib/prisma/client'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { WorkerComplete } from 'lib/types/worker'
import { useMemo } from 'react'

interface PlanStatisticsProps {
  data?: ActiveJobNoPlan[]
  workersWithoutJob: WorkerComplete[]
}

export const PlanStatistics = ({
  data,
  workersWithoutJob,
}: PlanStatisticsProps) => {
  interface Tool {
    name: ToolName
    amount: number
  }

  interface ToolsList {
    [key: string]: Tool
  }

  const toolsToTakeWithList: ToolsList = useMemo(
    () =>
      data?.reduce((accumulator: ToolsList, job) => {
        const sortedTools = job.proposedJob.toolsToTakeWith.sort((a, b) =>
          a.tool.name.localeCompare(b.tool.name)
        )
        sortedTools.forEach(({ tool: name, amount }) => {
          accumulator[name.name] = {
            name,
            amount: (accumulator[name.name]?.amount || 0) + amount,
          }
        })
        return accumulator
      }, {}) ?? {},
    [data]
  )

  return (
    <>
      <div className="vstack smj-search-stack smj-shadow rounded-3">
        <h5>Statistiky</h5>
        <hr />
        <ul className="list-group list-group-flush">
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Nasazených pracantů</span>
            <span>{data?.flatMap(x => x.workers).length ?? 0}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Bez práce</span>
            <span>{workersWithoutJob?.length ?? 0}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Naplánované joby</span>
            <span>{data?.length ?? 0}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Celkem míst v jobech</span>
            <span className="text-nowrap">
              {(data ?? [])
                .map(j => j.proposedJob.minWorkers)
                .reduce((a, b) => a + b, 0)}{' '}
              -{' '}
              {(data ?? [])
                .map(j => j.proposedJob.maxWorkers)
                .reduce((a, b) => a + b, 0)}
            </span>
          </li>
          <li className="list-group-item ps-0 pe-0 smj-gray">
            <span className="me-2">Potřebné nástroje</span>
            <table className="table">
              <tbody>
                {Object.entries(toolsToTakeWithList)
                  .sort(([, areanameA], [, areanameB]) => {
                    if (areanameA.amount === areanameB.amount)
                      return areanameA.name.name.localeCompare(
                        areanameB.name.name
                      )
                    if (areanameA.amount < areanameB.amount) return -1
                    if (areanameA.amount > areanameB.amount) return 1
                    return 0
                  })
                  .map(([key, tool]) => (
                    <tr key={key} className="text-end">
                      <td>{tool.name.name}</td>
                      <td>{tool.amount}</td>
                    </tr>
                  ))}
                {Object.entries(toolsToTakeWithList).length === 0 && (
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
