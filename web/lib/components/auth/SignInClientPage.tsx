'use client'
import { EmailData, EmailSchema } from 'lib/types/email'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { zodResolver } from '@hookform/resolvers/zod'
import ButtonWithSvg from './ButtonWithSvg'
import { useState } from 'react'
import { Label } from '../forms/Label'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'

interface SignInClientPageProps {
  errorMessage?: string
}

export default function SignInClientPage({
  errorMessage,
}: SignInClientPageProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailData>({
    resolver: zodResolver(EmailSchema),
  })

  const [receptionLogin, setReceptionLogin] = useState(false)
  const [receptionPassword, setReceptionPassword] = useState('')
  const [receptionLoginError, setReceptionLoginError] = useState('')
  const toggleReceptionLogin = () => {
    setReceptionLogin(!receptionLogin)
  }

  const onReceptionLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    const res = await fetch(`/api/summerjob-events/check-reception-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: receptionPassword }),
    })
    if (!res.ok) {
      const data = await res.json()
      setReceptionLoginError(data.message)
    }
  }

  const onSubmit = (dataForm: EmailData) => {
    signIn('email', dataForm)
  }

  const onGoogleSignIn = () => {
    signIn('google')
  }

  const onSeznamSignIn = () => {
    signIn('seznam')
  }

  return (
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
      {errorMessage && (
        <div className="row mb-2 ps-2 pe-2">
          <div className="col-12 alert alert-warning">{errorMessage}</div>
        </div>
      )}
      <div className="row mb-3">
        <div className="col-12">
          {!receptionLogin && (
            <div>
              <form action="#" onSubmit={handleSubmit(onSubmit)}>
                <TextInput
                  id="email"
                  label="E-mail"
                  placeholder="user@example.cz"
                  register={() => register('email')}
                  errors={errors}
                  margin={false}
                />
                <input
                  className="mt-4 w-100 btn btn-primary p-2"
                  type="submit"
                  value="Přihlásit se"
                />
              </form>

              <div className="d-flex flex-column gap-2 mt-4">
                <ButtonWithSvg
                  type="button"
                  disabled={false}
                  iconSrc="/icons/google.svg"
                  onClick={onGoogleSignIn}
                >
                  Přihlásit se přes Google
                </ButtonWithSvg>
                <ButtonWithSvg
                  type="button"
                  disabled={false}
                  iconSrc="/icons/seznam.svg"
                  onClick={onSeznamSignIn}
                >
                  Přihlásit se přes Seznam
                </ButtonWithSvg>

                <div className="mt-4 d-flex align-items-center text-muted">
                  <div className="flex-grow-1 border-top" />
                  <span className="px-3">Nebo</span>
                  <div className="flex-grow-1 border-top" />
                </div>

                <button
                  className="mt-4 w-100 btn btn-light p-2"
                  type="button"
                  onClick={toggleReceptionLogin}
                >
                  Přihlásit se k recepci
                </button>
              </div>
            </div>
          )}

          {receptionLogin && (
            <div>
              <form action="#" onSubmit={onReceptionLogin}>
                <Label
                  id="reception-password"
                  label="Kód k recepci"
                  margin={false}
                />
                <input
                  id="reception-password"
                  className="p-0 w-100 form-control smj-input fs-5"
                  type="password"
                  placeholder="Zadejte kód k recepci"
                  onChange={e => setReceptionPassword(e.target.value)}
                />
                {receptionLoginError && (
                  <span className="text-danger">{receptionLoginError}</span>
                )}
                <button
                  type="submit"
                  className="mt-4 p-2 w-100 btn btn-primary"
                >
                  Přihlásit se
                </button>
              </form>
              <button
                className="mt-3 p-2 w-100 btn btn-light"
                type="button"
                onClick={toggleReceptionLogin}
              >
                Zpět
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
