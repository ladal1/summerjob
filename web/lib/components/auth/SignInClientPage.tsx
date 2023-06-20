'use client'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import { useState } from 'react'

interface SignInClientPageProps {
  errorMessage?: string
}

export default function SignInClientPage({
  errorMessage,
}: SignInClientPageProps) {
  const [email, setEmail] = useState('')
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
          <form
            action="#"
            onSubmit={e => {
              e.preventDefault()
              signIn('email', { email: email })
            }}
          >
            <label htmlFor="email">E-mail:</label>
            <input
              className="form-control border p-1"
              placeholder="user@example.cz"
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className="mt-4 w-100 btn btn-light p-2"
              type="submit"
              value="Přihlásit se"
            />
          </form>
        </div>
      </div>
    </div>
  )
}
