import { Activity, BarChart3, FileText, LayoutDashboard, Server, Settings, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidents', to: '/incidents', icon: Activity },
  { label: 'Services', to: '/services', icon: Server },
  { label: 'RCA reports', to: '/reports', icon: FileText },
] as const

interface SidebarProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps): JSX.Element {
  return (
    <>
      <button
        aria-label="Close navigation"
        className={cn('fixed inset-0 z-40 bg-slate-950/60 lg:hidden', isOpen ? 'block' : 'hidden')}
        onClick={onClose}
        type="button"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3 font-semibold">
            <span className="rounded-lg bg-primary p-2 text-primary-foreground">
              <Activity className="h-4 w-4" />
            </span>
            IncidentIQ
          </div>
          <Button
            aria-label="Close navigation"
            className="lg:hidden"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
              key={to}
              onClick={onClose}
              to={to}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
            onClick={onClose}
            to="/settings"
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
          <div className="mt-4 rounded-lg bg-secondary/60 p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <BarChart3 className="h-4 w-4 text-primary" />
              Platform status
            </div>
            <p className="mt-1 text-xs text-emerald-300">All systems operational</p>
          </div>
        </div>
      </aside>
    </>
  )
}
