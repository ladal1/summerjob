export default function PageHeader({
  children,
  title,
  isFluid = true,
}: {
  children?: React.ReactNode
  title: string
  isFluid?: boolean
}) {
  const containerClass = isFluid ? 'container-fluid' : 'container'
  return (
    <section className="mb-3 mt-3">
      <div className={containerClass}>
        <div className="row">
          <div className="col">
            <h2>{title}</h2>
          </div>
          <div className="w-100 d-md-none"></div>
          <div className="col-auto d-flex align-items-center flex-wrap justify-content-md-end header-controlbar gap-3">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
