import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { getRedirectBaseUrl } from '../lib/redirectBase'
import { Spinner } from '../components/Spinner'

function buildLink(base, accountId, slug) {
  const b = String(base || '').replace(/\/+$/, '')
  if (!b) return ''
  return `${b}/r/${accountId}/${slug}`
}

export function Campanhas() {
  const { id: accountId } = useParams()
  const [account, setAccount] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    setBaseUrl(getRedirectBaseUrl())
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: acc, error: accErr }, { data: camps, error: campErr }] = await Promise.all([
      supabase.from('accounts').select('id,name').eq('id', accountId).single(),
      supabase.from('campaigns').select('*').eq('account_id', accountId).order('created_at', { ascending: false }),
    ])
    if (accErr || !acc) {
      toast.error(accErr?.message || 'Cliente não encontrado')
      setAccount(null)
      setCampaigns([])
    } else {
      setAccount(acc)
      setCampaigns(camps ?? [])
    }
    if (campErr) toast.error(campErr.message)
    setLoading(false)
  }, [accountId])

  useEffect(() => {
    load()
  }, [load])

  async function copyLink(url, rowId) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(rowId)
      setTimeout(() => setCopied(null), 2000)
      toast.success('Copiado!')
    } catch {
      toast.error('Não foi possível copiar')
    }
  }

  async function toggleActive(row) {
    setTogglingId(row.id)
    try {
      const { error } = await supabase.from('campaigns').update({ active: !row.active }).eq('id', row.id)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(row.active ? 'Campanha desativada' : 'Campanha ativada')
      await load()
    } finally {
      setTogglingId(null)
    }
  }

  function normalizeSlug(s) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  async function createCampaign(e) {
    e.preventDefault()
    const slug = normalizeSlug(newSlug)
    if (!newName.trim() || !slug) {
      toast.error('Preencha nome e um slug válido')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('campaigns').insert({
        account_id: accountId,
        name: newName.trim(),
        slug,
        active: true,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Campanha criada')
      setModalOpen(false)
      setNewName('')
      setNewSlug('')
      await load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="text-center text-sm text-foreground/70">
        <Link to="/clientes" className="text-primary hover:underline">
          Voltar para clientes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Campanhas</h1>
          <p className="text-sm text-foreground/60">{account.name}</p>
          {!baseUrl ? (
            <p className="mt-2 text-xs text-amber-200/90">
              Defina <code className="rounded bg-surface px-1">VITE_REDIRECT_BASE_URL</code> no ambiente ou
              conclua o setup para gerar links completos.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/clientes"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Voltar
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Nova Campanha
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-background/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground/80">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-foreground/80">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-foreground/80">Link</th>
                <th className="px-4 py-3 text-left font-medium text-foreground/80">Status</th>
                <th className="px-4 py-3 text-right font-medium text-foreground/80">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => {
                const url = buildLink(baseUrl, accountId, c.slug)
                return (
                  <tr key={c.id} className="hover:bg-background/40">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-foreground/80">{c.slug}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-foreground/70">{url || '—'}</td>
                    <td className="px-4 py-3 text-foreground/80">{c.active ? 'Ativo' : 'Inativo'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          disabled={!url}
                          onClick={() => copyLink(url, c.id)}
                          className="rounded border border-border px-2 py-1 text-xs font-medium hover:border-primary/40 disabled:opacity-40"
                        >
                          {copied === c.id ? 'Copiado!' : 'Copiar link'}
                        </button>
                        <button
                          type="button"
                          disabled={togglingId === c.id}
                          onClick={() => toggleActive(c)}
                          className="rounded border border-border px-2 py-1 text-xs font-medium hover:border-primary/40 disabled:opacity-50"
                        >
                          {togglingId === c.id ? '…' : c.active ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">Nova campanha</h2>
            <form onSubmit={createCampaign} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <input
                  required
                  value={newName}
                  onChange={(ev) => setNewName(ev.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <input
                  required
                  value={newSlug}
                  onChange={(ev) => setNewSlug(ev.target.value)}
                  placeholder="meta-ads"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : null}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
