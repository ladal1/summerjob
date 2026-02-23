import 'styles/bootstrap/css/bootstrap.min.css'
import 'styles/custom.css'

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="px-5 py-3">{children}</main>
    </>
  )
}
