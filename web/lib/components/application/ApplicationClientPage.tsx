'use client'

/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ApplicationCreateSchema,
  ApplicationCreateDataInput,
} from 'lib/types/application'
import { TextInput } from 'lib/components/forms/input/TextInput'
import { FilterSelectInput } from 'lib/components/forms/input/FilterSelectInput'
import { TextAreaInput } from 'lib/components/forms/input/TextAreaInput'
import { ImageUploader } from 'lib/components/forms/ImageUploader'
import { useAPIApplicationCreate } from 'lib/fetcher/application'
import { Form } from 'lib/components/forms/Form'
import { BulletPointSelect } from 'lib/components/forms/input/BulletPointSelect'
import { OtherAttributesInput } from 'lib/components/forms/input/OtherAttributesInput'
import { DatePickerInput } from 'lib/components/forms/input/DatePickerInput'
import 'react-datepicker/dist/react-datepicker.css'
import ApplicationPasswordForm from './ApplicationPasswordForm'

interface ApplicationsPageProps {
  startDate: string
  endDate: string
  isApplicationOpen: boolean
  isPasswordProtected: boolean
  eventId: string
}

export default function ApplicationsPage({
  startDate,
  endDate,
  isApplicationOpen,
  isPasswordProtected,
  eventId,
}: ApplicationsPageProps) {
  const [submitted, setSubmitted] = useState(false)
  const [hasAccess, setHasAccess] = useState(!isPasswordProtected)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<ApplicationCreateDataInput>({
    resolver: zodResolver(ApplicationCreateSchema),
  })
  const { isMutating, error, reset } = useAPIApplicationCreate({
    onSuccess: () => setSubmitted(true),
  })

  const onSubmit = async (data: ApplicationCreateDataInput) => {
    try {
      setIsLoading(true)

      const formData = new FormData()

      const password = isPasswordProtected
        ? localStorage.getItem(`application-password-${eventId}`)
        : null

      const { photoFile, ...rest } = data

      if (photoFile) {
        formData.append('photoFile', photoFile)
      }

      const jsonData = {
        ...rest,
        applicationPassword: password,
        eventId,
      }

      formData.append('jsonData', JSON.stringify(jsonData))

      const response = await fetch('/api/applications/new', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Odpověď serveru:', error)
        throw new Error('Odeslání přihlášky selhalo')
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Chyba při odesílání přihlášky:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const onConfirmationClosed = () => {
    setSubmitted(false)
    router.back()
  }

  if (!isApplicationOpen) {
    return (
      <p className="text-center text-lg font-weight-bold mt-5">
        Přihlašování není aktuálně otevřené.
      </p>
    )
  }

  if (isPasswordProtected && !hasAccess) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4">
        <ApplicationPasswordForm
          eventId={eventId}
          onSuccess={() => setHasAccess(true)}
        />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="bg-white rounded shadow p-4 p-md-5 mx-auto w-75 mt-5">
        <p className="mt-1 display-6 mb-3">Přihláška byla úspěšně odeslána!</p>
        <p className="text-muted text-base font-normal">
          O přijetí tě budeme informovat během následujících tří týdnů.{' '}
          <strong>
            Samotné odeslání přihlášky ještě neznamená, že máš účast jistou.
          </strong>{' '}
          Díky za pochopení!
        </p>
        <p className="text-muted text-base font-normal">
          Na tvůj e-mail jsme právě odeslali tebou vyplňené informace z
          formuláře.
        </p>
      </div>
    )
  }

  const registerPhoto = (file: File | null) => {
    try {
      setValue('photoFile', file, { shouldDirty: true, shouldValidate: true })
    } catch (error) {
      console.error('Chyba v registerPhoto:', error)
    }
  }

  const removeNewPhoto = () => {
    setValue('photoFile', undefined, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-lg shadow-lg">
      <Form
        label="Přihláška na SummerJob"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={submitted}
        error={error}
        formId="application-form"
        saveBar={false}
      >
        <form
          id="application-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 mx-5 application"
        >
          <p>
            Milý SummerJobáku,
            <br />
            vítej u přihlašování na SummerJob 2025. Letos budeme v termínu 29.
            6. - 6. 7. znovu pomáhat v Šluknovském výběžku. Jsme rádi, že se
            nebojíš přiložit ruku k dílu! Aby ses mohl zařadit mezi letošní
            pracanty, musíš nejdřív úspěšně vyplnit všechny potřebné údaje a
            zaplatit účastnický poplatek. Může se stát, že počet přihlášených
            dobrovolníků stejně jako v předešlých letech překročí kapacitu celé
            akce. V takovém případě budou mít přednost zájemci, kteří chtějí
            přijet makat na celý týden, splňují věkový limit a přihlásili se
            nejrychleji. Tak hodně štěstí, těšíme se! 🙂
          </p>
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <TextInput
                id="firstName"
                label="Jméno"
                register={() => register('firstName')}
                placeholder="Vaše jméno"
                errors={errors}
                labelClassName="light-placeholder"
                mandatory
              />
            </div>
            <div className="w-100 w-md-45">
              <TextInput
                id="lastName"
                label="Příjmení"
                register={() => register('lastName')}
                placeholder="Vaše příjmení"
                errors={errors}
                labelClassName="light-placeholder"
                mandatory
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <DatePickerInput
                id="birthDate"
                label="Datum narození"
                control={control}
                errors={errors}
                mandatory
                setError={setError}
                clearErrors={clearErrors}
              />
            </div>
            <div className="w-100 w-md-45">
              <FilterSelectInput
                id="gender"
                label="Pohlaví"
                placeholder="Vyberte pohlaví"
                labelClassName="light-placeholder"
                items={[
                  { id: 'Muž', name: 'Muž', searchable: 'Muž' },
                  { id: 'Žena', name: 'Žena', searchable: 'Žena' },
                ]}
                onSelected={id => setValue('gender', id as 'Muž' | 'Žena')}
                errors={errors}
                mandatory
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <TextInput
                id="phone"
                label="Telefon"
                register={() => register('phone')}
                placeholder="Váš telefon"
                labelClassName="light-placeholder"
                errors={errors}
                mandatory
              />
            </div>
            <div className="w-100 w-md-45">
              <TextInput
                id="email"
                label="Email"
                register={() => register('email')}
                labelClassName="light-placeholder"
                placeholder="Váš email"
                errors={errors}
                mandatory
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <TextInput
                id="address"
                label="Plná adresa"
                register={() => register('address')}
                labelClassName="light-placeholder"
                placeholder="Vaše adresa"
                errors={errors}
                mandatory
              />
            </div>
            <div className="w-100 w-md-45">
              <FilterSelectInput
                id="pastParticipation"
                label="Už jsi se v minulosti zúčastnil/a?"
                placeholder="Vyberte odpověď"
                labelClassName="light-placeholder"
                items={[
                  { id: 'true', name: 'Ano', searchable: 'Ano' },
                  { id: 'false', name: 'Ne', searchable: 'Ne' },
                ]}
                onSelected={id =>
                  setValue('pastParticipation', id === 'true' ? true : false)
                }
                errors={errors}
                mandatory
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <DatePickerInput
                id="arrivalDate"
                label="Datum příjezdu"
                control={control}
                errors={errors}
                minDate={startDate}
                maxDate={endDate}
                mandatory
                setError={setError}
                clearErrors={clearErrors}
                defaultValue={startDate}
              />
            </div>
            <div className="w-100 w-md-45">
              <DatePickerInput
                id="departureDate"
                label="Datum odjezdu"
                control={control}
                errors={errors}
                minDate={startDate}
                maxDate={endDate}
                mandatory
                setError={setError}
                clearErrors={clearErrors}
                defaultValue={endDate}
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <TextInput
                id="toolsSkills"
                label="Nářadí, se kterým umíš zacházet"
                register={() => register('toolsSkills')}
                placeholder="Nářadí - motorovka, křovinořez, cirkulárka..."
                labelClassName="light-placeholder"
                errors={errors}
              />
            </div>
            <div className="w-100 w-md-45">
              <TextInput
                id="toolsBringing"
                label="Nářadí, které přivezeš"
                register={() => register('toolsBringing')}
                placeholder="Nářadí - motorovka, křovinořez, kladivo..."
                labelClassName="light-placeholder"
                errors={errors}
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <TextInput
                id="foodAllergies"
                label="Alergie na jídlo"
                register={() => register('foodAllergies')}
                placeholder="Např. ořechy, mléko, lepek..."
                labelClassName="light-placeholder"
                errors={errors}
              />
            </div>
            <div className="w-100 w-md-45">
              <TextInput
                id="workAllergies"
                label="Alergie při pracovních podmínkách"
                register={() => register('workAllergies')}
                placeholder="Např. prach, pyl, latex..."
                labelClassName="light-placeholder"
                errors={errors}
              />
            </div>
          </div>
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <TextInput
                id="tShirtSize"
                label={
                  <>
                    Máš zájem o tričko (350 Kč)? Vyplň velikost a barvu
                    (modrá/červená/zelená). Objednávka je závazná.{' '}
                    <a
                      href="https://summerjob.eu/merch"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Prohlédnout trička
                    </a>
                  </>
                }
                register={() => register('tShirtSize')}
                labelClassName="light-placeholder"
                placeholder="XS, S, M, L, XL, XXL"
                errors={errors}
              />
            </div>
            <div className="w-100 w-md-45">
              <TextInput
                id="playsInstrument"
                label="Chceš zpívat nebo hrát na hudební nástroj ve schole?"
                register={() => register('playsInstrument')}
                labelClassName="light-placeholder"
                placeholder="Ano, umím hrát na housle,.."
                errors={errors}
              />
            </div>
          </div>
          <TextInput
            id="heardAboutUs"
            label="Jak jsi se o nás dozvěděl/a?"
            register={() => register('heardAboutUs')}
            placeholder="Řekl mi o vás kamarád..."
            labelClassName="light-placeholder"
            errors={errors}
          />
          <TextAreaInput
            id="additionalInfo"
            label="Dodatečné informace (zpráva pro organizátory)"
            register={() => register('additionalInfo')}
            labelClassName="light-placeholder"
            placeholder="Vaše poznámka"
            errors={errors}
          />
          <div className="d-flex flex-column flex-md-row w-100 justify-content-between gap-3">
            <div className="w-100 w-md-45">
              <ImageUploader
                id="photoFile"
                label="Fotografie"
                secondaryLabel="Fotka nám ulehčí rozdělování práce. Maximálně 1 soubor o maximální velikosti 10 MB."
                errors={errors}
                setError={setError}
                mandatory={true}
                registerPhoto={fileList => {
                  registerPhoto(fileList.length > 0 ? fileList[0] : null)
                }}
                removeNewPhoto={removeNewPhoto}
              />
            </div>
            <div className="w-100 w-md-45">
              <BulletPointSelect
                id="accommodationPrice"
                label="Účastnický příspěvek"
                labelClassName="light-placeholder"
                options={[
                  { value: 1600, label: '1600 Kč (základní)' },
                  { value: 2000, label: '2000 Kč (sponzorský)' },
                ]}
                setError={setError}
                clearErrors={clearErrors}
                register={() => register('accommodationPrice')}
                setValue={setValue}
                getValues={getValues}
                errors={errors}
                mandatory
                minCustomValue={1600}
              />
              <p className="mt-3 text-muted fs-6 fw-lighter">
                Pokud se kvůli výši příspěvku nemůžeš z finančních důvodů
                zúčastnit, ozvi se nám na email:{' '}
                <a href="mailto:summerjob@summerjob.eu">
                  summerjob@summerjob.eu
                </a>
              </p>
            </div>
          </div>
          <OtherAttributesInput
            register={register}
            objects={[
              {
                id: 'ownsCar',
                icon: 'fa fa-car',
                label: 'Přijedu autem a jsem ochotný/á vozit pracanty na joby.',
              },
              {
                id: 'canBeMedic',
                icon: 'fa fa-briefcase-medical',
                label:
                  'Jsem zdravotník (lékař, sestra, záchranář, nebo absolvent kurzu ZZA s platným certifikátem) a jsem ochotný/á se spoluúčastnit na péči o summerjobáky.',
              },
            ]}
          />
          <button
            type="submit"
            className="w-full btn btn-primary d-block m-auto
            my-5"
            disabled={isLoading}
          >
            {isLoading ? 'Odesílání...' : 'Odeslat přihlášku'}
          </button>
        </form>
      </Form>
    </div>
  )
}
