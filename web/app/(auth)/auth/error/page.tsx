import { getSMJSession } from 'lib/auth/auth'
import CenteredBox from 'lib/components/auth/CenteredBox'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import logoImage from 'public/logo-smj-yellow.png'

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AuthErrorPage(props: Props) {
  const searchParams = await props.searchParams;
  const session = await getSMJSession()
  if (session) {
    redirect('/')
  }
  const reason =
    ErrorReason.get(searchParams?.error as string) || ErrorReason.get('Default')
  return (
    <CenteredBox>
      <div className="container maxwidth-500">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between gap-5">
              <h2>Chyba</h2>
              <Image
                src={logoImage}
                className="smj-logo"
                alt="SummerJob logo"
                quality={98}
                priority={true}
              />
            </div>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-12 text-wrap">
            <div>Přihlášení selhalo z důvodu:</div>
            <div>{reason}</div>
            <a
              className="mt-4 w-100 btn btn-light p-2"
              type="submit"
              href="/auth/signIn"
            >
              Zpět na přihlášení
            </a>
          </div>
        </div>
      </div>
    </CenteredBox>
  )
}

// Taken from https://next-auth.js.org/configuration/pages#error-page
const ErrorReason = new Map<string, string>([
  ['Configuration', 'Nastala chyba v konfiguraci služby. Kontaktujte správce.'],
  ['AccessDenied', 'Přístup byl zamítnut.'],
  [
    'Verification',
    'Tento přihlašovací odkaz již není platný. Zkuste se přihlásit znovu.',
  ],
  ['Default', 'Nastala chyba. Zkuste to znovu.'],
])
