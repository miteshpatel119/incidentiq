import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'

interface AuthContextValue {
  readonly isAuthenticated: boolean
  readonly login: (username: string, password: string) => boolean
  readonly logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const SESSION_STORAGE_KEY = 'incidentiq-session'

export function AuthProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_STORAGE_KEY) === 'authenticated',
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      login: (username, password) => {
        const validCredentials = username === 'admin' && password === 'admin'
        if (validCredentials) {
          sessionStorage.setItem(SESSION_STORAGE_KEY, 'authenticated')
          setIsAuthenticated(true)
        }
        return validCredentials
      },
      logout: () => {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        setIsAuthenticated(false)
      },
    }),
    [isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
