
interface IssueProps {
  children: React.ReactNode
}

export const Issue = ({
  children
}: IssueProps) => {
  return (
    <div className="p-2 ">
      <div className="row bg-warning rounded-3 p-2">
        <div className="col-auto d-flex align-items-center">
          <div className="fas fa-triangle-exclamation fs-5"></div>
        </div>
          <div className="col">
            {children}
          </div>
      </div>
    </div>
  )
}
