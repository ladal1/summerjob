import PageHeader from 'lib/components/page-header/PageHeader'
import Link from 'next/link'
import { getSMJSession, isAccessAllowed } from 'lib/auth/auth'
import { Permission } from 'lib/types/auth'

export default async function AdminPage() {
  const session = await getSMJSession()
  const hasAdminPermission = isAccessAllowed([Permission.ADMIN], session)
  const hasWorkersPermission =
    hasAdminPermission || isAccessAllowed([Permission.WORKERS], session)
  const hasJobsPermission =
    hasAdminPermission || isAccessAllowed([Permission.JOBS], session)
  const canSeeAllergies = hasWorkersPermission || hasJobsPermission
  const canSeeJobLists = hasJobsPermission

  return (
    <>
      <PageHeader title="Seznamy" isFluid={false}>
        <></>
      </PageHeader>
      {(canSeeAllergies || canSeeJobLists) && (
        <section>
          <div className="container">
            <div className="list-group">
              {canSeeAllergies && (
                <Link
                  className="list-group-item list-group-item-action"
                  href="/admin/lists/food-allergies"
                >
                  <div className="row">
                    <div className="col">
                      <h5>Alergie na jídlo</h5>
                    </div>
                    <div className="col d-flex justify-content-end align-items-center gap-3">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                </Link>
              )}

              {canSeeAllergies && (
                <Link
                  className="list-group-item list-group-item-action"
                  href="/admin/lists/work-allergies"
                >
                  <div className="row">
                    <div className="col">
                      <h5>Pracovní alergie</h5>
                    </div>
                    <div className="col d-flex justify-content-end align-items-center gap-3">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                </Link>
              )}

              {canSeeJobLists && (
                <Link
                  className="list-group-item list-group-item-action"
                  href="/admin/lists/skills"
                >
                  <div className="row">
                    <div className="col">
                      <h5>Dovednosti</h5>
                    </div>
                    <div className="col d-flex justify-content-end align-items-center gap-3">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                </Link>
              )}

              {canSeeJobLists && (
                <Link
                  className="list-group-item list-group-item-action"
                  href="/admin/lists/job-types"
                >
                  <div className="row">
                    <div className="col">
                      <h5>Typy práce</h5>
                    </div>
                    <div className="col d-flex justify-content-end align-items-center gap-3">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                </Link>
              )}

              {canSeeJobLists && (
                <Link
                  className="list-group-item list-group-item-action"
                  href="/admin/lists/tool-names"
                >
                  <div className="row">
                    <div className="col">
                      <h5>Nástroje</h5>
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
      )}
    </>
  )
}
