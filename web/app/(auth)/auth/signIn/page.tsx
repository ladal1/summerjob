import { getSMJSession } from 'lib/auth/auth'
import CenteredBox from 'lib/components/auth/CenteredBox'
import SignInClientPage from 'lib/components/auth/SignInClientPage'
import { redirect } from 'next/navigation'

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function SignInPage({ searchParams }: Props) {
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
      <SignInClientPage errorMessage={errorMsg} />
    </CenteredBox>
  )
}

// Taken from https://next-auth.js.org/configuration/pages#sign-in-page
const ErrorReason = new Map<string, string>([
  [
    'EmailSignin',
    'Nepodařilo se odeslat přihlašovací e-mail. Zkuste to později. Pokud problém přetrvává, kontaktujte správce.',
  ],
  ['Default', 'Nastala chyba. Zkuste to znovu.'],
])
