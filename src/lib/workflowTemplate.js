import raw from './workflowTemplate.json?raw'

/** Template n8n com placeholders __SUPABASE_URL__, __SUPABASE_KEY__, etc. */
export const WORKFLOW_TEMPLATE = raw

function escapeJsonStringContent(str) {
  return JSON.stringify(str ?? '').slice(1, -1)
}

export function buildN8nWorkflowJson(account) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
  const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
  const pairs = [
    ['__SUPABASE_URL__', supabaseUrl],
    ['__SUPABASE_KEY__', supabaseAnon],
    ['__ACCOUNT_ID__', account?.id ?? ''],
    ['__META_PIXEL_ID__', account?.meta_pixel_id ?? ''],
    ['__META_ACCESS_TOKEN__', account?.meta_access_token ?? ''],
    ['__TAG_LEAD__', account?.tag_lead ?? ''],
    ['__TAG_COMPRA__', account?.tag_compra ?? ''],
    ['__TEST_EVENT_CODE__', account?.test_event_code ?? ''],
  ]
  let out = WORKFLOW_TEMPLATE
  for (const [ph, val] of pairs) {
    const esc = escapeJsonStringContent(val)
    out = out.split(ph).join(esc)
  }
  return out
}

export function sanitizeFilenamePart(name) {
  return String(name || 'cliente')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'cliente'
}
