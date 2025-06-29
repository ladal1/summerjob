import PageHeader from 'lib/components/page-header/PageHeader'
import Link from 'next/link'
import { getSMJSession, isAccessAllowed } from 'lib/auth/auth'
import { Permission } from 'lib/types/auth'

export default async function AdminPage() {
  const session = await getSMJSession()
  
  // Helper function to check permissions
  const hasPermission = (permission: Permission) => {
    return isAccessAllowed([permission], session)
  }

  // Always show admin options if user has ADMIN permission
  const hasAdminPermission = hasPermission(Permission.ADMIN)
  const hasApplicationsPermission = hasAdminPermission || hasPermission(Permission.APPLICATIONS)
  const hasAdorationPermission = hasAdminPermission || hasPermission(Permission.ADORATION)
  return (
    <>
      <PageHeader title="Administrace" isFluid={false}>
        <></>
      </PageHeader>

      <section>
        <div className="container">
          <div className="list-group">
            {hasAdminPermission && (
              <Link
                className="list-group-item list-group-item-action"
                href="/admin/events"
              >
                <div className="row">
                  <div className="col">
                    <h5>Ročníky</h5>
                    <p>
                      Nastavit aktuální ročník, spravovat přístup k přihláškám,
                      upravit oblasti.
                    </p>
                  </div>
                  <div className="col d-flex justify-content-end align-items-center gap-3">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              </Link>
            )}
            {hasAdminPermission && (
              <Link
                className="list-group-item list-group-item-action"
                href="/admin/users"
              >
                <div className="row">
                  <div className="col">
                    <h5>Správa uživatelů</h5>
                    <p>Nastavit role, zablokovat uživatele.</p>
                  </div>
                  <div className="col d-flex justify-content-end align-items-center gap-3">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              </Link>
            )}
            {hasAdminPermission && (
              <Link
                className="list-group-item list-group-item-action"
                href="/admin/logs"
              >
                <div className="row">
                  <div className="col">
                    <h5>Logy</h5>
                    <p>Prohlédnout si záznamy aktivit.</p>
                  </div>
                  <div className="col d-flex justify-content-end align-items-center gap-3">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              </Link>
            )}
            {hasApplicationsPermission && (
              <Link
                className="list-group-item list-group-item-action"
                href="/admin/applications"
              >
                <div className="row">
                  <div className="col">
                    <h5>Přihlášky</h5>
                    <p>Zobrazit přihlášky.</p>
                  </div>
                  <div className="col d-flex justify-content-end align-items-center gap-3">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              </Link>
            )}

            {hasAdorationPermission && (
              <Link
                className="list-group-item list-group-item-action"
                href="/admin/adoration"
              >
                <div className="row">
                  <div className="col">
                    <h5>Adorace</h5>
                    <p>Vytvořit sloty, upravit lokace, spravovat adorace.</p>
                  </div>
                  <div className="col d-flex justify-content-end align-items-center gap-3">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
