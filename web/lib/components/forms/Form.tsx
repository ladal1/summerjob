import SuccessProceedModal from '../modal/SuccessProceedModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import UnsavedChangesModal from '../modal/UnsavedChangesModal'
import { FormHeader } from './FormHeader'
import { useNavigationGuard } from '../../hooks/useNavigationGuard'
import { useEffect } from 'react'

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
  saveBar?: boolean
  isDirty?: boolean
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
  saveBar = true,
  isDirty = false,
}: FormProps) => {
  const {
    showConfirmation,
    confirmNavigation,
    cancelNavigation,
    disableNavigationGuard,
    router,
  } = useNavigationGuard({
    isDirty,
    isSubmitting: isInputDisabled,
  })

  // Automatically disable navigation guard when form is saved
  useEffect(() => {
    if (saved) {
      disableNavigationGuard()
    }
  }, [saved, disableNavigationGuard])

  const handleBackClick = () => {
    router.back()
  }

  const handleSuccessModalClose = () => {
    disableNavigationGuard()
    onConfirmationClosed()
  }

  return (
    <section className="mb-3">
      <div className="container pt-3">
        <div className="smj-shadow rounded-3">
          <FormHeader label={label} secondaryLabel={secondaryLabel} />
          <hr className="my-0" />
          <div className="bg-white">
            <div className="p-3 pb-2 rounded-bottom">
              {children}

              {saveBar && (
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
                        onClick={handleBackClick}
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
              )}
            </div>
          </div>
          {saved && <SuccessProceedModal onClose={handleSuccessModalClose} />}
          {error && <ErrorMessageModal onClose={resetForm} />}
          {showConfirmation && (
            <UnsavedChangesModal
              onConfirm={confirmNavigation}
              onCancel={cancelNavigation}
            />
          )}
        </div>
      </div>
    </section>
  )
}
