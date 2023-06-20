'use client'
import { Serialized } from 'lib/types/serialize'
import {
  deserializeSummerJobEvent,
  SummerJobEventComplete,
} from 'lib/types/summerjob-event'
import { useRouter } from 'next/navigation'
import AreaList from '../area/AreaList'
import EditBox from '../forms/EditBox'
import DeleteEventButton from './DeleteEventButton'
import SetEventActiveButton from './SetEventActiveButton'

interface EventClientPageProps {
  sEvent: Serialized<SummerJobEventComplete>
}

export default function EventClientPage({ sEvent }: EventClientPageProps) {
  const event = deserializeSummerJobEvent(sEvent)

  const router = useRouter()
  const onDataChanged = () => {
    router.refresh()
  }

  const onEventDeleted = () => {
    router.replace('/admin/events')
    router.refresh()
  }
  return (
    <>
      <section>
        <div className="container mb-3">
          <EditBox>
            <h4 className="mb-3">Základní nastavení</h4>
            <div className="d-flex justify-content-between align-items-center flex-sm-row flex-column">
              <div className="d-flex flex-column">
                <label className="fs-5">Nastavit ročník jako aktivní</label>
                <p className="text-muted">
                  Úpravy na ostatních stránkách probíhají pouze na aktivním
                  ročníku.
                </p>
              </div>
              <SetEventActiveButton
                smjEvent={event}
                onSuccess={onDataChanged}
              />
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-center mt-3 flex-sm-row flex-column">
              <div className="d-flex flex-column flex-wrap">
                <label className="fs-5">Odstranit ročník</label>
                <p className="text-muted">
                  Odstranit ročník z databáze. Dojde ke smazání všech informací
                  souvisejících s tímto ročníkem. Tato akce je nevratná.
                </p>
              </div>
              <DeleteEventButton smjEvent={event} onSuccess={onEventDeleted} />
            </div>
          </EditBox>
          <EditBox>
            <AreaList
              areas={event.areas}
              eventId={event.id}
              onDataChanged={onDataChanged}
            />
          </EditBox>
        </div>
      </section>
    </>
  )
}
