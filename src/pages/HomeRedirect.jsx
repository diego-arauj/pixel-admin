import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { FullPageSpinner } from '../components/Spinner'

function hasRequiredEnv() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  )
}

export function HomeRedirect() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!hasRequiredEnv()) {
        if (!cancelled) navigate('/login', { replace: true })
        return
      }
      const { error } = await supabaseAdmin.from('accounts').select('id').limit(1)
      if (cancelled) return
      if (error) {
        navigate('/setup', { replace: true })
        return
      }
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      navigate(session ? '/clientes' : '/login', { replace: true })
    })().catch(() => {
      if (!cancelled) setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (failed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-sm text-foreground/80">
        Não foi possível verificar o estado do sistema. Confira as variáveis de ambiente e tente
        novamente.
      </div>
    )
  }

  return <FullPageSpinner />
}
