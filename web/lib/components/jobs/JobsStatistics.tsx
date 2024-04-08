import { toolNameMapping } from 'lib/data/enumMapping/toolNameMapping'
import { ToolName } from 'lib/prisma/client'
import { ProposedJobComplete } from 'lib/types/proposed-job'
import React, { useMemo } from 'react'

interface JobsStatisticsProps {
  data: ProposedJobComplete[]
}

export const JobsStatistics = ({ data }: JobsStatisticsProps) => {
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
        const sortedTools = job.toolsToTakeWith.sort((a, b) =>
          toolNameMapping[a.tool].localeCompare(toolNameMapping[b.tool])
        )
        sortedTools.forEach(({ tool: name, amount }) => {
          accumulator[name] = {
            name,
            amount:
              (accumulator[name]?.amount || 0) + amount * job.requiredDays,
          }
        })
        return accumulator
      }, {}) ?? {},
    [data]
  )

  const [hiddenJobs, regulatJobs, completedJobs] = useMemo(() => {
    const { hidden, completed, regular } = data.reduce(
      (acc, job) => {
        if (job.hidden) {
          acc.hidden += 1
        } else if (job.completed) {
          acc.completed += 1
        } else {
          acc.regular += 1
        }
        return acc
      },
      { hidden: 0, completed: 0, regular: 0 }
    )

    return [hidden, regular, completed]
  }, [data])

  interface AreaNameList {
    [key: string]: {
      name: string
      amount: number
    }
  }

  const areanameList: AreaNameList = useMemo(
    () =>
      (data || []).reduce((accumulator: AreaNameList, job) => {
        accumulator[job.area?.name ?? ''] = {
          name: job.area?.name ?? '',
          amount: (accumulator[job.area?.name ?? '']?.amount || 0) + 1,
        }
        return accumulator
      }, {}),
    [data]
  )

  const minWorkers = useMemo(
    () =>
      (data || []).reduce((acc, job) => {
        acc += job.minWorkers * job.requiredDays
        return acc
      }, 0),
    [data]
  )

  const maxWorkers = useMemo(
    () =>
      (data || []).reduce((acc, job) => {
        acc += job.maxWorkers * job.requiredDays
        return acc
      }, 0),
    [data]
  )

  return (
    <>
      <div className="vstack smj-search-stack smj-shadow rounded-3">
        <h5>Statistiky</h5>
        <small>na všechny dny</small>
        <hr />
        <ul className="list-group list-group-flush">
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Celkem jobů</span>
            <span>{data.length ?? 0}</span>
          </li>
          <table className="table">
            <tbody>
              <tr className="text-end">
                <td>K dispozici</td>
                <td>{regulatJobs}</td>
              </tr>
              <tr className="text-end">
                <td>Dokončené</td>
                <td>{completedJobs}</td>
              </tr>
              <tr className="text-end">
                <td>Skryté</td>
                <td>{hiddenJobs}</td>
              </tr>
            </tbody>
          </table>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Celkem míst v jobech</span>
            <span className="text-nowrap">
              {minWorkers} - {maxWorkers}
            </span>
          </li>
          <li className="list-group-item ps-0 pe-0 smj-gray">
            <span className="me-2">Potřebné nástroje</span>
            <table className="table">
              <tbody>
                {Object.entries(toolsToTakeWithList)
                  .sort(([keyA, areanameA], [keyB, areanameB]) => {
                    if (areanameA.amount === areanameB.amount)
                      return areanameA.name.localeCompare(areanameB.name)
                    if (areanameA.amount < areanameB.amount) return -1
                    if (areanameA.amount > areanameB.amount) return 1
                    return 0
                  })
                  .map(([key, tool]) => (
                    <tr key={key} className="text-end">
                      <td>{toolNameMapping[tool.name]}</td>
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
          <li className="list-group-item ps-0 pe-0 smj-gray">
            <span className="me-2">Lokality</span>
            <table className="table">
              <tbody>
                {Object.entries(areanameList)
                  .sort(([keyA, areanameA], [keyB, areanameB]) => {
                    if (areanameA.amount === areanameB.amount)
                      return areanameA.name.localeCompare(areanameB.name)
                    if (areanameA.amount < areanameB.amount) return -1
                    if (areanameA.amount > areanameB.amount) return 1
                    return 0
                  })
                  .map(([key, areaname]) => (
                    <React.Fragment key={key}>
                      {areaname && (
                        <tr key={key} className="text-end">
                          <td>{areaname.name}</td>
                          <td>
                            {areaname.amount}
                            {'x'}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                {Object.entries(areanameList).length === 0 && (
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
