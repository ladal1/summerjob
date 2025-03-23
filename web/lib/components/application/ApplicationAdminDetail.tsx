'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { PhotoOnClickModal } from '../photo/PhotoOnClickModal'

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
  const id = typeof params?.id === 'string' ? params?.id : null

  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  async function updateStatus(id: string, newStatus: 'accept' | 'reject') {
    try {
      const res = await fetch(`/api/applications/${id}/${newStatus}`, {
        method: 'PATCH',
      })

      if (!res.ok) throw new Error('Nepodařilo se aktualizovat stav')

      const updated = await res.json()
      setApplication(prev =>
        prev ? { ...prev, status: updated.status } : null
      )
    } catch (err) {
      console.error(err)
      alert('Chyba při změně stavu přihlášky.')
    }
  }

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

  return (
    <div className="container mt-4">
      <Link href="/admin/applications" className="btn btn-secondary">
        ← Zpět na seznam
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

      <div className="card mb-4">
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
                <td>{format(new Date(application.birthDate), 'd. M. yyyy')}</td>
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
                <td>{application.toolsSkills}</td>
              </tr>
              <tr>
                <th scope="row">Nářadí, které přiveze</th>
                <td>{application.toolsBringing}</td>
              </tr>
              <tr>
                <th scope="row">Zúčastnil se dříve</th>
                <td>{application.pastParticipation ? 'Ano' : 'Ne'}</td>
              </tr>
              <tr>
                <th scope="row">Datum příjezdu</th>
                <td>
                  {format(new Date(application.arrivalDate), 'd. M. yyyy')}
                </td>
              </tr>
              <tr>
                <th scope="row">Datum odjezdu</th>
                <td>
                  {format(new Date(application.departureDate), 'd. M. yyyy')}
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
