import { Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Sidebar } from '@/components/layout/Sidebar'
import { UserMenu } from '@/components/layout/UserMenu'

export function AppLayout(): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen((open) => !open)}
              size="icon"
              variant="ghost"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="hidden sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Workspace
              </p>
              <p className="text-sm font-semibold">Production</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="Notifications" size="icon" variant="ghost">
              <Bell className="h-4 w-4" />
            </Button>
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
