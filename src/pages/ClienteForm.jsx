import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/Spinner'

const empty = {
  name: '',
  whatsapp_number: '',
  meta_pixel_id: '',
  meta_access_token: '',
  webhook_url: '',
  tag_lead: '',
  tag_compra: '',
  whatsapp_message: '',
  test_event_code: '',
  campaign_name: '',
  campaign_slug: '',
}

function normalizeSlug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function ClienteForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('accounts').select('*').eq('id', id).single()
      if (cancelled) return
      if (error || !data) {
        toast.error(error?.message || 'Cliente não encontrado')
        navigate('/clientes', { replace: true })
        return
      }
      setForm({
        name: data.name ?? '',
        whatsapp_number: data.whatsapp_number ?? '',
        meta_pixel_id: data.meta_pixel_id ?? '',
        meta_access_token: data.meta_access_token ?? '',
        webhook_url: data.webhook_url ?? '',
        tag_lead: data.tag_lead ?? '',
        tag_compra: data.tag_compra ?? '',
        whatsapp_message: data.whatsapp_message ?? '',
        test_event_code: data.test_event_code ?? '',
        campaign_name: '',
        campaign_slug: '',
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew, navigate])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isNew) {
      const slug = normalizeSlug(form.campaign_slug)
      if (!slug) {
        toast.error('Informe um slug válido para a campanha inicial (apenas letras minúsculas, números e hífen)')
        return
      }
      if (!form.campaign_name.trim()) {
        toast.error('Informe o nome da campanha inicial')
        return
      }
    }

    setSaving(true)
    try {
      if (isNew) {
        const slug = normalizeSlug(form.campaign_slug)
        const { data: acc, error: insErr } = await supabase
          .from('accounts')
          .insert({
            name: form.name.trim(),
            whatsapp_number: form.whatsapp_number.trim(),
            meta_pixel_id: form.meta_pixel_id.trim(),
            meta_access_token: form.meta_access_token.trim(),
            webhook_url: form.webhook_url.trim() || null,
            tag_lead: form.tag_lead.trim() || null,
            tag_compra: form.tag_compra.trim() || null,
            whatsapp_message: form.whatsapp_message.trim() || null,
            test_event_code: form.test_event_code.trim() || null,
          })
          .select('id')
          .single()
        if (insErr || !acc) {
          toast.error(insErr?.message || 'Erro ao criar cliente')
          return
        }
        const { error: campErr } = await supabase.from('campaigns').insert({
          account_id: acc.id,
          name: form.campaign_name.trim(),
          slug,
          active: true,
        })
        if (campErr) {
          toast.error(campErr.message)
          return
        }
        toast.success('Cliente criado')
        navigate('/clientes', { replace: true })
      } else {
        const { error } = await supabase
          .from('accounts')
          .update({
            name: form.name.trim(),
            whatsapp_number: form.whatsapp_number.trim(),
            meta_pixel_id: form.meta_pixel_id.trim(),
            meta_access_token: form.meta_access_token.trim(),
            webhook_url: form.webhook_url.trim() || null,
            tag_lead: form.tag_lead.trim() || null,
            tag_compra: form.tag_compra.trim() || null,
            whatsapp_message: form.whatsapp_message.trim() || null,
            test_event_code: form.test_event_code.trim() || null,
          })
          .eq('id', id)
        if (error) {
          toast.error(error.message)
          return
        }
        toast.success('Cliente atualizado')
        navigate('/clientes', { replace: true })
      }
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">{isNew ? 'Novo cliente' : 'Editar cliente'}</h1>
        <Link to="/clientes" className="text-sm text-primary hover:underline">
          Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <Field
          label="Nome do cliente *"
          value={form.name}
          onChange={(v) => update('name', v)}
          required
        />
        <Field
          label="Número WhatsApp * (ex: 5521999999999)"
          value={form.whatsapp_number}
          onChange={(v) => update('whatsapp_number', v)}
          required
        />
        <Field
          label="Meta Pixel ID *"
          value={form.meta_pixel_id}
          onChange={(v) => update('meta_pixel_id', v)}
          required
        />
        <Field
          label="Meta Access Token *"
          value={form.meta_access_token}
          onChange={(v) => update('meta_access_token', v)}
          required
        />
        <Field
          label="Test Event Code (opcional — usar só em testes)"
          value={form.test_event_code}
          onChange={(v) => update('test_event_code', v)}
          required={false}
          placeholder="ex: TEST12345"
        />
        <Field
          label="Webhook URL (n8n do cliente)"
          value={form.webhook_url}
          onChange={(v) => update('webhook_url', v)}
          required={false}
        />
        <Field
          label="Tag de Lead (ex: [SDR] 4.CONVITE)"
          value={form.tag_lead}
          onChange={(v) => update('tag_lead', v)}
          required={false}
        />
        <Field
          label="Tag de Compra (ex: [COMPROU])"
          value={form.tag_compra}
          onChange={(v) => update('tag_compra', v)}
          required={false}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Mensagem WhatsApp</label>
          <textarea
            rows={3}
            value={form.whatsapp_message}
            onChange={(ev) => update('whatsapp_message', ev.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
            placeholder="Texto pré-preenchido no wa.me"
          />
        </div>

        {isNew ? (
          <>
            <Field
              label="Nome da campanha inicial *"
              value={form.campaign_name}
              onChange={(v) => update('campaign_name', v)}
              required
            />
            <Field
              label="Slug da campanha inicial * (ex: meta-ads, sem espaços)"
              value={form.campaign_slug}
              onChange={(v) => update('campaign_slug', v)}
              required
            />
          </>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/clientes"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : null}
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, required = true, type = 'text', placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
      />
    </div>
  )
}
