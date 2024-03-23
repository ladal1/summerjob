import { ExpandableRow } from '../table/ExpandableRow'
import { SimpleRow } from '../table/SimpleRow'
import { Logging } from 'lib/prisma/client'

interface LogRowProps {
  log: Logging
}

export default function LogRow({ log }: LogRowProps) {
  return (
    <ExpandableRow key={log.id} data={formatLogRow(log)}>
      <div className="row">
        <div className="col">
          <b>Autor: </b>
          {log.authorName}
        </div>
      </div>
      <div className="row">
        <div className="col">
          <b>ID autora: </b>
          {log.authorId}
        </div>
      </div>
      <div className="row">
        <div className="col">
          <b>ID cíle: </b>
          {log.resourceId}
        </div>
      </div>
      <div className="row">
        <div className="col">
          <b>Data: </b>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <pre className="text-prewrap">
            {JSON.stringify(JSON.parse(log.message || '{}'), null, 2)}
          </pre>
        </div>
      </div>
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
    log.timestamp.toLocaleString('cs'),
    log.eventType,
    log.authorName,
    message,
  ]
}

/*
{logs.map((log) => (
            <pre className="text-prewrap" key={log.id}>
              {JSON.stringify(JSON.parse(log.message || "{}"), null, 2)}
            </pre>
          ))}
*/
