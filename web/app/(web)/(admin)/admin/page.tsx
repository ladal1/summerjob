import PageHeader from 'lib/components/page-header/PageHeader'
import Link from 'next/link'

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Administrace" isFluid={false}>
        <></>
      </PageHeader>

      <section>
        <div className="container">
          <div className="list-group">
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
          </div>
        </div>
      </section>
    </>
  )
}
