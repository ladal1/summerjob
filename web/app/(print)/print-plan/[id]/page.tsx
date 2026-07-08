import ErrorPage404 from 'lib/components/404/404'
import RideListPrint from 'lib/components/plan/print/RideListPrint'
import { formatPhone } from 'lib/components/phone/PhoneText'
import { getPlanById } from 'lib/data/plans'
import { formatDateLong } from 'lib/helpers/helpers'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { sortJobsByAreaAndId } from 'lib/types/plan'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import '/styles/print.css'
import { ToolCompleteData } from 'lib/types/tool'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

function formatTools(tools: ToolCompleteData[]) {
  if (tools.length == 0) return 'Žádné'
  return tools
    .map(tool => tool.tool.name + (tool.amount > 1 ? ' - ' + tool.amount : ''))
    .join(', ')
}

export default async function PrintPlanPage(props: PathProps) {
  const params = await props.params
  const plan = await getPlanById(params.id)
  if (!plan) return <ErrorPage404 message="Plán nenalezen." />
  const sortedJobs = sortJobsByAreaAndId(plan.jobs)

  return (
    <>
      <div className="print-a4">
        <div className="header">
          <h1>{formatDateLong(plan.day)}</h1>
          <Image
            src={logoImage}
            className="smj-logo"
            alt="SummerJob logo"
            quality={98}
            priority={true}
          />
        </div>

        {sortedJobs.map(job => (
          <JobInfo
            job={job}
            jobs={sortedJobs}
            isPrintPage={true}
            key={job.id}
          ></JobInfo>
        ))}
      </div>
    </>
  )
}

export function JobInfo({
  job,
  jobs,
  isPrintPage,
}: {
  job: ActiveJobNoPlan
  jobs: ActiveJobNoPlan[]
  isPrintPage: boolean
}) {
  const otherJobs = jobs.filter(j => j.id !== job.id)
  return (
    <div className="jobinfo-container">
      <div className="job-number-row">
        <div className="job-number-col">{job.seqId}</div>
        <h2>{job.proposedJob.name}</h2>
      </div>
      <div className="job-data-col">
        <div className="w-60">
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {job.proposedJob.publicDescription}
            </ReactMarkdown>
          </div>
          <div>
            <i className="fas fa-house me-1"></i>
            {job.proposedJob.address},{' '}
            {job.proposedJob.area?.name ?? 'Nezadaná oblast'}
          </div>
          <div>
            <i className="fas fa-phone me-1"></i>
            {job.proposedJob.contact}
          </div>

          <div>
            <i className="fas fa-screwdriver-wrench me-1"></i>
            {formatTools(job.proposedJob.toolsToTakeWith)}
          </div>
          <div>
            <i className="fas fa-utensils me-1"></i>
            {job.proposedJob.hasFood ? 'Ano' : 'Ne'}
            <span className="ms-4 me-4"></span>
            <i className="fas fa-shower me-1"></i>
            {job.proposedJob.hasShower ? 'Ano' : 'Ne'}
          </div>
        </div>

        <div className="w-40 mt-2">
          <RideListPrint job={job} otherJobs={otherJobs} />
          {isPrintPage && (
            <div className="contact-box">
              <div className="contact-box-title" style={{ color: '#d63384' }}>
                <i className="fas fa-user-nurse me-1"></i>
                Zdravotník
              </div>
              <div className="contact-box-row">
                <div className="contact-box-label">Telefon:</div>
                <div className="contact-box-value">
                  {formatPhone('732 403 990')}
                </div>
              </div>
            </div>
          )}
          {isPrintPage && job.proposedJob.area?.manager && (
            <div className="contact-box">
              <div className="contact-box-title" style={{ color: '#198754' }}>
                <i className="fas fa-user-tie me-1"></i>
                JobTeam
              </div>
              <div className="contact-box-row">
                <div className="contact-box-label">
                  {job.proposedJob.area.manager.firstName}{' '}
                  {job.proposedJob.area.manager.lastName}
                </div>
                <div className="contact-box-value">
                  {formatPhone(job.proposedJob.area.manager.phone)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
