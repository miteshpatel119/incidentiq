import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import type { ToastData } from '@/lib/toast'
import { setAddToastHandler } from '@/lib/toast'

export function ToastContainer(): JSX.Element {
  const [toasts, setToasts] = useState<readonly ToastData[]>([])

  useEffect(() => {
    setAddToastHandler((toast: ToastData) => {
      setToasts((current) => [...current, toast])
      window.setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id))
      }, 5000)
    })
    return () => {
      setAddToastHandler(null)
    }
  }, [])

  if (toasts.length === 0) return <></>

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm',
            'duration-300 animate-in fade-in slide-in-from-right-full',
            toast.type === 'incident'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200'
              : toast.type === 'warning'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200'
                : toast.type === 'error'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive-foreground'
                  : 'border-border bg-card text-foreground',
          )}
          key={toast.id}
          role="alert"
        >
          {toast.type === 'incident' || toast.type === 'warning' ? (
            <AlertTriangle
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                toast.type === 'warning' ? 'text-amber-400' : 'text-rose-400',
              )}
            />
          ) : null}
          <p className="text-sm">{toast.message}</p>
          <button
            aria-label="Dismiss"
            className="ml-2 shrink-0 opacity-60 hover:opacity-100"
            onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
