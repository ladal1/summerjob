import { formatDateShort } from 'lib/helpers/helpers'

export interface SameCoworkerIssue {
  name: string
  jobName: string
  planDay: string
}

interface WorkerIssueProps {
  sameWork: Date[]
  sameCoworker: SameCoworkerIssue[]
}

export const WorkerIssue = ({ sameWork, sameCoworker }: WorkerIssueProps) => {
  const makeTitle = () => {
    let issue = ''
    if (sameWork.length !== 0) {
      const days = sameWork.map(day => formatDateShort(day))
      issue += `Pracant již na tomto jobu dělal ${days.length} dní (${days.join(
        ', '
      )})`
    }
    if (sameCoworker.length !== 0) {
      if (sameWork.length !== 0) {
        issue += '\n'
      }
      issue += 'Pracant už s některými pracanty z tohoto jobu pracoval ('
      const cows = sameCoworker.map(
        cow => cow.name + ' v ' + cow.planDay + ' na jobu ' + cow.jobName
      )
      issue += cows.join(', ')
      issue += ')'
    }
    return issue
  }
  return (
    <>
      {(sameWork.length !== 0 || sameCoworker.length !== 0) && (
        <i
          className="fas fa-triangle-exclamation link-warning fs-5 me-2 cursor-pointer"
          title={makeTitle()}
        ></i>
      )}
    </>
  )
}
