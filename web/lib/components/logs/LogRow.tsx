import { ExpandableRow } from '../table/ExpandableRow'
import { Logging } from 'lib/prisma/client'
import { RowContent, RowContentsInterface } from '../table/RowContent'

interface LogRowProps {
  log: Logging
}

export default function LogRow({ log }: LogRowProps) {
  const expandedContent: RowContentsInterface[] = [
    {
      label: 'Autor',
      content: `${log.authorName}`,
    },
    {
      label: 'ID autora',
      content: `${log.authorId}`,
    },
    {
      label: 'ID cíle',
      content: `${log.authorId}`,
    },
    {
      label: 'Data',
      content: (
        <pre className="text-prewrap">
          {JSON.stringify(JSON.parse(log.message || '{}'), null, 2)}
        </pre>
      ),
    },
  ]

  return (
    <ExpandableRow key={log.id} data={formatLogRow(log)}>
      <RowContent data={expandedContent} />
    </ExpandableRow>
  )
}

function formatLogRow(log: Logging) {
  const MESSAGE_MAX_LENGTH = 50
  const message =
    log.message.length > MESSAGE_MAX_LENGTH
      ? log.message.substring(0, MESSAGE_MAX_LENGTH - 3) + '...'
      : log.message
  return [
    { content: log.timestamp.toLocaleString('cs') },
    { content: log.eventType },
    { content: log.authorName },
    { content: message },
  ]
}
