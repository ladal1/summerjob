import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "lib/prisma/connection";
import { createTransport } from "nodemailer";
import { emailHtml, emailText } from "lib/auth/auth";
import { getUserByEmail } from "lib/data/users";
import { cache_getActiveSummerJobEventId } from "lib/data/cache";
import { Permission } from "lib/types/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.NODE_ENV === "development" ? { host: "localhost", port: 25, auth: { user: "", pass: "" } } : process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      // maxAge: 24 * 60 * 60, // How long email links are valid for (default 24h)
      async sendVerificationRequest({
        identifier: email,
        url,
        token,
        provider,
      }) {
        // In dev, emails are not sent, user is automatically signed in
        if (process.env.NODE_ENV === "development") {
          console.log(
            "E-mails are not sent in dev mode. You will be logged in automatically."
          );
          return;
        }
        const { host } = new URL(url);
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: email,
          from: provider.from,
          subject: `SummerJob přihlášení`,
          text: emailText({ url, host }),
          html: emailHtml({ url, host }),
        });
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
        }
      },
    }),
  ],
  callbacks: {
    // Check if user is allowed to sign in
    async signIn(params) {
      if (!params.user.email) return false;
      const user = await getUserByEmail(params.user.email);
      if (!user) return false;
      const isAdmin = user.permissions.includes(Permission.ADMIN);
      // Admins can sign in even if they are blocked to prevent accidental self-lockout
      if (isAdmin) return true;
      if (user.blocked) return false;
      // Non-admins can only sign in if they are registered in the active event
      const activeEventId = await cache_getActiveSummerJobEventId();
      if (!activeEventId) return false;
      if (user.availability.some((av) => av.eventId === activeEventId))
        return true;

      return false;
    },
    async session({ session, user }) {
      const userRecord = await getUserByEmail(user.email);
      if (!userRecord) return session;

      const extended = {
        ...session,
        userID: userRecord.id,
        username: `${userRecord.firstName} ${userRecord.lastName}`,
        permissions: userRecord.permissions,
      };

      return extended;
    },
  },
  pages: {
    signIn: "/auth/signIn",
    verifyRequest: "/auth/checkEmail",
    error: "/auth/error",
  },
};

export default NextAuth(authOptions);
