import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { Spinner } from '../components/Spinner'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [boot, setBoot] = useState({ loading: true, session: null, tablesMissing: false })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const { error } = await supabaseAdmin.from('accounts').select('id').limit(1)
      if (!cancelled) {
        setBoot({
          loading: false,
          session,
          tablesMissing: Boolean(error),
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (boot.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  if (boot.tablesMissing) {
    return <Navigate to="/setup" replace />
  }

  if (boot.session) {
    return <Navigate to="/clientes" replace />
  }

  async function handleLogin(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Login realizado')
      navigate('/clientes', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot() {
    if (!email.trim()) {
      toast.error('Informe seu email para recuperar a senha')
      return
    }
    setResetBusy(true)
    try {
      const redirectTo = `${window.location.origin}/login`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Enviamos um link de recuperação para o seu email')
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-center text-2xl font-semibold text-foreground">VendaTech Pixel Admin</h1>
      <p className="mt-2 text-center text-sm text-foreground/70">Acesse com seu email e senha</p>
      <form onSubmit={handleLogin} className="mt-8 space-y-4 rounded-lg border border-border bg-surface p-8">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="Coloque o seu e-mail aqui, guerreiro"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Senha</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? <Spinner className="h-5 w-5 border-white border-t-transparent" /> : null}
          Entrar
        </button>
        <div className="text-center">
          <button
            type="button"
            onClick={handleForgot}
            disabled={resetBusy}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            Esqueci minha senha
          </button>
        </div>
        <p className="text-center text-xs text-foreground/50">
          <Link to="/" className="hover:text-foreground">
            Voltar ao início
          </Link>
        </p>
      </form>
    </div>
  )
}
