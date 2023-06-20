interface ErrorPage404Props {
  message: string
}

export default function ErrorPage404({ message }: ErrorPage404Props) {
  return (
    <div className="container mt-5">
      <div className="row d-flex justify-content-center align-items-center">
        <div className="col-auto pe-4 me-4 error-code-border">
          <span className="fs-1">404</span>
        </div>
        <div className="col-auto align-middle">
          <span>{message}</span>
        </div>
      </div>
    </div>
  )
}
