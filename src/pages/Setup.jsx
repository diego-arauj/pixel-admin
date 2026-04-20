import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabaseAdmin } from '../lib/supabase'
import { accountsTableExists, ensureSchemaWithRpc } from '../lib/setupSchema'
import { VENDATECH_RUN_SETUP_SQL } from '../lib/vendatechRunSetupSql'
import { setSessionRedirectBaseUrl } from '../lib/redirectBase'
import { Spinner } from '../components/Spinner'

export function Setup() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [already, setAlready] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [redirectBase, setRedirectBase] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { ok } = await accountsTableExists()
      if (!cancelled) {
        setAlready(ok)
        setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function copySql() {
    try {
      await navigator.clipboard.writeText(VENDATECH_RUN_SETUP_SQL)
      toast.success('SQL copiado para a área de transferência')
    } catch {
      toast.error('Não foi possível copiar o SQL')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres')
      return
    }
    if (!redirectBase.trim()) {
      toast.error('Informe a URL base do redirecionador')
      return
    }
    setBusy(true)
    try {
      const { error: rpcError } = await ensureSchemaWithRpc()
      if (rpcError) {
        toast.message('RPC de schema', {
          description:
            'Se esta é a primeira vez, cole o SQL (botão abaixo) no Supabase SQL Editor e tente novamente.',
        })
      }
      const { ok: tablesOk, error: tblErr } = await accountsTableExists()
      if (!tablesOk) {
        toast.error(tblErr?.message || 'Tabelas ainda não encontradas. Execute o SQL no Supabase.')
        return
      }

      const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
      })
      if (userErr) {
        toast.error(userErr.message)
        return
      }
      if (!userData?.user?.id) {
        toast.error('Não foi possível criar o usuário administrador')
        return
      }

      setSessionRedirectBaseUrl(redirectBase.trim())
      toast.success('Configuração concluída')
      navigate('/login', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  if (already) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-4">
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">Sistema já configurado</h1>
          <p className="mt-2 text-sm text-foreground/70">As tabelas já existem neste projeto.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Configuração Inicial — VendaTech Pixel Admin
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Preencha os dados abaixo para configurar o sistema
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-foreground/80">
          Na primeira execução, o app tenta criar as tabelas via RPC{' '}
          <code className="rounded bg-background px-1 py-0.5 text-xs">vendatech_run_setup</code>. Se o
          Supabase ainda não tiver essa função, copie e execute o SQL abaixo no SQL Editor (uma vez).
        </p>
        <button
          type="button"
          onClick={copySql}
          className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:border-primary/40"
        >
          Copiar SQL (função + tabelas + políticas)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-surface p-8">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Email do administrador</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Senha do administrador (mínimo 8 caracteres)
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            URL base do redirecionador (ex: https://pixel.dominiodele.com.br)
          </label>
          <input
            type="url"
            required
            placeholder="https://"
            value={redirectBase}
            onChange={(ev) => setRedirectBase(ev.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? <Spinner className="h-5 w-5 border-white border-t-transparent" /> : null}
          Configurar
        </button>
      </form>
    </div>
  )
}
