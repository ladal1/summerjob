import { getSMJSession } from 'lib/auth/auth'
import CenteredBox from 'lib/components/auth/CenteredBox'
import ReceptionSignInClientPage from 'lib/components/auth/ReceptionSignInClientPage'
import { redirect } from 'next/navigation'

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReceptionSignInPage(props: Props) {
  const searchParams = await props.searchParams
  const session = await getSMJSession()
  if (searchParams?.callbackUrl && session) {
    if (typeof searchParams.callbackUrl === 'string') {
      redirect(searchParams.callbackUrl)
    }
    redirect(searchParams.callbackUrl[0])
  } else if (session) {
    redirect('/')
  }
  const errorMsg = ErrorReason.get(searchParams?.error as string) || undefined

  return (
    <CenteredBox>
      <ReceptionSignInClientPage errorMessage={errorMsg} />
    </CenteredBox>
  )
}

// Taken from https://next-auth.js.org/configuration/pages#sign-in-page
const ErrorReason = new Map<string, string>([
  ['Default', 'Nastala chyba. Zkuste to znovu.'],
])
