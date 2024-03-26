import { useRouter } from 'next/navigation'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { FormHeader } from './FormHeader'

interface FormProps {
  label: string
  secondaryLabel?: string
  isInputDisabled: boolean
  onConfirmationClosed: () => void
  resetForm: () => void
  saved: boolean
  error: boolean
  formId: string
  shouldShowBackButton?: boolean
  children: React.ReactNode
}

export const Form = ({
  label,
  secondaryLabel,
  isInputDisabled,
  onConfirmationClosed,
  resetForm,
  saved,
  error,
  formId,
  shouldShowBackButton = true,
  children,
}: FormProps) => {
  const router = useRouter()
  return (
    <section className="mb-3">
      <div className="container pt-3">
        <div className="smj-shadow rounded-3">
          <FormHeader label={label} secondaryLabel={secondaryLabel} />
          <hr className="my-0" />
          <div className="bg-white">
            <div className="p-3 pb-2 rounded-bottom">
              {children}
              <div className="smj-sticky-col-bottom pb-2 mt-3">
                <div
                  className={`d-flex ${
                    shouldShowBackButton
                      ? 'justify-content-between gap-3'
                      : 'justify-content-end'
                  } smj-grey rounded-5 p-2`}
                >
                  {shouldShowBackButton && (
                    <button
                      className="btn btn-secondary ms-4"
                      type="button"
                      onClick={() => router.back()}
                    >
                      Zpět
                    </button>
                  )}
                  <input
                    form={formId}
                    type={'submit'}
                    className="btn btn-primary me-4"
                    value={'Uložit'}
                    disabled={isInputDisabled}
                  />
                </div>
              </div>
            </div>
          </div>
          {saved && <SuccessProceedModal onClose={onConfirmationClosed} />}
          {error && <ErrorMessageModal onClose={resetForm} />}
        </div>
      </div>
    </section>
  )
}
