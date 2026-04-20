import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FullPageSpinner } from './Spinner'

export function ProtectedRoute() {
  const location = useLocation()
  const [state, setState] = useState({ loading: true, session: null })

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setState({ loading: false, session: data.session })
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ loading: false, session })
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  if (state.loading) return <FullPageSpinner />
  if (!state.session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
