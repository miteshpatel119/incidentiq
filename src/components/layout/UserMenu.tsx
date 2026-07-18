import { LogOut, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTheme } from '@/features/theme/ThemeProvider'

export function UserMenu(): JSX.Element {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  function handleLogout(): void {
    logout()
    void navigate('/login')
  }
  return (
    <div className="flex items-center gap-1 border-l border-border pl-2">
      <Button aria-label="Toggle color theme" onClick={toggleTheme} size="icon" variant="ghost">
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <div className="hidden px-2 text-right sm:block">
        <p className="text-sm font-medium leading-4">Alex Morgan</p>
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        AM
      </span>
      <Button aria-label="Sign out" onClick={handleLogout} size="icon" variant="ghost">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
