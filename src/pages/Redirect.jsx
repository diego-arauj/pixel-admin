import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/Spinner'

function getCookie(name) {
  const m = typeof document !== 'undefined' ? document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`)) : null
  return m ? decodeURIComponent(m[1]) : null
}

/**
 * Aguarda o cookie _fbp do Meta (até maxMs).
 */
export function waitForFbp(maxMs = 3000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      const v = getCookie('_fbp')
      if (v) {
        resolve(v)
        return
      }
      if (Date.now() - start >= maxMs) {
        resolve(getCookie('_fbp') ?? null)
        return
      }
      setTimeout(tick, 50)
    }
    tick()
  })
}

function initMetaPixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return
  if (window.fbq) {
    window.fbq('init', pixelId)
    window.fbq('track', 'PageView')
    return
  }
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

function buildWaUrl(whatsappNumber, message) {
  const digits = String(whatsappNumber ?? '').replace(/\D/g, '')
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  const text = String(message ?? '').trim()
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}

export function Redirect() {
  const { accountId, campaignSlug } = useParams()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const utm_source = searchParams.get('utm_source')
      const utm_medium = searchParams.get('utm_medium')
      const utm_campaign = searchParams.get('utm_campaign')
      const utm_content = searchParams.get('utm_content')
      const utm_term = searchParams.get('utm_term')
      const fbclid = searchParams.get('fbclid')

      const fbc = fbclid ? `fb.1.${Date.now()}.${fbclid}` : null

      const accountRes = await supabase
        .from('accounts')
        .select('whatsapp_number, meta_pixel_id, whatsapp_message')
        .eq('id', accountId)
        .maybeSingle()

      if (cancelled) return

      if (accountRes.error) {
        setError(accountRes.error.message)
        return
      }
      const account = accountRes.data
      if (!account) {
        setError('Conta não encontrada')
        return
      }

      const pixelId = account.meta_pixel_id?.trim()
      if (pixelId) {
        initMetaPixel(pixelId)
      }

      const [fbp, campaignRes] = await Promise.all([
        waitForFbp(3000),
        supabase
          .from('campaigns')
          .select('id')
          .eq('account_id', accountId)
          .eq('slug', campaignSlug)
          .eq('active', true)
          .maybeSingle(),
      ])

      if (cancelled) return

      const campaign = campaignRes.data
      if (campaignRes.error) {
        setError(campaignRes.error.message)
        return
      }

      if (campaign?.id) {
        const { error: insErr } = await supabase.from('sessions').insert({
          campaign_id: campaign.id,
          account_id: accountId,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          utm_term,
          fbclid,
          fbc,
          fbp,
        })
        if (insErr && !cancelled) {
          console.warn('[Redirect] sessions insert:', insErr.message)
        }
      }

      const wa = buildWaUrl(account.whatsapp_number, account.whatsapp_message)
      if (!wa) {
        setError('WhatsApp não configurado para esta conta')
        return
      }
      window.location.replace(wa)
    }

    run().catch((e) => {
      if (!cancelled) setError(e?.message ?? 'Erro ao processar')
    })

    return () => {
      cancelled = true
    }
  }, [accountId, campaignSlug, searchParams.toString()])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
      {error ? (
        <p className="max-w-sm px-4 text-center text-sm text-foreground/80">{error}</p>
      ) : (
        <>
          <Spinner />
          <p className="text-sm font-medium tracking-wide text-foreground/60">Redirecionando...</p>
        </>
      )}
    </div>
  )
}
