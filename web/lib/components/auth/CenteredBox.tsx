export default function CenteredBox({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="d-flex align-items-lg-center align-items-start justify-content-center h-100">
      <div className="bg-white p-3 rounded-3 smj-shadow m-3">{children}</div>
    </div>
  )
}
