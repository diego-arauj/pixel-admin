export function EnvMissing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-xl font-semibold text-foreground">Variáveis de ambiente ausentes</h1>
      <p className="max-w-md text-sm text-foreground/70">
        Defina <code className="rounded bg-surface px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code>,{' '}
        <code className="rounded bg-surface px-1 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code> e{' '}
        <code className="rounded bg-surface px-1 py-0.5 text-xs">VITE_SUPABASE_SERVICE_ROLE_KEY</code>{' '}
        no arquivo <code className="rounded bg-surface px-1 py-0.5 text-xs">.env</code> e reinicie o
        servidor de desenvolvimento.
      </p>
    </div>
  )
}
