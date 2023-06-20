import EditBox from '../forms/EditBox'
import PageHeader from '../page-header/PageHeader'

export default function MyPlanEmpty() {
  return (
    <>
      <PageHeader title={'Můj plán'} isFluid={false}>
        {}
      </PageHeader>
      <section>
        <div className="container">
          <EditBox>
            <h5>Nemáte naplánované žádné činnosti.</h5>
          </EditBox>
        </div>
      </section>
    </>
  )
}
