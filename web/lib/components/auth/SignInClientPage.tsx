'use client'
import { EmailData, EmailSchema } from 'lib/types/email'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { zodResolver } from '@hookform/resolvers/zod'
import ButtonWithSvg from './ButtonWithSvg'

interface SignInClientPageProps {
  errorMessage?: string
  availableOAuthProviders: { google: boolean; seznam: boolean }
}

export default function SignInClientPage({
  errorMessage,
  availableOAuthProviders,
}: SignInClientPageProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailData>({
    resolver: zodResolver(EmailSchema),
  })
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
              {availableOAuthProviders.google && (
                <ButtonWithSvg
                  type="button"
                  disabled={false}
                  iconSrc="/icons/google.svg"
                  onClick={onGoogleSignIn}
                >
                  Přihlásit se přes Google
                </ButtonWithSvg>
              )}

              {availableOAuthProviders.seznam && (
                <ButtonWithSvg
                  type="button"
                  disabled={false}
                  iconSrc="/icons/seznam.svg"
                  onClick={onSeznamSignIn}
                >
                  Přihlásit se přes Seznam
                </ButtonWithSvg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
