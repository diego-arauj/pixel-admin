import { supabaseAdmin } from './supabase'

export async function ensureSchemaWithRpc() {
  const { error } = await supabaseAdmin.rpc('vendatech_run_setup')
  return { error }
}

export async function accountsTableExists() {
  const { error } = await supabaseAdmin.from('accounts').select('id').limit(1)
  return { ok: !error, error }
}
