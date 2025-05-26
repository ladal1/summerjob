import ApplicationAdminDetail from 'lib/components/application/ApplicationAdminDetail'
import PageHeader from 'lib/components/page-header/PageHeader'

export default async function AdminApplicationDetailPage() {
  return (
    <>
      <PageHeader title={'Detail přihlášky'} isFluid={false} />
      <ApplicationAdminDetail />
    </>
  )
}
