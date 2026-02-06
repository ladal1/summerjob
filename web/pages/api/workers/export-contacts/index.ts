import { APIAccessController } from 'lib/api/APIAccessControler'
import { APIMethodHandler } from 'lib/api/MethodHandler'
import { getWorkers } from 'lib/data/workers'
import { Permission } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

function escapeVCardText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function normalizePhone(phone?: string | null) {
  if (!phone) return null
  let p = phone.replace(/[()\s-]/g, '')
  if (p.startsWith('00')) p = `+${p.slice(2)}`
  return p
}

function makeVCard(w: {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
}) {
  const first = escapeVCardText(w.firstName ?? '')
  const last = escapeVCardText(w.lastName ?? '')
  const fn = escapeVCardText(`${w.firstName ?? ''} ${w.lastName ?? ''}`.trim())

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `UID:${w.id}`,
    `N:${last};${first};;;`,
    `FN:${fn}`,
    'ORG:SummerJob',
    'CATEGORIES:SummerJob',
  ]

  const phone = normalizePhone(w.phone)
  if (phone) {
    lines.push(`TEL;TYPE=CELL:${phone}`)
  }
  if (w.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardText(w.email)}`)
  }

  lines.push('END:VCARD')

  return lines.join('\r\n')
}

async function get(req: NextApiRequest, res: NextApiResponse) {
  const workers = await getWorkers()

  const vcards = (workers ?? []).map(w =>
    makeVCard({
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      phone: w.phone,
      email: w.email,
    })
  )

  const body = vcards.join('\r\n') + '\r\n'
  const date = new Date().toISOString().slice(0, 10)
  const filename = `pracanti-${date}.vcf`

  res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(body)
}

export default APIAccessController(
  [Permission.WORKERS, Permission.ADMIN],
  APIMethodHandler({ get })
)
