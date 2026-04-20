/** SQL para colar no Supabase (SQL Editor) se o RPC ainda não existir. */
export const VENDATECH_RUN_SETUP_SQL = `
CREATE OR REPLACE FUNCTION public.vendatech_run_setup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    webhook_url TEXT,
    meta_access_token TEXT,
    meta_pixel_id TEXT,
    tag_lead TEXT,
    tag_compra TEXT,
    whatsapp_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(account_id, slug)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    fbclid TEXT,
    fbc TEXT,
    fbp TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes') NOT NULL,
    phone TEXT,
    matched_at TIMESTAMPTZ,
    matched BOOLEAN DEFAULT FALSE NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON sessions(account_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_campaign_id ON sessions(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_match_lookup ON sessions(account_id, matched, expires_at) WHERE matched = FALSE;
  CREATE INDEX IF NOT EXISTS idx_campaigns_account_id ON campaigns(account_id);

  ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS vendatech_accounts_authenticated_all ON accounts;
  CREATE POLICY vendatech_accounts_authenticated_all
    ON accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS vendatech_campaigns_authenticated_all ON campaigns;
  CREATE POLICY vendatech_campaigns_authenticated_all
    ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS vendatech_sessions_authenticated_all ON sessions;
  CREATE POLICY vendatech_sessions_authenticated_all
    ON sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS vendatech_sessions_anon_all ON sessions;
  CREATE POLICY vendatech_sessions_anon_all
    ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS vendatech_accounts_anon_select_redirect ON accounts;
  CREATE POLICY vendatech_accounts_anon_select_redirect
    ON accounts FOR SELECT TO anon USING (true);

  DROP POLICY IF EXISTS vendatech_campaigns_anon_select_redirect ON campaigns;
  CREATE POLICY vendatech_campaigns_anon_select_redirect
    ON campaigns FOR SELECT TO anon USING (true);
END;
$fn$;

REVOKE ALL ON FUNCTION public.vendatech_run_setup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vendatech_run_setup() TO service_role;
`.trim()
