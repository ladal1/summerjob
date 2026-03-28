'use client'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import { useState } from 'react'
import { Label } from '../forms/Label'

interface ReceptionSignInClientPageProps {
  errorMessage?: string
}

export default function ReceptionSignInClientPage({
  errorMessage,
}: ReceptionSignInClientPageProps) {
  const [receptionPassword, setReceptionPassword] = useState('')
  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await signIn('reception', {
      password: receptionPassword,
    })
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
            <form onSubmit={onSubmit}>
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
              <button type="submit" className="mt-4 p-2 w-100 btn btn-primary">
                Přihlásit se
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
