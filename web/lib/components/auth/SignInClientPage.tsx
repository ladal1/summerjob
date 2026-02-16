'use client'
import { EmailData, EmailSchema } from 'lib/types/email'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import { useForm } from 'react-hook-form'
import { TextInput } from '../forms/input/TextInput'
import { zodResolver } from '@hookform/resolvers/zod'

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

          <div className="mt-4 d-flex align-items-center text-muted">
            <div className="flex-grow-1 border-top" />
            <span className="px-3">Nebo</span>
            <div className="flex-grow-1 border-top" />
          </div>

          <div className="mt-4 d-flex flex-column gap-2">
            <button
              type="button"
              className="w-100 btn btn-light p-2"
              onClick={onGoogleSignIn}
            >
              Pokračovat přes Google
            </button>
            <button
              type="button"
              className="w-100 btn btn-light p-2"
              onClick={onSeznamSignIn}
            >
              Pokračovat přes Seznam
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
