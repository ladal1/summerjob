import { useRouter } from 'next/navigation'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface FormProps {
  label: string
  disableInput: boolean
  resetForm: () => void
  saved: boolean
  error: boolean

  children: React.ReactNode
}

export const Form = ({
  label,
  disableInput,
  resetForm,
  saved,
  error,
  children,
}: FormProps) => {
  const router = useRouter()
  return (
    <>
      <div className="container pt-3">
        <div className="smj-shadow rounded-3">
          <div className="px-3 py-2 bg-dark text-white rounded-top">
            <h2 className="mb-0">{label}</h2>
          </div>
          <hr className="my-0" />
          <div className="p-3 bg-white rounded-bottom">{children}</div>
          <div className="smj-sticky-col-bottom smj-grey p-2">
            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => router.back()}
              >
                Zpět
              </button>
              <input
                type={'submit'}
                className="btn btn-primary"
                value={'Uložit'}
                disabled={disableInput}
              />
            </div>
          </div>
          {saved && <SuccessProceedModal onClose={() => router.back()} />}
          {error && <ErrorMessageModal onClose={resetForm} />}
        </div>
      </div>
    </>
  )
}
