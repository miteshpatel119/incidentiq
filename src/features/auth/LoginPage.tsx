import { Activity, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthProvider'

interface LocationState {
  readonly from?: { readonly pathname?: string }
}

export function LoginPage(): JSX.Element {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const target = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard'

  if (isAuthenticated) return <Navigate replace to="/dashboard" />

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    window.setTimeout(() => {
      if (login(username.trim(), password)) void navigate(target, { replace: true })
      else {
        setError('Use the demo credentials: admin / admin.')
        setIsSubmitting(false)
      }
    }, 450)
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-center gap-3 text-lg font-semibold">
          <span className="rounded-lg bg-primary p-2 text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          IncidentIQ
        </div>
        <div className="relative max-w-xl">
          <p className="text-sm font-medium text-primary">AI INCIDENT INVESTIGATOR</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">
            Resolve the signal. Not just the symptom.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
            A focused workspace for teams to coordinate incidents, preserve context, and move from
            alert to resolution.
          </p>
        </div>
        <p className="relative text-sm text-slate-500">
          Incident intelligence for high-performing engineering teams.
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="rounded-lg bg-primary p-2 text-primary-foreground">
              <Activity className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold">IncidentIQ</span>
          </div>
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your incident command center.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm font-medium">
              Username
              <input
                autoComplete="username"
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                required
                value={username}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Password
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border border-input bg-card px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {error !== null ? (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-300"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-6 rounded-lg bg-secondary/60 px-3 py-2 text-center text-xs text-muted-foreground">
            Demo credentials: <span className="font-medium text-foreground">admin / admin</span>
          </p>
        </div>
      </section>
    </main>
  )
}
