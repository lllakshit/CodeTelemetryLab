import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const DEFAULT_ADMIN_EMAIL = "admin@codetelemetrylabs.com"
const DEFAULT_ADMIN_PASSWORD = "admin1234"
const DEV_PLACEHOLDER_PASSWORDS = new Set(["change-this-password"])

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim())?.trim()
}

function resolveAdminEmail() {
  return firstNonEmpty(process.env.ADMIN_EMAIL) ?? DEFAULT_ADMIN_EMAIL
}

function resolveAdminPassword() {
  const configuredPassword = firstNonEmpty(process.env.ADMIN_PASSWORD)

  if (!configuredPassword) {
    return DEFAULT_ADMIN_PASSWORD
  }

  if (process.env.NODE_ENV !== "production" && DEV_PLACEHOLDER_PASSWORDS.has(configuredPassword)) {
    return DEFAULT_ADMIN_PASSWORD
  }

  return configuredPassword
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Admin credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const adminEmail = resolveAdminEmail()
        const adminPassword = resolveAdminPassword()

        if (
          parsed.data.email.toLowerCase() !== adminEmail?.toLowerCase() ||
          parsed.data.password !== adminPassword
        ) {
          return null
        }

        return {
          id: "admin",
          name: "Admin",
          email: adminEmail,
          role: "admin",
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined
      }
      return session
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "codetelemetrylabs-dev-secret"),
})
