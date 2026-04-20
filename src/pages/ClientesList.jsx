import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { buildN8nWorkflowJson, sanitizeFilenamePart } from '../lib/workflowTemplate'
import { Spinner } from '../components/Spinner'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function ClientesList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportingId, setExportingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('accounts')
      .select('id,name,whatsapp_number,meta_pixel_id,created_at')
      .order('created_at', { ascending: false })
    if (error) {
      toast.error(error.message)
      setRows([])
    } else {
      setRows(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function exportN8n(id) {
    setExportingId(id)
    try {
      const { data, error } = await supabase.from('accounts').select('*').eq('id', id).single()
      if (error || !data) {
        toast.error(error?.message || 'Cliente não encontrado')
        return
      }
      const json = buildN8nWorkflowJson(data)
      const name = sanitizeFilenamePart(data.name)
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workflow_${name}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Download iniciado')
    } finally {
      setExportingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-foreground/60">Gerencie contas, integrações e campanhas</p>
        </div>
        <Link
          to="/clientes/novo"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Novo Cliente
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-foreground/70">
            Nenhum cliente cadastrado ainda. Clique em <span className="font-medium text-foreground">Novo Cliente</span>{' '}
            para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-foreground/80">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground/80">WhatsApp</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground/80">Pixel ID</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground/80">Data de cadastro</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground/80">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-background/40">
                    <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-3 text-foreground/80">{r.whatsapp_number}</td>
                    <td className="px-4 py-3 text-foreground/80">{r.meta_pixel_id || '—'}</td>
                    <td className="px-4 py-3 text-foreground/80">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/clientes/${r.id}/editar`}
                          className="rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:border-primary/40"
                        >
                          Editar
                        </Link>
                        <Link
                          to={`/clientes/${r.id}/campanhas`}
                          className="rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:border-primary/40"
                        >
                          Campanhas
                        </Link>
                        <button
                          type="button"
                          onClick={() => exportN8n(r.id)}
                          disabled={exportingId === r.id}
                          className="rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:border-primary/40 disabled:opacity-50"
                        >
                          {exportingId === r.id ? '…' : 'Exportar n8n'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
