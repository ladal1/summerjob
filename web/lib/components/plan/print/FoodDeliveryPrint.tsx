import { formatDateLong } from 'lib/helpers/helpers'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'

type Worker = {
  id: string
  firstName: string
  lastName: string
  phone: string
  foodAllergies: { name: string }[]
}

type Job = {
  id: string
  proposedJob: {
    name: string
    address: string
    contact: string
    hasFood: boolean
    area: { name: string } | null
  }
  workers: Worker[]
}

type JobOrder = {
  id: string
  order: number
  activeJob: Job
  recipients: { id: string }[]
}

type Delivery = {
  id: string
  courierNum: number
  notes: string | null
  jobs: JobOrder[]
}

type Plan = {
  id: string
  day: Date
}

interface Props {
  plan: Plan
  deliveries: Delivery[]
}

export default function FoodDeliveryPrint({ plan, deliveries }: Props) {
  return (
    <>
      {deliveries.length === 0 ? (
        <div className="print-a4">
          <div className="header">
            <h1>Rozvoz jídla – {formatDateLong(plan.day)}</h1>
            <Image
              src={logoImage}
              className="smj-logo"
              alt="SummerJob logo"
              quality={98}
              priority
            />
          </div>
          <p>V tomto plánu zatím není žádný rozvozník.</p>
        </div>
      ) : (
        deliveries.map(delivery => (
          <CourierSheet key={delivery.id} plan={plan} delivery={delivery} />
        ))
      )}
    </>
  )
}

function CourierSheet({ plan, delivery }: { plan: Plan; delivery: Delivery }) {
  const totalRecipients = delivery.jobs.reduce(
    (sum, j) => sum + j.recipients.length,
    0
  )
  return (
    <div className="print-a4" style={{ pageBreakAfter: 'always' }}>
      <div className="header">
        <div>
          <h1>
            Rozvozník {delivery.courierNum} – {formatDateLong(plan.day)}
          </h1>
          <div style={{ fontSize: '1em', marginTop: 4 }}>
            {delivery.jobs.length} jobů, {totalRecipients} jídel
          </div>
        </div>
        <Image
          src={logoImage}
          className="smj-logo"
          alt="SummerJob logo"
          quality={98}
          priority
        />
      </div>

      {delivery.notes && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            backgroundColor: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
          }}
        >
          <strong>📌 Poznámka:</strong>
          <div style={{ marginTop: 4 }}>{delivery.notes}</div>
        </div>
      )}

      {delivery.jobs.length === 0 ? (
        <p>Žádné přiřazené joby.</p>
      ) : (
        delivery.jobs.map((jobOrder, idx) => (
          <JobSheet key={jobOrder.id} jobOrder={jobOrder} index={idx + 1} />
        ))
      )}
    </div>
  )
}

function JobSheet({ jobOrder, index }: { jobOrder: JobOrder; index: number }) {
  const { activeJob } = jobOrder
  const { proposedJob } = activeJob
  const recipientIdSet = new Set(jobOrder.recipients.map(r => r.id))
  const recipients = activeJob.workers.filter(w => recipientIdSet.has(w.id))
  const allergicRecipients = recipients.filter(r => r.foodAllergies.length > 0)
  const standardRecipients = recipients.filter(
    r => r.foodAllergies.length === 0
  )

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: '2px solid #000',
        pageBreakInside: 'avoid',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: '1.4em', fontWeight: 'bold' }}>{index}.</span>
        <h2 style={{ margin: 0 }}>{proposedJob.name}</h2>
        {!proposedJob.hasFood && (
          <span
            style={{
              backgroundColor: '#ffc107',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.85em',
              fontWeight: 'bold',
            }}
          >
            POTŘEBUJE JÍDLO
          </span>
        )}
      </div>

      <div style={{ marginLeft: 28 }}>
        <div>
          <i className="fas fa-house me-1"></i>
          <strong>{proposedJob.address}</strong>
          {proposedJob.area?.name && ` (${proposedJob.area.name})`}
        </div>
        {proposedJob.contact && (
          <div>
            <i className="fas fa-phone me-1"></i>
            {proposedJob.contact}
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <strong>
            Příjemci: {recipients.length} / {activeJob.workers.length}
          </strong>
        </div>

        {allergicRecipients.length > 0 && (
          <div
            style={{
              marginTop: 6,
              padding: 8,
              border: '2px solid #dc3545',
              borderRadius: 4,
            }}
          >
            <strong style={{ color: '#dc3545' }}>
              ⚠ ALERGICI ({allergicRecipients.length}):
            </strong>
            <ul style={{ margin: '4px 0 0 18px' }}>
              {allergicRecipients.map(r => (
                <li key={r.id}>
                  <strong>
                    ☐ {r.firstName} {r.lastName}
                  </strong>
                  {' — '}
                  <span style={{ color: '#dc3545' }}>
                    {r.foodAllergies.map(a => a.name).join(', ')}
                  </span>
                  {r.phone && ` · ${r.phone}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {standardRecipients.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <strong>Běžná jídla ({standardRecipients.length}):</strong>
            <ul style={{ margin: '4px 0 0 18px' }}>
              {standardRecipients.map(r => (
                <li key={r.id}>
                  ☐ {r.firstName} {r.lastName}
                  {r.phone && ` · ${r.phone}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
