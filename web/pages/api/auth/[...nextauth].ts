import NextAuth, { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from 'lib/prisma/connection'
import { createTransport } from 'nodemailer'
import { emailHtml, emailText } from 'lib/auth/auth'
import { getUserByEmail } from 'lib/data/users'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { Permission } from 'lib/types/auth'
import { OAuthConfig } from 'next-auth/providers/index'
import CredentialsProvider from 'next-auth/providers/credentials'
import { checkReceptionPassword } from 'lib/data/summerjob-event'
import { encode as defaultEncode } from 'next-auth/jwt'
import { v4 as uuid } from 'uuid'
import { add } from 'date-fns'

type SeznamProfile = {
  oauth_user_id: string
  email: string | null
}

type SeznamTokenResponse = {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
  oauth_user_id?: string
  account_name?: string
  scopes?: string[]
}

const SeznamProvider: OAuthConfig<SeznamProfile> = {
  id: 'seznam',
  name: 'Seznam',
  type: 'oauth',
  clientId: process.env.SEZNAM_CLIENT_ID!,
  clientSecret: process.env.SEZNAM_CLIENT_SECRET!,

  authorization: {
    url: 'https://login.szn.cz/api/v1/oauth/auth',
    params: { scope: 'identity' },
  },

  token: {
    url: 'https://login.szn.cz/api/v1/oauth/token',

    // Seznam OAuth isn't fully standard so we need to override token.request
    // https://vyvojari.seznam.cz/oauth/doc
    async request({ params }) {
      const redirect_uri = `${process.env.NEXTAUTH_URL}/api/auth/callback/seznam`
      const res = await fetch('https://login.szn.cz/api/v1/oauth/token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: params.code,
          redirect_uri,
          client_secret: process.env.SEZNAM_CLIENT_SECRET,
          client_id: process.env.SEZNAM_CLIENT_ID,
        }),
      })
      if (!res.ok) {
        throw new Error('Seznam token error')
      }
      const json = (await res.json()) as SeznamTokenResponse

      const expires_at =
        typeof json.expires_in === 'number'
          ? Math.floor(Date.now() / 1000) + json.expires_in
          : undefined

      return {
        tokens: {
          access_token: json.access_token,
          refresh_token: json.refresh_token,
          token_type: json.token_type,
          expires_at,
          scope: Array.isArray(json.scopes) ? json.scopes.join(',') : undefined,
        },
      }
    },
  },

  userinfo: {
    url: 'https://login.szn.cz/api/v1/user',
  },

  checks: ['state'],

  profile(profile) {
    return {
      id: profile.oauth_user_id,
      email: profile.email,
    }
  },

  allowDangerousEmailAccountLinking: true,
}

const prismaAdapter = PrismaAdapter(prisma)

export const authOptions: NextAuthOptions = {
  session: { strategy: 'database' },
  adapter: prismaAdapter,
  providers: [
    EmailProvider({
      server:
        process.env.NODE_ENV === 'development'
          ? { host: 'localhost', port: 25, auth: { user: '', pass: '' } }
          : process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      // maxAge: 24 * 60 * 60, // How long email links are valid for (default 24h)
      async sendVerificationRequest({ identifier: email, url, provider }) {
        // In dev, emails are not sent, user is automatically signed in
        if (process.env.NODE_ENV === 'development') {
          console.log(
            'E-mails are not sent in dev mode. You will be logged in automatically.'
          )
          return
        }
        const { host } = new URL(url)
        const transport = createTransport(provider.server)
        const result = await transport.sendMail({
          to: email,
          from: provider.from,
          subject: `SummerJob přihlášení`,
          text: emailText({ url, host }),
          html: emailHtml({ url, host }),
        })
        const failed = result.rejected.concat(result.pending).filter(Boolean)
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`)
        }
      },
    }),

    // Used only for reception login
    CredentialsProvider({
      id: 'reception',
      credentials: {
        password: { label: 'password', type: 'password' },
      },
      async authorize(credentials) {
        const password = credentials?.password ?? ''
        const isValid = await checkReceptionPassword(password)
        if (!isValid) {
          return null
        }

        const receptionEmail = process.env.RECEPTION_EMAIL!
        const receptionUser = await prisma.user.upsert({
          where: { email: receptionEmail },
          update: { email: receptionEmail },
          create: { email: receptionEmail },
        })
        if (!receptionUser) {
          return null
        }
        return {
          id: receptionUser.id,
          email: receptionUser.email,
        }
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    SeznamProvider,
  ],
  callbacks: {
    // Check if user is allowed to sign in
    async signIn(params) {
      if (!params.user.email) return false
      const user = await getUserByEmail(params.user.email)
      if (!user) return false
      if (params.account?.provider === 'seznam') {
        if (!params.profile?.email) return false
      }
      const isAdmin = user.permissions.includes(Permission.ADMIN)
      // Admins can sign in even if they are blocked to prevent accidental self-lockout
      if (isAdmin) return true
      if (user.blocked) return false
      const activeEventId = await cache_getActiveSummerJobEventId()
      if (!activeEventId) return false
      if (params.account?.provider === 'reception') {
        // The authorize function in the Credentials provider has already checked this user
        return true
      }
      // Non-admins can only sign in if they are registered in the active event
      if (user.availability.some(av => av.eventId === activeEventId))
        return true

      return false
    },
    async session({ session, user }) {
      const userRecord = await getUserByEmail(user.email)
      if (!userRecord) return session

      const extended = {
        ...session,
        userID: userRecord.id,
        username: `${userRecord.firstName} ${userRecord.lastName}`,
        permissions: userRecord.permissions,
      }

      return extended
    },
    async jwt({ token, account }) {
      if (account?.provider === 'reception') {
        token.credentials = true
      } else {
        token.credentials = false
      }
      return token
    },
  },

  // Credentials provider workaround to work with db session strategy
  // https://github.com/ugurkellecioglu/another-next-template/blob/main/auth.ts
  jwt: {
    async encode(params) {
      if (params.token?.credentials) {
        const sessionToken = uuid()

        if (!params.token.sub) {
          throw new Error('No user ID found in token')
        }

        const expires = add(new Date(), { days: 30 })
        const createdSession = await prismaAdapter.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires,
        })

        if (!createdSession) {
          throw new Error('Failed to create session')
        }

        return sessionToken
      }
      return defaultEncode(params)
    },
  },
  pages: {
    signIn: '/auth/signIn',
    verifyRequest: '/auth/checkEmail',
    error: '/auth/error',
  },
}

export default NextAuth(authOptions)
