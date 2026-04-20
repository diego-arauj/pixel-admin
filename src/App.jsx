import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MainLayout } from './components/MainLayout'
import { EnvMissing } from './pages/EnvMissing'
import { HomeRedirect } from './pages/HomeRedirect'
import { Setup } from './pages/Setup'
import { Login } from './pages/Login'
import { ClientesList } from './pages/ClientesList'
import { ClienteForm } from './pages/ClienteForm'
import { Campanhas } from './pages/Campanhas'
import { Redirect } from './pages/Redirect'

function hasRequiredEnv() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  )
}

export default function App() {
  if (!hasRequiredEnv()) {
    return <EnvMissing />
  }

  return (
    <Routes>
      <Route path="/setup" element={<Setup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/r/:accountId/:campaignSlug" element={<Redirect />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/clientes" element={<ClientesList />} />
          <Route path="/clientes/novo" element={<ClienteForm />} />
          <Route path="/clientes/:id/editar" element={<ClienteForm />} />
          <Route path="/clientes/:id/campanhas" element={<Campanhas />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
