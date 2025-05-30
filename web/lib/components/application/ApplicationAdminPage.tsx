'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface ApplicationListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  gender: string
  address: string
  pastParticipation: boolean
  arrivalDate: string
  departureDate: string
  foodAllergies?: string
  workAllergies?: string
  toolsSkills: string
  toolsBringing: string
  heardAboutUs?: string
  playsInstrument?: string
  tShirtSize?: string
  additionalInfo?: string
  photo?: string
  accommodationPrice: string
  ownsCar: boolean
  canBeMedic: boolean
  createdAt: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

type ApplicationStatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'

export default function ApplicationAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial values from URL search parameters
  const pageQ = searchParams?.get('page')
  const perPageQ = searchParams?.get('perPage')
  const statusQ = searchParams?.get('status')

  // Convert statusQ to uppercase and validate
  const statusUpper = statusQ?.toUpperCase()
  const validStatuses: ApplicationStatusFilter[] = [
    'ALL',
    'PENDING',
    'ACCEPTED',
    'REJECTED',
  ]
  const validatedStatus: ApplicationStatusFilter = validStatuses.includes(
    statusUpper as ApplicationStatusFilter
  )
    ? (statusUpper as ApplicationStatusFilter)
    : 'ALL'

  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(pageQ ? parseInt(pageQ) : 1)
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(perPageQ ? parseInt(perPageQ) : 10)
  const [perPageInput, setPerPageInput] = useState(perPageQ || '10')
  const [statusFilter, setStatusFilter] =
    useState<ApplicationStatusFilter>(validatedStatus)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const isAllSelected =
    applications.length > 0 &&
    applications.every(app => selectedIds.includes(app.id))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          perPage: perPage.toString(),
        })

        if (statusFilter !== 'ALL') {
          queryParams.append('status', statusFilter)
        }

        const res = await fetch(`/api/applications?${queryParams.toString()}`)

        if (!res.ok) {
          throw new Error(`Chyba načítání přihlášek: ${res.status}`)
        }

        const json = await res.json()
        setApplications(json.data)
        setTotal(json.total)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [page, perPage, statusFilter])

  // Update URL with current pagination state
  useEffect(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    })

    if (statusFilter !== 'ALL') {
      params.append('status', statusFilter)
    }

    router.replace(`?${params.toString()}`, { scroll: false })
  }, [page, perPage, statusFilter, router])

  const totalPages = Math.ceil(total / perPage)

  const handlePerPageChange = () => {
    const value = parseInt(perPageInput)
    if (!isNaN(value) && value > 0) {
      setPerPage(value)
      setPage(1)
    }
  }

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      const currentPageIds = applications.map(app => app.id)
      setSelectedIds(currentPageIds)
    }
  }

  const handleExportEmailsToFile = () => {
    const selectedApps = applications.filter(app =>
      selectedIds.includes(app.id)
    )

    const emails = selectedApps.map(app => app.email).join(', ')

    const blob = new Blob([emails], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'prihlasky-emaily.txt'
    link.click()

    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const selectedApps = applications.filter(app =>
      selectedIds.includes(app.id)
    )

    const csvHeader = [
      'Jméno',
      'Příjmení',
      'Email',
      'Telefon',
      'Datum narození',
      'Pohlaví',
      'Adresa',
      'Předchozí účast',
      'Příjezd',
      'Odjezd',
      'Alergie na jídlo',
      'Alergie na práci',
      'Nářadí ovládá',
      'Nářadí přiveze',
      'Odkud o nás ví',
      'Hudební nástroj',
      'Tričko',
      'Dodatečné info',
      'Cena ubytování',
      'Auto',
      'Zdravotník',
      'Vytvořeno',
      'Status',
    ].join(',')

    const csvRows = selectedApps.map(app => {
      return [
        app.firstName,
        app.lastName,
        app.email,
        app.phone,
        new Date(app.birthDate),
        app.gender,
        app.address,
        app.pastParticipation ? 'Ano' : 'Ne',
        new Date(app.arrivalDate),
        new Date(app.departureDate),
        app.foodAllergies || '',
        app.workAllergies || '',
        app.toolsSkills,
        app.toolsBringing,
        app.heardAboutUs || '',
        app.playsInstrument || '',
        app.tShirtSize || '',
        app.additionalInfo || '',
        app.accommodationPrice,
        app.ownsCar ? 'Ano' : 'Ne',
        app.canBeMedic ? 'Ano' : 'Ne',
        new Date(app.createdAt),
        app.status,
      ]
        .map(
          field => `"${String(field).replace(/"/g, '""')}"` // Na ošetření uvozovek
        )
        .join(',')
    })

    const csv = [csvHeader, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'prihlasky-data.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const getStatusBorderClass = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'border-start-success'
      case 'REJECTED':
        return 'border-start-danger'
      case 'PENDING':
      default:
        return 'border-start-warning'
    }
  }

  return (
    <div className="container mt-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <select
          className="form-select form-select-sm"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value as ApplicationStatusFilter)
            setPage(1)
          }}
        >
          <option value="ALL">Všechny</option>
          <option value="PENDING">Čekající</option>
          <option value="ACCEPTED">Přijaté</option>
          <option value="REJECTED">Zamítnuté</option>
        </select>

        <div className="d-flex align-items-center gap-2">
          <label htmlFor="perPageInput" className="form-label mb-0">
            Záznamů na stránku:
          </label>
          <input
            type="number"
            id="perPageInput"
            className="form-control py-0"
            style={{ width: '80px' }}
            value={perPageInput}
            onChange={e => {
              setPerPageInput(e.target.value)
            }}
            onBlur={handlePerPageChange}
            onKeyDown={e => {
              if (e.key === 'Enter') handlePerPageChange()
            }}
            min={1}
          />
        </div>
      </div>

      {loading ? (
        <p>Načítání přihlášek...</p>
      ) : (
        <>
          {applications.length === 0 ? (
            <p className="text-center text-secondary">Žádná přihláška</p>
          ) : (
            <>
              <div className="d-flex gap-2 my-3">
                <button
                  className="btn btn-outline-primary"
                  disabled={selectedIds.length === 0}
                  onClick={handleExportCSV}
                >
                  Exportovat do CSV
                </button>
                <button
                  className="btn btn-outline-primary"
                  disabled={selectedIds.length === 0}
                  onClick={handleExportEmailsToFile}
                >
                  Exportovat e-maily
                </button>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="selectAllCheckbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
                <label className="form-check-label" htmlFor="selectAllCheckbox">
                  Vybrat vše na stránce
                </label>
              </div>

              <div className="list-group">
                {applications.map(app => (
                  <div
                    key={app.id}
                    className={`list-group-item d-flex align-items-center border-start border-4 ${getStatusBorderClass(
                      app.status
                    )}`}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      checked={selectedIds.includes(app.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedIds(prev => [...prev, app.id])
                        } else {
                          setSelectedIds(prev =>
                            prev.filter(id => id !== app.id)
                          )
                        }
                      }}
                    />
                    <Link
                      href={`/admin/applications/${app.id}?${new URLSearchParams(
                        {
                          page: page.toString(),
                          perPage: perPage.toString(),
                          ...(statusFilter !== 'ALL' && {
                            status: statusFilter,
                          }),
                        }
                      ).toString()}`}
                      className="flex-grow-1 text-decoration-none text-dark"
                    >
                      <strong>
                        {app.firstName} {app.lastName}
                      </strong>{' '}
                      – {app.email}
                      <span className="text-muted">
                        {' '}
                        ({new Date(app.createdAt).toLocaleDateString('cs-CZ')})
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-between align-items-center mt-4">
                <button
                  className="btn btn-outline-primary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Předchozí
                </button>
                <span>
                  Strana {page} z {totalPages}
                </span>
                <button
                  className="btn btn-outline-primary"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Další
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
