'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import Link from 'next/link'
import { PhotoOnClickModal } from '../photo/PhotoOnClickModal'
import { IconAndLabel } from '../forms/IconAndLabel'

interface Application {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  gender: string
  address: string
  foodAllergies?: string
  workAllergies?: string
  toolsSkills: string
  toolsBringing: string
  pastParticipation: boolean
  arrivalDate: string
  departureDate: string
  tShirtSize?: string
  playsInstrument?: string
  accommodationPrice: string
  ownsCar: boolean
  canBeMedic: boolean
  additionalInfo?: string
  photo?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

export const dynamic = 'force-dynamic'

export default function ApplicationAdminDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = typeof params?.id === 'string' ? params?.id : null

  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  // Use current URL search parameters for back navigation
  const currentSearchParams = searchParams?.toString()
  const backHref = `/admin/applications${currentSearchParams ? `?${currentSearchParams}` : ''}`

  useEffect(() => {
    if (!id) return

    const fetchApplication = async () => {
      try {
        const res = await fetch(`/api/applications/${id}`)

        if (!res.ok) throw new Error('Chyba při načítání dat')

        const data = await res.json()
        setApplication(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [id])

  const updateStatus = async (id: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/applications/${id}/${action}`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        throw new Error('Chyba při změně statusu')
      }

      const updated = await res.json()
      setApplication(updated)
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Načítání přihlášky...</p>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container mt-4">
        <p>Přihláška nenalezena.</p>
      </div>
    )
  }

  const workingDays =
    differenceInCalendarDays(
      parseISO(application.departureDate),
      parseISO(application.arrivalDate)
    ) + 1

  return (
    <div className="container mt-4">
      <Link href={backHref} className="btn btn-secondary">
        <IconAndLabel label={'Zpět na seznam'} icon={'fa fa-arrow-left'} />
      </Link>

      <div className="my-4 d-flex align-items-center gap-3">
        <span>
          <strong>Status:</strong>{' '}
          <span
            className={
              application.status === 'PENDING'
                ? 'text-warning'
                : application.status === 'ACCEPTED'
                  ? 'text-success'
                  : 'text-danger'
            }
          >
            {application.status === 'PENDING'
              ? 'Čeká na schválení'
              : application.status === 'ACCEPTED'
                ? 'Přijato'
                : 'Zamítnuto'}
          </span>
        </span>

        {application.status === 'PENDING' && (
          <>
            <button
              className="btn btn-sm btn-success"
              onClick={() => updateStatus(id as string, 'accept')}
            >
              Přijmout
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => updateStatus(id as string, 'reject')}
            >
              Zamítnout
            </button>
          </>
        )}
      </div>

      <div className="card my-4">
        <div className="card-body">
          <table className="table table-sm table-borderless table-hover mb-0">
            <tbody>
              <tr>
                <th>Jméno</th>
                <td>{application.firstName}</td>
              </tr>
              <tr>
                <th>Příjmení</th>
                <td>{application.lastName}</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>{application.email}</td>
              </tr>
              <tr>
                <th scope="row">Telefon</th>
                <td>{application.phone}</td>
              </tr>
              <tr>
                <th scope="row">Datum narození</th>
                <td>{format(parseISO(application.birthDate), 'd. M. yyyy')}</td>
              </tr>
              <tr>
                <th scope="row">Pohlaví</th>
                <td>{application.gender}</td>
              </tr>
              <tr>
                <th scope="row">Adresa</th>
                <td>{application.address}</td>
              </tr>
              <tr>
                <th scope="row">Alergie na jídlo</th>
                <td>{application.foodAllergies || 'Neuvedeno'}</td>
              </tr>
              <tr>
                <th scope="row">Alergie na práci</th>
                <td>{application.workAllergies || 'Neuvedeno'}</td>
              </tr>
              <tr>
                <th scope="row">Nářadí, se kterým umí zacházet</th>
                <td>{application.toolsSkills || 'Neuvedeno'}</td>
              </tr>
              <tr>
                <th scope="row">Nářadí, které přiveze</th>
                <td>{application.toolsBringing || 'Neuvedeno'}</td>
              </tr>
              <tr>
                <th scope="row">Zúčastnil se dříve</th>
                <td>{application.pastParticipation ? 'Ano' : 'Ne'}</td>
              </tr>
              <tr>
                <th scope="row">Datum příjezdu</th>
                <td>
                  {format(parseISO(application.arrivalDate), 'd. M. yyyy')}
                </td>
              </tr>
              <tr>
                <th scope="row">Datum odjezdu</th>
                <td>
                  {format(parseISO(application.departureDate), 'd. M. yyyy')}
                </td>
              </tr>
              <tr>
                <th scope="row">Doba práce</th>
                <td>
                  {workingDays}
                  {workingDays === 1
                    ? ' den'
                    : workingDays < 5
                      ? ' dny'
                      : ' dní'}
                </td>
              </tr>
              <tr>
                <th scope="row">Velikost trička</th>
                <td>{application.tShirtSize || 'Neuvedeno'}</td>
              </tr>
              <tr>
                <th scope="row">Hudební nástroj</th>
                <td>{application.playsInstrument || 'Neuvedeno'}</td>
              </tr>
              <tr>
                <th scope="row">Cena ubytování</th>
                <td>{application.accommodationPrice} Kč</td>
              </tr>
              <tr>
                <th scope="row">Vlastní auto</th>
                <td>{application.ownsCar ? 'Ano' : 'Ne'}</td>
              </tr>
              <tr>
                <th scope="row">Může být zdravotník</th>
                <td>{application.canBeMedic ? 'Ano' : 'Ne'}</td>
              </tr>
              <tr>
                <th scope="row">Dodatečné informace</th>
                <td>{application.additionalInfo || 'Neuvedeno'}</td>
              </tr>
              <tr>
                <th scope="row">ID přihlášky</th>
                <td>{application.id}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {application.photo && (
        <div className="card p-3 mb-3">
          <strong>Fotografie:</strong>
          <div className="mt-2">
            <PhotoOnClickModal
              photoURL={`/api/applications/${application.id}/photo`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
