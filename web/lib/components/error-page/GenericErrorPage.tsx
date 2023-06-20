interface GenericErrorPageProps {
  title: string
  message: string
}

export default function GenericErrorPage({
  title,
  message,
}: GenericErrorPageProps) {
  return (
    <div className="container mt-5">
      <div className="row d-flex justify-content-center align-items-center">
        <div className="col-auto pe-4 me-4 error-code-border">
          <span className="fs-2">{title}</span>
        </div>
        <div className="col-auto align-middle">
          <span>{message}</span>
        </div>
      </div>
    </div>
  )
}
