import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export function MainLayout() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Sessão encerrada')
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="z-40 flex w-full flex-shrink-0 flex-col border-b border-border bg-surface md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
        <div className="border-b border-border px-5 py-6">
          <Link to="/clientes" className="block text-lg font-semibold tracking-tight text-foreground">
            VendaTech Pixel Admin
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-border/60 text-foreground' : 'text-foreground/80 hover:bg-border/40'
              }`
            }
          >
            Clientes
          </NavLink>
        </nav>
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary"
          >
            Sair
          </button>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-foreground/70">
              Logado como <span className="font-medium text-foreground">{email || '—'}</span>
            </p>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
