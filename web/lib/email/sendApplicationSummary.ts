import { createTransport } from 'nodemailer'
import { ApplicationCreateDataInput } from 'lib/types/application'

const transport = createTransport(process.env.EMAIL_SERVER || '')

const fieldLabels: Partial<Record<keyof ApplicationCreateDataInput, string>> = {
  firstName: 'Jméno',
  lastName: 'Příjmení',
  birthDate: 'Datum narození',
  gender: 'Pohlaví',
  phone: 'Telefon',
  email: 'Email',
  address: 'Adresa',
  pastParticipation: 'Zúčastnil(a) se v minulosti',
  arrivalDate: 'Datum příjezdu',
  departureDate: 'Datum odjezdu',
  foodAllergies: 'Alergie na jídlo',
  workAllergies: 'Alergie při práci',
  toolsSkills: 'Nářadí, se kterým umím zacházet',
  toolsBringing: 'Nářadí, které přivezu',
  heardAboutUs: 'Jak ses o nás dozvěděl/a',
  playsInstrument: 'Chceš zpívat nebo hrát na hudební nástroj ve schole',
  tShirtSize: 'Velikost a barva trička',
  additionalInfo: 'Dodatečné informace',
  accommodationPrice: 'Cena za ubytování',
  ownsCar: 'Přijedu autem a jsem ochotný/á vozit pracanty na joby.',
  canBeMedic:
    'Jsem zdravotník a jsem ochotný/á se spoluúčastnit na péči o summerjobáky.',
}

const formatValue = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toLocaleDateString('cs-CZ')
  }
  if (typeof value === 'boolean') {
    return value ? 'Ano' : 'Ne'
  }
  if (value === null || value === undefined || value === '') {
    return '<i>nevyplněno</i>'
  }
  return String(value)
}

export async function sendApplicationSummaryEmail(
  email: string,
  data: ApplicationCreateDataInput
) {
  const { firstName, gender, ...rest } = data

  const pronounText = gender === 'Muž' ? 'vyplnil' : 'vyplnila'

  const subject = 'Souhrn přihlášky na SummerJob'
  const intro = `Ahoj ${firstName},<br/><br/>děkujeme za odeslání přihlášky na SummerJob! Níže najdeš souhrn údajů, které jsi ${pronounText}.<br/><br/>`
  const outro = `<br/><br/><strong>Do tří týdnů ti potvrdíme účast.</strong><br/><br/>Tým SummerJob ❤️`

  const details = Object.entries(rest)
    .map(([key, value]) => {
      const label = fieldLabels[key as keyof ApplicationCreateDataInput] || key
      const formatted = formatValue(value)
      return `<strong>${label}:</strong> ${formatted}`
    })
    .join('<br/>')

  const html = `${intro}${details}${outro}`

  const result = await transport.sendMail({
    to: email,
    from: process.env.EMAIL_FROM,
    subject,
    html,
  })

  const failed = result.rejected.concat(result.pending).filter(Boolean)
  if (failed.length) {
    throw new Error(`E-mail(y) (${failed.join(', ')}) se nepodařilo odeslat`)
  }
}
