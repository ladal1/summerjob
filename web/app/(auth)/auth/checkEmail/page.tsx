import { getSMJSession } from 'lib/auth/auth'
import CenteredBox from 'lib/components/auth/CenteredBox'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import { dev_createSession } from 'lib/data/auth'
import DevLogin from 'lib/components/auth/DevLogin'

export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  const session = await getSMJSession()
  if (session) {
    redirect('/')
  }
  let devSession = null
  if (process.env.NODE_ENV === 'development') {
    devSession = await dev_createSession()
  }
  return (
    <CenteredBox>
      <div className="container maxwidth-500">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between gap-5">
              <h2>Přihlásit se</h2>
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
            <p>Zaslali jsme Vám e-mail s odkazem pro přihlášení.</p> Pokud
            e-mail neobdržíte, zkontrolujte prosím složku SPAM.
          </div>
          {devSession && (
            <DevLogin
              cookies={[
                {
                  name: 'next-auth.session-token',
                  value: devSession.sessionToken,
                },
              ]}
              redirectUrl={`/`}
            />
          )}
        </div>
      </div>
    </CenteredBox>
  )
}
