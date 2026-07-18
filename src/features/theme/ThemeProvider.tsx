import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  readonly theme: Theme
  readonly toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const THEME_STORAGE_KEY = 'incidentiq-theme'

export function ThemeProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const value: ThemeContextValue = {
    theme,
    toggleTheme: () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark')),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === null) throw new Error('useTheme must be used within ThemeProvider.')
  return context
}
