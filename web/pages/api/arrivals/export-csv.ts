import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getWorkersForCsvExport } from 'lib/data/arrivals'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}.${m}.${y}`
}

function escapeCsv(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

async function get(req: NextApiRequest, res: NextApiResponse) {
  const workers = await getWorkersForCsvExport()

  const header = 'Příjmení;Jméno;Datum narození;Email;Telefon'
  const rows = workers.map(w => {
    const birthDate = w.application?.birthDate
      ? formatDate(w.application.birthDate)
      : ''
    return [
      escapeCsv(w.lastName),
      escapeCsv(w.firstName),
      birthDate,
      escapeCsv(w.email),
      escapeCsv(w.phone),
    ].join(';')
  })

  const bom = '\uFEFF'
  const body = bom + header + '\r\n' + rows.join('\r\n') + '\r\n'
  const date = new Date().toISOString().slice(0, 10)
  const filename = `pracanti-${date}.csv`

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(body)
}

export default APIAccessController(
  [Permission.WORKERS, Permission.ADMIN],
  APIMethodHandler({ get })
)
