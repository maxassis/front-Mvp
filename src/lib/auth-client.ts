import { emailOTPClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const authClient = createAuthClient({
  baseURL,
  plugins: [emailOTPClient()]
})

export type AuthClient = typeof authClient

export { baseURL as apiBaseUrl }
