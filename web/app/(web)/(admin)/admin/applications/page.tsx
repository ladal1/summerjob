import ApplicationAdminPage from 'lib/components/application/ApplicationAdminPage'
import PageHeader from 'lib/components/page-header/PageHeader'

export default async function AdminApplicationsPage() {
  return (
    <>
      <PageHeader title={'Přihlášky'} isFluid={false} />
      <ApplicationAdminPage />
    </>
  )
}
