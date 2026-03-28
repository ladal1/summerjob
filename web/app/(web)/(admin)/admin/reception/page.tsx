import NoActiveEventPage from 'lib/components/error-page/NoActiveEventPage'
import EditBox from 'lib/components/forms/EditBox'
import PageHeader from 'lib/components/page-header/PageHeader'
import DeleteReceptionPasswordButton from 'lib/components/reception/DeleteReceptionPasswordButton'
import ReceptionPasswordForm from 'lib/components/reception/ReceptionPasswordForm'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'

export const dynamic = 'force-dynamic'

export default async function ReceptionPage() {
  const event = await cache_getActiveSummerJobEvent()
  if (!event) {
    return <NoActiveEventPage></NoActiveEventPage>
  }

  return (
    <>
      <PageHeader title={'Recepce'} isFluid={false} />
      <section>
        <div className="container mb-3">
          <EditBox>
            <h4 className="mb-3">Nastavení hesla pro recepci</h4>
            <div>
              <label className="fs-5">Nastavit heslo</label>
              <p className="text-muted">
                Změnou hesla dojde k odhlášení recepce
              </p>
            </div>
            <ReceptionPasswordForm eventId={event.id} />
            <hr />

            <div className="d-flex justify-content-between align-items-center mt-3 flex-sm-row flex-column">
              <div className="d-flex flex-column flex-wrap">
                <label className="fs-5">Odstranit heslo</label>
                <p className="text-muted">
                  Odstraněním hesla dojde k odhlášení recepce a k nemožnosti
                  přihlášení k recepci
                </p>
              </div>
              <DeleteReceptionPasswordButton eventId={event.id} />
            </div>
          </EditBox>
        </div>
      </section>
    </>
  )
}
